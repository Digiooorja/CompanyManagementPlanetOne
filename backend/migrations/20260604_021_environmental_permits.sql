-- Migration: 20260604_021_environmental_permits.sql
-- Implements the Phase 2 Environmental Permit Tracker (§7) — EPA Ghana
-- permits/approvals with renewal deadlines. Same expiry-countdown shape as
-- the Contract/Insurance registers.

CREATE TABLE IF NOT EXISTS `environmental_permits` (
    `id`            INT AUTO_INCREMENT PRIMARY KEY,
    `permitNumber`  VARCHAR(255) NOT NULL,
    `permitType`    ENUM('EIA', 'EPAPermit', 'DischargeConsent', 'WasteDisposal', 'Other') NOT NULL DEFAULT 'EPAPermit',
    `regulator`     VARCHAR(255) NOT NULL DEFAULT 'EPA Ghana',
    `blockId`       INT NULL,
    `issueDate`     DATETIME NULL,
    `expiryDate`    DATETIME NULL,
    `conditions`    TEXT NULL,
    `owner`         VARCHAR(255) NULL,
    `status`        ENUM('Active', 'Expired', 'Suspended', 'Renewed') NOT NULL DEFAULT 'Active',
    `notes`         TEXT NULL,
    `createdAt`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_envpermits_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_envpermits_expiry` (`expiryDate`)
);

-- Additive, idempotent: link uploaded permit documents back to a permit
-- (mirrors Document.contractId — see backend/models/Document.js).
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents' AND COLUMN_NAME = 'environmentalPermitId');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `documents` ADD COLUMN `environmentalPermitId` INT NULL, ADD CONSTRAINT `fk_documents_environmentalPermitId` FOREIGN KEY (`environmentalPermitId`) REFERENCES `environmental_permits` (`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
