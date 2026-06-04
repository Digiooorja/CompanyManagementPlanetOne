-- Migration: 20260604_001_create_licences_table.sql
-- Creates the licences table for tracking regulatory licences,
-- permits, and contracts across concession blocks.
--
-- Design notes:
--   - blockIds stored as TEXT (JSON array) to allow one licence
--     to cover multiple blocks, consistent with the activityIds
--     pattern in the documents table.
--   - Status uses only administrative states: Active, Suspended, Renewed.
--     Expiry is derived from expiryDate at the application layer, not stored.

CREATE TABLE IF NOT EXISTS licences (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  licenceNumber   VARCHAR(255) NOT NULL,
  licenceType     ENUM('Exploration', 'Production', 'Environmental', 'Drilling', 'Contract') NOT NULL DEFAULT 'Exploration',
  blockIds        TEXT NULL COMMENT 'JSON array of block IDs covered by this licence',
  issuedBy        VARCHAR(255) NULL COMMENT 'Regulatory authority or government body',
  startDate       DATETIME NULL,
  expiryDate      DATETIME NULL,
  status          ENUM('Active', 'Suspended', 'Renewed') NOT NULL DEFAULT 'Active',
  notes           TEXT NULL COMMENT 'Renewal conditions, special clauses, regulatory requirements',
  createdAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
