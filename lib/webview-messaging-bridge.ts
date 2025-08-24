/**
 * WebView Messaging Bridge for Native-like Experience
 * Provides seamless integration between web app and React Native WebView
 */

interface WebViewBridge {
  postMessage: (message: string) => void
}

declare global {
  interface Window {
    ReactNativeWebView?: WebViewBridge
  }
}

export class MessagingBridge {
  private static instance: MessagingBridge
  private audioContext?: AudioContext
  private isNativeApp: boolean = false

  private constructor() {
    this.isNativeApp = typeof window !== 'undefined' && !!window.ReactNativeWebView
    if (typeof window !== 'undefined') {
      this.initializeAudio()
    }
  }

  static getInstance(): MessagingBridge {
    if (!MessagingBridge.instance) {
      MessagingBridge.instance = new MessagingBridge()
    }
    return MessagingBridge.instance
  }

  private initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.warn('[MessagingBridge] Audio context initialization failed:', error)
    }
  }

  /**
   * Trigger haptic feedback on mobile devices
   */
  hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
    if (!this.isNativeApp) return

    try {
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'haptic',
        style: type
      }))
    } catch (error) {
      console.warn('[MessagingBridge] Haptic feedback failed:', error)
    }
  }

  /**
   * Play native-like sound effects
   */
  playSound(type: 'sent' | 'received' | 'error' = 'sent') {
    if (!this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Different sounds for different events
      switch (type) {
        case 'sent':
          oscillator.frequency.value = 800
          gainNode.gain.value = 0.05
          oscillator.start()
          oscillator.stop(this.audioContext.currentTime + 0.05)
          break
        case 'received':
          oscillator.frequency.value = 600
          gainNode.gain.value = 0.03
          oscillator.start()
          oscillator.stop(this.audioContext.currentTime + 0.08)
          break
        case 'error':
          oscillator.frequency.value = 300
          gainNode.gain.value = 0.04
          oscillator.start()
          oscillator.stop(this.audioContext.currentTime + 0.1)
          break
      }
    } catch (error) {
      console.warn('[MessagingBridge] Sound playback failed:', error)
    }
  }

  /**
   * Request keyboard to show/hide
   */
  toggleKeyboard(show: boolean) {
    if (!this.isNativeApp) return

    try {
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'keyboard',
        action: show ? 'show' : 'hide'
      }))
    } catch (error) {
      console.warn('[MessagingBridge] Keyboard toggle failed:', error)
    }
  }

  /**
   * Notify native app about scroll position for dynamic header
   */
  updateScrollPosition(position: number, maxScroll: number) {
    if (!this.isNativeApp) return

    try {
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'scroll',
        position,
        maxScroll
      }))
    } catch (error) {
      console.warn('[MessagingBridge] Scroll update failed:', error)
    }
  }

  /**
   * Request native app to save image/file
   */
  saveMedia(url: string, filename: string) {
    if (!this.isNativeApp) return

    try {
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'save_media',
        url,
        filename
      }))
    } catch (error) {
      console.warn('[MessagingBridge] Media save failed:', error)
    }
  }

  /**
   * Share content via native share sheet
   */
  share(text: string, url?: string) {
    // Try native share first
    if (navigator.share) {
      navigator.share({
        text,
        url
      }).catch(error => {
        console.warn('[MessagingBridge] Native share failed:', error)
      })
    } else if (this.isNativeApp) {
      // Fallback to WebView bridge
      try {
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'share',
          text,
          url
        }))
      } catch (error) {
        console.warn('[MessagingBridge] Bridge share failed:', error)
      }
    }
  }

  /**
   * Check if running in native app
   */
  get isNative(): boolean {
    return this.isNativeApp
  }

  /**
   * Smooth scroll with native-like physics
   */
  smoothScrollTo(element: HTMLElement, options?: { behavior?: 'smooth' | 'instant', block?: 'start' | 'center' | 'end' }) {
    element.scrollIntoView({
      behavior: options?.behavior || 'smooth',
      block: options?.block || 'end'
    })
  }

  /**
   * Vibrate device (fallback to Vibration API if available)
   */
  vibrate(pattern: number | number[] = 10) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    } else {
      this.hapticFeedback('light')
    }
  }
}

export const messagingBridge = MessagingBridge.getInstance()
