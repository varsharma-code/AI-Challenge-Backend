// routes/threatRoutes.js
const express = require('express');
const router = express.Router();
const ThreatDetail = require('../models/ThreatDetails');

/**
 * GET /api/threats
 * Fetch all threat documents from the ThreatDetails collection
 */
router.get('/', async (req, res) => {
    try {
        const threats = await ThreatDetail.find({});
        
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
router.get('/filter/severity/:severity', async (req, res) => {
    try {
        const { severity } = req.params;
        const validSeverities = ['Low', 'Medium', 'High', 'Critical'];
        
        if (!validSeverities.includes(severity)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid severity level. Must be one of: Low, Medium, High, Critical'
            });
        }
        
        const threats = await ThreatDetail.find({ severity });
        
        res.status(200).json({
            success: true,
            count: threats.length,
            data: threats
        });
        
    } catch (error) {
        console.error('Error fetching threats by severity:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server Error: Unable to fetch threats by severity',
            message: error.message
        });
    }
});

/**
 * GET /api/threats/filter/status/:status
 * Fetch threats by status (must come before /:id route)
 */
router.get('/filter/status/:status', async (req, res) => {
    try {
        const { status } = req.params;
        const validStatuses = ['Detected', 'Mitigated', 'Investigating', 'Archived', 'False Positive'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Must be one of: Detected, Mitigated, Investigating, Archived, False Positive'
            });
        }
        
        const threats = await ThreatDetail.find({ status });
        
        res.status(200).json({
            success: true,
            count: threats.length,
            data: threats
        });
        
    } catch (error) {
        console.error('Error fetching threats by status:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server Error: Unable to fetch threats by status',
            message: error.message
        });
    }
});

/**
 * GET /api/threats/:id
 * Fetch a specific threat by ID (must come after filter routes)
 */
router.get('/:id', async (req, res) => {
    try {
        const threat = await ThreatDetail.findById(req.params.id);
        
        if (!threat) {
            return res.status(404).json({
                success: false,
                error: 'Threat not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: threat
        });
        
    } catch (error) {
        console.error('Error fetching threat by ID:', error.message);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid threat ID format'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Server Error: Unable to fetch threat',
            message: error.message
        });
    }
});

/**
 * POST /api/threats
 * Add a new threat to the database
 */
router.post('/', async (req, res) => {
    try {
        const newThreat = new ThreatDetail(req.body);
        const savedThreat = await newThreat.save();
        
        res.status(201).json({
            success: true,
            data: savedThreat
        });
        
    } catch (error) {
        console.error('Error adding new threat:', error.message);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Validation Error',
                details: Object.values(error.errors).map(err => err.message)
            });
        }
        
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                error: 'A threat with this name already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Server Error: Unable to add threat',
            message: error.message
        });
    }
});

module.exports = router;
