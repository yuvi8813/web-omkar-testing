const API_BASE = 'http://localhost:3000/api';
const RZP_KEY_ID = 'rzp_test_placeholder_key'; // Replace with real key later

let selectedItem = null;
let allCars = [];
let bookingType = '';

async function initBookingPage(type) {
    bookingType = type;
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        alert('Invalid booking link');
        window.location.href = 'index.html';
        return;
    }

    // Load Item Details
    await loadItemDetails(type, id);

    // If local package, load car options
    if (type === 'local') {
        await loadCarOptions();
    }

    // Handle Form Submit
    document.getElementById('booking-form').addEventListener('submit', handleBookingSubmit);
}

async function loadItemDetails(type, id) {
    let endpoint = '';
    if (type === 'fleet') endpoint = `/cars/${id}`;
    else if (type === 'package') endpoint = `/packages/${id}`;
    else if (type === 'local') endpoint = `/local_packages`; // Need to find specific one in list

    try {
        const res = await fetch(API_BASE + endpoint);
        const data = await res.json();

        if (type === 'local') {
            selectedItem = data.find(p => p.id == id);
        } else {
            selectedItem = data;
        }

        if (!selectedItem) throw new Error('Item not found');

        renderSummary();
    } catch (err) {
        console.error('Error loading details:', err);
        document.getElementById('item-details').innerHTML = '<p class="text-danger">Failed to load item details.</p>';
    }
}

function renderSummary() {
    const container = document.getElementById('item-details');
    const title = selectedItem.title || selectedItem.name || selectedItem.destination;
    const price = selectedItem.price || selectedItem.start_price;
    const image = selectedItem.image || selectedItem.car_image || selectedItem.image_url;

    container.innerHTML = `
        <img src="${image}" alt="${title}">
        <h4>${title}</h4>
        <p class="summary-price">${price}</p>
        <p style="margin-top: 10px; color: #666; font-size: 0.9rem;">
            ${selectedItem.description || selectedItem.category || ''}
        </p>
    `;
}

async function loadCarOptions() {
    const res = await fetch(API_BASE + '/cars');
    allCars = await res.json();
    const select = document.getElementById('car-select');
    allCars.forEach(car => {
        const opt = document.createElement('option');
        opt.value = car.id;
        opt.textContent = `${car.name} (${car.price})`;
        select.appendChild(opt);
    });

    select.addEventListener('change', (e) => {
        const carId = e.target.value;
        const car = allCars.find(c => c.id == carId);
        if (car) {
            // Update the displayed price in the summary
            const priceEl = document.querySelector('.summary-price');
            if (priceEl) priceEl.textContent = car.price;
            
            // Update our internal selectedItem price for payment calculation
            selectedItem.display_price = car.price;
        }
    });
}

async function handleBookingSubmit(e) {
    e.preventDefault();
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    const carSelect = document.getElementById('car-select');
    const carName = carSelect ? carSelect.options[carSelect.selectedIndex].text : '';

    const bookingData = {
        booking_type: bookingType,
        item_id: selectedItem.id,
        car_type: carName,
        customer_name: document.getElementById('cust-name').value,
        customer_email: document.getElementById('cust-email').value,
        customer_phone: document.getElementById('cust-phone').value,
        pickup_location: document.getElementById('pickup-loc').value,
        drop_location: document.getElementById('drop-loc')?.value || '',
        booking_date: document.getElementById('pickup-date').value,
        booking_time: document.getElementById('pickup-time')?.value || '',
        passengers: document.getElementById('passengers')?.value || 1,
        payment_method: paymentMethod,
        payment_status: 'Pending',
        amount_paid: '0'
    };

    if (paymentMethod === 'driver') {
        saveBooking(bookingData);
    } else {
        // Online Payment
        let amount = 500; // Default deposit
        if (paymentMethod === 'full') {
            // Use display_price if car was selected, otherwise default price
            const priceStr = selectedItem.display_price || selectedItem.price || selectedItem.start_price || '500';
            const num = parseInt(priceStr.replace(/[^0-9]/g, ''));
            amount = isNaN(num) ? 500 : num;
        }
        
        processRazorpayPayment(amount, bookingData);
    }
}

async function processRazorpayPayment(amount, bookingData) {
    try {
        // 1. Create order on backend
        const res = await fetch(API_BASE + '/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
        const { order } = await res.json();

        // 2. Open Razorpay Checkout
        const options = {
            key: RZP_KEY_ID,
            amount: order.amount,
            currency: "INR",
            name: "Royal Ride Travels",
            description: "Booking Payment",
            order_id: order.id,
            handler: async function (response) {
                // 3. Verify on backend
                const verifyRes = await fetch(API_BASE + '/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    })
                });
                const verifyData = await verifyRes.json();

                if (verifyData.success) {
                    bookingData.payment_status = 'Success';
                    bookingData.amount_paid = amount.toString();
                    bookingData.razorpay_order_id = response.razorpay_order_id;
                    bookingData.razorpay_payment_id = response.razorpay_payment_id;
                    saveBooking(bookingData);
                } else {
                    alert('Payment verification failed. Please contact support.');
                }
            },
            prefill: {
                name: bookingData.customer_name,
                email: bookingData.customer_email,
                contact: bookingData.customer_phone
            },
            theme: { color: "#D4AF37" }
        };

        const rzp = new Razorpay(options);
        rzp.open();

    } catch (err) {
        console.error('Razorpay Error:', err);
        alert('Failed to initialize payment gateway.');
    }
}

async function saveBooking(data) {
    try {
        const res = await fetch(API_BASE + '/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if (result.success) {
            alert('Booking Successful! We will contact you shortly.');
            window.location.href = 'index.html';
        } else {
            alert('Booking failed: ' + result.error);
        }
    } catch (err) {
        console.error('Save Error:', err);
        alert('An error occurred while saving your booking.');
    }
}
