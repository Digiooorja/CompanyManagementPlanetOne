-- Migration: 20260604_013_task_enhancements.sql
-- Implements the remaining Requirements §5.3 gaps (Task Status, Progress &
-- Accountability): % complete with subtask roll-up, dependencies, an
-- automatic Overdue status, comments/attachments on tasks, and a Block
-- relatedType option.

ALTER TABLE `tasks`
ADD COLUMN `startDate` DATETIME NULL,
ADD COLUMN `progress` INT NOT NULL DEFAULT 0,
ADD COLUMN `parentTaskId` INT NULL,
ADD COLUMN `dependencyTaskIds` TEXT NULL,
ADD CONSTRAINT `fk_tasks_parentTask` FOREIGN KEY (`parentTaskId`) REFERENCES `tasks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `tasks` MODIFY COLUMN `status` ENUM (
    'Not Started',
    'In Progress',
    'Completed',
    'Blocked',
    'Overdue'
) DEFAULT 'Not Started';

ALTER TABLE `tasks` MODIFY COLUMN `relatedType` ENUM (
    'Activity',
    'Workflow',
    'Document',
    'Project',
    'Block',
    'Decision',
    'General'
) DEFAULT 'General';

CREATE INDEX `idx_tasks_parentTaskId` ON `tasks` (`parentTaskId`);
CREATE INDEX `idx_tasks_assignedToId_status` ON `tasks` (`assignedToId`, `status`);

-- Comments become polymorphic: a comment belongs to either an Activity or a Task.
ALTER TABLE `comments`
MODIFY COLUMN `activityId` INT NULL,
ADD COLUMN `taskId` INT NULL,
ADD CONSTRAINT `fk_comments_task` FOREIGN KEY (`taskId`) REFERENCES `tasks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Documents can be attached directly to a task (file attachments, §5.3).
ALTER TABLE `documents`
ADD COLUMN `taskId` INT NULL,
ADD CONSTRAINT `fk_documents_task` FOREIGN KEY (`taskId`) REFERENCES `tasks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
