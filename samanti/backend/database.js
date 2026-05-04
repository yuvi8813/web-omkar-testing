const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Admin table
        db.run(`CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`);

        // Insert default admin if not exists (username: admin, password: password123)
        db.get("SELECT * FROM admin WHERE username = 'admin'", async (err, row) => {
            if (!row) {
                const hashedPassword = await bcrypt.hash('password123', 10);
                db.run("INSERT INTO admin (username, password) VALUES (?, ?)", ['admin', hashedPassword]);
                console.log('Default admin created (admin / password123)');
            }
        });

        // Cars table
        db.run(`CREATE TABLE IF NOT EXISTS cars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            price TEXT,
            features TEXT,
            image TEXT
        )`);

        // Packages table
        db.run(`CREATE TABLE IF NOT EXISTS packages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            type TEXT,
            duration TEXT,
            budget TEXT,
            price TEXT,
            image TEXT,
            daysText TEXT
        )`);

        // Cards (Testimonials) table
        db.run(`CREATE TABLE IF NOT EXISTS cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT,
            rating INTEGER,
            text TEXT
        )`);

        // Enquiries table
        db.run(`CREATE TABLE IF NOT EXISTS enquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            phone TEXT,
            email TEXT,
            tripDetails TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Local Packages table
        db.run(`CREATE TABLE IF NOT EXISTS local_packages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            price TEXT,
            image TEXT
        )`);

        // Create bookings table
        db.run(`CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_type TEXT,
            item_id INTEGER,
            car_type TEXT,
            customer_name TEXT,
            customer_email TEXT,
            customer_phone TEXT,
            pickup_location TEXT,
            drop_location TEXT,
            booking_date TEXT,
            booking_time TEXT,
            passengers INTEGER,
            payment_method TEXT,
            payment_status TEXT,
            amount_paid TEXT,
            razorpay_order_id TEXT,
            razorpay_payment_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    });
}

module.exports = db;
