'use client'
export const dynamic = 'force-dynamic';
import Header from "@/components/header"
import Hero from "@/components/hero"
import SignupSection from "@/components/signup-section"
import Features from "@/components/features"
import HowItWorks from "@/components/how-it-works"
// import Testimonials from "@/components/testimonials" // This import will be removed
import MobileApps from "@/components/mobile-apps"
import InspirationQuote from "@/components/inspiration-quote"
import Faq from "@/components/faq"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <Header />
      <Hero />
      <SignupSection />
      <Features />
      <HowItWorks />
      {/* <Testimonials /> */} {/* This component usage will be removed */}
      <MobileApps />
      <InspirationQuote />
      <Faq />
      <Footer />
    </main>
  )
}
