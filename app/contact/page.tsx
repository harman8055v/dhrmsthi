"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Phone, MapPin, Clock, Heart, Send, Loader2, CheckCircle } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { toast } from "@/hooks/use-toast"

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting || isSubmitted) return

    // Validate form
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      setIsSubmitted(true)
      toast({
        title: "Success!",
        description: data.message
      })

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      })

    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-rose-600 bg-clip-text text-transparent">
                Contact Support
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                We're here to support you on your spiritual journey. Reach out with any questions or concerns.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Email Support</h3>
                    <p className="text-muted-foreground text-sm">support@dharmasaathi.com</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Phone Support</h3>
                    <p className="text-muted-foreground text-sm">+91 9537376569</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Location</h3>
                    <p className="text-muted-foreground text-sm">
                      Dharma Next, Shiv Business Hub, Nikol, Ahmedabad, 382350
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Support Hours</h3>
                    <p className="text-muted-foreground text-sm">Monday to Friday 10am to 6pm</p>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Form */}
              <div className="max-w-4xl mx-auto">
                <Card className="border-0 shadow-2xl">
                  <CardHeader className="text-center">
                    <CardTitle className="text-3xl">Send Us a Message</CardTitle>
                    <p className="text-muted-foreground">We typically respond within 24 hours</p>
                  </CardHeader>
                  <CardContent className="p-8">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="name" className="text-sm font-medium">
                            Full Name *
                          </label>
                          <Input 
                            id="name" 
                            placeholder="Enter your full name" 
                            value={formData.name}
                            onChange={handleInputChange}
                            required 
                            disabled={isSubmitting || isSubmitted}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="email" className="text-sm font-medium">
                            Email Address *
                          </label>
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="Enter your email" 
                            value={formData.email}
                            onChange={handleInputChange}
                            required 
                            disabled={isSubmitting || isSubmitted}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="subject" className="text-sm font-medium">
                          Subject *
                        </label>
                        <Input 
                          id="subject" 
                          placeholder="What can we help you with?" 
                          value={formData.subject}
                          onChange={handleInputChange}
                          required 
                          disabled={isSubmitting || isSubmitted}
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="message" className="text-sm font-medium">
                          Message *
                        </label>
                        <Textarea
                          id="message"
                          placeholder="Please describe your question or concern in detail..."
                          rows={6}
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          disabled={isSubmitting || isSubmitted}
                        />
                      </div>

                      <div className="text-center">
                        <Button 
                          type="submit" 
                          size="lg" 
                          className="bg-primary hover:bg-primary/90"
                          disabled={isSubmitting || isSubmitted}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Sending...
                            </>
                          ) : isSubmitted ? (
                            <>
                              <CheckCircle className="mr-2 h-5 w-5" />
                              Message Sent!
                            </>
                          ) : (
                            <>
                              Send Message
                              <Send className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-primary/5">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Frequently Asked Questions</h2>
                <p className="text-xl text-muted-foreground">Quick answers to common questions</p>
              </div>

              <div className="space-y-6">
                {[
                  {
                    question: "How do I delete my account?",
                    answer:
                      "You can delete your account by going to Settings > Account > Delete Account. This action is permanent and cannot be undone.",
                  },
                  {
                    question: "How do I report inappropriate behavior?",
                    answer:
                      "Use the report button on any profile or message, or contact our support team directly. We take all reports seriously and investigate promptly.",
                  },
                  {
                    question: "Can I get a refund for my premium subscription?",
                    answer:
                      "Yes, we offer refunds within 7 days of purchase for unused premium features. Contact our support team to process your refund.",
                  },
                  {
                    question: "How do I change my spiritual preferences?",
                    answer:
                      "Go to your Profile Settings and update your spiritual practices, beliefs, and preferences. Changes will be reflected in your matches immediately.",
                  },
                  {
                    question: "Is my personal information secure?",
                    answer:
                      "Yes, we use industry-standard encryption and security measures to protect your data. Read our Privacy Policy for detailed information.",
                  },
                ].map((faq, index) => (
                  <Card key={index} className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  )
}
