<div align="center">

# 🤖 Personal AI Assistant

**A self-hosted, brutally honest AI accountability assistant — running 24/7 on Google Cloud, accessible via Telegram.**

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?style=flat-square&logo=google&logoColor=white)
![GCP](https://img.shields.io/badge/GCP-e2--micro-FF6F00?style=flat-square&logo=googlecloud&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram-Bot-26A5E4?style=flat-square&logo=telegram&logoColor=white)
![Cost](https://img.shields.io/badge/Hosting%20Cost-%240%2Fmonth-brightgreen?style=flat-square)

</div>

---

## What Is This?

This is a personal AI assistant that lives in your Telegram. It's not a polite chatbot — it's designed to keep you disciplined, manage your schedule, and hold you accountable for your tasks and commitments.

It runs 24/7 on a free Google Cloud VM, uses Google's Gemini 2.5 Flash model (free tier), and integrates directly with your Google Calendar and Google Tasks so it always knows what you have coming up.

---

## Features

### AI Chat
• Powered by **Gemini 2.5 Flash** — fast, smart, free
• Maintains **conversation memory** across messages within a session
• Brutally honest system prompt — it will call you out if you're slacking
• Responds in seconds from anywhere in the world

### Voice Messages
• Send a voice note on Telegram and the bot transcribes it automatically using Gemini's native audio understanding
• Replies to what you said — no extra setup needed

### Google Calendar Integration
• Read today's events: `/today`
• Read upcoming events: `/upcoming`
• Ask naturally: *"what do I have this week?"*
• Get real calendar data injected into AI context so answers are accurate
• Automatically reminds you **30 minutes** and **10 minutes** before any event

### Google Tasks Integration
• View all pending tasks: `/tasks`
• Add a task: `/addtask Buy groceries`
• Complete a task: `/done Buy groceries`
• Ask naturally: *"what tasks do I have pending?"*

### Proactive Reminders
• **Event reminders** — bot messages you 30 min and 10 min before calendar events automatically
• **Daily briefing** — every morning at 8am, bot sends your full day: events + pending tasks
• No setup needed after initial Google auth — it just works

### Accountability Mode
• The assistant is configured to be direct and honest, not polite for the sake of it
• If you tell it you'll do something, it knows. If you ask about your tasks and haven't done them, it will say so.

---

## Architecture

```
You (Telegram)
      │
      ▼
Telegram Bot API
      │
      ▼
GCP e2-micro VM (us-central1) — running 24/7, always free
      │
      ├──▶ Google Gemini 2.5 Flash API  (AI responses + voice transcription)
      ├──▶ Google Calendar API          (read/write events)
      └──▶ Google Tasks API             (read/write tasks)

PM2 process manager → auto-restarts on crash or reboot
systemd integration → survives VM reboots
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| AI Model | Google Gemini 2.5 Flash (free tier) |
| Messaging | Telegram Bot API |
| Calendar | Google Calendar API v3 |
| Tasks | Google Tasks API v1 |
| Auth | Google OAuth2 (Desktop app flow) |
| Hosting | GCP Compute Engine e2-micro |
| Process Manager | PM2 + systemd |
| Scheduler | node-cron |

---

## Cost Breakdown

| Service | Cost |
|---|---|
| GCP e2-micro (us-central1) | **$0/month** — always free tier |
| 20GB standard persistent disk | **$0/month** — within free tier |
| Gemini 2.5 Flash API | **$0/month** — free tier |
| Google Calendar API | **$0/month** — free |
| Google Tasks API | **$0/month** — free |
| Telegram Bot API | **$0/month** — free |
| **Total** | **$0/month** |

> The GCP always-free tier covers 1 e2-micro instance + 30GB disk in us-central1, us-east1, or us-west1 permanently — no expiry.

---

## Setup Guide

### Prerequisites

• A [Google Cloud account](https://cloud.google.com) (free)
• A [Gemini API key](https://aistudio.google.com) (free)
• A Telegram bot token from [@BotFather](https://t.me/botfather)
• Your Telegram user ID from [@userinfobot](https://t.me/userinfobot)
• Google OAuth2 credentials from GCP Console

### 1. Clone and install

```bash
git clone https://github.com/adnannazir900/personal-ai-bot.git
cd personal-ai-bot
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
nano .env  # fill in your keys
```

### 3. Add Google OAuth credentials

Download your OAuth2 JSON from GCP Console (APIs & Services → Credentials → OAuth 2.0 Client IDs) and place it at:

```bash
~/client.json
```

### 4. Start the bot

```bash
node src/index.js
```

### 5. Connect Google account

Send `/auth` to your bot on Telegram. Click the link, approve permissions, then send the code back:

```
/code YOUR_AUTHORIZATION_CODE
```

### 6. Deploy with PM2 (production)

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Bot Commands

| Command | Description |
|---|---|
| `/today` | Show today's calendar events |
| `/upcoming` | Show next 10 calendar events |
| `/tasks` | Show all pending tasks |
| `/addtask TITLE` | Add a new task |
| `/done TITLE` | Mark a task as complete |
| `/auth` | Connect your Google account |
| `/code CODE` | Submit Google OAuth code |
| `/clear` | Reset conversation memory |
| `/help` | Show all commands |

> You can also chat naturally — *"what do I have tomorrow?"*, *"remind me I have a meeting at 3pm"*, *"what tasks haven't I done yet?"*

---

## Environment Variables

See `.env.example` for all required and optional variables.

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google AI Studio API key |
| `TELEGRAM_TOKEN` | Yes | Telegram bot token from @BotFather |
| `TELEGRAM_ALLOWED_IDS` | Yes | Your Telegram user ID (restricts access) |
| `SYSTEM_PROMPT` | No | Override the default AI personality |
| `MAX_HISTORY_TURNS` | No | Conversation turns to remember (default: 20) |
| `PORT` | No | Server port (default: 3000) |

---

## Project Structure

```
personal-ai-bot/
├── src/
│   ├── index.js              # Entry point, Express server
│   ├── ai.js                 # Gemini API integration + conversation memory
│   ├── logger.js             # Colour-coded terminal logger
│   ├── google-auth.js        # OAuth2 flow for Google APIs
│   ├── google-services.js    # Calendar + Tasks API calls
│   ├── reminders.js          # Cron-based proactive reminders
│   └── channels/
│       └── telegram.js       # Telegram bot + message handling
├── .env.example              # Environment variable template
├── ecosystem.config.js       # PM2 process config
├── package.json
└── README.md
```

---

## Security Notes

• Bot is locked to your Telegram user ID via `TELEGRAM_ALLOWED_IDS` — nobody else can interact with it
• API keys are stored in `.env` on the VM — never committed to Git
• Google OAuth token stored locally at `~/google-token.json` — also excluded from Git
• `.gitignore` covers all sensitive files

---

## Built By

**Adnan Nazir** — Cloud Computing & DevOps  
[GitHub](https://github.com/adnannazir900)

