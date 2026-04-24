const express = require('express');
const router = express.Router();
const { createAppointment, getUserAppointments } = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

// POST /appointments
router.post('/', protect, createAppointment);

// GET /appointments/:userId
router.get('/:userId', protect, getUserAppointments);

module.exports = router;
