-- Migration to create the messages table for the Unified Inbox feature
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    sentiment TEXT DEFAULT 'Neutral',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for Messages

-- Senders (guests or hosts replying) can insert their own messages
CREATE POLICY "Users can insert messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

-- Users can view messages where they are the sender or receiver
CREATE POLICY "Users can view their messages"
ON public.messages FOR SELECT
TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Receivers can update messages (e.g., mark as read)
CREATE POLICY "Receivers can update their messages"
ON public.messages FOR UPDATE
TO authenticated
USING (receiver_id = auth.uid())
WITH CHECK (receiver_id = auth.uid());
