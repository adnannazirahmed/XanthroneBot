require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { log } = require('./logger');
const { chat } = require('./ai');
const { startTelegram } = require('./channels/telegram');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/status', (req, res) => {
  res.json({
    running: true,
    model: 'gemini-2.5-flash',
    channel: 'telegram',
    uptime: Math.floor(process.uptime()),
  });
});

app.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  try {
    const reply = await chat(message, 'http:test');
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  log('INFO', `Server started on port ${PORT}`);
  log('INFO', `AI model: gemini-2.5-flash via Google AI (free tier)`);

  if (process.env.TELEGRAM_TOKEN) {
    startTelegram().catch(err => log('ERR', `Telegram failed: ${err.message}`));
  } else {
    log('WARN', 'TELEGRAM_TOKEN not set — bot will not start');
  }
});
