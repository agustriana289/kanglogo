-- ============================================================
-- 000026_add_is_read_to_support_ticket_messages.sql
-- Add is_read column to support_ticket_messages for notifications
-- ============================================================

ALTER TABLE public.support_ticket_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
