CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid() OR (role = 'admin' AND public.get_user_role(auth.uid()) = 'admin'));

CREATE POLICY "Users can update their own notification read status" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid() OR (role = 'admin' AND public.get_user_role(auth.uid()) = 'admin'));

CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (user_id = auth.uid() OR (role = 'admin' AND public.get_user_role(auth.uid()) = 'admin'));

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_role TEXT,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT,
    p_link TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.notifications (user_id, role, title, message, type, link)
    VALUES (p_user_id, p_role, p_title, p_message, p_type, p_link);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
