const express = require('express');
const router = express.Router();
const { createReport, getPatientReports, updateReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

// POST /reports (Lab only)
router.post('/', protect, authorize('lab'), createReport);

// GET /reports/:patientId (Hospital, Patient, Lab)
router.get('/:patientId', protect, authorize('hospital', 'patient', 'lab'), getPatientReports);

// PUT /reports/:id (Hospital only)
router.put('/:id', protect, authorize('hospital'), updateReport);

module.exports = router;
