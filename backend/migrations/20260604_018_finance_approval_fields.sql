-- Migration: 20260604_018_finance_approval_fields.sql
-- Fixes a latent schema gap: `Finance.approvedBy` and `Finance.actionComment`
-- have existed in the Sequelize model (backend/models/Finance.js) and are
-- written to by backend/routes/finance.js (approve/reject/delegate actions)
-- since before the migration system was introduced, and are even present in
-- the very first baseline migration (20260604_000_init_baseline.sql) — but
-- that migration uses `CREATE TABLE IF NOT EXISTS`, which is a no-op on any
-- database where the `finances` table already existed (e.g. created earlier
-- via a plain `sequelize.sync()`). On such databases the columns were never
-- actually created, so approving/rejecting/delegating a Finance/AFE record
-- fails at runtime with "Unknown column 'approvedBy' in 'field list'".
--
-- This migration is idempotent (guarded via information_schema), so it is a
-- safe no-op on any database where the columns already exist.

SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finances' AND COLUMN_NAME = 'approvedBy');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `finances` ADD COLUMN `approvedBy` VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finances' AND COLUMN_NAME = 'actionComment');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `finances` ADD COLUMN `actionComment` TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
