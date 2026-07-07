-- Migration: 20260604_020_insurance_register.sql
-- Implements the Phase 2 Insurance Register (§7) — tracks insurance policies,
-- coverage and renewal deadlines across the portfolio. Structurally a clone
-- of the Contract Register (§5.11, migration 20260604_011_new_registers.sql).

CREATE TABLE IF NOT EXISTS `insurance_policies` (
    `id`                      INT AUTO_INCREMENT PRIMARY KEY,
    `policyNumber`            VARCHAR(255) NOT NULL,
    `insurer`                 VARCHAR(255) NULL,
    `broker`                  VARCHAR(255) NULL,
    `policyType`              ENUM('Property', 'Liability', 'WellControl', 'Marine', 'BusinessInterruption', 'Other') NOT NULL DEFAULT 'Other',
    `blockId`                 INT NULL,
    `coverageAmount`          DECIMAL(15, 2) NULL DEFAULT 0,
    `currency`                ENUM('GHS', 'USD') NOT NULL DEFAULT 'USD',
    `premium`                 DECIMAL(15, 2) NULL DEFAULT 0,
    `effectiveDate`           DATETIME NULL,
    `expiryDate`              DATETIME NULL,
    `renewalNoticePeriodDays` INT NULL,
    `owner`                   VARCHAR(255) NULL,
    `status`                  ENUM('Active', 'Expired', 'Cancelled', 'Renewed') NOT NULL DEFAULT 'Active',
    `notes`                   TEXT NULL,
    `createdAt`               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_insurance_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_insurance_expiry` (`expiryDate`)
);

-- Additive, idempotent: link uploaded policy documents back to a policy
-- (mirrors Document.contractId — see backend/models/Document.js).
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents' AND COLUMN_NAME = 'insurancePolicyId');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `documents` ADD COLUMN `insurancePolicyId` INT NULL, ADD CONSTRAINT `fk_documents_insurancePolicyId` FOREIGN KEY (`insurancePolicyId`) REFERENCES `insurance_policies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
