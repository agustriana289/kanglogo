-- Fix RLS policies for store_orders
-- Allow authenticated users to insert their own orders
DROP POLICY IF EXISTS "Users can insert own orders" ON public.store_orders;
CREATE POLICY "Users can insert own orders" ON public.store_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own orders (e.g. payment proof)
DROP POLICY IF EXISTS "Users can update own orders" ON public.store_orders;
CREATE POLICY "Users can update own orders" ON public.store_orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Fix store_workspaces: allow user to insert their own workspace
DROP POLICY IF EXISTS "Users can insert own workspace" ON public.store_workspaces;
CREATE POLICY "Users can insert own workspace" ON public.store_workspaces
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fix store_workspaces: allow user to update their own workspace
DROP POLICY IF EXISTS "Users can update own workspace" ON public.store_workspaces;
CREATE POLICY "Users can update own workspace" ON public.store_workspaces
  FOR UPDATE USING (auth.uid() = user_id);

-- Fix store_messages: allow workspace participants to insert messages
DROP POLICY IF EXISTS "Users can insert messages in own workspace" ON public.store_messages;
CREATE POLICY "Users can insert messages in own workspace" ON public.store_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.store_workspaces
      WHERE id = workspace_id AND user_id = auth.uid()
    )
  );
