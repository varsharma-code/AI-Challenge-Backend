require('dotenv').config(); // Load environment variables from .env file
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Attempt to connect to MongoDB Atlas using the URI from environment variables
        await mongoose.connect(process.env.MONGODB_URI, {
            // useNewUrlParser and useUnifiedTopology are deprecated in Mongoose 6.x and later,
            // and are true by default. You can remove them if using a recent Mongoose version.
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });
        console.log('MongoDB Atlas connected successfully!');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;
