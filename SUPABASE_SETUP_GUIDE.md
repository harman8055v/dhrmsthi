# Supabase Setup Guide - Fix "Creating Account" Stuck Issue

## The Problem
Your signup is getting stuck because the Supabase environment variables are not set. The app is trying to use a fallback demo URL that doesn't exist.

## Quick Fix

### 1. Create `.env.local` file
Create a file named `.env.local` in your project root with these values:

```bash
# Your Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Your Supabase anon key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Based on your console output, your URL appears to be:**
```
NEXT_PUBLIC_SUPABASE_URL=https://kcuqbsrurlkfuxrybwqq.supabase.co
```

### 2. Get Your Supabase Credentials

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project (or create one if you don't have one)
3. Go to **Settings** > **API**
4. Copy these values:
   - **Project URL** → paste as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Restart Your Development Server

After adding the `.env.local` file:

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

### 4. Test Your Connection

Go to [http://localhost:3000/test-supabase](http://localhost:3000/test-supabase) to run comprehensive connection tests.

### 5. Verify It's Working

1. Check browser console - you should NOT see:
   ```
   [supabase] Missing NEXT_PUBLIC_SUPABASE_URL / KEY – running in fallback demo mode
   ```

2. Click the "Test Supabase Connection" button on the signup page
   - Should show "✅ Supabase connection OK!"

3. Try signing up again

## If You Don't Have a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign up/login
3. Click "New Project"
4. Fill in:
   - Project name: `dharmasaathi` (or any name)
   - Database password: (save this!)
   - Region: Choose closest to you
5. Wait for project to be created
6. Follow steps above to get your credentials

## Common Issues

### Issue: "Signup timeout"
- Your `.env.local` file is missing or has incorrect values
- Check that you've restarted your dev server after adding `.env.local`
- Make sure there are no typos in your Supabase URL or key
- Ensure your Supabase project is not paused

### Issue: "Project is paused"
- Free Supabase projects pause after 1 week of inactivity
- Go to your project dashboard and click "Restore"

### Issue: Still getting timeout
- Check if your Supabase URL is correct (no typos)
- Make sure you're connected to the internet
- Try opening your Supabase URL in browser - should show "Supabase"
- Check if your firewall is blocking the connection

### Issue: "Failed to fetch" errors
- Your domain might need to be added to allowed URLs
- In Supabase: Authentication > URL Configuration
- Add `http://localhost:3000` to allowed URLs

## Debug Steps

1. **Check console for environment variables:**
   ```javascript
   console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
   console.log(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
   ```

2. **Use the test page:** [http://localhost:3000/test-supabase](http://localhost:3000/test-supabase)

3. **Clear Next.js cache if needed:**
   ```bash
   rm -rf .next
   npm run dev
   ```

## Need More Help?

Share this information:
1. Browser console output when trying to sign up
2. Result of "Test Supabase Connection" button
3. Results from the test page at `/test-supabase`
4. Your Supabase project URL (not the keys!)
5. Any error messages you see 