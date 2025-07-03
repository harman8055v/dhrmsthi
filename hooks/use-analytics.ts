"use client"

import { useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import analytics from "@/lib/analytics"

// Custom hook for analytics tracking
export function useAnalytics() {
  const pathname = usePathname()

  // Track page views automatically
  useEffect(() => {
    analytics.trackPageView(pathname)
  }, [pathname])

  // Track button clicks
  const trackButtonClick = useCallback(
    (buttonName: string, location: string, additionalProps?: Record<string, any>) => {
      analytics.trackButtonClick(buttonName, location, additionalProps)
    },
    [],
  )

  // Track user interactions
  const trackInteraction = useCallback((action: string, element: string, additionalProps?: Record<string, any>) => {
    analytics.trackUserInteraction(action, element, additionalProps)
  }, [])

  // Track custom events
  const trackEvent = useCallback((event: string, properties?: Record<string, any>) => {
    analytics.track(event, properties)
  }, [])

  // Get analytics summary
  const getAnalyticsSummary = useCallback(() => {
    return analytics.getAnalyticsSummary()
  }, [])

  return {
    trackButtonClick,
    trackInteraction,
    trackEvent,
    getAnalyticsSummary,
  }
}

// Hook for tracking specific footer interactions
export function useFooterAnalytics() {
  const { trackButtonClick, trackInteraction } = useAnalytics()

  const trackFooterButtonClick = useCallback(
    (buttonName: string, additionalProps?: Record<string, any>) => {
      trackButtonClick(buttonName, "footer", {
        component: "footer",
        section: "cta",
        ...additionalProps,
      })
    },
    [trackButtonClick],
  )

  const trackFooterLinkClick = useCallback(
    (linkName: string, linkUrl: string) => {
      trackInteraction("link_click", "footer_link", {
        link_name: linkName,
        link_url: linkUrl,
        component: "footer",
      })
    },
    [trackInteraction],
  )

  const trackSocialMediaClick = useCallback(
    (platform: string) => {
      trackInteraction("social_media_click", "footer_social", {
        platform,
        component: "footer",
        section: "social_links",
      })
    },
    [trackInteraction],
  )

  return {
    trackFooterButtonClick,
    trackFooterLinkClick,
    trackSocialMediaClick,
  }
}
