// controllers/chatController.js (UPDATED)

const { chatMessagesSchema } = require('../models/messageModel');
const vertexAiService = require('../services/vertexService'); // Use Vertex AI service

/**
 * Handles the POST request to /api/chat.
 * Validates the input messages, calls the Vertex AI service, and sends the AI's response.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
async function handleChatRequest(req, res) {
  const { error, value: messages } = chatMessagesSchema.validate(req.body.messages);

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      details: error.details.map(d => d.message),
    });
  }

  try {
    // Call the Vertex AI Service
    // You can pass the model name dynamically or use a default from the service itself
    const aiResponseContent = await vertexAiService.getVertexAiCompletion(messages, "gemini-2.5-flash-preview-05-20");

    res.status(200).json({
      success: true,
      message: 'AI response received successfully',
      data: {
        role: 'assistant', // Vertex AI models typically respond as 'assistant'
        content: aiResponseContent,
      },
    });

  } catch (error) {
    console.error('Error in chatController.handleChatRequest:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      details: error.message,
    });
  }
}

module.exports = {
  handleChatRequest,
};