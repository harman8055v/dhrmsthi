/**
 * WebView Bridge Hook
 * React hook for integrating with the WebView bridge system
 */

"use client"

import { useEffect, useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { webViewBridge, NotificationData } from '@/lib/webview-bridge'
import { marketingCampaignHandler } from '@/lib/marketing-campaign-handler'
import analyticsInstance from '@/lib/enhanced-analytics'
import { logger } from '@/lib/logger'

interface UseWebViewBridgeOptions {
  enableAnalytics?: boolean
  enableMarketing?: boolean
  autoInitialize?: boolean
}

interface WebViewBridgeHookReturn {
  isNativeApp: boolean
  postMessage: (message: any) => void
  trackNotification: (eventType: string, data: any) => void
  handleNotification: (destination: string, data?: any, actionUrl?: string) => void
  preferences: any
  updatePreferences: (newPreferences: any) => void
}

export function useWebViewBridge(options: UseWebViewBridgeOptions = {}): WebViewBridgeHookReturn {
  const {
    enableAnalytics = true,
    enableMarketing = true,
    autoInitialize = true
  } = options

  const router = useRouter()
  const isInitialized = useRef(false)
  const preferences = useRef(null)

  // Initialize the bridge
  useEffect(() => {
    if (!autoInitialize || isInitialized.current) return

    logger.log('🔗 useWebViewBridge: Initializing...')

    // Set router for navigation
    webViewBridge.setRouter(router)
    
    if (enableMarketing) {
      marketingCampaignHandler.setRouter(router)
    }

    isInitialized.current = true

    // Listen for bridge ready event
    const handleBridgeReady = (event: Event) => {
      const customEvent = event as CustomEvent
      logger.log('🌉 useWebViewBridge: Bridge ready', customEvent.detail)
      
      if (customEvent.detail?.preferences) {
        preferences.current = customEvent.detail.preferences
      }
    }

    // Listen for preferences updates
    const handlePreferencesUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      preferences.current = customEvent.detail
      logger.log('⚙️ useWebViewBridge: Preferences updated', customEvent.detail)
    }

    // Listen for marketing notifications
    const handleMarketingNotification = (event: Event) => {
      const customEvent = event as CustomEvent
      const notification = customEvent.detail as NotificationData
      
      if (enableAnalytics) {
        analyticsInstance.track('notification_received', {
          notification_type: notification.type,
          notification_category: notification.category,
          notification_priority: notification.priority,
          campaign_id: notification.data.campaignId,
          is_native_app: webViewBridge.isRunningInNativeApp()
        })
      }
    }

    // Listen for campaign interactions
    const handleCampaignInteraction = (event: Event) => {
      const customEvent = event as CustomEvent
      const { action, campaignId, notificationId } = customEvent.detail
      
      if (enableAnalytics) {
        analyticsInstance.track(`notification_${action}`, {
          campaign_id: campaignId,
          notification_id: notificationId,
          is_native_app: webViewBridge.isRunningInNativeApp()
        })
      }
    }

    window.addEventListener('webViewBridgeReady', handleBridgeReady)
    window.addEventListener('notificationPreferencesUpdated', handlePreferencesUpdate)
    window.addEventListener('showMarketingNotification', handleMarketingNotification)
    window.addEventListener('campaignInteraction', handleCampaignInteraction)

    return () => {
      window.removeEventListener('webViewBridgeReady', handleBridgeReady)
      window.removeEventListener('notificationPreferencesUpdated', handlePreferencesUpdate)
      window.removeEventListener('showMarketingNotification', handleMarketingNotification)
      window.removeEventListener('campaignInteraction', handleCampaignInteraction)
    }
  }, [router, enableAnalytics, enableMarketing, autoInitialize])

  // Post message to native app
  const postMessage = useCallback((message: any) => {
    webViewBridge.postMessageToNative(message)
  }, [])

  // Track notification events
  const trackNotification = useCallback((eventType: string, data: any) => {
    webViewBridge.trackNotificationEvent(eventType as any, data)
  }, [])

  // Handle notification navigation
  const handleNotification = useCallback((destination: string, data?: any, actionUrl?: string) => {
    webViewBridge.handleNotificationNavigation({
      destination: destination as any,
      data,
      actionUrl
    })
  }, [])

  // Update notification preferences
  const updatePreferences = useCallback((newPreferences: any) => {
    webViewBridge.updatePreferences(newPreferences)
  }, [])

  return {
    isNativeApp: webViewBridge.isRunningInNativeApp(),
    postMessage,
    trackNotification,
    handleNotification,
    preferences: preferences.current,
    updatePreferences
  }
}

// Hook for marketing campaign integration
export function useMarketingCampaigns() {
  const router = useRouter()

  useEffect(() => {
    marketingCampaignHandler.setRouter(router)
  }, [router])

  const getActiveCampaigns = useCallback(() => {
    return marketingCampaignHandler.getActiveCampaigns()
  }, [])

  const validatePromoCode = useCallback((promoCode: string) => {
    return marketingCampaignHandler.validatePromoCode(promoCode)
  }, [])

  const processPromoCode = useCallback((promoCode: string, userId: string) => {
    return marketingCampaignHandler.processPromoCodeUsage(promoCode, userId)
  }, [])

  return {
    getActiveCampaigns,
    validatePromoCode,
    processPromoCode
  }
}

// Hook for notification analytics
export function useNotificationAnalytics() {
  const getAnalytics = useCallback(() => {
    return analyticsInstance.getNotificationAnalytics()
  }, [])

  const getSummary = useCallback(() => {
    return analyticsInstance.getAnalyticsSummary()
  }, [])

  const trackEvent = useCallback((event: string, properties?: Record<string, any>) => {
    analyticsInstance.track(event, properties)
  }, [])

  const clearData = useCallback(() => {
    analyticsInstance.clearData()
  }, [])

  return {
    getAnalytics,
    getSummary,
    trackEvent,
    clearData
  }
}

// Hook for handling specific notification types
export function useNotificationHandlers() {
  const router = useRouter()

  // Handle social notifications (messages, likes, matches)
  const handleSocialNotification = useCallback((type: string, data: any) => {
    switch (type) {
      case 'message':
        if (data.matchId) {
          router.push(`/dashboard/messages/${data.matchId}`)
        } else {
          router.push('/dashboard/messages')
        }
        break
      
      case 'like':
      case 'superlike':
        router.push('/dashboard/likes')
        break
      
      case 'match':
        if (data.matchId) {
          router.push(`/dashboard/matches?highlight=${data.matchId}`)
        } else {
          router.push('/dashboard/matches')
        }
        break
    }

    // Track interaction
    analyticsInstance.track('notification_clicked', {
      notification_type: type,
      destination: 'social',
      match_id: data.matchId
    })
  }, [router])

  // Handle marketing notifications
  const handleMarketingNotification = useCallback((type: string, data: any) => {
    let destination = '/premium'
    
    if (data.campaignId) {
      destination += `?campaign=${data.campaignId}`
    }
    
    if (data.promoCode) {
      destination += `${destination.includes('?') ? '&' : '?'}promo=${data.promoCode}`
    }

    router.push(destination)

    // Track interaction
    analyticsInstance.track('notification_clicked', {
      notification_type: type,
      destination: 'marketing',
      campaign_id: data.campaignId,
      promo_code: data.promoCode
    })
  }, [router])

  // Handle engagement notifications
  const handleEngagementNotification = useCallback((type: string, data: any) => {
    let destination = '/'

    switch (type) {
      case 'tips':
        destination = data.tipId ? `/tips/${data.tipId}` : '/tips'
        break
      
      case 'achievement':
        destination = '/dashboard/profile?tab=achievements'
        break
      
      case 'community':
        destination = '/community'
        break
      
      case 'daily_reminder':
      case 'weekly_digest':
        destination = '/dashboard'
        break
    }

    router.push(destination)

    // Track interaction
    analyticsInstance.track('notification_clicked', {
      notification_type: type,
      destination: 'engagement',
      tip_id: data.tipId
    })
  }, [router])

  return {
    handleSocialNotification,
    handleMarketingNotification,
    handleEngagementNotification
  }
}

// Hook for promo code validation and processing
export function usePromoCodes() {
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)

  const validateCode = useCallback(async (promoCode: string) => {
    setIsValidating(true)
    
    try {
      // Client-side validation
      const campaign = marketingCampaignHandler.validatePromoCode(promoCode)
      
      if (campaign) {
        setValidationResult({
          valid: true,
          campaign,
          discount: campaign.discount,
          expiresAt: campaign.validUntil
        })

        // Track validation
        analyticsInstance.track('promo_code_validated', {
          promo_code: promoCode,
          campaign_id: campaign.id,
          valid: true
        })
      } else {
        setValidationResult({
          valid: false,
          error: 'Invalid or expired promo code'
        })

        analyticsInstance.track('promo_code_validated', {
          promo_code: promoCode,
          valid: false
        })
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        error: 'Error validating promo code'
      })
    } finally {
      setIsValidating(false)
    }
  }, [])

  const processCode = useCallback(async (promoCode: string, userId: string) => {
    const success = marketingCampaignHandler.processPromoCodeUsage(promoCode, userId)
    
    if (success) {
      analyticsInstance.track('promo_code_redeemed', {
        promo_code: promoCode,
        user_id: userId
      })
    }

    return success
  }, [])

  const clearValidation = useCallback(() => {
    setValidationResult(null)
  }, [])

  return {
    validateCode,
    processCode,
    clearValidation,
    isValidating,
    validationResult
  }
}
