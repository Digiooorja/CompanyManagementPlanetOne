-- Migration: 20260604_027_report_definitions.sql
-- Wires the Reports page to real backend data instead of a hardcoded
-- frontend catalogue. `report_definitions` is the report catalogue (name,
-- category, frequency, format(s), block scope, last-generated date). The
-- pre-existing `reports` table (backend/models/Report.js) now optionally
-- links back to the definition it was generated from via `definitionId`.

CREATE TABLE IF NOT EXISTS `report_definitions` (
    `id`                INT AUTO_INCREMENT PRIMARY KEY,
    `name`              VARCHAR(255) NOT NULL,
    `category`          ENUM('Operations', 'Financial', 'HSE', 'Performance') NOT NULL DEFAULT 'Operations',
    `description`       VARCHAR(500) NULL,
    `frequency`         ENUM('Weekly', 'Monthly', 'Quarterly') NOT NULL DEFAULT 'Monthly',
    `formats`           JSON NOT NULL,
    `block`             VARCHAR(255) NULL DEFAULT 'All Blocks',
    `lastGeneratedDate` DATETIME NULL,
    `createdAt`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Additive, idempotent: link a generated report instance back to the
-- catalogue entry it was generated from.
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reports' AND COLUMN_NAME = 'definitionId');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `reports` ADD COLUMN `definitionId` INT NULL, ADD CONSTRAINT `fk_reports_definitionId` FOREIGN KEY (`definitionId`) REFERENCES `report_definitions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Seed the report catalogue (moves what was previously a hardcoded array in
-- frontend/src/app/pages/Reports.tsx into the database). Only seeds if the
-- table is empty so this stays safe to re-run against a DB that already has
-- Admin-managed report definitions. createdAt/updatedAt are set explicitly
-- (rather than relying on a DB-level default) because this table may have
-- already been created by sequelize.sync() before this migration runs, in
-- which case CREATE TABLE IF NOT EXISTS above is a no-op and Sequelize's own
-- schema does not add DB-level CURRENT_TIMESTAMP defaults for timestamps.
INSERT INTO `report_definitions` (`name`, `category`, `description`, `frequency`, `formats`, `block`, `lastGeneratedDate`, `createdAt`, `updatedAt`)
SELECT * FROM (SELECT
    'Monthly Production Report' AS name, 'Operations' AS category, 'Detailed production metrics for all blocks' AS description, 'Monthly' AS frequency, JSON_ARRAY('PDF', 'Excel') AS formats, 'All Blocks' AS block, '2026-05-01 09:00:00' AS lastGeneratedDate, NOW() AS createdAt, NOW() AS updatedAt
    UNION ALL SELECT 'Financial Summary Report', 'Financial', 'AFE status and budget variance analysis', 'Monthly', JSON_ARRAY('PDF', 'Excel'), 'All Blocks', '2026-05-01 09:00:00', NOW(), NOW()
    UNION ALL SELECT 'HSE Incident Report', 'HSE', 'Safety incidents and compliance status', 'Weekly', JSON_ARRAY('PDF'), 'All Blocks', '2026-04-30 09:00:00', NOW(), NOW()
    UNION ALL SELECT 'Well Performance Analysis', 'Operations', 'Production rates and well efficiency', 'Quarterly', JSON_ARRAY('PDF', 'Excel'), 'Block A, Block B', '2026-04-01 09:00:00', NOW(), NOW()
    UNION ALL SELECT 'Risk Assessment Summary', 'HSE', 'Active risks and mitigation status', 'Monthly', JSON_ARRAY('PDF'), 'All Blocks', '2026-04-30 09:00:00', NOW(), NOW()
    UNION ALL SELECT 'Project Progress Dashboard', 'Performance', 'All active projects status and completion', 'Weekly', JSON_ARRAY('PDF', 'Excel'), 'All Blocks', '2026-05-01 09:00:00', NOW(), NOW()
    UNION ALL SELECT 'Vendor Performance Report', 'Financial', 'Vendor payments and contract compliance', 'Quarterly', JSON_ARRAY('Excel'), 'All Blocks', '2026-04-01 09:00:00', NOW(), NOW()
    UNION ALL SELECT 'Compliance Status Report', 'HSE', 'Regulatory compliance and permit status', 'Monthly', JSON_ARRAY('PDF'), 'All Blocks', '2026-04-28 09:00:00', NOW(), NOW()
) AS seed_rows
WHERE NOT EXISTS (SELECT 1 FROM `report_definitions`);

