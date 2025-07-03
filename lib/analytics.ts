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

class Analytics {
  private config: AnalyticsConfig
  private events: AnalyticsEvent[] = []

  constructor(config: AnalyticsConfig = { enabled: true, debug: false }) {
    this.config = config
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
      console.log("📊 Analytics Event:", analyticsEvent)
    }

    // Send to analytics service (if configured)
    if (this.config.enabled && this.config.apiEndpoint) {
      this.sendEvent(analyticsEvent)
    }

    // Store in localStorage for persistence
    this.storeEventLocally(analyticsEvent)
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

  // Get or create session ID
  private getSessionId(): string {
    if (typeof window === "undefined") return "server-side"

    let sessionId = localStorage.getItem("dharma_session_id")
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem("dharma_session_id", sessionId)
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
      if (this.config.debug) {
        console.error("Failed to send analytics event:", error)
      }
    }
  }

  // Store event in localStorage for offline tracking
  private storeEventLocally(event: AnalyticsEvent) {
    if (typeof window === "undefined") return

    try {
      const storedEvents = JSON.parse(localStorage.getItem("dharma_analytics_events") || "[]")
      storedEvents.push(event)

      // Keep only last 100 events to prevent localStorage bloat
      const recentEvents = storedEvents.slice(-100)
      localStorage.setItem("dharma_analytics_events", JSON.stringify(recentEvents))
    } catch (error) {
      if (this.config.debug) {
        console.error("Failed to store analytics event locally:", error)
      }
    }
  }

  // Get stored events
  getStoredEvents(): AnalyticsEvent[] {
    if (typeof window === "undefined") return []

    try {
      return JSON.parse(localStorage.getItem("dharma_analytics_events") || "[]")
    } catch {
      return []
    }
  }

  // Clear stored events
  clearStoredEvents() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("dharma_analytics_events")
    }
    this.events = []
  }

  // Get analytics summary
  getAnalyticsSummary() {
    const events = this.getStoredEvents()
    const summary = {
      totalEvents: events.length,
      eventTypes: {} as Record<string, number>,
      buttonClicks: {} as Record<string, number>,
      pageViews: {} as Record<string, number>,
      lastActivity: events.length > 0 ? events[events.length - 1].timestamp : null,
    }

    events.forEach((event) => {
      // Count event types
      summary.eventTypes[event.event] = (summary.eventTypes[event.event] || 0) + 1

      // Count button clicks
      if (event.event === "button_click" && event.properties?.button_name) {
        const buttonName = event.properties.button_name
        summary.buttonClicks[buttonName] = (summary.buttonClicks[buttonName] || 0) + 1
      }

      // Count page views
      if (event.event === "page_view" && event.properties?.page) {
        const page = event.properties.page
        summary.pageViews[page] = (summary.pageViews[page] || 0) + 1
      }
    })

    return summary
  }
}

// Create singleton instance
const analytics = new Analytics({
  enabled: process.env.NODE_ENV === "production",
  debug: process.env.NODE_ENV === "development",
  apiEndpoint: process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT,
})

export default analytics

// Export types for use in other files
export type { AnalyticsEvent, AnalyticsConfig }
