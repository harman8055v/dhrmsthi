import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { matchingEngine } from "@/lib/matching-engine"

export async function GET(request: NextRequest) {
  try {
    // Create two Supabase clients:
    // 1) supabaseAdmin – uses the service-role key for privileged database reads
    // 2) supabaseAuth  – uses the public anon key *only* for verifying the user JWT.
    //    Using the anon key prevents a new auth session from being generated on every request.
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const supabaseAuth  = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // From this point onward, keep using `supabaseAdmin` for database queries.
    const supabase = supabaseAdmin

    let userId: string | null = null;

    // Check for mobile login user via query parameter
    const searchParams = request.nextUrl.searchParams;
    const mobileUserId = searchParams.get('mobileUserId');
    
    if (mobileUserId) {
      // Mobile login user - verify they exist
      const { data: mobileUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", mobileUserId)
        .single();
      
      if (mobileUser) {
        userId = mobileUserId;
      }
    } else {
      // Regular auth flow
      const authHeader = request.headers.get("authorization")
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const token = authHeader.replace("Bearer ", "")

      // Validate the JWT using the *anon* client to avoid creating a brand-new session row.
      const {
        data: { user },
        error: authError,
      } = await supabaseAuth.auth.getUser(token)

      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      
      userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile and preferences
    const { data: userProfile, error: profileError } = await supabase
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
    console.log(`🔍 Fetching swipe history for user ${userId}...`)
    const { data: swipedProfiles, error: swipedError } = await supabase
      .from("swipe_actions")
      .select("swiped_id")
      .eq("swiper_id", userId)
    
    if (swipedError) {
      console.log("⚠️ Error fetching swiped profiles (continuing anyway):", swipedError)
    }

    const swipedIds = swipedProfiles?.map((s) => s.swiped_id) || []
    console.log(`📊 User ${userId} has swiped on ${swipedIds.length} profiles`)
    console.log(`📋 Swiped profile IDs:`, swipedIds.slice(0, 10)) // Show first 10 for debugging

    // Check user's plan to determine how many profiles to return
    const userPlan = userProfile.account_status || 'drishti'
    let profileLimit = 200 // Increased base fetch limit
    let finalReturnLimit = 15 // Default return limit
    
    // Samarpan gets unlimited profiles, others get limited
    if (userPlan === 'samarpan') {
      profileLimit = 1000 // Fetch many more for unlimited users
      finalReturnLimit = -1 // Return all (unlimited)
    } else if (userPlan === 'sangam') {
      profileLimit = 300 // More for premium users
      finalReturnLimit = 50 // Premium users get more
    } else if (userPlan === 'sparsh') {
      profileLimit = 250 // More for mid-tier users
      finalReturnLimit = 25 // Mid-tier users get some more
    } // drishti gets 200 fetch, 15 return

    console.log(`User plan: ${userPlan}, will fetch ${profileLimit} and return ${finalReturnLimit === -1 ? 'unlimited' : finalReturnLimit}`)

    // Build query for discovering profiles with location data
    let query = supabase
      .from("users")
      .select(`
        *,
        city:cities(name),
        state:states(name),
        country:countries(name)
      `)
      // .eq("verification_status", "verified") // Temporarily disabled to display all profiles
      .eq("is_onboarded", true)
      .neq("id", userId)

    console.log(`🔍 Base query: onboarded users excluding self (${userId})`)

    // ALWAYS exclude ALL swiped profiles - fundamental rule of dating apps
    console.log(`🚫 Excluding ALL ${swipedIds.length} already swiped profiles`)

    if (swipedIds.length > 0) {
      console.log(`🔍 Adding NOT IN clause to exclude: ${swipedIds.slice(0, 5).join(", ")}${swipedIds.length > 5 ? ` (and ${swipedIds.length - 5} more)` : ""}`)
      query = query.not("id", "in", `(${swipedIds.join(",")})`)
    } else {
      console.log("✅ No profiles to exclude - user hasn't swiped on anyone yet")
    }

    // DEBUG: Log query details
    console.log(`🔍 Query filters applied:`)
    console.log(`   - Onboarded: true`)
    console.log(`   - Not self: ${userId}`)
    console.log(`   - Excluded swiped IDs: ${swipedIds.length} profiles`)
    console.log(`   - Gender filter: ${userProfile.gender === "Male" ? "Female, Other" : userProfile.gender === "Female" ? "Male, Other" : "All"}`)
    console.log(`   - Age filter: Applied based on gender`)
    console.log(`   - Limit: ${profileLimit}`)

    // Calculate user's current age
    const userBirthDate = new Date(userProfile.birthdate)
    const today = new Date()
    const userAge = today.getFullYear() - userBirthDate.getFullYear() - 
      (today.getMonth() < userBirthDate.getMonth() || 
       (today.getMonth() === userBirthDate.getMonth() && today.getDate() < userBirthDate.getDate()) ? 1 : 0)

    console.log(`👤 User age: ${userAge} years, gender: ${userProfile.gender}`)

    // Smart age preference system based on gender
    if (userProfile.gender === "Male") {
      // Men see women who are younger (up to 8 years younger) or same age
      const minAge = Math.max(18, userAge - 8) // At least 18 years old
      const maxAge = userAge // Same age or younger
      
      const minDate = new Date()
      minDate.setFullYear(minDate.getFullYear() - maxAge - 1) // -1 for inclusive range
      const maxDate = new Date()
      maxDate.setFullYear(maxDate.getFullYear() - minAge)

      console.log(`👨 Male user: Looking for women aged ${minAge}-${maxAge} years`)
      console.log(`📅 Date range: ${minDate.toISOString().split("T")[0]} to ${maxDate.toISOString().split("T")[0]}`)
      
      query = query
        .in("gender", ["Female", "Other"])
        .gte("birthdate", minDate.toISOString().split("T")[0])
        .lte("birthdate", maxDate.toISOString().split("T")[0])
        
    } else if (userProfile.gender === "Female") {
      // Women see men who are older (up to 8 years older) or same age
      const minAge = userAge // Same age or older
      const maxAge = userAge + 8 // Up to 8 years older
      
      const minDate = new Date()
      minDate.setFullYear(minDate.getFullYear() - maxAge - 1) // -1 for inclusive range
      const maxDate = new Date()
      maxDate.setFullYear(maxDate.getFullYear() - minAge)

      console.log(`👩 Female user: Looking for men aged ${minAge}-${maxAge} years`)
      console.log(`📅 Date range: ${minDate.toISOString().split("T")[0]} to ${maxDate.toISOString().split("T")[0]}`)
      
      query = query
        .in("gender", ["Male", "Other"])
        .gte("birthdate", minDate.toISOString().split("T")[0])
        .lte("birthdate", maxDate.toISOString().split("T")[0])
        
    } else {
      // For "Other" gender, show all genders with reasonable age range
      const minAge = Math.max(18, userAge - 5)
      const maxAge = userAge + 5
      
      const minDate = new Date()
      minDate.setFullYear(minDate.getFullYear() - maxAge - 1)
      const maxDate = new Date()
      maxDate.setFullYear(maxDate.getFullYear() - minAge)

      console.log(`🌈 Other gender user: Looking for all genders aged ${minAge}-${maxAge} years`)
      
      query = query
        .gte("birthdate", minDate.toISOString().split("T")[0])
        .lte("birthdate", maxDate.toISOString().split("T")[0])
    }

    // Smart location filtering - prioritize same state but allow others
    // We'll handle location scoring in the matching engine instead

    // Fetch profiles based on user's plan
    console.log(`🔍 Executing main query with limit ${profileLimit}...`)
    const { data: profiles, error } = await query
      .order("created_at", { ascending: false })
      .limit(profileLimit)

    if (error) {
      console.error("❌ Error fetching profiles:", error)
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 })
    }

    console.log(`📋 Main query returned ${profiles?.length || 0} profiles`)
    
    // DEBUG: Check if any returned profiles are in swiped list
    if (profiles && profiles.length > 0) {
      const returnedIds = profiles.map(p => p.id)
      const duplicates = returnedIds.filter(id => swipedIds.includes(id))
      if (duplicates.length > 0) {
        console.error(`🚨 CRITICAL BUG: Returned ${duplicates.length} already-swiped profiles:`, duplicates)
      } else {
        console.log(`✅ Good: No swiped profiles in results`)
      }
      console.log(`📋 Returned profile IDs:`, returnedIds.slice(0, 5)) // Show first 5
    }

    // �� FALLBACK STRATEGY: Only relax age, NEVER gender preferences
    let finalProfiles = profiles
    let fallbackUsed = false

    if (!profiles || profiles.length < 10) { // Start fallback if we have fewer than 10 profiles
      console.log(`🔄 Only found ${profiles?.length || 0} profiles with strict filters, trying age relaxation...`)
      
      // Fallback: Remove age restrictions but keep gender preferences
      let fallbackQuery = supabase
        .from("users")
        .select(`
          *,
          city:cities(name),
          state:states(name),
          country:countries(name)
        `)
        // .eq("verification_status", "verified") // Temporarily disabled for testing
        .eq("is_onboarded", true)
        .neq("id", userId)

      // ALWAYS exclude ALL swiped profiles - even in fallback
      if (swipedIds.length > 0) {
        fallbackQuery = fallbackQuery.not("id", "in", `(${swipedIds.join(",")})`)
        console.log(`🔄 Fallback: Still excluding ALL ${swipedIds.length} swiped profiles`)
      }

      // Keep gender preference but remove age restrictions
      if (userProfile.gender === "Male") {
        fallbackQuery = fallbackQuery.in("gender", ["Female", "Other"])
        console.log(`👨 Fallback: Male user looking for women/other (no age restrictions)`)
      } else if (userProfile.gender === "Female") {
        fallbackQuery = fallbackQuery.in("gender", ["Male", "Other"])
        console.log(`👩 Fallback: Female user looking for men/other (no age restrictions)`)
      } else {
        // For "Other" gender, keep showing all genders but remove age restrictions
        console.log(`🌈 Fallback: Other gender user looking for all genders (no age restrictions)`)
      }

      const { data: fallbackProfiles } = await fallbackQuery
        .order("created_at", { ascending: false })
        .limit(profileLimit) // Use same generous limit

      if (fallbackProfiles && fallbackProfiles.length > 0) {
        // DEBUG: Check fallback results too
        const fallbackIds = fallbackProfiles.map(p => p.id)
        const fallbackDuplicates = fallbackIds.filter(id => swipedIds.includes(id))
        if (fallbackDuplicates.length > 0) {
          console.error(`🚨 CRITICAL BUG: Fallback returned ${fallbackDuplicates.length} already-swiped profiles:`, fallbackDuplicates)
        }
        
        finalProfiles = (profiles || []).concat(fallbackProfiles) // Combine with main results
        fallbackUsed = true
        console.log(`✅ Fallback successful: Added ${fallbackProfiles.length} profiles (total: ${finalProfiles.length})`)
      } else {
        console.log(`❌ Fallback found no additional profiles`)
      }
    }

    // 🖼️ PROCESS PROFILE PHOTOS - Convert storage paths to public URLs
    const processPhotoUrl = async (photoPath: string, userId: string): Promise<string | null> => {
      if (!photoPath) return null;
      
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
      try {
        const cleanPath = photoPath.replace(/^\/+/, '');
        console.log('Generating public URL for profile photo path:', cleanPath);
        
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-photos/${cleanPath}`;
        
        console.log('Generated public URL for profile photo:', publicUrl);
        return publicUrl;
      } catch (error) {
        console.error('Error generating public URL for profile photo:', error);
        return null;
      }
    };

    // Transform profiles to use signed URLs for photos
    const profilesWithSignedUrls = await Promise.all((finalProfiles || []).map(async (profile) => {
      let transformedPhotos = profile.user_photos;
      let transformedProfilePhoto = profile.profile_photo_url;
      
      // Process profile_photo_url first
      if (profile.profile_photo_url) {
        transformedProfilePhoto = await processPhotoUrl(profile.profile_photo_url, profile.id);
      }
      
      if (profile.user_photos && Array.isArray(profile.user_photos)) {
        const photoPromises = profile.user_photos.map(async (photoPath: string) => {
          return await processPhotoUrl(photoPath, profile.id);
        });
        
        const processedPhotos = await Promise.all(photoPromises);
        transformedPhotos = processedPhotos.filter((photo: string | null) => photo !== null);
        
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
    }));

    // Filter out profiles without any photos - THIS IS THE ONLY CLIENT-SIDE FILTERING WE DO
    const profilesWithPhotos = profilesWithSignedUrls.filter(profile => 
      profile.user_photos && 
      Array.isArray(profile.user_photos) && 
      profile.user_photos.length > 0
    );

    console.log(`📷 After photo filtering: ${profilesWithPhotos.length} profiles with photos`)

    // 🚀 ADVANCED AI MATCHING ENGINE ACTIVATION - Process ALL profiles with photos
    console.log(`🧠 AI Matching Engine: Processing ${profilesWithPhotos.length} profiles for user ${userId}${fallbackUsed ? ' (with fallback)' : ''}`)
    
    // Use our sophisticated matching engine to calculate compatibility for ALL profiles
    const profilesWithCompatibility = await matchingEngine.sortProfilesByCompatibility(userProfile, profilesWithPhotos)

    // Apply account status boosting and final ranking - but keep ALL profiles
    const rankedProfiles = profilesWithCompatibility.map((profile, index) => {
      // Boost premium/elite profiles slightly but don't override compatibility
      const profileBoost = Math.min(profile.profile_score || 0, 10) // Cap score contributions
      
      let finalScore = profile.compatibility.total
      
      if (profile.account_status === 'samarpan') {
        finalScore += profileBoost * 0.05 // 5% boost for samarpan users
      } else if (profile.account_status === 'sangam' || profile.account_status === 'sparsh') {
        finalScore += profileBoost * 0.03 // 3% boost for premium users
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

    // Apply plan-based limits AFTER sorting by compatibility
    const finalMatches = finalReturnLimit === -1 ? rankedProfiles : rankedProfiles.slice(0, finalReturnLimit)

    console.log(`🎯 AI Matching Complete: Returning ${finalMatches.length} matches (from ${profilesWithPhotos.length} analyzed) with scores ranging from ${finalMatches[0]?.compatibility.total || 0} to ${finalMatches[finalMatches.length - 1]?.compatibility.total || 0}`)

    return NextResponse.json({ 
      profiles: finalMatches,
      total_analyzed: profilesWithPhotos.length,
      total_returned: finalMatches.length,
      user_plan: userPlan,
      is_unlimited: finalReturnLimit === -1,
      fallback_used: fallbackUsed,
      matching_insights: {
        avg_compatibility: Math.round(finalMatches.reduce((sum, p) => sum + p.compatibility.total, 0) / finalMatches.length),
        top_score: finalMatches[0]?.compatibility.total || 0,
        lowest_score: finalMatches[finalMatches.length - 1]?.compatibility.total || 0,
        spiritual_matches: finalMatches.filter(p => p.compatibility.breakdown.spiritual >= 70).length,
        perfect_matches: finalMatches.filter(p => p.compatibility.total >= 90).length,
        fallback_info: fallbackUsed ? "Expanded search to show more profiles" : null
      }
    })
  } catch (error) {
    console.error("Error in profiles/discover route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
