-- Migration: 20260604_026_hse_register.sql
-- Implements the Phase 2 HSE Register (§7) — incident lifecycle with a
-- corrective-action closure gate (rootCause + correctiveAction required to
-- close, mirrors the AFE reconciliation-sign-off pattern) and the raw
-- counts needed for TRIR/LTIF safety metrics (GET /api/hse/metrics).

CREATE TABLE IF NOT EXISTS `hse_incidents` (
    `id`               INT AUTO_INCREMENT PRIMARY KEY,
    `blockId`          INT NULL,
    `incidentType`     ENUM('Injury', 'NearMiss', 'Spill', 'Observation', 'Fire', 'Other') NOT NULL DEFAULT 'Observation',
    `severity`         ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Low',
    `occurredAt`       DATETIME NULL,
    `location`         VARCHAR(255) NULL,
    `description`      TEXT NULL,
    `reportedBy`       VARCHAR(255) NULL,
    `immediateAction`  TEXT NULL,
    `rootCause`        TEXT NULL,
    `correctiveAction` TEXT NULL,
    `actionOwner`      VARCHAR(255) NULL,
    `actionDueDate`    DATETIME NULL,
    `status`           ENUM('Open', 'UnderInvestigation', 'ActionPending', 'Closed') NOT NULL DEFAULT 'Open',
    `manHoursLost`     DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `isRecordable`     TINYINT(1) NOT NULL DEFAULT 0,
    `closedById`       INT NULL,
    `closedAt`         DATETIME NULL,
    `createdAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_hseincidents_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_hseincidents_closedBy` FOREIGN KEY (`closedById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_hseincidents_status` (`status`),
    INDEX `idx_hseincidents_actiondue` (`actionDueDate`)
);

-- Additive, idempotent: link uploaded evidence/photos back to an incident
-- (mirrors Document.contractId — see backend/models/Document.js).
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents' AND COLUMN_NAME = 'hseIncidentId');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `documents` ADD COLUMN `hseIncidentId` INT NULL, ADD CONSTRAINT `fk_documents_hseIncidentId` FOREIGN KEY (`hseIncidentId`) REFERENCES `hse_incidents` (`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
