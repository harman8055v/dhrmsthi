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

export const metadata: Metadata = {
  title: "DharmaSaathi - Where Spiritual Seekers Find Love",
  description:
    "A global spiritual matrimony platform connecting like-minded souls on their journey from drama to dharma.",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
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
