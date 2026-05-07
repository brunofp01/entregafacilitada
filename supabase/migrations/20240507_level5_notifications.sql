-- SQL MIGRATION: LEVEL 5 - NOTIFICATIONS SYSTEM
-- Run this in your Supabase SQL Editor

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Policy for Service Role (Backend)
-- By default, service_role bypasses RLS, so no extra policy is strictly needed for the API.

-- 5. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
