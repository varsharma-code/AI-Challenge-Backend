
// models/Threat.js
const mongoose = require('mongoose');

// --- Define Sub-Schemas and Enums ---

// Define the schema for the 'location' sub-document
// Matches frontend: location: { lat: number; lng: number; country: string; city: string; };
const LocationSchema = new mongoose.Schema({
    lat: {
        type: Number,
        required: [true, 'Latitude is required for location'],
    },
    lng: {
        type: Number,
        required: [true, 'Longitude is required for location'],
    },
    country: {
        type: String,
        required: [true, 'Country is required for location'],
        trim: true,
    },
    city: {
        type: String,
        required: [true, 'City is required for location'],
        trim: true,
    },
}, { _id: false });

// Define the enum values for Severity (lowercase to match frontend Severity type alias)
const SeverityEnum = ['low', 'medium', 'high', 'critical'];

// Define the enum values for AttackType (matches frontend AttackType type alias)
const AttackTypeEnum = [
    'Malware',
    'Phishing',
    'DDoS',
    'Exploit',
    'InsiderThreat',
    'Physical',
    'SupplyChain',
    'WebAttack',
    'AccountCompromise',
    'DataBreach',
    'Ransomware'
];

// --- Define the Main Threat Schema ---

// Define the main schema for the Threat collection
// Matches frontend: export interface Threat { ... }
const ThreatSchema = new mongoose.Schema({
    // Frontend 'id: string;' will be handled by Mongoose's default _id and toJSON transform

    // Renamed 'name' to 'title' to match frontend 'title: string;'
    title: {
        type: String,
        required: [true, 'Threat title is required'],
        trim: true,
        unique: true,
    },
    // Renamed 'details' to 'description' to match frontend 'description: string;'
    description: {
        type: String,
        required: [true, 'Threat description is required'],
        minlength: [10, 'Threat description must be at least 10 characters long'],
    },
    // Matches frontend 'severity: Severity;'
    severity: {
        type: String,
        required: [true, 'Severity is required'],
        enum: SeverityEnum,
        default: 'medium',
    },
    // Renamed 'area' to 'location' and used the updated LocationSchema to match frontend 'location: { ... };'
    location: {
        type: LocationSchema,
        required: [true, 'Location details are required'],
    },
    // Renamed 'dateOfAdded' to 'timestamp' and set type to Date to match frontend 'timestamp: string;'
    // Mongoose Date objects are converted to ISO strings by default when serialized to JSON.
    timestamp: {
        type: Date,
        default: Date.now,
    },
    // Added 'affectedSystems' to match frontend 'affectedSystems: string[];'
    affectedSystems: {
        type: [String],
        default: [],
    },
    // Added 'attackType' to match frontend 'attackType: AttackType;'
    attackType: {
        type: String,
        required: [true, 'Attack type is required'],
        enum: AttackTypeEnum,
    },
    // Added 'source' to match frontend 'source: string;'
    source: {
        type: String,
        required: [true, 'Source is required'],
        trim: true,
    },
}, {
    // Keep timestamps: true as requested. Mongoose will add 'createdAt' and 'updatedAt'.
    timestamps: true,
});

// Create the Mongoose model for the Threat collection
const Threat = mongoose.model('Threat', ThreatSchema);

module.exports = Threat; // Export the Mongoose model directly
