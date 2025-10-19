-- Migration: Add active_filters column to sessions table
-- This migration adds support for saving filter state per session

ALTER TABLE sessions ADD COLUMN active_filters TEXT;
