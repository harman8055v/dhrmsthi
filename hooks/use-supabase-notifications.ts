/**
 * React Hook for Supabase Notification Service
 * Provides easy integration with React components
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabaseNotificationService, SupabaseNotification, NotificationCounts, NotificationSettings } from '../lib/supabase-notifications'
import { logger } from '../lib/logger'

interface UseSupabaseNotificationsOptions {
  userId?: string
  autoInitialize?: boolean
  pollingInterval?: number
}

interface UseSupabaseNotificationsReturn {
  // State
  notifications: SupabaseNotification[]
  counts: NotificationCounts | null
  settings: NotificationSettings | null
  isLoading: boolean
  error: string | null
  isInitialized: boolean

  // Actions
  initialize: (userId: string) => Promise<void>
  loadNotifications: (page?: number, includeRead?: boolean) => Promise<void>
  loadMore: () => Promise<void>
  markAsRead: (notificationIds?: string[]) => Promise<void>
  updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>
  requestPermission: () => Promise<NotificationPermission>
  updatePushToken: (token: string) => Promise<void>
  createNotification: (recipientId: string, templateType: string, templateData?: Record<string, any>) => Promise<void>
  refreshCounts: () => Promise<void>
  disconnect: () => Promise<void>

  // Event handlers
  onNewNotification: (handler: (notification: SupabaseNotification) => void) => () => void
}

export function useSupabaseNotifications(options: UseSupabaseNotificationsOptions = {}): UseSupabaseNotificationsReturn {
  const {
    userId,
    autoInitialize = true,
    pollingInterval = 30000 // 30 seconds
  } = options

  // State
  const [notifications, setNotifications] = useState<SupabaseNotification[]>([])
  const [counts, setCounts] = useState<NotificationCounts | null>(null)
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // Refs
  const handlersRef = useRef<(() => void)[]>([])
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /**
   * Initialize the notification service
   */
  const initialize = useCallback(async (targetUserId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      await supabaseNotificationService.initialize(targetUserId)
      
      setIsInitialized(true)
      
      // Load initial data
      await Promise.all([
        loadNotifications(0, true),
        refreshCounts(),
        loadSettings()
      ])

      logger.log('🔔 useSupabaseNotifications: Initialized')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize notifications'
      setError(errorMessage)
      logger.error('❌ useSupabaseNotifications: Initialization failed', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Load notifications with pagination
   */
  const loadNotifications = useCallback(async (page = 0, includeRead = true) => {
    try {
      const newNotifications = await supabaseNotificationService.getUserNotifications(page, 20, includeRead)
      
      if (page === 0) {
        setNotifications(newNotifications)
      } else {
        setNotifications(prev => [...prev, ...newNotifications])
      }
      
      setCurrentPage(page)
      setHasMore(newNotifications.length === 20)
      
    } catch (err) {
      logger.error('❌ Failed to load notifications:', err)
      setError('Failed to load notifications')
    }
  }, [])

  /**
   * Load more notifications (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return
    
    const nextPage = currentPage + 1
    await loadNotifications(nextPage, true)
  }, [currentPage, hasMore, isLoading, loadNotifications])

  /**
   * Mark notifications as read
   */
  const markAsRead = useCallback(async (notificationIds?: string[]) => {
    try {
      const updatedCount = await supabaseNotificationService.markAsRead(notificationIds)
      
      if (updatedCount > 0) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            !notificationIds || notificationIds.includes(notification.id)
              ? { ...notification, is_read: true }
              : notification
          )
        )
        
        // Refresh counts
        await refreshCounts()
      }
      
    } catch (err) {
      logger.error('❌ Failed to mark notifications as read:', err)
      setError('Failed to mark notifications as read')
    }
  }, [])

  /**
   * Load user notification settings
   */
  const loadSettings = useCallback(async () => {
    try {
      const userSettings = await supabaseNotificationService.getNotificationSettings()
      setSettings(userSettings)
    } catch (err) {
      logger.error('❌ Failed to load settings:', err)
    }
  }, [])

  /**
   * Update notification settings
   */
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    try {
      setIsLoading(true)
      
      const success = await supabaseNotificationService.updateNotificationSettings(newSettings)
      
      if (success) {
        setSettings(prev => prev ? { ...prev, ...newSettings } : null)
      } else {
        setError('Failed to update settings')
      }
      
    } catch (err) {
      logger.error('❌ Failed to update settings:', err)
      setError('Failed to update settings')
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Request browser notification permission
   */
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    return await supabaseNotificationService.requestNotificationPermission()
  }, [])

  /**
   * Update push token
   */
  const updatePushToken = useCallback(async (token: string) => {
    try {
      await supabaseNotificationService.updatePushToken(token)
    } catch (err) {
      logger.error('❌ Failed to update push token:', err)
      setError('Failed to update push token')
    }
  }, [])

  /**
   * Create a notification
   */
  const createNotification = useCallback(async (
    recipientId: string,
    templateType: string,
    templateData: Record<string, any> = {}
  ) => {
    try {
      await supabaseNotificationService.createNotification(recipientId, templateType, templateData)
    } catch (err) {
      logger.error('❌ Failed to create notification:', err)
      setError('Failed to create notification')
    }
  }, [])

  /**
   * Refresh notification counts
   */
  const refreshCounts = useCallback(async () => {
    try {
      const newCounts = await supabaseNotificationService.getNotificationCounts()
      setCounts(newCounts)
    } catch (err) {
      logger.error('❌ Failed to refresh counts:', err)
    }
  }, [])

  /**
   * Disconnect from notification service
   */
  const disconnect = useCallback(async () => {
    try {
      await supabaseNotificationService.disconnect()
      
      // Cleanup handlers
      handlersRef.current.forEach(unsubscribe => unsubscribe())
      handlersRef.current = []
      
      // Clear polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      
      // Reset state
      setNotifications([])
      setCounts(null)
      setSettings(null)
      setIsInitialized(false)
      setError(null)
      
    } catch (err) {
      logger.error('❌ Failed to disconnect:', err)
    }
  }, [])

  /**
   * Register notification event handler
   */
  const onNewNotification = useCallback((handler: (notification: SupabaseNotification) => void) => {
    const unsubscribe = supabaseNotificationService.onNotification(handler)
    handlersRef.current.push(unsubscribe)
    
    return () => {
      const index = handlersRef.current.indexOf(unsubscribe)
      if (index > -1) {
        handlersRef.current.splice(index, 1)
      }
      unsubscribe()
    }
  }, [])

  // Handle new notifications from real-time subscription
  useEffect(() => {
    const handleNewNotification = (event: Event) => {
      const customEvent = event as CustomEvent<SupabaseNotification>
      const notification = customEvent.detail
      
      // Add to the beginning of the list
      setNotifications(prev => [notification, ...prev])
      
      // Update counts
      setCounts(prev => prev ? {
        ...prev,
        total_count: prev.total_count + 1,
        unread_count: prev.unread_count + 1,
        [`${notification.category}_count`]: (prev as any)[`${notification.category}_count`] + 1
      } : null)
    }

    const handleNotificationUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<SupabaseNotification>
      const notification = customEvent.detail
      
      // Update existing notification in list
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? notification : n)
      )
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('supabaseNotificationReceived', handleNewNotification)
      window.addEventListener('supabaseNotificationUpdated', handleNotificationUpdate)

      return () => {
        window.removeEventListener('supabaseNotificationReceived', handleNewNotification)
        window.removeEventListener('supabaseNotificationUpdated', handleNotificationUpdate)
      }
    }
  }, [])

  // Auto-initialize if userId provided
  useEffect(() => {
    if (autoInitialize && userId && !isInitialized) {
      initialize(userId)
    }
  }, [autoInitialize, userId, isInitialized, initialize])

  // Setup polling for counts (fallback)
  useEffect(() => {
    if (isInitialized && pollingInterval > 0) {
      pollingIntervalRef.current = setInterval(() => {
        refreshCounts()
      }, pollingInterval)

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
      }
    }
  }, [isInitialized, pollingInterval, refreshCounts])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handlersRef.current.forEach(unsubscribe => unsubscribe())
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  return {
    // State
    notifications,
    counts,
    settings,
    isLoading,
    error,
    isInitialized,

    // Actions
    initialize,
    loadNotifications,
    loadMore,
    markAsRead,
    updateSettings,
    requestPermission,
    updatePushToken,
    createNotification,
    refreshCounts,
    disconnect,

    // Event handlers
    onNewNotification
  }
}
