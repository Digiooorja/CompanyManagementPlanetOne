-- Migration: 20260604_004_add_delegation_to_finance.sql
-- Adds floating delegation fields to the finance table for dynamic AFE workflows

ALTER TABLE finances
  ADD COLUMN  delegatedTo VARCHAR(255) NULL COMMENT 'The name or department currently holding responsibility',
  ADD COLUMN  delegationHistory JSON NULL COMMENT 'Append-only log of delegation actions (Delegated, Approved, Rejected)';
