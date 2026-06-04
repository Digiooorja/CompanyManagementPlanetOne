-- Migration: 20260604_005_fix_delegation_to_finances.sql
-- Fixes the table name from the previous migration attempt

ALTER TABLE finances 
  ADD COLUMN IF NOT EXISTS delegatedTo VARCHAR(255) NULL COMMENT 'The name or department currently holding responsibility',
  ADD COLUMN IF NOT EXISTS delegationHistory JSON NULL COMMENT 'Append-only log of delegation actions (Delegated, Approved, Rejected)';
