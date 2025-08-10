/**
 * WebView Notification Integration Provider
 * Main component that initializes and manages all notification systems
 */

"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWebViewBridge, useNotificationHandlers } from '@/hooks/use-webview-bridge'
import { NotificationManager } from '@/components/notification-ui'
import { logger } from '@/lib/logger'

interface WebViewNotificationProviderProps {
  children: React.ReactNode
  enableAnalytics?: boolean
  enableMarketing?: boolean
  enableDeepLinking?: boolean
}

export function WebViewNotificationProvider({ 
  children, 
  enableAnalytics = true,
  enableMarketing = true,
  enableDeepLinking = true
}: WebViewNotificationProviderProps) {
  const router = useRouter()
  
  // Initialize WebView bridge
  const { 
    isNativeApp, 
    postMessage, 
    trackNotification,
    handleNotification
  } = useWebViewBridge({
    enableAnalytics,
    enableMarketing,
    autoInitialize: true
  })

  // Initialize notification handlers
  const {
    handleSocialNotification,
    handleMarketingNotification,
    handleEngagementNotification
  } = useNotificationHandlers()

  useEffect(() => {
    if (!enableDeepLinking) return

    // Listen for deep link navigation from native app
    const handleDeepLink = (event: Event) => {
      const customEvent = event as CustomEvent
      const { url, type, data } = customEvent.detail

      logger.log('🔗 Deep link received:', { url, type, data })

      if (url) {
        // Handle direct URL navigation
        router.push(url)
      } else if (type) {
        // Handle typed navigation
        switch (type) {
          case 'social':
            handleSocialNotification(data.subType, data)
            break
          case 'marketing':
            handleMarketingNotification(data.subType, data)
            break
          case 'engagement':
            handleEngagementNotification(data.subType, data)
            break
        }
      }

      // Track deep link usage
      if (enableAnalytics) {
        trackNotification('clicked', {
          notification_type: type,
          deep_link_url: url,
          is_native_app: isNativeApp
        })
      }
    }

    window.addEventListener('deepLinkNavigation', handleDeepLink)
    return () => window.removeEventListener('deepLinkNavigation', handleDeepLink)
  }, [
    router, 
    enableDeepLinking, 
    enableAnalytics, 
    isNativeApp,
    handleSocialNotification,
    handleMarketingNotification,
    handleEngagementNotification,
    trackNotification
  ])

  // Log initialization
  useEffect(() => {
    logger.log('🚀 WebView Notification Provider initialized', {
      isNativeApp,
      enableAnalytics,
      enableMarketing,
      enableDeepLinking
    })

    // Notify native app that web app is ready
    if (isNativeApp) {
      postMessage({
        type: 'web_app_ready',
        timestamp: new Date().toISOString(),
        features: {
          analytics: enableAnalytics,
          marketing: enableMarketing,
          deepLinking: enableDeepLinking
        }
      })
    }
  }, [isNativeApp, enableAnalytics, enableMarketing, enableDeepLinking, postMessage])

  return (
    <>
      {children}
      <NotificationManager />
    </>
  )
}

// Hook for getting current WebView context
export function useWebViewContext() {
  const { isNativeApp, postMessage, trackNotification } = useWebViewBridge({
    autoInitialize: false
  })

  const sendToNative = (type: string, payload: any) => {
    if (isNativeApp) {
      postMessage({ type, payload, timestamp: new Date().toISOString() })
    }
  }

  const trackUserAction = (action: string, properties?: Record<string, any>) => {
    trackNotification('user_action', {
      action,
      ...properties,
      timestamp: new Date().toISOString()
    })
  }

  return {
    isNativeApp,
    sendToNative,
    trackUserAction
  }
}

// Component for testing notification system
export function NotificationTester() {
  const { isNativeApp, postMessage } = useWebViewBridge()

  const testNotifications = [
    {
      type: 'message',
      title: 'New Message',
      body: 'You have a new message from Priya',
      data: { matchId: 'test_match_123' }
    },
    {
      type: 'promotion',
      title: '🎉 Special Offer!',
      body: 'Get 50% off premium features today!',
      data: { 
        campaignId: 'test_campaign_123',
        promoCode: 'TEST50',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      type: 'match',
      title: 'It\'s a Match! 💕',
      body: 'You and Rahul have matched!',
      data: { matchId: 'test_match_456' }
    },
    {
      type: 'achievement',
      title: 'Achievement Unlocked! 🏆',
      body: 'You\'ve completed your profile!',
      data: { achievementId: 'complete_profile' }
    }
  ]

  const sendTestNotification = (notification: any) => {
    // Simulate notification from native app
    window.dispatchEvent(new MessageEvent('message', {
      data: JSON.stringify({
        type: 'notification',
        notification: {
          ...notification,
          priority: 'high',
          category: notification.type === 'promotion' ? 'marketing' : 'social',
          timestamp: new Date().toISOString(),
          data: {
            ...notification.data,
            notificationId: `test_${Date.now()}`
          }
        }
      })
    }))
  }

  if (!isNativeApp && process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 border max-w-sm z-50">
      <h3 className="font-semibold mb-3">Notification Tester</h3>
      <div className="space-y-2">
        {testNotifications.map((notification, index) => (
          <button
            key={index}
            onClick={() => sendTestNotification(notification)}
            className="w-full text-left p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors text-sm"
          >
            {notification.title}
          </button>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t">
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('showCampaignModal', {
              detail: {
                notification: {
                  type: 'promotion',
                  title: '🪔 Diwali Special Offer',
                  body: 'Get 60% off on all premium plans. Limited time offer!',
                  category: 'marketing',
                  priority: 'high',
                  imageUrl: '/api/placeholder/300/200',
                  data: {
                    campaignId: 'diwali_2024',
                    promoCode: 'DIWALI60',
                    notificationId: 'test_modal'
                  },
                  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                },
                onAction: (action: string) => {
                  console.log('Modal action:', action)
                }
              }
            }))
          }}
          className="w-full p-2 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors text-sm"
        >
          Test Campaign Modal
        </button>
      </div>
    </div>
  )
}
