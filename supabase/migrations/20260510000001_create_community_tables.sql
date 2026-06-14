-- Create community_posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    is_trending BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
-- Policies for community_posts
DROP POLICY IF EXISTS "Anyone can view community posts" ON public.community_posts;
CREATE POLICY "Anyone can view community posts"
ON public.community_posts FOR SELECT
TO anon, authenticated
USING (true);
DROP POLICY IF EXISTS "Users can create community posts" ON public.community_posts;
CREATE POLICY "Users can create community posts"
ON public.community_posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "Users can update their own community posts" ON public.community_posts;
CREATE POLICY "Users can update their own community posts"
ON public.community_posts FOR UPDATE
TO authenticated
USING (auth.uid() = author_id);
DROP POLICY IF EXISTS "Users can delete their own community posts" ON public.community_posts;
CREATE POLICY "Users can delete their own community posts"
ON public.community_posts FOR DELETE
TO authenticated
USING (auth.uid() = author_id);
-- Create community_likes table
CREATE TABLE IF NOT EXISTS public.community_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(post_id, user_id)
);
-- Enable RLS
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
-- Policies for community_likes
DROP POLICY IF EXISTS "Anyone can view likes" ON public.community_likes;
CREATE POLICY "Anyone can view likes"
ON public.community_likes FOR SELECT
TO anon, authenticated
USING (true);
DROP POLICY IF EXISTS "Users can like posts" ON public.community_likes;
CREATE POLICY "Users can like posts"
ON public.community_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can unlike posts" ON public.community_likes;
CREATE POLICY "Users can unlike posts"
ON public.community_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
-- Trigger to update likes_count on community_posts
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.community_posts
        SET likes_count = likes_count + 1
        WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.community_posts
        SET likes_count = likes_count - 1
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS update_post_likes_count_trigger ON public.community_likes;
CREATE OR REPLACE TRIGGER update_post_likes_count_trigger
AFTER INSERT OR DELETE ON public.community_likes
FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();
-- Enable Realtime for community_posts safely
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_rel pr 
            JOIN pg_publication p ON p.oid = pr.prpubid 
            JOIN pg_class c ON c.oid = pr.prrelid 
            WHERE p.pubname = 'supabase_realtime' AND c.relname = 'community_posts'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_rel pr 
            JOIN pg_publication p ON p.oid = pr.prpubid 
            JOIN pg_class c ON c.oid = pr.prrelid 
            WHERE p.pubname = 'supabase_realtime' AND c.relname = 'community_likes'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.community_likes;
        END IF;
    END IF;
END $$;
