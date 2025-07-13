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
import { Suspense } from "react";
import Head from "next/head";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function JsonLd() {
  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "DharmaSaathi",
            "url": "https://dharmasaathi.com/",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://dharmasaathi.com/?q={search_term_string}",
              "query-input": "required name=search_term_string"
            },
            "description": "India's #1 spiritual matrimony and matchmaking platform. Find your soulmate, dharma partner, or Sanatan marriage match. Trusted alternative to Shaadi.com, BharatMatrimony, and more.",
            "sameAs": [
              "https://www.facebook.com/dharmasaathi",
              "https://twitter.com/dharmasaathi",
              "https://www.instagram.com/dharmasaathi/"
            ]
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "DharmaSaathi",
            "url": "https://dharmasaathi.com/",
            "logo": "https://dharmasaathi.com/logo.png",
            "sameAs": [
              "https://www.facebook.com/dharmasaathi",
              "https://twitter.com/dharmasaathi",
              "https://www.instagram.com/dharmasaathi/"
            ]
          })
        }}
      />
    </Head>
  );
}

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (user || profile)) {
      // Only redirect to dashboard if user is authenticated AND onboarded
      if (profile?.is_onboarded) {
        router.replace("/dashboard");
      }
    }
  }, [loading, user, profile, router]);
  return (
    <>
      <JsonLd />
      <main className="min-h-screen bg-gradient-to-b from-background to-background/80">
        <Header />
        <Hero />
        <Suspense fallback={null}>
          <SignupSection />
        </Suspense>
        <Features />
        <HowItWorks />
        {/* <Testimonials /> */} {/* This component usage will be removed */}
        <MobileApps />
        <InspirationQuote />
        <Faq />
        <Footer />
      </main>
    </>
  )
}
