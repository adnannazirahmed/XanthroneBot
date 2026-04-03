/**
 * AI module — Gemini 2.5 Flash (free tier via Google AI Studio)
 * Conversation history stored per user in memory (resets on restart).
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { log } = require('./logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Per-user conversation history
// Key: `${channel}:${userId}`  Value: array of {role, parts}
const histories = new Map();

const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT ||
  `You are a personal AI assistant. Be helpful, concise, and friendly.
Today's date is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;

const MODEL_NAME = 'gemini-2.5-flash';
const MAX_HISTORY = parseInt(process.env.MAX_HISTORY_TURNS || '20', 10);

/**
 * Send a message and get a reply. Maintains per-user history.
 * @param {string} userMessage
 * @param {string} userId - unique key like "telegram:123456"
 * @returns {Promise<string>} assistant reply
 */
async function chat(userMessage, userId = 'default') {
  if (!histories.has(userId)) histories.set(userId, []);
  const history = histories.get(userId);

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SYSTEM_PROMPT,
  });

  // Gemini history format: [{role: 'user'|'model', parts: [{text}]}]
  const geminiHistory = history.slice(-MAX_HISTORY);

  const chatSession = model.startChat({ history: geminiHistory });

  const start = Date.now();
  try {
    const result = await chatSession.sendMessage(userMessage);
    const reply = result.response.text();
    const ms = Date.now() - start;

    const usage = result.response.usageMetadata;
    const tokens = usage ? `${usage.totalTokenCount} tokens` : '';
    log('AI', `Gemini responded in ${ms}ms · ${tokens}`);

    // Save to history in Gemini format
    history.push({ role: 'user', parts: [{ text: userMessage }] });
    history.push({ role: 'model', parts: [{ text: reply }] });
    histories.set(userId, history.slice(-MAX_HISTORY));

    return reply;
  } catch (err) {
    log('ERR', `Gemini error: ${err.message}`);
    // Retry once on rate limit
    if (err.status === 429) {
      log('INFO', 'Rate limited — retrying in 3s...');
      await new Promise(r => setTimeout(r, 3000));
      return chat(userMessage, userId);
    }
    throw err;
  }
}

/**
 * Transcribe audio using Gemini (handles audio natively — no separate STT API needed)
 * @param {Buffer} audioBuffer
 * @param {string} mimeType - e.g. 'audio/ogg'
 * @returns {Promise<string>} transcription text
 */
async function transcribeAudio(audioBuffer, mimeType = 'audio/ogg') {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const audioBase64 = audioBuffer.toString('base64');

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: audioBase64,
        },
      },
      { text: 'Transcribe this audio message exactly as spoken. Return only the transcription text, nothing else.' },
    ]);

    const transcription = result.response.text().trim();
    log('STT', `Gemini transcribed: "${transcription.slice(0, 80)}"`);
    return transcription;
  } catch (err) {
    log('ERR', `Gemini transcription failed: ${err.message}`);
    throw err;
  }
}

/**
 * Clear conversation history for a user
 */
function clearHistory(userId) {
  histories.delete(userId);
  log('INFO', `History cleared for ${userId}`);
}

module.exports = { chat, transcribeAudio, clearHistory };
