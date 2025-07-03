"use client"

import { Button } from "@/components/ui/button"
import { Heart, Instagram, Facebook } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useFooterAnalytics } from "@/hooks/use-analytics"

export default function Footer() {
  const router = useRouter()
  const pathname = usePathname()
  const { trackFooterButtonClick, trackFooterLinkClick, trackSocialMediaClick } = useFooterAnalytics()

  const handleStartJourney = () => {
    // Track the button click with additional context
    trackFooterButtonClick("Start Your Sacred Journey", {
      current_page: pathname,
      action_type: pathname === "/" ? "scroll_to_signup" : "navigate_to_signup",
    })

    // If we're on the home page, scroll to signup
    if (pathname === "/") {
      const signupForm = document.getElementById("signup")
      if (signupForm) {
        signupForm.scrollIntoView({ behavior: "smooth" })
      }
    } else {
      // If we're on any other page, navigate to home page with signup section
      router.push("/#signup")
    }
  }

  const handleLinkClick = (linkName: string, linkUrl: string) => {
    trackFooterLinkClick(linkName, linkUrl)
  }

  const handleSocialClick = (platform: string) => {
    trackSocialMediaClick(platform)
  }

  return (
    <footer className="border-t bg-gradient-to-b from-background/80 to-primary/5 backdrop-blur-sm">
      <div className="container px-4 md:px-6 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-6">
            <div className="flex items-center">
              <Image src="/logo.png" alt="DharmaSaathi Logo" width={120} height={40} className="rounded-lg" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Connecting spiritual souls on their sacred journey to find true partnership based on shared dharma and
              conscious living.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://www.instagram.com/dharmasaathi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={() => handleSocialClick("Instagram")}
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link
                href="https://www.facebook.com/share/16Zi4J9zrp/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={() => handleSocialClick("Facebook")}
              >
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => handleLinkClick("About Our Mission", "/about")}
                >
                  About Our Mission
                </Link>
              </li>
              <li>
                <Link
                  href="/#how-it-works"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => handleLinkClick("How It Works", "/#how-it-works")}
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/community-guidelines"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => handleLinkClick("Community Guidelines", "/community-guidelines")}
                >
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Legal & Support</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => handleLinkClick("Privacy Policy", "/privacy-policy")}
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => handleLinkClick("Terms of Service", "/terms-of-service")}
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/cookie-policy"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => handleLinkClick("Cookie Policy", "/cookie-policy")}
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => handleLinkClick("Contact Support", "/contact")}
                >
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Begin Your Journey</h3>
            <p className="text-sm text-muted-foreground">
              Ready to find your spiritual partner? Join thousands of conscious souls already on their path.
            </p>
            <Button
              onClick={handleStartJourney}
              className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Your Sacred Journey
            </Button>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} DharmaSaathi. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center">
            Built with <Heart className="h-4 w-4 mx-1 text-primary" /> in Ahmedabad, India
          </p>
        </div>
      </div>
    </footer>
  )
}
