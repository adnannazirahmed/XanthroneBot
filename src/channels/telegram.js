/**
 * Telegram channel
 * Features:
 *  - Text messages → AI reply
 *  - Voice messages → Groq Whisper STT → AI reply
 *  - /clear command to reset conversation history
 *  - User allowlist (TELEGRAM_ALLOWED_IDS in .env)
 */

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { chat, transcribeAudio, clearHistory } = require('../ai');
const { log } = require('../logger');

async function startTelegram() {
  const token = process.env.TELEGRAM_TOKEN;
  const allowedIds = (process.env.TELEGRAM_ALLOWED_IDS || '')
    .split(',').map(s => s.trim()).filter(Boolean);

  const bot = new TelegramBot(token, { polling: true });
  const me = await bot.getMe();
  log('OK', `Telegram bot connected (@${me.username})`);

  function isAllowed(userId) {
    if (!allowedIds.length) return true; // no restriction if list is empty
    return allowedIds.includes(String(userId));
  }

  async function sendTyping(chatId) {
    try { await bot.sendChatAction(chatId, 'typing'); } catch (_) {}
  }

  // ── Text messages ────────────────────────────────────────────────────────
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!isAllowed(userId)) {
      log('WARN', `Telegram: blocked user ${userId}`);
      return;
    }

    // /clear command
    if (msg.text?.startsWith('/clear')) {
      clearHistory(`telegram:${userId}`);
      await bot.sendMessage(chatId, '✓ Conversation history cleared.');
      return;
    }

    // /help command
    if (msg.text?.startsWith('/help') || msg.text?.startsWith('/start')) {
      await bot.sendMessage(chatId, `👋 Personal AI Assistant\n\nSend any message or voice note and I'll reply.\n\n/clear — reset conversation memory\n/help — show this message`);
      return;
    }

    // Voice message
    if (msg.voice) {
      await sendTyping(chatId);
      log('MSG', `Telegram · user:${userId} → voice message, transcribing...`);
      try {
        const fileId = msg.voice.file_id;
        const fileInfo = await bot.getFile(fileId);
        const url = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const audioBuffer = Buffer.from(response.data);
        const transcription = await transcribeAudio(audioBuffer, 'audio/ogg');
        log('STT', `Whisper transcribed: "${transcription.slice(0, 80)}..."`);
        await sendTyping(chatId);
        const reply = await chat(transcription, `telegram:${userId}`);
        await bot.sendMessage(chatId, `🎤 _"${transcription}"_\n\n${reply}`, { parse_mode: 'Markdown' });
      } catch (err) {
        log('ERR', `Voice processing failed: ${err.message}`);
        await bot.sendMessage(chatId, '❌ Could not process voice message. Please try again.');
      }
      return;
    }

    // Regular text
    if (msg.text) {
      log('MSG', `Telegram · user:${userId} → "${msg.text.slice(0, 60)}"`);
      await sendTyping(chatId);
      try {
        const reply = await chat(msg.text, `telegram:${userId}`);
        await bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
      } catch (err) {
        log('ERR', `Chat failed: ${err.message}`);
        await bot.sendMessage(chatId, '❌ Something went wrong. Please try again.');
      }
    }
  });

  bot.on('polling_error', (err) => {
    log('ERR', `Telegram polling error: ${err.message}`);
  });
}

module.exports = { startTelegram };
