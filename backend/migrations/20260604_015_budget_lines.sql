-- Migration: 20260604_015_budget_lines.sql
-- Implements Requirements §5.6 (Work Programme & Budget Tracker): line items
-- coupling planned/actual schedule with approved/committed/actual budget by
-- category, multi-currency, variance, and a maker-checker revision workflow.

CREATE TABLE IF NOT EXISTS `budget_lines` (
    `id`                      INT AUTO_INCREMENT PRIMARY KEY,
    `blockId`                 INT NOT NULL,
    `activityId`              INT NULL,
    `description`             VARCHAR(255) NOT NULL,
    `budgetCategory`          VARCHAR(255) NULL,
    `plannedStartDate`        DATETIME NULL,
    `plannedEndDate`          DATETIME NULL,
    `actualStartDate`         DATETIME NULL,
    `actualEndDate`           DATETIME NULL,
    `currency`                ENUM('GHS', 'USD') NOT NULL DEFAULT 'USD',
    `approvedBudget`          DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `committed`               DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `actualSpend`             DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `variancePercent`         DECIMAL(8, 2) NOT NULL DEFAULT 0,
    `responsiblePerson`       VARCHAR(255) NULL,
    `status`                  ENUM('Draft', 'Active', 'Closed') NOT NULL DEFAULT 'Draft',
    `revisionStatus`          ENUM('None', 'PendingApproval', 'Approved', 'Rejected') NOT NULL DEFAULT 'None',
    `pendingApprovedBudget`   DECIMAL(15, 2) NULL,
    `revisionRequestedById`   INT NULL,
    `revisionRequestedAt`     DATETIME NULL,
    `revisionDecidedById`     INT NULL,
    `revisionDecidedAt`       DATETIME NULL,
    `revisionComment`         TEXT NULL,
    `createdAt`               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_budgetlines_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_budgetlines_activity` FOREIGN KEY (`activityId`) REFERENCES `activities` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_budgetlines_requestedBy` FOREIGN KEY (`revisionRequestedById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_budgetlines_decidedBy` FOREIGN KEY (`revisionDecidedById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_budgetlines_block` (`blockId`),
    INDEX `idx_budgetlines_status` (`status`)
);
