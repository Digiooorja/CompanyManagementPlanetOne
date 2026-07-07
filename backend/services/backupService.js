const fs = require('fs');
const path = require('path');
const mysqldump = require('mysqldump');

// Automated DB backup for disaster recovery (Launch Readiness Checklist §1:
// "Backup / disaster-recovery plan"). Dumps the full schema + data to a
// timestamped .sql file using the pure-JS `mysqldump` package (connects via
// the mysql2 driver directly — no `mysqldump` CLI binary required on the
// host), optionally uploads it to the same S3 bucket already used for
// document storage, and prunes old local backups beyond a retention count.

const DEFAULT_RETENTION_COUNT = 14;
const DEFAULT_BACKUP_DIR = path.resolve(__dirname, '..', 'backups');

function getBackupDir() {
  const dir = process.env.DB_BACKUP_DIR ? path.resolve(process.env.DB_BACKUP_DIR) : DEFAULT_BACKUP_DIR;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Splits DATABASE_URL (mysql://user:pass@host:port/dbname) into the
// connection fields `mysqldump` expects, so we don't need a second set of
// DB_* env vars duplicating what's already in DATABASE_URL.
function parseDatabaseUrl(databaseUrl) {
  const url = new URL(databaseUrl);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, '')
  };
}

function backupFileName(databaseName) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${databaseName}-${stamp}.sql`;
}

function listBackups() {
  const dir = getBackupDir();
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => {
      const stat = fs.statSync(path.join(dir, f));
      return { name: f, sizeBytes: stat.size, createdAt: stat.mtime };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Deletes the oldest backup files beyond `retentionCount`. Pure filesystem
// logic — safe to unit test without touching a real database.
function pruneOldBackups(dir, retentionCount = DEFAULT_RETENTION_COUNT) {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime); // newest first

  const toDelete = files.slice(Math.max(retentionCount, 0));
  for (const file of toDelete) {
    fs.unlinkSync(path.join(dir, file.name));
  }
  return toDelete.map((f) => f.name);
}

// Uploads a backup file to S3 for off-server disaster recovery. Reuses the
// same AWS_* credentials/bucket already configured for document storage
// (backend/routes/documents.js) — a separate DB_BACKUP_S3_PREFIX just keeps
// backups in their own "folder" within that bucket. Best-effort: never
// throws, since a missing/misconfigured bucket must not fail the local
// backup that already succeeded.
async function uploadToS3(filePath, fileName) {
  const bucket = process.env.AWS_STORAGE_BUCKET_NAME || process.env.AWS_S3_BUCKET || process.env.S3_BUCKET;
  if (!bucket || !process.env.AWS_ACCESS_KEY_ID) {
    return { uploaded: false, reason: 'not-configured' };
  }

  try {
    const AWS = require('aws-sdk');
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_S3_REGION_NAME || process.env.AWS_REGION
    });
    const prefix = process.env.DB_BACKUP_S3_PREFIX || 'db-backups/';
    const body = fs.readFileSync(filePath);
    await s3.putObject({ Bucket: bucket, Key: `${prefix}${fileName}`, Body: body }).promise();
    return { uploaded: true };
  } catch (err) {
    console.error('[db-backup] S3 upload failed:', err.message);
    return { uploaded: false, reason: err.message };
  }
}

// Runs one full backup: dump -> (optional) S3 upload -> prune old local
// copies. Never throws — a failed backup is logged so it doesn't crash the
// scheduler or the server (same best-effort philosophy as the Notification
// Engine's Email channel).
async function runBackup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('[db-backup] DATABASE_URL is not set — skipping backup.');
    return { ok: false, reason: 'no-database-url' };
  }

  let conn;
  try {
    conn = parseDatabaseUrl(databaseUrl);
  } catch (err) {
    console.error('[db-backup] could not parse DATABASE_URL:', err.message);
    return { ok: false, reason: 'invalid-database-url' };
  }

  const dir = getBackupDir();
  const fileName = backupFileName(conn.database);
  const filePath = path.join(dir, fileName);

  try {
    await mysqldump({ connection: conn, dumpToFile: filePath });
  } catch (err) {
    console.error('[db-backup] mysqldump failed:', err.message);
    return { ok: false, reason: err.message };
  }

  const s3Result = await uploadToS3(filePath, fileName);
  const retentionCount = Number(process.env.DB_BACKUP_RETENTION_COUNT) || DEFAULT_RETENTION_COUNT;
  const pruned = pruneOldBackups(dir, retentionCount);

  console.log(
    `[db-backup] backup complete: ${fileName}` +
      `${s3Result.uploaded ? ' (uploaded to S3)' : ''}` +
      `${pruned.length ? `, pruned ${pruned.length} old backup(s)` : ''}`
  );

  return { ok: true, fileName, filePath, s3Uploaded: s3Result.uploaded, pruned };
}

// Runs a backup only if the most recent existing backup is older than
// `intervalMs` (or none exists yet) — keeps a real daily(ish) cadence
// without re-dumping on every dev-server restart (nodemon).
async function runBackupIfDue(intervalMs) {
  const existing = listBackups();
  if (existing.length > 0) {
    const ageMs = Date.now() - new Date(existing[0].createdAt).getTime();
    if (ageMs < intervalMs) return { ok: true, skipped: true };
  }
  return runBackup();
}

module.exports = {
  runBackup,
  runBackupIfDue,
  listBackups,
  pruneOldBackups,
  parseDatabaseUrl,
  getBackupDir
};
