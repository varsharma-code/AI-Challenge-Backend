// controllers/threatProcessingController.js

// Using CommonJS require syntax
const { getChatResponse } = require('../services/vertexService');
const fs = require('fs').promises; // For asynchronous file reading
const path = require('path');     // For resolving file paths
const ThreatDetail=require("../models/ThreatDetails")

const connectDB = require('../config/mongo'); 
// Describe the desired JSON structure and rules concisely for the AI
const threatDataFormatDescription = `
Your output MUST be a single JSON object with the following structure and rules, and nothing else.
Do NOT include any conversational text, markdown outside the JSON, or code blocks other than the JSON itself.

{
    "name": "string", // Concise, descriptive threat name
    "details": "string", // Comprehensive summary (min 10 characters)
    "dateOfAdded": "string", // ISO 8601 date-time string (e.g., 'YYYY-MM-DDTHH:MM:SS.000Z'). If no time, assume midnight UTC.
    "severity": "string", // Must be one of: 'Low', 'Medium', 'High', 'Critical'
    "status": "string", // Must be one of: 'Detected', 'Mitigated', 'Investigating', 'Archived', 'False Positive'
    "area": { // This object is required
        "postalCode": "string", // Optional, if mentioned
        "country": "string", // Required
        "continent": "string", // Required
        "city": "string" // Required
    }
}

**Severity Mapping Guidance:**
- 'Critical': Devastating, widespread critical impact, loss of life, major infrastructure damage.
- 'High': Significant disruption, major impact, extensive data compromise, severe environmental damage.
- 'Medium': Widespread illness, moderate impact, large volume of personal data compromised (but not critical).
- 'Low': Temporary disruption, minor data exposure, contained incidents, no significant long-term damage.

**Status Mapping Guidance:**
- 'Detected': Threat identified, but not yet contained or resolved.
- 'Mitigated': Threat contained, impact reduced or resolved.
- 'Investigating': Threat being actively analyzed to understand scope/cause.
- 'Archived': Threat resolved and documented.
- 'False Positive': Initial detection was incorrect.

**Area Extraction Guidance:**
- Prioritize explicit city, country, continent.
- If a general region (e.g., 'Southeast Asia') is mentioned, try to find the most specific city/country within that region from the article's details.
- Postal code is optional.
`;

// Function to construct the prompt for the AI
const createPrompt = (articleContent) => {
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
 * Processes a directory of threat articles using Vertex AI to extract structured data.
 * Each file in the directory is expected to be a plain text article.
 *
 * @param {string} articlesDirectoryPath - The absolute or relative path to the directory containing your plain text article files.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of extracted ThreatDetail objects.
 */
async function processThreatArticles(articlesDirectoryPath) {
    const processedThreats = [];

    try {
        // Read all file names from the specified directory
        const fileNames = await fs.readdir(articlesDirectoryPath);

        // Filter for files that are likely your articles.
        // This filter is more permissive to catch files starting with 'article' regardless of extension.
        // E.g., 'article1', 'article2.txt', 'article3.json' will all be included.
        const articleFiles = fileNames.filter(name => name.startsWith('Article1.'));

        if (articleFiles.length === 0) {
            console.warn(`No article files found in directory: ${articlesDirectoryPath}. Please ensure they are named 'articleX' (e.g., article1, article2.txt, article3.json) and adjust filter if needed.`);
            return [];
        }

        for (const fileName of articleFiles) {
            const filePath = path.join(articlesDirectoryPath, fileName);
            console.log(`Reading file: ${filePath}`);

            let articleContent = '';
            let articleTitle = fileName; // Use file name as title for logging

            try {
                // Read the file content as plain text
                articleContent = await fs.readFile(filePath, 'utf8');
                // Attempt to extract a more readable title from the first line of the article
                const firstLine = articleContent.split('\n')[0];
                if (firstLine && firstLine.length > 5) { // Basic check for a meaningful first line
                    // Remove "Article X: " prefix if present, and trim
                    articleTitle = firstLine.replace(/^Article \d+:\s*/, '').trim();
                }

            } catch (fileReadError) {
                console.error(`Error reading file ${fileName}:`, fileReadError.message);
                continue; // Skip to the next file if reading fails
            }

            console.log(`Processing article: "${articleTitle}"`);
            const prompt = createPrompt(articleContent);

            try {
                // Call the getChatResponse from your vertexService
                const aiResponseText = await getChatResponse(prompt);

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
                console.log(`Successfully processed: "${articleTitle}"`);

            } catch (aiError) {
                console.error(`Error processing article "${articleTitle}" with AI:`, aiError.message);
                // Log the raw AI response that caused the parsing error for debugging
                console.error('Raw AI response that failed parsing:', aiResponseText);
                processedThreats.push({
                    name: articleTitle,
                    details: `Failed to extract details due to AI error: ${aiError.message}. Raw response: ${aiResponseText.substring(0, 100)}...`, // Include snippet of raw response
                    dateOfAdded: new Date().toISOString(),
                    severity: "Low",
                    status: "False Positive",
                    area: { country: "Unknown", continent: "Unknown", city: "Unknown" },
                    extractionError: aiError.message
                });
            }
            // Add a small delay between API calls to avoid hitting rate limits
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }

        return processedThreats;

    } catch (dirError) {
        console.error('Error accessing articles directory:', dirError);
        throw new Error(`Failed to process articles: ${dirError.message}`);
    }
}

// Export the function using CommonJS syntax
module.exports = {
    processThreatArticles
};

// --- GLOBAL CALL FOR TESTING FLOW ---
// This will execute the processing when the module is imported/loaded.
// In a production app, you'd typically call processThreatArticles from a route handler or main script.
const dirPath = path.join(__dirname, '../ArticlesDump'); // Adjust path as needed for your project structure
console.log("Articles Directory Path:", dirPath);

// Use an Immediately Invoked Async Function Expression (IIAFE) to handle the top-level await
(async () => {
    try {
        await connectDB();
        const finalRes = await processThreatArticles(dirPath);
        console.log("\n--- Final Processing Results ---");
        console.log(JSON.stringify(finalRes, null, 2));

        const savedThreats = [];
        for (const threatData of finalRes) {
            try {
                // Create a new Mongoose document instance
                const newThreat = new ThreatDetail(threatData);
                // Save the document to the database
                const savedThreat = await newThreat.save();
                savedThreats.push(savedThreat);
                console.log(`Saved threat: "${savedThreat.name}" (ID: ${savedThreat._id})`);
            } catch (dbError) {
                if (dbError.code === 11000) { // MongoDB duplicate key error (for unique: true on 'name')
                    console.warn(`Warning: Threat "${threatData.name}" already exists or is a duplicate. Skipping save.`);
                } else {
                    console.error(`Error saving threat "${threatData.name || 'Unknown'}" to DB:`, dbError.message);
                }
            }
        }
        console.log(`\nSuccessfully saved ${savedThreats.length} threats to the database.`);
    } catch (error) {
        console.error("\n--- Error during global processing call ---");
        console.error(error.message);
    }
})();
