const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    location: {
        type: String,
        required: [true, 'Please add a location']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Hospital', hospitalSchema);
