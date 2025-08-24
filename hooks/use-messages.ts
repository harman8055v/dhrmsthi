import { useState, useEffect, useCallback } from 'react'
import { messageService, Message } from '@/lib/data-service'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/components/auth-provider'
import { messagingBridge } from '@/lib/webview-messaging-bridge'

interface MessageState {
  messages: Message[]
  loading: boolean
  error: string | null
  sending: boolean
}

export function useMessages(matchId: string) {
  const { user } = useAuthContext()
  const [messageState, setMessageState] = useState<MessageState>({
    messages: [],
    loading: false,
    error: null,
    sending: false
  })
  
  // Add loading timeout to reload page if loading takes too long
  useEffect(() => {
    if (messageState.loading) {
      const timeoutId = setTimeout(() => {
        console.warn('[useMessages] Loading timeout - reloading page')
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      }, 3000) // 3 seconds timeout

      return () => clearTimeout(timeoutId)
    }
  }, [messageState.loading])
  
  // Remove all polling - real-time only!

  // Load messages on mount and when matchId changes
  useEffect(() => {
    if (user && matchId) {
      loadMessages()
    }
  }, [user, matchId])

  // Enhanced real-time subscription with better error handling and logging
  useEffect(() => {
    if (!user || !matchId || messageState.loading) {
      return
    }

    console.log('[useMessages] Setting up real-time subscription for match:', matchId)
    
    const subscription = supabase
      .channel(`messages_${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          console.log('[useMessages] Received INSERT event:', payload)
          const newMessage = payload.new as Message
          
          setMessageState(prev => {
            // Check for duplicates
            const exists = prev.messages.find(msg => msg.id === newMessage.id)
            if (exists) {
              console.log('[useMessages] Message already exists, skipping:', newMessage.id)
              return prev
            }
            
                      console.log('[useMessages] Adding new message to state:', newMessage.id)
          return {
            ...prev,
            messages: [...prev.messages, newMessage]
          }
        })
        
        // Mark as read if from other user
        if (newMessage.sender_id !== user.id) {
          // Native-like feedback for received messages
          messagingBridge.hapticFeedback('medium')
          messagingBridge.playSound('received')
          setTimeout(() => markMessagesAsRead(), 1000)
        }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          console.log('[useMessages] Received UPDATE event:', payload)
          const updatedMessage = payload.new as Message
          
          setMessageState(prev => ({
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          }))
        }
      )
      .subscribe((status) => {
        console.log('[useMessages] Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('[useMessages] Successfully subscribed to real-time updates')
        } else if (status === 'CLOSED') {
          console.log('[useMessages] Subscription closed')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useMessages] Channel error - real-time updates may not work')
          // Fallback: reload messages if subscription fails
          setTimeout(() => loadMessages(), 1000)
        }
      })

    return () => {
      console.log('[useMessages] Cleaning up subscription for match:', matchId)
      subscription.unsubscribe()
    }
  }, [user, matchId, messageState.loading])

  const loadMessages = async () => {
    if (!user || !matchId) return

    try {
      setMessageState(prev => ({ ...prev, loading: true, error: null }))
      
      const messages = await messageService.getMessages(matchId)
      
      setMessageState(prev => ({
        ...prev,
        messages,
        loading: false
      }))

      // Auto-mark messages as read after successful load
      setTimeout(() => {
        markMessagesAsRead()
      }, 800)
    } catch (error: any) {
      console.error('Load messages error:', error)
      setMessageState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load messages'
      }))
    }
  }

  const sendMessage = async (content: string): Promise<boolean> => {
    if (!user || !matchId || !content.trim()) {
      return false
    }

    try {
      setMessageState(prev => ({ ...prev, sending: true, error: null }))
      
      const serverMessage = await messageService.sendMessage(matchId, content)
      
      // Optimistically add the message to state immediately
      // Real-time will handle duplicates with the exists check in line 66
      if (serverMessage) {
        setMessageState(prev => {
          // Check if message already exists (in case real-time was super fast)
          const exists = prev.messages.find(msg => msg.id === serverMessage.id)
          if (exists) {
            return { ...prev, sending: false }
          }
          
          return {
            ...prev,
            messages: [...prev.messages, serverMessage],
            sending: false
          }
        })
        
        // Native-like feedback
        messagingBridge.hapticFeedback('light')
        messagingBridge.playSound('sent')
      } else {
        setMessageState(prev => ({ ...prev, sending: false }))
      }
      
      return true
    } catch (error: any) {
      console.error('Send message error:', error)
      setMessageState(prev => ({
        ...prev,
        sending: false,
        error: error.message || 'Failed to send message'
      }))
      return false
    }
  }

  const markMessagesAsRead = useCallback(async () => {
    if (!user || !matchId) return

    try {
      await messageService.markMessagesAsRead(matchId)
      
      // Update local messages to mark them as read
      setMessageState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.sender_id !== user.id && !msg.read_at
            ? { ...msg, read_at: new Date().toISOString() }
            : msg
        )
      }))

      // Trigger a global event to refresh conversations list
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', { 
          detail: { matchId } 
        }))
      }
    } catch (error) {
      console.error('Mark messages as read error:', error)
    }
  }, [user, matchId])

  const clearError = () => {
    setMessageState(prev => ({ ...prev, error: null }))
  }

  const getUnreadCount = (): number => {
    if (!user) return 0
    return messageState.messages.filter(
      msg => msg.sender_id !== user.id && !msg.read_at
    ).length
  }

  const getLastMessage = (): Message | null => {
    if (messageState.messages.length === 0) return null
    return messageState.messages[messageState.messages.length - 1]
  }

  return {
    // State
    messages: messageState.messages,
    loading: messageState.loading,
    error: messageState.error,
    sending: messageState.sending,
    
    // Actions
    sendMessage,
    loadMessages,
    markMessagesAsRead,
    clearError,
    
    // Computed values
    unreadCount: getUnreadCount(),
    lastMessage: getLastMessage(),
    hasMessages: messageState.messages.length > 0
  }
} 