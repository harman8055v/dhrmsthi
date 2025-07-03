"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { toast } from 'sonner'
import { DataServiceError } from '@/lib/data-service'

interface ToastContextType {
  showSuccess: (message: string, description?: string) => void
  showError: (message: string, description?: string) => void
  showWarning: (message: string, description?: string) => void
  showInfo: (message: string, description?: string) => void
  handleError: (error: unknown, fallbackMessage?: string) => void
  showLoading: (message: string) => string
  dismissLoading: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [loadingToasts, setLoadingToasts] = useState<Set<string>>(new Set())

  const showSuccess = useCallback((message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
    })
  }, [])

  const showError = useCallback((message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 6000,
    })
  }, [])

  const showWarning = useCallback((message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 5000,
    })
  }, [])

  const showInfo = useCallback((message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
    })
  }, [])

  const handleError = useCallback((error: unknown, fallbackMessage = 'An unexpected error occurred') => {
    console.error('Toast error handler:', error)

    let message = fallbackMessage
    let description: string | undefined

    if (error instanceof DataServiceError) {
      message = error.message
      description = error.code ? `Error code: ${error.code}` : undefined
    } else if (error instanceof Error) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String(error.message)
    }

    // Handle specific error types
    if (message.includes('Authentication required') || message.includes('AUTH_REQUIRED')) {
      showError('Please sign in to continue', 'Your session may have expired')
      return
    }

    if (message.includes('Access denied') || message.includes('ACCESS_DENIED')) {
      showError('Access denied', 'You don\'t have permission to perform this action')
      return
    }

    if (message.includes('Network') || message.includes('fetch')) {
      showError('Connection error', 'Please check your internet connection and try again')
      return
    }

    if (message.includes('Daily limit')) {
      showWarning('Daily limit reached', 'Upgrade to premium for unlimited access')
      return
    }

    showError(message, description)
  }, [showError, showWarning])

  const showLoading = useCallback((message: string): string => {
    const id = toast.loading(message, {
      duration: Infinity,
    })
    setLoadingToasts(prev => new Set(prev).add(id))
    return id
  }, [])

  const dismissLoading = useCallback((id: string) => {
    toast.dismiss(id)
    setLoadingToasts(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }, [])

  const value: ToastContextType = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    handleError,
    showLoading,
    dismissLoading,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Predefined toast messages for common actions
export const toastMessages = {
  profile: {
    updated: 'Profile updated successfully',
    updateFailed: 'Failed to update profile',
    imageUploaded: 'Image uploaded successfully',
    imageUploadFailed: 'Failed to upload image',
    imageDeleted: 'Image deleted successfully',
    imageDeleteFailed: 'Failed to delete image',
  },
  auth: {
    signInSuccess: 'Welcome back!',
    signUpSuccess: 'Account created successfully!',
    signOutSuccess: 'Signed out successfully',
    authFailed: 'Authentication failed',
    sessionExpired: 'Session expired, please sign in again',
  },
  swipe: {
    likeSuccess: 'Profile liked!',
    superlikeSuccess: 'Super like sent!',
    matchFound: 'It\'s a match! 🎉',
    dailyLimitReached: 'Daily limit reached',
    superlikeLimitReached: 'Daily super like limit reached',
  },
  messages: {
    sent: 'Message sent',
    sendFailed: 'Failed to send message',
    markedRead: 'Messages marked as read',
  },
  onboarding: {
    completed: 'Onboarding completed! Welcome to DharmaSaathi',
    incomplete: 'Please complete your profile to continue',
  },
  premium: {
    upgradeSuccess: 'Welcome to premium!',
    upgradeFailed: 'Failed to upgrade to premium',
    featureLocked: 'This feature requires premium',
  },
  general: {
    networkError: 'Network error, please try again',
    serverError: 'Server error, please try again later',
    unknownError: 'An unexpected error occurred',
    retrySuccess: 'Action completed successfully',
    retryFailed: 'Action failed, please try again',
  }
} as const 