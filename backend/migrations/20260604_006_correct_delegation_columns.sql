-- Migration: 20260604_006_correct_delegation_columns.sql
-- Correctly adds delegation columns to the 'finances' table.
-- Previous migrations 004 and 005 silently failed because ALTER TABLE
-- with IF NOT EXISTS does not error on non-existent tables in MariaDB.

ALTER TABLE `finances`
  ADD COLUMN IF NOT EXISTS `delegatedTo` VARCHAR(255) NULL COMMENT 'Name or dept currently holding this AFE',
  ADD COLUMN IF NOT EXISTS `delegationHistory` LONGTEXT NULL COMMENT 'JSON append-only log of delegation actions';
