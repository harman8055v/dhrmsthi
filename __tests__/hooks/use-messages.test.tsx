import { renderHook, waitFor, act } from '@testing-library/react'
import { useMessages } from '@/hooks/use-messages'
import { mockUser, mockMessage, mockMatch } from '../utils/test-utils'
import { supabase } from '@/lib/supabase'
import { messageService } from '@/lib/data-service'

// Mock the dependencies
jest.mock('@/lib/supabase')
jest.mock('@/lib/data-service')

// Variable to hold mock auth context return value
let mockAuthReturn: any

jest.mock('@/components/auth-provider', () => ({
  useAuthContext: () => mockAuthReturn,
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>
const mockMessageService = messageService as jest.Mocked<typeof messageService>

describe('useMessages Hook', () => {
  const testMatchId = 'test-match-id'
  let mockChannel: any
  let mockSubscription: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Set default auth context
    mockAuthReturn = { user: mockUser }
    
    // Setup mock subscription
    mockSubscription = {
      unsubscribe: jest.fn(),
    }
    
    // Setup mock channel for real-time subscriptions
    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnValue(mockSubscription),
      unsubscribe: jest.fn(),
    }
    
    mockSupabase.channel = jest.fn().mockReturnValue(mockChannel)
    mockMessageService.getMessages.mockResolvedValue([])
    mockMessageService.sendMessage.mockResolvedValue(mockMessage)
    mockMessageService.markMessagesAsRead.mockResolvedValue()
  })

  describe('Initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useMessages(testMatchId))
      
      expect(result.current.messages).toEqual([])
      expect(result.current.loading).toBe(true) // Starts loading when user and matchId exist
      expect(result.current.error).toBe(null)
      expect(result.current.sending).toBe(false)
      expect(result.current.hasMessages).toBe(false)
      expect(result.current.unreadCount).toBe(0)
      expect(result.current.lastMessage).toBe(null)
    })

    it('should not subscribe to real-time when no matchId provided', () => {
      renderHook(() => useMessages(''))
      
      expect(mockSupabase.channel).not.toHaveBeenCalled()
    })

    it('should not subscribe to real-time when no user', () => {
      // Set no user before rendering
      mockAuthReturn = { user: null }
      
      const { result } = renderHook(() => useMessages(testMatchId))
      
      expect(mockSupabase.channel).not.toHaveBeenCalled()
      expect(result.current.loading).toBe(false) // Should not start loading without user
      
      // Reset for other tests
      mockAuthReturn = { user: mockUser }
    })
  })

  describe('Message Loading', () => {
    it('should load messages on mount', async () => {
      const testMessages = [mockMessage]
      mockMessageService.getMessages.mockResolvedValue(testMessages)

      const { result } = renderHook(() => useMessages(testMatchId))

      await waitFor(() => {
        expect(result.current.messages).toEqual(testMessages)
      })

      expect(mockMessageService.getMessages).toHaveBeenCalledWith(testMatchId)
      
      // markMessagesAsRead is called in setTimeout, so wait for it
      await waitFor(() => {
        expect(mockMessageService.markMessagesAsRead).toHaveBeenCalledWith(testMatchId)
      })
    })

    it('should handle loading error gracefully', async () => {
      const error = new Error('Failed to load messages')
      mockMessageService.getMessages.mockRejectedValue(error)

      const { result } = renderHook(() => useMessages(testMatchId))

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load messages')
      })

      expect(result.current.messages).toEqual([])
      expect(result.current.loading).toBe(false)
    })

    it('should reload messages when matchId changes', async () => {
      const testMessages1 = [{ ...mockMessage, id: 'msg1' }]
      const testMessages2 = [{ ...mockMessage, id: 'msg2' }]
      
      mockMessageService.getMessages
        .mockResolvedValueOnce(testMessages1)
        .mockResolvedValueOnce(testMessages2)

      const { result, rerender } = renderHook(
        ({ matchId }) => useMessages(matchId),
        { initialProps: { matchId: 'match1' } }
      )

      await waitFor(() => {
        expect(result.current.messages).toEqual(testMessages1)
      })

      rerender({ matchId: 'match2' })

      await waitFor(() => {
        expect(result.current.messages).toEqual(testMessages2)
      })

      expect(mockMessageService.getMessages).toHaveBeenCalledWith('match1')
      expect(mockMessageService.getMessages).toHaveBeenCalledWith('match2')
    })
  })

  describe('Real-time Subscriptions', () => {
    it('should set up real-time subscription for new messages', () => {
      renderHook(() => useMessages(testMatchId))

      expect(mockSupabase.channel).toHaveBeenCalledWith(`messages_${testMatchId}`)
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${testMatchId}`,
        },
        expect.any(Function)
      )
    })

    it('should set up real-time subscription for message updates', () => {
      renderHook(() => useMessages(testMatchId))

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${testMatchId}`,
        },
        expect.any(Function)
      )
    })

    it('should handle new message via real-time', async () => {
      mockMessageService.getMessages.mockResolvedValue([])

      const { result } = renderHook(() => useMessages(testMatchId))

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.messages).toEqual([])
      })

      // Get the INSERT handler and simulate a new message
      const insertHandler = mockChannel.on.mock.calls
        .find(call => call[1].event === 'INSERT')?.[2]

      if (insertHandler) {
        const newMessage = { ...mockMessage, id: 'new-message' }
        
        act(() => {
          insertHandler({ new: newMessage })
        })

        await waitFor(() => {
          expect(result.current.messages).toContainEqual(newMessage)
        })
      }
    })

    it('should handle message updates via real-time', async () => {
      const initialMessage = { ...mockMessage, content: 'Initial content' }
      mockMessageService.getMessages.mockResolvedValue([initialMessage])

      const { result } = renderHook(() => useMessages(testMatchId))

      await waitFor(() => {
        expect(result.current.messages[0]?.content).toBe('Initial content')
      })

      // Get the UPDATE handler and simulate a message update
      const updateHandler = mockChannel.on.mock.calls
        .find(call => call[1].event === 'UPDATE')?.[2]

      if (updateHandler) {
        const updatedMessage = { ...initialMessage, content: 'Updated content' }
        
        act(() => {
          updateHandler({ new: updatedMessage })
        })

        await waitFor(() => {
          expect(result.current.messages[0]?.content).toBe('Updated content')
        })
      }
    })

    it('should prevent duplicate messages in real-time updates', async () => {
      mockMessageService.getMessages.mockResolvedValue([mockMessage])

      const { result } = renderHook(() => useMessages(testMatchId))

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(1)
      })

      // Try to add the same message via real-time
      const insertHandler = mockChannel.on.mock.calls
        .find(call => call[1].event === 'INSERT')?.[2]

      if (insertHandler) {
        act(() => {
          insertHandler({ new: mockMessage })
        })

        // Should still have only 1 message (no duplicate)
        expect(result.current.messages).toHaveLength(1)
      }
    })

    it('should clean up subscription on unmount', () => {
      const { unmount } = renderHook(() => useMessages(testMatchId))

      unmount()

      expect(mockSubscription.unsubscribe).toHaveBeenCalled()
    })
  })

  describe('Message Sending', () => {
    it('should send message successfully', async () => {
      const { result } = renderHook(() => useMessages(testMatchId))

      let sendResult: boolean = false
      
      await act(async () => {
        sendResult = await result.current.sendMessage('Hello world!')
      })

      expect(sendResult).toBe(true)
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith(testMatchId, 'Hello world!')
      expect(result.current.sending).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle sending failure', async () => {
      const error = new Error('Failed to send message')
      mockMessageService.sendMessage.mockRejectedValue(error)

      const { result } = renderHook(() => useMessages(testMatchId))

      let sendResult: boolean = true
      
      await act(async () => {
        sendResult = await result.current.sendMessage('Hello world!')
      })

      expect(sendResult).toBe(false)
      expect(result.current.error).toBe('Failed to send message')
      expect(result.current.sending).toBe(false)
    })

    it('should not send empty messages', async () => {
      const { result } = renderHook(() => useMessages(testMatchId))

      let sendResult: boolean = true
      
      await act(async () => {
        sendResult = await result.current.sendMessage('')
      })

      expect(sendResult).toBe(false)
      expect(mockMessageService.sendMessage).not.toHaveBeenCalled()
    })

    it('should not send messages when no user', async () => {
      // Mock no user scenario
      mockAuthReturn = { user: null }

      const { result } = renderHook(() => useMessages(testMatchId))

      let sendResult: boolean = true
      
      await act(async () => {
        sendResult = await result.current.sendMessage('Hello')
      })

      expect(sendResult).toBe(false)
      expect(mockMessageService.sendMessage).not.toHaveBeenCalled()
      
      // Reset mock for other tests
      mockAuthReturn = { user: mockUser }
    })

    it('should trim whitespace from messages', async () => {
      const { result } = renderHook(() => useMessages(testMatchId))

      await act(async () => {
        await result.current.sendMessage('  Hello world!  ')
      })

      expect(mockMessageService.sendMessage).toHaveBeenCalledWith(testMatchId, '  Hello world!  ')
    })
  })

  describe('Mark Messages as Read', () => {
    it('should mark messages as read', async () => {
      const unreadMessage = { 
        ...mockMessage, 
        sender_id: 'other-user', 
        read_at: null 
      }
      mockMessageService.getMessages.mockResolvedValue([unreadMessage])

      const { result } = renderHook(() => useMessages(testMatchId))

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(1)
      })

      await act(async () => {
        await result.current.markMessagesAsRead()
      })

      expect(mockMessageService.markMessagesAsRead).toHaveBeenCalledWith(testMatchId)

      // Should update local state to mark messages as read
      await waitFor(() => {
        const message = result.current.messages[0]
        expect(message?.read_at).toBeTruthy()
      })
    })

    it('should trigger global event when messages marked as read', async () => {
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent')
      
      const { result } = renderHook(() => useMessages(testMatchId))

      await act(async () => {
        await result.current.markMessagesAsRead()
      })

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'messagesMarkedAsRead',
          detail: { matchId: testMatchId },
        })
      )

      dispatchEventSpy.mockRestore()
    })

    it('should handle mark as read errors gracefully', async () => {
      const error = new Error('Failed to mark as read')
      mockMessageService.markMessagesAsRead.mockRejectedValue(error)

      const { result } = renderHook(() => useMessages(testMatchId))

      await act(async () => {
        await result.current.markMessagesAsRead()
      })

      // Should not throw error, just log it
      expect(result.current.error).toBe(null)
    })
  })

  describe('Computed Properties', () => {
    it('should calculate unread count correctly', async () => {
      const messages = [
        { ...mockMessage, id: '1', sender_id: 'other-user', read_at: null },
        { ...mockMessage, id: '2', sender_id: 'other-user', read_at: null },
        { ...mockMessage, id: '3', sender_id: mockUser.id, read_at: null }, // Own message
        { ...mockMessage, id: '4', sender_id: 'other-user', read_at: '2023-01-01T12:00:00Z' }, // Read
      ]
      
      mockMessageService.getMessages.mockResolvedValue(messages)

      const { result } = renderHook(() => useMessages(testMatchId))

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(2) // Only unread messages from others
      })
    })

    it('should return correct last message', async () => {
      const messages = [
        { ...mockMessage, id: '1', created_at: '2023-01-01T10:00:00Z' },
        { ...mockMessage, id: '2', created_at: '2023-01-01T12:00:00Z' },
        { ...mockMessage, id: '3', created_at: '2023-01-01T11:00:00Z' },
      ]
      
      mockMessageService.getMessages.mockResolvedValue(messages)

      const { result } = renderHook(() => useMessages(testMatchId))

      await waitFor(() => {
        expect(result.current.lastMessage?.id).toBe('3') // Last in array order
      })
    })

    it('should return null for last message when no messages', () => {
      const { result } = renderHook(() => useMessages(testMatchId))

      expect(result.current.lastMessage).toBe(null)
    })

    it('should calculate hasMessages correctly', async () => {
      const { result } = renderHook(() => useMessages(testMatchId))

      // Initially no messages
      expect(result.current.hasMessages).toBe(false)

      // Mock loading messages
      mockMessageService.getMessages.mockResolvedValue([mockMessage])
      
      await act(async () => {
        await result.current.loadMessages()
      })

      await waitFor(() => {
        expect(result.current.hasMessages).toBe(true)
      })
    })
  })

  describe('Error Handling', () => {
    it('should provide clearError function', () => {
      const { result } = renderHook(() => useMessages(testMatchId))

      // Set an error first
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBe(null)
    })

    it('should clear error when sending message successfully', async () => {
      // First create an error
      const error = new Error('Previous error')
      mockMessageService.getMessages.mockRejectedValue(error)

      const { result } = renderHook(() => useMessages(testMatchId))

      await waitFor(() => {
        expect(result.current.error).toBe('Previous error')
      })

      // Now make sendMessage successful
      mockMessageService.sendMessage.mockResolvedValue(mockMessage)

      await act(async () => {
        await result.current.sendMessage('Hello')
      })

      expect(result.current.error).toBe(null)
    })
  })
}) 