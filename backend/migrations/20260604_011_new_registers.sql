-- Migration: 20260604_011_new_registers.sql
-- Adds the five remaining Innate/Phase-1 register modules from the
-- Requirements Document: Contract Register (§5.11), Compliance & Statutory
-- Payments Tracker (§5.7), PC/GNPC Correspondence Log (§5.14), Decision Log
-- (§5.13) and Operations Update (§5.12).

CREATE TABLE IF NOT EXISTS `contracts` (
    `id`                      INT AUTO_INCREMENT PRIMARY KEY,
    `title`                   VARCHAR(255) NOT NULL,
    `counterparty`            VARCHAR(255) NULL,
    `contractType`            ENUM('Service', 'JV', 'Rig', 'Supply', 'Other') NOT NULL DEFAULT 'Service',
    `blockId`                 INT NULL,
    `effectiveDate`           DATETIME NULL,
    `expiryDate`              DATETIME NULL,
    `value`                   DECIMAL(15, 2) NULL DEFAULT 0,
    `renewalNoticePeriodDays` INT NULL,
    `autoRenew`               TINYINT(1) NOT NULL DEFAULT 0,
    `owner`                   VARCHAR(255) NULL,
    `status`                  ENUM('Draft', 'Active', 'Expired', 'Terminated', 'Renewed') NOT NULL DEFAULT 'Draft',
    `notes`                   TEXT NULL,
    `createdAt`               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_contracts_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_contracts_expiry` (`expiryDate`)
);

CREATE TABLE IF NOT EXISTS `compliance_obligations` (
    `id`                  INT AUTO_INCREMENT PRIMARY KEY,
    `description`         VARCHAR(255) NOT NULL,
    `regulatoryBody`      VARCHAR(255) NULL,
    `category`            ENUM('Tax', 'Licence Fee', 'Royalty', 'Filing', 'Other') NOT NULL DEFAULT 'Other',
    `frequency`           ENUM('One-off', 'Monthly', 'Quarterly', 'Annual') NOT NULL DEFAULT 'One-off',
    `blockId`             INT NULL,
    `dueDate`             DATETIME NULL,
    `amountDue`           DECIMAL(15, 2) NULL DEFAULT 0,
    `amountPaid`          DECIMAL(15, 2) NULL DEFAULT 0,
    `paymentDate`         DATETIME NULL,
    `referenceNo`         VARCHAR(255) NULL,
    `evidenceDocumentId`  INT NULL,
    `status`              ENUM('Pending', 'Paid', 'Overdue', 'Closed') NOT NULL DEFAULT 'Pending',
    `responsibleOfficer`  VARCHAR(255) NULL,
    `createdAt`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_compliance_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_compliance_evidence` FOREIGN KEY (`evidenceDocumentId`) REFERENCES `documents` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_compliance_due` (`dueDate`)
);

CREATE TABLE IF NOT EXISTS `correspondences` (
    `id`               INT AUTO_INCREMENT PRIMARY KEY,
    `direction`        ENUM('Inbound', 'Outbound') NOT NULL,
    `date`             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `fromParty`        VARCHAR(255) NULL,
    `toParty`          VARCHAR(255) NULL,
    `regulator`        VARCHAR(255) NULL,
    `subject`          VARCHAR(255) NOT NULL,
    `referenceNo`      VARCHAR(255) NULL,
    `summary`          TEXT NULL,
    `blockId`          INT NULL,
    `awaitingResponse` TINYINT(1) NOT NULL DEFAULT 0,
    `responseDueDate`  DATETIME NULL,
    `documentId`       INT NULL,
    `status`           ENUM('Open', 'Closed') NOT NULL DEFAULT 'Open',
    `createdAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_correspondence_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_correspondence_document` FOREIGN KEY (`documentId`) REFERENCES `documents` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_correspondence_response_due` (`responseDueDate`)
);

CREATE TABLE IF NOT EXISTS `decisions` (
    `id`                INT AUTO_INCREMENT PRIMARY KEY,
    `date`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `meetingContext`    VARCHAR(255) NULL,
    `description`       TEXT NOT NULL,
    `decisionMakers`    VARCHAR(255) NULL,
    `rationale`         TEXT NULL,
    `linkedRiskId`      INT NULL,
    `linkedActivityId`  INT NULL,
    `linkedTaskId`      INT NULL,
    `status`            ENUM('Open', 'In Progress', 'Closed') NOT NULL DEFAULT 'Open',
    `createdAt`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_decisions_risk` FOREIGN KEY (`linkedRiskId`) REFERENCES `risks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_decisions_activity` FOREIGN KEY (`linkedActivityId`) REFERENCES `activities` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_decisions_task` FOREIGN KEY (`linkedTaskId`) REFERENCES `tasks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `operations_updates` (
    `id`                     INT AUTO_INCREMENT PRIMARY KEY,
    `date`                   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `blockId`                INT NULL,
    `wellName`               VARCHAR(255) NULL,
    `author`                 VARCHAR(255) NULL,
    `summary`                TEXT NOT NULL,
    `keyIssues`              TEXT NULL,
    `nextSteps`              TEXT NULL,
    `attachmentDocumentIds`  TEXT NULL,
    `createdAt`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_opsupdate_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_opsupdate_date` (`date`)
);

-- Link documents to their governing contract (mirrors the existing licenceId pattern)
ALTER TABLE `documents`
ADD COLUMN `contractId` INT NULL,
ADD CONSTRAINT `fk_documents_contract` FOREIGN KEY (`contractId`) REFERENCES `contracts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Allow Task to represent Decision Log follow-up action items
ALTER TABLE `tasks` MODIFY COLUMN `relatedType` ENUM (
    'Activity',
    'Workflow',
    'Document',
    'Project',
    'Decision',
    'General'
) DEFAULT 'General';
