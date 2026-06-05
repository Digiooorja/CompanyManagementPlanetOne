-- Migration: 20260604_007_add_licence_to_documents.sql
-- Adds licenceId foreign key to link documents to a specific licence.
-- Also extends the documentType ENUM to include 'Licence' and 'Legal'.

ALTER TABLE `documents`
ADD COLUMN `licenceId` INT NULL,
ADD CONSTRAINT `fk_documents_licence` FOREIGN KEY (`licenceId`) REFERENCES `licences` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `documents` MODIFY COLUMN `documentType` ENUM (
    'Technical',
    'HSE',
    'Finance',
    'Report',
    'Licence',
    'Legal'
) DEFAULT 'Report';