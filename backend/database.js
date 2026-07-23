const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const dialect = process.env.DB_DIALECT || 'mysql';
const logging = false;
const dbPassword = process.env.DB_PASSWORD || process.env.DB_ROOT_PASSWORD;

function parseHostFromUrl(rawUrl) {
  try {
    return new URL(rawUrl).hostname;
  } catch (_err) {
    return null;
  }
}

function shouldUseDbUrl() {
  const rawUrl = (process.env.DATABASE_URL || '').trim();
  if (!rawUrl) return false;

  const host = parseHostFromUrl(rawUrl);
  const hasDbParts = Boolean(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER);
  const inDocker = process.env.DB_HOST === 'db';
  const isPlaceholderOrLoopback = ['host', 'localhost', '127.0.0.1'].includes(host);

  // In containerized deployments, DB_* should win when DATABASE_URL is a placeholder
  // or points to loopback, which is not the database container.
  if (inDocker && hasDbParts && isPlaceholderOrLoopback) {
    return false;
  }

  return true;
}

const sequelize = shouldUseDbUrl()
  ? new Sequelize(process.env.DATABASE_URL, { dialect, logging })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      dbPassword,
      {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        dialect,
        logging,
      }
    );

module.exports = sequelize;