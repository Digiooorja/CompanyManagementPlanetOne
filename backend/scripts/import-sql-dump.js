/**
 * Import SQL Dump
 * ================
 * Creates a target MySQL database (if missing) and executes a raw .sql dump
 * file against it in one shot, using mysql2's `multipleStatements` option
 * (no local `mysql` CLI required).
 *
 * Usage:
 *   node scripts/import-sql-dump.js <dumpFilePath> <databaseName>
 *
 * Reads connection host/user/password from DATABASE_URL in the repo root's .env
 * (only host/user/password/port are reused - the database name is
 * overridden by the <databaseName> argument so this never touches the
 * database currently configured in .env).
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
  const [, , dumpFilePath, databaseName] = process.argv;

  if (!dumpFilePath || !databaseName) {
    console.error('Usage: node scripts/import-sql-dump.js <dumpFilePath> <databaseName>');
    process.exit(1);
  }

  const resolvedPath = path.resolve(dumpFilePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Dump file not found: ${resolvedPath}`);
    process.exit(1);
  }

  const baseUrl = new URL(process.env.DATABASE_URL);
  const host = baseUrl.hostname;
  const port = baseUrl.port || 3306;
  const user = decodeURIComponent(baseUrl.username);
  const password = decodeURIComponent(baseUrl.password);

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);
  const adminConn = await mysql.createConnection({ host, port, user, password });
  await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
  await adminConn.end();
  console.log(`Database \`${databaseName}\` ready.`);

  let sql = fs.readFileSync(resolvedPath, 'utf8');

  // IMPORTANT: mysqldump files can embed their own `CREATE DATABASE ...;`
  // and `USE \`somedb\`;` statements (e.g. when dumped with --databases).
  // Executing those verbatim would silently redirect every subsequent
  // statement to whatever database name is baked into the dump, ignoring
  // the <databaseName> argument entirely. Strip them so this import always
  // targets the database we were explicitly told to use.
  sql = sql.replace(/^\s*CREATE DATABASE[^;]*;\s*$/gim, '').replace(/^\s*USE\s+`?[\w-]+`?\s*;\s*$/gim, '');

  console.log(`Importing ${path.basename(resolvedPath)} into \`${databaseName}\`... (this may take a moment)`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database: databaseName,
    multipleStatements: true,
  });

  try {
    await conn.query(sql);
    console.log('Import complete.');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
