-- Migration: 20260604_025_local_content_tracking.sql
-- Implements the Phase 2 Local Content Tracking module (§7) — Ghanaian
-- local-content commitments vs. actuals (spend/employment/procurement/
-- training/technology-transfer %) per block/period, for Petroleum
-- Commission reporting. `shortfallPercent` is computed at the application
-- layer (Sequelize VIRTUAL, see backend/models/LocalContentRecord.js), not
-- stored as a column.

CREATE TABLE IF NOT EXISTS `local_content_records` (
    `id`               INT AUTO_INCREMENT PRIMARY KEY,
    `blockId`          INT NULL,
    `period`           VARCHAR(32) NOT NULL,
    `metric`           ENUM('LocalSpend', 'LocalEmployment', 'LocalProcurement', 'Training', 'TechnologyTransfer') NOT NULL DEFAULT 'LocalSpend',
    `committedPercent` DECIMAL(8, 2) NOT NULL DEFAULT 0,
    `actualPercent`    DECIMAL(8, 2) NOT NULL DEFAULT 0,
    `committedValue`   DECIMAL(15, 2) NULL DEFAULT 0,
    `actualValue`      DECIMAL(15, 2) NULL DEFAULT 0,
    `currency`         ENUM('GHS', 'USD') NOT NULL DEFAULT 'GHS',
    `narrative`        TEXT NULL,
    `reportingStatus`  ENUM('Draft', 'Submitted', 'Approved') NOT NULL DEFAULT 'Draft',
    `regulator`        VARCHAR(255) NOT NULL DEFAULT 'Petroleum Commission',
    `createdAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_localcontent_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_localcontent_period` (`period`)
);
