-- Migration: 20260604_010_add_linked_milestone_to_activities.sql
-- Adds the "Linked Milestone" data field from Requirements §5.2 (Activity
-- Tracker with Recurring Pop-up Reminders) — the critical event an activity
-- is counting down to, e.g. "Drilling Commencement".

ALTER TABLE `activities`
ADD COLUMN `linkedMilestone` VARCHAR(255) NULL;
