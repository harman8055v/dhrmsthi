import { WebView } from 'react-native-webview';
import { Platform } from 'react-native';

interface WebViewMessage {
  type: string;
  payload: any;
}

export class WebViewService {
  
  /**
   * Send a message from React Native to WebView
   */
  static sendMessageToWebView(webView: WebView | null, message: WebViewMessage): void {
    if (!webView) return;
    
    const messageScript = `
      if (window.ReactNativeWebView && window.ReactNativeWebView.onMessage) {
        window.postMessage(${JSON.stringify(message)}, '*');
      }
    `;
    
    webView.injectJavaScript(messageScript);
  }

  /**
   * Get JavaScript code to inject into WebView for native integration
   */
  static getInjectedJavaScript(): string {
    return `
      (function() {
        // Create native bridge object
        window.NativeBridge = {
          // Camera functionality
          openCamera: function(options = {}) {
            const message = {
              type: 'camera',
              payload: {
                action: 'open',
                options: options
              }
            };
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          },
          
          // Image picker functionality
          openImagePicker: function(options = {}) {
            const message = {
              type: 'camera',
              payload: {
                action: 'picker',
                options: options
              }
            };
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          },
          
          // Send local notification
          sendNotification: function(title, body, data = {}) {
            const message = {
              type: 'notification',
              payload: { title, body, data }
            };
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          },
          
          // Share functionality
          share: function(subject, body) {
            const message = {
              type: 'share',
              payload: { subject, body }
            };
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          },
          
          // Get device info
          getDeviceInfo: function() {
            return {
              platform: '${Platform.OS}',
              isNativeApp: true,
              version: '1.0.0'
            };
          }
        };
        
        // Listen for camera results
        window.addEventListener('message', function(event) {
          if (event.data.type === 'cameraResult') {
            // Trigger custom event for camera results
            const customEvent = new CustomEvent('nativeCameraResult', {
              detail: event.data.payload
            });
            window.dispatchEvent(customEvent);
          }
        });
        
        // Add visual indicator that native bridge is loaded
        console.log('DharmaSaathi Native Bridge loaded successfully');
        
        // Optional: Add a small visual indicator
        if (document.body) {
          const indicator = document.createElement('div');
          indicator.style.position = 'fixed';
          indicator.style.top = '0';
          indicator.style.right = '0';
          indicator.style.width = '4px';
          indicator.style.height = '4px';
          indicator.style.backgroundColor = '#4CAF50';
          indicator.style.zIndex = '9999';
          indicator.style.opacity = '0.7';
          indicator.title = 'Native App Mode';
          document.body.appendChild(indicator);
          
          // Remove indicator after 3 seconds
          setTimeout(() => {
            if (indicator.parentNode) {
              indicator.parentNode.removeChild(indicator);
            }
          }, 3000);
        }
        
        true; // Required for injection
      })();
    `;
  }

  /**
   * Check if URL should be handled by WebView
   */
  static shouldHandleUrl(url: string): boolean {
    const allowedDomains = [
      'dharmasaathi.com',
      'www.dharmasaathi.com',
      'razorpay.com',
      'api.razorpay.com',
      '192.168.29.199', // Local development IP
      'localhost',      // Local development
      '127.0.0.1'      // Local development
    ];
    
    try {
      const urlObj = new URL(url);
      return allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle WebView navigation
   */
  static handleNavigation(url: string): boolean {
    // Allow DharmaSaathi domain and payment URLs
    if (this.shouldHandleUrl(url)) {
      return true;
    }
    
    // Block external URLs
    console.log('Blocked external URL:', url);
    return false;
  }
}
