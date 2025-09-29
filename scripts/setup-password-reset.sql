-- Enable password reset functionality in Supabase
-- This script ensures the proper configuration for password reset emails

-- Check if the auth.users table has the necessary columns
-- (This is informational - Supabase handles this automatically)

-- Verify email templates are configured
-- In your Supabase dashboard, go to Authentication > Settings > Email Templates
-- Ensure the "Reset Password" template is configured with your custom template

-- Example custom email template content:
/*
Subject: Reset your DharmaSaathi password

<h2>Reset your password</h2>
<p>Hi there,</p>
<p>Someone requested a password reset for your DharmaSaathi account.</p>
<p>If this was you, click the button below to reset your password:</p>
<p>
  <a href="{{ .ConfirmationURL }}">Reset Password</a>
  <!-- For local testing ensure Redirect URLs include http://localhost:3000/reset-password -->
</p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>This link will expire in 1 hour.</p>
<br>
<p>Best regards,<br>The DharmaSaathi Team</p>
*/

-- Ensure the site URL is configured correctly in Supabase settings
-- Go to Authentication > Settings > Site URL
-- Set it to your production domain (e.g., https://dharmasaathi.com)

-- For local development, you may need to add localhost to allowed redirect URLs
-- Go to Authentication > Settings > Redirect URLs
-- Add: http://localhost:3000/reset-password

-- Create a function to log password reset attempts (optional, for analytics)
CREATE OR REPLACE FUNCTION log_password_reset_attempt(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log the password reset attempt
  INSERT INTO auth.audit_log_entries (
    instance_id,
    id,
    payload,
    created_at,
    ip_address
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    json_build_object(
      'action', 'password_reset_requested',
      'email', user_email,
      'timestamp', NOW()
    ),
    NOW(),
    inet_client_addr()
  );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION log_password_reset_attempt(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_password_reset_attempt(TEXT) TO anon;
