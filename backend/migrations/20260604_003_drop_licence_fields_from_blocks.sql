-- Migration: 20260604_003_drop_licence_fields_from_blocks.sql
-- Removes deprecated licenceStart and licenceExpiry columns from blocks.
-- Uses IF EXISTS so the migration can be re-run safely.

ALTER TABLE `blocks`
	DROP COLUMN IF EXISTS `licenceStart`;

ALTER TABLE `blocks`
	DROP COLUMN IF EXISTS `licenceExpiry`;
