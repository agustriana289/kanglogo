-- ============================================================
-- 000025_add_notification_triggers.sql
-- Database triggers for automated notification creation
-- ============================================================

-- First, ensure notifications table is broadcasting realtime events
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 1. Project (store_orders) Triggers
CREATE OR REPLACE FUNCTION public.notify_order_changes() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Notify Admin
        INSERT INTO public.notifications (role, title, message, type, link)
        VALUES ('admin', 'New Project Order', 'Order #' || NEW.order_number || ' has been created.', 'info', '/dashboard/projects');
        
        -- Notify User
        INSERT INTO public.notifications (user_id, role, title, message, type, link)
        VALUES (NEW.user_id, 'user', 'Project Created', 'Your project order #' || NEW.order_number || ' has been created successfully.', 'success', '/dashboard/projects');
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
            -- Notify Admin
            INSERT INTO public.notifications (role, title, message, type, link)
            VALUES ('admin', 'Project Completed', 'Order #' || NEW.order_number || ' has been marked as completed.', 'success', '/dashboard/projects');
            
            -- Notify User
            INSERT INTO public.notifications (user_id, role, title, message, type, link)
            VALUES (NEW.user_id, 'user', 'Project Completed', 'Your project order #' || NEW.order_number || ' has been completed!', 'success', '/dashboard/projects');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_changes ON public.store_orders;
CREATE TRIGGER on_order_changes
    AFTER INSERT OR UPDATE ON public.store_orders
    FOR EACH ROW EXECUTE PROCEDURE public.notify_order_changes();

-- 2. Discount Triggers (Admin only, when usage limit is near)
CREATE OR REPLACE FUNCTION public.notify_discount_usage() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.usage_limit IS NOT NULL THEN
        -- Check if it just reached 5 or fewer uses left
        IF (NEW.usage_limit - NEW.used_count) <= 5 AND (OLD.usage_limit - OLD.used_count) > 5 THEN
            INSERT INTO public.notifications (role, title, message, type, link)
            VALUES ('admin', 'Discount Expiring Soon', 'Discount code "' || NEW.code || '" is running out of uses (' || (NEW.usage_limit - NEW.used_count) || ' left).', 'warning', '/dashboard/discounts');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_discount_usage_update ON public.store_discounts;
CREATE TRIGGER on_discount_usage_update
    AFTER UPDATE ON public.store_discounts
    FOR EACH ROW EXECUTE PROCEDURE public.notify_discount_usage();

-- 3. Support Ticket Triggers
CREATE OR REPLACE FUNCTION public.notify_ticket_creation() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Notify Admin
        INSERT INTO public.notifications (role, title, message, type, link)
        VALUES ('admin', 'New Support Ticket', 'A new support ticket "' || NEW.subject || '" has been created.', 'info', '/dashboard/tickets');
        
        -- Notify User (Optional, but user generated it, let's notify them it was received)
        INSERT INTO public.notifications (user_id, role, title, message, type, link)
        VALUES (NEW.user_id, 'user', 'Ticket Created', 'Your support ticket "' || NEW.subject || '" has been received.', 'success', '/dashboard/tickets');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_ticket_creation ON public.support_tickets;
CREATE TRIGGER on_ticket_creation
    AFTER INSERT ON public.support_tickets
    FOR EACH ROW EXECUTE PROCEDURE public.notify_ticket_creation();

-- 4. Testimonials Triggers
CREATE OR REPLACE FUNCTION public.notify_testimonial_creation() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Notify Admin
        INSERT INTO public.notifications (role, title, message, type, link)
        VALUES ('admin', 'New Testimonial', NEW.client_name || ' just left a new testimonial.', 'success', '/dashboard/testimonials');
        
        -- Notify User
        INSERT INTO public.notifications (user_id, role, title, message, type, link)
        VALUES (NEW.user_id, 'user', 'Testimonial Submitted', 'Thank you! Your testimonial has been submitted successfully.', 'success', '/dashboard/projects');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_testimonial_creation ON public.store_testimonials;
CREATE TRIGGER on_testimonial_creation
    AFTER INSERT ON public.store_testimonials
    FOR EACH ROW EXECUTE PROCEDURE public.notify_testimonial_creation();

-- 5. User Registration Trigger
CREATE OR REPLACE FUNCTION public.notify_user_registration() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Notify Admin
        INSERT INTO public.notifications (role, title, message, type, link)
        VALUES ('admin', 'New User Registered', 'A new user (' || NEW.email || ') has registered.', 'info', '/dashboard/users');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_registration ON public.users;
CREATE TRIGGER on_user_registration
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE PROCEDURE public.notify_user_registration();
