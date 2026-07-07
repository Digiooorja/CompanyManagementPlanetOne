const fs = require('fs');
const os = require('os');
const path = require('path');
const { runBackup, listBackups, pruneOldBackups, parseDatabaseUrl } = require('../services/backupService');

// Unit tests for the pure filesystem retention logic — no DB connection needed.
describe('backupService: pruneOldBackups', () => {
  let dir;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'db-backup-test-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('keeps only the newest N files and deletes the rest', () => {
    const names = ['a.sql', 'b.sql', 'c.sql', 'd.sql', 'e.sql'];
    names.forEach((name, i) => {
      fs.writeFileSync(path.join(dir, name), '-- dump');
      // Give each file a distinct, increasing mtime so ordering is deterministic.
      const time = new Date(Date.now() - (names.length - i) * 1000);
      fs.utimesSync(path.join(dir, name), time, time);
    });

    const removed = pruneOldBackups(dir, 2);

    expect(removed.sort()).toEqual(['a.sql', 'b.sql', 'c.sql'].sort());
    expect(fs.readdirSync(dir).sort()).toEqual(['d.sql', 'e.sql']);
  });

  test('does nothing when file count is within the retention limit', () => {
    fs.writeFileSync(path.join(dir, 'only.sql'), '-- dump');
    const removed = pruneOldBackups(dir, 14);
    expect(removed).toEqual([]);
    expect(fs.readdirSync(dir)).toEqual(['only.sql']);
  });

  test('ignores non-.sql files', () => {
    fs.writeFileSync(path.join(dir, 'notes.txt'), 'hello');
    const removed = pruneOldBackups(dir, 0);
    expect(removed).toEqual([]);
    expect(fs.readdirSync(dir)).toEqual(['notes.txt']);
  });
});

describe('backupService: parseDatabaseUrl', () => {
  test('extracts connection fields from a mysql:// URL', () => {
    const conn = parseDatabaseUrl('mysql://root:Yash1234@localhost:3306/planetonedashboard_test');
    expect(conn).toEqual({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'Yash1234',
      database: 'planetonedashboard_test'
    });
  });

  test('defaults port to 3306 when omitted', () => {
    const conn = parseDatabaseUrl('mysql://root:pw@localhost/mydb');
    expect(conn.port).toBe(3306);
  });
});

// Integration test: runs a REAL mysqldump against the guarded test database
// (env.setup.js already throws before this point if DATABASE_URL isn't a
// "*test*" database — see globalSetup.js). Verifies the dump-to-S3-to-prune
// pipeline actually produces a real, non-empty .sql file end-to-end.
describe('backupService: runBackup (integration)', () => {
  const originalDir = process.env.DB_BACKUP_DIR;
  let tempDir;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'db-backup-integration-'));
    process.env.DB_BACKUP_DIR = tempDir;
  });

  afterAll(() => {
    process.env.DB_BACKUP_DIR = originalDir;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('produces a real, non-empty .sql dump of the test database', async () => {
    const result = await runBackup();

    expect(result.ok).toBe(true);
    expect(fs.existsSync(result.filePath)).toBe(true);

    const contents = fs.readFileSync(result.filePath, 'utf8');
    expect(contents.length).toBeGreaterThan(0);
    // Sanity check: a real dump should reference at least one known table.
    expect(contents.toLowerCase()).toContain('create table');

    const backups = listBackups();
    expect(backups.some((b) => b.name === result.fileName)).toBe(true);
  }, 30000);
});
