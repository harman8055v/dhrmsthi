"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAuthContext } from "@/components/auth-provider"
import { useProfile } from "@/hooks/use-profile"
import { toast } from "sonner"
import { Heart, Brain, Sparkles, Save, Info, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import MobileNav from "@/components/dashboard/mobile-nav"


export default function PreferencesPage() {
  const { user } = useAuthContext()
  const { profile, updateProfile } = useProfile()
  const [idealPartnerNotes, setIdealPartnerNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (profile?.ideal_partner_notes) {
      setIdealPartnerNotes(profile.ideal_partner_notes)
    }
  }, [profile])

  const handleSave = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      await updateProfile({ ideal_partner_notes: idealPartnerNotes })
      toast.success("Partner preferences updated successfully!")
    } catch (error) {
      toast.error("Failed to update preferences. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const wordCount = idealPartnerNotes.length
  const isComplete = wordCount >= 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <MobileNav userProfile={profile} />

      {/* Main Content with proper spacing to avoid overlap */}
      <main className="pb-40 px-4 min-h-screen">
        <div className="max-w-4xl w-full mx-auto px-2 sm:px-4">

          {/* AI Matching Info Alert */}
          <Alert className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <Brain className="h-5 w-5 text-purple-600" />
            <AlertDescription className="text-gray-700">
              <strong className="text-purple-700">Advanced AI Matching:</strong> Our intelligent system will analyze your requirements and suggest suitable profiles based on your response. The more detailed you are, the better matches you'll receive!
            </AlertDescription>
          </Alert>

          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-rose-500" />
                Describe Your Ideal Partner
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Share what you're looking for in a life partner - their values, qualities, lifestyle, and what kind of relationship you envision together.
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ideal-partner" className="text-base font-medium text-gray-700">
                    Partner Preferences & Relationship Goals
                  </Label>
                  <p className="text-sm text-gray-500 mt-1 mb-3">
                    Be specific about values, lifestyle, spiritual goals, personality traits, and relationship expectations.
                  </p>
                  <Textarea
                    id="ideal-partner"
                    value={idealPartnerNotes}
                    onChange={(e) => setIdealPartnerNotes(e.target.value)}
                    placeholder="I'm looking for someone who shares my spiritual values and believes in living a dharmic life. They should be kind, compassionate, and family-oriented. I value someone who..."
                    className="min-h-[200px] text-base leading-relaxed"
                    maxLength={2000}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-500">
                      {wordCount}/2000 characters
                    </p>
                    <div className="flex items-center gap-2">
                      {isComplete ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-sm font-medium">Great detail!</span>
                        </div>
                      ) : (
                        <span className="text-sm text-amber-600">
                          Add more detail for better AI matching
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Features Info */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    How AI Matching Works
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Analyzes your preferences against all user profiles</li>
                    <li>• Considers values, lifestyle, spiritual alignment, and goals</li>
                    <li>• Generates compatibility scores and detailed insights</li>
                    <li>• Provides personalized match explanations</li>
                    <li>• Continuously learns from your feedback and interactions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Tips */}
          <Card className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-600" />
                Tips for Better Matches
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <h5 className="font-medium mb-2">Be Specific About:</h5>
                  <ul className="space-y-1">
                    <li>• Spiritual practices and beliefs</li>
                    <li>• Family values and traditions</li>
                    <li>• Lifestyle preferences</li>
                    <li>• Communication style</li>
                    <li>• Future goals and aspirations</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Include Details On:</h5>
                  <ul className="space-y-1">
                    <li>• Deal-breakers and non-negotiables</li>
                    <li>• Relationship dynamics you prefer</li>
                    <li>• Cultural and social preferences</li>
                    <li>• Professional ambitions alignment</li>
                    <li>• Geographic and location preferences</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Save Button at the bottom */}
        <div className="max-w-4xl w-full mx-auto px-2 sm:px-4 mt-8">
          <Button
            onClick={handleSave}
            disabled={isLoading || !idealPartnerNotes.trim()}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-lg py-3 shadow-md hover:from-rose-600 hover:to-pink-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </main>
    </div>
  )
} 