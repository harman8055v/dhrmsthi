"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Scale, FileText, AlertTriangle, CheckCircle, XCircle, Users } from "lucide-react"

import Footer from "@/components/footer"

export default function TermsOfServicePage() {
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
                <Scale className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-rose-600 bg-clip-text text-transparent">
                Terms of Service
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                The sacred agreement that governs our spiritual community and platform
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
                      <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Welcome to DharmaSaathi</h2>
                    </div>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      These Terms of Service ("Terms") govern your use of DharmaSaathi, a spiritual matchmaking platform
                      designed to connect conscious individuals seeking meaningful relationships based on shared dharma
                      and spiritual values.
                    </p>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      By creating an account or using our services, you agree to be bound by these Terms and our Privacy
                      Policy. Please read them carefully, as they contain important information about your rights and
                      obligations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Acceptance and Eligibility */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-primary/5">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Acceptance and Eligibility</h2>
              </div>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Age Requirement</h3>
                      <p className="text-muted-foreground">
                        You must be at least 18 years old to use DharmaSaathi. By using our service, you represent and
                        warrant that you meet this age requirement.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Legal Capacity</h3>
                      <p className="text-muted-foreground">
                        You must have the legal capacity to enter into binding agreements and comply with these Terms in
                        your jurisdiction.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Spiritual Intent</h3>
                      <p className="text-muted-foreground">
                        You agree to use DharmaSaathi with genuine spiritual intent, seeking meaningful connections
                        based on shared values and conscious living.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Account Responsibilities */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Account Responsibilities</h2>
                <p className="text-xl text-muted-foreground">Your obligations as a member of our spiritual community</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Profile Authenticity</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Provide accurate and truthful information</li>
                      <li>• Use recent, authentic photos of yourself</li>
                      <li>• Keep your profile information up to date</li>
                      <li>• Represent your spiritual journey honestly</li>
                      <li>• Do not create multiple accounts</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Account Security</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Maintain confidentiality of login credentials</li>
                      <li>• Use strong, unique passwords</li>
                      <li>• Report suspicious activity immediately</li>
                      <li>• Log out from shared devices</li>
                      <li>• Enable two-factor authentication when available</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Prohibited Activities */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-red-50/20">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-red-700">Prohibited Activities</h2>
                <p className="text-xl text-muted-foreground">Activities that violate our sacred community standards</p>
              </div>

              <div className="space-y-6">
                {[
                  "Creating fake profiles or misrepresenting your identity",
                  "Harassment, bullying, or discriminatory behavior",
                  "Sharing inappropriate, explicit, or offensive content",
                  "Soliciting money, donations, or commercial services",
                  "Spamming or sending unsolicited promotional content",
                  "Attempting to bypass our matching system or security measures",
                  "Using the platform for non-spiritual dating or hookups",
                  "Sharing personal contact information in public profiles",
                  "Engaging in illegal activities or promoting harmful behavior",
                  "Violating intellectual property rights or privacy of others",
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <XCircle className="h-6 w-6 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-lg text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Payment Terms */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <Card className="border-0 shadow-2xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl">Payment Terms</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold">Premium Features</h3>
                      <p className="text-muted-foreground">
                        DharmaSaathi offers premium features to enhance your spiritual matchmaking experience. Premium
                        subscriptions provide access to advanced matching algorithms, unlimited messaging, and exclusive
                        spiritual content.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold">Billing & Refunds</h3>
                      <p className="text-muted-foreground">
                        Subscriptions are billed in advance and automatically renew unless cancelled. Refunds are
                        available within 7 days of purchase for unused premium features, subject to our refund policy.
                      </p>
                    </div>
                  </div>

                  <div className="bg-primary/5 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3">Cancellation</h3>
                    <p className="text-muted-foreground">
                      You may cancel your premium subscription at any time through your account settings. Cancellation
                      will take effect at the end of your current billing period, and you will retain access to premium
                      features until then.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-primary/5">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <Card className="border-0 shadow-lg">
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <AlertTriangle className="h-8 w-8 text-amber-500" />
                    <CardTitle className="text-3xl">Important Disclaimers</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Service Availability</h3>
                    <p className="text-muted-foreground">
                      DharmaSaathi is provided "as is" without warranties of any kind. We do not guarantee uninterrupted
                      service, successful matches, or specific outcomes from using our platform.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">User Interactions</h3>
                    <p className="text-muted-foreground">
                      We are not responsible for the conduct of other users or the outcome of any relationships formed
                      through our platform. Users interact at their own risk and should exercise caution when meeting
                      others.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Limitation of Liability</h3>
                    <p className="text-muted-foreground">
                      To the maximum extent permitted by law, DharmaSaathi's liability is limited to the amount you paid
                      for our services in the 12 months preceding any claim.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Termination */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Account Termination</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-semibold mb-4">By You</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      You may terminate your account at any time by contacting our support team or using the account
                      deletion feature in your settings. Upon termination, your profile will be removed and your data
                      will be deleted according to our Privacy Policy.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-semibold mb-4">By Us</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      We may suspend or terminate your account if you violate these Terms, engage in prohibited
                      activities, or if we believe your actions harm our community. We will provide notice when
                      possible, but reserve the right to terminate immediately for serious violations.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-primary/10 to-rose-500/10">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold">Questions About These Terms?</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                We're here to help you understand your rights and obligations. Contact our legal team for any questions
                about these Terms of Service.
              </p>
              <div className="space-y-4">
                <p className="text-lg">
                  <strong>Email:</strong> legal@dharmasaathi.com
                </p>
                <p className="text-lg">
                  <strong>Phone:</strong> +91 9537376569
                </p>
              </div>
              <div className="bg-white/50 p-6 rounded-lg">
                <p className="text-muted-foreground">
                  These Terms may be updated from time to time. We will notify you of significant changes via email or
                  through our platform. Continued use of DharmaSaathi after changes constitutes acceptance of the new
                  Terms.
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
