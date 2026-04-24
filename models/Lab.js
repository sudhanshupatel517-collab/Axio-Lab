const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
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

module.exports = mongoose.model('Lab', labSchema);
