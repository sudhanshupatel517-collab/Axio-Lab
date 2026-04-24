const Appointment = require('../models/Appointment');

// @desc    Create appointment
// @route   POST /appointments
// @access  Private
const createAppointment = async (req, res) => {
    try {
        const { patientId, labId, hospitalId, date, status } = req.body;

        if (!patientId || !date) {
            return res.status(400).json({ message: 'Please provide patientId and date' });
        }

        const appointment = await Appointment.create({
            patientId,
            labId,
            hospitalId,
            date,
            status: status || 'scheduled'
        });

        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get appointments for a user (patient, lab, or hospital)
// @route   GET /appointments/:userId
// @access  Private
const getUserAppointments = async (req, res) => {
    try {
        const { userId } = req.params;
        let query = {};

        // Based on role, determine how to query
        if (req.user.role === 'patient') {
            if (req.user.id !== userId) {
                 return res.status(403).json({ message: 'Not authorized to view other appointments' });
            }
            query = { patientId: userId };
        } else if (req.user.role === 'lab') {
            query = { labId: userId };
        } else if (req.user.role === 'hospital') {
            query = { hospitalId: userId };
        } else {
             // Fallback query if no matching role
             query = { $or: [{ patientId: userId }, { labId: userId }, { hospitalId: userId }] };
        }

        const appointments = await Appointment.find(query)
            .populate('patientId', 'name email')
            .populate('labId', 'name location')
            .populate('hospitalId', 'name location');

        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createAppointment,
    getUserAppointments
};
