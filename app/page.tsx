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

export const metadata = {
  title: "DharmaSaathi – #1 Spiritual Matrimony & Indian Matchmaking | Dharma, Sanatan, Shaadi, Marriage",
  description:
    "Find your soulmate on DharmaSaathi, India's leading spiritual matrimony and matchmaking platform. Discover dharma-based, Sanatan, and conscious matches. Trusted alternative to Shaadi.com, BharatMatrimony, and more.",
  keywords: [
    "matrimony", "spiritual matrimony", "dharma matrimony", "sanatan dharma", "shaadi", "shaadi.com", "indian matchmaking", "marriage", "hindu matrimony", "vedic marriage", "soulmate", "conscious relationships", "bharat matrimony", "elite matrimony", "community matrimony", "wedding", "kundali matching", "matchmaking", "find partner", "indian brides", "indian grooms", "marriage bureau", "marriage site", "best matrimony site", "spiritual partner", "sanatan marriage", "vedic shaadi", "hindu marriage", "shaadi india", "shaadi app", "marriage app", "spiritual shaadi", "dharma partner"
  ],
  metadataBase: new URL("https://dharmasaathi.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "DharmaSaathi – #1 Spiritual Matrimony & Indian Matchmaking | Dharma, Sanatan, Shaadi, Marriage",
    description:
      "Find your soulmate on DharmaSaathi, India's leading spiritual matrimony and matchmaking platform. Discover dharma-based, Sanatan, and conscious matches. Trusted alternative to Shaadi.com, BharatMatrimony, and more.",
    url: "https://dharmasaathi.com/",
    siteName: "DharmaSaathi",
    images: [
      {
        url: "/public/images/spiritual-couple.jpg",
        width: 1200,
        height: 630,
        alt: "DharmaSaathi – Spiritual Matchmaking",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DharmaSaathi – #1 Spiritual Matrimony & Indian Matchmaking | Dharma, Sanatan, Shaadi, Marriage",
    description:
      "Find your soulmate on DharmaSaathi, India's leading spiritual matrimony and matchmaking platform. Discover dharma-based, Sanatan, and conscious matches. Trusted alternative to Shaadi.com, BharatMatrimony, and more.",
    site: "@dharmasaathi",
    images: [
      {
        url: "/public/images/spiritual-couple.jpg",
        alt: "DharmaSaathi – Spiritual Matchmaking",
      },
    ],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

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
