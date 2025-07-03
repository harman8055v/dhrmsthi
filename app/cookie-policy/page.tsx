"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Cookie, Settings, Eye, BarChart, Shield, ToggleLeft } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function CookiePolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-rose-500/10" />
          <div className="container px-4 md:px-6 relative">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6">
                <Cookie className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-rose-600 bg-clip-text text-transparent">
                Cookie Policy
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Understanding how we use cookies to enhance your spiritual journey on DharmaSaathi
              </p>
            </div>
          </div>
        </section>

        {/* Last Updated */}
        <section className="py-8 border-b">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="secondary" className="text-lg px-6 py-2">
                Last Updated: March 15, 2025
              </Badge>
            </div>
          </div>
        </section>

        {/* Introduction */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-primary/5">
                <CardContent className="p-8 md:p-12">
                  <div className="space-y-6">
                    <div className="text-center">
                      <Cookie className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">What Are Cookies?</h2>
                    </div>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Cookies are small text files that are stored on your device when you visit DharmaSaathi. They help
                      us provide you with a personalized and secure experience by remembering your preferences, keeping
                      you logged in, and improving our spiritual matchmaking services.
                    </p>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      This Cookie Policy explains what cookies we use, why we use them, and how you can control them to
                      align with your privacy preferences.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Types of Cookies */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-primary/5">
          <div className="container px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Types of Cookies We Use</h2>
                <p className="text-xl text-muted-foreground">
                  Different cookies serve different purposes in enhancing your experience
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Essential Cookies</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground mb-4">
                      These cookies are necessary for the basic functioning of DharmaSaathi:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Authentication and login sessions</li>
                      <li>• Security and fraud prevention</li>
                      <li>• Basic site functionality</li>
                      <li>• Load balancing and performance</li>
                      <li>• Privacy preference settings</li>
                    </ul>
                    <Badge variant="secondary" className="mt-3">
                      Always Active
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Settings className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Functional Cookies</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground mb-4">
                      These cookies enhance your experience by remembering your preferences:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Language and region preferences</li>
                      <li>• Theme and display settings</li>
                      <li>• Notification preferences</li>
                      <li>• Search and filter settings</li>
                      <li>• Accessibility options</li>
                    </ul>
                    <Badge variant="outline" className="mt-3">
                      Optional
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <BarChart className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Analytics Cookies</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground mb-4">
                      These cookies help us understand how you use our platform:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Page views and user interactions</li>
                      <li>• Feature usage and performance</li>
                      <li>• Error tracking and debugging</li>
                      <li>• A/B testing for improvements</li>
                      <li>• Aggregated usage statistics</li>
                    </ul>
                    <Badge variant="outline" className="mt-3">
                      Optional
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Eye className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Targeting Cookies</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground mb-4">
                      These cookies help us show you relevant content and matches:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Personalized match recommendations</li>
                      <li>• Relevant spiritual content</li>
                      <li>• Customized user experience</li>
                      <li>• Interest-based suggestions</li>
                      <li>• Social media integration</li>
                    </ul>
                    <Badge variant="outline" className="mt-3">
                      Optional
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Third-Party Cookies */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Third-Party Services</h2>
                <p className="text-xl text-muted-foreground">
                  We work with trusted partners to enhance your experience
                </p>
              </div>

              <div className="space-y-8">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-semibold mb-4">Analytics Partners</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      We use Google Analytics and similar services to understand how our platform is used. These
                      services may set their own cookies to track user behavior across websites.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Google Analytics</Badge>
                      <Badge variant="secondary">Mixpanel</Badge>
                      <Badge variant="secondary">Hotjar</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-semibold mb-4">Payment Processors</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Our payment partners may use cookies to process transactions securely and prevent fraud.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Razorpay</Badge>
                      <Badge variant="secondary">Stripe</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-semibold mb-4">Social Media Integration</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Social media plugins may set cookies when you interact with sharing buttons or embedded content.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Facebook</Badge>
                      <Badge variant="secondary">Instagram</Badge>
                      <Badge variant="secondary">Twitter</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Cookie Management */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-primary/5">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <Card className="border-0 shadow-2xl">
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <ToggleLeft className="h-8 w-8 text-primary" />
                    <CardTitle className="text-3xl">Managing Your Cookie Preferences</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="text-center">
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      You have full control over which cookies you allow. Here are your options:
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold">DharmaSaathi Settings</h3>
                      <p className="text-muted-foreground">
                        You can control which types of cookies you allow through your account settings. Essential cookies
                        are required for the basic functionality of our platform.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold">Browser Settings</h3>
                      <p className="text-muted-foreground">
                        Most browsers allow you to control cookies through their settings. You can block all cookies,
                        delete existing ones, or set preferences for specific websites.
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Chrome: Settings → Privacy and Security → Cookies</li>
                        <li>• Firefox: Settings → Privacy & Security</li>
                        <li>• Safari: Preferences → Privacy</li>
                        <li>• Edge: Settings → Cookies and Site Permissions</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2 text-amber-800">Important Note</h3>
                    <p className="text-amber-700">
                      Disabling essential cookies may affect the functionality of DharmaSaathi. Some features may not
                      work properly, and you may need to re-enter information each time you visit.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-primary/10 to-rose-500/10">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold">Questions About Cookies?</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                We're here to help you understand how cookies work and how to manage your preferences. Contact our
                privacy team for any questions about our cookie practices.
              </p>
              <div className="space-y-4">
                <p className="text-lg">
                  <strong>Email:</strong> privacy@dharmasaathi.com
                </p>
                <p className="text-lg">
                  <strong>Subject:</strong> Cookie Policy Inquiry
                </p>
              </div>
              <div className="bg-white/50 p-6 rounded-lg">
                <p className="text-muted-foreground">
                  This Cookie Policy may be updated from time to time to reflect changes in our practices or applicable
                  laws. We will notify you of significant changes and update the "Last Updated" date at the top of this
                  page.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  )
}
