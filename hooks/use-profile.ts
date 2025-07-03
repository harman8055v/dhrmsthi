import { useState } from 'react'
import { userService, fileService, UserProfile } from '@/lib/data-service'
import { useAuth } from './use-auth'

interface ProfileUpdateState {
  loading: boolean
  error: string | null
  success: boolean
}

export function useProfile() {
  const { user, profile, refreshProfile } = useAuth()
  const [updateState, setUpdateState] = useState<ProfileUpdateState>({
    loading: false,
    error: null,
    success: false
  })

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      setUpdateState({
        loading: false,
        error: 'User not authenticated',
        success: false
      })
      return
    }

    try {
      setUpdateState({
        loading: true,
        error: null,
        success: false
      })

      await userService.updateProfile(updates)
      
      // Refresh the profile in auth context
      await refreshProfile()

      setUpdateState({
        loading: false,
        error: null,
        success: true
      })

      // Reset success state after 3 seconds
      setTimeout(() => {
        setUpdateState(prev => ({ ...prev, success: false }))
      }, 3000)

    } catch (error: any) {
      console.error('Profile update error:', error)
      setUpdateState({
        loading: false,
        error: error.message || 'Failed to update profile',
        success: false
      })
    }
  }

  const uploadProfileImage = async (file: File): Promise<string | null> => {
    if (!user) {
      setUpdateState({
        loading: false,
        error: 'User not authenticated',
        success: false
      })
      return null
    }

    try {
      setUpdateState({
        loading: true,
        error: null,
        success: false
      })

      // Upload image to storage
      const imagePath = await fileService.uploadImage(file, 'user-photos')
      
      // Get signed URL for immediate use
      const signedUrl = await fileService.getSignedUrl(imagePath, 'user-photos')
      
      // Update profile with new image
      const currentPhotos = profile?.user_photos || []
      const updatedPhotos = [...currentPhotos, imagePath]
      
      await userService.updateProfile({
        user_photos: updatedPhotos
      })

      // Refresh profile
      await refreshProfile()

      setUpdateState({
        loading: false,
        error: null,
        success: true
      })

      return signedUrl

    } catch (error: any) {
      console.error('Image upload error:', error)
      setUpdateState({
        loading: false,
        error: error.message || 'Failed to upload image',
        success: false
      })
      return null
    }
  }

  const deleteProfileImage = async (imagePath: string): Promise<boolean> => {
    if (!user || !profile) {
      setUpdateState({
        loading: false,
        error: 'User not authenticated',
        success: false
      })
      return false
    }

    try {
      setUpdateState({
        loading: true,
        error: null,
        success: false
      })

      // Remove from storage
      await fileService.deleteImage(imagePath, 'user-photos')
      
      // Update profile
      const currentPhotos = profile.user_photos || []
      const updatedPhotos = currentPhotos.filter(photo => photo !== imagePath)
      
      await userService.updateProfile({
        user_photos: updatedPhotos
      })

      // Refresh profile
      await refreshProfile()

      setUpdateState({
        loading: false,
        error: null,
        success: true
      })

      return true

    } catch (error: any) {
      console.error('Image deletion error:', error)
      setUpdateState({
        loading: false,
        error: error.message || 'Failed to delete image',
        success: false
      })
      return false
    }
  }

  const getProfileImageUrl = async (imagePath: string): Promise<string | null> => {
    try {
      return await fileService.getSignedUrl(imagePath, 'user-photos')
    } catch (error) {
      console.error('Error getting signed URL:', error)
      return null
    }
  }

  const completeOnboarding = async (onboardingData: Partial<UserProfile>): Promise<boolean> => {
    if (!user) {
      setUpdateState({
        loading: false,
        error: 'User not authenticated',
        success: false
      })
      return false
    }

    try {
      setUpdateState({
        loading: true,
        error: null,
        success: false
      })

      // Update profile with onboarding data and mark as completed
      await userService.updateProfile({
        ...onboardingData,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })

      // Refresh profile
      await refreshProfile()

      setUpdateState({
        loading: false,
        error: null,
        success: true
      })

      return true

    } catch (error: any) {
      console.error('Onboarding completion error:', error)
      setUpdateState({
        loading: false,
        error: error.message || 'Failed to complete onboarding',
        success: false
      })
      return false
    }
  }

  const clearError = () => {
    setUpdateState(prev => ({ ...prev, error: null }))
  }

  const clearSuccess = () => {
    setUpdateState(prev => ({ ...prev, success: false }))
  }

  return {
    profile,
    updateProfile,
    uploadProfileImage,
    deleteProfileImage,
    getProfileImageUrl,
    completeOnboarding,
    clearError,
    clearSuccess,
    ...updateState
  }
} 