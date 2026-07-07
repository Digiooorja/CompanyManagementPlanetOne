-- Migration: 20260604_022_nda_data_room.sql
-- Implements the Phase 2 NDA & Data Room Tracker (§7) — NDAs with
-- counterparties, plus a bridge table tracking which data-room documents
-- each NDA's counterparty has been granted access to.

CREATE TABLE IF NOT EXISTS `ndas` (
    `id`             INT AUTO_INCREMENT PRIMARY KEY,
    `counterparty`   VARCHAR(255) NOT NULL,
    `ndaType`        ENUM('Mutual', 'OneWay', 'Standstill') NOT NULL DEFAULT 'Mutual',
    `purpose`        TEXT NULL,
    `blockId`        INT NULL,
    `effectiveDate`  DATETIME NULL,
    `expiryDate`     DATETIME NULL,
    `owner`          VARCHAR(255) NULL,
    `status`         ENUM('Draft', 'Active', 'Expired', 'Terminated') NOT NULL DEFAULT 'Draft',
    `notes`          TEXT NULL,
    `createdAt`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_ndas_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_ndas_expiry` (`expiryDate`)
);

CREATE TABLE IF NOT EXISTS `data_room_grants` (
    `id`          INT AUTO_INCREMENT PRIMARY KEY,
    `ndaId`       INT NOT NULL,
    `documentId`  INT NOT NULL,
    `accessLevel` ENUM('View', 'Download') NOT NULL DEFAULT 'View',
    `grantedAt`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `revokedAt`   DATETIME NULL,
    `createdAt`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_datarooomgrants_nda` FOREIGN KEY (`ndaId`) REFERENCES `ndas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_datarooomgrants_document` FOREIGN KEY (`documentId`) REFERENCES `documents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_datarooomgrants_nda` (`ndaId`)
);
