import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
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

    // Fetch user's matches (these become conversations when there are messages)
    const { data: matches, error: matchesError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // Get other user IDs from matches
    const otherUserIds = matches.map(match => 
      match.user1_id === user.id ? match.user2_id : match.user1_id
    );

    // Fetch other users' profiles with full data
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

    // Process photo URLs to get signed URLs
    const processPhotoUrl = async (photoPath: string, userId: string): Promise<string | null> => {
      if (!photoPath) return null;
      
      try {
        // Handle both direct URLs and storage paths
        if (photoPath.startsWith('http')) {
          return photoPath;
        }
        
        // Generate signed URL for storage path
        const { data } = await supabaseAdmin.storage
          .from('user-photos')
          .createSignedUrl(photoPath, 3600); // 1 hour expiry
        
        return data?.signedUrl || null;
      } catch (error) {
        console.error(`Error processing photo URL ${photoPath} for user ${userId}:`, error);
        return null;
      }
    };

    // Process user photos with signed URLs
    const processedUsers = await Promise.all(
      (otherUsers || []).map(async (userProfile) => {
        let processedPhotos: string[] = [];
        let processedProfilePhoto = null;

        // Process profile photo
        if (userProfile.profile_photo_url) {
          processedProfilePhoto = await processPhotoUrl(userProfile.profile_photo_url, userProfile.id);
        }

        // Process user photos array
        if (userProfile.user_photos && Array.isArray(userProfile.user_photos)) {
          const photoPromises = userProfile.user_photos.map(async (photoPath: string) => {
            return await processPhotoUrl(photoPath, userProfile.id);
          });
          
          const processedPhotoResults = await Promise.all(photoPromises);
          processedPhotos = processedPhotoResults.filter((url: string | null) => url !== null);
        }

        return {
          ...userProfile,
          profile_photo_url: processedProfilePhoto,
          user_photos: processedPhotos
        };
      })
    );

    // Create a map for easy lookup
    const userMap = new Map();
    processedUsers.forEach(userProfile => {
      userMap.set(userProfile.id, userProfile);
    });

    // For each match, get the last message and unread count
    const conversationsWithMessages = await Promise.all(
      matches.map(async (match) => {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const otherUser = userMap.get(otherUserId);

        if (!otherUser) {
          return null; // Skip if we couldn't load the other user
        }

        // Get last message for this match
        const { data: lastMessage } = await supabaseAdmin
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('match_id', match.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread message count (messages from other user that current user hasn't read)
        // Use a more robust query that handles edge cases
        let unreadCount = 0;
        try {
          const { data: unreadMessages, error: unreadError } = await supabaseAdmin
            .from('messages')
            .select('id, created_at, read_at')
            .eq('match_id', match.id)
            .eq('sender_id', otherUserId)
            .is('read_at', null)
            .order('created_at', { ascending: false });

          if (unreadError) {
            console.error(`[Conversations] Error fetching unread messages for match ${match.id}:`, unreadError);
            unreadCount = 0;
          } else {
            unreadCount = unreadMessages?.length || 0;
            console.log(`[Conversations] Match ${match.id}: ${unreadCount} unread messages from user ${otherUserId}`);
            if (unreadCount > 0) {
              console.log(`[Conversations] Unread message IDs:`, unreadMessages?.map(m => m.id));
            }
          }
        } catch (err) {
          console.error(`[Conversations] Exception counting unread for match ${match.id}:`, err);
          unreadCount = 0;
        }

        return {
          id: match.id,
          user1_id: match.user1_id,
          user2_id: match.user2_id,
          created_at: match.created_at,
          last_message_at: match.last_message_at,
          last_message_text: lastMessage?.content || null,
          unread_count: unreadCount || 0,
          other_user: otherUser
        };
      })
    );

    // Filter out null results and sort by last message time
    const validConversations = conversationsWithMessages
      .filter(conv => conv !== null)
      .sort((a, b) => {
        const aTime = a!.last_message_at || a!.created_at;
        const bTime = b!.last_message_at || b!.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

    return NextResponse.json({ 
      conversations: validConversations,
      total: validConversations.length 
    });

  } catch (error) {
    console.error('Error in conversations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 