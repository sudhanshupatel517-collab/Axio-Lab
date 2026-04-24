const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const migratePasswords = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Migration');

        const users = await User.find({});
        console.log(`Found ${users.length} users. Checking for plain text passwords...`);

        let updatedCount = 0;

        for (let user of users) {
            // A typical bcrypt hash is 60 characters long and starts with $2a$, $2b$, or $2y$.
            // If the password doesn't match this pattern, we assume it's plain text.
            const isHashed = user.password && user.password.length === 60 && user.password.startsWith('$2');
            
            if (!isHashed) {
                console.log(`Hashing password for user: ${user.email}`);
                // Since we added a pre-save hook, we can just save the user.
                // But to be absolutely safe and avoid double hashing if pre-save hook fails or triggers weirdly,
                // we should update it directly or just let the hook do its job.
                // The pre-save hook only hashes if it is modified. We can trigger it by reassigning.
                const plainPassword = user.password;
                user.password = plainPassword; // Mark as modified implicitly? No, mongoose might not detect it.
                user.markModified('password');
                await user.save();
                updatedCount++;
            }
        }

        console.log(`Migration Complete. Updated ${updatedCount} users.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration Error:', error);
        process.exit(1);
    }
};

migratePasswords();
