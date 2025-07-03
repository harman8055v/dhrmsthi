"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Lock, Eye, Database, UserCheck, AlertCircle } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function PrivacyPolicyPage() {
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
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-rose-600 bg-clip-text text-transparent">
                Privacy Policy
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Your privacy is sacred to us. Learn how we protect and honor your personal information.
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
                      <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Your Privacy Matters</h2>
                    </div>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      At DharmaSaathi, we understand that your personal information is sacred and deserves the highest
                      level of protection. This Privacy Policy explains how we collect, use, protect, and share your
                      information when you use our spiritual matchmaking platform.
                    </p>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      We are committed to transparency and giving you control over your personal data. By using
                      DharmaSaathi, you agree to the practices described in this policy.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Information We Collect */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-primary/5">
          <div className="container px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Information We Collect</h2>
                <p className="text-xl text-muted-foreground">Understanding what information we gather and why</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <UserCheck className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Profile Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground mb-4">
                      Information you provide when creating and maintaining your profile:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Basic details (name, age, location, gender)</li>
                      <li>• Spiritual practices and beliefs</li>
                      <li>• Photos and profile descriptions</li>
                      <li>• Preferences and compatibility criteria</li>
                      <li>• Contact information (email, phone)</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Eye className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Usage Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground mb-4">Information about how you interact with our platform:</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• App usage patterns and preferences</li>
                      <li>• Messages and interactions (encrypted)</li>
                      <li>• Search and matching activity</li>
                      <li>• Device information and IP address</li>
                      <li>• Location data (with your permission)</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Database className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Technical Data</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground mb-4">
                      Technical information to ensure platform security and functionality:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Browser type and version</li>
                      <li>• Operating system information</li>
                      <li>• Cookies and similar technologies</li>
                      <li>• Log files and error reports</li>
                      <li>• Security and fraud prevention data</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <AlertCircle className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Sensitive Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground mb-4">Special categories of data we handle with extra care:</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Religious and spiritual beliefs</li>
                      <li>• Philosophical views and practices</li>
                      <li>• Health information (if shared)</li>
                      <li>• Relationship history (if disclosed)</li>
                      <li>• Financial information for payments</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* How We Use Information */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">How We Use Your Information</h2>
                <p className="text-xl text-muted-foreground">
                  We use your information solely to enhance your spiritual matchmaking experience
                </p>
              </div>

              <div className="space-y-8">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-semibold mb-4">Matchmaking & Compatibility</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      We use your profile information, preferences, and spiritual practices to suggest compatible
                      matches and improve our matching algorithms. This includes analyzing compatibility based on shared
                      values, spiritual paths, and relationship goals.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-semibold mb-4">Platform Improvement</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      We analyze usage patterns and feedback to enhance our features, develop new tools for spiritual
                      connection, and create a better user experience. All analysis is done in aggregate and anonymized
                      whenever possible.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-semibold mb-4">Communication & Support</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      We use your contact information to send important updates, respond to your inquiries, provide
                      customer support, and share relevant spiritual content and community updates (with your consent).
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-semibold mb-4">Safety & Security</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      We use your information to verify identities, prevent fraud, detect suspicious activity, and
                      maintain the safety and integrity of our spiritual community. This includes monitoring for
                      inappropriate behavior and enforcing our community guidelines.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Data Protection */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-primary/5">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <Card className="border-0 shadow-2xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl">How We Protect Your Data</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <p className="text-lg text-muted-foreground leading-relaxed text-center">
                    We implement industry-leading security measures to protect your sacred information:
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold">Technical Safeguards</h3>
                      <ul className="space-y-2 text-muted-foreground">
                        <li>• End-to-end encryption for messages</li>
                        <li>• Secure SSL/TLS data transmission</li>
                        <li>• Regular security audits and updates</li>
                        <li>• Multi-factor authentication options</li>
                        <li>• Secure cloud storage with encryption</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold">Operational Safeguards</h3>
                      <ul className="space-y-2 text-muted-foreground">
                        <li>• Limited access to personal data</li>
                        <li>• Employee training on data protection</li>
                        <li>• Regular backup and recovery procedures</li>
                        <li>• Incident response and breach protocols</li>
                        <li>• Compliance with privacy regulations</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Your Rights */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Your Privacy Rights</h2>
                <p className="text-xl text-muted-foreground">
                  You have complete control over your personal information
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    title: "Access Your Data",
                    description: "Request a copy of all personal information we have about you",
                  },
                  {
                    title: "Update Information",
                    description: "Correct or update any inaccurate or incomplete data",
                  },
                  {
                    title: "Delete Your Account",
                    description: "Permanently remove your profile and associated data",
                  },
                  {
                    title: "Data Portability",
                    description: "Export your data in a commonly used format",
                  },
                  {
                    title: "Restrict Processing",
                    description: "Limit how we use your information in certain circumstances",
                  },
                  {
                    title: "Withdraw Consent",
                    description: "Opt out of marketing communications and data processing",
                  },
                ].map((right, index) => (
                  <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-2">{right.title}</h3>
                      <p className="text-muted-foreground">{right.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-primary/10 to-rose-500/10">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold">Questions About Your Privacy?</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                We're here to help you understand and exercise your privacy rights. Contact our dedicated privacy team
                for any questions or concerns about how we handle your personal information.
              </p>
              <div className="space-y-4">
                <p className="text-lg">
                  <strong>Email:</strong> privacy@dharmasaathi.com
                </p>
                <p className="text-lg">
                  <strong>Phone:</strong> +91 9537376569
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
