/**
 * Supabase Notification Service
 * Handles real-time notifications with automatic creation via database triggers
 */

import { createClient } from '@supabase/supabase-js'
import { logger } from './logger'
import { webViewBridge, NotificationType, NotificationCategory, NotificationPriority } from './webview-bridge'

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Notification interfaces
export interface SupabaseNotification {
  id: string
  recipient_id: string
  sender_id?: string
  sender_name?: string
  sender_avatar?: string
  type: string
  category: string
  priority: string
  title: string
  message: string
  data: Record<string, any>
  action_url?: string
  image_url?: string
  is_read: boolean
  is_seen: boolean
  expires_at?: string
  created_at: string
}

export interface NotificationCounts {
  total_count: number
  unread_count: number
  social_count: number
  marketing_count: number
  system_count: number
}

export interface NotificationSettings {
  user_id: string
  social_notifications: {
    messages: boolean
    likes: boolean
    superlikes: boolean
    matches: boolean
  }
  marketing_notifications: {
    promotions: boolean
    seasonal: boolean
    features: boolean
    enabled: boolean
  }
  engagement_notifications: {
    dailyReminders: boolean
    weeklyDigest: boolean
    tips: boolean
    achievements: boolean
    community: boolean
    enabled: boolean
  }
  monetization_notifications: {
    subscription: boolean
    premiumFeatures: boolean
    enabled: boolean
  }
  system_notifications: {
    general: boolean
    critical: boolean
  }
  quiet_hours: {
    enabled: boolean
    startTime: string
    endTime: string
  }
  do_not_disturb: boolean
  push_enabled: boolean
  email_enabled: boolean
  web_enabled: boolean
  push_token?: string
}

class SupabaseNotificationService {
  private currentUserId: string | null = null
  private realtimeChannel: any = null
  private isInitialized = false
  private notificationHandlers: ((notification: SupabaseNotification) => void)[] = []

  /**
   * Initialize the notification service for a user
   */
  async initialize(userId: string) {
    if (this.isInitialized && this.currentUserId === userId) {
      return
    }

    try {
      this.currentUserId = userId
      
      // Setup real-time subscription for notifications
      await this.setupRealtimeSubscription()
      
      // Initialize user notification settings if they don't exist
      await this.initializeUserSettings()
      
      this.isInitialized = true
      logger.log('🔔 Supabase Notification Service: Initialized for user', userId)
      
    } catch (error) {
      logger.error('❌ Failed to initialize notification service:', error)
      throw error
    }
  }

  /**
   * Setup real-time subscription for notifications
   */
  private async setupRealtimeSubscription() {
    if (!this.currentUserId) return

    // Remove existing subscription
    if (this.realtimeChannel) {
      await supabase.removeChannel(this.realtimeChannel)
    }

    // Create new subscription
    this.realtimeChannel = supabase
      .channel(`notifications:${this.currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${this.currentUserId}`
        },
        (payload) => {
          logger.log('🔔 New notification received:', payload.new)
          this.handleNewNotification(payload.new as SupabaseNotification)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${this.currentUserId}`
        },
        (payload) => {
          logger.log('🔄 Notification updated:', payload.new)
          this.handleNotificationUpdate(payload.new as SupabaseNotification)
        }
      )
      .subscribe((status) => {
        logger.log('📡 Notification subscription status:', status)
      })
  }

  /**
   * Handle new notification from real-time subscription
   */
  private handleNewNotification(notification: SupabaseNotification) {
    // Convert to WebView bridge format and send to mobile app
    const webViewNotification = this.convertToWebViewFormat(notification)
    
    // Send to WebView bridge for mobile app handling
    if (webViewBridge.isRunningInNativeApp()) {
      webViewBridge.postMessageToNative({
        type: 'notification',
        notification: webViewNotification,
        destination: this.getNavigationDestination(notification.type),
        priority: notification.priority
      })
    }

    // Trigger browser notification if permissions granted
    this.showBrowserNotification(notification)
    
    // Call registered handlers
    this.notificationHandlers.forEach(handler => {
      try {
        handler(notification)
      } catch (error) {
        logger.error('❌ Notification handler error:', error)
      }
    })

    // Dispatch custom event for components to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('supabaseNotificationReceived', {
        detail: notification
      }))
    }
  }

  /**
   * Handle notification updates
   */
  private handleNotificationUpdate(notification: SupabaseNotification) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('supabaseNotificationUpdated', {
        detail: notification
      }))
    }
  }

  /**
   * Convert Supabase notification to WebView bridge format
   */
  private convertToWebViewFormat(notification: SupabaseNotification) {
    return {
      type: notification.type as NotificationType,
      category: notification.category as NotificationCategory,
      priority: notification.priority as NotificationPriority,
      title: notification.title,
      body: notification.message,
      data: {
        notificationId: notification.id,
        userId: notification.recipient_id,
        senderId: notification.sender_id,
        ...notification.data
      },
      actionUrl: notification.action_url,
      imageUrl: notification.image_url,
      expiresAt: notification.expires_at,
      timestamp: notification.created_at
    }
  }

  /**
   * Get navigation destination based on notification type
   */
  private getNavigationDestination(type: string) {
    const destinationMap: Record<string, string> = {
      'message': 'messages',
      'like': 'likes',
      'superlike': 'likes', 
      'match': 'match',
      'profile_view': 'profile',
      'seasonal_promo': 'promotions',
      'feature_launch': 'features',
      'subscription_promo': 'premium',
      'daily_reminder': 'home',
      'weekly_digest': 'profile',
      'profile_tip': 'profile',
      'achievement': 'achievements',
      'subscription_reminder': 'premium',
      'billing_reminder': 'premium'
    }
    
    return destinationMap[type] || 'home'
  }

  /**
   * Show browser notification if permissions granted
   */
  private async showBrowserNotification(notification: SupabaseNotification) {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: notification.image_url || '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        data: notification.data
      })
    }
  }

  /**
   * Initialize user notification settings
   */
  private async initializeUserSettings() {
    if (!this.currentUserId) return

    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', this.currentUserId)
      .single()

    if (error && error.code === 'PGRST116') {
      // No settings found, create default settings
      const { error: insertError } = await supabase
        .from('notification_settings')
        .insert([{ user_id: this.currentUserId }])

      if (insertError) {
        logger.error('❌ Failed to create notification settings:', insertError)
      } else {
        logger.log('✅ Created default notification settings')
      }
    } else if (error) {
      logger.error('❌ Failed to fetch notification settings:', error)
    }
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(
    page = 0,
    limit = 20,
    includeRead = true
  ): Promise<SupabaseNotification[]> {
    if (!this.currentUserId) return []

    const { data, error } = await supabase.rpc('get_user_notifications', {
      user_uuid: this.currentUserId,
      page_size: limit,
      page_offset: page * limit,
      include_read: includeRead
    })

    if (error) {
      logger.error('❌ Failed to fetch notifications:', error)
      return []
    }

    return data || []
  }

  /**
   * Get notification counts
   */
  async getNotificationCounts(): Promise<NotificationCounts | null> {
    if (!this.currentUserId) return null

    const { data, error } = await supabase.rpc('get_notification_counts', {
      user_uuid: this.currentUserId
    })

    if (error) {
      logger.error('❌ Failed to fetch notification counts:', error)
      return null
    }

    return data?.[0] || null
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds?: string[]): Promise<number> {
    if (!this.currentUserId) return 0

    const { data, error } = await supabase.rpc('mark_notifications_read', {
      user_uuid: this.currentUserId,
      notification_ids: notificationIds || null
    })

    if (error) {
      logger.error('❌ Failed to mark notifications as read:', error)
      return 0
    }

    return data || 0
  }

  /**
   * Get user notification settings
   */
  async getNotificationSettings(): Promise<NotificationSettings | null> {
    if (!this.currentUserId) return null

    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', this.currentUserId)
      .single()

    if (error) {
      logger.error('❌ Failed to fetch notification settings:', error)
      return null
    }

    return data
  }

  /**
   * Update user notification settings
   */
  async updateNotificationSettings(
    settings: Partial<NotificationSettings>
  ): Promise<boolean> {
    if (!this.currentUserId) return false

    const { error } = await supabase
      .from('notification_settings')
      .upsert([
        {
          user_id: this.currentUserId,
          ...settings
        }
      ])

    if (error) {
      logger.error('❌ Failed to update notification settings:', error)
      return false
    }

    return true
  }

  /**
   * Create a manual notification (for marketing, system messages, etc.)
   */
  async createNotification(
    recipientId: string,
    templateType: string,
    templateData: Record<string, any> = {},
    senderId?: string
  ): Promise<string | null> {
    const { data, error } = await supabase.rpc('create_notification_from_template', {
      template_type: templateType,
      recipient_uuid: recipientId,
      sender_uuid: senderId || null,
      template_data: templateData
    })

    if (error) {
      logger.error('❌ Failed to create notification:', error)
      return null
    }

    return data
  }

  /**
   * Register a notification handler
   */
  onNotification(handler: (notification: SupabaseNotification) => void) {
    this.notificationHandlers.push(handler)
    
    // Return unsubscribe function
    return () => {
      const index = this.notificationHandlers.indexOf(handler)
      if (index > -1) {
        this.notificationHandlers.splice(index, 1)
      }
    }
  }

  /**
   * Request browser notification permissions
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied'
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission()
    }

    return Notification.permission
  }

  /**
   * Update user's push token
   */
  async updatePushToken(token: string): Promise<boolean> {
    if (!this.currentUserId) return false

    const { error } = await supabase
      .from('notification_settings')
      .upsert([
        {
          user_id: this.currentUserId,
          push_token: token
        }
      ])

    if (error) {
      logger.error('❌ Failed to update push token:', error)
      return false
    }

    return true
  }

  /**
   * Cleanup expired notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
    const { data, error } = await supabase.rpc('cleanup_expired_notifications')

    if (error) {
      logger.error('❌ Failed to cleanup expired notifications:', error)
      return 0
    }

    return data || 0
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect() {
    if (this.realtimeChannel) {
      await supabase.removeChannel(this.realtimeChannel)
      this.realtimeChannel = null
    }
    
    this.currentUserId = null
    this.isInitialized = false
    this.notificationHandlers = []
    
    logger.log('🔌 Supabase Notification Service: Disconnected')
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized
  }
}

// Export singleton instance
export const supabaseNotificationService = new SupabaseNotificationService()
