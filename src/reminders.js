const cron = require('node-cron');
const { getUpcomingEvents, isAuthorized } = require('./google-auth');
const { getUpcomingEvents: fetchEvents } = require('./google-services');
const { log } = require('./logger');

let botInstance = null;
let userChatId = null;

function init(bot, chatId) {
  botInstance = bot;
  userChatId = chatId;
  log('OK', 'Reminder scheduler started for chatId: ' + chatId);
}

async function sendReminder(message) {
  if (!botInstance || !userChatId) return;
  try {
    await botInstance.sendMessage(userChatId, message);
  } catch (err) {
    log('ERR', 'Failed to send reminder: ' + err.message);
  }
}

function start(bot, chatId) {
  init(bot, chatId);

  // Check every minute for upcoming events
  cron.schedule('* * * * *', async () => {
    try {
      const { isAuthorized } = require('./google-auth');
      if (!isAuthorized()) return;

      const events = await fetchEvents(20);
      const now = new Date();

      for (const event of events) {
        if (!event.start.dateTime) continue;
        const eventTime = new Date(event.start.dateTime);
        const diffMs = eventTime - now;
        const diffMins = Math.round(diffMs / 60000);

        // Remind 30 minutes before
        if (diffMins === 30) {
          await sendReminder('Reminder: "' + event.summary + '" starts in 30 minutes at ' +
            eventTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        }

        // Remind 10 minutes before
        if (diffMins === 10) {
          await sendReminder('Heads up: "' + event.summary + '" starts in 10 minutes!');
        }

        // Remind at event time
        if (diffMins === 0) {
          await sendReminder('Now: "' + event.summary + '" is starting right now!');
        }
      }
    } catch (err) {
      // Silent fail — Google auth might not be set up yet
    }
  });

  // Daily summary at 8am
  cron.schedule('0 8 * * *', async () => {
    try {
      const { isAuthorized } = require('./google-auth');
      if (!isAuthorized()) return;
      const { getTodayEvents, getTasks, formatEvents, formatTasks } = require('./google-services');
      const events = await getTodayEvents();
      const tasks = await getTasks();
      const msg = 'Good morning! Here is your day:\n\nCALENDAR:\n' +
        formatEvents(events) + '\n\nTASKS:\n' + formatTasks(tasks);
      await sendReminder(msg);
    } catch (err) {
      log('ERR', 'Daily summary failed: ' + err.message);
    }
  });

  log('OK', 'Cron jobs scheduled: event reminders + 8am daily summary');
}

module.exports = { start, sendReminder };
