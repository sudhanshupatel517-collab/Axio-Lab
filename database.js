const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database.sqlite');

// Remove existing DB to ensure clean state with new architecture (optional, based on previous logic)
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

// create or open database
const db = new Database(dbPath);

// Initialize Schema
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT,
        name TEXT
    );
    
    CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        axiovitalId TEXT UNIQUE,
        name TEXT,
        age INTEGER,
        gender TEXT,
        disease TEXT,
        collectionMethod TEXT,
        paymentStatus TEXT,
        paymentAmount REAL,
        pin TEXT,
        status TEXT DEFAULT 'Requested',
        reportFile TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// Insert default admin user if not exists
try {
    db.prepare("INSERT INTO users (username, password, role, name) VALUES ('admin', 'admin123', 'Admin', 'Default Admin')").run();
} catch (e) {
    // Ignore if exists
}

// Seed dummy requests from User App
const dummyRequests = [
    { id: 'AXV-9012', name: 'John Doe', age: 45, gender: 'Male', disease: 'Complete Blood Count (CBC)', method: 'Walk-in', payment: 'Paid', status: 'Requested' },
    { id: 'AXV-7734', name: 'Maria Garcia', age: 32, gender: 'Female', disease: 'Lipid Profile', method: 'Home Collection', payment: 'Pending', status: 'Requested' },
    { id: 'AXV-6591', name: 'Robert Smith', age: 58, gender: 'Male', disease: 'HbA1c Diabetes', method: 'Walk-in', payment: 'Paid', status: 'Requested' },
    { id: 'AXV-8833', name: 'Patricia Brown', age: 41, gender: 'Female', disease: 'Thyroid Profile', method: 'Walk-in', payment: 'Paid', status: 'Approved' },
    { id: 'AXV-5511', name: 'David Taylor', age: 48, gender: 'Male', disease: 'Uric Acid Test', method: 'Walk-in', payment: 'Paid', status: 'Processing' },
    { id: 'AXV-3344', name: 'Charles Harris', age: 59, gender: 'Male', disease: 'Thyroid Profile', method: 'Walk-in', payment: 'Paid', status: 'Completed' }
];

const insertReq = db.prepare("INSERT INTO requests (axiovitalId, name, age, gender, disease, collectionMethod, paymentStatus, pin, paymentAmount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

db.transaction(() => {
    dummyRequests.forEach(r => {
        try {
            const pin = Math.floor(1000 + Math.random() * 9000).toString();
            const amt = r.payment === 'Paid' ? 45 : 0;
            insertReq.run(r.id, r.name, r.age, r.gender, r.disease, r.method, r.payment, pin, amt, r.status);
        } catch (e) {}
    });
})();

// export it
module.exports = db;
