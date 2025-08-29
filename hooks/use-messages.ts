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
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  
  // Remove all polling - real-time only!

  // Load messages on mount and when matchId changes
  useEffect(() => {
    if (user && matchId) {
      loadMessages()
    }
  }, [user, matchId])

  // Enhanced real-time subscription with better error handling and logging
  useEffect(() => {
    if (!user || !matchId) {
      return
    }

    console.log('[useMessages] Setting up real-time subscription for match:', matchId)
    
    // Create a unique channel name to avoid conflicts
    const channelName = `messages:${matchId}:${user.id}`
    
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          console.log('[useMessages] New message received')
          const newMessage = payload.new as Message

          setMessageState(prev => {
            // If server message already present, skip
            const exists = prev.messages.some(msg => msg.id === newMessage.id)
            if (exists) return prev

            // If a temp optimistic message matches (same sender/content), replace it
            const tempIndex = prev.messages.findIndex(msg =>
              typeof msg.id === 'string' && (msg.id as unknown as string).startsWith('temp-') &&
              msg.sender_id === newMessage.sender_id &&
              msg.content === newMessage.content
            )
            if (tempIndex !== -1) {
              const nextMessages = [...prev.messages]
              nextMessages[tempIndex] = newMessage
              return { ...prev, messages: nextMessages }
            }

            // Otherwise append
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
          console.log('[useMessages] Message updated')
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
          setRealtimeConnected(true)
        } else if (status === 'CLOSED') {
          console.log('[useMessages] Subscription closed')
          setRealtimeConnected(false)
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('[useMessages] Channel error - real-time may not work')
          setRealtimeConnected(false)
        } else if (status === 'TIMED_OUT') {
          console.warn('[useMessages] Subscription timed out')
          setRealtimeConnected(false)
        }
      })

    return () => {
      console.log('[useMessages] Cleaning up subscription for match:', matchId)
      subscription.unsubscribe()
    }
  }, [user, matchId]) // Removed messageState.loading to prevent unnecessary re-subscriptions

  // Fallback polling when real-time is not connected
  useEffect(() => {
    if (realtimeConnected || !user || !matchId) return
    
    // Poll every 5 seconds only if real-time is disconnected
    const pollInterval = setInterval(() => {
      console.log('[useMessages] Polling for new messages (real-time disconnected)')
      // Directly fetch messages without using loadMessages to avoid dependency issues
      messageService.getMessages(matchId).then(messages => {
        setMessageState(prev => ({
          ...prev,
          messages
        }))
      }).catch(error => {
        console.error('[useMessages] Polling error:', error)
      })
    }, 5000)

    return () => clearInterval(pollInterval)
  }, [realtimeConnected, matchId, user])

  const loadMessages = async () => {
    if (!user || !matchId) return

    try {
      setMessageState(prev => ({ ...prev, loading: true, error: null }))
      
      // Fetch only the most recent 50 messages for fast initial render
      const messages = await messageService.getMessages(matchId, { limit: 50 })
      
      setMessageState(prev => ({
        ...prev,
        messages,
        loading: false
      }))

      // Auto-mark messages as read after successful load (non-blocking)
      if (messages.length > 0) {
        requestAnimationFrame(() => {
          markMessagesAsRead()
        })
      }
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

      // Create a temp optimistic message
      const tempId = `temp-${Date.now()}`
      const tempMessage: Message = {
        id: tempId as any,
        match_id: matchId,
        sender_id: user.id,
        content: content.trim(),
        is_highlighted: false,
        created_at: new Date().toISOString(),
      }

      // Add optimistic message immediately
      setMessageState(prev => ({
        ...prev,
        messages: [...prev.messages, tempMessage]
      }))

      // Fire-and-wait for server persistence
      const serverMessage = await messageService.sendMessage(matchId, content)

      // Reconcile robustly: remove temp and any duplicate server id, then append server message
      setMessageState(prev => {
        const withoutTempAndDup = prev.messages.filter(m => m.id !== tempId && m.id !== (serverMessage as any).id)
        return {
          ...prev,
          sending: false,
          messages: [...withoutTempAndDup, serverMessage]
        }
      })

      // Native-like feedback
      messagingBridge.hapticFeedback('light')
      messagingBridge.playSound('sent')
      
      return true
    } catch (error: any) {
      console.error('Send message error:', error)
      setMessageState(prev => ({
        ...prev,
        sending: false,
        error: error.message || 'Failed to send message'
      }))
      // Remove temp message if present
      setMessageState(prev => ({
        ...prev,
        messages: prev.messages.filter(m => typeof m.id === 'string' && (m.id as unknown as string).startsWith('temp-') === false)
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