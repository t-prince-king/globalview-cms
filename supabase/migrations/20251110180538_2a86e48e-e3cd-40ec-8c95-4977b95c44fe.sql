-- Fix RLS policies for subscriptions table to avoid auth.users access

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON subscriptions;

-- Recreate policies without auth.users reference
CREATE POLICY "Users can view their own subscription"
ON subscriptions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription"
ON subscriptions
FOR UPDATE
USING (user_id = auth.uid());