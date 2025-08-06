import * as Linking from 'expo-linking';

export class LinkingService {
  private static deepLinkHandler: ((url: string) => void) | null = null;

  /**
   * Initialize deep linking service
   */
  static initialize(handler: (url: string) => void): void {
    this.deepLinkHandler = handler;
    
    // Listen for incoming links when app is already running
    Linking.addEventListener('url', this.handleIncomingLink);
  }

  /**
   * Handle incoming deep links
   */
  private static handleIncomingLink = (event: { url: string }) => {
    console.log('Incoming link:', event.url);
    
    if (this.deepLinkHandler && this.isValidDharmaSaathiUrl(event.url)) {
      this.deepLinkHandler(event.url);
    }
  };

  /**
   * Check if URL is a valid DharmaSaathi URL
   */
  static isValidDharmaSaathiUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const validHosts = [
        'dharmasaathi.com',
        'www.dharmasaathi.com',
        '192.168.29.199', // Local development IP
        'localhost',      // Local development
        '127.0.0.1'      // Local development
      ];
      
      return validHosts.includes(urlObj.hostname);
    } catch (error) {
      // Also check for custom scheme
      return url.startsWith('dharmasaathi://');
    }
  }

  /**
   * Check if URL should be loaded in WebView or external browser
   */
  static shouldLoadInWebView(url: string): boolean {
    // Always load DharmaSaathi URLs in WebView
    if (this.isValidDharmaSaathiUrl(url)) {
      return true;
    }

    // Allow payment URLs to load in WebView
    const paymentDomains = [
      'razorpay.com',
      'api.razorpay.com',
      'checkout.razorpay.com'
    ];

    try {
      const urlObj = new URL(url);
      return paymentDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Open URL in external browser
   */
  static async openExternalUrl(url: string): Promise<void> {
    try {
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error('Cannot open URL:', url);
      }
    } catch (error) {
      console.error('Failed to open external URL:', error);
    }
  }

  /**
   * Create deep link for sharing
   */
  static createShareLink(path: string): string {
    return `https://dharmasaathi.com${path}`;
  }

  /**
   * Parse deep link parameters
   */
  static parseDeepLink(url: string): Record<string, string> {
    try {
      const urlObj = new URL(url);
      const params: Record<string, string> = {};
      
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      
      return params;
    } catch (error) {
      console.error('Failed to parse deep link:', error);
      return {};
    }
  }

  /**
   * Handle specific deep link routes
   */
  static handleDeepLinkRoute(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Map custom routes if needed
      const routeMap: Record<string, string> = {
        '/profile': '/dashboard/profile',
        '/matches': '/dashboard/matches', 
        '/messages': '/dashboard/messages',
        '/settings': '/dashboard/settings'
      };

      const mappedRoute = routeMap[pathname];
      if (mappedRoute) {
        urlObj.pathname = mappedRoute;
        return urlObj.toString();
      }

      return url;
    } catch (error) {
      console.error('Failed to handle deep link route:', error);
      return url;
    }
  }

  /**
   * Cleanup listeners
   */
  static cleanup(): void {
    // Note: expo-linking doesn't have removeAllListeners, 
    // listeners are automatically cleaned up when app unmounts
    this.deepLinkHandler = null;
  }
}
