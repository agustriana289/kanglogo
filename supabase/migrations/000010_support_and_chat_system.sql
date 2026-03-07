-- ============================================================
-- 000010_support_and_chat_system.sql
-- ============================================================

-- HAPUS TABEL LAMA (Jika ada) UNTUK RESET SKEMA
DROP TABLE IF EXISTS public.admin_chat_messages CASCADE;
DROP TABLE IF EXISTS public.admin_chats CASCADE;
DROP TABLE IF EXISTS public.support_ticket_messages CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;

-- [0] HELPER FUNCTION (Fix for missing get_user_role)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND is_admin = true) THEN
    RETURN 'admin';
  ELSE
    RETURN 'user';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [1] SISTEM TIKET (LAPORAN)
CREATE TABLE public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    category TEXT DEFAULT 'technical',
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.support_ticket_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- [2] SISTEM OBROLAN LANGSUNG (CHAT ROOM)
CREATE TABLE public.admin_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE, -- 1 User = 1 Chat Room dengan Admin
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.admin_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES public.admin_chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for Tickets
CREATE POLICY "Users can create own tickets" ON public.support_tickets 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own tickets" ON public.support_tickets 
    FOR SELECT USING (auth.uid() = user_id OR (public.get_user_role(auth.uid()) = 'admin'));
CREATE POLICY "Admins have full access to tickets" ON public.support_tickets 
    FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can update tickets" ON public.support_tickets 
    FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- Policies for Ticket Messages
CREATE POLICY "Users can view own ticket messages" ON public.support_ticket_messages 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.support_tickets WHERE public.support_tickets.id = ticket_id AND public.support_tickets.user_id = auth.uid()) 
        OR (public.get_user_role(auth.uid()) = 'admin')
    );
CREATE POLICY "Users can insert messages to own tickets" ON public.support_ticket_messages 
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.support_tickets WHERE public.support_tickets.id = ticket_id AND public.support_tickets.user_id = auth.uid()) 
        OR (public.get_user_role(auth.uid()) = 'admin')
    );

-- Policies for Admin Chats
CREATE POLICY "Users can access own admin chat" ON public.admin_chats 
    FOR ALL USING (user_id = auth.uid() OR (public.get_user_role(auth.uid()) = 'admin'));
CREATE POLICY "Users can insert own admin chat" ON public.admin_chats 
    FOR INSERT WITH CHECK (user_id = auth.uid() OR (public.get_user_role(auth.uid()) = 'admin'));
CREATE POLICY "Users can update own admin chat" ON public.admin_chats 
    FOR UPDATE USING (user_id = auth.uid() OR (public.get_user_role(auth.uid()) = 'admin'));

-- Policies for Admin Chat Messages
CREATE POLICY "Users can access own admin chat messages" ON public.admin_chat_messages 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.admin_chats WHERE public.admin_chats.id = chat_id AND public.admin_chats.user_id = auth.uid()) 
        OR (public.get_user_role(auth.uid()) = 'admin')
    );
CREATE POLICY "Users can insert own admin chat messages" ON public.admin_chat_messages 
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.admin_chats WHERE public.admin_chats.id = chat_id AND public.admin_chats.user_id = auth.uid()) 
        OR (public.get_user_role(auth.uid()) = 'admin')
    );
CREATE POLICY "Users can update own admin chat messages" ON public.admin_chat_messages 
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.admin_chats WHERE public.admin_chats.id = chat_id AND public.admin_chats.user_id = auth.uid()) 
        OR (public.get_user_role(auth.uid()) = 'admin')
    );

-- ENABLE REALTIME
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'admin_chat_messages') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.admin_chat_messages;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'support_ticket_messages') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.support_ticket_messages;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_messages;
