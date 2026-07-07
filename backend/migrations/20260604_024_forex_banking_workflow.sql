-- Migration: 20260604_024_forex_banking_workflow.sql
-- Implements the Phase 2 Forex & Banking Workflow (§7) — FX conversions/
-- settlements with a maker-checker approval gate before execution (mirrors
-- the BudgetLine revision workflow's separation-of-duties rule).

CREATE TABLE IF NOT EXISTS `forex_transactions` (
    `id`               INT AUTO_INCREMENT PRIMARY KEY,
    `reference`        VARCHAR(255) NULL,
    `transactionType`  ENUM('Spot', 'Forward', 'Transfer') NOT NULL DEFAULT 'Spot',
    `fromCurrency`     ENUM('GHS', 'USD') NOT NULL DEFAULT 'USD',
    `toCurrency`       ENUM('GHS', 'USD') NOT NULL DEFAULT 'GHS',
    `amount`           DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `rate`             DECIMAL(12, 6) NOT NULL DEFAULT 0,
    `bank`             VARCHAR(255) NULL,
    `valueDate`        DATETIME NULL,
    `settlementDate`   DATETIME NULL,
    `purpose`          TEXT NULL,
    `status`           ENUM('Draft', 'PendingApproval', 'Approved', 'Rejected', 'Settled') NOT NULL DEFAULT 'Draft',
    `requestedById`    INT NULL,
    `requestedAt`      DATETIME NULL,
    `approvedById`     INT NULL,
    `approvedAt`       DATETIME NULL,
    `settledById`      INT NULL,
    `settledAt`        DATETIME NULL,
    `decisionComment`  TEXT NULL,
    `createdAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_forex_requestedBy` FOREIGN KEY (`requestedById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_forex_approvedBy` FOREIGN KEY (`approvedById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_forex_settledBy` FOREIGN KEY (`settledById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_forex_settlement` (`settlementDate`)
);
