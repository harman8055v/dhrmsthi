/**
 * WebView Bridge Service for Native App Integration
 * Handles communication between React Web App and React Native WebView
 */

import { logger } from './logger'
import analytics from './analytics'

// Notification types enum
export enum NotificationType {
  // Social notifications
  MESSAGE = 'message',
  LIKE = 'like',
  SUPERLIKE = 'superlike',
  MATCH = 'match',
  
  // Marketing notifications
  MARKETING = 'marketing',
  PROMOTION = 'promotion',
  SEASONAL = 'seasonal',
  FEATURE_ANNOUNCEMENT = 'feature_announcement',
  
  // Engagement notifications
  DAILY_REMINDER = 'daily_reminder',
  WEEKLY_DIGEST = 'weekly_digest',
  INACTIVE_USER = 'inactive_user',
  TIPS = 'tips',
  ACHIEVEMENT = 'achievement',
  COMMUNITY = 'community',
  
  // Monetization notifications
  SUBSCRIPTION = 'subscription',
  PREMIUM_FEATURES = 'premium_features',
  
  // System notifications
  SYSTEM = 'system',
  GENERAL = 'general'
}

// Notification categories
export enum NotificationCategory {
  SOCIAL = 'social',
  MARKETING = 'marketing',
  ENGAGEMENT = 'engagement',
  MONETIZATION = 'monetization',
  SYSTEM = 'system'
}

// Priority levels
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Notification data structure
export interface NotificationData {
  type: NotificationType
  priority: NotificationPriority
  category: NotificationCategory
  data: {
    matchId?: string
    campaignId?: string
    promoCode?: string
    validUntil?: string
    notificationId: string
    userId?: string
    featureName?: string
    tipId?: string
    [key: string]: any
  }
  actionUrl?: string
  imageUrl?: string
  expiresAt?: string
  title: string
  body: string
  timestamp: string
}

// Navigation destinations
export enum NavigationDestination {
  MESSAGES = 'messages',
  LIKES = 'likes',
  MATCH = 'match',
  PROMOTIONS = 'promotions',
  FEATURES = 'features',
  TIPS = 'tips',
  ACHIEVEMENTS = 'achievements',
  COMMUNITY = 'community',
  SUBSCRIPTION = 'subscription',
  EXTERNAL = 'external',
  HOME = 'home',
  PROFILE = 'profile',
  PREMIUM = 'premium'
}

// WebView message structure
interface WebViewMessage {
  type: string
  destination?: NavigationDestination
  data?: any
  priority?: NotificationPriority
  actionUrl?: string
  notification?: NotificationData
}

// User preferences structure
interface NotificationPreferences {
  social: {
    messages: boolean
    likes: boolean
    superlikes: boolean
    matches: boolean
  }
  marketing: {
    promotions: boolean
    seasonal: boolean
    features: boolean
    enabled: boolean
  }
  engagement: {
    dailyReminders: boolean
    weeklyDigest: boolean
    tips: boolean
    achievements: boolean
    community: boolean
    enabled: boolean
  }
  monetization: {
    subscription: boolean
    premiumFeatures: boolean
    enabled: boolean
  }
  system: {
    general: boolean
    critical: boolean
  }
  quietHours: {
    enabled: boolean
    startTime: string // "22:00"
    endTime: string   // "08:00"
  }
  doNotDisturb: boolean
}

class WebViewBridge {
  private isNativeApp: boolean = false
  private messageHandlers: Map<string, Function> = new Map()
  private preferences: NotificationPreferences | null = null
  private router: any = null

  constructor() {
    this.init()
  }

  /**
   * Initialize the WebView bridge
   */
  init() {
    if (typeof window === 'undefined') return

    // Check if running in native app
    this.isNativeApp = !!(window as any).isNativeApp || !!(window as any).ReactNativeWebView

    if (this.isNativeApp) {
      logger.log('🔗 WebView Bridge: Initializing native app integration')
      this.setupMessageListener()
      this.injectNativeBridge()
    }

    // Listen for bridge ready event
    window.addEventListener('nativeBridgeReady', this.handleBridgeReady.bind(this) as EventListener)
  }

  /**
   * Set router instance for navigation
   */
  setRouter(router: any) {
    this.router = router
  }

  /**
   * Setup message listener for native app communication
   */
  private setupMessageListener() {
    window.addEventListener('message', this.handleMessage.bind(this))
    
    // Also listen for React Native WebView messages
    if ((window as any).ReactNativeWebView) {
      document.addEventListener('message', this.handleMessage.bind(this) as EventListener)
    }
  }

  /**
   * Handle incoming messages from native app
   */
  private handleMessage(event: MessageEvent | Event) {
    try {
      // Check if it's a MessageEvent
      if (!('data' in event)) {
        return
      }

      let data = (event as MessageEvent).data
      
      // Parse if string
      if (typeof data === 'string') {
        data = JSON.parse(data)
      }

      logger.log('📨 WebView Bridge: Received message', data)

      const { type, destination, notification, priority, actionUrl } = data as WebViewMessage

      // Track analytics
      this.trackNotificationEvent('received', data)

      // Handle different message types
      switch (type) {
        case 'notification':
          this.handleNotificationMessage(data)
          break
        
        case 'navigation':
          this.handleNavigationMessage(data)
          break
        
        case 'preferences_sync':
          this.handlePreferencesSync(data)
          break
        
        case 'campaign_notification':
          this.handleCampaignNotification(data)
          break
        
        default:
          logger.warn('🚫 WebView Bridge: Unknown message type', type)
      }

    } catch (error) {
      logger.error('❌ WebView Bridge: Error handling message', error)
    }
  }

  /**
   * Handle notification messages
   */
  private handleNotificationMessage(message: WebViewMessage) {
    const { notification, destination, actionUrl, priority } = message

    if (!notification) return

    // Check if notification is expired
    if (notification.expiresAt && new Date(notification.expiresAt) < new Date()) {
      logger.log('⏰ WebView Bridge: Notification expired, ignoring')
      return
    }

    // Check user preferences
    if (!this.shouldShowNotification(notification)) {
      logger.log('🔕 WebView Bridge: Notification blocked by user preferences')
      return
    }

    // Handle based on priority
    if (priority === NotificationPriority.CRITICAL) {
      this.showCriticalNotificationModal(notification)
    }

    // Track notification open
    this.trackNotificationEvent('opened', notification)

    // Navigate if destination provided
    if (destination) {
      this.handleNotificationNavigation({ destination, data: notification.data, actionUrl })
    }
  }

  /**
   * Handle navigation messages
   */
  private handleNavigationMessage(message: WebViewMessage) {
    const { destination, data, actionUrl } = message
    
    if (destination) {
      this.handleNotificationNavigation({ destination, data, actionUrl })
    }
  }

  /**
   * Handle comprehensive navigation based on notification type
   */
  public handleNotificationNavigation(payload: {
    destination: NavigationDestination
    data?: any
    actionUrl?: string
  }) {
    const { destination, data, actionUrl } = payload

    // Track analytics
    this.trackNotificationEvent('clicked', { destination, data })

    logger.log('🧭 WebView Bridge: Navigating to', destination, data)

    // Route based on destination
    switch (destination) {
      case NavigationDestination.MESSAGES:
        if (data?.matchId) {
          this.navigateTo(`/dashboard/messages/${data.matchId}`)
        } else {
          this.navigateTo('/dashboard/messages')
        }
        break

      case NavigationDestination.LIKES:
        this.navigateTo('/dashboard/likes')
        break

      case NavigationDestination.MATCH:
        if (data?.matchId) {
          this.navigateTo(`/dashboard/match/${data.matchId}`)
        } else {
          this.navigateTo('/dashboard/matches')
        }
        break

      case NavigationDestination.PROMOTIONS:
      case NavigationDestination.PREMIUM:
        const campaignQuery = data?.campaignId ? `?campaign=${data.campaignId}` : ''
        const promoQuery = data?.promoCode ? `&promo=${data.promoCode}` : ''
        this.navigateTo(`/premium${campaignQuery}${promoQuery}`)
        break

      case NavigationDestination.FEATURES:
        if (data?.featureName) {
          this.navigateTo(`/features/${data.featureName}`)
        } else {
          this.navigateTo('/features')
        }
        break

      case NavigationDestination.TIPS:
        if (data?.tipId) {
          this.navigateTo(`/tips/${data.tipId}`)
        } else {
          this.navigateTo('/tips')
        }
        break

      case NavigationDestination.ACHIEVEMENTS:
        this.navigateTo('/dashboard/profile?tab=achievements')
        break

      case NavigationDestination.COMMUNITY:
        this.navigateTo('/community')
        break

      case NavigationDestination.SUBSCRIPTION:
        this.navigateTo('/premium/billing')
        break

      case NavigationDestination.EXTERNAL:
        if (actionUrl) {
          if (this.isNativeApp) {
            this.postMessageToNative({
              type: 'open_external_url',
              url: actionUrl
            })
          } else {
            window.open(actionUrl, '_blank')
          }
        }
        break

      case NavigationDestination.HOME:
        this.navigateTo('/')
        break

      case NavigationDestination.PROFILE:
        this.navigateTo('/dashboard/profile')
        break

      default:
        logger.warn('🚫 WebView Bridge: Unknown navigation destination', destination)
    }
  }

  /**
   * Handle campaign notifications (marketing)
   */
  private handleCampaignNotification(message: WebViewMessage) {
    const { notification, data } = message

    if (!notification) return

    // Track campaign interaction
    analytics.track('campaign_notification_received', {
      campaignId: data?.campaignId,
      type: notification.type,
      category: notification.category
    })

    // Show marketing notification based on type
    this.showMarketingNotification(notification)
  }

  /**
   * Handle preferences synchronization
   */
  private handlePreferencesSync(message: WebViewMessage) {
    const { data } = message
    
    if (data?.preferences) {
      this.preferences = data.preferences
      localStorage.setItem('notification_preferences', JSON.stringify(this.preferences))
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('notificationPreferencesUpdated', {
        detail: this.preferences
      }))
    }
  }

  /**
   * Check if notification should be shown based on user preferences
   */
  private shouldShowNotification(notification: NotificationData): boolean {
    if (!this.preferences) return true

    // Check Do Not Disturb
    if (this.preferences.doNotDisturb) return false

    // Check quiet hours
    if (this.preferences.quietHours.enabled) {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      
      if (this.isInQuietHours(currentTime, this.preferences.quietHours.startTime, this.preferences.quietHours.endTime)) {
        return false
      }
    }

    // Check category-specific preferences
    switch (notification.category) {
      case NotificationCategory.SOCIAL:
        return this.checkSocialPreferences(notification)
      
      case NotificationCategory.MARKETING:
        return this.preferences.marketing.enabled
      
      case NotificationCategory.ENGAGEMENT:
        return this.preferences.engagement.enabled
      
      case NotificationCategory.MONETIZATION:
        return this.preferences.monetization.enabled
      
      case NotificationCategory.SYSTEM:
        return notification.priority === NotificationPriority.CRITICAL 
          ? this.preferences.system.critical 
          : this.preferences.system.general
      
      default:
        return true
    }
  }

  /**
   * Check social notification preferences
   */
  private checkSocialPreferences(notification: NotificationData): boolean {
    if (!this.preferences) return true

    const socialPrefs = this.preferences.social

    switch (notification.type) {
      case NotificationType.MESSAGE:
        return socialPrefs.messages
      case NotificationType.LIKE:
        return socialPrefs.likes
      case NotificationType.SUPERLIKE:
        return socialPrefs.superlikes
      case NotificationType.MATCH:
        return socialPrefs.matches
      default:
        return true
    }
  }

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(currentTime: string, startTime: string, endTime: string): boolean {
    const current = this.timeToMinutes(currentTime)
    const start = this.timeToMinutes(startTime)
    const end = this.timeToMinutes(endTime)

    if (start <= end) {
      return current >= start && current <= end
    } else {
      // Overnight quiet hours
      return current >= start || current <= end
    }
  }

  /**
   * Convert time string to minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  /**
   * Show critical notification modal
   */
  private showCriticalNotificationModal(notification: NotificationData) {
    // Create and show modal for critical notifications
    const event = new CustomEvent('showCriticalNotification', {
      detail: notification
    })
    window.dispatchEvent(event)
  }

  /**
   * Show marketing notification
   */
  private showMarketingNotification(notification: NotificationData) {
    // Show marketing-specific notification UI
    const event = new CustomEvent('showMarketingNotification', {
      detail: notification
    })
    window.dispatchEvent(event)
  }

  /**
   * Navigate to a route
   */
  private navigateTo(path: string) {
    if (this.router) {
      this.router.push(path)
    } else if (typeof window !== 'undefined') {
      window.location.href = path
    }
  }

  /**
   * Track notification events for analytics
   */
  public trackNotificationEvent(eventType: 'received' | 'opened' | 'clicked' | 'dismissed' | 'converted', notificationData: any) {
    analytics.track(`notification_${eventType}`, {
      notification_type: notificationData.type,
      notification_category: notificationData.category,
      notification_priority: notificationData.priority,
      campaign_id: notificationData.data?.campaignId,
      match_id: notificationData.data?.matchId,
      user_id: notificationData.data?.userId,
      timestamp: new Date().toISOString(),
      is_native_app: this.isNativeApp
    })
  }

  /**
   * Handle bridge ready event
   */
  private handleBridgeReady(event: Event) {
    const customEvent = event as CustomEvent
    logger.log('🌉 WebView Bridge: Native bridge ready', customEvent.detail)
    
    // Sync user preferences
    if (customEvent.detail?.preferences) {
      this.preferences = customEvent.detail.preferences
    }

    // Notify components that bridge is ready
    window.dispatchEvent(new CustomEvent('webViewBridgeReady', {
      detail: {
        isNativeApp: this.isNativeApp,
        preferences: this.preferences
      }
    }))
  }

  /**
   * Inject native bridge functions
   */
  private injectNativeBridge() {
    if (typeof window === 'undefined') return

    // Make bridge available globally
    ;(window as any).webViewBridge = {
      handleNotification: this.handleNotificationNavigation.bind(this),
      trackEvent: this.trackNotificationEvent.bind(this),
      postMessage: this.postMessageToNative.bind(this),
      getPreferences: () => this.preferences,
      updatePreferences: this.updatePreferences.bind(this)
    }
  }

  /**
   * Post message to native app
   */
  public postMessageToNative(message: any) {
    if (!this.isNativeApp) return

    const messageString = JSON.stringify(message)
    
    try {
      // React Native WebView
      if ((window as any).ReactNativeWebView) {
        ;(window as any).ReactNativeWebView.postMessage(messageString)
      }
      // Alternative method
      else if ((window as any).webkit?.messageHandlers?.reactNativeWebView) {
        ;(window as any).webkit.messageHandlers.reactNativeWebView.postMessage(message)
      }
    } catch (error) {
      logger.error('❌ WebView Bridge: Failed to post message to native', error)
    }
  }

  /**
   * Update notification preferences
   */
  public updatePreferences(newPreferences: Partial<NotificationPreferences>) {
    this.preferences = { ...this.preferences, ...newPreferences } as NotificationPreferences
    
    // Save to localStorage
    localStorage.setItem('notification_preferences', JSON.stringify(this.preferences))
    
    // Sync with native app
    this.postMessageToNative({
      type: 'update_preferences',
      preferences: this.preferences
    })

    // Dispatch event
    window.dispatchEvent(new CustomEvent('notificationPreferencesUpdated', {
      detail: this.preferences
    }))
  }

  /**
   * Get current preferences
   */
  public getPreferences(): NotificationPreferences | null {
    return this.preferences
  }

  /**
   * Check if running in native app
   */
  public isRunningInNativeApp(): boolean {
    return this.isNativeApp
  }
}

// Export singleton instance
export const webViewBridge = new WebViewBridge()

// Re-export types for external use
export type {
  NotificationData as WebViewNotificationData,
  NotificationPreferences as WebViewNotificationPreferences,
  WebViewMessage as WebViewBridgeMessage
}
