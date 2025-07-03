"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Brain, 
  Heart, 
  MapPin, 
  Sparkles, 
  TrendingUp, 
  Star,
  CheckCircle,
  AlertTriangle,
  Zap,
  Target,
  Lightbulb
} from "lucide-react"

export default function MatchingDemoPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'insights'>('overview')
  const [isAnimating, setIsAnimating] = useState(false)

  const demoCompatibility = {
    total: 94,
    breakdown: {
      spiritual: 96,
      lifestyle: 92,
      psychological: 88,
      demographic: 95,
      preference: 90,
      semantic: 85,
      growth_potential: 93
    },
    reasons: [
      "Both deeply connected to ISKCON community",
      "Share 3 core spiritual practices: Meditation, Yoga",
      "Both vegetarian with strong dietary alignment",
      "Same city - easy to meet and build relationship",
      "Similar life philosophy with spiritual growth focus"
    ],
    concerns: [
      "Different temple visit frequencies may need adjustment",
      "Arjun's 'Balance' vs Priya's 'Moksha-focused' approach"
    ],
    unique_strengths: [
      "ISKCON spiritual community bond",
      "Professional backgrounds that support spiritual life",
      "Geographic compatibility in Mumbai"
    ]
  }

  const categoryData = {
    spiritual: { name: 'Spiritual Harmony', icon: '🕉️', color: 'purple' },
    lifestyle: { name: 'Lifestyle Sync', icon: '🌱', color: 'green' },
    psychological: { name: 'Mindset Match', icon: '🧠', color: 'blue' },
    demographic: { name: 'Life Context', icon: '📍', color: 'orange' },
    preference: { name: 'Desire Alignment', icon: '💕', color: 'pink' },
    semantic: { name: 'Expression Harmony', icon: '💬', color: 'indigo' },
    growth_potential: { name: 'Future Growth', icon: '🌟', color: 'yellow' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI-Powered Matching Engine
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-6">
            Experience the most sophisticated spiritual compatibility analysis
          </p>
          <Button 
            onClick={() => setIsAnimating(!isAnimating)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3"
          >
            <Zap className="w-4 h-4 mr-2" />
            Analyze Match
          </Button>
        </motion.div>

        {/* Profile Comparison */}
        <motion.div 
          className="grid md:grid-cols-2 gap-6 mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Arjun Sharma</h3>
                  <p className="text-sm text-gray-600">28 • Software Engineer</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                Mumbai, Maharashtra
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Spiritual Organizations</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">ISKCON</Badge>
                  <Badge variant="secondary" className="text-xs">Art of Living</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Daily Practices</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">Meditation</Badge>
                  <Badge variant="outline" className="text-xs">Yoga</Badge>
                  <Badge variant="outline" className="text-xs">Chanting</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-pink-200 bg-pink-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                  P
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Priya Patel</h3>
                  <p className="text-sm text-gray-600">26 • Yoga Instructor</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                Mumbai, Maharashtra
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Spiritual Organizations</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">ISKCON</Badge>
                  <Badge variant="secondary" className="text-xs">Brahma Kumaris</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Daily Practices</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">Meditation</Badge>
                  <Badge variant="outline" className="text-xs">Yoga</Badge>
                  <Badge variant="outline" className="text-xs">Scripture Reading</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-200">
            <div className="flex gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: Target },
                { id: 'breakdown', label: 'Deep Analysis', icon: Brain },
                { id: 'insights', label: 'AI Insights', icon: Lightbulb }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    activeTab === tab.id 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto mb-4">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center mx-auto shadow-2xl">
                        <span className="text-4xl font-bold text-white">{demoCompatibility.total}%</span>
                      </div>
                      <div className="absolute -top-2 -right-2">
                        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                          <Star className="w-4 h-4 text-yellow-900" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Exceptional Match!
                  </CardTitle>
                  <p className="text-lg text-gray-600">
                    This pairing shows extraordinary spiritual and lifestyle compatibility
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-green-50 rounded-2xl border border-green-200">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
                      <h4 className="font-bold text-green-800 mb-2">Perfect Spiritual Sync</h4>
                      <p className="text-sm text-green-700">Shared ISKCON community and meditation practices</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-2xl border border-blue-200">
                      <Heart className="w-8 h-8 text-blue-600 mx-auto mb-3" />  
                      <h4 className="font-bold text-blue-800 mb-2">Lifestyle Harmony</h4>
                      <p className="text-sm text-blue-700">Compatible daily routines and life patterns</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-2xl border border-purple-200">
                      <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                      <h4 className="font-bold text-purple-800 mb-2">Growth Potential</h4>
                      <p className="text-sm text-purple-700">Excellent foundation for spiritual evolution together</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'breakdown' && (
            <motion.div
              key="breakdown"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-center">
                    Detailed Compatibility Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.entries(demoCompatibility.breakdown).map(([category, score]) => {
                      const data = categoryData[category as keyof typeof categoryData]
                      return (
                        <motion.div 
                          key={category}
                          className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{data.icon}</span>
                              <div>
                                <h4 className="font-bold text-gray-900">{data.name}</h4>
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full font-bold text-sm ${
                              score >= 90 ? 'bg-green-100 text-green-800' :
                              score >= 80 ? 'bg-blue-100 text-blue-800' :
                              score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {score}%
                            </div>
                          </div>
                          <Progress value={score} className="h-3" />
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-green-800">
                    <CheckCircle className="w-6 h-6" />
                    Why This Match Works
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {demoCompatibility.reasons.map((reason, index) => (
                      <motion.div 
                        key={index}
                        className="flex items-start gap-3 p-3 bg-white/60 rounded-xl"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-green-600 text-sm">✓</span>
                        </div>
                        <p className="text-sm text-gray-700">{reason}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-purple-800">
                    <Sparkles className="w-6 h-6" />
                    Unique Match Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {demoCompatibility.unique_strengths.map((strength, index) => (
                      <motion.span 
                        key={index}
                        className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-sm font-medium border border-purple-200"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.2 }}
                      >
                        {strength}
                      </motion.span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-50 to-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-yellow-800">
                    <AlertTriangle className="w-6 h-6" />
                    Things to Consider
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {demoCompatibility.concerns.map((concern, index) => (
                      <motion.div 
                        key={index}
                        className="flex items-start gap-3 p-3 bg-white/60 rounded-xl"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.2 }}
                      >
                        <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-yellow-600 text-sm">!</span>
                        </div>
                        <p className="text-sm text-gray-700">{concern}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA Section */}
        <motion.div 
          className="text-center mt-12 p-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl shadow-2xl text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <h3 className="text-2xl font-bold mb-4">Experience Next-Generation Spiritual Matching</h3>
          <p className="text-lg mb-6 opacity-90">
            Join thousands finding their divine life partners through AI-powered compatibility analysis
          </p>
          <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 font-bold px-8 py-3">
            Start Your Journey
          </Button>
        </motion.div>
      </div>
    </div>
  )
} 