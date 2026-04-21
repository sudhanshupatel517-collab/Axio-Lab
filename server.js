const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Authentication
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    try {
        const row = db.prepare("SELECT id, username, role, name FROM users WHERE username = ? AND password = ?").get(username, password);
        if (row) {
            res.json({ success: true, user: row });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Unified Requests API ---
app.get('/api/requests', (req, res) => {
    const status = req.query.status;
    let query = "SELECT * FROM requests";
    let params = [];
    
    if (status) {
        const statuses = status.split(',');
        const placeholders = statuses.map(() => '?').join(',');
        query += ` WHERE status IN (${placeholders})`;
        params = statuses;
    }
    query += " ORDER BY updatedAt DESC";

    try {
        const rows = db.prepare(query).all(...params);
        res.json({ requests: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/requests/:id/status', (req, res) => {
    const { status, reportFile } = req.body;
    const reqId = req.params.id;
    
    let query = "UPDATE requests SET status = ?, updatedAt = CURRENT_TIMESTAMP";
    let params = [status];
    
    if (reportFile) {
        query += ", reportFile = ?";
        params.push(reportFile);
    }
    
    query += " WHERE id = ?";
    params.push(reqId);

    try {
        const info = db.prepare(query).run(...params);
        res.json({ success: true, changes: info.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/requests', (req, res) => {
    const { name, age, gender, disease, collectionMethod, paymentStatus, paymentAmount } = req.body;
    const axiovitalId = 'AXV-' + Math.floor(1000 + Math.random() * 9000);
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const status = 'Requested';

    const query = "INSERT INTO requests (axiovitalId, name, age, gender, disease, collectionMethod, paymentStatus, pin, paymentAmount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    try {
        const info = db.prepare(query).run(axiovitalId, name, age, gender, disease, collectionMethod, paymentStatus, pin, paymentAmount || 0, status);
        res.json({ success: true, id: info.lastInsertRowid, axiovitalId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Validation endpoint to check PIN for "Lab Processing" section
app.post('/api/requests/validate', (req, res) => {
    const { axiovitalId, pin } = req.body;
    try {
        const row = db.prepare("SELECT id, status FROM requests WHERE axiovitalId = ? AND pin = ?").get(axiovitalId, pin);
        if (row) {
            if (row.status !== 'In Test') {
                return res.json({ success: false, message: 'Request is not in the correct state to be processed.' });
            }
            res.json({ success: true, requestId: row.id });
        } else {
            res.json({ success: false, message: 'Invalid AxioVital ID or PIN.' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Dashboard Analytics ---
app.get('/api/dashboard/stats', (req, res) => {
    try {
        const stats = {
            statuses: { Requested: 0, Approved: 0, Processing: 0, Completed: 0, 'Report Sent': 0 },
            testTypes: {},
            timeline: {}
        };

        const rows = db.prepare("SELECT status, disease, createdAt FROM requests").all();
        
        rows.forEach(r => {
            if (stats.statuses[r.status] !== undefined) {
                stats.statuses[r.status]++;
            }
            stats.testTypes[r.disease] = (stats.testTypes[r.disease] || 0) + 1;
            
            const dateOnly = r.createdAt ? r.createdAt.split(' ')[0] : 'Unknown';
            stats.timeline[dateOnly] = (stats.timeline[dateOnly] || 0) + 1;
        });
        
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
