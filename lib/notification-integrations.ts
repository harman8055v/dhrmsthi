/**
 * Integration Examples for Supabase Notifications
 * Add these to your existing API routes to automatically create notifications
 */

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Helper function to create notifications
 */
async function createNotification(
  templateType: string,
  recipientId: string,
  templateData: Record<string, any> = {},
  senderId?: string
): Promise<string | null> {
  try {
    const { data: notificationId, error } = await supabase.rpc('create_notification_from_template', {
      template_type: templateType,
      recipient_uuid: recipientId,
      sender_uuid: senderId || null,
      template_data: templateData
    })

    if (error) {
      console.error('Failed to create notification:', error)
      return null
    }

    return notificationId
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

// =============================================================================
// EXAMPLE 1: Messages API Integration
// Add this to your /api/messages route
// =============================================================================

export async function createMessageNotification(messageData: {
  recipientId: string
  senderId: string
  content: string
  matchId: string
  senderName: string
}) {
  const { recipientId, senderId, content, matchId, senderName } = messageData

  // Create message preview
  const messagePreview = content.length > 50 
    ? content.substring(0, 50) + '...' 
    : content

  // Create notification
  await createNotification(
    'message',
    recipientId,
    {
      sender_name: senderName,
      message_preview: messagePreview,
      match_id: matchId,
      message_id: 'generated_message_id' // Replace with actual message ID
    },
    senderId
  )
}

// Example usage in your messages API:
/*
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientId, senderId, content, matchId } = body
    
    // Your existing message creation logic...
    const message = await createMessage(body)
    
    // Get sender name
    const { data: sender } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', senderId)
      .single()
    
    // Create notification
    await createMessageNotification({
      recipientId,
      senderId,
      content,
      matchId,
      senderName: sender?.full_name || 'Someone'
    })
    
    return NextResponse.json({ message, success: true })
  } catch (error) {
    // Error handling...
  }
}
*/

// =============================================================================
// EXAMPLE 2: Swipe API Integration (Likes & Matches)
// Add this to your /api/swipe route
// =============================================================================

export async function createLikeNotification(likeData: {
  likerId: string
  likedUserId: string
  isSuperLike: boolean
  likerName: string
}) {
  const { likerId, likedUserId, isSuperLike, likerName } = likeData

  const notificationType = isSuperLike ? 'superlike' : 'like'

  await createNotification(
    notificationType,
    likedUserId,
    {
      sender_name: likerName,
      like_id: 'generated_like_id', // Replace with actual like ID
      is_super_like: isSuperLike
    },
    likerId
  )
}

export async function createMatchNotification(matchData: {
  user1Id: string
  user2Id: string
  user1Name: string
  user2Name: string
  matchId: string
}) {
  const { user1Id, user2Id, user1Name, user2Name, matchId } = matchData

  // Create notification for user1
  await createNotification(
    'match',
    user1Id,
    {
      sender_name: user2Name,
      match_id: matchId
    },
    user2Id
  )

  // Create notification for user2
  await createNotification(
    'match',
    user2Id,
    {
      sender_name: user1Name,
      match_id: matchId
    },
    user1Id
  )
}

// Example usage in your swipe API:
/*
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, targetUserId, action } = body // action: 'like' | 'superlike'
    
    // Your existing swipe logic...
    const result = await processSwipe(body)
    
    if (result.liked) {
      // Get user names
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', [userId, targetUserId])
      
      const liker = users.find(u => u.id === userId)
      const liked = users.find(u => u.id === targetUserId)
      
      // Create like notification
      await createLikeNotification({
        likerId: userId,
        likedUserId: targetUserId,
        isSuperLike: action === 'superlike',
        likerName: liker?.full_name || 'Someone'
      })
      
      // If it's a match, create match notifications
      if (result.isMatch) {
        await createMatchNotification({
          user1Id: userId,
          user2Id: targetUserId,
          user1Name: liker?.full_name || 'Someone',
          user2Name: liked?.full_name || 'Someone',
          matchId: result.matchId
        })
      }
    }
    
    return NextResponse.json({ result, success: true })
  } catch (error) {
    // Error handling...
  }
}
*/

// =============================================================================
// EXAMPLE 3: Marketing Campaign Notifications
// =============================================================================

export async function createMarketingCampaign(campaignData: {
  targetUserIds: string[]
  campaignType: 'seasonal_promo' | 'feature_launch' | 'subscription_promo'
  campaignTitle: string
  campaignMessage: string
  campaignUrl?: string
  promoCode?: string
  discount?: number
}) {
  const { 
    targetUserIds, 
    campaignType, 
    campaignTitle, 
    campaignMessage, 
    campaignUrl,
    promoCode,
    discount
  } = campaignData

  const templateData = {
    campaign_title: campaignTitle,
    campaign_message: campaignMessage,
    campaign_url: campaignUrl,
    promo_code: promoCode,
    discount: discount?.toString()
  }

  // Create notifications for all target users
  const results = await Promise.allSettled(
    targetUserIds.map(userId => 
      createNotification(campaignType, userId, templateData)
    )
  )

  const successCount = results.filter(r => r.status === 'fulfilled').length
  const errorCount = results.filter(r => r.status === 'rejected').length

  console.log(`Marketing campaign sent: ${successCount} success, ${errorCount} errors`)
  
  return { successCount, errorCount }
}

// =============================================================================
// EXAMPLE 4: System Notifications
// =============================================================================

export async function createSystemNotification(
  type: 'account_verification' | 'security_alert' | 'maintenance',
  userId: string,
  data: Record<string, any> = {}
) {
  await createNotification(type, userId, data)
}

// =============================================================================
// EXAMPLE 5: Engagement Notifications
// =============================================================================

export async function createEngagementNotifications() {
  // Daily reminder for inactive users
  const { data: inactiveUsers } = await supabase
    .from('users')
    .select('id')
    .lt('last_active', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  if (inactiveUsers) {
    await Promise.allSettled(
      inactiveUsers.map(user => 
        createNotification('daily_reminder', user.id)
      )
    )
  }
}

// =============================================================================
// EXAMPLE 6: Profile View Notifications
// =============================================================================

export async function createProfileViewNotification(viewData: {
  viewerId: string
  viewedUserId: string
  viewerName: string
}) {
  const { viewerId, viewedUserId, viewerName } = viewData

  await createNotification(
    'profile_view',
    viewedUserId,
    {
      sender_name: viewerName
    },
    viewerId
  )
}

// =============================================================================
// EXAMPLE 7: Achievement Notifications
// =============================================================================

export async function createAchievementNotification(achievementData: {
  userId: string
  achievementName: string
  achievementDescription: string
}) {
  const { userId, achievementName, achievementDescription } = achievementData

  await createNotification(
    'achievement',
    userId,
    {
      achievement_name: achievementName,
      achievement_description: achievementDescription
    }
  )
}

// =============================================================================
// EXAMPLE 8: Subscription & Billing Notifications
// =============================================================================

export async function createSubscriptionReminder(userId: string) {
  await createNotification('subscription_reminder', userId)
}

export async function createBillingReminder(userId: string, daysUntilDue: number) {
  await createNotification(
    'billing_reminder',
    userId,
    {
      days_until_due: daysUntilDue.toString()
    }
  )
}

// =============================================================================
// EXAMPLE 9: Batch Notifications
// =============================================================================

export async function sendBatchNotifications(notifications: Array<{
  recipientId: string
  templateType: string
  templateData?: Record<string, any>
  senderId?: string
}>) {
  const results = await Promise.allSettled(
    notifications.map(({ recipientId, templateType, templateData, senderId }) =>
      createNotification(templateType, recipientId, templateData, senderId)
    )
  )

  return {
    total: notifications.length,
    successful: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length
  }
}

// Export the helper function for use in other files
export { createNotification }
