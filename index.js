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

  const result = await model.generateContent(message);
  const response = await result.response;
  const text = response.text();
  console.log(text);
  return text;
}