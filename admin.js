const API_BASE = 'http://localhost:3000/api';

// --- AUTHENTICATION ---
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (res.ok) {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('admin-dashboard').style.display = 'flex';
            loadAllData();
        } else {
            document.getElementById('login-error').style.display = 'block';
        }
    } catch (err) {
        console.error(err);
    }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch(`${API_BASE}/logout`, { method: 'POST' });
    window.location.reload();
});

// Check Auth on load
async function checkAuth() {
    try {
        const res = await fetch(`${API_BASE}/check-auth`);
        const data = await res.json();
        if (data.authenticated) {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('admin-dashboard').style.display = 'flex';
            loadAllData();
        }
    } catch (err) {
        console.error(err);
    }
}
checkAuth();

// --- NAVIGATION ---
const navBtns = document.querySelectorAll('.nav-btn');
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(btn.dataset.target).classList.add('active');
    });
});

// --- LOAD DATA ---
function loadAllData() {
    loadCars();
    loadPackages();
    loadLocalPackages();
    loadCards();
    loadEnquiries();
    loadBookings();
}

async function loadCars() {
    const res = await fetch(`${API_BASE}/cars`);
    const cars = await res.json();
    const tbody = document.getElementById('cars-table-body');
    tbody.innerHTML = '';
    cars.forEach(car => {
        tbody.innerHTML += `
            <tr>
                <td><img src="${car.image}" alt="car"></td>
                <td>${car.name}</td>
                <td>${car.price}</td>
                <td><button class="btn btn-danger btn-small" onclick="deleteCar(${car.id})">Delete</button></td>
            </tr>
        `;
    });
}

async function loadPackages() {
    const res = await fetch(`${API_BASE}/packages`);
    const pkgs = await res.json();
    const tbody = document.getElementById('packages-table-body');
    tbody.innerHTML = '';
    pkgs.forEach(pkg => {
        tbody.innerHTML += `
            <tr>
                <td><img src="${pkg.image}" alt="pkg"></td>
                <td>${pkg.name}</td>
                <td>${pkg.price}</td>
                <td><button class="btn btn-danger btn-small" onclick="deletePackage(${pkg.id})">Delete</button></td>
            </tr>
        `;
    });
}

async function loadCards() {
    const res = await fetch(`${API_BASE}/cards`);
    const cards = await res.json();
    const tbody = document.getElementById('cards-table-body');
    tbody.innerHTML = '';
    cards.forEach(card => {
        tbody.innerHTML += `
            <tr>
                <td>${card.author}</td>
                <td>${card.rating} Stars</td>
                <td>${card.text.substring(0, 50)}...</td>
                <td><button class="btn btn-danger btn-small" onclick="deleteCard(${card.id})">Delete</button></td>
            </tr>
        `;
    });
}

async function loadLocalPackages() {
    const res = await fetch(`${API_BASE}/local_packages`);
    const lps = await res.json();
    const tbody = document.getElementById('local-packages-table-body');
    tbody.innerHTML = '';
    lps.forEach(lp => {
        tbody.innerHTML += `
            <tr>
                <td><img src="${lp.image}" height="50" style="border-radius:4px;"></td>
                <td>${lp.title}</td>
                <td>${lp.price}</td>
                <td><button class="btn btn-danger btn-small" onclick="deleteLocalPackage(${lp.id})">Delete</button></td>
            </tr>
        `;
    });
}

async function loadBookings() {
    const res = await fetch(`${API_BASE}/bookings`);
    const bookings = await res.json();
    const tbody = document.getElementById('bookings-table-body');
    tbody.innerHTML = '';
    bookings.forEach(b => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${b.booking_type.toUpperCase()}</strong><br><small>ID: ${b.item_id}</small></td>
                <td>${b.customer_name}<br><small>${b.customer_email}</small></td>
                <td>${b.customer_phone}</td>
                <td>${b.booking_date} ${b.booking_time || ''}</td>
                <td>${b.payment_method}<br><small>₹${b.amount_paid}</small></td>
                <td><span class="status-badge ${b.payment_status.toLowerCase()}">${b.payment_status}</span></td>
            </tr>
        `;
    });
}

async function loadEnquiries() {
    const res = await fetch(`${API_BASE}/enquiries`);
    const enquiries = await res.json();
    const tbody = document.getElementById('enquiries-table-body');
    tbody.innerHTML = '';
    enquiries.forEach(enq => {
        const date = new Date(enq.createdAt).toLocaleString();
        let tripDetailsHtml = '<ul>';
        try {
            const details = JSON.parse(enq.tripDetails);
            if (Array.isArray(details)) {
                details.forEach(item => {
                    tripDetailsHtml += `<li><strong>${item.label}:</strong> ${item.value}</li>`;
                });
            }
        } catch (e) {
            tripDetailsHtml += `<li>${enq.tripDetails}</li>`;
        }
        tripDetailsHtml += '</ul>';

        tbody.innerHTML += `
            <tr>
                <td>${date}</td>
                <td>
                    <strong>${enq.name}</strong><br>
                    <i class="fa-solid fa-phone"></i> ${enq.phone}<br>
                    ${enq.email ? `<i class="fa-solid fa-envelope"></i> ${enq.email}` : ''}
                </td>
                <td>${tripDetailsHtml}</td>
                <td><button class="btn btn-danger btn-small" onclick="deleteEnquiry(${enq.id})">Delete</button></td>
            </tr>
        `;
    });
}

// --- ADD DATA ---
document.getElementById('car-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('car-name').value);
    formData.append('price', document.getElementById('car-price').value);
    
    // Convert features comma separated string to JSON array
    const featuresStr = document.getElementById('car-features').value;
    const featuresArr = featuresStr.split(',').map(f => f.trim());
    formData.append('features', JSON.stringify(featuresArr));
    
    formData.append('imageFile', document.getElementById('car-image').files[0]);

    await fetch(`${API_BASE}/cars`, { method: 'POST', body: formData });
    document.getElementById('car-form').reset();
    loadCars();
});

document.getElementById('package-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('pkg-name').value);
    formData.append('type', document.getElementById('pkg-type').value);
    formData.append('duration', document.getElementById('pkg-duration').value);
    formData.append('budget', document.getElementById('pkg-budget').value);
    formData.append('price', document.getElementById('pkg-price').value);
    formData.append('daysText', document.getElementById('pkg-days').value);
    formData.append('imageFile', document.getElementById('pkg-image').files[0]);

    await fetch(`${API_BASE}/packages`, { method: 'POST', body: formData });
    document.getElementById('package-form').reset();
    loadPackages();
});

document.getElementById('local-package-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('lp-image');
    if (!fileInput.files[0]) return alert('Please select an image');

    const reader = new FileReader();
    reader.onload = async function(e) {
        const payload = {
            title: document.getElementById('lp-title').value,
            description: document.getElementById('lp-desc').value,
            price: document.getElementById('lp-price').value,
            image: e.target.result
        };
        await fetch(`${API_BASE}/local_packages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        document.getElementById('local-package-form').reset();
        loadLocalPackages();
    };
    reader.readAsDataURL(fileInput.files[0]);
});

document.getElementById('card-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        author: document.getElementById('card-author').value,
        rating: document.getElementById('card-rating').value,
        text: document.getElementById('card-text').value
    };

    await fetch(`${API_BASE}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    document.getElementById('card-form').reset();
    loadCards();
});

// --- DELETE DATA ---
async function deleteCar(id) {
    if(confirm('Delete this car?')) {
        await fetch(`${API_BASE}/cars/${id}`, { method: 'DELETE' });
        loadCars();
    }
}

async function deletePackage(id) {
    if(confirm('Delete this package?')) {
        await fetch(`${API_BASE}/packages/${id}`, { method: 'DELETE' });
        loadPackages();
    }
}

async function deleteCard(id) {
    if(confirm('Delete this testimonial?')) {
        await fetch(`${API_BASE}/cards/${id}`, { method: 'DELETE' });
        loadCards();
    }
}

async function deleteEnquiry(id) {
    if(confirm('Delete this enquiry?')) {
        await fetch(`${API_BASE}/enquiries/${id}`, { method: 'DELETE' });
        loadEnquiries();
    }
}

async function deleteLocalPackage(id) {
    if(confirm('Delete this local package?')) {
        await fetch(`${API_BASE}/local_packages/${id}`, { method: 'DELETE' });
        loadLocalPackages();
    }
}
