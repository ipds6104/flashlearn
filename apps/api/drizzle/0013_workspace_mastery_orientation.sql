-- Phase 28: Expand-Only Zero-Downtime Migration for Workspace Mastery Orientation
-- Adds structured JSONB orientation_payload (workspace-orientation-v1) to workspaces.

ALTER TABLE "workspaces"
  ADD COLUMN IF NOT EXISTS "orientation_payload" jsonb;
