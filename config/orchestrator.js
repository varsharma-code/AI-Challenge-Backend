// config/index.js
require('dotenv').config(); // Load environment variables from .env file

const config = {
    orchestrator: {
        url: process.env.ORCHESTRATOR_URL,
        identityServerUrl: process.env.IDENTITY_SERVER_URL,
        clientId: process.env.ORCHESTRATOR_CLIENT_ID,
        clientSecret: process.env.ORCHESTRATOR_CLIENT_SECRET,
        scopes: process.env.ORCHESTRATOR_SCOPES,
        queueId: process.env.ORCHESTRATOR_QueueID,
        folderId:process.env.ORCHESTRATOR_FolderID
    }
    // Add other configurations here if needed
};

module.exports = config;