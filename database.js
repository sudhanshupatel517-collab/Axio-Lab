const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'labo.db');
// Remove existing DB to ensure clean state with new architecture
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Database connected!');
        db.serialize(() => {
            // Create Users Table for Authentication
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT,
                role TEXT,
                name TEXT
            )`);

            // Unified Requests Table mapping the entire workflow state
            db.run(`CREATE TABLE IF NOT EXISTS requests (
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
            )`);

            // Insert default admin user if not exists
            db.run("INSERT INTO users (username, password, role, name) VALUES ('admin', 'admin123', 'Admin', 'Default Admin')");

            // Seed dummy requests from User App
            const dummyRequests = [
                // Requested (For Patient Requests Section)
                { id: 'AXV-9012', name: 'John Doe', age: 45, gender: 'Male', disease: 'Complete Blood Count (CBC)', method: 'Walk-in', payment: 'Paid', status: 'Requested' },
                { id: 'AXV-7734', name: 'Maria Garcia', age: 32, gender: 'Female', disease: 'Lipid Profile', method: 'Home Collection', payment: 'Pending', status: 'Requested' },
                { id: 'AXV-6591', name: 'Robert Smith', age: 58, gender: 'Male', disease: 'HbA1c Diabetes', method: 'Walk-in', payment: 'Paid', status: 'Requested' },
                { id: 'AXV-2287', name: 'Linda Johnson', age: 29, gender: 'Female', disease: 'Urinalysis', method: 'Walk-in', payment: 'Paid', status: 'Requested' },
                { id: 'AXV-4112', name: 'James Williams', age: 62, gender: 'Male', disease: 'Liver Function Test (LFT)', method: 'Home Collection', payment: 'Pending', status: 'Requested' },

                // Approved (For Test Section)
                { id: 'AXV-8833', name: 'Patricia Brown', age: 41, gender: 'Female', disease: 'Thyroid Profile', method: 'Walk-in', payment: 'Paid', status: 'Approved' },
                { id: 'AXV-2199', name: 'Michael Davis', age: 55, gender: 'Male', disease: 'Complete Blood Count (CBC)', method: 'Home Collection', payment: 'Paid', status: 'Approved' },
                { id: 'AXV-3482', name: 'Jennifer Miller', age: 37, gender: 'Female', disease: 'Vitamin B12', method: 'Walk-in', payment: 'Pending', status: 'Approved' },
                { id: 'AXV-9921', name: 'William Wilson', age: 70, gender: 'Male', disease: 'Kidney Profile', method: 'Home Collection', payment: 'Paid', status: 'Approved' },
                { id: 'AXV-7401', name: 'Elizabeth Moore', age: 24, gender: 'Female', disease: 'Iron Studies', method: 'Walk-in', payment: 'Paid', status: 'Approved' },

                // Processing (For Lab Processing Section)
                { id: 'AXV-5511', name: 'David Taylor', age: 48, gender: 'Male', disease: 'Uric Acid Test', method: 'Walk-in', payment: 'Paid', status: 'Processing' },
                { id: 'AXV-8321', name: 'Sarah Anderson', age: 31, gender: 'Female', disease: 'Lipid Profile', method: 'Home Collection', payment: 'Pending', status: 'Processing' },
                { id: 'AXV-6677', name: 'Richard Thomas', age: 52, gender: 'Male', disease: 'Liver Function Test (LFT)', method: 'Walk-in', payment: 'Paid', status: 'Processing' },
                { id: 'AXV-1199', name: 'Jessica Jackson', age: 28, gender: 'Female', disease: 'HbA1c Diabetes', method: 'Walk-in', payment: 'Paid', status: 'Processing' },
                { id: 'AXV-4554', name: 'Joseph White', age: 65, gender: 'Male', disease: 'Complete Blood Count (CBC)', method: 'Home Collection', payment: 'Paid', status: 'Processing' },

                // Completed (For Reports Section)
                { id: 'AXV-3344', name: 'Charles Harris', age: 59, gender: 'Male', disease: 'Thyroid Profile', method: 'Walk-in', payment: 'Paid', status: 'Completed' },
                { id: 'AXV-6789', name: 'Susan Martin', age: 44, gender: 'Female', disease: 'Vitamin D', method: 'Home Collection', payment: 'Paid', status: 'Completed' },
                { id: 'AXV-1122', name: 'Thomas Thompson', age: 39, gender: 'Male', disease: 'Urinalysis', method: 'Walk-in', payment: 'Paid', status: 'Completed' },
                { id: 'AXV-9988', name: 'Karen Garcia', age: 50, gender: 'Female', disease: 'Iron Studies', method: 'Walk-in', payment: 'Pending', status: 'Completed' },
                { id: 'AXV-5566', name: 'Christopher Martinez', age: 34, gender: 'Male', disease: 'Kidney Profile', method: 'Home Collection', payment: 'Paid', status: 'Completed' }
            ];

            const stmt = db.prepare("INSERT INTO requests (axiovitalId, name, age, gender, disease, collectionMethod, paymentStatus, pin, paymentAmount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            dummyRequests.forEach(r => {
                // random 4 digit PIN, but not validated strictly anymore
                const pin = Math.floor(1000 + Math.random() * 9000).toString();
                const amt = r.payment === 'Paid' ? 45 : 0;
                stmt.run(r.id, r.name, r.age, r.gender, r.disease, r.method, r.payment, pin, amt, r.status);
            });
            stmt.finalize();
        });
    }
});

module.exports = db;
