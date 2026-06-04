/**
 * Migration Runner
 * ================
 * Applies all pending SQL migration files from the ../migrations/ directory
 * in alphabetical (chronological) order.
 *
 * Usage:
 *   node backend/scripts/run-migrations.js
 *
 * How it works:
 *   1. Creates a `_migrations` tracking table if it does not exist.
 *   2. Reads all .sql files from the migrations/ folder, sorted alphabetically.
 *   3. Skips any file already recorded in the tracking table.
 *   4. Runs each new file as a transaction — if a file fails, it rolls back
 *      and stops. Already-applied migrations are never re-run.
 *
 * Naming convention for migration files:
 *   YYYYMMDD_NNN_description.sql
 *   e.g. 20260604_001_create_licences_table.sql
 */

const path = require('path');
const fs = require('fs');
const sequelize = require('../database');

const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.\n');

    // Step 1: Ensure the tracking table exists
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        filename    VARCHAR(255) NOT NULL UNIQUE,
        applied_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Migration tracking table ready.\n');

    // Step 2: Find which migrations have already been applied
    const [appliedRows] = await sequelize.query(
      'SELECT filename FROM _migrations ORDER BY applied_at ASC'
    );
    const appliedSet = new Set(appliedRows.map((r) => r.filename));

    // Step 3: Read all .sql files from the migrations directory
    const allFiles = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort(); // alphabetical = chronological if named with date prefix

    const pending = allFiles.filter((f) => !appliedSet.has(f));

    if (pending.length === 0) {
      console.log('All migrations are already applied. Nothing to do.');
      await sequelize.close();
      return;
    }

    console.log(`Found ${pending.length} pending migration(s):\n`);

    // Step 4: Run each pending migration inside a transaction
    for (const filename of pending) {
      const filePath = path.join(MIGRATIONS_DIR, filename);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Split on semicolons to handle multi-statement files
      // Filter out empty strings from splitting
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      const transaction = await sequelize.transaction();
      try {
        console.log(`  Applying: ${filename}`);
        for (const statement of statements) {
          await sequelize.query(statement, { transaction });
        }

        // Record this migration as applied
        await sequelize.query(
          'INSERT INTO _migrations (filename) VALUES (?)',
          { replacements: [filename], transaction }
        );

        await transaction.commit();
        console.log(`  Applied:  ${filename} ✓\n`);
      } catch (err) {
        await transaction.rollback();
        console.error(`\n  FAILED:   ${filename}`);
        console.error(`  Error:    ${err.message}`);
        console.error('\n  Migration stopped. Fix the error above and re-run.\n');
        await sequelize.close();
        process.exit(1);
      }
    }

    console.log('All pending migrations applied successfully.');
    await sequelize.close();
  } catch (err) {
    console.error('Migration runner error:', err.message);
    process.exit(1);
  }
}

run();
