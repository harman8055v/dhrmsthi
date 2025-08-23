import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies(); 
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

    // Get request body
    const { match_id, content } = await request.json();

    if (!match_id || !content || !content.trim()) {
      return NextResponse.json({ error: 'Match ID and message content are required' }, { status: 400 });
    }

    // Verify user is part of the match
    const { data: match, error: matchError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('id', match_id)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found or access denied' }, { status: 404 });
    }

    // Insert the message
    console.log('[API] Inserting message for match:', match_id, 'from user:', user.id);
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        match_id,
        sender_id: user.id,
        content: content.trim(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (messageError) {
      console.error('[API] Error inserting message:', messageError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    console.log('[API] Message inserted successfully:', message.id);

    // Update match's last_message_at
    const { error: updateError } = await supabaseAdmin
      .from('matches')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', match_id);

    if (updateError) {
      console.error('Error updating match last_message_at:', updateError);
      // Don't fail the request for this
    }

    // 🔔 SEND PUSH NOTIFICATION TO RECIPIENT (fast path) + enqueue job for reliability
    try {
      // Get the recipient (other user in the match)
      const recipientId = match.user1_id === user.id ? match.user2_id : match.user1_id;
      
      // Get sender info for notification
      const { data: senderProfile } = await supabaseAdmin
        .from('users')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      const senderName = senderProfile 
        ? `${senderProfile.first_name} ${senderProfile.last_name}`
        : 'Someone';

      // Send push notification immediately (non-blocking)
      const notificationPromise = fetch(new URL('/api/expo/send', request.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('Cookie') || '', // Forward session
          'x-internal-api-key': process.env.INTERNAL_API_KEY || '',
        },
        body: JSON.stringify({
          userId: recipientId,
          title: `💕 New message from ${senderName}`,
          body: content.length > 50 ? content.substring(0, 47) + '...' : content,
          data: {
            type: 'message',
            matchId: match_id,
            senderId: user.id,
            route: `/dashboard/messages/${match_id}`
          }
        }),
      }).then(async (r) => {
        const txt = await r.text().catch(() => '')
        console.log('[Push] /api/expo/send status:', r.status, 'body:', txt?.slice(0, 200))
      }).catch(error => {
        console.error('Push notification failed:', error);
        // Don't fail the message send if notification fails
      });

      // Don't await - let notification send in background
      console.log('Push notification triggered for recipient:', recipientId);

      // Also enqueue a job for reliability & analytics
      try {
        const minuteBucket = Math.floor(Date.now() / 60000); // 1-minute dedupe window
        await supabaseAdmin.rpc('enqueue_notification_job', {
          p_type: 'message',
          p_recipient_id: recipientId,
          p_payload: {
            preview: content.length > 140 ? content.substring(0, 137) + '...' : content,
            matchId: match_id,
            senderId: user.id
          },
          p_scheduled_at: null,
          p_dedupe_key: `msg:${match_id}:${recipientId}:${minuteBucket}`,
        } as any);
      } catch (e) {
        console.warn('Failed to enqueue message notification job', e);
      }
      
    } catch (notificationError) {
      console.error('Error sending push notification:', notificationError);
      // Don't fail message send if notification fails
    }

    return NextResponse.json({ 
      success: true, 
      message: {
        id: message.id,
        match_id: message.match_id,
        sender_id: message.sender_id,
        content: message.content,
        created_at: message.created_at,
        is_highlighted: message.is_highlighted,
        read_at: message.read_at
      }
    });

  } catch (error) {
    console.error('Error in messages API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies(); 
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

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('match_id');

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }

    // Verify user is part of the match
    const { data: match, error: matchError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found or access denied' }, { status: 404 });
    }

    // Get messages for this match
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ 
      messages: messages || [],
      total: messages?.length || 0
    });

  } catch (error) {
    console.error('Error in messages GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies(); 
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

    // Get request body
    const { match_id, action } = await request.json();

    if (!match_id || action !== 'mark_read') {
      return NextResponse.json({ error: 'Match ID and valid action are required' }, { status: 400 });
    }

    // Verify user is part of the match
    const { data: match, error: matchError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('id', match_id)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found or access denied' }, { status: 404 });
    }

    // Mark all unread messages in this match as read (except user's own messages)
    const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
    
    const { error: updateError } = await supabaseAdmin
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('match_id', match_id)
      .eq('sender_id', otherUserId)
      .is('read_at', null);

    if (updateError) {
      console.error('Error marking messages as read:', updateError);
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in messages PATCH API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 