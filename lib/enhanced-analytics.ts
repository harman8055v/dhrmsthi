import { logger } from './logger'

// Analytics utility for tracking user engagement
interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  timestamp?: Date
}

interface AnalyticsConfig {
  enabled: boolean
  debug: boolean
  apiEndpoint?: string
}

// Notification analytics events
interface NotificationAnalyticsEvent {
  eventType: 'received' | 'opened' | 'clicked' | 'dismissed' | 'converted'
  notificationType: string
  notificationCategory: string
  notificationPriority: string
  campaignId?: string
  matchId?: string
  userId?: string
  isNativeApp: boolean
  timestamp: string
}

class Analytics {
  private config: AnalyticsConfig
  private events: AnalyticsEvent[] = []
  private notificationEvents: NotificationAnalyticsEvent[] = []

  constructor(config: AnalyticsConfig = { enabled: true, debug: false }) {
    this.config = config
    this.loadPersistedEvents()
  }

  // Track an event
  track(event: string, properties?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        url: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "",
        timestamp: new Date().toISOString(),
        sessionId: this.getSessionId(),
      },
      timestamp: new Date(),
    }

    // Store event locally
    this.events.push(analyticsEvent)

    // Debug logging
    if (this.config.debug) {
      logger.log("📊 Analytics Event:", analyticsEvent)
    }

    // Send to analytics service (if configured)
    if (this.config.enabled && this.config.apiEndpoint) {
      this.sendEvent(analyticsEvent)
    }

    // Special handling for notification events
    if (event.startsWith('notification_')) {
      this.handleNotificationAnalytics(event, properties)
    }

    // Store in localStorage for persistence
    this.persistEvents()
  }

  // Handle notification-specific analytics
  private handleNotificationAnalytics(event: string, properties?: Record<string, any>) {
    if (!properties) return

    const eventType = event.replace('notification_', '') as NotificationAnalyticsEvent['eventType']
    
    const notificationEvent: NotificationAnalyticsEvent = {
      eventType,
      notificationType: properties.notification_type || 'unknown',
      notificationCategory: properties.notification_category || 'unknown',
      notificationPriority: properties.notification_priority || 'normal',
      campaignId: properties.campaign_id,
      matchId: properties.match_id,
      userId: properties.user_id,
      isNativeApp: properties.is_native_app || false,
      timestamp: new Date().toISOString()
    }

    this.notificationEvents.push(notificationEvent)

    // Track conversion funnel
    this.trackNotificationFunnel(notificationEvent)

    // Debug logging
    if (this.config.debug) {
      logger.log("📬 Notification Analytics:", notificationEvent)
    }
  }

  // Track notification conversion funnel
  private trackNotificationFunnel(event: NotificationAnalyticsEvent) {
    const funnelData = {
      notification_type: event.notificationType,
      campaign_id: event.campaignId,
      funnel_step: event.eventType,
      timestamp: event.timestamp
    }

    // Calculate conversion rates
    if (event.eventType === 'converted') {
      const relatedEvents = this.notificationEvents.filter(e => 
        e.campaignId === event.campaignId && 
        e.notificationType === event.notificationType
      )

      const receivedCount = relatedEvents.filter(e => e.eventType === 'received').length
      const clickedCount = relatedEvents.filter(e => e.eventType === 'clicked').length
      const convertedCount = relatedEvents.filter(e => e.eventType === 'converted').length

      const clickThroughRate = receivedCount > 0 ? (clickedCount / receivedCount) * 100 : 0
      const conversionRate = clickedCount > 0 ? (convertedCount / clickedCount) * 100 : 0

      this.track('notification_conversion_metrics', {
        ...funnelData,
        click_through_rate: clickThroughRate,
        conversion_rate: conversionRate,
        total_received: receivedCount,
        total_clicked: clickedCount,
        total_converted: convertedCount
      })
    }
  }

  // Get notification analytics summary
  getNotificationAnalytics() {
    const summary = {
      total_events: this.notificationEvents.length,
      by_type: {} as Record<string, number>,
      by_category: {} as Record<string, number>,
      by_event_type: {} as Record<string, number>,
      conversion_rates: {} as Record<string, number>
    }

    this.notificationEvents.forEach(event => {
      // Count by type
      summary.by_type[event.notificationType] = (summary.by_type[event.notificationType] || 0) + 1

      // Count by category
      summary.by_category[event.notificationCategory] = (summary.by_category[event.notificationCategory] || 0) + 1

      // Count by event type
      summary.by_event_type[event.eventType] = (summary.by_event_type[event.eventType] || 0) + 1
    })

    // Calculate conversion rates by notification type
    Object.keys(summary.by_type).forEach(notificationType => {
      const typeEvents = this.notificationEvents.filter(e => e.notificationType === notificationType)
      const received = typeEvents.filter(e => e.eventType === 'received').length
      const converted = typeEvents.filter(e => e.eventType === 'converted').length
      
      summary.conversion_rates[notificationType] = received > 0 ? (converted / received) * 100 : 0
    })

    return summary
  }

  // Track page views
  trackPageView(page: string, properties?: Record<string, any>) {
    this.track("page_view", {
      page,
      ...properties,
    })
  }

  // Track button clicks
  trackButtonClick(buttonName: string, location: string, properties?: Record<string, any>) {
    this.track("button_click", {
      button_name: buttonName,
      location,
      ...properties,
    })
  }

  // Track user interactions
  trackUserInteraction(action: string, element: string, properties?: Record<string, any>) {
    this.track("user_interaction", {
      action,
      element,
      ...properties,
    })
  }

  // Get session ID
  private getSessionId(): string {
    if (typeof window === "undefined") return "server"

    let sessionId = sessionStorage.getItem("analytics_session_id")
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`
      sessionStorage.setItem("analytics_session_id", sessionId)
    }
    return sessionId
  }

  // Send event to analytics service
  private async sendEvent(event: AnalyticsEvent) {
    if (!this.config.apiEndpoint) return

    try {
      await fetch(this.config.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      })
    } catch (error) {
      logger.error("Failed to send analytics event:", error)
    }
  }

  // Store event locally for offline support
  private persistEvents() {
    if (typeof window === "undefined") return

    try {
      const recentEvents = this.events.slice(-100) // Keep last 100 events
      localStorage.setItem("analytics_events", JSON.stringify(recentEvents))
      localStorage.setItem("notification_analytics", JSON.stringify(this.notificationEvents.slice(-100)))
    } catch (error) {
      logger.warn("Failed to persist analytics events:", error)
    }
  }

  // Load persisted events
  private loadPersistedEvents() {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem("analytics_events")
      if (stored) {
        this.events = JSON.parse(stored)
      }

      const notificationStored = localStorage.getItem("notification_analytics")
      if (notificationStored) {
        this.notificationEvents = JSON.parse(notificationStored)
      }
    } catch (error) {
      logger.warn("Failed to load persisted analytics events:", error)
    }
  }

  // Get analytics summary
  getAnalyticsSummary() {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const recentEvents = this.events.filter(e => e.timestamp && e.timestamp > oneDayAgo)
    const weeklyEvents = this.events.filter(e => e.timestamp && e.timestamp > oneWeekAgo)

    return {
      total_events: this.events.length,
      recent_events: recentEvents.length,
      weekly_events: weeklyEvents.length,
      most_tracked_events: this.getMostTrackedEvents(),
      notification_analytics: this.getNotificationAnalytics(),
    }
  }

  // Get most tracked events
  private getMostTrackedEvents() {
    const eventCounts: Record<string, number> = {}
    this.events.forEach(e => {
      eventCounts[e.event] = (eventCounts[e.event] || 0) + 1
    })

    return Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([event, count]) => ({ event, count }))
  }

  // Configure analytics
  configure(config: Partial<AnalyticsConfig>) {
    this.config = { ...this.config, ...config }
  }

  // Clear all analytics data
  clearData() {
    this.events = []
    this.notificationEvents = []
    if (typeof window !== "undefined") {
      localStorage.removeItem("analytics_events")
      localStorage.removeItem("notification_analytics")
      sessionStorage.removeItem("analytics_session_id")
    }
  }
}

// Create and export singleton instance
const analyticsInstance = new Analytics({
  enabled: process.env.NODE_ENV === "production",
  debug: process.env.NODE_ENV === "development",
  apiEndpoint: process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT,
})

export default analyticsInstance
