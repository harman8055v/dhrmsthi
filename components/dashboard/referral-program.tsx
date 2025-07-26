"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Users, Copy, CheckCircle, Gift, Zap, Crown, Share2, Clock } from "lucide-react"
import { useAuthContext } from "@/components/auth-provider"

interface ReferralProgramProps {
  userId: string
  userProfile: any
}

export function ReferralProgram({ userId, userProfile }: ReferralProgramProps) {
  const [referralCode, setReferralCode] = useState<string>("")
  const [referralStats, setReferralStats] = useState({
    total_referrals: 0,
    successful_referrals: 0,
    pending_referrals: 0,
  })
  const [copied, setCopied] = useState(false)
  const [rewards, setRewards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const { refreshProfile } = useAuthContext()

  useEffect(() => {
    fetchReferralData()
  }, [userId])

  const fetchReferralData = async () => {
    try {
      setError("")

      // First, check if referral columns exist by trying to fetch them
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("referral_code, referral_count, fast_track_verification")
        .eq("id", userId)
        .single()

      if (userError) {
        // If columns don't exist, we'll handle it gracefully
        if (userError.message?.includes("column") && userError.message?.includes("does not exist")) {
          setError("Referral system is being set up. Please refresh the page in a moment.")
          setLoading(false)
          return
        }
        throw userError
      }

      // Generate referral code if it doesn't exist
      let currentReferralCode = userData.referral_code
      if (!currentReferralCode) {
        currentReferralCode = await generateReferralCode()

        // Update user with new referral code
        const { error: updateError } = await supabase
          .from("users")
          .update({ referral_code: currentReferralCode })
          .eq("id", userId)

        if (updateError) {
        } else {
          await refreshProfile()
        }
      }

      setReferralCode(currentReferralCode || "")

      // Get referral statistics - check which column exists
      let referralsData = null
      let referralsError = null

      // Try with referred_id first (newer structure)
      const { data: data1, error: error1 } = await supabase
        .from("referrals")
        .select("*, referred:users!referrals_referred_id_fkey(verification_status)")
        .eq("referrer_id", userId)

      if (!error1) {
        referralsData = data1
      } else {
        // Try with referred_user_id (older structure)
        const { data: data2, error: error2 } = await supabase
          .from("referrals")
          .select("*, referred:users!referrals_referred_user_id_fkey(verification_status)")
          .eq("referrer_id", userId)
        
        if (!error2) {
          referralsData = data2
        } else {
          referralsError = error2
        }
      }

      if (!referralsError && referralsData) {
        const totalReferrals = referralsData.length
        const successfulReferrals = referralsData.filter(
          (r) => r.status === "completed" && r.referred?.verification_status === "verified",
        ).length
        const pendingReferrals = referralsData.filter(
          (r) => r.status === "pending" || (r.status === "completed" && r.referred?.verification_status !== "verified"),
        ).length

        setReferralStats({
          total_referrals: totalReferrals,
          successful_referrals: successfulReferrals,
          pending_referrals: pendingReferrals,
        })
      }

      // Get user's rewards - check which column exists
      let rewardsData = null
      let rewardsError = null

      // Try with user_id first (newer structure)
      const { data: rewards1, error: rewardsError1 } = await supabase
        .from("referral_rewards")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")

      if (!rewardsError1) {
        rewardsData = rewards1
      } else {
        // Try with referrer_id (older structure)
        const { data: rewards2, error: rewardsError2 } = await supabase
          .from("referral_rewards")
          .select("*")
          .eq("referrer_id", userId)
          .eq("status", "active")
        
        if (!rewardsError2) {
          rewardsData = rewards2
        } else {
          rewardsError = rewardsError2
        }
      }

      if (!rewardsError) {
        setRewards(rewardsData || [])
      }

      setLoading(false)
    } catch (error: any) {
      setError("Unable to load referral data. Please try refreshing the page.")
      setLoading(false)
    }
  }

  const generateReferralCode = async (): Promise<string> => {
    // Generate a simple referral code based on user ID and timestamp
    const timestamp = Date.now().toString(36)
    const userIdShort = userId.slice(-4)
    return `${userIdShort}${timestamp}`.toUpperCase().slice(0, 8)
  }

  const generateReferralLink = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://dharmasaathi.com"
    return `${baseUrl}?ref=${referralCode}`
  }

  const copyReferralLink = async () => {
    const link = generateReferralLink()
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = link
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareReferralLink = async () => {
    const link = generateReferralLink()
    const text = `Join me on DharmaSaathi - India's premier spiritual matrimony platform! 🕉️ Find your spiritual life partner.`

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join DharmaSaathi - Find Your Spiritual Life Partner",
          text: text,
          url: link,
        })
      } catch (error) {
        copyReferralLink()
      }
    } else {
      copyReferralLink()
    }
  }

  const getProgressForLevel = (level: number) => {
    const { successful_referrals } = referralStats
    switch (level) {
      case 1: // Fast Track (4 referrals)
        return Math.min((successful_referrals / 4) * 100, 100)
      case 2: // Sangam Plan (10 referrals)
        return Math.min((successful_referrals / 10) * 100, 100)
      case 3: // Samarpan Plan (20 referrals)
        return Math.min((successful_referrals / 20) * 100, 100)
      default:
        return 0
    }
  }

  const getRewardStatus = (requiredReferrals: number) => {
    const { successful_referrals } = referralStats
    if (successful_referrals >= requiredReferrals) {
      return "unlocked"
    } else if (successful_referrals >= requiredReferrals * 0.5) {
      return "progress"
    } else {
      return "locked"
    }
  }

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-orange-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-xl p-4 sm:p-6 shadow-lg border border-purple-200">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Referral Program</h3>
            <p className="text-sm sm:text-base text-gray-700 mb-4">
              The referral system database needs to be initialized.
            </p>
          </div>
        </div>

        <div className="bg-white/70 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Database Setup Required</span>
          </div>
          <p className="text-xs text-gray-600 mb-3">
            Please run the SQL script:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
              scripts/create-referrals-table-simple.sql
            </code>
          </p>
        </div>

        <div className="text-center">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            Refresh After Setup
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-xl p-4 sm:p-6 shadow-lg border border-purple-200">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Referral Program</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-2">
            <strong className="text-orange-600">🚀 Your Key to Faster Verification!</strong>
          </p>
          <p className="text-xs sm:text-sm text-gray-600 mb-4">
            Invite friends to unlock exclusive benefits and fast-track your approval process.
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{referralStats.total_referrals}</div>
          <div className="text-xs text-gray-600">Total Referrals</div>
        </div>
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{referralStats.successful_referrals}</div>
          <div className="text-xs text-gray-600">Successful</div>
        </div>
        <div className="bg-white/70 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-600">{referralStats.pending_referrals}</div>
          <div className="text-xs text-gray-600">Pending</div>
        </div>
      </div>

      {/* Key Benefits Highlight */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-orange-600" />
          <h4 className="font-bold text-orange-800">Why Refer Friends?</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-gray-700">Fast-track your verification</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-gray-700">Boost your credibility score</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-gray-700">Unlock premium features</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-gray-700">Priority customer support</span>
          </div>
        </div>
      </div>

      {/* Reward Levels */}
      <div className="space-y-4 mb-6">
        {/* Level 1: Fast Track Verification */}
        <div
          className={`p-4 rounded-lg border-2 transition-all ${
            getRewardStatus(4) === "unlocked"
              ? "bg-green-50 border-green-200"
              : getRewardStatus(4) === "progress"
                ? "bg-orange-50 border-orange-200"
                : "bg-orange-50 border-orange-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className={`w-5 h-5 ${getRewardStatus(4) === "unlocked" ? "text-green-600" : "text-orange-600"}`} />
              <span className="font-semibold text-orange-800">🎯 Fast Track Verification</span>
            </div>
            <span className="text-sm font-bold text-orange-600">{referralStats.successful_referrals}/4</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                getRewardStatus(4) === "unlocked" ? "bg-green-500" : "bg-orange-500"
              }`}
              style={{ width: `${getProgressForLevel(1)}%` }}
            ></div>
          </div>
          <p className="text-xs text-orange-700 font-medium">✨ Priority review for faster profile approval - Get verified in days, not weeks!</p>
        </div>

        {/* Level 2: Sangam Plan */}
        <div
          className={`p-4 rounded-lg border-2 transition-all ${
            getRewardStatus(10) === "unlocked"
              ? "bg-green-50 border-green-200"
              : getRewardStatus(10) === "progress"
                ? "bg-blue-50 border-blue-200"
                : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Gift className={`w-5 h-5 ${getRewardStatus(10) === "unlocked" ? "text-green-600" : "text-gray-500"}`} />
              <span className="font-semibold">1 Month Sangam Plan</span>
            </div>
            <span className="text-sm font-bold">{referralStats.successful_referrals}/10</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                getRewardStatus(10) === "unlocked" ? "bg-green-500" : "bg-blue-500"
              }`}
              style={{ width: `${getProgressForLevel(2)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600">Premium features for 30 days absolutely free</p>
        </div>

        {/* Level 3: Samarpan Plan */}
        <div
          className={`p-4 rounded-lg border-2 transition-all ${
            getRewardStatus(20) === "unlocked"
              ? "bg-green-50 border-green-200"
              : getRewardStatus(20) === "progress"
                ? "bg-blue-50 border-blue-200"
                : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Crown className={`w-5 h-5 ${getRewardStatus(20) === "unlocked" ? "text-green-600" : "text-gray-500"}`} />
              <span className="font-semibold">45 Days Samarpan Plan</span>
            </div>
            <span className="text-sm font-bold">{referralStats.successful_referrals}/20</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                getRewardStatus(20) === "unlocked" ? "bg-green-500" : "bg-blue-500"
              }`}
              style={{ width: `${getProgressForLevel(3)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600">Premium+ features for 45 days with exclusive benefits</p>
        </div>
      </div>

      {/* Referral Link Section */}
      {referralCode && (
        <div className="bg-white/70 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Your Referral Link</h4>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 p-2 bg-gray-100 rounded-md text-sm text-gray-700 font-mono break-all">
              {generateReferralLink()}
            </div>
            <div className="flex gap-2">
              <Button onClick={copyReferralLink} size="sm" variant="outline" className="flex-1 sm:flex-none">
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                onClick={shareReferralLink}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex-1 sm:flex-none"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-3">
          Share with friends, family, and your spiritual community to unlock exclusive benefits!
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            onClick={() => window.location.href = "/dashboard/referrals"}
            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
          >
            <Users className="w-4 h-4 mr-2" />
            View Full Referral Program
          </Button>
          <Button
            onClick={shareReferralLink}
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-50"
            disabled={!referralCode}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Quick Share
          </Button>
        </div>
      </div>

      {/* Active Rewards Display */}
      {rewards.length > 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-yellow-600" />
            <h4 className="font-semibold text-yellow-800">Active Rewards</h4>
          </div>
          <div className="space-y-2">
            {rewards.map((reward) => (
              <div key={reward.id} className="flex items-center justify-between text-sm">
                <span className="text-yellow-700">
                  {reward.reward_type === "fast_track_verification" && "Fast Track Verification"}
                  {reward.reward_type === "sangam_plan_free" && "1 Month Sangam Plan"}
                  {reward.reward_type === "samarpan_plan_free" && "45 Days Samarpan Plan"}
                </span>
                <div className="flex items-center gap-1 text-yellow-600">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">
                    {reward.expires_at ? `Expires ${new Date(reward.expires_at).toLocaleDateString()}` : "Permanent"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
