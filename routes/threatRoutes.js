// routes/threatRoutes.js
const express = require('express');
const router = express.Router();
const ThreatDetail = require('../models/ThreatDetails.js');
const getAllThreatsDB=require('../controllers/getThreatsDB')
const processThreatArticles=require("../controllers/processArticles")

/**
 * GET /api/threats
 * Fetch all threat documents from the ThreatDetails collection
 */
router.get('/getAllThreats', async (req, res) => {
    try {
        console.log("HELLO")
        const threats = await getAllThreatsDB();
        
        res.status(200).json({
            success: true,
            count: threats.length,
            data: threats
        });
        
    } catch (error) {
        console.error('Error fetching threats:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server Error: Unable to fetch threats',
            message: error.message
        });
    }
});
/**
 * GET /api/threats/filter/severity/:severity
 * Fetch threats by severity level (must come before /:id route)
 */

router.get('/scrapeData', async (req, res) => {
    try {
        console.log("Starting scrape data process...");
        
        // Call the processThreatArticles function
        // Note: You might need to pass a parameter if required by your function
        const processedThreats = await processThreatArticles();
        
        res.status(200).json({
            success: true,
            message: 'Articles scraped and processed successfully',
            count: processedThreats.length,
            data: processedThreats
        });
        
    } catch (error) {
        console.error('Error in scrapeData route:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server Error: Unable to scrape and process articles',
            message: error.message
        });
    }
});


module.exports = router;
