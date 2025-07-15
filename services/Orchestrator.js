// services/orchestratorAuth.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const axios = require('axios');
const config = require('../config/orchestrator'); // Load your configuration
require('dotenv').config();
let accessToken = null;
let tokenExpiryTime = 0; // Timestamp when the token expires (in milliseconds)

const getOrchestratorAccessToken = async () => {
    // Check if token exists and is still valid
    if (accessToken && Date.now() < tokenExpiryTime) {
        console.log('Using cached Orchestrator access token.');
        return accessToken;
    }

    console.log('Refreshing Orchestrator access token...');
    try {
        const tokenUrl = `${config.orchestrator.identityServerUrl}/connect/token`;
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', config.orchestrator.clientId);
        params.append('client_secret', config.orchestrator.clientSecret);
        params.append('scope', config.orchestrator.scopes);

        const response = await axios.post(tokenUrl, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            // No need for 'Cookie' header for client_credentials grant type
        });

        // Store the new token and its expiry time
        accessToken = response.data.access_token;
        // Calculate expiry time: current time + expiresIn (in seconds) * 1000 (to milliseconds)
        tokenExpiryTime = Date.now() + (response.data.expires_in * 1000);

        console.log('Orchestrator access token refreshed successfully.');
        return accessToken;

    } catch (error) {
        console.error('Error refreshing Orchestrator access token:', error.response ? error.response.data : error.message);
        throw new Error('Failed to refresh Orchestrator access token.');
    }
};

const getQueueItems = async (accessToken) => { // Now accepts accessToken as an argument
    try {
        const queueItemsUrl = `${config.orchestrator.url}/QueueItems`;
        const queueId = config.orchestrator.queueId;
        const folderId = config.orchestrator.folderId;
        // console.log("Fetching queue items with folderId:", config);
        const filter = `$filter=QueueDefinitionId eq ${queueId} and Status eq 'New'`;

        console.log(`Fetching queue items for QueueDefinitionId: ${queueId}, FolderId: ${folderId}`);

        const response = await axios.get(`${queueItemsUrl}?${filter}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`, // Use the passed accessToken
                'Content-Type': 'application/json',
                'X-UIPATH-OrganizationUnitId': folderId
            }
        });

        console.log('Queue items fetched successfully.');
        return response.data.value;

    } catch (error) {
        console.error('Error fetching queue items:', error.response ? error.response.data : error.message);
        throw new Error('Failed to fetch queue items from Orchestrator.');
    }
};

const startOrchestratorJob = async (
    accessToken,
    {
        strategy = "ModernJobsCount",
        jobsCount = 1,
        runtimeType = "Unattended",
        jobPriority = "Normal",
        inputArguments = {}
    } = {} // Default empty object for options
) => {
    try {
        const startJobUrl = `${config.orchestrator.url}/Jobs/UiPath.Server.Configuration.OData.StartJobs`;
        const folderId = config.orchestrator.folderId;
        const releaseKey = process.env.ORCHESTRATOR_TRANSACTION_UPDATE_PROCESSKEY; // Assuming this is defined in config/orchestrator.js

        const payload = {
            startInfo: {
                ReleaseKey: releaseKey,
                Strategy: strategy,
                JobsCount: jobsCount,
                RuntimeType: runtimeType,
                InputArguments: JSON.stringify(inputArguments), // Stringify input arguments object
                JobPriority: jobPriority,
                // Add other optional fields if needed, e.g.:
                // JobEntryPoint: "Main.xaml",
                // InputFile: null,`
                // EnvironmentVariables: null
            }
        };

        console.log('Attempting to start Orchestrator job with payload:', JSON.stringify(payload, null, 2));

        const response = await axios.post(startJobUrl, payload, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-UIPATH-OrganizationUnitId': folderId
            }
        });

        console.log('Orchestrator job started successfully. Response:', response.data);
        return response.data;

    } catch (error) {
        console.error('Error starting Orchestrator job:', error.response ? error.response.data : error.message);
        throw new Error('Failed to start Orchestrator job.');
    }
};



module.exports = {
    getOrchestratorAccessToken,
    getQueueItems,
    startOrchestratorJob
};