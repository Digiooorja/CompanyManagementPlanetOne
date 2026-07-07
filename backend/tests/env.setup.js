/**
 * Jest setupFiles entry - runs before the test framework is installed and
 * before any test file's own top-level requires. Loads backend/.env.test
 * (overriding anything already in process.env) and then applies a hard
 * safety guard before any test can touch a database.
 *
 * IMPORTANT: this project previously had a live dev database accidentally
 * overwritten by a careless script (see /memories/repo/known-bugs-and-
 * conventions.md for the postmortem). The automated test suite creates,
 * truncates and deletes data freely - it must be structurally incapable of
 * ever pointing at anything other than a dedicated test database.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.test'), override: true });

const dbName = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, '');

if (!/test/i.test(dbName)) {
  throw new Error(
    `Refusing to run tests: DATABASE_URL resolves to database "${dbName}", which does not look like a ` +
    `dedicated test database (expected the name to contain "test"). Fix backend/.env.test before running tests.`
  );
}
