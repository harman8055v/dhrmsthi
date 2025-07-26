import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'
import { logger } from './logger'

// Types for better type safety - Updated to match new schema
export interface UserProfile {
  id: string
  phone: string // Primary identifier for auth
  email?: string // Optional, collected during onboarding
  mobile_verified: boolean
  email_verified: boolean
  first_name?: string
  last_name?: string
  full_name?: string
  gender?: 'Male' | 'Female' | 'Other'
  birthdate?: string
  height_ft?: number // Height in feet (4-7)
  height_in?: number // Height in inches (0-11)
  // Location fields using foreign keys
  city_id?: number
  state_id?: number
  country_id?: number
  // Spiritual and personal fields
  spiritual_org?: string[]
  daily_practices?: string[]
  temple_visit_freq?: 'Daily' | 'Weekly' | 'Monthly' | 'Rarely' | 'Never'
  vanaprastha_interest?: 'yes' | 'no' | 'open'
  artha_vs_moksha?: 'Artha-focused' | 'Moksha-focused' | 'Balance'
  favorite_spiritual_quote?: string
  // Professional and personal info
  education?: string
  profession?: string
  annual_income?: string
  diet?: 'Vegetarian' | 'Vegan' | 'Eggetarian' | 'Non-Vegetarian'
  marital_status?: string
  mother_tongue?: string
  // About and partner expectations
  about_me?: string
  ideal_partner_notes?: string // Only free-text partner preferences field
  // Profile images
  profile_photo_url?: string
  user_photos?: string[] // JSONB array of signed URLs
  // Status and verification
  is_onboarded: boolean
  verification_status?: 'pending' | 'verified' | 'rejected'
  account_status?: 'drishti' | 'sparsh' | 'sangam' | 'samarpan' | 'suspended' | 'deleted'
  premium_expires_at?: string
  // Counters
  super_likes_count: number
  swipe_count: number
  message_highlights_count: number
  // Referral system
  referral_code?: string
  referred_by?: string
  // Profile quality scoring
  profile_score?: number
  profile_scored_at?: string
  profile_scored_by?: string
  // Timestamps
  created_at: string
  updated_at: string
}

export interface SwipeAction {
  id: string
  swiper_id: string
  swiped_id: string
  action: 'like' | 'dislike' | 'superlike'
  is_match: boolean
  created_at: string
}

export interface Match {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  last_message_at?: string
}

export interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  is_highlighted: boolean
  created_at: string
  read_at?: string
}

export class DataServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'DataServiceError'
  }
}

// Generic error handler
const handleSupabaseError = (error: any, operation: string): never => {
  logger.error(`Supabase error in ${operation}:`, error)
  
  if (error.code === 'PGRST116') {
    throw new DataServiceError('Authentication required', 'AUTH_REQUIRED')
  }
  
  if (error.code === 'PGRST301') {
    throw new DataServiceError('Access denied', 'ACCESS_DENIED')
  }
  
  if (error.message?.includes('duplicate key')) {
    throw new DataServiceError('Record already exists', 'DUPLICATE_KEY')
  }
  
  throw new DataServiceError(
    error.message || `Failed to ${operation}`,
    error.code,
    error
  )
}

// User Profile Operations
export const userService = {
  // Get current user profile
  async getCurrentProfile(userId?: string): Promise<UserProfile | null> {
    logger.log('[DataService] getCurrentProfile called', { userId });
    
    // If userId is provided (mobile login), use it directly
    // Otherwise, get from auth session
    let targetUserId = userId;
    
    if (!targetUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        logger.error('[DataService] No authenticated user found');
        return null;
      }
      targetUserId = user.id;
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (error) {
      logger.error('[DataService] getCurrentProfile error:', error);
      // Don't throw for mobile login users, just return null
      if (userId) {
        return null;
      }
      throw error;
    }
    logger.log('[DataService] getCurrentProfile success', data);
    return data;
  },

  // Update user profile
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new DataServiceError('User not authenticated', 'AUTH_REQUIRED')

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      return handleSupabaseError(error, 'update profile')
    }
  },

  // Create or update user profile (upsert)
  async upsertProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new DataServiceError('User not authenticated', 'AUTH_REQUIRED')

      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          ...profileData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      return handleSupabaseError(error, 'upsert profile')
    }
  },

  // Get user by ID (for viewing profiles)
  async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          city:cities(name),
          state:states(name),
          country:countries(name)
        `)
        .eq('id', userId)
        .eq('is_onboarded', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }

      // Get signed URLs for user photos if they exist
      if (data.user_photos && data.user_photos.length > 0) {
        const signedUrls = await Promise.all(
          data.user_photos.map(async (photoPath: string) => {
            return await fileService.processPhotoUrl(photoPath)
          })
        )
        data.user_photos = signedUrls.filter(url => url !== null)
      }

      // Get signed URL for profile photo if it exists
      if (data.profile_photo_url) {
        data.profile_photo_url = await fileService.processPhotoUrl(data.profile_photo_url)
      }

      return data
    } catch (error) {
      return handleSupabaseError(error, 'get user by ID')
    }
  }
}

// Image/File Operations with Signed URLs
export const fileService = {
  // Helper function to validate and process photo URLs
  async processPhotoUrl(photoPath: string): Promise<string | null> {
    if (!photoPath) return null
    
    // Handle blob URLs - these are temporary and invalid
    if (photoPath.startsWith('blob:')) {
      logger.log('Found blob URL in profile photo, skipping:', photoPath)
      return null
    }
    
    // Handle base64 data - these are embedded images, skip for now
    if (photoPath.startsWith('data:')) {
      logger.log('Found base64 data in profile photo, skipping')
      return null
    }

    // If the URL is an external link (not Supabase storage), return it as-is
    if (photoPath.startsWith('http') && !photoPath.includes('supabase.co/storage')) {
      logger.log('External photo URL detected, returning as-is:', photoPath)
      return photoPath
    }
    
    // If it's already a full Supabase storage URL, return as-is
    if (photoPath.startsWith('https://') && photoPath.includes('supabase.co/storage')) {
      return photoPath
    }
    
    // For storage paths (like "user-id/filename.jpg"), return public URL
    try {
      const cleanPath = photoPath.replace(/^\/+/, '')
      logger.log('Generating public URL for photo path:', cleanPath)
      
      // Return the public bucket URL
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-photos/${cleanPath}`
      
      logger.log('Generated public URL:', publicUrl)
      return publicUrl
    } catch (error) {
      logger.error('Error generating public URL for photo:', error)
      return null
    }
  },

  // Upload image to Supabase Storage
  async uploadImage(file: File, bucket: string = 'user-photos'): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new DataServiceError('User not authenticated', 'AUTH_REQUIRED')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error
      return fileName
    } catch (error) {
      return handleSupabaseError(error, 'upload image')
    }
  },

  // Get signed URL for an image - DEPRECATED, use processPhotoUrl instead
  async getSignedUrl(imagePath: string, bucket: string = 'user-photos'): Promise<string | null> {
    // Since bucket is now public, just return the public URL
    return this.processPhotoUrl(imagePath)
  },

  // Delete image from storage
  async deleteImage(path: string, bucket: string = 'user-photos'): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path])

      if (error) throw error
    } catch (error) {
      return handleSupabaseError(error, 'delete image')
    }
  }
}

// Swipe Operations
export const swipeService = {
  // Record a swipe action
  async recordSwipe(swipedUserId: string, action: 'like' | 'dislike' | 'superlike'): Promise<{ isMatch: boolean }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new DataServiceError('User not authenticated', 'AUTH_REQUIRED')

      // Check if already swiped
      const { data: existingSwipe } = await supabase
        .from('swipes')
        .select('*')
        .eq('swiper_id', user.id)
        .eq('swiped_id', swipedUserId)
        .single()

      if (existingSwipe) {
        throw new DataServiceError('Already swiped on this profile', 'ALREADY_SWIPED')
      }

      // Check for reciprocal like (match)
      let isMatch = false
      if (action === 'like' || action === 'superlike') {
        const { data: reciprocalSwipe } = await supabase
          .from('swipes')
          .select('*')
          .eq('swiper_id', swipedUserId)
          .eq('swiped_id', user.id)
          .in('action', ['like', 'superlike'])
          .single()

        if (reciprocalSwipe) {
          isMatch = true
          
          // Create match record
          const user1_id = user.id < swipedUserId ? user.id : swipedUserId
          const user2_id = user.id < swipedUserId ? swipedUserId : user.id

          await supabase.from('matches').insert({
            user1_id,
            user2_id,
            created_at: new Date().toISOString()
          })
        }
      }

      // Record the swipe action
      const { error } = await supabase.from('swipes').insert({
        swiper_id: user.id,
        swiped_id: swipedUserId,
        action,
        created_at: new Date().toISOString()
      })

      if (error) throw error

      return { isMatch }
    } catch (error) {
      return handleSupabaseError(error, 'record swipe')
    }
  },

  // Get profiles to swipe on
  async getProfilesToSwipe(limit: number = 10): Promise<UserProfile[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new DataServiceError('User not authenticated', 'AUTH_REQUIRED')

      // Get profiles user has already swiped on
      const { data: swipedProfiles } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', user.id)

      const swipedIds = swipedProfiles?.map(s => s.swiped_id) || []

      // Build query for discoverable profiles with location data
      let query = supabase
        .from('users')
        .select(`
          *,
          city:cities(name),
          state:states(name),
          country:countries(name)
        `)
        .eq('verification_status', 'verified')
        .eq('is_onboarded', true)
        .neq('id', user.id)

      // Exclude already swiped profiles
      if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`)
      }

      const { data, error } = await query.limit(limit)

      if (error) throw error

      // Get signed URLs for all profiles
      const profilesWithSignedUrls = await Promise.all(
        (data || []).map(async (profile) => {
          // Get signed URLs for user photos if they exist
          if (profile.user_photos && profile.user_photos.length > 0) {
            const signedUrls = await Promise.all(
              profile.user_photos.map(async (photoPath: string) => {
                return await fileService.processPhotoUrl(photoPath)
              })
            )
            profile.user_photos = signedUrls.filter(url => url !== null)
          }

          // Get signed URL for profile photo if it exists
          if (profile.profile_photo_url) {
            profile.profile_photo_url = await fileService.processPhotoUrl(profile.profile_photo_url)
          }

          return profile
        })
      )

      return profilesWithSignedUrls
    } catch (error) {
      return handleSupabaseError(error, 'get profiles to swipe')
    }
  }
}

// Match Operations
export const matchService = {
  // Get user's matches
  async getMatches(): Promise<Match[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new DataServiceError('User not authenticated', 'AUTH_REQUIRED')

      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      return handleSupabaseError(error, 'get matches')
    }
  },

  // Get match details with other user's profile
  async getMatchWithProfile(matchId: string): Promise<{ match: Match; otherUser: UserProfile } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new DataServiceError('User not authenticated', 'AUTH_REQUIRED')

      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .single()

      if (matchError || !match) return null

      const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id
      const otherUser = await userService.getUserById(otherUserId)

      if (!otherUser) return null

      return { match, otherUser }
    } catch (error) {
      return handleSupabaseError(error, 'get match with profile')
    }
  }
}

// Message Operations
export const messageService = {
  // Send a message - Direct Supabase (much faster!)
  async sendMessage(matchId: string, content: string): Promise<Message> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new DataServiceError('User not authenticated', 'AUTH_REQUIRED')

      // Verify user is part of the match
      const { data: match } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .single()

      if (!match) {
        throw new DataServiceError('Match not found or access denied', 'ACCESS_DENIED')
      }

      // Insert message directly
      const messageData = {
        match_id: matchId,
        sender_id: user.id,
        content: content.trim(),
        created_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single()

      if (error) {
        throw new DataServiceError(error.message || 'Failed to send message', 'DB_ERROR')
      }

      // Update match's last_message_at
      const { error: updateError } = await supabase
        .from('matches')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', matchId);
      
      if (updateError) {
        console.error('[messageService] Error updating last_message_at:', updateError);
        // Don't throw error - message was sent successfully, just timestamp update failed
      }

      return data
    } catch (error: any) {
      console.error('[messageService] ❌ Send message error:', error)
      if (error instanceof DataServiceError) {
        throw error
      }
      throw new DataServiceError(error.message || 'Failed to send message', 'DB_ERROR')
    }
  },

  // Get messages for a match - Direct Supabase (much faster!)
  async getMessages(matchId: string): Promise<Message[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new DataServiceError('User not authenticated', 'AUTH_REQUIRED')

      // Verify user is part of the match
      const { data: match } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .single()

      if (!match) {
        throw new DataServiceError('Match not found or access denied', 'ACCESS_DENIED')
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Get messages error:', error)
      if (error instanceof DataServiceError) {
        throw error
      }
      throw new DataServiceError(error.message || 'Failed to get messages', 'DB_ERROR')
    }
  },

  // Mark messages as read - Direct Supabase (much faster!)
  async markMessagesAsRead(matchId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new DataServiceError('User not authenticated', 'AUTH_REQUIRED')

      // Get all unread messages from the other user first
      const { data: unreadMessages, error: fetchError } = await supabase
        .from('messages')
        .select('id, sender_id, read_at, created_at')
        .eq('match_id', matchId)
        .neq('sender_id', user.id)
        .is('read_at', null)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error(`[markMessagesAsRead] Error fetching unread messages:`, fetchError)
        throw fetchError
      }

      const unreadCount = unreadMessages?.length || 0

      if (unreadCount === 0) {
        return
      }

              // Mark messages as read with current timestamp
        const readTimestamp = new Date().toISOString()
        const messageIds = unreadMessages.map(m => m.id)

        // Update messages one by one to avoid RLS issues with .in() queries
        let successCount = 0
        for (const messageId of messageIds) {

          const { error: updateError, count } = await supabase
            .from('messages')
            .update({ read_at: readTimestamp }, { count: 'exact' })
            .eq('id', messageId)
            .eq('match_id', matchId)  // Explicit match for RLS
            .neq('sender_id', user.id)  // Only messages from other user
            .is('read_at', null)  // Only unread messages

          if (updateError) {
            console.error(`[markMessagesAsRead] Error updating message ${messageId}:`, updateError)
          } else {
            successCount += (count || 0)
          }
        }
        
        // Double-check by querying unread count again
        const { data: remainingUnread, error: remainingError } = await supabase
          .from('messages')
          .select('id')
          .eq('match_id', matchId)
          .neq('sender_id', user.id)
          .is('read_at', null)
        
        if (remainingError) {
          console.error(`[markMessagesAsRead] Error checking remaining unread:`, remainingError)
        }

    } catch (error: any) {
      console.error('Mark messages as read error:', error)
      if (error instanceof DataServiceError) {
        throw error
      }
      throw new DataServiceError(error.message || 'Failed to mark messages as read', 'DB_ERROR')
    }
  }
}

// Premium/Subscription Operations
export const premiumService = {
  // Check if user has premium access
  async hasPremiumAccess(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false
      
      const profile = await userService.getCurrentProfile(user.id)
      if (!profile) return false

      // sangam and samarpan are premium plans
      if (profile.account_status === 'sangam' || profile.account_status === 'samarpan') {
        if (profile.premium_expires_at) {
          return new Date(profile.premium_expires_at) > new Date()
        }
        return true
      }

      return false
    } catch (error) {
      logger.error('Error checking premium access:', error)
      return false
    }
  },

  // Get user's daily stats
  async getDailyStats(): Promise<{
    swipes_used: number
    superlikes_used: number
    message_highlights_used: number
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new DataServiceError('User not authenticated', 'AUTH_REQUIRED')

      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('user_daily_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return data || {
        swipes_used: 0,
        superlikes_used: 0,
        message_highlights_used: 0
      }
    } catch (error) {
      return handleSupabaseError(error, 'get daily stats')
    }
  }
}

// Analytics and Tracking
export const analyticsService = {
  // Track user action
  async trackAction(action: string, properties?: Record<string, any>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return // Don't track for anonymous users

      // You can implement your analytics tracking here
      // For now, we'll just log it
      logger.log('Analytics:', { action, properties, userId: user.id })
    } catch (error) {
      logger.error('Analytics tracking error:', error)
    }
  }
}