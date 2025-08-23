import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/toast-manager"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/components/auth-provider"
import { ReactQueryProvider } from "@/components/react-query-provider"
import { WebViewNotificationProvider } from "@/components/webview-notification-provider"
import NativeHeader from "@/components/native-header"
import NativeBridge from "@/app/native-bridge"
import NativeBridgeEnhanced from "@/components/native-bridge-enhanced"
import type { Metadata } from "next"
import { Mona_Sans as FontSans } from "next/font/google"
import { cn } from "@/lib/utils"
import Script from "next/script"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata = {
  title: "DharmaSaathi: India's #1 Spiritual Matrimony & Matchmaking Platform",
  description: "Discover your dharmic life partner on DharmaSaathi, India’s leading spiritual matrimony & conscious matchmaking platform. Join free to meet like-minded seekers.",
  metadataBase: new URL("https://dharmasaathi.com"),
  openGraph: {
    title: "DharmaSaathi: India's #1 Spiritual Matrimony & Matchmaking Platform",
    description: "Discover your dharmic life partner on DharmaSaathi, India’s leading spiritual matrimony & conscious matchmaking platform. Join free to meet like-minded seekers.",
    url: "https://dharmasaathi.com/",
    siteName: "DharmaSaathi",
    images: [
      {
        url: "/thumbnail.jpg",
        width: 1200,
        height: 630,
        alt: "Join DharmaSaathi — From Drama to Dharma",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DharmaSaathi: India's #1 Spiritual Matrimony & Matchmaking Platform",
    description: "Discover your dharmic life partner on DharmaSaathi, India’s leading spiritual matrimony & conscious matchmaking platform. Join free to meet like-minded seekers.",
    images: [
      {
        url: "/thumbnail.jpg",
        alt: "Join DharmaSaathi — From Drama to Dharma",
      },
    ],
    site: "@dharmasaathi"
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        {/* Meta Pixel Code */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1182084830078480');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img height="1" width="1" style={{display:'none'}}
            src="https://www.facebook.com/tr?id=1182084830078480&ev=PageView&noscript=1"
          />
        </noscript>
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var isNative = !!(window.ReactNativeWebView || window.isNativeApp);
              var onAppSubdomain = location.hostname === 'app.dharmasaathi.com';
              if (!isNative && onAppSubdomain) {
                var target = 'https://www.dharmasaathi.com';
                if (location.pathname && location.pathname !== '/') {
                  target += location.pathname;
                }
                if (location.search) target += location.search;
                if (location.hash) target += location.hash;
                location.replace(target);
              }
            } catch (e) {}
          })();
        `}} />
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <ToastProvider>
              <AuthProvider>
                <ReactQueryProvider>
                  <WebViewNotificationProvider
                    enableAnalytics={true}
                    enableMarketing={true}
                    enableDeepLinking={true}
                  >
                    <NativeHeader />
                    {/* Original bridge (kept for compatibility) */}
                    <NativeBridge />
                    {/* Enhanced bridge: informs native about auth state for direct registration */}
                    <NativeBridgeEnhanced />
                    {children}
                    <Toaster position="top-right" richColors />
                  </WebViewNotificationProvider>
                </ReactQueryProvider>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
