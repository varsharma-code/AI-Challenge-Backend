// models/ThreatDetail.js
const mongoose = require('mongoose');

// Define the schema for the Area sub-document
const AreaSchema = new mongoose.Schema({
    postalCode: {
        type: String,
        trim: true,
        // You might add validation here, e.g., match: /^\d{5}(-\d{4})?$/ for US zip codes
    },
    country: { // Changed to lowercase 'country' for consistency and common practice
        type: String,
        required: [true, 'Country is required for Area'],
        trim: true,
    },
    continent: { // Changed to lowercase 'continent'
        type: String,
        required: [true, 'Continent is required for Area'],
        trim: true,
    },
    city: { // Changed to lowercase 'city'
        type: String,
        required: [true, 'City is required for Area'],
        trim: true,
    },
}, { _id: false }); // _id: false prevents Mongoose from creating an _id for the sub-document

// Define the main schema for the ThreatDetail collection
const ThreatDetailSchema = new mongoose.Schema({
    name: { // Changed to 'name' (lowercase) for consistency
        type: String,
        required: [true, 'Threat name is required'],
        trim: true,
        unique: true, // Ensures threat names are unique across the collection
    },
    details: { // Changed to 'details' (lowercase)
        type: String,
        required: [true, 'Threat details are required'],
        minlength: [10, 'Threat details must be at least 10 characters long'],
    },
    dateOfAdded: { // Changed to 'dateOfAdded' (camelCase)
        type: Date,
        default: Date.now, // Sets the default to the current date/time when a new document is created
    },
    severity: {
        type: String,
        required: [true, 'Severity is required'],
        enum: ['Low', 'Medium', 'High', 'Critical'], // Restrict values to these options
        default: 'Medium', // Default value if not explicitly provided
    },
    status: {
        type: String,
        required: [true, 'Status is required'],
        enum: ['Detected', 'Mitigated', 'Investigating', 'Archived', 'False Positive'], // Example statuses
        default: 'Detected',
    },
    area: { // The embedded Area sub-document
        type: AreaSchema,
        required: [true, 'Area details are required'], // Make the entire area object required
    },
}, {
    timestamps: true, // Automatically adds 'createdAt' and 'updatedAt' fields
    // Mongoose will automatically create a collection named 'threatdetails' (lowercase, plural)
    // based on the model name 'ThreatDetail'.
});

// Create the Mongoose model for the ThreatDetail collection
const ThreatDetail = mongoose.model('ThreatDetail', ThreatDetailSchema);

module.exports = ThreatDetail; // Export the Mongoose model directly