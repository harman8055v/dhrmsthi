import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Use async cookies to avoid Next.js warning
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user's plan for messaging access
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('account_status')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Only allow messaging for premium plans (sparsh, sangam, samarpan)
    const hasMessagingAccess = ['sparsh', 'sangam', 'samarpan'].includes(userProfile.account_status || '');
    if (!hasMessagingAccess) {
      return NextResponse.json({ 
        error: 'Upgrade required', 
        message: 'Messaging is available with Sparsh Plan or higher. Upgrade to start conversations with your matches.',
        upgrade_url: '/dashboard/store'
      }, { status: 403 });
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    // Offset is currently ignored by RPC; UI does not paginate beyond first page
    // const offset = parseInt(searchParams.get('offset') || '0');

    // Use optimized RPC that reads from conversation_summaries with DISTINCT ON for last message
    const { data: convRows, error: convError } = await supabaseAdmin.rpc(
      'get_user_conversations',
      { user_id: user.id, limit_count: limit }
    );

    if (convError) {
      console.error('Error fetching user conversations (RPC):', convError);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    if (!convRows || convRows.length === 0) {
      return NextResponse.json({ conversations: [], total: 0, hasMore: false });
    }

    const matchIds = convRows.map((r: any) => r.match_id);
    const otherUserIds = convRows.map((r: any) => r.other_user_id);

    // Batch fetch: Get ALL other users' profiles in ONE query
    const { data: otherUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, profile_photo_url, user_photos')
      .in('id', otherUserIds);

    if (usersError) {
      console.error('Error fetching user profiles:', usersError);
      return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 });
    }

    // Create a map for easy lookup
    const userMap = new Map();
    otherUsers?.forEach(userProfile => {
      userMap.set(userProfile.id, userProfile);
    });

    // Build public URL for photos (bucket is public)
    const processPhotoUrl = async (photoPath: string, userId: string): Promise<string | null> => {
      if (!photoPath) return null;
      try {
        if (photoPath.startsWith('http')) {
          return photoPath;
        }
        const cleanPath = photoPath.replace(/^\/+/, '');
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-photos/${cleanPath}`;
      } catch (error) {
        console.error(`Error processing photo URL ${photoPath} for user ${userId}:`, error);
        return null;
      }
    };

    // Prepare all photo processing promises
    const photoProcessingPromises = otherUsers?.map(async (userProfile) => {
      if (userProfile.profile_photo_url) {
        const processedUrl = await processPhotoUrl(userProfile.profile_photo_url, userProfile.id);
        return { userId: userProfile.id, photoUrl: processedUrl };
      }
      return { userId: userProfile.id, photoUrl: null };
    }) || [];

    // Process all photos in parallel
    const processedPhotos = await Promise.all(photoProcessingPromises);
    
    // Create photo URL map
    const photoUrlMap = new Map();
    processedPhotos.forEach(({ userId, photoUrl }) => {
      photoUrlMap.set(userId, photoUrl);
    });

    // Build conversations array efficiently (no async operations in map)
    const conversations = convRows.map((row: any) => {
      const otherUser = userMap.get(row.other_user_id);
      if (!otherUser) return null;

      const profilePhotoUrl = photoUrlMap.get(row.other_user_id);

      return {
        id: row.match_id,
        // user1_id/user2_id are not required by UI here and omitted for lighter payload
        created_at: row.created_at,
        // Prefer precise last message time from RPC; fall back to created_at
        last_message_at: row.last_message_time || row.last_message_at || row.created_at,
        last_message_text: row.last_message_text || null,
        unread_count: Number(row.unread_count || 0),
        other_user: {
          ...otherUser,
          profile_photo_url: profilePhotoUrl,
          user_photos: otherUser.user_photos || []
        }
      };
    });

    // Filter out null results and they're already sorted by the original query
    const validConversations = conversations.filter((conv: any) => conv !== null);

    return NextResponse.json({ 
      conversations: validConversations,
      total: validConversations.length,
      hasMore: validConversations.length === limit 
    });

  } catch (error) {
    console.error('Error in conversations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}