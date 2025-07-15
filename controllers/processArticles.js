// controllers/threatProcessingController.js

// Using ES Module syntax
// This file will now be a CommonJS module, so no top-level await without wrapping it.

const { getChatResponse } = require('../services/vertexService.js'); // Ensure .js extension
// const { readArticleFiles } = require('./fetchArticles.js'); // Import the file reading function
const path = require('path');     // For resolving file paths
const ThreatDetail = require('../models/ThreatDetails.js'); // Ensure .js extension
const { getOrchestratorAccessToken, getQueueItems,startOrchestratorJob } = require("../services/Orchestrator.js"); // Already in require format

// Describe the desired JSON structure and rules concisely for the AI for EXTRACTION
const threatDataFormatDescription = `
Your output MUST be a single JSON object with the following structure and rules, and nothing else.
Do NOT include any conversational text, markdown outside the JSON, or code blocks other than the JSON itself.

{
    "id": "string", // Unique identifier for the threat (e.g., UUID or system-generated ID). If not explicitly found, generate a UUID.
    "title": "string", // Concise, descriptive threat title (formerly 'name')
    "description": "string", // Comprehensive summary (min 10 characters) (formerly 'details')
    "severity": "string", // Must be one of: 'low', 'medium', 'high', 'critical' (lowercase)
    "location": { // This object is required (formerly 'area')
        "lat": "number", // Latitude (e.g., 34.0522)
        "lng": "number", // Longitude (e.g., -118.2437)
        "country": "string", // Required
        "city": "string" // Required
    },
    "timestamp": "string", // ISO 8601 date-time string (e.g., 'YYYY-MM-DDTHH:MM:SS.000Z'). If no time, assume midnight UTC. (formerly 'dateOfAdded')
    "affectedSystems": "string[]", // Array of strings (e.g., ["ERP System", "Customer Database"])
    "attackType": "string", // Must be one of: 'Malware', 'Phishing', 'DDoS', 'Exploit', 'InsiderThreat', 'Physical', 'SupplyChain', 'WebAttack', 'AccountCompromise', 'DataBreach', 'Ransomware'
    "source": "string" // Source of the threat information (e.g., 'Threat Intelligence Report', 'Internal Alert System')
}

**Severity Mapping Guidance:**
- 'critical': Devastating, widespread critical impact, loss of life, major infrastructure damage.
- 'high': Significant disruption, major impact, extensive data compromise, severe environmental damage.
- 'medium': Widespread illness, moderate impact, large volume of personal data compromised (but not critical).
- 'low': Temporary disruption, minor data exposure, contained incidents, no significant long-term damage.

**Location Extraction Guidance:**
- Prioritize explicit city, country.
- If a general region (e.g., 'Southeast Asia') is mentioned, try to find the most specific city/country within that region from the article's details.
- For lat and lng, use approximate coordinates for the identified city/country if specific coordinates are not provided. If only country is known, use country's capital or central point. If no location, use 0,0.

**AttackType Mapping Guidance:**
- 'Malware': Malicious software (viruses, worms, trojans).
- 'Phishing': Deceptive communication to acquire sensitive information.
- 'DDoS': Distributed Denial of Service attack.
- 'Exploit': Leveraging software vulnerabilities.
- 'InsiderThreat': Malicious activity by current/former employees.
- 'Physical': Unauthorized physical access or damage.
- 'SupplyChain': Attack targeting an organization through its suppliers.
- 'WebAttack': Attacks targeting web applications (e.g., SQL Injection, XSS).
- 'AccountCompromise': Unauthorized access to user accounts.
- 'DataBreach': Unauthorized access or disclosure of sensitive data.
- 'Ransomware': Malware that encrypts data and demands payment.

**ID Generation Guidance:**
- If an explicit ID is mentioned in the text, use it. Otherwise, generate a standard UUID (e.g., 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx').
`;

// Prompt for the first AI call (classification)
const isCybersecurityThreatPrompt = (articleContent) => {
    return `
Analyze the following article content. Determine if it primarily discusses a cybersecurity threat, incident, vulnerability, or related topic.
Your response MUST be a single JSON object with a boolean value, like this:
{"isCybersecurityThreat": true}
or
{"isCybersecurityThreat": false}

Do NOT include any other text or markdown.

---
**Article Content:**
\`\`\`
${articleContent}
\`\`\`
`;
};

// Prompt for the second AI call (data extraction)
const createExtractionPrompt = (articleContent) => {
    return `
Please extract the relevant information from the following article and format it as a JSON object.
${threatDataFormatDescription}

---
**Article to Process:**
\`\`\`
${articleContent}
\`\`\`
    `;
};

/**
 * Helper function to classify an article using AI.
 * @param {string} articleContent - The content of the article.
 * @returns {Promise<boolean>} - True if the article is classified as a cybersecurity threat, false otherwise.
 */
async function classifyArticle(articleContent) {
    const prompt = isCybersecurityThreatPrompt(articleContent);
    try {
        const aiResponseText = await getChatResponse(prompt);
        // Clean the response from markdown if present
        let cleanedResponseText = aiResponseText.trim();
        if (cleanedResponseText.startsWith('```json')) {
            cleanedResponseText = cleanedResponseText.substring('```json'.length);
        }
        if (cleanedResponseText.endsWith('```')) {
            cleanedResponseText = cleanedResponseText.substring(0, cleanedResponseText.length - '```'.length);
        }
        cleanedResponseText = cleanedResponseText.trim();

        const classificationResult = JSON.parse(cleanedResponseText);
        return classificationResult.isCybersecurityThreat === true; // Ensure strict boolean check
    } catch (error) {
        console.error(`Error classifying article with AI: ${error.message}`);
        // Log the raw AI response that caused the parsing error for debugging
        console.error('Raw AI classification response that failed parsing:', aiResponseText);
        return false; // Default to false if classification fails or is unparseable
    }
}


/**
 * Processes a directory of threat articles using Vertex AI to extract structured data.
 * Each file in the directory is expected to be a plain text article.
 *
 * @param {string} articlesDirectoryPath - The absolute or relative path to the directory containing your plain text article files.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of extracted ThreatDetail objects.
 */
async function processThreatArticles(articlesDirectoryPath) {
    const processedThreats = [];

    try {
        // Use the imported readArticleFiles function
        // const articleContents = await readArticleFiles(articlesDirectoryPath);
        const access_token = await getOrchestratorAccessToken();
        const quItems = await getQueueItems(access_token);

        const filteredItems = quItems.map(item => ({
            Id: item.Id,
            Title: item.SpecificContent?.Title,
            ArticleContent: item.SpecificContent?.ArticleContent
        }));

        console.log("Filtered Queue Items:", filteredItems);
        const articleContents = filteredItems
            .filter(item => item.Title && item.ArticleContent) // Filter out items without title or content
            .map(item => `Title: ${item.Title}\nArticleContent: ${item.ArticleContent}`);

        if (articleContents.length === 0) {
            console.warn(`No article files found or readable in directory: ${articlesDirectoryPath}.`);
            return [];
        }
        const savedThreats = [];
        for (const articleContent of articleContents) {
            // For logging purposes, use a snippet or generate a temporary title
            const articleSnippet = articleContent.substring(0, 50).replace(/\n/g, ' ') + '...';
            console.log(`Attempting to classify article: "${articleSnippet}"`);

            // --- First AI Call: Classification ---
            const isCyberThreat = await classifyArticle(articleContent);

            if (!isCyberThreat) {
                console.log(`Article "${articleSnippet}" is NOT a cybersecurity threat. Skipping extraction.`);
                continue; // Skip to the next article
            }

            console.log(`Article "${articleSnippet}" IS a cybersecurity threat. Proceeding with extraction.`);

            // --- Second AI Call: Data Extraction (only if classified as a threat) ---
            const extractionPrompt = createExtractionPrompt(articleContent);

            try {
                const aiResponseText = await getChatResponse(extractionPrompt);

                // --- Strip Markdown code block delimiters ---
                let cleanedResponseText = aiResponseText.trim();
                if (cleanedResponseText.startsWith('```json')) {
                    cleanedResponseText = cleanedResponseText.substring('```json'.length);
                }
                if (cleanedResponseText.endsWith('```')) {
                    cleanedResponseText = cleanedResponseText.substring(0, cleanedResponseText.length - '```'.length);
                }
                cleanedResponseText = cleanedResponseText.trim(); // Trim again after stripping

                // Attempt to parse the cleaned AI's response as JSON
                const extractedData = JSON.parse(cleanedResponseText);
                processedThreats.push(extractedData);
                console.log(`Successfully extracted data for: "${articleSnippet}"`);
                const newThreat = new ThreatDetail(extractedData);
                // Save the document to the database
                const savedThreat = await newThreat.save();
                savedThreats.push(savedThreat);
                console.log(`Saved threat: "${savedThreat.name}" (ID: ${savedThreat._id})`);
            } catch (aiError) {
                console.error(`Error processing article "${articleSnippet}" with AI for extraction:`, aiError.message);
                // Log the raw AI response that caused the parsing error for debugging
                console.error('Raw AI extraction response that failed parsing:', aiResponseText);
               
            }
            // Add a small delay between API calls to avoid hitting rate limits
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }

        
        // const savedThreats = [];
        // for (const threatData of processedThreats) {
        //     try {
        //         // Create a new Mongoose document instance
        //         const newThreat = new ThreatDetail(threatData);
        //         // Save the document to the database
        //         const savedThreat = await newThreat.save();
        //         savedThreats.push(savedThreat);
        //         console.log(`Saved threat: "${savedThreat.name}" (ID: ${savedThreat._id})`);
        //     } catch (dbError) {
        //         if (dbError.code === 11000) { // MongoDB duplicate key error (for unique: true on 'name')
        //             console.warn(`Warning: Threat "${threatData.name}" already exists or is a duplicate. Skipping save.`);
        //         } else {
        //             console.error(`Error saving threat "${threatData.name || 'Unknown'}" to DB:`, dbError.message);
        //         }
        //     }
        // }


        console.log(`\nSuccessfully saved ${savedThreats.length} threats to the database.`);
        await startOrchestratorJob()
        console.log("Updating status in queue");

    } catch (overallError) {
        console.error('An overall error occurred during article processing:', overallError);
        throw new Error(`Failed to process articles: ${overallError.message}`);
    }
}


// --- GLOBAL CALL FOR TESTING FLOW ---
// This will execute the processing when the module is imported/loaded.
// In a production app, you'd typically call processThreatArticles from a route handler or main script.

// Adjust path as needed for your project structure.
// Assuming 'ArticlesDump' is a sibling directory to 'controllers'.
const dirPath = path.join(process.cwd(), 'ArticlesDump');
console.log("Articles Directory Path for global call:", dirPath);

// Use an Immediately Invoked Async Function Expression (IIAFE) to handle the top-level await

module.exports = processThreatArticles