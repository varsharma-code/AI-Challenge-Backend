// config/vertexAi.js

const { VertexAI } = require('@google-cloud/vertexai');
require('dotenv').config();
// Load environment variables for project ID and region
// Ensure these are set in your .env file
// GOOGLE_CLOUD_PROJECT=itd-ai-interns
// GOOGLE_CLOUD_LOCATION=us-central1
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
console.log("ProjectId",PROJECT_ID)

if (!PROJECT_ID || !LOCATION) {
  console.error('Error: GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION must be set in your .env file.');
  process.exit(1); // Exit if essential config is missing
}

// Initialize Vertex AI client
const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
});

module.exports = vertexAI;