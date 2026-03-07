-- ============================================================
-- 000027_add_telegram_notifications.sql
-- Add pg_net for seamless background Telegram pushing
-- ============================================================

-- Use pg_net extension included in standard Supabase installations
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Core Function to send Telegram Messages
CREATE OR REPLACE FUNCTION public.send_telegram_notification(msg_text text, is_public boolean DEFAULT false)
RETURNS void AS $$
DECLARE
    bot_token text;
    chat_id text;
    req_url text;
    payload jsonb;
BEGIN
    -- Determine which Bot and Channel/Group to use
    IF is_public THEN
        bot_token := '7065106867:AAF3aC4zQpJqaRwc2TSA4jAwuILz0qAMwaI';
        chat_id := '@kanglogokece';
    ELSE
        bot_token := '8044037536:AAHHCyqI29eIobwotKLgGbkDoin7Rp8wBYg';
        chat_id := '-1003567505382';
    END IF;

    req_url := 'https://api.telegram.org/bot' || bot_token || '/sendMessage';
    
    payload := json_build_object(
        'chat_id', chat_id,
        'text', msg_text,
        'parse_mode', 'HTML',
        'disable_web_page_preview', true
    );

    -- Fire and forget async HTTP post using pg_net
    PERFORM net.http_post(
        url := req_url,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := payload
    );
EXCEPTION WHEN OTHERS THEN
    -- Catch all to ensure transactions never fail if Telegram API is down
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. Hook into the existing "notifications" table
-- So any time a notification is created for "admin", it pushes to Private Telegram
CREATE OR REPLACE FUNCTION public.trigger_telegram_bell_notification()
RETURNS TRIGGER AS $$
DECLARE
    tg_msg text;
BEGIN
    -- Only push admin notifications (Bell)
    IF NEW.role = 'admin' THEN
        tg_msg := '🔔 <b>' || NEW.title || '</b>' || CHR(10) || CHR(10) || NEW.message;
        
        IF NEW.link IS NOT NULL THEN
            tg_msg := tg_msg || CHR(10) || '🔗 Link: https://kanglogo.com' || NEW.link;
        END IF;

        PERFORM public.send_telegram_notification(tg_msg, false);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_telegram_bell_push ON public.notifications;
CREATE TRIGGER on_telegram_bell_push
    AFTER INSERT ON public.notifications
    FOR EACH ROW EXECUTE PROCEDURE public.trigger_telegram_bell_notification();


-- 2. Hook into "store_messages" (Workspace Chats)
CREATE OR REPLACE FUNCTION public.trigger_telegram_workspace_chat()
RETURNS TRIGGER AS $$
DECLARE
    sender_name text;
    sender_role boolean;
    tg_msg text;
    order_num text;
BEGIN
    -- Get sender details
    SELECT full_name, is_admin INTO sender_name, sender_role FROM public.users WHERE id = NEW.sender_id;
    
    -- We only notify admins if the sender is a User/Client
    IF sender_role = false THEN
        -- Get order number for context
        SELECT o.order_number INTO order_num 
        FROM public.store_workspaces w
        JOIN public.store_orders o ON w.order_id = o.id
        WHERE w.id = NEW.workspace_id;

        tg_msg := '💬 <b>New Workspace Message</b>' || CHR(10) || CHR(10) ||
                  '<b>Project:</b> #' || COALESCE(order_num, 'Unknown') || CHR(10) ||
                  '<b>From:</b> ' || COALESCE(sender_name, 'Client') || CHR(10) ||
                  '<b>Message:</b> ' || NEW.content;

        PERFORM public.send_telegram_notification(tg_msg, false);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_telegram_workspace_chat ON public.store_messages;
CREATE TRIGGER on_telegram_workspace_chat
    AFTER INSERT ON public.store_messages
    FOR EACH ROW EXECUTE PROCEDURE public.trigger_telegram_workspace_chat();


-- 3. Hook into "support_ticket_messages" (Support Ticket Chats)
CREATE OR REPLACE FUNCTION public.trigger_telegram_support_chat()
RETURNS TRIGGER AS $$
DECLARE
    sender_name text;
    sender_role boolean;
    tg_msg text;
    ticket_subject text;
BEGIN
    SELECT full_name, is_admin INTO sender_name, sender_role FROM public.users WHERE id = NEW.sender_id;
    
    -- Only notify admin if sender is a User/Client
    IF sender_role = false THEN
        SELECT subject INTO ticket_subject FROM public.support_tickets WHERE id = NEW.ticket_id;

        tg_msg := '🎫 <b>New Ticket Reply</b>' || CHR(10) || CHR(10) ||
                  '<b>Ticket:</b> ' || COALESCE(ticket_subject, 'Unknown') || CHR(10) ||
                  '<b>From:</b> ' || COALESCE(sender_name, 'Client') || CHR(10) ||
                  '<b>Message:</b> ' || NEW.content;

        PERFORM public.send_telegram_notification(tg_msg, false);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_telegram_support_chat ON public.support_ticket_messages;
CREATE TRIGGER on_telegram_support_chat
    AFTER INSERT ON public.support_ticket_messages
    FOR EACH ROW EXECUTE PROCEDURE public.trigger_telegram_support_chat();


-- 4. Hook into "store_testimonials" (Public Channel Push Option)
-- Let's push new published testimonials to the Public Telegram Channel!
CREATE OR REPLACE FUNCTION public.trigger_telegram_public_testimonial()
RETURNS TRIGGER AS $$
DECLARE
    tg_msg text;
BEGIN
    tg_msg := '🌟 <b>New 5-Star Review for Kanglogo!</b>' || CHR(10) || CHR(10) ||
              '<i>"' || NEW.comment || '"</i>' || CHR(10) || CHR(10) ||
              '— <b>' || NEW.client_name || '</b>';

    -- Assuming @kanglogokece public announcements (is_public = true)
    PERFORM public.send_telegram_notification(tg_msg, true);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_telegram_public_testimonial_push ON public.store_testimonials;
CREATE TRIGGER on_telegram_public_testimonial_push
    AFTER INSERT ON public.store_testimonials
    FOR EACH ROW EXECUTE PROCEDURE public.trigger_telegram_public_testimonial();
