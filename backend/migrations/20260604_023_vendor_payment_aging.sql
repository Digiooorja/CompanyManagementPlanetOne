-- Migration: 20260604_023_vendor_payment_aging.sql
-- Implements the Phase 2 Vendor Payment Aging tracker (§7) — outstanding
-- vendor invoices with aging buckets (0-30/31-60/61-90/90+), computed at the
-- application layer (see backend/models/VendorInvoice.js VIRTUAL fields).

CREATE TABLE IF NOT EXISTS `vendor_invoices` (
    `id`             INT AUTO_INCREMENT PRIMARY KEY,
    `vendor`         VARCHAR(255) NOT NULL,
    `invoiceNumber`  VARCHAR(255) NULL,
    `blockId`        INT NULL,
    `financeId`      INT NULL,
    `invoiceDate`    DATETIME NULL,
    `dueDate`        DATETIME NULL,
    `amount`         DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `currency`       ENUM('GHS', 'USD') NOT NULL DEFAULT 'USD',
    `amountPaid`     DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `status`         ENUM('Open', 'PartiallyPaid', 'Paid', 'Disputed') NOT NULL DEFAULT 'Open',
    `notes`          TEXT NULL,
    `createdAt`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_vendorinvoices_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_vendorinvoices_finance` FOREIGN KEY (`financeId`) REFERENCES `finances` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_vendorinvoices_due` (`dueDate`)
);
