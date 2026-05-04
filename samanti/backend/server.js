const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const db = require('./database');
const multer = require('multer');
const fs = require('fs');
const nodemailer = require('nodemailer');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the frontend static files
app.use(express.static(path.join(__dirname, '../')));

app.use(session({
    secret: 'samanti-secret-key-123!',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Ensure images directory exists
const imagesDir = path.join(__dirname, '../images/');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagesDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'upload-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// --- AUTH ROUTES ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM admin WHERE username = ?", [username], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.userId = user.id;
            res.json({ message: 'Logged in successfully' });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out' });
});

app.get('/api/check-auth', (req, res) => {
    if (req.session.userId) {
        res.json({ authenticated: true });
    } else {
        res.json({ authenticated: false });
    }
});

// --- CARS ROUTES ---
app.get('/api/cars', (req, res) => {
    db.all("SELECT * FROM cars", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const cars = rows.map(car => ({ ...car, features: JSON.parse(car.features || '[]') }));
        res.json(cars);
    });
});

app.post('/api/cars', requireAuth, upload.single('imageFile'), (req, res) => {
    const { name, price, features, imageUrl } = req.body;
    const image = req.file ? 'images/' + req.file.filename : imageUrl;

    db.run("INSERT INTO cars (name, price, features, image) VALUES (?, ?, ?, ?)",
        [name, price, features, image],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Car added successfully' });
        }
    );
});

app.delete('/api/cars/:id', requireAuth, (req, res) => {
    db.run("DELETE FROM cars WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Car deleted' });
    });
});

app.post('/api/contact', async (req, res) => {
    const { name, email, phone, reason, message } = req.body;

    try {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'yuvi.khirid@gmail.com',
                pass: 'gpvy ccnx nwwf borw'
            }
        });

        const adminMailOptions = {
            from: '"Royal Ride Contact" <yuvi.khirid@gmail.com>',
            to: 'yuvi.khirid@gmail.com',
            subject: `New Contact Message: ${reason} from ${name}`,
            html: `<h2>New Contact Us Submission</h2>
                   <p><strong>Customer Name:</strong> ${name}</p>
                   <p><strong>Phone:</strong> ${phone}</p>
                   <p><strong>Email:</strong> ${email}</p>
                   <p><strong>Reason:</strong> ${reason}</p>
                   <hr>
                   <h3>Message:</h3>
                   <p>${message || 'No additional message provided.'}</p>`
        };

        await transporter.sendMail(adminMailOptions);
        console.log("Contact email sent successfully via Gmail!");
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (err) {
        console.error("Contact Email failed:", err);
        res.status(500).json({ success: false, error: 'Failed to send message' });
    }
});

// --- ADMIN API ENDPOINTS ---
app.get('/api/packages', (req, res) => {
    db.all("SELECT * FROM packages", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/packages', requireAuth, upload.single('imageFile'), (req, res) => {
    const { name, type, duration, budget, price, daysText, imageUrl } = req.body;
    const image = req.file ? 'images/' + req.file.filename : imageUrl;

    db.run("INSERT INTO packages (name, type, duration, budget, price, image, daysText) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [name, type, duration, budget, price, image, daysText],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Package added successfully' });
        }
    );
});

app.delete('/api/packages/:id', requireAuth, (req, res) => {
    db.run("DELETE FROM packages WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Package deleted' });
    });
});

// --- CARDS (TESTIMONIALS) ROUTES ---
app.get('/api/cards', (req, res) => {
    db.all("SELECT * FROM cards", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/cards', requireAuth, (req, res) => {
    const { author, rating, text } = req.body;
    db.run("INSERT INTO cards (author, rating, text) VALUES (?, ?, ?)",
        [author, rating, text],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Card added successfully' });
        }
    );
});

app.delete('/api/cards/:id', requireAuth, (req, res) => {
    db.run("DELETE FROM cards WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Card deleted' });
    });
});

// --- ENQUIRY ROUTES ---
app.post('/api/enquiry', (req, res) => {
    const { name, phone, email, tripDetails } = req.body;

    const detailsString = JSON.stringify(tripDetails);

    db.run("INSERT INTO enquiries (name, phone, email, tripDetails) VALUES (?, ?, ?, ?)",
        [name, phone, email, detailsString],
        async function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Send Emails via Nodemailer
            try {
                // Gmail SMTP Configuration
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'yuvi.khirid@gmail.com',
                        pass: 'gpvy ccnx nwwf borw'
                    }
                });

                let tripInfoHtml = '<ul>';
                if (tripDetails && Array.isArray(tripDetails)) {
                    tripDetails.forEach(item => {
                        tripInfoHtml += `<li><strong>${item.label}:</strong> ${item.value}</li>`;
                    });
                }
                tripInfoHtml += '</ul>';

                const adminMailOptions = {
                    from: '"Royal Ride Booking" <yuvi.khirid@gmail.com>',
                    to: 'yuvi.khirid@gmail.com',
                    subject: `New Booking Enquiry from ${name}`,
                    html: `<h2>New Enquiry Received</h2>
                           <p><strong>Customer Name:</strong> ${name}</p>
                           <p><strong>Phone:</strong> ${phone}</p>
                           <p><strong>Email:</strong> ${email || 'N/A'}</p>
                           <h3>Trip Details:</h3>
                           ${tripInfoHtml}`
                };

                // Send to Admin
                let adminInfo = await transporter.sendMail(adminMailOptions);
                console.log("Admin email sent successfully via Gmail!");

                // SMS to Customer via Fast2SMS
                // IMPORTANT: Replace the string below with your real Fast2SMS API Key!
                const FAST2SMS_API_KEY = 'DBFd0nvHutCVawWlE6XGRkxyrPpUbQjgK2LAzT7Zo1YhN9mSs8B6Ompd1orz7jc0hq9fQ2JsRtZLMYC8';

                if (FAST2SMS_API_KEY !== '') {
                    const smsMessage = `Dear ${name}, your enquiry with Royal Ride Travels has been received. We will call you shortly.`;

                    const postData = JSON.stringify({
                        route: "q",
                        message: smsMessage,
                        language: "english",
                        flash: 0,
                        numbers: phone,
                    });

                    // Use standard https module so it works on all Node versions
                    const https = require('https');
                    const reqSMS = https.request({
                        hostname: 'www.fast2sms.com',
                        port: 443,
                        path: '/dev/bulkV2',
                        method: 'POST',
                        headers: {
                            'authorization': FAST2SMS_API_KEY,
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(postData)
                        }
                    }, (resSMS) => {
                        resSMS.on('data', (d) => {
                            console.log("Fast2SMS Response:", d.toString());
                        });
                    });

                    reqSMS.on('error', (error) => {
                        console.error("SMS sending failed:", error);
                    });

                    reqSMS.write(postData);
                    reqSMS.end();
                } else {
                    console.log(`[SMS SYSTEM] API Key missing! Go to fast2sms.com, get your API Key, and paste it into server.js on line 215.`);
                    console.log(`Would have sent to ${phone}: "Dear ${name}, your enquiry with Royal Ride Travels has been received. We will call you shortly."`);
                }

                res.json({ id: this.lastID, message: 'Enquiry received successfully' });
            } catch (emailErr) {
                console.error("Email sending failed:", emailErr);
                res.json({ id: this.lastID, message: 'Enquiry received but email failed' });
            }
        }
    );
});

app.get('/api/enquiries', requireAuth, (req, res) => {
    db.all("SELECT * FROM enquiries ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.delete('/api/enquiries/:id', requireAuth, (req, res) => {
    db.run("DELETE FROM enquiries WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Enquiry deleted' });
    });
});

// --- LOCAL PACKAGES ROUTES ---
app.get('/api/local_packages', (req, res) => {
    db.all("SELECT * FROM local_packages", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/local_packages', requireAuth, (req, res) => {
    const { title, description, price, image } = req.body;
    db.run("INSERT INTO local_packages (title, description, price, image) VALUES (?, ?, ?, ?)",
        [title, description, price, image],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        });
});

app.delete('/api/local_packages/:id', requireAuth, (req, res) => {
    db.run("DELETE FROM local_packages WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Local package deleted' });
    });
});

// ==========================================
// BOOKINGS & RAZORPAY PAYMENT INTEGRATION
// ==========================================

// Razorpay Instance (using placeholder test keys)
const razorpay = new Razorpay({
    key_id: 'rzp_test_placeholder_key',
    key_secret: 'placeholder_secret'
});

// 1. Create Razorpay Order
app.post('/api/create-order', async (req, res) => {
    try {
        const { amount } = req.body; // Amount in INR
        
        const options = {
            amount: amount * 100, // Razorpay works in paise (amount * 100)
            currency: 'INR',
            receipt: 'receipt_order_' + Date.now()
        };

        const order = await razorpay.orders.create(options);
        res.json({ success: true, order });
    } catch (err) {
        console.error('Razorpay Order Error:', err);
        res.status(500).json({ success: false, error: 'Failed to create order' });
    }
});

// 2. Verify Payment Signature
app.post('/api/verify-payment', (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Create signature using the secret
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
        .createHmac("sha256", "placeholder_secret")
        .update(sign.toString())
        .digest("hex");

    if (razorpay_signature === expectedSign) {
        res.json({ success: true, message: "Payment verified successfully" });
    } else {
        res.status(400).json({ success: false, message: "Invalid signature" });
    }
});

// 3. Save Booking
app.post('/api/bookings', (req, res) => {
    const {
        booking_type, item_id, car_type, customer_name, customer_email, customer_phone,
        pickup_location, drop_location, booking_date, booking_time, passengers,
        payment_method, payment_status, amount_paid, razorpay_order_id, razorpay_payment_id
    } = req.body;

    const query = `INSERT INTO bookings (
        booking_type, item_id, car_type, customer_name, customer_email, customer_phone,
        pickup_location, drop_location, booking_date, booking_time, passengers,
        payment_method, payment_status, amount_paid, razorpay_order_id, razorpay_payment_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [
        booking_type, item_id, car_type, customer_name, customer_email, customer_phone,
        pickup_location, drop_location, booking_date, booking_time, passengers,
        payment_method, payment_status, amount_paid, razorpay_order_id, razorpay_payment_id
    ], function(err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        
        // Optionally send email notification here
        
        res.json({ success: true, message: 'Booking saved successfully', id: this.lastID });
    });
});

// 4. Get All Bookings (Admin)
app.get('/api/bookings', requireAuth, (req, res) => {
    db.all("SELECT * FROM bookings ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
