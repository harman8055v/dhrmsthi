"use client"

import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import AuthDialog from "./auth-dialog"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"signup" | "login">("login")
  const router = useRouter()
  const pathname = usePathname()

  const scrollToSection = (sectionId: string) => {
    // If we're on the home page, scroll to the section
    if (pathname === "/") {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    } else {
      // If we're on any other page, navigate to home page with the section
      router.push(`/#${sectionId}`)
    }
    setIsMenuOpen(false)
  }

  const handleLogoClick = () => {
    if (pathname === "/") {
      // If on homepage, scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      // If on other pages, navigate to homepage
      router.push("/")
    }
  }

  const openAuth = (mode: "signup" | "login") => {
    setAuthMode(mode)
    setIsAuthOpen(true)
    setIsMenuOpen(false)
  }

  return (
    <>
      <header className="fixed top-0 w-full z-50 glass-effect border-b">
        <div className="container px-4 md:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center group cursor-pointer" onClick={handleLogoClick}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                <div className="relative bg-white p-2 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300 transform group-hover:scale-105">
                  <Image src="/logo.png" alt="DharmaSaathi Logo" width={120} height={40} className="rounded-md" />
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection("features")}
                className="text-sm font-medium hover:text-primary transition-colors hover:scale-105 transform duration-200"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-sm font-medium hover:text-primary transition-colors hover:scale-105 transform duration-200"
              >
                How It Works
              </button>
              <Link
                href="/contact"
                className="text-sm font-medium hover:text-primary transition-colors hover:scale-105 transform duration-200"
              >
                Support
              </Link>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-sm font-medium hover:text-primary transition-colors hover:scale-105 transform duration-200"
              >
                FAQ
              </button>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => openAuth("login")}
                className="hover:bg-brand-50 hover:text-brand-600 transition-all duration-200 transform hover:scale-105"
              >
                Login
              </Button>
              <Button
                onClick={() => scrollToSection("signup")}
                className="bg-gradient-to-r from-brand-600 to-primary hover:from-brand-700 hover:to-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                Join Now
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-brand-50 transition-colors duration-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t bg-white/95 backdrop-blur-sm rounded-b-lg">
              <nav className="flex flex-col space-y-4">
                <button
                  onClick={() => scrollToSection("features")}
                  className="text-sm font-medium hover:text-primary transition-colors text-left px-2 py-1 rounded hover:bg-brand-50"
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="text-sm font-medium hover:text-primary transition-colors text-left px-2 py-1 rounded hover:bg-brand-50"
                >
                  How It Works
                </button>
                <Link
                  href="/contact"
                  className="text-sm font-medium hover:text-primary transition-colors text-left px-2 py-1 rounded hover:bg-brand-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Support
                </Link>
                <button
                  onClick={() => scrollToSection("faq")}
                  className="text-sm font-medium hover:text-primary transition-colors text-left px-2 py-1 rounded hover:bg-brand-50"
                >
                  FAQ
                </button>
                <div className="flex flex-col space-y-2 pt-4 border-t">
                  <Button
                    variant="ghost"
                    onClick={() => openAuth("login")}
                    className="justify-start hover:bg-brand-50 hover:text-brand-600"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => scrollToSection("signup")}
                    className="bg-gradient-to-r from-brand-600 to-primary hover:from-brand-700 hover:to-primary/90 text-white"
                  >
                    Join Now
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Auth Dialog */}
      <Suspense fallback={null}>
        <AuthDialog
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          defaultMode={authMode}
        />
      </Suspense>
    </>
  )
}
