import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

/**
 * API route for notification analytics tracking
 * Stores and retrieves notification interaction data
 */

export async function POST(request: NextRequest) {
  try {
    const { 
      eventType, 
      notificationType, 
      notificationCategory, 
      notificationPriority,
      campaignId,
      matchId,
      userId,
      isNativeApp,
      properties 
    } = await request.json()

    if (!eventType || !notificationType) {
      return NextResponse.json({ 
        error: "eventType and notificationType are required" 
      }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Get current user if not provided
    let currentUserId = userId
    if (!currentUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        currentUserId = user.id
      }
    }

    // Store analytics event
    const { error: analyticsError } = await supabase
      .from('notification_analytics')
      .insert({
        event_type: eventType,
        notification_type: notificationType,
        notification_category: notificationCategory,
        notification_priority: notificationPriority,
        campaign_id: campaignId,
        match_id: matchId,
        user_id: currentUserId,
        is_native_app: isNativeApp || false,
        properties: properties || {},
        timestamp: new Date().toISOString()
      })

    if (analyticsError) {
      console.error('Error storing notification analytics:', analyticsError)
      return NextResponse.json({
        error: "Failed to store analytics data"
      }, { status: 500 })
    }

    // Also store in general analytics table
    await supabase
      .from('analytics_events')
      .insert({
        event_type: `notification_${eventType}`,
        user_id: currentUserId,
        properties: {
          notification_type: notificationType,
          notification_category: notificationCategory,
          campaign_id: campaignId,
          match_id: matchId,
          is_native_app: isNativeApp,
          ...properties
        },
        timestamp: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: "Analytics data stored successfully"
    })

  } catch (error) {
    console.error("Notification analytics API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'
    const type = searchParams.get('type')
    const category = searchParams.get('category')

    const supabase = createRouteHandlerClient({ cookies })

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '1d':
        startDate.setDate(now.getDate() - 1)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    let query = supabase
      .from('notification_analytics')
      .select('*')
      .gte('timestamp', startDate.toISOString())

    if (type) {
      query = query.eq('notification_type', type)
    }

    if (category) {
      query = query.eq('notification_category', category)
    }

    const { data: analytics, error } = await query.order('timestamp', { ascending: false })

    if (error) {
      throw error
    }

    // Calculate summary statistics
    const summary = {
      total_events: analytics?.length || 0,
      by_type: {} as Record<string, number>,
      by_category: {} as Record<string, number>,
      by_event_type: {} as Record<string, number>,
      by_platform: {
        native_app: 0,
        web_app: 0
      },
      conversion_rates: {} as Record<string, number>
    }

    analytics?.forEach(event => {
      // Count by type
      summary.by_type[event.notification_type] = (summary.by_type[event.notification_type] || 0) + 1

      // Count by category
      if (event.notification_category) {
        summary.by_category[event.notification_category] = (summary.by_category[event.notification_category] || 0) + 1
      }

      // Count by event type
      summary.by_event_type[event.event_type] = (summary.by_event_type[event.event_type] || 0) + 1

      // Count by platform
      if (event.is_native_app) {
        summary.by_platform.native_app++
      } else {
        summary.by_platform.web_app++
      }
    })

    // Calculate conversion rates
    Object.keys(summary.by_type).forEach(notificationType => {
      const typeEvents = analytics?.filter(e => e.notification_type === notificationType) || []
      const received = typeEvents.filter(e => e.event_type === 'received').length
      const converted = typeEvents.filter(e => e.event_type === 'converted').length
      
      summary.conversion_rates[notificationType] = received > 0 ? (converted / received) * 100 : 0
    })

    // Get campaign performance if available
    const campaignPerformance: Record<string, any> = {}
    
    if (analytics) {
      const campaignIds = [...new Set(analytics.filter(e => e.campaign_id).map(e => e.campaign_id))]
      
      for (const campaignId of campaignIds) {
        const campaignEvents = analytics.filter(e => e.campaign_id === campaignId)
        const received = campaignEvents.filter(e => e.event_type === 'received').length
        const clicked = campaignEvents.filter(e => e.event_type === 'clicked').length
        const converted = campaignEvents.filter(e => e.event_type === 'converted').length
        
        campaignPerformance[campaignId] = {
          total_events: campaignEvents.length,
          received,
          clicked,
          converted,
          click_through_rate: received > 0 ? (clicked / received) * 100 : 0,
          conversion_rate: clicked > 0 ? (converted / clicked) * 100 : 0
        }
      }
    }

    return NextResponse.json({
      summary,
      campaign_performance: campaignPerformance,
      events: analytics || [],
      period,
      date_range: {
        start: startDate.toISOString(),
        end: now.toISOString()
      }
    })

  } catch (error) {
    console.error("Get notification analytics error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch analytics data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
