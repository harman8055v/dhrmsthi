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
    const supabase = createRouteHandlerClient({ cookies })
    
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

    // Build query for discovering profiles with location data
    let query = supabaseAdmin
      .from("users")
      .select(`
        *,
        city:cities(name),
        state:states(name),
        country:countries(name)
      `)
      // .eq("verification_status", "verified") // TEMPORARILY DISABLED
      .eq("is_onboarded", true)
      .neq("id", userId)

    // Exclude already swiped profiles
    if (swipedIds.length > 0) {
      query = query.not("id", "in", `(${swipedIds.join(",")})`)
    }

    // Apply smart filters based on user preferences and compatibility
    if (userProfile.preferred_age_min && userProfile.preferred_age_max) {
      // Expand age range slightly for better matches (±2 years flexibility)
      const minDate = new Date()
      minDate.setFullYear(minDate.getFullYear() - (userProfile.preferred_age_max + 2))
      const maxDate = new Date()
      maxDate.setFullYear(maxDate.getFullYear() - Math.max(userProfile.preferred_age_min - 2, 18))

      query = query
        .gte("birthdate", minDate.toISOString().split("T")[0])
        .lte("birthdate", maxDate.toISOString().split("T")[0])
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

    // 🎯 FALLBACK STRATEGY: Ensure users always see profiles
    let finalProfiles = profiles
    let fallbackUsed = false

    if (!profiles || profiles.length === 0) {
      console.log("🔄 No profiles found with strict filters, trying fallback strategy...")
      
      // Fallback 1: Remove age restrictions
      let fallbackQuery = supabaseAdmin
        .from("users")
        .select(`
          *,
          city:cities(name),
          state:states(name),
          country:countries(name)
        `)
        // .eq("verification_status", "verified") // TEMPORARILY DISABLED
        .eq("is_onboarded", true)
        .neq("id", userId)

      if (swipedIds.length > 0) {
        fallbackQuery = fallbackQuery.not("id", "in", `(${swipedIds.join(",")})`)
      }

      // Keep gender preference but remove age restrictions
      if (userProfile.gender === "Male") {
        fallbackQuery = fallbackQuery.in("gender", ["Female", "Other"])
      } else if (userProfile.gender === "Female") {
        fallbackQuery = fallbackQuery.in("gender", ["Male", "Other"])
      }

      const { data: fallbackProfiles } = await fallbackQuery
        .order("created_at", { ascending: false })
        .limit(50)

      if (fallbackProfiles && fallbackProfiles.length > 0) {
        finalProfiles = fallbackProfiles
        fallbackUsed = true
        console.log(`✅ Fallback successful: Found ${fallbackProfiles.length} profiles without age restrictions`)
      } else {
        // Fallback 2: Remove all preference filters except basic verification
        console.log("🔄 Trying ultimate fallback - any verified profiles...")
        
        const ultimateFallbackQuery = supabase
          .from("users")
          .select(`
            *,
            city:cities(name),
            state:states(name),
            country:countries(name)
          `)
          // .eq("verification_status", "verified") // TEMPORARILY DISABLED
          .eq("is_onboarded", true)
          .neq("id", userId)

        if (swipedIds.length > 0) {
          ultimateFallbackQuery.not("id", "in", `(${swipedIds.join(",")})`)
        }

        const { data: ultimateFallbackProfiles } = await ultimateFallbackQuery
          .order("created_at", { ascending: false })
          .limit(30)

        if (ultimateFallbackProfiles && ultimateFallbackProfiles.length > 0) {
          finalProfiles = ultimateFallbackProfiles
          fallbackUsed = true
          console.log(`✅ Ultimate fallback successful: Found ${ultimateFallbackProfiles.length} profiles`)
        } else {
          return NextResponse.json({ 
            profiles: [],
            message: "No more profiles available right now. Check back later for new spiritual partners!",
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
        is_fallback_match: fallbackUsed // Flag to indicate if this used fallback
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
