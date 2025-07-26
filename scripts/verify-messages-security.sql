-- VERIFY COMPLETE MESSAGES TABLE SECURITY
-- Ensure all CRUD operations are properly secured

-- Check 1: Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'messages';

-- Check 2: List all current policies 
SELECT 
  policyname as "Policy Name",
  cmd as "Operation",
  permissive as "Type",
  roles as "Roles",
  qual as "USING Condition",
  with_check as "WITH CHECK Condition"
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'messages'
ORDER BY 
  CASE cmd 
    WHEN 'SELECT' THEN 1 
    WHEN 'INSERT' THEN 2 
    WHEN 'UPDATE' THEN 3 
    WHEN 'DELETE' THEN 4 
    ELSE 5 
  END;

-- Check 3: Security Analysis
WITH policy_analysis AS (
  SELECT 
    cmd,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as policy_names,
    BOOL_OR(qual = 'true' OR with_check = 'true') as has_permissive_policy
  FROM pg_policies 
  WHERE schemaname = 'public' 
  AND tablename = 'messages'
  GROUP BY cmd
)
SELECT 
  cmd as "Operation",
  policy_count as "# Policies",
  policy_names as "Policy Names",
  CASE 
    WHEN has_permissive_policy THEN '🚨 INSECURE - Has overly permissive policy'
    WHEN policy_count = 0 THEN '🚫 BLOCKED - No policy (operation denied)'
    ELSE '✅ SECURED - Has restrictive policies'
  END as "Security Status"
FROM policy_analysis
ORDER BY 
  CASE cmd 
    WHEN 'SELECT' THEN 1 
    WHEN 'INSERT' THEN 2 
    WHEN 'UPDATE' THEN 3 
    WHEN 'DELETE' THEN 4 
    ELSE 5 
  END;

-- Check 4: Ensure no DELETE policy exists (messages should not be deletable)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'messages' 
      AND cmd = 'DELETE'
    ) 
    THEN '⚠️ WARNING: DELETE policy exists - messages can be deleted'
    ELSE '✅ SECURE: No DELETE policy - messages cannot be deleted'
  END as "Delete Security Status"; 