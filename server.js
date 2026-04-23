const express = require('express');
const cors = require('cors');
const path = require('path');
const { User, Request } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Base API Route
app.get('/api', (req, res) => {
    res.json({ message: "API is working" });
});

// Authentication & User Management
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password }).select('-password');
        if (user) {
            // Map _id to id for frontend
            const userData = { ...user.toObject(), id: user._id };
            res.json({ success: true, user: userData });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const newUser = await User.create({ email, password, role: 'Admin', name });
        res.json({ success: true, user: { id: newUser._id, email: newUser.email, name: newUser.name, role: newUser.role } });
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ success: false, message: 'Email already exists' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

app.post('/api/forgot-password', async (req, res) => {
    const { email, newPassword } = req.body;
    try {
        const result = await User.updateOne({ email }, { password: newPassword });
        if (result.matchedCount > 0) {
            res.json({ success: true, message: 'Password updated successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Email not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/users/:id/profile', async (req, res) => {
    const { name, email } = req.body;
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { name, email }, { new: true }).select('-password');
        if (user) {
            const userData = { ...user.toObject(), id: user._id };
            res.json({ success: true, user: userData });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/users/:id/password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.password !== currentPassword) {
            return res.status(401).json({ success: false, message: 'Incorrect current password' });
        }
        user.password = newPassword;
        await user.save();
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Unified Requests API ---
app.get('/api/requests', async (req, res) => {
    const status = req.query.status;
    let query = {};
    
    if (status) {
        const statuses = status.split(',');
        query.status = { $in: statuses };
    }
    
    try {
        const requests = await Request.find(query).sort({ updatedAt: -1 });
        const mappedRequests = requests.map(r => ({ ...r.toObject(), id: r._id }));
        res.json({ requests: mappedRequests });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/requests/:id/status', async (req, res) => {
    const { status, reportFile } = req.body;
    const reqId = req.params.id;
    
    let updateData = { status };
    if (reportFile) {
        updateData.reportFile = reportFile;
    }
    
    try {
        const result = await Request.updateOne({ _id: reqId }, updateData);
        res.json({ success: true, changes: result.modifiedCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/requests', async (req, res) => {
    const { name, age, gender, disease, collectionMethod, paymentStatus, paymentAmount } = req.body;
    const axiovitalId = 'AXV-' + Math.floor(1000 + Math.random() * 9000);
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const status = 'Requested';

    try {
        const newRequest = await Request.create({
            axiovitalId, name, age, gender, disease, collectionMethod, paymentStatus, pin, paymentAmount: paymentAmount || 0, status
        });
        res.json({ success: true, id: newRequest._id, axiovitalId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Validation endpoint to check PIN for "Lab Processing" section
app.post('/api/requests/validate', async (req, res) => {
    const { axiovitalId, pin } = req.body;
    try {
        const request = await Request.findOne({ axiovitalId, pin });
        if (request) {
            if (request.status !== 'In Test') {
                return res.json({ success: false, message: 'Request is not in the correct state to be processed.' });
            }
            res.json({ success: true, requestId: request._id });
        } else {
            res.json({ success: false, message: 'Invalid AxioVital ID or PIN.' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Dashboard Analytics ---
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const stats = {
            statuses: { Requested: 0, Approved: 0, Processing: 0, Completed: 0, 'Report Sent': 0 },
            testTypes: {},
            timeline: {}
        };

        const requests = await Request.find({});
        
        requests.forEach(r => {
            if (stats.statuses[r.status] !== undefined) {
                stats.statuses[r.status]++;
            } else {
                stats.statuses[r.status] = 1;
            }

            if (r.disease) {
                stats.testTypes[r.disease] = (stats.testTypes[r.disease] || 0) + 1;
            }
            
            const dateOnly = r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : 'Unknown';
            stats.timeline[dateOnly] = (stats.timeline[dateOnly] || 0) + 1;
        });
        
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve React Frontend (Universal Fallback)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
