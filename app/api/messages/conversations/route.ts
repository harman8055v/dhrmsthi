import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
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
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch user's matches (these become conversations when there are messages)
    const { data: matches, error: matchesError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // Get other user IDs from matches
    const matchIds = matches.map(m => m.id);
    const otherUserIds = matches.map(match => 
      match.user1_id === user.id ? match.user2_id : match.user1_id
    );

    // Batch fetch: Get ALL last messages for ALL matches in ONE query
    const { data: allLastMessages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('match_id, content, created_at, sender_id')
      .in('match_id', matchIds)
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }

    // Group last messages by match_id (take first message per match since ordered by created_at DESC)
    const lastMessagesByMatch = new Map();
    allLastMessages?.forEach(msg => {
      if (!lastMessagesByMatch.has(msg.match_id)) {
        lastMessagesByMatch.set(msg.match_id, msg);
      }
    });

    // Batch fetch: Get ALL unread messages for ALL matches in ONE query
    const { data: allUnreadMessages, error: unreadError } = await supabaseAdmin
      .from('messages')
      .select('match_id, id')
      .in('match_id', matchIds)
      .neq('sender_id', user.id)
      .is('read_at', null);

    if (unreadError) {
      console.error('Error fetching unread messages:', unreadError);
    }

    // Count unread messages per match
    const unreadCountsByMatch = new Map();
    allUnreadMessages?.forEach(msg => {
      const count = unreadCountsByMatch.get(msg.match_id) || 0;
      unreadCountsByMatch.set(msg.match_id, count + 1);
    });

    // Batch fetch: Get ALL other users' profiles in ONE query
    const { data: otherUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        city:cities(name),
        state:states(name),
        country:countries(name)
      `)
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

    // Process all photo URLs in parallel
    const processPhotoUrl = async (photoPath: string, userId: string): Promise<string | null> => {
      if (!photoPath) return null;
      
      try {
        // Handle both direct URLs and storage paths
        if (photoPath.startsWith('http')) {
          return photoPath;
        }
        
        // Generate signed URL for storage path with longer expiry for conversations
        const { data } = await supabaseAdmin.storage
          .from('user-photos')
          .createSignedUrl(photoPath, 7200); // 2 hour expiry for better caching
        
        return data?.signedUrl || null;
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
    const conversations = matches.map(match => {
      const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
      const otherUser = userMap.get(otherUserId);

      if (!otherUser) {
        return null; // Skip if we couldn't load the other user
      }

      // Get pre-fetched data from our maps
      const lastMessage = lastMessagesByMatch.get(match.id);
      const unreadCount = unreadCountsByMatch.get(match.id) || 0;
      const profilePhotoUrl = photoUrlMap.get(otherUserId);

      return {
        id: match.id,
        user1_id: match.user1_id,
        user2_id: match.user2_id,
        created_at: match.created_at,
        last_message_at: match.last_message_at,
        last_message_text: lastMessage?.content || null,
        unread_count: unreadCount,
        other_user: {
          ...otherUser,
          profile_photo_url: profilePhotoUrl,
          user_photos: otherUser.user_photos || [] // Keep original array but don't process for signed URLs
        }
      };
    });

    // Filter out null results and they're already sorted by the original query
    const validConversations = conversations.filter(conv => conv !== null);

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