const { evaluateRules } = require('./notificationEngine');

let timer = null;

// Starts the periodic sweep that evaluates all active NotificationRules and
// arms/re-arms/escalates Notification rows. Runs once immediately, then on
// the configured interval (default: hourly).
function startNotificationScheduler(intervalMs = 60 * 60 * 1000) {
  if (timer) return timer;

  evaluateRules().catch((err) => console.error('[notification-engine] initial run failed:', err.message));

  timer = setInterval(() => {
    evaluateRules().catch((err) => console.error('[notification-engine] scheduled run failed:', err.message));
  }, intervalMs);

  // Do not keep the process alive solely for this timer (helps tests/CLI scripts exit cleanly).
  if (typeof timer.unref === 'function') timer.unref();

  return timer;
}

function stopNotificationScheduler() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { startNotificationScheduler, stopNotificationScheduler };
