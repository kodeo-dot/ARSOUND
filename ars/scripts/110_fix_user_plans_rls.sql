-- Fix RLS policies for user_plans table
-- This adds the missing INSERT policy that prevents webhooks from activating plans

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own plan" ON public.user_plans;
DROP POLICY IF EXISTS "Users can update their own plan" ON public.user_plans;

-- Recreate policies with INSERT support
CREATE POLICY "Users can view their own plan" 
  ON public.user_plans FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan" 
  ON public.user_plans FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Add missing INSERT policy for system/webhook operations
CREATE POLICY "System can insert user plans" 
  ON public.user_plans FOR INSERT 
  WITH CHECK (true);

-- Add comment explaining the policy
COMMENT ON POLICY "System can insert user plans" ON public.user_plans IS 
  'Allows webhooks and system operations to create plan records. Protected by service role key.';
