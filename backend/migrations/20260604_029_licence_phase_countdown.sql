-- Migration: 20260604_029_licence_phase_countdown.sql
-- Closes Requirements §5.9 "Licence Phase Countdown" (the last remaining
-- Phase 1 partial item per REQUIREMENTS_GAP_CHECKLIST.md): adds the phase
-- enum, phase start/end dates, minimum work obligation text, and the
-- audited sign-off fields for a controlled phase transition
-- (POST /api/licences/:id/transition-phase).
--
-- Idempotent (information_schema-guarded), safe to re-run.

SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'licences' AND COLUMN_NAME = 'phase');
SET @ddl := IF(@exists = 0, "ALTER TABLE `licences` ADD COLUMN `phase` ENUM('Exploration','Extension','Appraisal','Development','Production') NULL", 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'licences' AND COLUMN_NAME = 'phaseStartDate');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `licences` ADD COLUMN `phaseStartDate` DATETIME NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'licences' AND COLUMN_NAME = 'phaseEndDate');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `licences` ADD COLUMN `phaseEndDate` DATETIME NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'licences' AND COLUMN_NAME = 'minWorkObligation');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `licences` ADD COLUMN `minWorkObligation` TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'licences' AND COLUMN_NAME = 'phaseTransitionedById');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `licences` ADD COLUMN `phaseTransitionedById` INT NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'licences' AND COLUMN_NAME = 'phaseTransitionedAt');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `licences` ADD COLUMN `phaseTransitionedAt` DATETIME NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'licences' AND COLUMN_NAME = 'phaseTransitionComment');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `licences` ADD COLUMN `phaseTransitionComment` TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
