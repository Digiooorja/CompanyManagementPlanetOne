-- Migration: 20260604_030_notification_rule_department.sql
-- Adds department-scoped targeting to the Notification & Alert Engine
-- (Requirements §10.4): when a NotificationRule has a departmentId set, the
-- engine's fallback "no specific record owner" broadcast (previously always
-- org-wide Admin/Manager) is restricted to users in that department who also
-- hold the module's new `<module>.notify` RBAC permission (see the
-- accompanying permission seeds in server.js).
--
-- Idempotent (information_schema-guarded), safe to re-run.

SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notification_rules' AND COLUMN_NAME = 'departmentId');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `notification_rules` ADD COLUMN `departmentId` INT NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
