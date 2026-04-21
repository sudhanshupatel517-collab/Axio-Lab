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
    db.get("SELECT id, username, role, name FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            res.json({ success: true, user: row });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });
});

// --- Unified Requests API ---
app.get('/api/requests', (req, res) => {
    // Optional status filter
    const status = req.query.status;
    let query = "SELECT * FROM requests";
    let params = [];
    
    if (status) {
        // e.g. status='Requested' or status='Requested,Approved'
        const statuses = status.split(',');
        const placeholders = statuses.map(() => '?').join(',');
        query += ` WHERE status IN (${placeholders})`;
        params = statuses;
    }
    query += " ORDER BY updatedAt DESC";

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ requests: rows });
    });
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

    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, changes: this.changes });
    });
});

app.post('/api/requests', (req, res) => {
    const { name, age, gender, disease, collectionMethod, paymentStatus, paymentAmount } = req.body;
    const axiovitalId = 'AXV-' + Math.floor(1000 + Math.random() * 9000);
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const status = 'Requested';

    const query = "INSERT INTO requests (axiovitalId, name, age, gender, disease, collectionMethod, paymentStatus, pin, paymentAmount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    db.run(query, [axiovitalId, name, age, gender, disease, collectionMethod, paymentStatus, pin, paymentAmount || 0, status], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID, axiovitalId });
    });
});

// Validation endpoint to check PIN for "Lab Processing" section
app.post('/api/requests/validate', (req, res) => {
    const { axiovitalId, pin } = req.body;
    db.get("SELECT id, status FROM requests WHERE axiovitalId = ? AND pin = ?", [axiovitalId, pin], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (row) {
            if (row.status !== 'In Test') {
                return res.json({ success: false, message: 'Request is not in the correct state to be processed.' });
            }
            res.json({ success: true, requestId: row.id });
        } else {
            res.json({ success: false, message: 'Invalid AxioVital ID or PIN.' });
        }
    });
});

// --- Dashboard Analytics ---
app.get('/api/dashboard/stats', (req, res) => {
    db.serialize(() => {
        const stats = {
            statuses: { Requested: 0, Approved: 0, Processing: 0, Completed: 0, 'Report Sent': 0 },
            testTypes: {},
            timeline: {}
        };

        db.all("SELECT status, disease, createdAt FROM requests", [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            rows.forEach(r => {
                // Status counts
                if (stats.statuses[r.status] !== undefined) {
                    stats.statuses[r.status]++;
                }
                
                // Test Types distribution
                stats.testTypes[r.disease] = (stats.testTypes[r.disease] || 0) + 1;
                
                // Timeline (mock using simple formatting for YYYY-MM-DD)
                // SQLite CURRENT_TIMESTAMP is 'YYYY-MM-DD HH:MM:SS'
                const dateOnly = r.createdAt ? r.createdAt.split(' ')[0] : 'Unknown';
                stats.timeline[dateOnly] = (stats.timeline[dateOnly] || 0) + 1;
            });
            
            res.json(stats);
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`LMS Server running on http://localhost:${PORT}`);
});
