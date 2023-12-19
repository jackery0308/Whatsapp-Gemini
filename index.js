const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config()

const client = new Client();

client.on('qr', (qr) => {
  qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
  console.log('Client is ready!');
});

client.initialize();

// Set Gemini API key from environment variable
const genAI = new GoogleGenerativeAI(process.env.Gemini_API_KEY);

client.on('message', message => {
  console.log(message.from.toString() + ":");
  console.log(message.body);

  runCompletion(message.body.substring(1)).then(result => message.reply(result));  
});
 
async function runCompletion (message) {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro"});

  try {
    const result = await model.generateContent(message);
    const response = await result.response;

    // Check for successful generation
    if (response.promptFeedback.blockReason == null) {
      const text = response.text();
      console.log(text);
      return text;
    } else {
      // Handle specific error types
      if (response.promptFeedback.blockReason === "SAFETY") {
        console.error("Text blocked due to safety concerns. Please rephrase your prompt.");
        return "Your request generated content that violates safety guidelines. Please try again with a different prompt.";
      } else if (response.promptFeedback.blockReason === "MODEL_UNAVAILABLE") {
        console.error("Model unavailable. Please try again later.");
        return "The model is currently unavailable. Please try again later.";
      } else {
        // General error handling
        console.error("Generation failed", response.error);
        return `An error occurred while generating content: ${response.error.message}`;
      }
    }
  } catch (Ex) {
    console.error(Ex);
    return `Unexpected error: ${Ex.message}`;
  }
}