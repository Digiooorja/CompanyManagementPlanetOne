-- Migration: Add sub-activities support to Activities table
-- This migration adds the necessary columns to support parent-child activity relationships

-- Add columns to activities table if they don't exist
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS "parentActivityId" INTEGER REFERENCES activities(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS "projectId" INTEGER REFERENCES projects(id),
ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
ADD COLUMN IF NOT EXISTS "assignedTo" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- Add constraints if not already present
ALTER TABLE activities
ADD CONSTRAINT check_progress CHECK (progress >= 0 AND progress <= 100);

-- Create index on parentActivityId for efficient queries
CREATE INDEX IF NOT EXISTS idx_activities_parent_id ON activities("parentActivityId");
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON activities("projectId");

-- Add comment to document the new columns
COMMENT ON COLUMN activities."parentActivityId" IS 'References parent activity for sub-activities';
COMMENT ON COLUMN activities."projectId" IS 'References associated project';
COMMENT ON COLUMN activities.priority IS 'Activity priority level';
COMMENT ON COLUMN activities."assignedTo" IS 'User assigned to this activity';
COMMENT ON COLUMN activities."dueDate" IS 'Due date for the activity';
COMMENT ON COLUMN activities.progress IS 'Progress percentage (0-100)';
