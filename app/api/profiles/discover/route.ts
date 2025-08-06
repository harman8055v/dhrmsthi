import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { matchingEngine } from "@/lib/matching-engine"

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing required environment variables:", {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      })
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }
    
    // Use cookie-based authentication like other working routes
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Create service role client for operations that need elevated permissions
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    let userId: string | null = null;

    // Check for mobile login user via query parameter
    const searchParams = request.nextUrl.searchParams;
    const mobileUserId = searchParams.get('mobileUserId');
    
    if (mobileUserId) {
      // Mobile login user - verify they exist
      const { data: mobileUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("id", mobileUserId)
        .single();
      
      if (mobileUser) {
        userId = mobileUserId;
      }
    } else {
      // Regular auth flow - get user from cookies
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      
      userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's profile and preferences with location data
    const { data: userProfile } = await supabaseAdmin
      .from("users")
      .select(`
        *,
        city:cities(name),
        state:states(name),
        country:countries(name)
      `)
      .eq("id", userId)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Get profiles user has already swiped on
    const { data: swipedProfiles } = await supabaseAdmin.from("swipes").select("swiped_id").eq("swiper_id", userId)

    const swipedIds = swipedProfiles?.map((s) => s.swiped_id) || []

    // Get users who have super-liked the current user
    const { data: superLikedByProfiles } = await supabaseAdmin
      .from("swipes")
      .select("swiper_id")
      .eq("swiped_id", userId)
      .eq("action", "superlike")

    const superLikedByIds = superLikedByProfiles?.map((s) => s.swiper_id) || []
    console.log(`🌟 ${superLikedByIds.length} users have super-liked current user`)

    // 🔒 CALCULATE USER'S AGE FIRST - This is critical for safety
    const userAge = userProfile.birthdate ? 
      new Date().getFullYear() - new Date(userProfile.birthdate).getFullYear() : 25
    
    console.log(`🧑 Current user: Age ${userAge}, Preferences: ${userProfile.preferred_age_min}-${userProfile.preferred_age_max}`)

    // 🎯 DETERMINE AGE RANGE - Age filtering is MANDATORY, not optional
    let minAllowedAge: number
    let maxAllowedAge: number

    if (userProfile.preferred_age_min && userProfile.preferred_age_max) {
      // User has preferences - respect them but apply safety limits
      minAllowedAge = Math.max(
        userProfile.preferred_age_min,
        18, // Legal minimum
        userAge < 25 ? Math.max(userAge - 5, 18) : userAge - 10 // Safety limits
      )
      
      maxAllowedAge = Math.min(
        userProfile.preferred_age_max,
        userAge < 25 ? userAge + 7 : userAge + 15 // Safety limits
      )
    } else {
      // No preferences - use safe defaults based on user's age
      if (userAge < 25) {
        minAllowedAge = Math.max(userAge - 3, 18)
        maxAllowedAge = userAge + 5
      } else if (userAge < 35) {
        minAllowedAge = userAge - 5
        maxAllowedAge = userAge + 8
      } else {
        minAllowedAge = userAge - 8
        maxAllowedAge = userAge + 10
      }
    }

    // 📅 CONVERT AGES TO BIRTHDATES (this is where bugs often happen)
    const today = new Date()
    
    // For min age: someone who is minAllowedAge was born (today - minAllowedAge) years ago
    const oldestBirthdate = new Date(today.getFullYear() - maxAllowedAge, 0, 1)
    // For max age: someone who is maxAllowedAge was born (today - maxAllowedAge) years ago  
    const youngestBirthdate = new Date(today.getFullYear() - minAllowedAge, 11, 31)

    console.log(`🎯 AGE FILTER: Showing ages ${minAllowedAge}-${maxAllowedAge}`)
    console.log(`📅 BIRTHDATE FILTER: ${oldestBirthdate.toISOString().split('T')[0]} to ${youngestBirthdate.toISOString().split('T')[0]}`)
    console.log(`🔒 VERIFICATION FILTER: Only showing verified profiles`)

    // Build query for discovering profiles with MANDATORY age filtering first
    let query = supabaseAdmin
      .from("users")
      .select(`
        *,
        city:cities(name),
        state:states(name),
        country:countries(name)
      `)
      .eq("is_onboarded", true)
      .eq("verification_status", "verified") // 🔒 ONLY VERIFIED PROFILES
      .neq("id", userId)
      // 🔒 AGE FILTER APPLIED FIRST - MANDATORY
      .gte("birthdate", oldestBirthdate.toISOString().split("T")[0])
      .lte("birthdate", youngestBirthdate.toISOString().split("T")[0])
      // Exclude null birthdates
      .not("birthdate", "is", null)

    // Exclude already swiped profiles
    if (swipedIds.length > 0) {
      query = query.not("id", "in", `(${swipedIds.join(",")})`)
    }

    // Gender preference with flexibility for 'Other'
    if (userProfile.gender === "Male") {
      query = query.in("gender", ["Female", "Other"])
    } else if (userProfile.gender === "Female") {
      query = query.in("gender", ["Male", "Other"])
    }

    // Smart location filtering - prioritize same state but allow others
    // We'll handle location scoring in the matching engine instead

    // Fetch more profiles for better AI matching (increased from 50 to 100)
    const { data: profiles, error } = await query
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      console.error("Error fetching profiles:", error)
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 })
    }

    // Handle case where no verified profiles are found initially
    if (!profiles || profiles.length === 0) {
      console.log("🔍 No verified profiles found in initial query")
      return NextResponse.json({ 
        profiles: [],
        message: "No verified profiles found. Please check back later for new spiritual partners!",
        fallback_used: false
      })
    }

    // SIMPLIFIED: Skip fallback system for debugging
    let finalProfiles = profiles
    let fallbackUsed = false

    if (false) { // Disable fallback temporarily
      console.log(`🔄 Found ${profiles?.length || 0} profiles, need ${minProfilesNeeded}. Starting progressive fallback...`)
      
             // Progressive fallback attempts - Location first, then minimal age expansion
       const fallbackAttempts = [
         // 1. Just expand location (keep exact same age range)
         { ageExpansion: 0, description: 'all locations with same age range' },
         
         // 2. Tiny age expansion
         { ageExpansion: 1, description: 'all locations with ±1 year flexibility' },
         
         // 3. Small age expansion (age-appropriate limits)
         { ageExpansion: userAge < 25 ? 2 : 3, description: `all locations with ±${userAge < 25 ? 2 : 3} year expansion` },
         
         // 4. Moderate expansion (still age-appropriate)
         { ageExpansion: userAge < 25 ? 3 : 5, description: `all locations with ±${userAge < 25 ? 3 : 5} year expansion` }
       ]

      for (const attempt of fallbackAttempts) {
        let fallbackQuery = supabaseAdmin
          .from("users")
          .select(`
            *,
            city:cities(name),
            state:states(name),
            country:countries(name)
          `)
          .eq("is_onboarded", true)
          .eq("verification_status", "verified") // 🔒 ONLY VERIFIED PROFILES
          .neq("id", userId)

        // Exclude already swiped profiles
        if (swipedIds.length > 0) {
          fallbackQuery = fallbackQuery.not("id", "in", `(${swipedIds.join(",")})`)
        }

        // NEVER COMPROMISE: Always maintain gender constraints
        if (userProfile.gender === "Male") {
          fallbackQuery = fallbackQuery.in("gender", ["Female", "Other"])
        } else if (userProfile.gender === "Female") {
          fallbackQuery = fallbackQuery.in("gender", ["Male", "Other"])
        }

                 // Apply age constraints with expansion (using same logic as main query)
         const ageFlexibility = attempt.ageExpansion
         
         // Expand the original age range by the flexibility amount, but keep safety limits
         let fallbackMinAge = minAllowedAge - ageFlexibility
         let fallbackMaxAge = maxAllowedAge + ageFlexibility
         
         // Apply safety limits
         fallbackMinAge = Math.max(
           fallbackMinAge,
           18, // Legal minimum
           userAge < 25 ? Math.max(userAge - 5, 18) : userAge - 10 // Safety limits
         )
         
         fallbackMaxAge = Math.min(
           fallbackMaxAge,
           userAge < 25 ? userAge + 7 : userAge + 15 // Safety limits
         )

         // Convert to birthdates using same logic
         const today = new Date()
         const fallbackOldestBirthdate = new Date(today.getFullYear() - fallbackMaxAge, 0, 1)
         const fallbackYoungestBirthdate = new Date(today.getFullYear() - fallbackMinAge, 11, 31)

         console.log(`🔄 Fallback ${attempt.description}: Ages ${fallbackMinAge}-${fallbackMaxAge} for user age ${userAge}`)

         fallbackQuery = fallbackQuery
           .gte("birthdate", fallbackOldestBirthdate.toISOString().split("T")[0])
           .lte("birthdate", fallbackYoungestBirthdate.toISOString().split("T")[0])
           .not("birthdate", "is", null)

        // Note: Location filtering would be applied here based on attempt.locationScope
        // For now, we're getting all locations and will prioritize in matching engine

        const { data: fallbackProfiles } = await fallbackQuery
          .order("created_at", { ascending: false })
          .limit(100)

        // Combine and deduplicate profiles by ID to prevent duplicate keys
        const combinedProfiles = [...(profiles || []), ...(fallbackProfiles || [])]
        const uniqueProfiles = combinedProfiles.filter((profile, index, self) => 
          self.findIndex(p => p.id === profile.id) === index
        )

        console.log(`🔄 Attempt with ${attempt.description}: Found ${fallbackProfiles?.length || 0} additional profiles (${uniqueProfiles.length} unique total)`)

        // Check if we have enough profiles total (original + fallback)
        if (uniqueProfiles.length >= minProfilesNeeded) {
          finalProfiles = uniqueProfiles.slice(0, 100)
          fallbackUsed = true
          console.log(`✅ Fallback successful: ${uniqueProfiles.length} total profiles meets requirement of ${minProfilesNeeded}`)
          break
        } else {
          console.log(`🔄 Still need more profiles (${uniqueProfiles.length}/${minProfilesNeeded}), trying next fallback...`)
          // Update profiles for next iteration
          profiles = uniqueProfiles
        }
      }

      // Final safety net - if still no profiles, get any compatible gender (maintain gender constraint)
      if (!finalProfiles || finalProfiles.length === 0) {
        console.log("🚨 Final safety net - getting any compatible profiles with wide age range...")
        
        let safetyQuery = supabaseAdmin
          .from("users")
          .select(`
            *,
            city:cities(name),
            state:states(name),
            country:countries(name)
          `)
          .eq("is_onboarded", true)
          .eq("verification_status", "verified") // 🔒 ONLY VERIFIED PROFILES
          .neq("id", userId)

        // Exclude already swiped profiles
        if (swipedIds.length > 0) {
          safetyQuery = safetyQuery.not("id", "in", `(${swipedIds.join(",")})`)
        }

        // NEVER COMPROMISE: Always maintain gender constraints even in final safety net
        if (userProfile.gender === "Male") {
          safetyQuery = safetyQuery.in("gender", ["Female", "Other"])
        } else if (userProfile.gender === "Female") {
          safetyQuery = safetyQuery.in("gender", ["Male", "Other"])
        }

                 // Age-appropriate safety net (use the widest safe range for user's age)
         const safetyMaxAge = userAge < 25 ? userAge + 7 : userAge + 15
         const safetyMinAge = Math.max(18, userAge < 25 ? Math.max(userAge - 5, 18) : userAge - 10)
         
         // Convert to birthdates using same logic
         const today = new Date()
         const safetyOldestBirthdate = new Date(today.getFullYear() - safetyMaxAge, 0, 1)
         const safetyYoungestBirthdate = new Date(today.getFullYear() - safetyMinAge, 11, 31)
         
         console.log(`🚨 Safety net: User age ${userAge}, showing ages ${safetyMinAge}-${safetyMaxAge}`)
         
         safetyQuery = safetyQuery
           .gte("birthdate", safetyOldestBirthdate.toISOString().split("T")[0])
           .lte("birthdate", safetyYoungestBirthdate.toISOString().split("T")[0])
           .not("birthdate", "is", null)

        const { data: safetyProfiles } = await safetyQuery
          .order("created_at", { ascending: false })
          .limit(30)

        if (safetyProfiles && safetyProfiles.length > 0) {
          finalProfiles = safetyProfiles
          fallbackUsed = true
          console.log(`✅ Safety net successful: Found ${safetyProfiles.length} profiles with compatible gender`)
        } else {
          console.log("🚫 No verified profiles found even with safety net")
          return NextResponse.json({ 
            profiles: [],
            message: "No verified profiles found. Please check back later for new spiritual partners!",
            fallback_used: true
          })
        }
      }
    }

    // 🖼️ PROCESS PROFILE PHOTOS - Convert storage paths to public URLs
    const processPhotoUrl = async (photoPath: string, userId: string): Promise<string | null> => {
      try {
        if (!photoPath) {
          console.log(`Empty photo path for user ${userId}`);
          return null;
        }
        
        // Handle blob URLs - these are temporary and invalid
        if (photoPath.startsWith('blob:')) {
          console.log('Found blob URL in profile photo, skipping for user:', userId);
          return null;
        }
        
        // Handle base64 data - these are embedded images, skip for now
        if (photoPath.startsWith('data:')) {
          console.log('Found base64 data in profile photo, skipping for user:', userId);
          return null;
        }
        
        // If it's already a full URL, return as-is
        if (photoPath.startsWith('https://') || photoPath.startsWith('http://')) {
          return photoPath;
        }
        
        // For storage paths (like "user-id/filename.jpg"), return public URL
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
          console.error('NEXT_PUBLIC_SUPABASE_URL not available for photo processing');
          return null;
        }
        
        const cleanPath = photoPath.replace(/^\/+/, '');
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-photos/${cleanPath}`;
        
        return publicUrl;
      } catch (error) {
        console.error(`Error processing photo URL for user ${userId}:`, error);
        return null;
      }
    };

    // Transform profiles to use signed URLs for photos (with error handling)
    const profilesWithSignedUrls = await Promise.allSettled((finalProfiles || []).map(async (profile) => {
      try {
        let transformedPhotos = profile.user_photos;
        let transformedProfilePhoto = profile.profile_photo_url;
        
        // Process profile_photo_url first
        if (profile.profile_photo_url) {
          transformedProfilePhoto = await processPhotoUrl(profile.profile_photo_url, profile.id);
        }
        
        if (profile.user_photos && Array.isArray(profile.user_photos)) {
          const photoPromises = profile.user_photos.map(async (photoPath: string) => {
            try {
              return await processPhotoUrl(photoPath, profile.id);
            } catch (error) {
              console.error(`Error processing photo for profile ${profile.id}:`, error);
              return null;
            }
          });
          
          const processedPhotos = await Promise.allSettled(photoPromises);
          transformedPhotos = processedPhotos
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map(result => (result as PromiseFulfilledResult<string>).value);
          
          // Only keep profiles that have at least one valid photo
          if (transformedPhotos.length === 0) {
            console.log('No valid photos found for profile:', profile.id);
          }
        } else {
          transformedPhotos = [];
        }
        
        return {
          ...profile,
          profile_photo_url: transformedProfilePhoto,
          user_photos: transformedPhotos
        };
      } catch (error) {
        console.error(`Error processing profile ${profile.id}:`, error);
        // Return profile without photos rather than failing completely
        return {
          ...profile,
          profile_photo_url: null,
          user_photos: []
        };
      }
    }));

    // Extract successful results and handle failures gracefully
    const successfulProfiles = profilesWithSignedUrls
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value);

    // Filter out profiles without any photos
    const profilesWithPhotos = successfulProfiles.filter(profile => 
      profile.user_photos && profile.user_photos.length > 0
    );

    // 🚀 ADVANCED AI MATCHING ENGINE ACTIVATION
    console.log(`🧠 AI Matching Engine: Processing ${profilesWithPhotos.length} profiles for user ${userId}${fallbackUsed ? ' (with fallback)' : ''}`)
    
    // Use our sophisticated matching engine to calculate compatibility
    let profilesWithCompatibility;
    try {
      profilesWithCompatibility = await matchingEngine.sortProfilesByCompatibility(userProfile, profilesWithPhotos)
    } catch (matchingError) {
      console.error("Error in matching engine:", matchingError)
      // Fallback: return profiles without compatibility scores
      profilesWithCompatibility = profilesWithPhotos.map(profile => ({
        ...profile,
        compatibility: {
          total: 50, // Default compatibility
          breakdown: {
            spiritual: 50,
            lifestyle: 50,
            values: 50,
            location: 50
          }
        }
      }));
    }

    // Apply account status boosting and final ranking
    const rankedProfiles = profilesWithCompatibility.map((profile, index) => {
      // Boost premium plan profiles slightly but don't override compatibility
      let finalScore = profile.compatibility.total
      
      if (profile.account_status === 'samarpan') {
        finalScore = Math.min(finalScore + 2, 99)
      } else if (profile.account_status === 'sangam') {
        finalScore = Math.min(finalScore + 1, 99)
      } else if (profile.account_status === 'sparsh') {
        finalScore = Math.min(finalScore + 0.5, 99)
      }

      return {
        ...profile,
        compatibility: {
          ...profile.compatibility,
          total: finalScore
        },
        match_rank: index + 1,
        is_fallback_match: fallbackUsed, // Flag to indicate if this used fallback
        has_super_liked_me: superLikedByIds.includes(profile.id) // Indicate if this user super-liked me
      }
    })

    // Return top matches (limit to 15 for better performance)
    const topMatches = rankedProfiles.slice(0, 15)

    console.log(`🎯 AI Matching Complete: Returning ${topMatches.length} top matches with scores ranging from ${topMatches[0]?.compatibility.total || 0} to ${topMatches[topMatches.length - 1]?.compatibility.total || 0}`)

    return NextResponse.json({ 
      profiles: topMatches,
      total_analyzed: profilesWithPhotos.length,
      fallback_used: fallbackUsed,
      matching_insights: {
        avg_compatibility: Math.round(topMatches.reduce((sum, p) => sum + p.compatibility.total, 0) / topMatches.length),
        top_score: topMatches[0]?.compatibility.total || 0,
        spiritual_matches: topMatches.filter(p => p.compatibility.breakdown.spiritual >= 70).length,
        perfect_matches: topMatches.filter(p => p.compatibility.total >= 90).length,
        fallback_info: fallbackUsed ? "Expanded search to show more profiles" : null
      }
    })
  } catch (error) {
    console.error("Error in profiles/discover route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
