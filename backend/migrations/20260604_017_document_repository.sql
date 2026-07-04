-- Migration: 20260604_017_document_repository.sql
-- Implements the remaining Requirements §5.5 gaps (Document Repository &
-- Version Control): category, block/tag organisation, "Awaiting Response
-- From" + due date, confidentiality restricted to named roles, an owner for
-- the delete business rule, and alignment of `status` to the spec's
-- Draft/Under Review/Final/Superseded set.
-- (OCR/full-text search and recoverable soft-delete/subscriber notification
-- are intentionally deferred — not part of this migration.)

ALTER TABLE `documents`
ADD COLUMN `blockId` INT NULL,
ADD COLUMN `ownerId` INT NULL,
ADD COLUMN `category` ENUM('Contract', 'Letter', 'Notice', 'Report', 'Other') NOT NULL DEFAULT 'Other',
ADD COLUMN `tags` TEXT NULL,
ADD COLUMN `awaitingResponseFrom` VARCHAR(255) NULL,
ADD COLUMN `responseDueDate` DATETIME NULL,
ADD COLUMN `confidentialityLevel` ENUM('Public', 'Internal', 'Confidential') NOT NULL DEFAULT 'Public',
ADD COLUMN `allowedRoles` TEXT NULL,
ADD CONSTRAINT `fk_documents_block` FOREIGN KEY (`blockId`) REFERENCES `blocks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT `fk_documents_owner` FOREIGN KEY (`ownerId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Remap existing status values before narrowing the ENUM, so no rows are
-- silently truncated/nulled by the MODIFY COLUMN below.
UPDATE `documents` SET `status` = 'Final' WHERE `status` = 'Approved';
UPDATE `documents` SET `status` = 'Under Review' WHERE `status` = 'Review';
UPDATE `documents` SET `status` = 'Draft' WHERE `status` = 'Rejected';

ALTER TABLE `documents` MODIFY COLUMN `status` ENUM (
    'Draft',
    'Under Review',
    'Final',
    'Superseded'
) DEFAULT 'Draft';

CREATE INDEX `idx_documents_responseDueDate` ON `documents` (`responseDueDate`);
CREATE INDEX `idx_documents_blockId` ON `documents` (`blockId`);
