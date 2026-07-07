const { runBackupIfDue } = require('./backupService');

let timer = null;

// Periodically checks (hourly by default) whether a full DB backup is due,
// per DB_BACKUP_INTERVAL_HOURS (default: 24h/daily). Mirrors
// notificationScheduler.js's "run once immediately, then on an interval"
// pattern — the "if due" check inside runBackupIfDue() is what prevents
// re-dumping on every dev-server restart.
function startBackupScheduler(intervalMs = 24 * 60 * 60 * 1000, checkEveryMs = 60 * 60 * 1000) {
  if (timer) return timer;

  runBackupIfDue(intervalMs).catch((err) => console.error('[db-backup] initial check failed:', err.message));

  timer = setInterval(() => {
    runBackupIfDue(intervalMs).catch((err) => console.error('[db-backup] scheduled check failed:', err.message));
  }, checkEveryMs);

  // Do not keep the process alive solely for this timer (helps tests/CLI scripts exit cleanly).
  if (typeof timer.unref === 'function') timer.unref();

  return timer;
}

function stopBackupScheduler() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { startBackupScheduler, stopBackupScheduler };
