const { google } = require('googleapis');
const { getAuthorizedClient } = require('./google-auth');
const { log } = require('./logger');

// ── Calendar ──────────────────────────────────────────────────────────────────

async function getUpcomingEvents(maxResults) {
  if (!maxResults) maxResults = 10;
  const auth = getAuthorizedClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return res.data.items || [];
}

async function createEvent(summary, startDateTime, endDateTime, description) {
  const auth = getAuthorizedClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const event = {
    summary: summary,
    description: description || '',
    start: { dateTime: startDateTime, timeZone: 'Africa/Nairobi' },
    end: { dateTime: endDateTime, timeZone: 'Africa/Nairobi' },
  };
  const res = await calendar.events.insert({ calendarId: 'primary', resource: event });
  log('OK', 'Calendar event created: ' + summary);
  return res.data;
}

async function getTodayEvents() {
  const auth = getAuthorizedClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });
  return res.data.items || [];
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

async function getTasks() {
  const auth = getAuthorizedClient();
  const tasks = google.tasks({ version: 'v1', auth });
  const listsRes = await tasks.tasklists.list();
  const lists = listsRes.data.items || [];
  if (!lists.length) return [];
  const taskListId = lists[0].id;
  const res = await tasks.tasks.list({
    tasklist: taskListId,
    showCompleted: false,
    maxResults: 20,
  });
  return res.data.items || [];
}

async function createTask(title, notes, due) {
  const auth = getAuthorizedClient();
  const tasks = google.tasks({ version: 'v1', auth });
  const listsRes = await tasks.tasklists.list();
  const lists = listsRes.data.items || [];
  const taskListId = lists[0].id;
  const task = { title: title };
  if (notes) task.notes = notes;
  if (due) task.due = new Date(due).toISOString();
  const res = await tasks.tasks.insert({ tasklist: taskListId, resource: task });
  log('OK', 'Task created: ' + title);
  return res.data;
}

async function completeTask(taskTitle) {
  const auth = getAuthorizedClient();
  const tasks = google.tasks({ version: 'v1', auth });
  const listsRes = await tasks.tasklists.list();
  const taskListId = listsRes.data.items[0].id;
  const res = await tasks.tasks.list({ tasklist: taskListId, showCompleted: false });
  const allTasks = res.data.items || [];
  const match = allTasks.find(t => t.title.toLowerCase().includes(taskTitle.toLowerCase()));
  if (!match) return null;
  await tasks.tasks.patch({
    tasklist: taskListId,
    task: match.id,
    resource: { status: 'completed' }
  });
  log('OK', 'Task completed: ' + match.title);
  return match.title;
}

// ── Format helpers ────────────────────────────────────────────────────────────

function formatEvents(events) {
  if (!events.length) return 'No upcoming events found.';
  return events.map(e => {
    const start = e.start.dateTime || e.start.date;
    const date = new Date(start);
    const timeStr = e.start.dateTime
      ? date.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return timeStr + ' - ' + e.summary;
  }).join('\n');
}

function formatTasks(taskList) {
  if (!taskList.length) return 'No pending tasks.';
  return taskList.map((t, i) => {
    const due = t.due ? ' (due: ' + new Date(t.due).toLocaleDateString() + ')' : '';
    return (i + 1) + '. ' + t.title + due;
  }).join('\n');
}

module.exports = { getUpcomingEvents, createEvent, getTodayEvents, getTasks, createTask, completeTask, formatEvents, formatTasks };
