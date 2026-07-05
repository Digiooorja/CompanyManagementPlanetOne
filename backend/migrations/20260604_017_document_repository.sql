-- Migration: 20260604_017_document_repository.sql
-- Implements the remaining Requirements §5.5 gaps (Document Repository &
-- Version Control): category, block/tag organisation, "Awaiting Response
-- From" + due date, confidentiality restricted to named roles, an owner for
-- the delete business rule, and alignment of `status` to the spec's
-- Draft/Under Review/Final/Superseded set.
-- (OCR/full-text search and recoverable soft-delete/subscriber notification
-- are intentionally deferred — not part of this migration.)
--
-- This migration is IDEMPOTENT: some columns/FKs may already have been
-- created by an earlier Sequelize sync, so every DDL is guarded against
-- information_schema and only applied when actually missing. MySQL 8.0 has
-- no ADD COLUMN IF NOT EXISTS, hence the SET/PREPARE/EXECUTE pattern.

-- ---------------------------------------------------------------------------
-- Column: blockId
-- ---------------------------------------------------------------------------
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents' AND COLUMN_NAME = 'blockId');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `documents` ADD COLUMN `blockId` INT NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- Column: ownerId
-- ---------------------------------------------------------------------------
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents' AND COLUMN_NAME = 'ownerId');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `documents` ADD COLUMN `ownerId` INT NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- Column: category
-- ---------------------------------------------------------------------------
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents' AND COLUMN_NAME = 'category');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `documents` ADD COLUMN `category` ENUM(''Contract'', ''Letter'', ''Notice'', ''Report'', ''Other'') NOT NULL DEFAULT ''Other''', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- Column: tags
-- ---------------------------------------------------------------------------
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents' AND COLUMN_NAME = 'tags');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `documents` ADD COLUMN `tags` TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- Column: awaitingResponseFrom
-- ---------------------------------------------------------------------------
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents' AND COLUMN_NAME = 'awaitingResponseFrom');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `documents` ADD COLUMN `awaitingResponseFrom` VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- Column: responseDueDate
-- ---------------------------------------------------------------------------
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents' AND COLUMN_NAME = 'responseDueDate');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `documents` ADD COLUMN `responseDueDate` DATETIME NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- Column: confidentialityLevel
-- ---------------------------------------------------------------------------
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents' AND COLUMN_NAME = 'confidentialityLevel');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `documents` ADD COLUMN `confidentialityLevel` ENUM(''Public'', ''Internal'', ''Confidential'') NOT NULL DEFAULT ''Public''', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- Column: allowedRoles
-- ---------------------------------------------------------------------------
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents' AND COLUMN_NAME = 'allowedRoles');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `documents` ADD COLUMN `allowedRoles` TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- Foreign key: fk_documents_block (blockId -> blocks.id)
-- ---------------------------------------------------------------------------
SET @exists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents' AND CONSTRAINT_NAME = 'fk_documents_block');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `documents` ADD CONSTRAINT `fk_documents_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- Foreign key: fk_documents_owner (ownerId -> users.id)
-- ---------------------------------------------------------------------------
SET @exists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents' AND CONSTRAINT_NAME = 'fk_documents_owner');
SET @ddl := IF(@exists = 0, 'ALTER TABLE `documents` ADD CONSTRAINT `fk_documents_owner` FOREIGN KEY (`ownerId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- Align the status ENUM to the spec set (Draft/Under Review/Final/Superseded).
-- Done in three steps so it is safe under strict SQL mode AND idempotent:
--   1. Widen the ENUM to a UNION of the legacy and new values — you cannot
--      UPDATE a row to a value that is not yet part of the ENUM definition
--      (strict mode raises "Data truncated"), so the legacy values must stay
--      valid while we remap.
--   2. Remap the legacy values to their spec equivalents.
--   3. Narrow the ENUM to the final spec set (every row is remapped by now).
-- Re-running on an already-migrated table is harmless: step 1 transiently
-- re-adds unused legacy values, the UPDATEs match nothing, step 3 restores.
-- ---------------------------------------------------------------------------
ALTER TABLE `documents` MODIFY COLUMN `status` ENUM('Approved', 'Review', 'Rejected', 'Draft', 'Under Review', 'Final', 'Superseded') DEFAULT 'Draft';

UPDATE `documents` SET `status` = 'Final' WHERE `status` = 'Approved';
UPDATE `documents` SET `status` = 'Under Review' WHERE `status` = 'Review';
UPDATE `documents` SET `status` = 'Draft' WHERE `status` = 'Rejected';

ALTER TABLE `documents` MODIFY COLUMN `status` ENUM('Draft', 'Under Review', 'Final', 'Superseded') DEFAULT 'Draft';

-- ---------------------------------------------------------------------------
-- Index: responseDueDate (skipped if the column is already indexed)
-- ---------------------------------------------------------------------------
SET @exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents' AND COLUMN_NAME = 'responseDueDate');
SET @ddl := IF(@exists = 0, 'CREATE INDEX `idx_documents_responseDueDate` ON `documents` (`responseDueDate`)', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- Index: blockId (skipped if already indexed — the FK above auto-creates one)
-- ---------------------------------------------------------------------------
SET @exists := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents' AND COLUMN_NAME = 'blockId');
SET @ddl := IF(@exists = 0, 'CREATE INDEX `idx_documents_blockId` ON `documents` (`blockId`)', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
