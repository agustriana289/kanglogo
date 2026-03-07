-- Global Search Function for Kanglogo (Final Fix - No Assumptions)
-- Drop function first to reset signature (handling return type changes)
DROP FUNCTION IF EXISTS public.global_search(text, boolean, uuid);

CREATE OR REPLACE FUNCTION public.global_search(
    p_query TEXT,
    p_is_admin BOOLEAN DEFAULT FALSE,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id TEXT,
    title TEXT,
    description TEXT,
    link TEXT,
    type TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_search_query TEXT := '%' || p_query || '%';
BEGIN
    -- ADMIN SEARCH
    IF p_is_admin THEN
        RETURN QUERY
        -- Projects (store_orders)
        SELECT o.id::text, 
               o.order_number as title, 
               'Order #' || o.order_number as description, 
               '/dashboard/projects' as link, 
               'Project' as type, 
               o.created_at
        FROM public.store_orders o
        WHERE o.order_number ILIKE v_search_query OR o.form_data::text ILIKE v_search_query
        
        UNION ALL
        -- Services (store_services)
        SELECT s.id::text, s.title, s.category as description, '/dashboard/services' as link, 'Service' as type, s.created_at
        FROM public.store_services s
        WHERE s.title ILIKE v_search_query OR s.category ILIKE v_search_query
        
        UNION ALL
        -- Shop (store_products)
        SELECT sp.id::text, sp.title, sp.category as description, '/dashboard/shop' as link, 'Shop' as type, sp.created_at
        FROM public.store_products sp
        WHERE sp.title ILIKE v_search_query OR sp.category ILIKE v_search_query
        
        UNION ALL
        -- Tickets (support_tickets)
        SELECT st.id::text, st.subject as title, st.status as description, '/dashboard/tickets/' || st.id::text as link, 'Ticket' as type, st.created_at
        FROM public.support_tickets st
        WHERE st.subject ILIKE v_search_query
        
        UNION ALL
        -- Announcements (site_announcements)
        SELECT a.id::text, a.title, a.content as description, '/dashboard/announcements' as link, 'Announcement' as type, a.created_at
        FROM public.site_announcements a
        WHERE a.title ILIKE v_search_query
        
        UNION ALL
        -- Portfolios (store_portfolios)
        SELECT po.id::text, po.title, po.category as description, '/dashboard/portfolios' as link, 'Portfolio' as type, po.created_at
        FROM public.store_portfolios po
        WHERE po.title ILIKE v_search_query OR po.category ILIKE v_search_query
        
        UNION ALL
        -- Testimonials (store_testimonials)
        SELECT t.id::text, t.client_name as title, t.comment as description, '/dashboard/testimonials' as link, 'Testimonial' as type, t.created_at
        FROM public.store_testimonials t
        WHERE t.client_name ILIKE v_search_query OR t.comment ILIKE v_search_query
        
        UNION ALL
        -- Blogs (blogs)
        SELECT b.id::text, b.title, b.category as description, '/dashboard/blogs/' || b.id::text || '/edit' as link, 'Blog' as type, b.created_at
        FROM public.blogs b
        WHERE b.title ILIKE v_search_query
        
        UNION ALL
        -- Ads (ads)
        SELECT ad.id::text, ad.name as title, ad.position as description, '/dashboard/ads' as link, 'Ad' as type, ad.created_at
        FROM public.ads ad
        WHERE ad.name ILIKE v_search_query
        
        UNION ALL
        -- Pages (pages)
        SELECT pg.id::text, pg.title, pg.slug as description, '/dashboard/pages/' || pg.id::text || '/edit' as link, 'Page' as type, pg.created_at
        FROM public.pages pg
        WHERE pg.title ILIKE v_search_query
        
        UNION ALL
        -- FAQ (faqs)
        SELECT f.id::text, f.question as title, f.target as description, '/dashboard/faq' as link, 'FAQ' as type, f.created_at
        FROM public.faqs f
        WHERE f.question ILIKE v_search_query
        
        UNION ALL
        -- Users (users)
        SELECT u.id::text, COALESCE(u.full_name, u.email) as title, u.email as description, '/dashboard/users' as link, 'User' as type, u.created_at
        FROM public.users u
        WHERE u.full_name ILIKE v_search_query OR u.email ILIKE v_search_query;

    -- USER SEARCH
    ELSE
        RETURN QUERY
        -- Projects (store_orders)
        SELECT o.id::text, o.order_number as title, 'My Order #' || o.order_number as description, '/dashboard/projects' as link, 'Project' as type, o.created_at
        FROM public.store_orders o
        WHERE o.user_id = p_user_id AND (o.order_number ILIKE v_search_query OR o.form_data::text ILIKE v_search_query)
        
        UNION ALL
        -- Tickets
        SELECT st.id::text, st.subject as title, st.status as description, '/dashboard/tickets/' || st.id::text as link, 'Ticket' as type, st.created_at
        FROM public.support_tickets st
        WHERE st.user_id = p_user_id AND st.subject ILIKE v_search_query
        
        UNION ALL
        -- Users (Self)
        SELECT u.id::text, COALESCE(u.full_name, u.email) as title, u.email as description, '/dashboard/profile' as link, 'Profile' as type, u.created_at
        FROM public.users u
        WHERE u.id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
