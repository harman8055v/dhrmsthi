/**
 * Marketing Campaign Handler
 * Manages marketing notifications, campaigns, and promotional content
 */

import { logger } from './logger'
import analytics from './analytics'
import { NotificationData, NotificationCategory, NotificationType, NotificationPriority } from './webview-bridge'

// Campaign types
export enum CampaignType {
  SEASONAL = 'seasonal',
  FEATURE_LAUNCH = 'feature_launch',
  SUBSCRIPTION_PROMO = 'subscription_promo',
  ENGAGEMENT_BOOST = 'engagement_boost',
  RETENTION = 'retention',
  REACTIVATION = 'reactivation'
}

// Campaign data structure
export interface Campaign {
  id: string
  name: string
  type: CampaignType
  title: string
  description: string
  imageUrl?: string
  actionUrl?: string
  promoCode?: string
  discount?: {
    percentage?: number
    amount?: number
    currency?: string
  }
  validFrom: string
  validUntil: string
  targetAudience: {
    accountTypes?: string[]
    inactiveFor?: number // days
    minAge?: number
    maxAge?: number
    gender?: string
    verificationStatus?: string[]
  }
  isActive: boolean
  priority: NotificationPriority
  maxShows: number
  cooldownHours: number
}

// Seasonal campaigns configuration
const SEASONAL_CAMPAIGNS: Partial<Campaign>[] = [
  {
    type: CampaignType.SEASONAL,
    name: 'Diwali Special',
    title: '🪔 Diwali Special: Find Your Perfect Match!',
    description: 'Celebrate Diwali by finding your spiritual life partner. Get 50% off on premium features!',
    promoCode: 'DIWALI50',
    discount: { percentage: 50 },
    targetAudience: {
      accountTypes: ['free', 'basic']
    }
  },
  {
    type: CampaignType.SEASONAL,
    name: 'Valentine Special',
    title: '💕 Valentine\'s Week: Love is in the Air!',
    description: 'Find your soulmate this Valentine\'s week. Special discounts on all premium plans!',
    promoCode: 'LOVE2024',
    discount: { percentage: 40 },
    targetAudience: {
      accountTypes: ['free', 'basic']
    }
  },
  {
    type: CampaignType.SEASONAL,
    name: 'Holi Celebration',
    title: '🌈 Holi Special: Add Colors to Your Love Life!',
    description: 'Celebrate Holi by connecting with compatible matches. Unlock premium features now!',
    promoCode: 'HOLI30',
    discount: { percentage: 30 },
    targetAudience: {
      accountTypes: ['free']
    }
  }
]

class MarketingCampaignHandler {
  private activeCampaigns: Map<string, Campaign> = new Map()
  private userCampaignHistory: Map<string, { campaignId: string, showCount: number, lastShown: Date }[]> = new Map()
  private router: any = null

  constructor() {
    this.initializeCampaigns()
    this.setupEventListeners()
  }

  /**
   * Set router for navigation
   */
  setRouter(router: any) {
    this.router = router
  }

  /**
   * Initialize marketing campaigns
   */
  private initializeCampaigns() {
    // Load campaigns from localStorage or API
    this.loadCampaignsFromStorage()
    
    // Set up seasonal campaigns
    this.setupSeasonalCampaigns()
  }

  /**
   * Setup event listeners for marketing notifications
   */
  private setupEventListeners() {
    if (typeof window === 'undefined') return

    window.addEventListener('showMarketingNotification', this.handleMarketingNotification.bind(this) as EventListener)
    window.addEventListener('campaignInteraction', this.handleCampaignInteraction.bind(this) as EventListener)
  }

  /**
   * Handle marketing notification display
   */
  private handleMarketingNotification(event: Event) {
    const customEvent = event as CustomEvent
    const notification = customEvent.detail as NotificationData

    if (!notification) return

    logger.log('📢 Marketing: Showing notification', notification)

    // Check if we should show this notification
    if (!this.shouldShowCampaignNotification(notification)) {
      logger.log('📢 Marketing: Notification suppressed by frequency rules')
      return
    }

    // Track impression
    this.trackCampaignEvent('impression', notification)

    // Show notification based on priority
    switch (notification.priority) {
      case NotificationPriority.HIGH:
      case NotificationPriority.CRITICAL:
        this.showModalNotification(notification)
        break
      
      case NotificationPriority.NORMAL:
        this.showBannerNotification(notification)
        break
      
      case NotificationPriority.LOW:
        this.showToastNotification(notification)
        break
    }

    // Update user campaign history
    this.updateCampaignHistory(notification)
  }

  /**
   * Handle campaign interaction
   */
  private handleCampaignInteraction(event: Event) {
    const customEvent = event as CustomEvent
    const { action, campaignId, notificationId } = customEvent.detail

    logger.log('📢 Marketing: Campaign interaction', { action, campaignId })

    // Track interaction
    this.trackCampaignEvent(action, { campaignId, notificationId })

    // Handle specific actions
    switch (action) {
      case 'click':
        this.handleCampaignClick(campaignId)
        break
      
      case 'dismiss':
        this.handleCampaignDismiss(campaignId)
        break
      
      case 'convert':
        this.handleCampaignConversion(campaignId)
        break
    }
  }

  /**
   * Check if campaign notification should be shown
   */
  private shouldShowCampaignNotification(notification: NotificationData): boolean {
    const userId = this.getCurrentUserId()
    if (!userId) return false

    const campaignId = notification.data.campaignId
    if (!campaignId) return true

    const userHistory = this.userCampaignHistory.get(userId) || []
    const campaignHistory = userHistory.find(h => h.campaignId === campaignId)

    if (!campaignHistory) return true

    const campaign = this.activeCampaigns.get(campaignId)
    if (!campaign) return true

    // Check max shows
    if (campaignHistory.showCount >= campaign.maxShows) {
      return false
    }

    // Check cooldown
    const hoursSinceLastShow = (Date.now() - campaignHistory.lastShown.getTime()) / (1000 * 60 * 60)
    if (hoursSinceLastShow < campaign.cooldownHours) {
      return false
    }

    return true
  }

  /**
   * Show modal notification for high-priority campaigns
   */
  private showModalNotification(notification: NotificationData) {
    const event = new CustomEvent('showCampaignModal', {
      detail: {
        notification,
        onAction: (action: string) => {
          window.dispatchEvent(new CustomEvent('campaignInteraction', {
            detail: {
              action,
              campaignId: notification.data.campaignId,
              notificationId: notification.data.notificationId
            }
          }))
        }
      }
    })
    window.dispatchEvent(event)
  }

  /**
   * Show banner notification
   */
  private showBannerNotification(notification: NotificationData) {
    const event = new CustomEvent('showCampaignBanner', {
      detail: {
        notification,
        onAction: (action: string) => {
          window.dispatchEvent(new CustomEvent('campaignInteraction', {
            detail: {
              action,
              campaignId: notification.data.campaignId,
              notificationId: notification.data.notificationId
            }
          }))
        }
      }
    })
    window.dispatchEvent(event)
  }

  /**
   * Show toast notification
   */
  private showToastNotification(notification: NotificationData) {
    const event = new CustomEvent('showCampaignToast', {
      detail: {
        notification,
        onAction: (action: string) => {
          window.dispatchEvent(new CustomEvent('campaignInteraction', {
            detail: {
              action,
              campaignId: notification.data.campaignId,
              notificationId: notification.data.notificationId
            }
          }))
        }
      }
    })
    window.dispatchEvent(event)
  }

  /**
   * Handle campaign click
   */
  private handleCampaignClick(campaignId: string) {
    const campaign = this.activeCampaigns.get(campaignId)
    if (!campaign) return

    // Navigate based on campaign type
    switch (campaign.type) {
      case CampaignType.SUBSCRIPTION_PROMO:
        this.navigateToSubscription(campaign)
        break
      
      case CampaignType.FEATURE_LAUNCH:
        this.navigateToFeature(campaign)
        break
      
      case CampaignType.SEASONAL:
        this.navigateToPromotion(campaign)
        break
      
      default:
        if (campaign.actionUrl) {
          this.navigateToUrl(campaign.actionUrl)
        }
    }
  }

  /**
   * Handle campaign dismissal
   */
  private handleCampaignDismiss(campaignId: string) {
    // Update dismissal frequency for this user
    const userId = this.getCurrentUserId()
    if (userId && campaignId) {
      // Increase cooldown for dismissed campaigns
      this.updateCampaignCooldown(userId, campaignId, 24) // 24 hours cooldown
    }
  }

  /**
   * Handle campaign conversion
   */
  private handleCampaignConversion(campaignId: string) {
    const campaign = this.activeCampaigns.get(campaignId)
    if (!campaign) return

    // Track conversion value
    analytics.track('campaign_conversion', {
      campaign_id: campaignId,
      campaign_type: campaign.type,
      promo_code: campaign.promoCode,
      conversion_value: campaign.discount?.amount || campaign.discount?.percentage,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Navigate to subscription page with promo
   */
  private navigateToSubscription(campaign: Campaign) {
    const url = `/premium?campaign=${campaign.id}&promo=${campaign.promoCode || ''}`
    this.navigateToUrl(url)
  }

  /**
   * Navigate to feature page
   */
  private navigateToFeature(campaign: Campaign) {
    const url = `/features?campaign=${campaign.id}`
    this.navigateToUrl(url)
  }

  /**
   * Navigate to promotion page
   */
  private navigateToPromotion(campaign: Campaign) {
    const url = `/premium?campaign=${campaign.id}&promo=${campaign.promoCode || ''}`
    this.navigateToUrl(url)
  }

  /**
   * Navigate to URL
   */
  private navigateToUrl(url: string) {
    if (this.router) {
      this.router.push(url)
    } else if (typeof window !== 'undefined') {
      window.location.href = url
    }
  }

  /**
   * Track campaign events
   */
  private trackCampaignEvent(event: string, data: any) {
    analytics.track(`campaign_${event}`, {
      ...data,
      timestamp: new Date().toISOString(),
      user_id: this.getCurrentUserId()
    })
  }

  /**
   * Update campaign history for user
   */
  private updateCampaignHistory(notification: NotificationData) {
    const userId = this.getCurrentUserId()
    if (!userId || !notification.data.campaignId) return

    const userHistory = this.userCampaignHistory.get(userId) || []
    const campaignId = notification.data.campaignId
    
    const existingHistory = userHistory.find(h => h.campaignId === campaignId)
    
    if (existingHistory) {
      existingHistory.showCount++
      existingHistory.lastShown = new Date()
    } else {
      userHistory.push({
        campaignId,
        showCount: 1,
        lastShown: new Date()
      })
    }

    this.userCampaignHistory.set(userId, userHistory)
    this.saveCampaignHistoryToStorage()
  }

  /**
   * Update campaign cooldown
   */
  private updateCampaignCooldown(userId: string, campaignId: string, additionalHours: number) {
    const campaign = this.activeCampaigns.get(campaignId)
    if (campaign) {
      campaign.cooldownHours += additionalHours
    }
  }

  /**
   * Setup seasonal campaigns based on current date
   */
  private setupSeasonalCampaigns() {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentDay = now.getDate()

    // Diwali (usually October/November)
    if (currentMonth === 9 || currentMonth === 10) { // October or November
      this.activateSeasonalCampaign('Diwali Special')
    }

    // Valentine's Week (February 7-14)
    if (currentMonth === 1 && currentDay >= 7 && currentDay <= 14) { // February
      this.activateSeasonalCampaign('Valentine Special')
    }

    // Holi (usually March)
    if (currentMonth === 2) { // March
      this.activateSeasonalCampaign('Holi Celebration')
    }
  }

  /**
   * Activate seasonal campaign
   */
  private activateSeasonalCampaign(campaignName: string) {
    const seasonalCampaign = SEASONAL_CAMPAIGNS.find(c => c.name === campaignName)
    if (!seasonalCampaign) return

    const campaign: Campaign = {
      id: `seasonal_${campaignName.toLowerCase().replace(' ', '_')}_${new Date().getFullYear()}`,
      name: seasonalCampaign.name!,
      type: seasonalCampaign.type!,
      title: seasonalCampaign.title!,
      description: seasonalCampaign.description!,
      promoCode: seasonalCampaign.promoCode,
      discount: seasonalCampaign.discount,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      targetAudience: seasonalCampaign.targetAudience!,
      isActive: true,
      priority: NotificationPriority.HIGH,
      maxShows: 3,
      cooldownHours: 48
    }

    this.activeCampaigns.set(campaign.id, campaign)
    logger.log('📢 Marketing: Activated seasonal campaign', campaign.name)
  }

  /**
   * Load campaigns from storage
   */
  private loadCampaignsFromStorage() {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('marketing_campaigns')
      if (stored) {
        const campaigns = JSON.parse(stored)
        campaigns.forEach((campaign: Campaign) => {
          this.activeCampaigns.set(campaign.id, campaign)
        })
      }

      const historyStored = localStorage.getItem('campaign_history')
      if (historyStored) {
        const history = JSON.parse(historyStored)
        Object.entries(history).forEach(([userId, userHistory]) => {
          this.userCampaignHistory.set(userId, userHistory as any)
        })
      }
    } catch (error) {
      logger.error('❌ Marketing: Error loading campaigns from storage', error)
    }
  }

  /**
   * Save campaign history to storage
   */
  private saveCampaignHistoryToStorage() {
    if (typeof window === 'undefined') return

    try {
      const historyObj: any = {}
      this.userCampaignHistory.forEach((history, userId) => {
        historyObj[userId] = history
      })
      localStorage.setItem('campaign_history', JSON.stringify(historyObj))
    } catch (error) {
      logger.error('❌ Marketing: Error saving campaign history', error)
    }
  }

  /**
   * Get current user ID
   */
  private getCurrentUserId(): string | null {
    // Get from auth context or localStorage
    try {
      const stored = localStorage.getItem('user_id')
      return stored
    } catch {
      return null
    }
  }

  /**
   * Get active campaigns
   */
  public getActiveCampaigns(): Campaign[] {
    return Array.from(this.activeCampaigns.values()).filter(c => c.isActive)
  }

  /**
   * Add campaign
   */
  public addCampaign(campaign: Campaign) {
    this.activeCampaigns.set(campaign.id, campaign)
    this.saveCampaignsToStorage()
  }

  /**
   * Remove campaign
   */
  public removeCampaign(campaignId: string) {
    this.activeCampaigns.delete(campaignId)
    this.saveCampaignsToStorage()
  }

  /**
   * Save campaigns to storage
   */
  private saveCampaignsToStorage() {
    if (typeof window === 'undefined') return

    try {
      const campaigns = Array.from(this.activeCampaigns.values())
      localStorage.setItem('marketing_campaigns', JSON.stringify(campaigns))
    } catch (error) {
      logger.error('❌ Marketing: Error saving campaigns', error)
    }
  }

  /**
   * Check if promo code is valid
   */
  public validatePromoCode(promoCode: string): Campaign | null {
    const campaign = Array.from(this.activeCampaigns.values()).find(c => 
      c.promoCode === promoCode && 
      c.isActive &&
      new Date(c.validUntil) > new Date()
    )
    
    return campaign || null
  }

  /**
   * Process promo code usage
   */
  public processPromoCodeUsage(promoCode: string, userId: string) {
    const campaign = this.validatePromoCode(promoCode)
    if (!campaign) return false

    // Track conversion
    this.trackCampaignEvent('conversion', {
      campaign_id: campaign.id,
      promo_code: promoCode,
      user_id: userId
    })

    return true
  }
}

// Export singleton instance
export const marketingCampaignHandler = new MarketingCampaignHandler()

// Export types with aliases to avoid conflicts
export type { Campaign as MarketingCampaign }
