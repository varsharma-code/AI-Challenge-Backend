// services/vertexAiService.js

// Import the pre-initialized Vertex AI client from the config file
const vertexAI = require('../config/vertexSetup'); 

// --- Core AI Completion Function ---
// This function directly interfaces with the Vertex AI client instance from config.
async function getVertexAiCompletion(messages, modelName = "gemini-2.5-flash-preview-05-20") {
  try {
    const generativeModel = vertexAI.getGenerativeModel({
      model: modelName,
    });

    // Vertex AI's generateContent method expects an array of message parts.
    const content = messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    const result = await generativeModel.generateContent({ contents: content });
    const response = result.response;

    if (response && response.candidates && response.candidates.length > 0 && response.candidates[0].content && response.candidates[0].content.parts && response.candidates[0].content.parts.length > 0) {
      return response.candidates[0].content.parts.map(part => part.text).join('');
    } else {
      throw new Error('Unexpected response structure from Vertex AI.');
    }
  } catch (error) {
    console.error('Error in getVertexAiCompletion:', error);
    throw new Error(`Failed to get AI completion from Vertex AI: ${error.message}`);
  }
}

// --- Easily Callable AI Response Function ---
/**
 * A higher-level, easily callable function to get an AI response for a simple user query.
 * This function prepares the messages format for the underlying AI completion function.
 * @param {string} userQuery - The single text query from the user.
 * @param {string} [modelName="gemini-2.5-flash-preview-05-20"] - The Vertex AI model to use.
 * @returns {Promise<string>} The AI's generated text response.
 * @throws {Error} If there's an issue communicating with the AI model.
 */
async function getChatResponse(userQuery, modelName = "gemini-2.5-flash-preview-05-20") {
  if (!userQuery || typeof userQuery !== 'string' || userQuery.trim().length === 0) {
    throw new Error('User query must be a non-empty string.');
  }

  // Format the single user query into the messages array expected by the AI model
  const messages = [{ role: 'user', content: userQuery }];

  try {
    const aiResponse = await getVertexAiCompletion(messages, modelName);
    return aiResponse;
  } catch (error) {
    console.error('Error in getChatResponse:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

module.exports = {
  getChatResponse, 
  // You might also export getVertexAiCompletion if other services or parts need direct access
  // to the lower-level Vertex AI interaction without the 'userQuery' abstraction.
};