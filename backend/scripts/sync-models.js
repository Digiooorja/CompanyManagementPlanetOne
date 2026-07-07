/**
 * Sync Models (one-shot)
 * ======================
 * Registers every Sequelize model (same list as server.js) and calls
 * sequelize.sync() once, then exits. Unlike running the real server, this
 * does NOT start Express, the notification scheduler, or listen on a port -
 * it only creates whatever tables are missing from the target database
 * (existing tables/rows are left untouched, since sync() is called without
 * `alter`/`force`).
 *
 * Use this against a target DB that has already had `run-migrations.js`
 * applied, so that models with NO dedicated migration file (Contract,
 * ComplianceObligation, Correspondence, Decision, Role, Permission,
 * RolePermission, NotificationRule, etc.) get their tables created too.
 *
 * Usage (PowerShell):
 *   $env:DATABASE_URL="mysql://root:pass@localhost:3306/<targetDb>"; node scripts/sync-models.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const sequelize = require('../database');

require('../models/Project');
require('../models/Activity');
require('../models/Block');
require('../models/Document');
require('../models/Finance');
require('../models/Notification');
require('../models/NotificationRule');
require('../models/Register');
require('../models/Report');
require('../models/ReportDefinition');
require('../models/Risk');
require('../models/RiskMatrixSetting');
require('../models/User');
require('../models/Workflow');
require('../models/Department');
require('../models/Comment');
require('../models/Task');
require('../models/AuditLog');
require('../models/Contract');
require('../models/ComplianceObligation');
require('../models/Correspondence');
require('../models/Decision');
require('../models/OperationsUpdate');
require('../models/BudgetLine');
require('../models/Role');
require('../models/Permission');
require('../models/RolePermission');
require('../models/InsurancePolicy');
require('../models/EnvironmentalPermit');
require('../models/Nda');
require('../models/DataRoomGrant');
require('../models/VendorInvoice');
require('../models/ForexTransaction');
require('../models/LocalContentRecord');
require('../models/HseIncident');
require('../models/HseExposureRecord');

async function main() {
  console.log(`Syncing models against ${process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@')} ...`);
  await sequelize.sync();
  console.log('Sync complete (only missing tables were created).');
  await sequelize.close();
}

main().catch((err) => {
  console.error('Sync failed:', err.message);
  process.exit(1);
});
