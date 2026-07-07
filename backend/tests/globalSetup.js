/**
 * Jest globalSetup - runs once, in the main Jest process, before any test
 * file executes. Ensures the dedicated test database exists, has the full
 * current schema (via the same migration + model-sync scripts used for real
 * deployments), and starts from a clean, empty state on every run.
 *
 * See tests/env.setup.js for the hard "must be a *_test database" guard -
 * that guard is re-checked here too since globalSetup runs in a separate
 * process context from setupFiles.
 */
const path = require('path');
const { execFileSync } = require('child_process');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.resolve(__dirname, '../.env.test'), override: true });

module.exports = async function globalSetup() {
  const dbUrl = process.env.DATABASE_URL;
  const dbName = new URL(dbUrl).pathname.replace(/^\//, '');

  if (!/test/i.test(dbName)) {
    throw new Error(`Refusing to run tests: DATABASE_URL resolves to "${dbName}", not a *_test database.`);
  }

  const u = new URL(dbUrl);
  const adminConn = await mysql.createConnection({
    host: u.hostname,
    port: u.port || 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
  });
  // DROP + recreate (not just CREATE IF NOT EXISTS): sync() only ever issues
  // CREATE TABLE IF NOT EXISTS, so it silently does nothing to a table that
  // already exists in some stale/partial shape (e.g. left over from an
  // earlier interrupted test run, or a run that used to also apply
  // migrations on top). Starting from a fully dropped database on every run
  // is the only way to guarantee the schema always matches the current
  // models exactly. Safe here specifically because dbName is guaranteed to
  // contain "test" (checked above) - never do this against a real database.
  await adminConn.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
  await adminConn.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
  await adminConn.end();

  const backendDir = path.resolve(__dirname, '..');
  const env = { ...process.env, DATABASE_URL: dbUrl };

  // Build the schema via sync ONLY (not the migration runner). sync()
  // builds the complete, currently-correct schema straight from the
  // Sequelize models in one shot. Running the full migration chain
  // afterward is not just redundant but actively breaks: several
  // migrations (e.g. 20260604_013_task_enhancements.sql) are plain `ALTER
  // TABLE ADD COLUMN` with no information_schema guard, because they were
  // only ever meant to evolve a real, already-existing, older-shape
  // database (which is what happens in production) - never a database that
  // started from absolute zero. Against a table sync() just created with
  // the modern shape already, those same ALTERs fail with "Duplicate
  // column name". Tests that need specific migration-seeded rows (e.g.
  // default NotificationRules) should seed them directly, the same way
  // tests/helpers/seedRole.js seeds Role/Permission/RolePermission.
  execFileSync('node', ['scripts/sync-models.js'], { cwd: backendDir, env, stdio: 'pipe' });
};
