# Admin System Setup Guide

## 🚨 Admin Sign-In Issues Fixed

The admin sign-in system has been completely overhauled to fix authentication issues. Here's how to set it up properly.

## 📋 Prerequisites

1. **Supabase Service Role Key**: Make sure you have `SUPABASE_SERVICE_ROLE_KEY` in your `.env.local` file
2. **Database Access**: You need access to run SQL scripts on your Supabase database

## 🔧 Setup Steps

### Step 1: Run Database Setup Script

Execute the comprehensive admin system setup script:

```sql
-- Run this in your Supabase SQL editor
-- File: scripts/setup-admin-system.sql
```

This script will:
- ✅ Add `role` column to users table
- ✅ Add `is_active` column to users table  
- ✅ Create `login_history` table
- ✅ Create admin promotion functions
- ✅ Set up proper RLS policies
- ✅ Grant necessary permissions

### Step 2: Create First Admin User

#### Option A: Interactive Script (Recommended)

```bash
node scripts/create-first-admin.js
```

This script will:
- ✅ Check for existing admin users
- ✅ Prompt for admin details (email, name, password)
- ✅ Create user in Supabase Auth
- ✅ Create user profile in users table
- ✅ Set role to `super_admin`
- ✅ Log the creation

#### Option B: Manual SQL

If you prefer to create admin manually:

```sql
-- First, create user in auth (replace with your details)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@yourdomain.com',
  crypt('your-password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- Then create profile in users table
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  email_verified,
  onboarding_completed,
  verification_status,
  account_status
) VALUES (
  'user-id-from-auth',
  'admin@yourdomain.com',
  'Admin',
  'User',
  'super_admin',
  true,
  true,
  true,
  'verified',
  'premium'
);
```

#### Option C: Promote Existing User

If you already have a user account and want to make them admin:

```sql
-- Replace with the user's email
SELECT promote_user_to_admin('user@example.com', 'super_admin');
```

## 🔍 Troubleshooting

### Common Issues

#### 1. "User profile not found" Error
**Cause**: User exists in auth but not in users table
**Solution**: Run the setup script and create proper user profile

#### 2. "Access denied. Admin privileges required" Error
**Cause**: User exists but doesn't have admin role
**Solution**: Promote user to admin using the function

#### 3. "Role column does not exist" Error
**Cause**: Database setup not completed
**Solution**: Run `scripts/setup-admin-system.sql`

#### 4. "Authentication failed" Error
**Cause**: Invalid credentials or user doesn't exist
**Solution**: Check email/password or create admin user

### Debug Information

The admin login page now shows detailed debug information including:
- ✅ User authentication status
- ✅ User profile data
- ✅ Role information
- ✅ Specific error details
- ✅ Suggested solutions

### Testing Admin Access

1. **Check if admin users exist**:
```sql
SELECT id, email, first_name, last_name, role 
FROM users 
WHERE role IN ('admin', 'super_admin');
```

2. **Test admin role function**:
```sql
SELECT email, role, is_admin_role(role) as is_admin
FROM users 
WHERE role IS NOT NULL;
```

3. **Check login history**:
```sql
SELECT * FROM login_history 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🔐 Security Notes

- ✅ All admin logins are logged in `login_history` table
- ✅ Failed login attempts are tracked with reasons
- ✅ Admin roles are case-insensitive for flexibility
- ✅ RLS policies ensure proper access control
- ✅ Service role key required for admin user creation

## 🎯 Admin Roles

The system supports these admin roles:
- `admin` - Basic admin access
- `super_admin` - Full admin access (recommended)
- `superadmin` - Alternative spelling (auto-converted)

## 📞 Support

If you encounter issues:

1. **Check debug info** on the login page
2. **Verify database setup** with the SQL script
3. **Check user existence** in both auth and users tables
4. **Review login history** for failed attempts
5. **Ensure proper role assignment**

## 🚀 Quick Start

For immediate setup:

```bash
# 1. Run database setup
# Execute scripts/setup-admin-system.sql in Supabase

# 2. Create admin user
node scripts/create-first-admin.js

# 3. Login at /admin/login
```

The admin system is now fully functional with proper error handling and debugging capabilities! 