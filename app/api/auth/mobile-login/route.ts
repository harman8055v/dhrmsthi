import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify user exists and get their details
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.mobile_verified) {
      return NextResponse.json({ error: 'Mobile not verified' }, { status: 403 });
    }

    // Get the auth user to check if they have a session
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError || !authUser) {
      console.error('Auth user not found:', authError);
      return NextResponse.json({ error: 'Authentication user not found' }, { status: 404 });
    }

    // For mobile login, we need to create a custom session
    // Since the user logged in via OTP, we'll create an access token for them
    const { data: session, error: sessionError } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      email_confirm: true,
      user_metadata: {
        mobile_login: true,
        last_mobile_login: new Date().toISOString()
      }
    });

    // Return user data for client-side handling
    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        isOnboarded: user.is_onboarded,
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: user.full_name
      }
    });
    
  } catch (err: any) {
    console.error('Mobile login error:', err);
    return NextResponse.json({ 
      error: err.message || 'Internal error' 
    }, { status: 500 });
  }
} 