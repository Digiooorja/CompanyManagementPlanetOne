-- Migration: 20260604_016_afe_tracking.sql
-- Implements Requirements §5.10 (AFE Tracking — Actuals vs. Authorised):
-- authorised (existing `amount`) vs. committed vs. actual-to-date with
-- variance, a supplementary-AFE chain, payment-to-AFE linkage for automatic
-- actuals aggregation, and reconciliation sign-off on closure.

ALTER TABLE `finances`
ADD COLUMN `afeId` INT NULL,
ADD COLUMN `parentAfeId` INT NULL,
ADD COLUMN `supplementNumber` INT NOT NULL DEFAULT 0,
ADD COLUMN `committedAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
ADD COLUMN `actualToDate` DECIMAL(15, 2) NOT NULL DEFAULT 0,
ADD COLUMN `variancePercent` DECIMAL(8, 2) NOT NULL DEFAULT 0,
ADD COLUMN `approvalDate` DATETIME NULL,
ADD COLUMN `approvingAuthority` VARCHAR(255) NULL,
ADD COLUMN `reconciledById` INT NULL,
ADD COLUMN `reconciledAt` DATETIME NULL,
ADD CONSTRAINT `fk_finances_afeId` FOREIGN KEY (`afeId`) REFERENCES `finances` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT `fk_finances_parentAfeId` FOREIGN KEY (`parentAfeId`) REFERENCES `finances` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT `fk_finances_reconciledById` FOREIGN KEY (`reconciledById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `finances` MODIFY COLUMN `status` ENUM (
    'Pending',
    'Under Review',
    'Approved',
    'Paid',
    'Rejected',
    'Closed'
) DEFAULT 'Pending';

CREATE INDEX `idx_finances_afeId` ON `finances` (`afeId`);
CREATE INDEX `idx_finances_parentAfeId` ON `finances` (`parentAfeId`);
