const mongoose = require('mongoose');

// The password contains a '#' which is a special character in URLs. 
// It has been replaced with its URL-encoded equivalent: %23
const mongoURI = 'mongodb+srv://sudhanshupatel517:Sudhanshu%23123@axiolab.yimkutq.mongodb.net/?appName=AXIOLAB';

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB Connected successfully to Atlas'))
    .catch(err => console.log('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'Admin' },
    name: { type: String }
});

const requestSchema = new mongoose.Schema({
    axiovitalId: { type: String, unique: true },
    name: String,
    age: Number,
    gender: String,
    disease: String,
    collectionMethod: String,
    paymentStatus: String,
    paymentAmount: Number,
    pin: String,
    status: { type: String, default: 'Requested' },
    reportFile: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Request = mongoose.model('Request', requestSchema);

// Seed default admin user and dummy data
const seedData = async () => {
    try {
        const adminExists = await User.findOne({ email: 'sarah@axiovital.com' });
        if (!adminExists) {
            await User.create({ email: 'sarah@axiovital.com', password: 'admin', role: 'Admin', name: 'Dr. Sarah Admin' });
            console.log('Default admin seeded.');
        }

        const count = await Request.countDocuments();
        if (count === 0) {
            const dummyRequests = [
                { axiovitalId: 'AXV-9012', name: 'John Doe', age: 45, gender: 'Male', disease: 'Complete Blood Count (CBC)', collectionMethod: 'Walk-in', paymentStatus: 'Paid', status: 'Requested', paymentAmount: 45, pin: '1234' },
                { axiovitalId: 'AXV-7734', name: 'Maria Garcia', age: 32, gender: 'Female', disease: 'Lipid Profile', collectionMethod: 'Home Collection', paymentStatus: 'Pending', status: 'Requested', paymentAmount: 0, pin: '5678' },
                { axiovitalId: 'AXV-6591', name: 'Robert Smith', age: 58, gender: 'Male', disease: 'HbA1c Diabetes', collectionMethod: 'Walk-in', paymentStatus: 'Paid', status: 'Requested', paymentAmount: 45, pin: '9012' },
                { axiovitalId: 'AXV-8833', name: 'Patricia Brown', age: 41, gender: 'Female', disease: 'Thyroid Profile', collectionMethod: 'Walk-in', paymentStatus: 'Paid', status: 'Approved', paymentAmount: 45, pin: '3456' },
                { axiovitalId: 'AXV-5511', name: 'David Taylor', age: 48, gender: 'Male', disease: 'Uric Acid Test', collectionMethod: 'Walk-in', paymentStatus: 'Paid', status: 'Processing', paymentAmount: 45, pin: '7890' },
                { axiovitalId: 'AXV-3344', name: 'Charles Harris', age: 59, gender: 'Male', disease: 'Thyroid Profile', collectionMethod: 'Walk-in', paymentStatus: 'Paid', status: 'Completed', paymentAmount: 45, pin: '2345' }
            ];
            await Request.insertMany(dummyRequests);
            console.log('Dummy requests seeded.');
        }
    } catch (e) {
        console.error('Seeding error:', e);
    }
};

seedData();

module.exports = { User, Request };
