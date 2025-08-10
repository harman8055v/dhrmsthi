/**
 * Notification UI Components
 * Handles display of various notification types (modals, banners, toasts)
 */

"use client"

import React, { useState, useEffect } from 'react'
import { X, Gift, Star, Heart, Bell, Calendar, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { NotificationData, NotificationPriority, NotificationCategory, NotificationType } from '@/lib/webview-bridge'
import { cn } from '@/lib/utils'

interface NotificationUIProps {
  onAction?: (action: string, notificationId?: string) => void
}

// Campaign Modal Component
export function CampaignModal({ onAction }: NotificationUIProps) {
  const [notification, setNotification] = useState<NotificationData | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleShowModal = (event: Event) => {
      const customEvent = event as CustomEvent
      const { notification: notificationData, onAction: actionCallback } = customEvent.detail
      
      setNotification(notificationData)
      setIsOpen(true)

      // Store action callback
      if (actionCallback) {
        onAction = actionCallback
      }
    }

    window.addEventListener('showCampaignModal', handleShowModal)
    return () => window.removeEventListener('showCampaignModal', handleShowModal)
  }, [])

  const handleAction = (action: string) => {
    if (onAction && notification) {
      onAction(action, notification.data.notificationId)
    }
    setIsOpen(false)
  }

  if (!notification) return null

  const getIcon = () => {
    switch (notification.type) {
      case NotificationType.PROMOTION:
      case NotificationType.SEASONAL:
        return <Gift className="w-8 h-8 text-purple-600" />
      case NotificationType.PREMIUM_FEATURES:
        return <Star className="w-8 h-8 text-yellow-600" />
      case NotificationType.ACHIEVEMENT:
        return <Trophy className="w-8 h-8 text-green-600" />
      default:
        return <Bell className="w-8 h-8 text-blue-600" />
    }
  }

  const getGradient = () => {
    switch (notification.category) {
      case NotificationCategory.MARKETING:
        return 'bg-gradient-to-br from-purple-500 to-pink-600'
      case NotificationCategory.MONETIZATION:
        return 'bg-gradient-to-br from-yellow-500 to-orange-600'
      case NotificationCategory.ENGAGEMENT:
        return 'bg-gradient-to-br from-blue-500 to-cyan-600'
      default:
        return 'bg-gradient-to-br from-gray-500 to-gray-600'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center">
          <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4", getGradient())}>
            {getIcon()}
          </div>
          <DialogTitle className="text-xl font-bold">{notification.title}</DialogTitle>
          <DialogDescription className="text-base mt-2">
            {notification.body}
          </DialogDescription>
        </DialogHeader>

        {notification.imageUrl && (
          <div className="my-4">
            <img 
              src={notification.imageUrl} 
              alt="Notification" 
              className="w-full h-40 object-cover rounded-lg"
            />
          </div>
        )}

        {notification.data.promoCode && (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-lg my-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Use promo code:</p>
              <div className="bg-white px-4 py-2 rounded-lg border-2 border-dashed border-purple-300">
                <code className="text-lg font-bold text-purple-600">{notification.data.promoCode}</code>
              </div>
            </div>
          </div>
        )}

        {notification.expiresAt && (
          <div className="flex items-center justify-center text-sm text-orange-600 mb-4">
            <Calendar className="w-4 h-4 mr-2" />
            Expires: {new Date(notification.expiresAt).toLocaleDateString()}
          </div>
        )}

        <DialogFooter className="flex gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={() => handleAction('dismiss')}
            className="flex-1"
          >
            Not Now
          </Button>
          <Button 
            onClick={() => handleAction('click')}
            className={cn("flex-1", getGradient())}
          >
            {notification.category === NotificationCategory.MARKETING ? 'Claim Offer' : 'View Details'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Campaign Banner Component
export function CampaignBanner({ onAction }: NotificationUIProps) {
  const [notification, setNotification] = useState<NotificationData | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleShowBanner = (event: Event) => {
      const customEvent = event as CustomEvent
      const { notification: notificationData, onAction: actionCallback } = customEvent.detail
      
      setNotification(notificationData)
      setIsVisible(true)

      if (actionCallback) {
        onAction = actionCallback
      }

      // Auto-hide after 10 seconds
      setTimeout(() => {
        setIsVisible(false)
      }, 10000)
    }

    window.addEventListener('showCampaignBanner', handleShowBanner)
    return () => window.removeEventListener('showCampaignBanner', handleShowBanner)
  }, [])

  const handleAction = (action: string) => {
    if (onAction && notification) {
      onAction(action, notification.data.notificationId)
    }
    if (action === 'dismiss') {
      setIsVisible(false)
    }
  }

  if (!notification || !isVisible) return null

  const getGradient = () => {
    switch (notification.category) {
      case NotificationCategory.MARKETING:
        return 'bg-gradient-to-r from-purple-500 to-pink-600'
      case NotificationCategory.MONETIZATION:
        return 'bg-gradient-to-r from-yellow-500 to-orange-600'
      case NotificationCategory.ENGAGEMENT:
        return 'bg-gradient-to-r from-blue-500 to-cyan-600'
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600'
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300">
      <div className={cn("text-white p-4", getGradient())}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {notification.imageUrl ? (
              <img 
                src={notification.imageUrl} 
                alt="" 
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{notification.title}</h3>
              <p className="text-white/90 text-sm">{notification.body}</p>
              
              {notification.data.promoCode && (
                <div className="mt-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    Code: {notification.data.promoCode}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => handleAction('click')}
              className="bg-white text-gray-900 hover:bg-white/90"
            >
              {notification.category === NotificationCategory.MARKETING ? 'Claim' : 'View'}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAction('dismiss')}
              className="text-white hover:bg-white/10 p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Campaign Toast Component
export function CampaignToast({ onAction }: NotificationUIProps) {
  useEffect(() => {
    const handleShowToast = (event: Event) => {
      const customEvent = event as CustomEvent
      const { notification, onAction: actionCallback } = customEvent.detail
      
      const action = () => {
        if (actionCallback) {
          actionCallback('click', notification.data.notificationId)
        }
      }

      const dismiss = () => {
        if (actionCallback) {
          actionCallback('dismiss', notification.data.notificationId)
        }
      }

      // Show toast notification
      toast({
        title: notification.title,
        description: notification.body,
        duration: 8000,
        action: notification.category === NotificationCategory.MARKETING ? (
          <Button size="sm" onClick={action} className="bg-purple-600 hover:bg-purple-700">
            Claim
          </Button>
        ) : undefined,
      })

      // Track impression
      if (actionCallback) {
        actionCallback('received', notification.data.notificationId)
      }
    }

    window.addEventListener('showCampaignToast', handleShowToast)
    return () => window.removeEventListener('showCampaignToast', handleShowToast)
  }, [])

  return null // Toast is handled by the toast system
}

// Critical Notification Modal
export function CriticalNotificationModal({ onAction }: NotificationUIProps) {
  const [notification, setNotification] = useState<NotificationData | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleShowCritical = (event: Event) => {
      const customEvent = event as CustomEvent
      const notificationData = customEvent.detail as NotificationData
      
      setNotification(notificationData)
      setIsOpen(true)
    }

    window.addEventListener('showCriticalNotification', handleShowCritical)
    return () => window.removeEventListener('showCriticalNotification', handleShowCritical)
  }, [])

  const handleAction = (action: string) => {
    if (onAction && notification) {
      onAction(action, notification.data.notificationId)
    }
    setIsOpen(false)
  }

  if (!notification) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-sm mx-auto border-red-200">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-red-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-red-800">{notification.title}</DialogTitle>
          <DialogDescription className="text-base mt-2 text-red-700">
            {notification.body}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6">
          <Button 
            onClick={() => handleAction('click')}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            Acknowledge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Main Notification Manager Component
export function NotificationManager() {
  return (
    <>
      <CampaignModal />
      <CampaignBanner />
      <CampaignToast />
      <CriticalNotificationModal />
    </>
  )
}

// Notification Preferences Component
export function NotificationPreferences() {
  const [preferences, setPreferences] = useState({
    social: {
      messages: true,
      likes: true,
      superlikes: true,
      matches: true
    },
    marketing: {
      promotions: true,
      seasonal: true,
      features: true,
      enabled: true
    },
    engagement: {
      dailyReminders: false,
      weeklyDigest: true,
      tips: true,
      achievements: true,
      community: true,
      enabled: true
    },
    monetization: {
      subscription: true,
      premiumFeatures: true,
      enabled: true
    },
    system: {
      general: true,
      critical: true
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    },
    doNotDisturb: false
  })

  useEffect(() => {
    // Load preferences from localStorage
    const stored = localStorage.getItem('notification_preferences')
    if (stored) {
      try {
        setPreferences(JSON.parse(stored))
      } catch (error) {
        console.error('Error loading notification preferences:', error)
      }
    }
  }, [])

  const updatePreferences = (newPreferences: typeof preferences) => {
    setPreferences(newPreferences)
    localStorage.setItem('notification_preferences', JSON.stringify(newPreferences))
    
    // Dispatch event to update webview bridge
    window.dispatchEvent(new CustomEvent('notificationPreferencesUpdated', {
      detail: newPreferences
    }))
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Customize which notifications you want to receive
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Social Notifications */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Social Notifications
          </h3>
          <div className="space-y-2 ml-6">
            {Object.entries(preferences.social).map(([key, value]) => (
              <label key={key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => updatePreferences({
                    ...preferences,
                    social: { ...preferences.social, [key]: e.target.checked }
                  })}
                  className="rounded"
                />
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Marketing Notifications */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Marketing & Promotions
          </h3>
          <div className="space-y-2 ml-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={preferences.marketing.enabled}
                onChange={(e) => updatePreferences({
                  ...preferences,
                  marketing: { ...preferences.marketing, enabled: e.target.checked }
                })}
                className="rounded"
              />
              <span>Enable marketing notifications</span>
            </label>
            
            {preferences.marketing.enabled && (
              <div className="ml-6 space-y-2">
                {Object.entries(preferences.marketing).filter(([key]) => key !== 'enabled').map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updatePreferences({
                        ...preferences,
                        marketing: { ...preferences.marketing, [key]: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quiet Hours */}
        <div>
          <h3 className="font-semibold mb-3">Quiet Hours</h3>
          <div className="space-y-2 ml-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={preferences.quietHours.enabled}
                onChange={(e) => updatePreferences({
                  ...preferences,
                  quietHours: { ...preferences.quietHours, enabled: e.target.checked }
                })}
                className="rounded"
              />
              <span>Enable quiet hours</span>
            </label>
            
            {preferences.quietHours.enabled && (
              <div className="ml-6 flex items-center space-x-4">
                <div>
                  <label className="block text-sm">From:</label>
                  <input
                    type="time"
                    value={preferences.quietHours.startTime}
                    onChange={(e) => updatePreferences({
                      ...preferences,
                      quietHours: { ...preferences.quietHours, startTime: e.target.value }
                    })}
                    className="border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-sm">To:</label>
                  <input
                    type="time"
                    value={preferences.quietHours.endTime}
                    onChange={(e) => updatePreferences({
                      ...preferences,
                      quietHours: { ...preferences.quietHours, endTime: e.target.value }
                    })}
                    className="border rounded px-2 py-1"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Do Not Disturb */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.doNotDisturb}
              onChange={(e) => updatePreferences({
                ...preferences,
                doNotDisturb: e.target.checked
              })}
              className="rounded"
            />
            <span className="font-semibold">Do Not Disturb</span>
          </label>
          <p className="text-sm text-gray-600 ml-6">Block all non-critical notifications</p>
        </div>
      </CardContent>
    </Card>
  )
}
