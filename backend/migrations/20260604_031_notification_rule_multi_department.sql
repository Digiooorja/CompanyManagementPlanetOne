-- Migration: 20260604_031_notification_rule_multi_department.sql
-- Upgrades NotificationRule's department scoping from a single department
-- (`departmentId`, added in 20260604_030) to a JSON array (`departmentIds`),
-- so one module's notification rule can target multiple departments at once
-- (Requirements §10.4: "one module notification can be sent to multiple
-- department"). Backfills any existing single-department value into the new
-- array column, then drops the old column.
--
-- Idempotent (information_schema-guarded), safe to re-run.

SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notification_rules' AND COLUMN_NAME = 'departmentIds');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `notification_rules` ADD COLUMN `departmentIds` TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill: only runs if the old single-department column still exists (i.e.
-- this DB previously applied 20260604_030 before this migration replaced it).
SET @oldColumnExists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notification_rules' AND COLUMN_NAME = 'departmentId');
SET @backfillSql := IF(
  @oldColumnExists > 0,
  'UPDATE `notification_rules` SET `departmentIds` = CONCAT(''['', `departmentId`, '']'') WHERE `departmentId` IS NOT NULL AND (`departmentIds` IS NULL OR `departmentIds` = '''')',
  'SELECT 1'
);
PREPARE stmt FROM @backfillSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @dropSql := IF(@oldColumnExists > 0, 'ALTER TABLE `notification_rules` DROP COLUMN `departmentId`', 'SELECT 1');
PREPARE stmt FROM @dropSql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
