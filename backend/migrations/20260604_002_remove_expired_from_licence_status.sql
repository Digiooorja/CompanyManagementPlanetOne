-- Migration: 20260604_002_remove_expired_from_licence_status.sql
-- Removes 'Expired' from the licence status ENUM because expiry
-- is auto-derived from the expiryDate field at the application layer.
-- First converts any existing 'Expired' rows to 'Active', then alters the column.

UPDATE licences SET status = 'Active' WHERE status = 'Expired';

ALTER TABLE licences
  MODIFY COLUMN status ENUM('Active', 'Suspended', 'Renewed') NOT NULL DEFAULT 'Active'
