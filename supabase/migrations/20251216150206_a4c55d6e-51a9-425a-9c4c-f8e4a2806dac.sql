-- Create table for tracking story views
CREATE TABLE public.story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  language text DEFAULT 'en'
);

-- Create table for tracking monument views
CREATE TABLE public.monument_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monument_id uuid REFERENCES public.monuments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid,
  viewed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for tracking quiz completions
CREATE TABLE public.quiz_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monument_id uuid REFERENCES public.monuments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monument_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies for story_views (anyone can insert, admins can view all)
CREATE POLICY "Anyone can record story views" ON public.story_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all story views" ON public.story_views FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS policies for monument_views
CREATE POLICY "Anyone can record monument views" ON public.monument_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all monument views" ON public.monument_views FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS policies for quiz_completions
CREATE POLICY "Users can insert their own quiz completions" ON public.quiz_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own quiz completions" ON public.quiz_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all quiz completions" ON public.quiz_completions FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Create indexes for better query performance
CREATE INDEX idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX idx_story_views_viewed_at ON public.story_views(viewed_at);
CREATE INDEX idx_monument_views_monument_id ON public.monument_views(monument_id);
CREATE INDEX idx_monument_views_viewed_at ON public.monument_views(viewed_at);
CREATE INDEX idx_quiz_completions_user_id ON public.quiz_completions(user_id);
CREATE INDEX idx_quiz_completions_monument_id ON public.quiz_completions(monument_id);