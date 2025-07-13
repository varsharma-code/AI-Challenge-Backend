// demo.js

// Make sure dotenv is loaded ONCE at the application's entry point.
// For this standalone demo, we explicitly load it here.
// In your full Express app, this line would only be in server.js.
require('dotenv').config({ path: './.env' }); 

// Adjust the path if your services folder is not directly in the root
const { getChatResponse } = require('./services/vertexService');

async function runDemo() {
  const dummyPrompt = "Give me some info regarding Palo Alto networks. A paragraph of 100 words would work?";
  
  console.log(`Sending prompt to Vertex AI: "${dummyPrompt}"`);
  console.log('Fetching response...');

  try {
    const aiResponse = await getChatResponse(dummyPrompt);
    console.log('\n--- AI Response from Vertex AI ---');
    console.log(aiResponse);
    console.log('----------------------------------\n');
  } catch (error) {
    console.error('\nError fetching AI response:');
    console.error(error.message);
  }
}

// Execute the demo function
runDemo();