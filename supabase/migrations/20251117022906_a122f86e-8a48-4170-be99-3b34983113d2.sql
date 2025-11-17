-- Create stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  monument_id UUID NOT NULL REFERENCES public.monuments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view stories
CREATE POLICY "Stories are viewable by everyone"
ON public.stories
FOR SELECT
USING (true);

-- Allow authenticated users to create stories
CREATE POLICY "Authenticated users can create stories"
ON public.stories
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own stories
CREATE POLICY "Users can update their own stories"
ON public.stories
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own stories
CREATE POLICY "Users can delete their own stories"
ON public.stories
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_stories_updated_at
BEFORE UPDATE ON public.stories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();