import { useState, useEffect, useCallback, useRef } from 'react'
import { messageService, Message } from '@/lib/data-service'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/components/auth-provider'

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
  
  // Presence & typing state
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const [isOtherOnline, setIsOtherOnline] = useState(false)
  const channelRef = useRef<any>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
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

  // Enhanced real-time subscription with presence & typing
  useEffect(() => {
    if (!user || !matchId || messageState.loading) {
      return
    }

    console.log('[useMessages] Setting up real-time subscription for match:', matchId)
    
    const channel = supabase
      .channel(`messages_${matchId}`, {
        config: {
          broadcast: { ack: true },
          presence: { key: user.id }
        }
      })
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

          // Haptic feedback on receive (mobile bridge)
          try {
            if (typeof window !== 'undefined' && newMessage.sender_id !== user.id) {
              ;(window as any)?.ReactNativeWebView?.postMessage?.(JSON.stringify({
                type: 'haptic',
                style: 'notification'
              }))
            }
          } catch {}
          
          // Mark as read if from other user
          if (newMessage.sender_id !== user.id) {
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
      // Typing indicator via broadcast
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const fromUserId = (payload as any)?.userId
        if (fromUserId && fromUserId !== user.id) {
          setIsOtherTyping(true)
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 1600)
        }
      })
      // Presence sync
      .on('presence', { event: 'sync' }, () => {
        try {
          const state = (channel as any).presenceState?.() as Record<string, unknown>
          const others = Object.keys(state || {}).filter((uid) => uid !== user.id)
          setIsOtherOnline(others.length > 0)
        } catch (e) {
          console.warn('[useMessages] presence sync error', e)
        }
      })
      .subscribe((status) => {
        console.log('[useMessages] Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('[useMessages] Successfully subscribed to real-time updates')
          // Track own presence
          try {
            ;(channel as any).track?.({ userId: user.id, matchId })
          } catch (e) {
            console.warn('[useMessages] presence track error', e)
          }
        } else if (status === 'CLOSED') {
          console.log('[useMessages] Subscription closed')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useMessages] Channel error - real-time updates may not work')
          // Fallback: reload messages if subscription fails
          setTimeout(() => loadMessages(), 1000)
        }
      })

    channelRef.current = channel

    return () => {
      console.log('[useMessages] Cleaning up subscription for match:', matchId)
      try { (channel as any).unsubscribe?.() } catch {}
      channelRef.current = null
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      setIsOtherTyping(false)
      setIsOtherOnline(false)
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

  // Send typing indicator (debounced in caller)
  const sendTyping = useCallback(() => {
    try {
      channelRef.current?.send?.({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user?.id, at: Date.now() }
      })
    } catch {}
  }, [user?.id])

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
    isOtherTyping,
    isOtherOnline,
    
    // Actions
    sendMessage,
    loadMessages,
    markMessagesAsRead,
    sendTyping,
    clearError,
    
    // Computed values
    unreadCount: getUnreadCount(),
    lastMessage: getLastMessage(),
    hasMessages: messageState.messages.length > 0
  }
} 