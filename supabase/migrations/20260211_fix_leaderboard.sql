-- ============================================================================
-- Migration: Fix Quiz Leaderboard Data Access
-- Created: 2026-02-11
-- Description: Enables public leaderboard access and ensures proper data structure
-- ============================================================================

-- ============================================================================
-- 1. VERIFY QUIZ_COMPLETIONS TABLE EXISTS AND HAS CORRECT STRUCTURE
-- ============================================================================

-- Check if table exists and add missing columns if needed
DO $$
BEGIN
  -- Add time_taken_seconds if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_completions' AND column_name = 'time_taken_seconds'
  ) THEN
    ALTER TABLE public.quiz_completions ADD COLUMN time_taken_seconds INTEGER;
  END IF;
  
  -- Add difficulty if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_completions' AND column_name = 'difficulty'
  ) THEN
    ALTER TABLE public.quiz_completions ADD COLUMN difficulty TEXT DEFAULT 'medium';
  END IF;
END $$;

-- ============================================================================
-- 2. ENSURE PROFILES TABLE HAS PROPER STRUCTURE
-- ============================================================================

DO $$
BEGIN
  -- Add display_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN display_name TEXT;
  END IF;
  
  -- Add avatar_url if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- ============================================================================
-- 3. UPDATE RLS POLICIES FOR LEADERBOARD ACCESS
-- ============================================================================

-- Allow public/authenticated users to view leaderboard data
-- Drop existing restrictive policies on quiz_completions
DROP POLICY IF EXISTS "Users can view their own quiz completions" ON public.quiz_completions;

-- Add new policy allowing authenticated users to view all quiz completions for leaderboard
CREATE POLICY "Authenticated users can view quiz completions for leaderboard"
ON public.quiz_completions FOR SELECT
TO authenticated
USING (true);

-- Allow anonymous users to view aggregated leaderboard data
CREATE POLICY "Anonymous users can view quiz completions for leaderboard"
ON public.quiz_completions FOR SELECT
USING (true);

-- Ensure users can still insert their own quiz completions
DROP POLICY IF EXISTS "Users can insert their own quiz completions" ON public.quiz_completions;

CREATE POLICY "Users can insert their own quiz completions"
ON public.quiz_completions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow public access to profiles for display purposes
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

CREATE POLICY "Everyone can view profiles"
ON public.profiles FOR SELECT
USING (true);

-- ============================================================================
-- 4. CREATE LEADERBOARD VIEW FOR EASIER QUERYING
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.leaderboard_view CASCADE;

-- Create a view for easier leaderboard queries
CREATE VIEW public.leaderboard_view AS
SELECT
  qc.user_id,
  COALESCE(p.display_name, au.email, 'Anonymous') as user_name,
  au.email as user_email,
  m.id as monument_id,
  m.title as monument_title,
  ROUND(AVG((qc.score::numeric / qc.total_questions) * 100)::numeric, 2) as average_score,
  COUNT(*) as total_attempts,
  MAX(ROUND(((qc.score::numeric / qc.total_questions) * 100)::numeric, 2)) as highest_score,
  MAX(qc.completed_at) as last_completed_at
FROM public.quiz_completions qc
LEFT JOIN public.monuments m ON qc.monument_id = m.id
LEFT JOIN public.profiles p ON qc.user_id = p.user_id
LEFT JOIN auth.users au ON qc.user_id = au.id
GROUP BY qc.user_id, p.display_name, au.email, m.id, m.title;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_view_avg_score 
ON public.quiz_completions(user_id, monument_id);

-- ============================================================================
-- 5. CREATE LEADERBOARD VIEW FOR ALL-TIME RANKINGS
-- ============================================================================

DROP VIEW IF EXISTS public.all_time_leaderboard CASCADE;

CREATE VIEW public.all_time_leaderboard AS
SELECT
  qc.user_id,
  COALESCE(p.display_name, au.email, 'Anonymous') as user_name,
  au.email as user_email,
  ROUND(AVG((qc.score::numeric / qc.total_questions) * 100)::numeric, 2) as average_score,
  COUNT(*) as total_attempts,
  MAX(ROUND(((qc.score::numeric / qc.total_questions) * 100)::numeric, 2)) as highest_score,
  MAX(qc.completed_at) as last_completed_at,
  ROW_NUMBER() OVER (ORDER BY AVG((qc.score::numeric / qc.total_questions) * 100) DESC) as rank
FROM public.quiz_completions qc
LEFT JOIN public.profiles p ON qc.user_id = p.user_id
LEFT JOIN auth.users au ON qc.user_id = au.id
GROUP BY qc.user_id, p.display_name, au.email;

-- ============================================================================
-- 6. GRANT PERMISSIONS ON VIEWS
-- ============================================================================

-- Grant select on views to public
GRANT SELECT ON public.leaderboard_view TO anon;
GRANT SELECT ON public.leaderboard_view TO authenticated;
GRANT SELECT ON public.all_time_leaderboard TO anon;
GRANT SELECT ON public.all_time_leaderboard TO authenticated;

-- ============================================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes on quiz_completions for faster queries
CREATE INDEX IF NOT EXISTS idx_quiz_completions_user_id ON public.quiz_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_completions_monument_id ON public.quiz_completions(monument_id);
CREATE INDEX IF NOT EXISTS idx_quiz_completions_completed_at ON public.quiz_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_quiz_completions_score ON public.quiz_completions(score, total_questions);

-- Indexes on profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);

-- Indexes on monuments
CREATE INDEX IF NOT EXISTS idx_monuments_title ON public.monuments(title);

-- ============================================================================
-- 8. SEED DATA VALIDATION (Optional: uncomment if needed)
-- ============================================================================

-- Ensure all quiz completion users have profile entries
INSERT INTO public.profiles (user_id, display_name, created_at, updated_at)
SELECT DISTINCT qc.user_id, NULL, NOW(), NOW()
FROM public.quiz_completions qc
LEFT JOIN public.profiles p ON qc.user_id = p.user_id
WHERE p.id IS NULL
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. VERIFICATION QUERIES (Run these to check status)
-- ============================================================================

-- To verify the migration was successful, run these queries:
-- SELECT * FROM public.leaderboard_view LIMIT 10;
-- SELECT * FROM public.all_time_leaderboard LIMIT 10;
-- SELECT COUNT(*) FROM public.quiz_completions;
-- SELECT COUNT(*) FROM public.profiles;
