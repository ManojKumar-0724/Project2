-- ============================================================================
-- QUICK FIX: Quiz Leaderboard Setup Script
-- ============================================================================
-- Run this script in Supabase SQL Editor to fix leaderboard data access
-- Go to: Project Dashboard → SQL Editor → New Query → Paste this entire script

-- ============================================================================
-- Step 1: Update RLS Policies to Allow Leaderboard Access
-- ============================================================================

-- Allow public and authenticated users to view quiz_completions
DROP POLICY IF EXISTS "Users can view their own quiz completions" ON public.quiz_completions;

CREATE POLICY "Leaderboard view policy - authenticated users"
ON public.quiz_completions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Leaderboard view policy - public access"
ON public.quiz_completions FOR SELECT
USING (true);

-- Keep insertion restricted to own user
DROP POLICY IF EXISTS "Users can insert their own quiz completions" ON public.quiz_completions;

CREATE POLICY "Users can insert their own quiz completions"
ON public.quiz_completions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow everyone to view profiles (needed for leaderboard names)
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

CREATE POLICY "Public profile access for leaderboard"
ON public.profiles FOR SELECT
USING (true);

-- ============================================================================
-- Step 2: Verify Table Structure
-- ============================================================================

-- This script will check if columns exist and add them if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_completions' AND column_name = 'difficulty'
  ) THEN
    ALTER TABLE public.quiz_completions ADD COLUMN difficulty TEXT DEFAULT 'medium';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_completions' AND column_name = 'time_taken_seconds'
  ) THEN
    ALTER TABLE public.quiz_completions ADD COLUMN time_taken_seconds INTEGER;
  END IF;
END $$;

-- ============================================================================
-- Step 3: Create Helpful Views for Leaderboard
-- ============================================================================

-- Drop existing views if any
DROP VIEW IF EXISTS public.leaderboard_by_monument CASCADE;
DROP VIEW IF EXISTS public.leaderboard_all_time CASCADE;

-- All-time leaderboard view
CREATE OR REPLACE VIEW public.leaderboard_all_time AS
SELECT
  qc.user_id,
  COALESCE(p.display_name, au.email, 'Anonymous') as user_name,
  au.email as user_email,
  ROUND(AVG((qc.score::numeric / NULLIF(qc.total_questions, 0)) * 100), 2) as average_score,
  COUNT(*) as total_attempts,
  MAX(ROUND(((qc.score::numeric / NULLIF(qc.total_questions, 0)) * 100), 2)) as highest_score,
  MAX(qc.completed_at) as last_completed_at
FROM public.quiz_completions qc
LEFT JOIN public.profiles p ON qc.user_id = p.user_id
LEFT JOIN auth.users au ON qc.user_id = au.id
WHERE qc.total_questions > 0
GROUP BY qc.user_id, p.display_name, au.email
ORDER BY average_score DESC;

-- By-monument leaderboard view
CREATE OR REPLACE VIEW public.leaderboard_by_monument AS
SELECT
  qc.monument_id,
  m.title as monument_title,
  qc.user_id,
  COALESCE(p.display_name, au.email, 'Anonymous') as user_name,
  au.email as user_email,
  ROUND(AVG((qc.score::numeric / NULLIF(qc.total_questions, 0)) * 100), 2) as average_score,
  COUNT(*) as total_attempts,
  MAX(ROUND(((qc.score::numeric / NULLIF(qc.total_questions, 0)) * 100), 2)) as highest_score,
  MAX(qc.completed_at) as last_completed_at
FROM public.quiz_completions qc
LEFT JOIN public.monuments m ON qc.monument_id = m.id
LEFT JOIN public.profiles p ON qc.user_id = p.user_id
LEFT JOIN auth.users au ON qc.user_id = au.id
WHERE qc.total_questions > 0
GROUP BY qc.monument_id, m.title, qc.user_id, p.display_name, au.email
ORDER BY qc.monument_id, average_score DESC;

-- ============================================================================
-- Step 4: Create Performance Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_quiz_completions_user_monument 
ON public.quiz_completions(user_id, monument_id);

CREATE INDEX IF NOT EXISTS idx_quiz_completions_score_ratio 
ON public.quiz_completions(score, total_questions);

CREATE INDEX IF NOT EXISTS idx_quiz_completions_completed_at 
ON public.quiz_completions(completed_at DESC);

-- ============================================================================
-- Step 5: Verify Setup (Run these separately to check)
-- ============================================================================

-- Check table exists
-- SELECT COUNT(*) as quiz_completion_count FROM public.quiz_completions;

-- Check views exist
-- SELECT * FROM public.leaderboard_all_time LIMIT 10;
-- SELECT * FROM public.leaderboard_by_monument LIMIT 10;

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, qual 
-- FROM pg_policies 
-- WHERE tablename = 'quiz_completions';

-- ============================================================================
-- Done! Your leaderboard should now work.
-- ============================================================================
