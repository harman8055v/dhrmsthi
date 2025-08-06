"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, User, Heart, Briefcase, Users, Activity, Target, Check, Upload, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MobileNav from "@/components/dashboard/mobile-nav"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import LocationSelector, { type LocationFormState } from "@/components/location-selector"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

import { userService } from "@/lib/data-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import imageCompression from "browser-image-compression"
import PhotoCropUploader from '@/components/onboarding/photo-crop-uploader'

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

// Utility function to fetch location names by ID (no hooks)
async function getLocationDisplayString({ country_id, state_id, city_id }: { country_id: number | null, state_id: number | null, city_id: number | null }) {
  let country = "", state = "", city = "";
  if (country_id) {
    const { data } = await supabase.from("countries").select("name").eq("id", country_id).single();
    country = data?.name || "";
  }
  if (state_id) {
    const { data } = await supabase.from("states").select("name").eq("id", state_id).single();
    state = data?.name || "";
  }
  if (city_id) {
    const { data } = await supabase.from("cities").select("name").eq("id", city_id).single();
    city = data?.name || "";
  }
  return [city, state, country].filter(Boolean).join(", ") || "Not set";
}

export default function SettingsPage() {
  const { user, profile, loading, refreshProfile } = useAuthContext()
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  // Local editable state
  const [editable, setEditable] = useState<any>(profile)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [locationSaving, setLocationSaving] = useState(false)
  const [locationState, setLocationState] = useState<LocationFormState>({
    country_id: profile?.country_id ?? null,
    state_id: profile?.state_id ?? null,
    city_id: profile?.city_id ?? null,
  })
  const [locationDisplay, setLocationDisplay] = useState<string>("")

  // Helper to get location names from IDs
  useEffect(() => {
    getLocationDisplayString(locationState).then(setLocationDisplay)
  }, [locationState])

  useEffect(() => {
    setEditable(profile)
    setLocationState({
      country_id: profile?.country_id ?? null,
      state_id: profile?.state_id ?? null,
      city_id: profile?.city_id ?? null,
    })
  }, [profile])

  const handleSave = async () => {
    if (!editable || !user?.id) return
    setSaving(true)
    try {
      // Only include fields that exist in the users table
      const updateData = {
        first_name: editable.first_name,
        last_name: editable.last_name,
        full_name: editable.full_name,
        birthdate: editable.birthdate,
        gender: editable.gender,
        height_ft: editable.height_ft,
        height_in: editable.height_in,
        mother_tongue: editable.mother_tongue,
        marital_status: editable.marital_status,
        education: editable.education,
        profession: editable.profession,
        annual_income: editable.annual_income,
        diet: editable.diet,
        temple_visit_freq: editable.temple_visit_freq,
        vanaprastha_interest: editable.vanaprastha_interest,
        artha_vs_moksha: editable.artha_vs_moksha,
        spiritual_org: editable.spiritual_org,
        daily_practices: editable.daily_practices,
        favorite_spiritual_quote: editable.favorite_spiritual_quote,
        about_me: editable.about_me,
        ideal_partner_notes: editable.ideal_partner_notes,
        user_photos: editable.user_photos, // <-- ensure photos are saved
        country_id: locationState.country_id,
        state_id: locationState.state_id,
        city_id: locationState.city_id,
        updated_at: new Date().toISOString(),
      }
      // Remove undefined/null values
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined && value !== null)
      )
      // Actually update the profile in the backend
      // Persist changes
      await userService.updateProfile(cleanUpdateData)
      // Sync fresh profile into auth context so subsequent pages show updated data
      await refreshProfile()
      toast({
        title: "✅ Success",
        description: "Profile updated successfully!",
        duration: 3000,
      })
      setShowSuccessAlert(true)
      setTimeout(() => setShowSuccessAlert(false), 4000)
      router.push("/dashboard/profile")
    } catch (error) {
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

  const handleLocationSave = async () => {
    setLocationSaving(true)
    try {
      const updateData = {
        country_id: locationState.country_id,
        state_id: locationState.state_id,
        city_id: locationState.city_id,
        updated_at: new Date().toISOString(),
      }
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined && value !== null)
      )
      await userService.updateProfile(cleanUpdateData)
      await refreshProfile()
      setShowSuccessAlert(true)
      setTimeout(() => setShowSuccessAlert(false), 4000)
      setLocationModalOpen(false)
    } catch (error) {
      toast({
        title: "❌ Error",
        description: `Failed to save location. Please try again.`,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLocationSaving(false)
    }
  }

  const updateProfile = (field: string, value: any) => {
    setEditable((prev: any) => ({ ...prev, [field]: value }))
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

  if (loading || !editable) {
    return <>{require("./loading").default()}</>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
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

      <main className="pb-40 px-4 min-h-screen">
        <div className="max-w-4xl w-full mx-auto px-2 sm:px-4">

          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="flex w-full justify-between gap-1 rounded-xl bg-white shadow-sm border border-gray-200 p-1 mb-6">
              <TabsTrigger value="personal" className="flex-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-100 data-[state=active]:to-pink-100 data-[state=active]:text-orange-700 data-[state=active]:shadow">Personal</TabsTrigger>
              <TabsTrigger value="spiritual" className="flex-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-100 data-[state=active]:to-pink-100 data-[state=active]:text-orange-700 data-[state=active]:shadow">Spiritual</TabsTrigger>
              <TabsTrigger value="professional" className="flex-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-100 data-[state=active]:to-pink-100 data-[state=active]:text-orange-700 data-[state=active]:shadow">Professional</TabsTrigger>
              <TabsTrigger value="preferences" className="flex-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-100 data-[state=active]:to-pink-100 data-[state=active]:text-orange-700 data-[state=active]:shadow">Preferences</TabsTrigger>
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
                        value={editable?.first_name || ""}
                        onChange={(e) => updateProfile("first_name", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={editable?.last_name || ""}
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
                        value={editable?.birthdate || ""}
                        onChange={(e) => updateProfile("birthdate", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Select value={editable?.gender || ""} onValueChange={(value) => updateProfile("gender", value)}>
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
                          value={editable?.height_ft?.toString() || ""} 
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
                          value={editable?.height_in?.toString() || ""} 
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
                        value={editable?.mother_tongue || ""}
                        onChange={(e) => updateProfile("mother_tongue", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Location Section (Refactored) */}
                  <div className="pt-4 border-t">
                    <Label className="block mb-1">Location</Label>
                    <div className="flex items-center gap-4">
                      <span>{locationDisplay}</span>
                      <Button type="button" variant="outline" onClick={() => setLocationModalOpen(true)}>
                        Change Location
                      </Button>
                    </div>
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
                        value={editable?.marital_status || ""}
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
                      value={editable?.about_me || ""}
                      onChange={(e) => updateProfile("about_me", e.target.value)}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div className="space-y-2">
                    <PhotoCropUploader
                      photos={editable?.user_photos || []}
                      onChange={(urls) => {
                        setEditable((prev: any) => ({ ...prev, user_photos: urls }))
                        updateProfile('user_photos', urls)
                      }}
                      maxPhotos={6}
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
                      <Select value={editable?.diet || ""} onValueChange={(value) => updateProfile("diet", value)}>
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
                        value={editable?.temple_visit_freq || ""}
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
                        value={editable?.vanaprastha_interest || ""}
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
                        value={editable?.artha_vs_moksha || ""}
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
                      values={editable?.spiritual_org || []}
                      onChange={(values) => updateProfile("spiritual_org", values)}
                    />
                  </div>

                  <div>
                    <Label>Daily Spiritual Practices</Label>
                    <MultiSelectCard
                      options={DAILY_PRACTICES}
                      values={editable?.daily_practices || []}
                      onChange={(values) => updateProfile("daily_practices", values)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="favorite_spiritual_quote">Favorite Spiritual Quote</Label>
                    <Textarea
                      id="favorite_spiritual_quote"
                      rows={3}
                      value={editable?.favorite_spiritual_quote || ""}
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
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="education">Education</Label>
                      <Input
                        id="education"
                        value={editable?.education || ""}
                        onChange={(e) => updateProfile("education", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="profession">Profession</Label>
                      <Input
                        id="profession"
                        value={editable?.profession || ""}
                        onChange={(e) => updateProfile("profession", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Annual Income</Label>
                    <Select
                      value={editable?.annual_income || ""}
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
                      value={editable?.ideal_partner_notes || ""}
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
        </div>
        {/* Save Button at the bottom */}
        <div className="max-w-4xl w-full mx-auto px-2 sm:px-4 mt-8">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-lg py-3 shadow-md hover:from-orange-600 hover:to-pink-600"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
        {/* Location Modal */}
        <Dialog open={locationModalOpen} onOpenChange={setLocationModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Location</DialogTitle>
            </DialogHeader>
            <LocationSelector
              value={locationState}
              onChange={setLocationState}
              required={false}
              showLabels={true}
              defaultToIndia={false}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setLocationModalOpen(false)} disabled={locationSaving}>
                Cancel
              </Button>
              <Button onClick={handleLocationSave} disabled={locationSaving}>
                {locationSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
            <div className="mt-4 flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 flex-shrink-0 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
              <span>If the location is taking too long to load, please reload the page.</span>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}


