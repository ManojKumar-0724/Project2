-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Create monument_ratings table
CREATE TABLE public.monument_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monument_id uuid REFERENCES public.monuments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (monument_id, user_id)
);

ALTER TABLE public.monument_ratings ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for monument_ratings
CREATE POLICY "Ratings are viewable by everyone"
ON public.monument_ratings FOR SELECT
USING (true);

CREATE POLICY "Users can rate monuments"
ON public.monument_ratings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rating"
ON public.monument_ratings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rating"
ON public.monument_ratings FOR DELETE
USING (auth.uid() = user_id);

-- 7. Function to update monument average rating
CREATE OR REPLACE FUNCTION public.update_monument_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.monuments
  SET rating = (
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
    FROM public.monument_ratings
    WHERE monument_id = COALESCE(NEW.monument_id, OLD.monument_id)
  )
  WHERE id = COALESCE(NEW.monument_id, OLD.monument_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 8. Triggers for rating updates
CREATE TRIGGER on_rating_change
AFTER INSERT OR UPDATE OR DELETE ON public.monument_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_monument_rating();

-- 9. Add image_url to stories table
ALTER TABLE public.stories ADD COLUMN image_url text;

-- 10. Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('story-images', 'story-images', true);

-- 11. Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 12. Storage policies for story images
CREATE POLICY "Story images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'story-images');

CREATE POLICY "Users can upload story images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'story-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own story images"
ON storage.objects FOR DELETE
USING (bucket_id = 'story-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 13. Admin policies for monuments (so admins can manage)
CREATE POLICY "Admins can insert monuments"
ON public.monuments FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update monuments"
ON public.monuments FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete monuments"
ON public.monuments FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 14. Admin policies for stories moderation
CREATE POLICY "Admins can delete any story"
ON public.stories FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));