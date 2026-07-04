-- Migration: 20260604_012_rbac_matrix.sql
-- Implements the configurable Role-Based Access Control matrix required by
-- Requirements §4: "development team should implement this as a configurable
-- role/permission matrix (not hard-coded) so Admin can adjust access without
-- a code change."

CREATE TABLE IF NOT EXISTS `roles` (
    `id`          INT AUTO_INCREMENT PRIMARY KEY,
    `name`        VARCHAR(100) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL,
    `isSystem`    TINYINT(1) NOT NULL DEFAULT 0,
    `createdAt`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `permissions` (
    `id`          INT AUTO_INCREMENT PRIMARY KEY,
    `key`         VARCHAR(150) NOT NULL UNIQUE,
    `module`      VARCHAR(150) NOT NULL,
    `description` VARCHAR(255) NULL,
    `createdAt`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `role_permissions` (
    `id`           INT AUTO_INCREMENT PRIMARY KEY,
    `roleId`       INT NOT NULL,
    `permissionId` INT NOT NULL,
    `createdAt`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `uq_role_permission` (`roleId`, `permissionId`)
);

-- User.role moves from a fixed ENUM to a free-form VARCHAR referencing
-- Role.name at the application layer — this is what lets Admin add new roles
-- (e.g. "Legal / Compliance Officer") without a schema migration each time.
ALTER TABLE `users` MODIFY COLUMN `role` VARCHAR(100) NOT NULL DEFAULT 'User';
