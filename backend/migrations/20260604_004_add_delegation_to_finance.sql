-- Migration: 20260604_004_add_delegation_to_finance.sql
-- Adds floating delegation fields to the finance table for dynamic AFE workflows

ALTER TABLE finance 
  ADD COLUMN IF NOT EXISTS delegatedTo VARCHAR(255) NULL COMMENT 'The name or department currently holding responsibility',
  ADD COLUMN IF NOT EXISTS delegationHistory JSON NULL COMMENT 'Append-only log of delegation actions (Delegated, Approved, Rejected)';
