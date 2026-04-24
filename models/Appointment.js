const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    labId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Lab'
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Hospital'
    },
    date: {
        type: Date,
        required: [true, 'Please add an appointment date']
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled'],
        default: 'scheduled'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Appointment', appointmentSchema);
