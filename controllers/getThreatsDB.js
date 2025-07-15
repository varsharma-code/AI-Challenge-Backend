const Threat = require('../models/ThreatDetails.js');

const getAllThreatsDB = async (req, res) => {
  try {
    // console.log("DB fetch start")
    const threats = await Threat.find({});
    // console.log("Threats",threats)
    return threats;
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = getAllThreatsDB;
