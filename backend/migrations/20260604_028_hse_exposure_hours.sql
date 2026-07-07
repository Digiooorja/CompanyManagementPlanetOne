-- Migration: 20260604_028_hse_exposure_hours.sql
-- Stores real exposure (man-)hours worked per block/period so TRIR/LTIF
-- (GET /api/hse/metrics) can be computed from recorded data instead of a
-- number typed into the UI ad-hoc on every page view (Requirements §7 HSE).

CREATE TABLE IF NOT EXISTS `hse_exposure_records` (
    `id`            INT AUTO_INCREMENT PRIMARY KEY,
    `blockId`       INT NULL,
    `periodLabel`   VARCHAR(100) NOT NULL,
    `periodStart`   DATE NULL,
    `periodEnd`     DATE NULL,
    `manHours`      DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `recordedById`  INT NULL,
    `notes`         TEXT NULL,
    `createdAt`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_hseexposure_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_hseexposure_recordedBy` FOREIGN KEY (`recordedById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_hseexposure_block` (`blockId`)
);
