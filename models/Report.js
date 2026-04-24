const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    labId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Lab'
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Hospital'
    },
    reportData: {
        type: String,
        required: [true, 'Please add report data']
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'reviewed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
