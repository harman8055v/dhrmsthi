"use client"

import { useState } from "react"
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
  Zap,
  ShoppingBag,
  CreditCard,
} from "lucide-react"
import MobileNav from "@/components/dashboard/mobile-nav"
import PaymentModal from "@/components/payment/payment-modal"
// Toaster not used directly in this page

const superLikePackages = [
  { count: 4, price: 199, popular: false },
  { count: 10, price: 399, popular: true },
  { count: 40, price: 999, popular: false },
]

const boostPackages = [
  { count: 1, price: 89, popular: false },
  { count: 5, price: 399, popular: true },
  { count: 12, price: 799, popular: false },
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
  const router = useRouter()

  const openPaymentModal = (item: any) => {
    setPaymentModal({ isOpen: true, item })
  }

  const closePaymentModal = () => {
    setPaymentModal({ isOpen: false, item: null })
  }

  const handlePaymentSuccess = () => {
    // Refresh profile data so credits/status update instantly
    refreshProfile()
  }

  // Removed local Supabase fetch – data comes from context

  if (loading) {
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
      monthly: { price: 299, duration: "month" },
      quarterly: { price: 749, duration: "3 months", savings: "17%" },
    },
    sangam: {
      monthly: { price: 499, duration: "month" },
      quarterly: { price: 1299, duration: "3 months", savings: "13%" },
    },
    samarpan: {
      monthly: { price: 999, duration: "month" },
      quarterly: { price: 2499, duration: "3 months", savings: "17%" },
    },
    elite: {
      monthly: { price: 19900, duration: "month" },
      quarterly: { price: 44900, duration: "3 months", savings: "25%" },
    },
  }

  const handlePlanSelection = (planKey: string, billingCycle: "monthly" | "quarterly") => {
    const planNames = {
      sparsh: "Sparsh Plan",
      sangam: "Sangam Plan",
      samarpan: "Samarpan Plan",
      elite: "Elite Membership",
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
        "5 Profile Boosts monthly",
        "Highest profile visibility",
        "Priority customer support",
      ],
      elite: [
        "Access to Elite verified profiles",
        "Priority support",
        "Exclusive spiritual events & retreats",
        "In-depth compatibility analysis",
        "Enhanced privacy controls",
        "100% confidentiality guaranteed",
      ],
    }

    const features = [...planFeatures[planKey as keyof typeof planFeatures]]
    if (billingCycle === "quarterly") {
      features.push(`Save ${planPricing[planKey as keyof typeof planPricing].quarterly.savings} compared to monthly`)
    }

    openPaymentModal({
      type: "plan",
      name: `${planNames[planKey as keyof typeof planNames]} (${billingCycle === "monthly" ? "1 month" : "3 months"})`,
      price: planPricing[planKey as keyof typeof planPricing][billingCycle].price,
      description: `${billingCycle === "monthly" ? "1 month" : "3 months"} of ${planNames[planKey as keyof typeof planNames]} access`,
      features,
      user_id: user?.id || "",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <MobileNav userProfile={profile} />

      {/* Main Content with proper spacing to avoid overlap */}
      <main className="pt-20 pb-40 px-4 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mt-10 mb-8">
            <div className="mx-auto max-w-2xl rounded-xl bg-white shadow-lg border border-gray-100 p-7 flex flex-col items-center relative" style={{borderBottom: '4px solid #e6c200'}}>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#fffbe6] border border-[#e6c200]">
                  <ShoppingBag className="w-5 h-5 text-[#8b0000]" />
                </span>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{fontFamily:'Inter, sans-serif'}}>DharmaSaathi Store</h1>
              </div>
              <p className="text-sm text-gray-500 mb-3 text-center">Enhance your journey with premium features</p>
              <div className="flex flex-wrap justify-center gap-2 text-xs mb-4">
                <div className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200 text-gray-800 font-medium">Super Likes: <span className="text-orange-600 font-semibold">{profile?.super_likes_count || 0}</span></div>
                <div className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200 text-gray-800 font-medium">Profile Boosts: <span className="text-pink-600 font-semibold">{(profile as any)?.profile_boosts_count || 0}</span></div>
                {profile?.account_status === "premium" && (
                  <div className="bg-yellow-50 text-yellow-800 px-3 py-1 rounded-full border border-yellow-200 flex items-center gap-1 font-medium">
                    <Crown className="w-3 h-3 inline" /> Premium
                  </div>
                )}
                {profile?.account_status === "elite" && (
                  <div className="bg-gradient-to-r from-yellow-100 to-yellow-300 text-yellow-900 px-3 py-1 rounded-full border border-yellow-300 flex items-center gap-1 font-medium">
                    <Diamond className="w-3 h-3 inline" /> Elite
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
                    const el = document.getElementById('elite-section');
                    if (el) {
                      const y = el.getBoundingClientRect().top + window.pageYOffset - 100;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-1 py-5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-base shadow-lg border-none hover:from-pink-500 hover:to-indigo-500 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
                >
                  <Diamond className="w-7 h-7 mb-1" />
                  Elite Plan
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
                <button
                  onClick={() => {
                    const el = document.getElementById('boosts-section');
                    if (el) {
                      const y = el.getBoundingClientRect().top + window.pageYOffset - 100;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-1 py-5 rounded-2xl bg-[#e25822] text-white font-bold text-base shadow-md hover:bg-[#ff944d] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#e6c200] focus:ring-offset-2"
                >
                  <Zap className="w-7 h-7 mb-1" />
                  Profile Boosts
                </button>
              </div>
            </div>
          </div>

          {/* Premium Plans */}
          <div id="plans-section" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Choose Your Plan</h2>

            {/* Free Plan - Drishti */}
            <div className="mb-6">
              <Card className="relative overflow-hidden border-2 border-gray-200 bg-gray-50">
                <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-sm font-bold">👁️</span>
                      </div>
                      Drishti Plan
                    </CardTitle>
                    <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">Current Plan</div>
                  </div>
                  <div className="text-3xl font-bold">
                    Free<span className="text-lg font-normal">/forever</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>5 swipes per day</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>View your matches</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-5 h-5 text-red-500">✕</span>
                      <span className="text-gray-500">Messaging (upgrade required)</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Basic profile features</span>
                    </li>
                  </ul>
                  <Button disabled className="w-full bg-gray-400">
                    Current Plan
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Paid Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sparsh Plan */}
              <Card className="relative overflow-hidden border-2 border-blue-200 hover:border-blue-300 transition-colors">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-sm font-bold">🤝</span>
                    </div>
                    Sparsh Plan
                  </CardTitle>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">₹{planPricing.sparsh.monthly.price}</span>
                      <span className="text-sm opacity-80">/month</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold">₹{planPricing.sparsh.quarterly.price}</span>
                      <span className="text-xs opacity-80">/3 months</span>
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        Save {planPricing.sparsh.quarterly.savings}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>20 swipes per day</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Unlimited messaging</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>View all matches</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Basic profile visibility</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-5 h-5 text-red-500">✕</span>
                      <span className="text-gray-500">AI Matching Analysis (upgrade required)</span>
                    </li>
                  </ul>
                  <div className="space-y-2">
                    <Button
                      onClick={() => handlePlanSelection("sparsh", "monthly")}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      disabled={profile?.account_status === "premium" || profile?.account_status === "elite"}
                    >
                      {profile?.account_status === "premium" || profile?.account_status === "elite"
                        ? "Already Premium"
                        : "Monthly - ₹299"}
                    </Button>
                    <Button
                      onClick={() => handlePlanSelection("sparsh", "quarterly")}
                      variant="outline"
                      className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                      disabled={profile?.account_status === "premium" || profile?.account_status === "elite"}
                    >
                      {profile?.account_status === "premium" || profile?.account_status === "elite"
                        ? "Already Premium"
                        : "Quarterly - ₹749"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Sangam Plan */}
              <Card className="relative overflow-hidden border-2 border-purple-200 hover:border-purple-300 transition-colors">
                <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-400 to-pink-400 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Popular
                </div>
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-sm font-bold">💫</span>
                    </div>
                    Sangam Plan
                  </CardTitle>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">₹{planPricing.sangam.monthly.price}</span>
                      <span className="text-sm opacity-80">/month</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold">₹{planPricing.sangam.quarterly.price}</span>
                      <span className="text-xs opacity-80">/3 months</span>
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        Save {planPricing.sangam.quarterly.savings}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>50 swipes per day</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Everything in Sparsh</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span>5 Super Likes monthly</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-purple-500" />
                      <span>See who likes you & match instantly</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      <span>5 Message Highlights monthly</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Higher profile visibility</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Search className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">
                        <span className="text-blue-600">AI Matching Analysis</span> 🔍
                      </span>
                    </li>
                  </ul>
                  <div className="space-y-2">
                    <Button
                      onClick={() => handlePlanSelection("sangam", "monthly")}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      disabled={profile?.account_status === "premium" || profile?.account_status === "elite"}
                    >
                      {profile?.account_status === "premium" || profile?.account_status === "elite"
                        ? "Already Premium"
                        : "Monthly - ₹499"}
                    </Button>
                    <Button
                      onClick={() => handlePlanSelection("sangam", "quarterly")}
                      variant="outline"
                      className="w-full border-purple-500 text-purple-600 hover:bg-purple-50"
                      disabled={profile?.account_status === "premium" || profile?.account_status === "elite"}
                    >
                      {profile?.account_status === "premium" || profile?.account_status === "elite"
                        ? "Already Premium"
                        : "Quarterly - ₹1299"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Samarpan Plan */}
              <Card className="relative overflow-hidden border-2 border-gold-200 hover:border-gold-300 transition-colors">
                <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Premium
                </div>
                <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-6 h-6" />
                    Samarpan Plan
                  </CardTitle>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">₹{planPricing.samarpan.monthly.price}</span>
                      <span className="text-sm opacity-80">/month</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold">₹{planPricing.samarpan.quarterly.price}</span>
                      <span className="text-xs opacity-80">/3 months</span>
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        Save {planPricing.samarpan.quarterly.savings}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Unlimited swipes</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Everything in Sangam</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span>15 Super Likes monthly</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      <span>5 Profile Boosts monthly</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      <span>Highest profile visibility</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Priority customer support</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Search className="w-5 h-5 text-blue-500" />
                      <span>AI Matching Analysis</span>
                    </li>
                    <li className="flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-2 -m-2">
                      <Brain className="w-5 h-5 text-indigo-600" />
                      <span className="font-medium">
                        <span className="text-indigo-600">Advanced AI Insights</span> 🧠
                      </span>
                    </li>
                  </ul>
                  <div className="space-y-2">
                    <Button
                      onClick={() => handlePlanSelection("samarpan", "monthly")}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                      disabled={profile?.account_status === "premium" || profile?.account_status === "elite"}
                    >
                      {profile?.account_status === "premium" || profile?.account_status === "elite"
                        ? "Already Premium"
                        : "Monthly - ₹999"}
                    </Button>
                    <Button
                      onClick={() => handlePlanSelection("samarpan", "quarterly")}
                      variant="outline"
                      className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                      disabled={profile?.account_status === "premium" || profile?.account_status === "elite"}
                    >
                      {profile?.account_status === "premium" || profile?.account_status === "elite"
                        ? "Already Premium"
                        : "Quarterly - ₹2499"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Elite Plan */}
          <div id="elite-section" className="mb-16">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-10 rounded-xl"></div>
              <Card className="relative overflow-hidden border-2 border-indigo-300 shadow-xl bg-gradient-to-r from-white to-indigo-50">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-500 to-purple-600 opacity-10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                <div className="absolute top-6 left-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  <div className="flex items-center gap-2">
                    <Diamond className="w-4 h-4" />
                    <span>Exclusive</span>
                  </div>
                </div>

                <CardHeader className="pt-16 pb-8 text-center">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <Diamond className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-gray-900 mb-2">Elite Membership</CardTitle>
                  <p className="text-gray-600 max-w-md mx-auto">
                    For discerning individuals seeking the perfect spiritual partner with verified credentials
                  </p>

                  <div className="mt-6 space-y-2">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                        ₹{planPricing.elite.monthly.price}
                      </span>
                      <span className="text-lg text-gray-600">/month</span>
                    </div>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                        ₹{planPricing.elite.quarterly.price}
                      </span>
                      <span className="text-sm text-gray-600">/3 months</span>
                      <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                        Save {planPricing.elite.quarterly.savings}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-6 pb-8">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-indigo-200 mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                      Elite Verification Standards
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Income Verified</h4>
                          <p className="text-sm text-gray-600">Members with verified high income status (₹1Cr+/year)</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Family Verified</h4>
                          <p className="text-sm text-gray-600">Background checks on family history and reputation</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Location Verified</h4>
                          <p className="text-sm text-gray-600">
                            Verified addresses in premium neighborhoods and cities
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <FileCheck className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Credit Score Verified</h4>
                          <p className="text-sm text-gray-600">
                            Financial responsibility and creditworthiness verified
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Exclusive Benefits</h3>
                      <ul className="space-y-3">
                        <li className="flex items-center gap-3">
                          <BadgeCheck className="w-5 h-5 text-indigo-600" />
                          <span>Access to Elite verified profiles only</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <Headphones className="w-5 h-5 text-indigo-600" />
                          <span>Priority support</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <Award className="w-5 h-5 text-indigo-600" />
                          <span>Exclusive spiritual events & retreats</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <Gem className="w-5 h-5 text-indigo-600" />
                          <span>In-depth compatibility analysis</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <Lock className="w-5 h-5 text-indigo-600" />
                          <span>Enhanced privacy controls</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Divine Combination</h3>
                      <blockquote className="text-sm text-gray-700 italic mb-3">
                        "Finding a partner with both material and spiritual wellbeing is a true blessing. Join our Elite
                        membership to start a life of this divine combination."
                      </blockquote>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
                      <div className="flex items-center justify-center gap-2 text-green-800 mb-2">
                        <Shield className="w-5 h-5" />
                        <span className="font-semibold">100% Confidentiality Guaranteed</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Your privacy is our priority. All verifications are conducted with utmost discretion.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={() => handlePlanSelection("elite", "monthly")}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                        disabled={profile?.account_status === "elite"}
                      >
                        {profile?.account_status === "elite" ? (
                          <>
                            <Diamond className="w-5 h-5 mr-2" />
                            Elite Active
                          </>
                        ) : (
                          <>
                            <Diamond className="w-5 h-5 mr-2" />
                            Monthly - ₹19,900
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handlePlanSelection("elite", "quarterly")}
                        variant="outline"
                        className="w-full border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 py-3 text-lg font-semibold"
                        disabled={profile?.account_status === "elite"}
                      >
                        {profile?.account_status === "elite" ? (
                          <>
                            <Diamond className="w-5 h-5 mr-2" />
                            Elite Active
                          </>
                        ) : (
                          <>
                            <Diamond className="w-5 h-5 mr-2" />
                            Quarterly - ₹44,900
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Super Likes & Profile Boosts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
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

            {/* Profile Boosts */}
            <div id="boosts-section">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Profile Boosts 🚀</h2>
              <div className="space-y-4">
                {boostPackages.map((pkg, index) => (
                  <Card
                    key={index}
                    className={`relative overflow-hidden border-2 transition-colors rounded-2xl ${
                      pkg.popular
                        ? "border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50"
                        : "border-gray-200 hover:border-yellow-200"
                    }`}
                  >
                    <CardContent className={`p-6`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{pkg.count} Profile Boost{pkg.count > 1 ? 's' : ''}</h3>
                          <p className="text-gray-600">Get noticed by more people for 1 hour</p>
                        </div>
                        <div className="flex flex-col items-end">
                          {pkg.popular && (
                            <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-0.5 rounded-full text-xs font-semibold mb-1 shadow-sm align-middle">Popular</div>
                          )}
                          <div className="text-2xl font-bold text-gray-900">₹{pkg.price}</div>
                          <Button
                            onClick={() =>
                              openPaymentModal({
                                type: "profile_boosts",
                                name: `${pkg.count} Profile Boost${pkg.count > 1 ? 's' : ''}`,
                                price: pkg.price,
                                description: `${pkg.count} Profile Boost${pkg.count > 1 ? 's' : ''} to increase your profile visibility for 1 hour each` ,
                                features: [
                                  "Appear at the top of Discover for 1 hour",
                                  "Get up to 5x more views",
                                  "Boosted badge on your profile",
                                ],
                                user_id: user?.id || "",
                              })
                            }
                            className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-orange-500 hover:to-yellow-400 text-white font-semibold px-6 py-2 rounded-lg shadow-md mt-2 border-none"
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

      {/* Toaster not used directly in this page */}
    </div>
  )
}
