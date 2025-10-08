"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Star,
  Sparkles,
  Crown,
  Check,
  Shield,
  Diamond,
  BadgeCheck,
  Award,
  Gem,
  Lock,
  Users,
  MapPin,
  FileCheck,
  DollarSign,
  Eye,
  Headphones,
  Search,
  Brain,
  BarChart3,
  ShoppingBag,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import MobileNav from "@/components/dashboard/mobile-nav"
import PaymentModal from "@/components/payment/payment-modal"
import PricingPopup from "@/components/pricing-popup"
// Toaster not used directly in this page

const superLikePackages = [
  { count: 4, price: 199, popular: false },
  { count: 10, price: 399, popular: true },
  { count: 40, price: 999, popular: false },
]



export default function StorePage() {
  // Pull auth state from the top-level provider so we hit Supabase only once per app load
  const { user, profile, loading, refreshProfile } = useAuthContext()
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean
    item: any
  }>({
    isOpen: false,
    item: null,
  })
  
  const [pricingPopup, setPricingPopup] = useState<{
    isOpen: boolean
    planKey: string
  }>({
    isOpen: false,
    planKey: "",
  })
  
  const [currentPlanIndex, setCurrentPlanIndex] = useState(1) // Start with Sangam (index 1)
  const router = useRouter()

  const openPaymentModal = (item: any) => {
    setPaymentModal({ isOpen: true, item })
  }

  const closePaymentModal = () => {
    setPaymentModal({ isOpen: false, item: null })
  }

  const openPricingPopup = (planKey: string) => {
    setPricingPopup({ isOpen: true, planKey })
  }

  const closePricingPopup = () => {
    setPricingPopup({ isOpen: false, planKey: "" })
  }

  const handlePaymentSuccess = () => {
    // Refresh profile in background to avoid keeping page in loading state
    refreshProfile()
  }

  const scrollToPlan = (index: number) => {
    const container = document.querySelector('.plans-scroll-container')
    const planCard = document.querySelector(`.plan-card-${index}`)
    if (container && planCard) {
      const cardRect = planCard.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const scrollLeft = planCard.offsetLeft - containerRect.width / 2 + cardRect.width / 2
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
    }
    setCurrentPlanIndex(index)
  }

  const navigatePlan = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? Math.max(0, currentPlanIndex - 1)
      : Math.min(2, currentPlanIndex + 1)
    scrollToPlan(newIndex)
  }

  // Scroll to Sangam plan on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToPlan(1) // Sangam plan is at index 1
    }, 500) // Small delay to ensure DOM is ready
    
    return () => clearTimeout(timer)
  }, [])

  // Refresh profile when user returns focus or tab becomes visible (post-payment)
  useEffect(() => {
    const onFocus = () => {
      refreshProfile()
    }
    const onVisibility = () => {
      if (!document.hidden) refreshProfile()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refreshProfile])

  // Removed local Supabase fetch – data comes from context

  if (loading && !profile) {
    return <>{require("./loading").default()}</>;
  }

  // If no profile (e.g., user not logged in or onboarding not complete) redirect to homepage
  if (!profile) {
    router.push("/")
    return null
  }

  // Plan pricing based on billing cycle
  const planPricing = {
    sparsh: {
      quarterly: { originalPrice: 1497, price: 899, duration: "3 months", savings: "40%" },
      biannual: { originalPrice: 2994, price: 1599, duration: "6 months", savings: "47%" },
      yearly: { originalPrice: 5988, price: 2899, duration: "1 year", savings: "52%" },
    },
    sangam: {
      quarterly: { originalPrice: 2397, price: 1499, duration: "3 months", savings: "37%" },
      biannual: { originalPrice: 4794, price: 2699, duration: "6 months", savings: "44%" },
      yearly: { originalPrice: 9588, price: 4999, duration: "1 year", savings: "48%" },
    },
    samarpan: {
      quarterly: { originalPrice: 3597, price: 2299, duration: "3 months", savings: "36%" },
      biannual: { originalPrice: 7194, price: 3999, duration: "6 months", savings: "44%" },
      yearly: { originalPrice: 14388, price: 7499, duration: "1 year", savings: "48%" },
    },
  }

  // Calculate starting monthly price (from yearly plan for best rate)
  const getStartingMonthlyPrice = (planKey: string) => {
    const plan = planPricing[planKey as keyof typeof planPricing]
    return Math.round(plan.yearly.price / 12)
  }

  // Plan details for display
  const planDisplayData = {
    sparsh: {
      name: "Sparsh",
      emoji: "🤝",
      description: "Perfect for meaningful connections",
      tagline: "Connect with purpose",
      color: "blue",
      features: ["20 swipes daily", "Unlimited messaging", "View all matches"]
    },
    sangam: {
      name: "Sangam",
      emoji: "💫", 
      description: "Enhanced features for deeper connections",
      tagline: "See who likes you",
      color: "purple",
      isRecommended: true,
      features: ["50 swipes daily", "Super Likes included", "AI matching analysis"]
    },
    samarpan: {
      name: "Samarpan",
      emoji: "👑",
      description: "Premium experience with exclusive benefits", 
      tagline: "Unlimited everything",
      color: "yellow",
      features: ["Unlimited swipes", "Priority support", "Advanced AI insights"]
    }
  }

  const handlePlanSelection = (planKey: string, billingCycle: "quarterly" | "biannual" | "yearly") => {
    const planNames = {
      sparsh: "Sparsh Plan",
      sangam: "Sangam Plan",
      samarpan: "Samarpan Plan",
    }

    const planFeatures = {
      sparsh: ["20 swipes per day", "Unlimited messaging", "View all matches", "Basic profile visibility"],
      sangam: [
        "50 swipes per day",
        "Everything in Sparsh",
        "5 Super Likes monthly",
        "See who likes you & match instantly",
        "Higher profile visibility",
      ],
      samarpan: [
        "Unlimited swipes",
        "Everything in Sangam",
        "15 Super Likes monthly",
        "Highest profile visibility",
        "Priority customer support",
        "Access to Elite verified profiles",
        "In-depth compatibility analysis",
        "Enhanced privacy controls",
        "Advanced AI Insights",
        "100% confidentiality guaranteed",
      ],
    }

    const features = [...planFeatures[planKey as keyof typeof planFeatures]]
    const selectedPlan = planPricing[planKey as keyof typeof planPricing][billingCycle]
    features.push(`Save ${selectedPlan.savings} with this Limited Time Offer!`)

    const billingCycleNames = {
      quarterly: "3 months",
      biannual: "6 months", 
      yearly: "1 year"
    }

    openPaymentModal({
      type: "plan",
      name: `${planNames[planKey as keyof typeof planNames]} (${billingCycleNames[billingCycle]})`,
      price: selectedPlan.price,
      description: `${billingCycleNames[billingCycle]} of ${planNames[planKey as keyof typeof planNames]} access`,
      features,
      user_id: user?.id || "",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <MobileNav userProfile={profile} />

      {/* Main Content with proper spacing to avoid overlap */}
      <main className="pb-40 px-4 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="mt-4 mb-8">
            <div className="mx-auto max-w-2xl rounded-xl bg-white shadow-lg border border-gray-100 p-7 flex flex-col items-center relative" style={{borderBottom: '4px solid #e6c200'}}>
              <p className="text-sm text-gray-500 mb-3 text-center">Enhance your journey with premium features</p>
              <div className="flex flex-wrap justify-center gap-2 text-xs mb-4">
                {/* Only show Super Likes count for plans that have access */}
                {profile?.account_status && ['sangam', 'samarpan'].includes(profile.account_status) && (
                  <div className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200 text-gray-800 font-medium">Super Likes: <span className="text-orange-600 font-semibold">{profile?.super_likes_count || 0}</span></div>
                )}

                {profile?.account_status === "sparsh" && (
                  <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1 font-medium">
                    <Crown className="w-3 h-3 inline" /> Sparsh
                  </div>
                )}
                {profile?.account_status === "sangam" && (
                  <div className="bg-yellow-50 text-yellow-800 px-3 py-1 rounded-full border border-yellow-200 flex items-center gap-1 font-medium">
                    <Crown className="w-3 h-3 inline" /> Sangam
                  </div>
                )}
                {profile?.account_status === "samarpan" && (
                  <div className="bg-gradient-to-r from-yellow-100 to-yellow-300 text-yellow-900 px-3 py-1 rounded-full border border-yellow-300 flex items-center gap-1 font-medium">
                    <Diamond className="w-3 h-3 inline" /> Samarpan
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-md mx-auto mt-4 mb-2">
                <button
                  onClick={() => {
                    const el = document.getElementById('plans-section');
                    if (el) {
                      const y = el.getBoundingClientRect().top + window.pageYOffset - 100;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-1 py-5 rounded-2xl bg-[#8b0000] text-white font-bold text-base shadow-md hover:bg-[#a83232] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#e6c200] focus:ring-offset-2"
                >
                  <Crown className="w-7 h-7 mb-1" />
                  Plans
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById('superlikes-section');
                    if (el) {
                      const y = el.getBoundingClientRect().top + window.pageYOffset - 100;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-1 py-5 rounded-2xl bg-[#bfa100] text-white font-bold text-base shadow-md hover:bg-[#e6c200] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#e6c200] focus:ring-offset-2"
                >
                  <Star className="w-7 h-7 mb-1" />
                  Super Likes
                </button>

              </div>
            </div>
          </div>

          {/* Premium Plans */}
          <div id="plans-section" className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Find Your Perfect Plan</h2>
              <p className="text-gray-600 text-lg">Choose a plan that resonates with your spiritual journey</p>
            </div>

            {/* Free Plan - Drishti */}
            <div className="mb-8">
              <Card className="relative overflow-hidden border-2 border-gray-200 bg-gray-50 max-w-md mx-auto">
                <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <span className="text-2xl">👁️</span>
                    Drishti Plan
                  </CardTitle>
                  <div className="text-2xl font-bold">
                    Free<span className="text-lg font-normal">/forever</span>
                  </div>
                  <p className="text-sm opacity-80">Start your spiritual journey</p>
                </CardHeader>
                <CardContent className="p-6 text-center">
                  <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>5 swipes daily</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>View matches</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 text-red-500">✕</span>
                      <span className="text-gray-500">Messaging</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Basic features</span>
                    </div>
                  </div>
                  <Button disabled className="w-full bg-gray-400">
                    {["sparsh", "sangam", "samarpan"].includes(profile?.account_status || "")
                      ? "Already Premium"
                      : "Current Plan"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Attractive Header for Plans */}
            <div className="text-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 px-6 py-2 text-gray-500 text-sm font-medium">
                    Premium Plans
                  </span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
                Unlock Your Spiritual Journey
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Discover meaningful connections with our premium features designed for spiritual seekers
              </p>
            </div>

            {/* Horizontal Slideable Premium Plans */}
            <div className="relative overflow-visible">
              <div className="overflow-x-auto overflow-y-visible scrollbar-hide plans-scroll-container">
                <div className="flex gap-6 pb-4 pt-8 px-4" style={{ width: 'max-content' }}>
                  {/* Sparsh Plan */}
                  <div className="w-80 flex-shrink-0 plan-card-0">
                    <Card className="relative overflow-hidden border-2 border-blue-200 hover:border-blue-300 transition-all hover:shadow-lg h-full">
                      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <span className="text-2xl">{planDisplayData.sparsh.emoji}</span>
                          <CardTitle className="text-xl">{planDisplayData.sparsh.name}</CardTitle>
                        </div>
                        <p className="text-sm opacity-90 mb-3">{planDisplayData.sparsh.description}</p>
                        <div className="space-y-1">
                          <div className="text-sm opacity-80">Starting from</div>
                          <div className="text-3xl font-bold">₹{getStartingMonthlyPrice('sparsh')}</div>
                          <div className="text-sm opacity-80">/month</div>
                        </div>
                        <div className="text-xs bg-blue-400/30 px-3 py-1 rounded-full mt-2 inline-block">
                          {planDisplayData.sparsh.tagline}
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 flex flex-col justify-between">
                        <div>
                          <div className="space-y-3 mb-6">
                            {planDisplayData.sparsh.features.map((feature, index) => (
                              <div key={index} className="flex items-center gap-3 text-sm">
                                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button
                          onClick={() => openPricingPopup('sparsh')}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                          disabled={["sangam", "samarpan"].includes(profile?.account_status || "")}
                        >
                          {["sangam", "samarpan"].includes(profile?.account_status || "")
                            ? "Already Premium"
                            : "View Pricing"}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sangam Plan - Recommended/Center */}
                  <div className="w-80 flex-shrink-0 plan-card-1">
                    <div className="relative">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                          <Sparkles className="w-3 h-3 inline mr-1" />
                          Recommended
                        </div>
                      </div>
                      <Card className="relative overflow-hidden border-2 border-purple-300 hover:border-purple-400 transition-all hover:shadow-xl h-full transform scale-105">
                      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <span className="text-2xl">{planDisplayData.sangam.emoji}</span>
                          <CardTitle className="text-xl">{planDisplayData.sangam.name}</CardTitle>
                        </div>
                        <p className="text-sm opacity-90 mb-3">{planDisplayData.sangam.description}</p>
                        <div className="space-y-1">
                          <div className="text-sm opacity-80">Starting from</div>
                          <div className="text-3xl font-bold">₹{getStartingMonthlyPrice('sangam')}</div>
                          <div className="text-sm opacity-80">/month</div>
                        </div>
                        <div className="text-xs bg-purple-400/30 px-3 py-1 rounded-full mt-2 inline-block">
                          {planDisplayData.sangam.tagline}
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 flex flex-col justify-between">
                        <div>
                          <div className="space-y-3 mb-6">
                            {planDisplayData.sangam.features.map((feature, index) => (
                              <div key={index} className="flex items-center gap-3 text-sm">
                                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button
                          onClick={() => openPricingPopup('sangam')}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          disabled={["sangam", "samarpan"].includes(profile?.account_status || "")}
                        >
                          {["sangam", "samarpan"].includes(profile?.account_status || "")
                            ? "Already Premium"
                            : "View Pricing"}
                        </Button>
                      </CardContent>
                    </Card>
                    </div>
                  </div>

                  {/* Samarpan Plan */}
                  <div className="w-80 flex-shrink-0 plan-card-2">
                    <Card className="relative overflow-hidden border-2 border-yellow-300 hover:border-yellow-400 transition-all hover:shadow-lg h-full">
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Premium
                      </div>
                      <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <span className="text-2xl">{planDisplayData.samarpan.emoji}</span>
                          <CardTitle className="text-xl">{planDisplayData.samarpan.name}</CardTitle>
                        </div>
                        <p className="text-sm opacity-90 mb-3">{planDisplayData.samarpan.description}</p>
                        <div className="space-y-1">
                          <div className="text-sm opacity-80">Starting from</div>
                          <div className="text-3xl font-bold">₹{getStartingMonthlyPrice('samarpan')}</div>
                          <div className="text-sm opacity-80">/month</div>
                        </div>
                        <div className="text-xs bg-yellow-400/30 px-3 py-1 rounded-full mt-2 inline-block">
                          {planDisplayData.samarpan.tagline}
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 flex flex-col justify-between">
                        <div>
                          <div className="space-y-3 mb-6">
                            {planDisplayData.samarpan.features.map((feature, index) => (
                              <div key={index} className="flex items-center gap-3 text-sm">
                                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button
                          onClick={() => openPricingPopup('samarpan')}
                          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                          disabled={profile?.account_status === "samarpan"}
                        >
                          {profile?.account_status === "samarpan"
                            ? "Current Plan"
                            : "View Pricing"}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
              
              {/* Navigation arrows and indicators */}
              <div className="flex items-center justify-center mt-6 gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigatePlan('prev')}
                  disabled={currentPlanIndex === 0}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {/* Scroll indicator dots */}
                <div className="flex gap-2">
                  {[0, 1, 2].map((index) => (
                    <button
                      key={index}
                      onClick={() => scrollToPlan(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        currentPlanIndex === index 
                          ? index === 0 ? 'w-3 bg-blue-500' 
                            : index === 1 ? 'w-3 bg-purple-500' 
                            : 'w-3 bg-yellow-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigatePlan('next')}
                  disabled={currentPlanIndex === 2}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-center mt-4">
                <p className="text-sm text-gray-500">Swipe horizontally to explore all plans</p>
              </div>
            </div>
          </div>



          {/* Super Likes */}
          <div className="mb-12">
            {/* Super Likes */}
            <div id="superlikes-section">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Super Likes ⭐</h2>
              <div className="space-y-4">
                {superLikePackages.map((pkg, index) => (
                  <Card
                    key={index}
                    className={`relative overflow-hidden border-2 transition-colors ${
                      pkg.popular
                        ? "border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50"
                        : "border-gray-200 hover:border-yellow-200"
                    }`}
                  >
                    <CardContent className="p-6 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{pkg.count} Super Likes</h3>
                          <p className="text-gray-600">Stand out from the crowd</p>
                        </div>
                        <div className="text-right">
                          {pkg.popular && (
                            <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-0.5 rounded-full text-xs font-semibold mb-1 shadow-sm align-middle">Popular</div>
                          )}
                          <div className="text-2xl font-bold text-gray-900">₹{pkg.price}</div>
                          <Button
                            onClick={() =>
                              openPaymentModal({
                                type: "super_likes",
                                name: `${pkg.count} Super Likes`,
                                price: pkg.price,
                                description: `${pkg.count} Super Likes to make your profile stand out`,
                                features: [
                                  "Instantly notify matches of your interest",
                                  "Higher chance of getting matched",
                                  "Stand out from regular likes",
                                ],
                                count: pkg.count,
                                user_id: user?.id || "",
                              })
                            }
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 mt-2"
                          >
                            Buy Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>


          </div>
        </div>
      </main>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={closePaymentModal}
        item={paymentModal.item}
        onSuccess={handlePaymentSuccess}
      />

      {/* Pricing Popup */}
      <PricingPopup
        isOpen={pricingPopup.isOpen}
        onClose={closePricingPopup}
        planKey={pricingPopup.planKey}
        onSelectPlan={handlePlanSelection}
      />

      {/* Toaster not used directly in this page */}
    </div>
  )
}
