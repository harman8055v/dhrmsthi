"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Crown, Star, Eye, Brain, Sparkles } from "lucide-react"

interface PricingOption {
  duration: string
  originalPrice: number
  price: number
  savings: string
  isRecommended?: boolean
}

interface PlanDetails {
  name: string
  emoji: string
  description: string
  color: string
  gradientFrom: string
  gradientTo: string
  pricing: {
    quarterly: PricingOption
    biannual: PricingOption
    yearly: PricingOption
  }
  features: string[]
}

interface PricingPopupProps {
  isOpen: boolean
  onClose: () => void
  planKey: string
  onSelectPlan: (planKey: string, billingCycle: "quarterly" | "biannual" | "yearly") => void
}

const planDetails: Record<string, PlanDetails> = {
  sparsh: {
    name: "Sparsh",
    emoji: "🤝",
    description: "Perfect for meaningful connections",
    color: "blue",
    gradientFrom: "blue-500",
    gradientTo: "blue-600",
    pricing: {
      quarterly: { duration: "3 months", originalPrice: 1497, price: 899, savings: "40%" },
      biannual: { duration: "6 months", originalPrice: 2994, price: 1599, savings: "47%", isRecommended: true },
      yearly: { duration: "1 year", originalPrice: 5988, price: 2899, savings: "52%" },
    },
    features: ["20 swipes per day", "Unlimited messaging", "View all matches", "Basic profile visibility"],
  },
  sangam: {
    name: "Sangam",
    emoji: "💫",
    description: "Enhanced features for deeper connections",
    color: "purple",
    gradientFrom: "purple-500",
    gradientTo: "pink-500",
    pricing: {
      quarterly: { duration: "3 months", originalPrice: 2397, price: 1499, savings: "37%" },
      biannual: { duration: "6 months", originalPrice: 4794, price: 2699, savings: "44%", isRecommended: true },
      yearly: { duration: "1 year", originalPrice: 9588, price: 4999, savings: "48%" },
    },
    features: [
      "50 swipes per day",
      "Everything in Sparsh",
      "5 Super Likes monthly",
      "See who likes you & match instantly",
      "Higher profile visibility",
      "AI Matching Analysis",
    ],
  },
  samarpan: {
    name: "Samarpan",
    emoji: "👑",
    description: "Premium experience with exclusive benefits",
    color: "yellow",
    gradientFrom: "yellow-500",
    gradientTo: "orange-500",
    pricing: {
      quarterly: { duration: "3 months", originalPrice: 3597, price: 2299, savings: "36%" },
      biannual: { duration: "6 months", originalPrice: 7194, price: 3999, savings: "44%", isRecommended: true },
      yearly: { duration: "1 year", originalPrice: 14388, price: 7499, savings: "48%" },
    },
    features: [
      "Unlimited swipes",
      "Everything in Sangam",
      "15 Super Likes monthly",
      "Highest profile visibility",
      "Priority customer support", 
      "Access to Elite verified profiles",
      "In-depth compatibility analysis",
      "Enhanced privacy controls",
      "Advanced AI Insights",
    ],
  },
}

export default function PricingPopup({ isOpen, onClose, planKey, onSelectPlan }: PricingPopupProps) {
  const [selectedBilling, setSelectedBilling] = useState<"quarterly" | "biannual" | "yearly">("biannual")
  const plan = planDetails[planKey]

  if (!plan) return null

  const calculateMonthlyPrice = (price: number, duration: string) => {
    if (duration === "3 months") return Math.round(price / 3)
    if (duration === "6 months") return Math.round(price / 6)
    if (duration === "1 year") return Math.round(price / 12)
    return price
  }

  const handleSelectPlan = () => {
    onSelectPlan(planKey, selectedBilling)
    onClose()
  }

  // Calculate maximum savings for this plan
  const getMaxSavings = () => {
    const savings = Object.values(plan.pricing).map(option => 
      parseInt(option.savings.replace('%', ''))
    )
    return Math.max(...savings)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full max-w-none max-h-none m-0 rounded-none overflow-y-auto p-0">
        <DialogTitle className="sr-only">Choose Your {plan.name} Plan</DialogTitle>
        <div className="flex flex-col h-full">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">Choose Your {plan.name} Plan</h2>
              <p className="text-gray-600 text-sm">{plan.description}</p>
            </div>
          </div>
          
          {/* Content area */}
          <div className="flex-1 p-4 bg-gray-50">
            {/* Single Limited Time Offer Banner */}
            <div className="relative bg-yellow-50 border-2 border-dashed border-yellow-400 rounded-lg mb-6 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-100/50 to-orange-100/50"></div>
              <div className="relative px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-orange-600 text-xs font-bold tracking-wide">🔥 LIMITED TIME OFFER 🔥</span>
                </div>
                <div className="text-lg font-bold text-orange-800">
                  Save up to {getMaxSavings()}%
                </div>
                <div className="text-xs text-orange-600 font-medium">
                  Don't miss out on these exclusive savings!
                </div>
              </div>
            </div>

            <div className="space-y-3">
          {Object.entries(plan.pricing).map(([billingKey, option]) => {
            const isSelected = selectedBilling === billingKey
            const monthlyPrice = calculateMonthlyPrice(option.price, option.duration)
            
            return (
              <Card
                key={billingKey}
                className={`relative cursor-pointer transition-all border-2 ${
                  isSelected
                    ? `border-${plan.color}-500 ring-2 ring-${plan.color}-200 shadow-lg`
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedBilling(billingKey as "quarterly" | "biannual" | "yearly")}
              >
                {option.isRecommended && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                      <Sparkles className="w-3 h-3 inline mr-1" />
                      Best Value
                    </div>
                  </div>
                )}
                
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isSelected ? `bg-${plan.color}-500 border-${plan.color}-500` : "border-gray-300"
                        } flex items-center justify-center`}>
                          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 whitespace-nowrap">{option.duration}</h3>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-gray-900">₹{option.price.toLocaleString()}</span>
                          <span className="text-sm text-gray-500 line-through">₹{option.originalPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            Save {option.savings}
                          </span>
                          <span className="text-xs text-gray-600">
                            ₹{monthlyPrice}/month
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Effective</div>
                      <div className="text-lg font-bold text-gray-900">₹{monthlyPrice}</div>
                      <div className="text-xs text-gray-500">/month</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
            })}
            </div>

            <div className="mt-6 p-4 bg-white rounded-lg shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <span className="text-base">{plan.emoji}</span>
                What's included:
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {plan.features.slice(0, 6).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
                {plan.features.length > 6 && (
                  <div className="text-sm text-gray-500 mt-2">
                    +{plan.features.length - 6} more features
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Fixed bottom buttons */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSelectPlan}
                className={`flex-1 bg-gradient-to-r from-${plan.gradientFrom} to-${plan.gradientTo} hover:from-${plan.color}-600 hover:to-${plan.color}-700 text-white font-semibold shadow-lg`}
              >
                Start {plan.name} Journey
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}