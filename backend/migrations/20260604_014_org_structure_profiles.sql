-- Migration: 20260604_014_org_structure_profiles.sql
-- Implements the remaining Requirements §5.1 gaps (Organisation Structure &
-- Team Member Profiles): the profile data fields and the reporting-line
-- relationship that drives the auto-generated org chart.

ALTER TABLE `users`
ADD COLUMN `employeeId` VARCHAR(255) NULL UNIQUE,
ADD COLUMN `designation` VARCHAR(255) NULL,
ADD COLUMN `reportingManagerId` INT NULL,
ADD COLUMN `phone` VARCHAR(255) NULL,
ADD COLUMN `photoUrl` VARCHAR(255) NULL,
ADD COLUMN `qualifications` TEXT NULL,
ADD COLUMN `startDate` DATETIME NULL,
ADD CONSTRAINT `fk_users_reportingManager` FOREIGN KEY (`reportingManagerId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX `idx_users_reportingManagerId` ON `users` (`reportingManagerId`);
