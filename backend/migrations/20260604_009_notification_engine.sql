-- Migration: 20260604_009_notification_engine.sql
-- Extends `notifications` with fields required by the shared Notification &
-- Alert Engine (Requirements §5.2 / §10) and creates the admin-configurable
-- `notification_rules` table (§10.4).

ALTER TABLE `notifications`
ADD COLUMN `module` VARCHAR(255) NULL,
ADD COLUMN `entityType` VARCHAR(255) NULL,
ADD COLUMN `entityId` VARCHAR(255) NULL,
ADD COLUMN `triggerType` ENUM('DateBased', 'ThresholdBased', 'StatusBased', 'Recurring', 'Manual') NOT NULL DEFAULT 'Manual',
ADD COLUMN `priority` ENUM('Critical', 'High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
ADD COLUMN `channels` TEXT NULL,
ADD COLUMN `status` ENUM('Pending', 'Acknowledged', 'Snoozed', 'Escalated', 'Dismissed') NOT NULL DEFAULT 'Pending',
ADD COLUMN `dueAt` DATETIME NULL,
ADD COLUMN `dedupeKey` VARCHAR(255) NULL,
ADD COLUMN `recurrenceIntervalHours` INT NULL,
ADD COLUMN `lastSentAt` DATETIME NULL,
ADD COLUMN `snoozeUntil` DATETIME NULL,
ADD COLUMN `snoozeReason` TEXT NULL,
ADD COLUMN `acknowledgedAt` DATETIME NULL,
ADD COLUMN `acknowledgedBy` INT NULL,
ADD COLUMN `escalatedAt` DATETIME NULL,
ADD COLUMN `escalatedToUserId` INT NULL,
ADD CONSTRAINT `fk_notifications_escalatedTo` FOREIGN KEY (`escalatedToUserId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX `idx_notifications_user_status` ON `notifications` (`userId`, `status`);
CREATE INDEX `idx_notifications_module_entity` ON `notifications` (`module`, `entityType`, `entityId`);
CREATE INDEX `idx_notifications_dedupeKey` ON `notifications` (`dedupeKey`);
CREATE INDEX `idx_notifications_status_priority` ON `notifications` (`status`, `priority`);

CREATE TABLE IF NOT EXISTS `notification_rules` (
    `id`                      INT AUTO_INCREMENT PRIMARY KEY,
    `name`                    VARCHAR(255) NOT NULL,
    `module`                  VARCHAR(255) NOT NULL,
    `triggerType`             ENUM('DateBased', 'ThresholdBased', 'StatusBased', 'Recurring') NOT NULL,
    `dateField`               VARCHAR(255) NULL,
    `leadTimeDays`            TEXT NULL,
    `thresholdField`          VARCHAR(255) NULL,
    `thresholdValues`         TEXT NULL,
    `statusField`             VARCHAR(255) NULL,
    `statusValue`             VARCHAR(255) NULL,
    `recurrenceIntervalHours` INT NULL DEFAULT 24,
    `escalationGraceHours`    INT NULL,
    `priority`                ENUM('Critical', 'High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
    `channels`                TEXT NULL,
    `messageTemplate`         VARCHAR(500) NULL,
    `active`                  TINYINT(1) NOT NULL DEFAULT 1,
    `createdAt`               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
