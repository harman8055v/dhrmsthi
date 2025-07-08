"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, User, Heart, Briefcase, Users, Activity, Target, Check } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MobileNav from "@/components/dashboard/mobile-nav"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import LocationSelector, { type LocationFormState } from "@/components/location-selector"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

const SPIRITUAL_ORGANIZATIONS = [
  "ISKCON",
  "Art of Living",
  "Isha Foundation",
  "Brahma Kumaris",
  "Chinmaya Mission",
  "Ramakrishna Mission",
  "Satsang Foundation",
  "Radha Soami",
  "Osho International",
  "Ananda Marga",
  "Self-Realization Fellowship",
  "Transcendental Meditation",
  "Vipassana Meditation",
  "Arya Samaj",
  "RSS",
  "VHP",
  "Bharat Sevashram Sangha",
]

const DAILY_PRACTICES = [
  "Morning Prayer",
  "Evening Prayer",
  "Meditation",
  "Yoga",
  "Pranayama",
  "Mantra Chanting",
  "Scripture Reading",
  "Kirtan/Bhajan",
  "Seva (Service)",
  "Fasting",
  "Pilgrimage",
  "Satsang",
  "Japa",
  "Aarti",
  "Puja",
]

// Multi-Selection Component
const MultiSelectCard = ({
  options,
  values = [],
  onChange,
  className = "",
  maxHeight = "max-h-48",
}: {
  options: string[]
  values: string[]
  onChange: (values: string[]) => void
  className?: string
  maxHeight?: string
}) => {
  const toggleItem = (item: string) => {
    const newValues = values.includes(item) ? values.filter((v) => v !== item) : [...values, item]
    onChange(newValues)
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 gap-2 overflow-y-auto border rounded-lg p-3",
        maxHeight,
        className,
      )}
    >
      {options.map((option) => (
        <div
          key={option}
          onClick={() => toggleItem(option)}
          className={cn(
            "cursor-pointer rounded-md px-3 py-2 text-sm transition-all hover:shadow-sm",
            values.includes(option)
              ? "bg-orange-100 border border-orange-300 text-orange-800"
              : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="truncate">{option}</span>
            {values.includes(option) && <Check className="w-3 h-3 text-orange-600 ml-1 flex-shrink-0" />}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)

  // Location state
  const [locationState, setLocationState] = useState<LocationFormState>({
    country_id: null,
    state_id: null,
    city_id: null,
  })

  useEffect(() => {
    async function getProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/")
          return
        }

        // Fetch from users table using session user id
        const { data: profileData, error } = await supabase.from("users").select("*").eq("id", user.id).single()

        if (error) {
          console.error("Error fetching profile:", error)
          toast({
            title: "❌ Error",
            description: "Failed to load profile. Please try again.",
            variant: "destructive",
          })
          return
        }

        setProfile(profileData)

        // Set location state from profile data
        setLocationState({
          country_id: profileData.country_id || null,
          state_id: profileData.state_id || null,
          city_id: profileData.city_id || null,
        })

        setLoading(false)
      } catch (error) {
        console.error("Error:", error)
        toast({
          title: "❌ Error",
          description: "Failed to load profile. Please try again.",
          variant: "destructive",
        })
        router.push("/")
      }
    }

    getProfile()
  }, [router, toast])

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Only include fields that exist in the users table
      const updateData = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        full_name: profile.full_name,
        birthdate: profile.birthdate,
        gender: profile.gender,
        height_ft: profile.height_ft,
        height_in: profile.height_in,
        mother_tongue: profile.mother_tongue,
        marital_status: profile.marital_status,
        education: profile.education,
        profession: profile.profession,
        annual_income: profile.annual_income,
        diet: profile.diet,
        temple_visit_freq: profile.temple_visit_freq,
        vanaprastha_interest: profile.vanaprastha_interest,
        artha_vs_moksha: profile.artha_vs_moksha,
        spiritual_org: profile.spiritual_org,
        daily_practices: profile.daily_practices,
        favorite_spiritual_quote: profile.favorite_spiritual_quote,
        about_me: profile.about_me,
        ideal_partner_notes: profile.ideal_partner_notes,
        country_id: locationState.country_id,
        state_id: locationState.state_id,
        city_id: locationState.city_id,
        updated_at: new Date().toISOString(),
      }

      // Remove undefined/null values
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined && value !== null)
      )

      console.log("Updating profile with data:", cleanUpdateData)

      const { error } = await supabase
        .from("users")
        .update(cleanUpdateData)
        .eq("id", user.id)

      if (error) {
        console.error("Error updating profile:", error)
        throw new Error(`Failed to update profile: ${error.message}`)
      } else {
        toast({
          title: "✅ Success",
          description: "Profile updated successfully!",
          duration: 3000,
        })
        setShowSuccessAlert(true)
        setTimeout(() => setShowSuccessAlert(false), 4000)
        router.push("/dashboard/profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "❌ Error",
        description: `Failed to save changes. Please try again.`,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setSaving(false)
    }
  }

  const updateProfile = (field: string, value: any) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleLocationChange = (newLocation: LocationFormState) => {
    setLocationState(newLocation)
  }

  // Helper function to calculate age
  const calculateAge = (birthdate: string) => {
    if (!birthdate) return null
    const today = new Date()
    const birthDate = new Date(birthdate)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  if (loading) {
    return <>{require("./loading").default()}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <MobileNav userProfile={profile} />

      {showSuccessAlert && (
        <div className="fixed top-20 left-0 w-full z-50 flex justify-center">
          <div className="max-w-md w-full px-4">
            <Alert className="bg-green-50 border-green-200">
              <AlertTitle>Profile Saved</AlertTitle>
              <AlertDescription>Your changes have been saved successfully.</AlertDescription>
              <button
                className="absolute top-2 right-2 text-green-700 hover:text-green-900"
                onClick={() => setShowSuccessAlert(false)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </Alert>
          </div>
        </div>
      )}

      <main className="pt-24 pb-40 px-4 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Edit Profile</h1>
                <p className="text-sm text-gray-600">Update your profile information</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-orange-500 to-pink-500">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="spiritual">Spiritual</TabsTrigger>
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            {/* Personal Information */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={profile?.first_name || ""}
                        onChange={(e) => updateProfile("first_name", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={profile?.last_name || ""}
                        onChange={(e) => updateProfile("last_name", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="birthdate">Date of Birth</Label>
                      <Input
                        id="birthdate"
                        type="date"
                        value={profile?.birthdate || ""}
                        onChange={(e) => updateProfile("birthdate", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Select value={profile?.gender || ""} onValueChange={(value) => updateProfile("gender", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Height</Label>
                      <div className="flex gap-2">
                        <Select 
                          value={profile?.height_ft?.toString() || ""} 
                          onValueChange={(value) => updateProfile("height_ft", parseInt(value))}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Feet" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4">4'</SelectItem>
                            <SelectItem value="5">5'</SelectItem>
                            <SelectItem value="6">6'</SelectItem>
                            <SelectItem value="7">7'</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select 
                          value={profile?.height_in?.toString() || ""} 
                          onValueChange={(value) => updateProfile("height_in", parseInt(value))}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Inches" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i}"
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="mother_tongue">Mother Tongue</Label>
                      <Input
                        id="mother_tongue"
                        value={profile?.mother_tongue || ""}
                        onChange={(e) => updateProfile("mother_tongue", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="pt-4 border-t">
                    <LocationSelector
                      value={locationState}
                      onChange={handleLocationChange}
                      required={false}
                      showLabels={true}
                      defaultToIndia={false}
                    />
                  </div>

                  {/* Family & Background */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Family & Background
                    </h3>

                    <div>
                      <Label>Marital Status</Label>
                      <Select
                        value={profile?.marital_status || ""}
                        onValueChange={(value) => updateProfile("marital_status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select marital status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Never Married">Never Married</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                          <SelectItem value="Separated">Separated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="about_me">About Me</Label>
                    <Textarea
                      id="about_me"
                      rows={4}
                      value={profile?.about_me || ""}
                      onChange={(e) => updateProfile("about_me", e.target.value)}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Spiritual Information */}
            <TabsContent value="spiritual">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Spiritual Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Spiritual Preferences */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Diet Preference</Label>
                      <Select value={profile?.diet || ""} onValueChange={(value) => updateProfile("diet", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select diet preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                          <SelectItem value="Vegan">Vegan</SelectItem>
                          <SelectItem value="Eggetarian">Eggetarian</SelectItem>
                          <SelectItem value="Non-Vegetarian">Non-Vegetarian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Temple Visit Frequency</Label>
                      <Select
                        value={profile?.temple_visit_freq || ""}
                        onValueChange={(value) => updateProfile("temple_visit_freq", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Daily">Daily</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Rarely">Rarely</SelectItem>
                          <SelectItem value="Never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Vanaprastha Interest</Label>
                      <Select
                        value={profile?.vanaprastha_interest || ""}
                        onValueChange={(value) => updateProfile("vanaprastha_interest", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select interest" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="open">Open to it</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Life Philosophy</Label>
                      <Select
                        value={profile?.artha_vs_moksha || ""}
                        onValueChange={(value) => updateProfile("artha_vs_moksha", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select philosophy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Artha-focused">Artha-focused (Material success)</SelectItem>
                          <SelectItem value="Moksha-focused">Moksha-focused (Spiritual liberation)</SelectItem>
                          <SelectItem value="Balance">Balance of both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Multi-select sections */}
                  <div>
                    <Label>Spiritual Organizations</Label>
                    <MultiSelectCard
                      options={SPIRITUAL_ORGANIZATIONS}
                      values={profile?.spiritual_org || []}
                      onChange={(values) => updateProfile("spiritual_org", values)}
                    />
                  </div>

                  <div>
                    <Label>Daily Spiritual Practices</Label>
                    <MultiSelectCard
                      options={DAILY_PRACTICES}
                      values={profile?.daily_practices || []}
                      onChange={(values) => updateProfile("daily_practices", values)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="favorite_spiritual_quote">Favorite Spiritual Quote</Label>
                    <Textarea
                      id="favorite_spiritual_quote"
                      rows={3}
                      value={profile?.favorite_spiritual_quote || ""}
                      onChange={(e) => updateProfile("favorite_spiritual_quote", e.target.value)}
                      placeholder="Share a quote that inspires you..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Professional Information */}
            <TabsContent value="professional">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="education">Education</Label>
                      <Input
                        id="education"
                        value={profile?.education || ""}
                        onChange={(e) => updateProfile("education", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="profession">Profession</Label>
                      <Input
                        id="profession"
                        value={profile?.profession || ""}
                        onChange={(e) => updateProfile("profession", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Annual Income</Label>
                    <Select
                      value={profile?.annual_income || ""}
                      onValueChange={(value) => updateProfile("annual_income", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select annual income" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Less than ₹5,00,000">Less than ₹5,00,000</SelectItem>
                        <SelectItem value="₹5,00,000 - ₹10,00,000">₹5,00,000 - ₹10,00,000</SelectItem>
                        <SelectItem value="₹10,00,000 - ₹15,00,000">₹10,00,000 - ₹15,00,000</SelectItem>
                        <SelectItem value="₹15,00,000 - ₹25,00,000">₹15,00,000 - ₹25,00,000</SelectItem>
                        <SelectItem value="₹25,00,000 - ₹50,00,000">₹25,00,000 - ₹50,00,000</SelectItem>
                        <SelectItem value="₹50,00,000 - ₹75,00,000">₹50,00,000 - ₹75,00,000</SelectItem>
                        <SelectItem value="₹75,00,000 - ₹1,00,00,000">₹75,00,000 - ₹1,00,00,000</SelectItem>
                        <SelectItem value="More than ₹1,00,00,000">More than ₹1,00,00,000</SelectItem>
                        <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Partner Preferences */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    What You're Looking For
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">
                    Our AI matching system will use this description along with your profile to find compatible partners.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="ideal_partner_notes">Describe your ideal partner</Label>
                    <Textarea
                      id="ideal_partner_notes"
                      placeholder="Share what you're looking for in a life partner - values, qualities, lifestyle preferences, spiritual goals, etc. Be as detailed as you'd like, our AI will use this to find better matches for you."
                      value={profile?.ideal_partner_notes || ""}
                      onChange={(e) => updateProfile("ideal_partner_notes", e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      This helps our AI understand what matters most to you in a partner.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Bottom Save Button */}
          <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 h-12 text-lg font-semibold"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? "Saving Changes..." : "Save All Changes"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}


