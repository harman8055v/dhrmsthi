import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

export function useUnreadCount(enabled: boolean = true) {
  const { data: conversationsData } = useQuery({
    queryKey: ['conversations-unread-count'],
    queryFn: async () => {
      const response = await fetch('/api/messages/conversations', {
        credentials: 'include',
      })
      if (!response.ok) {
        if (response.status === 403) {
          // User doesn't have messaging access
          return { conversations: [] }
        }
        throw new Error('Failed to fetch conversations')
      }
      return response.json()
    },
    enabled: enabled, // Only run query when enabled
    refetchInterval: enabled ? 30000 : false, // Only refetch if enabled
    staleTime: 10000, // Data is fresh for 10 seconds
  })

  // Calculate total unread count from all conversations
  const totalUnreadCount = (conversationsData?.conversations || []).reduce(
    (total: number, conversation: any) => total + (conversation.unread_count || 0),
    0
  )

  return {
    totalUnreadCount,
    isLoading: !conversationsData,
  }
} 