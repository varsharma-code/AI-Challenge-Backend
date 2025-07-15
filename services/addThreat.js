// app.js (or a route handler file, after connecting to DB)
const connectDB = require('../config/mongo'); // Your database connection
const ThreatDetail = require('../models/ThreatDetails.js'); // Import the ThreatDetail model

// Connect to MongoDB Atlas (ensure this runs once at application start)
connectDB();

// Example function to add a new threat
async function addNewThreat() {
    try {
        const newThreat = new ThreatDetail({
            name: 'DDoS Attack',
            details: 'Large-scale distributed denial-of-service attack targeting web servers.',
            severity: 'Critical',
            status: 'Detected',
            area: {
                postalCode: '10001',
                country: 'USA',
                continent: 'North America',
                city: 'New York'
            }
        });

        const savedThreat = await newThreat.save(); // Save the document
        console.log('New threat added:', savedThreat);
        return savedThreat;

    } catch (error) {
        console.error('Error adding new threat:', error.message);
        // Handle validation errors or unique constraint errors
        if (error.code === 11000) { // MongoDB duplicate key error code
            console.error('A threat with this name already exists.');
        }
    }
}

// Example function to get all threats
async function retrieveAllThreats() {
    try {
        const threats = await ThreatDetail.find({}); // Find all documents
        console.log('All threats:', threats);
        return threats;
    } catch (error) {
        console.error('Error retrieving threats:', error.message);
    }
}

// Example function to update a threat
async function updateThreatStatus(threatId, newStatus) {
    try {
        const updatedThreat = await ThreatDetail.findByIdAndUpdate(
            threatId,
            { status: newStatus },
            { new: true, runValidators: true } // Return updated doc and run schema validators
        );
        if (updatedThreat) {
            console.log('Threat updated:', updatedThreat);
        } else {
            console.log('Threat not found for update.');
        }
        return updatedThreat;
    } catch (error) {
        console.error('Error updating threat:', error.message);
    }
}

// Example usage when your application starts
(async () => {
    await addNewThreat();
    // You can add a delay here if you want to see the new threat before retrieving all
    await retrieveAllThreats();
    // Assuming you have an ID from a previously added threat, you can update it
    // const threatToUpdateId = 'YOUR_THREAT_ID_HERE'; // Replace with an actual ID
    // await updateThreatStatus(threatToUpdateId, 'Mitigated');
})();