"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Shield, Users, Star, AlertTriangle, CheckCircle } from "lucide-react"

import Footer from "@/components/footer"

export default function CommunityGuidelinesPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 pt-14">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-rose-500/10" />
          <div className="container px-4 md:px-6 relative">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-rose-600 bg-clip-text text-transparent">
                Community Guidelines
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Creating a sacred space for authentic connection and spiritual growth
              </p>
            </div>
          </div>
        </section>

        {/* Introduction */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-primary/5">
                <CardContent className="p-8 md:p-12">
                  <div className="text-center space-y-6">
                    <Heart className="h-12 w-12 text-primary mx-auto" />
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground">Our Sacred Community</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      DharmaSaathi is more than a dating platform—it's a sacred community where spiritual seekers come
                      together with respect, authenticity, and conscious intention. These guidelines help us maintain a
                      space that honors the divine in each person and supports genuine spiritual connection.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Core Principles */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-primary/5">
          <div className="container px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Core Principles</h2>
                <p className="text-xl text-muted-foreground">The foundation of our spiritual community</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Heart className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Authentic Expression</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Be genuine in your interactions. Share your true self, including your spiritual journey,
                      aspirations, and authentic personality. Authenticity creates the foundation for meaningful
                      connections.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Respectful Communication</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Treat every member with dignity and respect. Honor different spiritual paths, beliefs, and
                      practices. Communicate with kindness, even when declining connections.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Star className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Conscious Intention</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Approach connections with mindful intention. Seek meaningful relationships based on spiritual
                      compatibility and shared values rather than superficial attractions.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Community Support</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Support fellow community members on their journey. Offer encouragement, share wisdom when
                      appropriate, and contribute to a positive, uplifting environment.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Acceptable Behavior */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">What We Encourage</h2>
                <p className="text-xl text-muted-foreground">Behaviors that create a sacred and supportive community</p>
              </div>

              <div className="space-y-6">
                {[
                  "Share your spiritual journey and practices authentically",
                  "Respect different spiritual paths and beliefs",
                  "Communicate with kindness and compassion",
                  "Be honest about your intentions and expectations",
                  "Support others in their growth and healing",
                  "Maintain appropriate boundaries in conversations",
                  "Report concerning behavior to help keep our community safe",
                  "Practice patience and understanding with fellow seekers",
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-lg text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Unacceptable Behavior */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-red-50/20">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-red-700">What We Don't Allow</h2>
                <p className="text-xl text-muted-foreground">Behaviors that harm our sacred community space</p>
              </div>

              <div className="space-y-6">
                {[
                  "Harassment, bullying, or discriminatory behavior",
                  "Sharing inappropriate or explicit content",
                  "Misrepresenting yourself or creating fake profiles",
                  "Soliciting money, donations, or commercial services",
                  "Sharing personal contact information publicly",
                  "Promoting non-spiritual dating or hookup culture",
                  "Disrespecting or mocking spiritual beliefs and practices",
                  "Spam, promotional content, or excessive messaging",
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-lg text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Reporting and Enforcement */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <Card className="border-0 shadow-2xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl">Reporting and Enforcement</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    If you encounter behavior that violates these guidelines, please report it immediately. We take all
                    reports seriously and investigate them promptly with compassion and fairness.
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold">How to Report</h3>
                      <ul className="space-y-2 text-muted-foreground">
                        <li>• Use the report button on profiles or messages</li>
                        <li>• Contact our support team directly</li>
                        <li>• Provide specific details about the incident</li>
                        <li>• Include screenshots if helpful</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold">Our Response</h3>
                      <ul className="space-y-2 text-muted-foreground">
                        <li>• Review all reports within 24 hours</li>
                        <li>• Take appropriate action based on severity</li>
                        <li>• Provide support to affected members</li>
                        <li>• Maintain confidentiality throughout the process</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-primary/5 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3">Consequences</h3>
                    <p className="text-muted-foreground">
                      Violations may result in warnings, temporary suspensions, or permanent removal from our community,
                      depending on the severity and frequency of the behavior. We believe in redemption and growth, but
                      we prioritize the safety and well-being of our community.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Closing Message */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-primary/10 to-rose-500/10">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold">Together We Create Sacred Space</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                These guidelines are living principles that evolve with our community. By following them, you help
                create a sanctuary where authentic spiritual connections can flourish. Thank you for being part of our
                sacred journey.
              </p>
              <Badge variant="secondary" className="text-lg px-6 py-2">
                Last Updated: March 2025
              </Badge>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  )
}
