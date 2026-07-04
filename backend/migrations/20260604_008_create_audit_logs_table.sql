-- Migration: 20260604_008_create_audit_logs_table.sql
-- Creates the immutable, append-only audit log table that captures every
-- create/update/delete across the system (Requirements §5.4).

CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id`         INT AUTO_INCREMENT PRIMARY KEY,
    `userId`     INT NULL,
    `userEmail`  VARCHAR(255) NULL,
    `userRole`   VARCHAR(255) NULL,
    `module`     VARCHAR(255) NOT NULL,
    `entityType` VARCHAR(255) NOT NULL,
    `entityId`   VARCHAR(255) NULL,
    `action`     ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    `oldValue`   LONGTEXT NULL,
    `newValue`   LONGTEXT NULL,
    `ipAddress`  VARCHAR(255) NULL,
    `createdAt`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_audit_module` (`module`),
    INDEX `idx_audit_entity` (`entityType`, `entityId`),
    INDEX `idx_audit_user` (`userId`),
    INDEX `idx_audit_action` (`action`),
    INDEX `idx_audit_created` (`createdAt`)
);
