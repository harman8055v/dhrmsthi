import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/toast-manager"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "@/components/ui/sonner"
import type { Metadata } from "next"
import { Mona_Sans as FontSans } from "next/font/google"
import { cn } from "@/lib/utils"

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
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <ToastProvider>
              {children}
              <Toaster position="top-right" richColors />
            </ToastProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
