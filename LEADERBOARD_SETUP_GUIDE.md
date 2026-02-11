# Quiz Leaderboard Setup Guide

## Problem
The leaderboard is showing an error when trying to fetch data.

## Solution

### Step 1: Run the Setup Script in Supabase

1. **Go to Supabase Dashboard**
   - Open [https://app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste the Script**
   - Open the file: `LEADERBOARD_SETUP.sql` in your project root
   - Copy all the SQL code
   - Paste it into the SQL Editor query box

4. **Run the Script**
   - Click the "Run" button (▶️) or press `Ctrl+Enter`
   - Wait for the script to complete

### What the Script Does

✅ Updates RLS (Row Level Security) policies to allow public leaderboard access
✅ Creates database views for faster queries
✅ Adds performance indexes
✅ Verifies table structure
✅ Ensures all necessary columns exist

### Step 2: Verify the Setup

After running the script, you can verify everything is working:

```sql
-- Check if quiz completions exist
SELECT COUNT(*) as total_quizzes FROM public.quiz_completions;

-- View the all-time leaderboard
SELECT * FROM public.leaderboard_all_time LIMIT 10;

-- View leaderboard by monument
SELECT * FROM public.leaderboard_by_monument LIMIT 10;
```

### Step 3: Test the Leaderboard

1. **Take a Quiz**
   - Go to the monuments page
   - Click on a monument
   - Take the quiz and submit your answers

2. **View the Leaderboard**
   - After completing a quiz, click "View Leaderboard"
   - Or go directly to `/quizzes` page
   - You should see the results displayed

## Troubleshooting

### "No quiz attempts yet" message
- **Cause**: No one has taken a quiz yet
- **Solution**: Take a quiz first, then reload the leaderboard page

### Still getting error message
- **Cause**: Script wasn't applied successfully
- **Solution**: 
  1. Check that there are no SQL errors in the output
  2. Run the script again from step 1
  3. Check Supabase documentation for RLS policies

### Leaderboard shows but with missing names
- **Cause**: Profiles table might not have display_name
- **Solution**: The script will automatically create these columns, but you can manually set them:

```sql
UPDATE public.profiles 
SET display_name = split_part(email, '@', 1)
WHERE display_name IS NULL;
```

## Files Included

- `LEADERBOARD_SETUP.sql` - The setup script to run in Supabase SQL Editor
- `supabase/migrations/20260211_fix_leaderboard.sql` - Migration file (runs automatically in production)

## Quick Reference: SQL Queries

### Get All-Time Leaderboard
```sql
SELECT * FROM public.leaderboard_all_time 
ORDER BY average_score DESC 
LIMIT 50;
```

### Get Leaderboard for Specific Monument
```sql
SELECT * FROM public.leaderboard_by_monument 
WHERE monument_id = 'YOUR_MONUMENT_ID'
ORDER BY average_score DESC;
```

### Get User's Personal Stats
```sql
SELECT 
  user_id,
  COUNT(*) as attempts,
  ROUND(AVG(score::numeric / total_questions * 100), 2) as average_score,
  MAX(score) as best_score
FROM public.quiz_completions
WHERE user_id = 'USER_UUID'
GROUP BY user_id;
```

## Need Help?

If you're still having issues:

1. Check the Supabase Logs
   - Go to Logs section in Supabase dashboard
   - Look for any error messages

2. Verify RLS Policies
   - Go to Authentication → Policies
   - Check `quiz_completions` table policies

3. Check Database Status
   - Go to Database → Tables
   - Verify `quiz_completions` table exists
   - Check `leaderboard_all_time` and `leaderboard_by_monument` views exist
