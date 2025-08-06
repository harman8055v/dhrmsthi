"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Users, Compass, Star, ArrowRight, NotebookIcon as Lotus } from "lucide-react"

import Footer from "@/components/footer"
import { useRouter, usePathname } from "next/navigation"

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const router = useRouter()
  const pathname = usePathname()

  const handleStartJourney = () => {
    if (pathname === "/") {
      const signupForm = document.getElementById("signup")
      if (signupForm) {
        signupForm.scrollIntoView({ behavior: "smooth" })
      }
    } else {
      router.push("/#signup")
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 pt-14">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-rose-500/10" />
          <div className="container px-4 md:px-6 relative">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6">
                <Lotus className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-rose-600 bg-clip-text text-transparent">
                Our Sacred Mission
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Connecting spiritual souls on their journey to find divine partnership through conscious technology and
                sacred wisdom
              </p>
            </div>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-primary/5">
                <CardContent className="p-8 md:p-12">
                  <div className="text-center space-y-6">
                    <Heart className="h-12 w-12 text-primary mx-auto" />
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground">Bridging Hearts Through Dharma</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      At DharmaSaathi, we believe that true love transcends the physical realm and finds its foundation
                      in spiritual alignment. Our mission is to create a sacred space where conscious individuals can
                      connect with their divine counterpart, fostering relationships built on shared values, spiritual
                      growth, and mutual respect for the journey of awakening.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-primary/5">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Core Values</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                These sacred principles guide every aspect of our platform and community
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-rose-50/50">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full">
                    <Compass className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Authentic Connection</h3>
                  <p className="text-muted-foreground">
                    We foster genuine relationships based on truth, vulnerability, and authentic self-expression
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-primary/5">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full">
                    <Star className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Spiritual Growth</h3>
                  <p className="text-muted-foreground">
                    Supporting each individual's journey of self-discovery and conscious evolution
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-rose-50/50">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Sacred Community</h3>
                  <p className="text-muted-foreground">
                    Building a supportive ecosystem where spiritual seekers can thrive together
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Story</h2>
                <p className="text-xl text-muted-foreground">
                  Born from a vision of conscious connection in the digital age
                </p>
              </div>

              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p className="text-lg leading-relaxed">
                  DharmaSaathi was born from a simple yet profound realization: in our fast-paced, digitally-connected
                  world, spiritual seekers often struggle to find partners who truly understand their journey.
                  Traditional dating platforms focus on surface-level attractions, while spiritual communities often
                  lack the tools for meaningful romantic connection.
                </p>

                <p className="text-lg leading-relaxed">
                  Our founders, themselves on spiritual paths, recognized the need for a platform that honors both the
                  sacred nature of love and the practical realities of modern relationships. They envisioned a space
                  where dharma meets technology, where ancient wisdom guides modern connection.
                </p>

                <p className="text-lg leading-relaxed">
                  Today, DharmaSaathi serves thousands of conscious individuals worldwide, facilitating connections that
                  go beyond the superficial to touch the very essence of who we are. Every feature, every interaction,
                  every moment on our platform is designed with reverence for the sacred journey of finding one's
                  spiritual companion.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-primary/10 to-rose-500/10">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold">Ready to Begin Your Sacred Journey?</h2>
              <p className="text-xl text-muted-foreground">
                Join our community of conscious souls seeking divine partnership
              </p>
              {/* Simplified the button container for single button centering */}
              <div className="flex justify-center">
                <Button onClick={handleStartJourney} size="lg" className="bg-primary hover:bg-primary/90">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  )
}
