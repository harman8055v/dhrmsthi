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

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch user's matches
    const { data: matches, error: matchesError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({ matches: [] });
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
      (otherUsers || []).map(async (user) => {
        let processedPhotos: string[] = [];
        let processedProfilePhoto = null;

        // Process profile photo
        if (user.profile_photo_url) {
          processedProfilePhoto = await processPhotoUrl(user.profile_photo_url, user.id);
        }

        // Process user photos array
        if (user.user_photos && Array.isArray(user.user_photos)) {
          const photoPromises = user.user_photos.map(async (photoPath: string) => {
            return await processPhotoUrl(photoPath, user.id);
          });
          
          const processedPhotoResults = await Promise.all(photoPromises);
          processedPhotos = processedPhotoResults.filter((url: string | null) => url !== null);
        }

        return {
          ...user,
          profile_photo_url: processedProfilePhoto,
          user_photos: processedPhotos
        };
      })
    );

    // Create a map for easy lookup
    const userMap = new Map();
    processedUsers.forEach(user => {
      userMap.set(user.id, user);
    });

    // Combine matches with user data
    const matchesWithUsers = matches.map(match => {
      const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
      const otherUser = userMap.get(otherUserId);

      return {
        id: match.id,
        user1_id: match.user1_id,
        user2_id: match.user2_id,
        created_at: match.created_at,
        last_message_at: match.last_message_at,
        other_user: otherUser || null
      };
    }).filter(match => match.other_user !== null); // Filter out matches where user data couldn't be loaded

    return NextResponse.json({ 
      matches: matchesWithUsers,
      total: matchesWithUsers.length 
    });

  } catch (error) {
    console.error('Error in matches API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 