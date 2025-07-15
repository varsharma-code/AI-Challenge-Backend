/ services/scraperService.js
const ThreatDetail = require('../models/ThreatDetails.js'); // Import your ThreatDetail Mongoose model
const axios = require('axios'); // For making HTTP requests to external APIs

// Define your 4 API endpoints (replace with your actual URLs)
const API_SOURCES = [
    { id: 'source1', url: 'https://jsonplaceholder.typicode.com/posts/1' },
    { id: 'source2', url: 'https://jsonplaceholder.typicode.com/posts/2' },
    { id: 'source3', url: 'https://jsonplaceholder.typicode.com/posts/3' },
    { id: 'source4', url: 'https://jsonplaceholder.typicode.com/posts/4' },
    // Add more of your actual API endpoints here
    // Example: { id: 'newsApi', url: 'https://api.example.com/news?category=security' },
    // Example: { id: 'blogFeed', url: 'https://blog.another-example.com/feed.json' },
];

/**
 * Fetches raw data from a given URL.
 * @param {string} url - The URL to fetch data from.
 * @returns {Promise<string|null>} - The raw data as a string, or null if fetching fails.
 */
const fetchRawData = async (url) => {
    try {
        console.log(`Fetching data from: ${url}`);
        const response = await axios.get(url);
        // Assuming the API returns an object and we want to stringify it,
        // or extract a specific field like 'body' from jsonplaceholder.
        // Adjust this logic based on the actual structure of your API responses.
        return response.data.body || JSON.stringify(response.data);
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error.message);
        return null; // Return null on error
    }
};

/**
 * Processes raw data into the ThreatDetail schema format and saves it to MongoDB.
 * This function now directly maps data, without an AI step.
 */
const processAndSaveThreatData = async () => {
    console.log('Starting data fetching and saving...');
    let savedThreatsCount = 0;

    for (const source of API_SOURCES) {
        const rawData = await fetchRawData(source.url);

        if (!rawData) {
            console.warn(`Skipping data from ${source.id} due to fetch error or empty response.`);
            continue;
        }

        try {
            // --- Direct Mapping to ThreatDetail Schema ---
            // This is where you'd implement your logic to parse `rawData`
            // and map it to your ThreatDetail schema fields.
            // For this example, we'll use mock data for most fields
            // and use a snippet of rawData for 'details'.

            const mockThreatName = `Threat from ${source.id} - ${Date.now()}`; // Ensure unique name
            const mockSeverity = ['Low', 'Medium', 'High', 'Critical'][Math.floor(Math.random() * 4)];
            const mockStatus = ['Detected', 'Investigating'][Math.floor(Math.random() * 2)];
            const mockArea = {
                postalCode: Math.floor(10000 + Math.random() * 90000).toString(),
                country: ['USA', 'Canada', 'UK', 'Germany'][Math.floor(Math.random() * 4)],
                continent: ['North America', 'Europe'][Math.floor(Math.random() * 2)],
                city: ['New York', 'London', 'Berlin', 'Toronto'][Math.floor(Math.random() * 4)]
            };

            const structuredThreatData = {
                name: mockThreatName,
                details: `Content from ${source.id}: ${rawData.substring(0, 200)}...`, // Take first 200 chars
                severity: mockSeverity,
                status: mockStatus,
                area: mockArea,
                dateOfAdded: new Date(), // Set current date/time
            };

            // Create a new ThreatDetail instance
            const newThreat = new ThreatDetail(structuredThreatData);

            // Save the new threat document to MongoDB
            const savedThreat = await newThreat.save();
            console.log(`Successfully saved threat: "${savedThreat.name}"`);
            savedThreatsCount++;

        } catch (error) {
            console.error(`Error processing or saving threat from ${source.id}:`, error.message);
            if (error.code === 11000) { // MongoDB duplicate key error
                console.error('  Reason: A threat with this name already exists. (This can happen with mock data if names aren\'t unique enough)');
            } else if (error.name === 'ValidationError') {
                console.error('  Reason: Mongoose Validation Error -', error.message);
            }
        }
    }
    console.log(`Data fetching and saving complete. Total threats saved: ${savedThreatsCount}`);
    return { success: true, savedCount: savedThreatsCount };
};

module.exports = {
    processAndSaveThreatData,
};
