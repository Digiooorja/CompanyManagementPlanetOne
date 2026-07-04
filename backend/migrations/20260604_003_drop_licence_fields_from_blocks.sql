-- Migration: 20260604_003_drop_licence_fields_from_blocks.sql
-- Removes the deprecated licenceStart and licenceExpiry columns from the blocks table.
-- Licences are now fully managed in the separate 'licences' table with M:N mapping.

ALTER TABLE blocks
  DROP COLUMN licenceStart,
  DROP COLUMN licenceExpiry;
