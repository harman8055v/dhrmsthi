import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '20')
    const includeRead = searchParams.get('includeRead') === 'true'

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user notifications using the database function
    const { data: notifications, error } = await supabase.rpc('get_user_notifications', {
      user_uuid: userId,
      page_size: limit,
      page_offset: page * limit,
      include_read: includeRead
    })

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    return NextResponse.json({ notifications: notifications || [] })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'create': {
        const { recipientId, templateType, templateData, senderId } = params

        if (!recipientId || !templateType) {
          return NextResponse.json({ 
            error: 'recipientId and templateType are required' 
          }, { status: 400 })
        }

        // Create notification using database function
        const { data: notificationId, error } = await supabase.rpc('create_notification_from_template', {
          template_type: templateType,
          recipient_uuid: recipientId,
          sender_uuid: senderId || null,
          template_data: templateData || {}
        })

        if (error) {
          console.error('Error creating notification:', error)
          return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
        }

        return NextResponse.json({ notificationId, success: true })
      }

      case 'markAsRead': {
        const { userId, notificationIds } = params

        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        // Mark notifications as read using database function
        const { data: updatedCount, error } = await supabase.rpc('mark_notifications_read', {
          user_uuid: userId,
          notification_ids: notificationIds || null
        })

        if (error) {
          console.error('Error marking notifications as read:', error)
          return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
        }

        return NextResponse.json({ updatedCount, success: true })
      }

      case 'getCounts': {
        const { userId } = params

        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        // Get notification counts using database function
        const { data: countsData, error } = await supabase.rpc('get_notification_counts', {
          user_uuid: userId
        })

        if (error) {
          console.error('Error fetching notification counts:', error)
          return NextResponse.json({ error: 'Failed to fetch notification counts' }, { status: 500 })
        }

        const counts = countsData?.[0] || {
          total_count: 0,
          unread_count: 0,
          social_count: 0,
          marketing_count: 0,
          system_count: 0
        }

        return NextResponse.json({ counts })
      }

      case 'updateSettings': {
        const { userId, settings } = params

        if (!userId || !settings) {
          return NextResponse.json({ 
            error: 'User ID and settings are required' 
          }, { status: 400 })
        }

        // Update notification settings
        const { error } = await supabase
          .from('notification_settings')
          .upsert([
            {
              user_id: userId,
              ...settings
            }
          ])

        if (error) {
          console.error('Error updating notification settings:', error)
          return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
      }

      case 'getSettings': {
        const { userId } = params

        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        // Get notification settings
        const { data: settings, error } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching notification settings:', error)
          return NextResponse.json({ error: 'Failed to fetch notification settings' }, { status: 500 })
        }

        return NextResponse.json({ settings: settings || null })
      }

      case 'cleanup': {
        // Clean up expired notifications
        const { data: deletedCount, error } = await supabase.rpc('cleanup_expired_notifications')

        if (error) {
          console.error('Error cleaning up notifications:', error)
          return NextResponse.json({ error: 'Failed to cleanup notifications' }, { status: 500 })
        }

        return NextResponse.json({ deletedCount, success: true })
      }

      case 'bulkCreate': {
        const { notifications } = params

        if (!Array.isArray(notifications) || notifications.length === 0) {
          return NextResponse.json({ 
            error: 'notifications array is required' 
          }, { status: 400 })
        }

        const results = []
        
        for (const notification of notifications) {
          const { recipientId, templateType, templateData, senderId } = notification

          if (!recipientId || !templateType) {
            results.push({ error: 'recipientId and templateType are required' })
            continue
          }

          try {
            const { data: notificationId, error } = await supabase.rpc('create_notification_from_template', {
              template_type: templateType,
              recipient_uuid: recipientId,
              sender_uuid: senderId || null,
              template_data: templateData || {}
            })

            if (error) {
              results.push({ error: error.message })
            } else {
              results.push({ notificationId, success: true })
            }
          } catch (err) {
            results.push({ error: 'Failed to create notification' })
          }
        }

        return NextResponse.json({ results })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, updates } = body

    if (!notificationId || !updates) {
      return NextResponse.json({ 
        error: 'notificationId and updates are required' 
      }, { status: 400 })
    }

    // Update notification
    const { error } = await supabase
      .from('notifications')
      .update(updates)
      .eq('id', notificationId)

    if (error) {
      console.error('Error updating notification:', error)
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('notificationId')
    const userId = searchParams.get('userId')

    if (!notificationId && !userId) {
      return NextResponse.json({ 
        error: 'notificationId or userId is required' 
      }, { status: 400 })
    }

    let query = supabase.from('notifications').delete()

    if (notificationId) {
      query = query.eq('id', notificationId)
    } else if (userId) {
      query = query.eq('recipient_id', userId)
    }

    const { error } = await query

    if (error) {
      console.error('Error deleting notification(s):', error)
      return NextResponse.json({ error: 'Failed to delete notification(s)' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
