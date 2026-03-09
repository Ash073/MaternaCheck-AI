-- ============================================================
-- MaternaCheck — Supabase Table Setup
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  symptoms JSONB NOT NULL,
  result JSONB NOT NULL
);

-- Enable Row Level Security (required by Supabase)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Allow inserts from the anon key (patient checks)
CREATE POLICY "Allow anonymous inserts"
  ON submissions FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow reads from the anon key (doctor dashboard)
CREATE POLICY "Allow anonymous reads"
  ON submissions FOR SELECT
  TO anon
  USING (true);

-- Index for faster ordering by date
CREATE INDEX IF NOT EXISTS idx_submissions_created_at
  ON submissions (created_at DESC);
