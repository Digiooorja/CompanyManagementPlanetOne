/**
 * Merge Demo Data
 * ===============
 * Merges a full "dummy" demo dataset (SOURCE) into a real dataset (TARGET)
 * WITHOUT touching any table that already contains real data. Only tables
 * that are completely empty in TARGET ("gap" tables/functionality) get
 * populated - from SOURCE - so the demo can show real data where it exists
 * and rich, fully-populated demo data for every module the real dataset
 * doesn't cover yet (Risks, Contracts, Licences, Insurance, HSE, Forex,
 * Vendor Payments, Local Content, Correspondence, Decisions, NDAs, etc).
 *
 * How it decides what to do, per table (driven entirely by SOURCE's table
 * list + information_schema - nothing is hardcoded per-table):
 *   1. If TARGET already has 1+ rows in that table -> SKIP. Table (schema
 *      AND data) is left completely untouched. This is a "real data" table.
 *   2. Otherwise ("gap" table - missing or empty in TARGET):
 *        a. Recreate the table in TARGET using SOURCE's exact `SHOW CREATE
 *           TABLE` DDL (DROP TABLE IF EXISTS + CREATE), so schema drift
 *           between the two dumps (e.g. missing columns/tables from
 *           migrations that were never applied on the real DB) can't cause
 *           errors. Safe because the table has 0 rows in TARGET anyway.
 *        b. Copy every row from SOURCE, remapping any foreign-key column
 *           (discovered via SOURCE's information_schema constraints) that
 *           points at a "real data" table so it points at an ACTUAL real
 *           row instead of a dummy id that doesn't exist in TARGET. FK
 *           columns pointing at another "gap" table are left unchanged,
 *           since that table's original ids were preserved too.
 *
 * Prerequisites (see README block at bottom of this file for full runbook):
 *   - TARGET must already have the real backup restored AND be fully
 *     migrated / synced (run-migrations.js + sync-models.js) so every
 *     table SOURCE has also exists in TARGET (step 2a self-heals column-
 *     level drift, but relies on the table itself already existing so we
 *     have somewhere to DROP/CREATE - run sync-models.js first).
 *
 * Usage (PowerShell):
 *   $env:SOURCE_DATABASE_URL="mysql://root:pass@localhost:3306/planetone_dummy_src"
 *   $env:TARGET_DATABASE_URL="mysql://root:pass@localhost:3306/planetone_demo"
 *   node scripts/merge-demo-data.js
 */

const mysql = require('mysql2/promise');

// Seeded idempotently by server.js's startServer() on every boot
// (findOrCreate) - never hand-merge these, real app logic owns them.
const EXCLUDED_TABLES = new Set(['_migrations', 'roles', 'permissions', 'role_permissions', 'notification_rules']);

const BATCH_SIZE = 500;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var ${name}`);
    process.exit(1);
  }
  return value;
}

function dbNameFromUrl(url) {
  return new URL(url).pathname.replace(/^\//, '');
}

async function connect(url) {
  const u = new URL(url);
  return mysql.createConnection({
    host: u.hostname,
    port: u.port || 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
    multipleStatements: true,
  });
}

async function main() {
  const sourceUrl = requireEnv('SOURCE_DATABASE_URL');
  const targetUrl = requireEnv('TARGET_DATABASE_URL');
  const sourceDbName = dbNameFromUrl(sourceUrl);
  const targetDbName = dbNameFromUrl(targetUrl);

  console.log(`Source (dummy):  ${sourceDbName}`);
  console.log(`Target (real):   ${targetDbName}\n`);

  const source = await connect(sourceUrl);
  const target = await connect(targetUrl);

  try {
    // 1. All base tables in SOURCE (the dummy dataset defines the full set
    //    of tables/functionality we want represented in the merged result).
    const [tableRows] = await source.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
      [sourceDbName]
    );
    const allTables = tableRows.map((r) => r.TABLE_NAME).filter((t) => !EXCLUDED_TABLES.has(t));

    // 2. Foreign key map for SOURCE: table -> [{ column, refTable }]
    const [fkRows] = await source.query(
      `SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME
       FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
      [sourceDbName]
    );
    const fkMap = {};
    for (const row of fkRows) {
      if (!fkMap[row.TABLE_NAME]) fkMap[row.TABLE_NAME] = [];
      fkMap[row.TABLE_NAME].push({ column: row.COLUMN_NAME, refTable: row.REFERENCED_TABLE_NAME });
    }

    // 3. Classify each table as "real data" (skip) or "gap" (merge), and
    //    cache real target ids up front (before any DROP/CREATE happens).
    const hasRealData = new Set();
    const realIdCache = {};

    for (const table of allTables) {
      let count = 0;
      try {
        const [rows] = await target.query(`SELECT COUNT(*) AS c FROM \`${table}\``);
        count = rows[0].c;
      } catch (err) {
        count = 0; // table doesn't exist yet in target -> definitely a gap table
      }

      if (count > 0) {
        hasRealData.add(table);
        const [idRows] = await target.query(`SELECT id FROM \`${table}\` ORDER BY id`);
        realIdCache[table] = idRows.map((r) => r.id);
        console.log(`[SKIP - real data]  ${table} (${count} rows in target, left untouched)`);
      }
    }

    const gapTables = allTables.filter((t) => !hasRealData.has(t));

    // 4. Recreate gap tables in TARGET using SOURCE's exact DDL.
    await target.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of gapTables) {
      const [[ddlRow]] = await source.query(`SHOW CREATE TABLE \`${table}\``);
      const createSql = ddlRow['Create Table'];
      await target.query(`DROP TABLE IF EXISTS \`${table}\``);
      await target.query(createSql);
    }

    // 5. Copy rows for each gap table, remapping FKs that point at
    //    "real data" tables onto actual real ids.
    const summary = [];
    for (const table of gapTables) {
      const [rows] = await source.query(`SELECT * FROM \`${table}\``);
      if (rows.length === 0) {
        summary.push({ table, copied: 0, note: 'empty in source too' });
        continue;
      }

      const columns = Object.keys(rows[0]);
      const fks = fkMap[table] || [];
      const remapCols = fks.filter((fk) => hasRealData.has(fk.refTable));

      const values = rows.map((row) => {
        return columns.map((col) => {
          let value = row[col];
          if (value === null) return null;
          const remap = remapCols.find((fk) => fk.column === col);
          if (remap) {
            const ids = realIdCache[remap.refTable];
            if (ids && ids.length > 0) {
              const idx = Math.abs(Number(value) - 1) % ids.length;
              value = ids[idx];
            }
          }
          return value;
        });
      });

      const colList = columns.map((c) => `\`${c}\``).join(', ');
      for (let i = 0; i < values.length; i += BATCH_SIZE) {
        const batch = values.slice(i, i + BATCH_SIZE);
        await target.query(`INSERT INTO \`${table}\` (${colList}) VALUES ?`, [batch]);
      }

      summary.push({
        table,
        copied: rows.length,
        remappedColumns: remapCols.map((fk) => `${fk.column} -> ${fk.refTable}`),
      });
    }

    await target.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n--- Merge summary (gap tables populated from dummy data) ---');
    for (const s of summary) {
      const remapNote = s.remappedColumns && s.remappedColumns.length ? ` (remapped: ${s.remappedColumns.join(', ')})` : '';
      console.log(`[MERGED] ${s.table}: ${s.copied} rows${remapNote}`);
    }
    console.log('\nDone. Real-data tables above marked [SKIP] were left completely untouched.');
  } finally {
    await source.end();
    await target.end();
  }
}

main().catch((err) => {
  console.error('Merge failed:', err);
  process.exit(1);
});

/*
FULL RUNBOOK (PowerShell, run from backend/):

1. Import the real backup into a fresh working database:
   node scripts/import-sql-dump.js "../PlanetoneDashborad_backup04-07-2026.sql" planetone_demo

2. Import the dummy dataset into its own database (read-only source):
   node scripts/import-sql-dump.js "../PlanetoneDashborad_dummy.sql" planetone_dummy_src

3. Bring planetone_demo's schema fully up to date:
   $env:DATABASE_URL="mysql://root:<pass>@localhost:3306/planetone_demo"
   node scripts/run-migrations.js
   node scripts/sync-models.js

4. Run the merge (fills gap tables only, real data untouched):
   $env:SOURCE_DATABASE_URL="mysql://root:<pass>@localhost:3306/planetone_dummy_src"
   $env:TARGET_DATABASE_URL="mysql://root:<pass>@localhost:3306/planetone_demo"
   node scripts/merge-demo-data.js

5. Point backend/.env's DATABASE_URL at planetone_demo (or rename the
   database) once you're happy with the result, and restart the backend.
*/
