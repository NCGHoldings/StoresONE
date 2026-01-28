-- Phase 1: Add new SAP-compatible roles
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'sales';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'controller';