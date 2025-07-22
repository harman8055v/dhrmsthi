import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    console.log("Admin dashboard API called at:", new Date().toISOString());
    console.log("Request URL:", request.url);
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const filter = searchParams.get("filter") || "all"
    const search = searchParams.get("search") || ""
    const includeStats = searchParams.get("include_stats") === "true"
    const sortBy = searchParams.get("sort_by") || "created_at"
    const sortOrder = searchParams.get("sort_order") || "desc"
    const genderFilter = searchParams.get("gender_filter") || "all"
    const photoFilter = searchParams.get("photo_filter") || "all"
    const profileCompletionFilter = searchParams.get("profile_completion_filter") || "all"
    const verificationFilter = searchParams.get("verification_filter") || "all"
    const ageRangeFilter = searchParams.get("age_range_filter") || "all"

    const offset = (page - 1) * limit
    
    // Apply client-side filtering for photo and profile completion filters
    const hasClientSideFilters = photoFilter !== "all" || profileCompletionFilter !== "all"
    
    // We'll determine fetch strategy after getting the count
    let fetchLimit = limit
    let fetchOffset = offset

    // Build the base query with actual schema columns from your database
    let baseQuery = supabase.from("users").select(`
      id, phone, email, email_verified, mobile_verified, full_name, first_name, last_name,
      gender, birthdate, city_id, state_id, country_id, profile_photo_url, user_photos,
      spiritual_org, daily_practices, diet, temple_visit_freq, artha_vs_moksha,
      vanaprastha_interest, favorite_spiritual_quote, education, profession, annual_income,
      marital_status, super_likes_count, swipe_count, message_highlights_count,
      is_onboarded, is_verified, account_status, created_at, updated_at, daily_swipe_count,
      daily_superlike_count, last_swipe_date, is_banned, is_kyc_verified, flagged_reason,
      role, mother_tongue, about_me, ideal_partner_notes, verification_status,
      height_ft, height_in, is_active
    `)

    // Create a separate query for counting
    let countQuery = supabase.from("users").select("id", { count: "exact", head: true })

    // Apply filters to both queries
    const applyFilters = (query: any) => {
      // Apply main filter
      if (filter !== "all") {
        switch (filter) {
          case "active":
            query = query.eq("is_active", true)
            break
          case "inactive":
            query = query.eq("is_active", false)
            break
          case "verified":
            query = query.eq("verification_status", "verified")
            break
          case "pending":
            query = query.eq("verification_status", "pending")
            break
          case "rejected":
            query = query.eq("verification_status", "rejected")
            break
          case "premium":
            query = query.not("premium_expires_at", "is", null)
            break
          case "incomplete":
            query = query.eq("is_onboarded", false)
            break
        }
      }

      // Apply verification filter
      if (verificationFilter !== "all") {
        query = query.eq("verification_status", verificationFilter)
      }

      // Apply gender filter
      if (genderFilter !== "all") {
        query = query.eq("gender", genderFilter)
      }

      // Photo filtering will be handled client-side for better reliability

      // Apply age range filter
      if (ageRangeFilter !== "all") {
        const today = new Date()
        let minDate: Date, maxDate: Date

        switch (ageRangeFilter) {
          case "18-25":
            minDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate())
            maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
            break
          case "26-30":
            minDate = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate())
            maxDate = new Date(today.getFullYear() - 26, today.getMonth(), today.getDate())
            break
          case "31-35":
            minDate = new Date(today.getFullYear() - 35, today.getMonth(), today.getDate())
            maxDate = new Date(today.getFullYear() - 31, today.getMonth(), today.getDate())
            break
          case "36-40":
            minDate = new Date(today.getFullYear() - 40, today.getMonth(), today.getDate())
            maxDate = new Date(today.getFullYear() - 36, today.getMonth(), today.getDate())
            break
          case "40+":
            minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())
            maxDate = new Date(today.getFullYear() - 40, today.getMonth(), today.getDate())
            break
          default:
            minDate = maxDate = today
        }

        if (ageRangeFilter !== "all") {
          query = query
            .gte("birthdate", minDate.toISOString().split("T")[0])
            .lte("birthdate", maxDate.toISOString().split("T")[0])
        }
      }

      // Apply search
      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
        )
      }

      return query
    }

    // Apply filters to both queries
    baseQuery = applyFilters(baseQuery)
    countQuery = applyFilters(countQuery)

    // Get total count for pagination
    const { count, error: countError } = await countQuery

    if (countError) {
      console.error("Count query error:", countError)
      return NextResponse.json({ error: "Failed to count users" }, { status: 500 })
    }

    // Apply sorting and pagination to the main query with error handling
    let users = null;
    let queryError = null;
    
    if (hasClientSideFilters) {
      // Batch processing to fetch ALL users when client-side filtering is needed
      console.log(`Client-side filtering detected. Fetching all ${count} users in batches...`);
      
      const batchSize = 1000;
      const totalBatches = Math.ceil((count || 0) / batchSize);
      let allUsers: any[] = [];
      
      for (let batch = 0; batch < totalBatches; batch++) {
        const batchOffset = batch * batchSize;
        const batchLimit = Math.min(batchSize, (count || 0) - batchOffset);
        
        console.log(`Fetching batch ${batch + 1}/${totalBatches}: offset ${batchOffset}, limit ${batchLimit}`);
        
        try {
          const { data: batchData, error: batchError } = await baseQuery
            .order(sortBy, { ascending: sortOrder === "asc" })
            .range(batchOffset, batchOffset + batchLimit - 1);
          
          if (batchError) {
            console.error(`Batch ${batch + 1} error:`, batchError);
            queryError = batchError;
            break;
          }
          
          if (batchData) {
            allUsers = allUsers.concat(batchData);
          }
        } catch (err) {
          console.error(`Batch ${batch + 1} failed:`, err);
          queryError = err;
          break;
        }
      }
      
      users = allUsers;
      console.log(`Batch processing complete. Fetched ${users?.length || 0} total users.`);
    } else {
      // Standard single query for non-filtered requests
      try {
        const { data: usersData, error: dbError } = await baseQuery
          .order(sortBy, { ascending: sortOrder === "asc" })
          .range(fetchOffset, fetchOffset + fetchLimit - 1)
        
        users = usersData;
        queryError = dbError;
      } catch (err) {
        console.error("Database query failed:", err);
        queryError = err;
      }
    }

    // Helper function to process photo URLs
    const processPhotoUrl = async (photoPath: string, userId: string): Promise<string | null> => {
      if (!photoPath) return null;
      
      // Handle blob URLs - these are temporary and invalid, skip them
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

        // Transform user photos to handle different data formats
    const transformedUsers = await Promise.all((users || []).map(async (user) => {
      let transformedPhotos = user.user_photos;
      let transformedProfilePhoto = user.profile_photo_url;
      
      // Process profile_photo_url first
      if (user.profile_photo_url) {
        transformedProfilePhoto = await processPhotoUrl(user.profile_photo_url, user.id);
      }
      
      if (user.user_photos && Array.isArray(user.user_photos)) {
        const photoPromises = user.user_photos.map(async (photoPath: string) => {
          return await processPhotoUrl(photoPath, user.id);
        });
        
        transformedPhotos = await Promise.all(photoPromises);
        
        // Filter out null values from failed photo processing
        transformedPhotos = transformedPhotos.filter((photo: string | null) => photo !== null);
      } else {
        // If no photos or invalid format, use empty array
        transformedPhotos = [];
      }
      
      return {
        ...user,
        profile_photo_url: transformedProfilePhoto,
        user_photos: transformedPhotos
      };
    }));

    // -----------------------------------------------------------------------------
    // Enrich users with city and state names for the admin dashboard
    // -----------------------------------------------------------------------------
    const cityIds = Array.from(new Set((transformedUsers || []).map((u: any) => u.city_id).filter(Boolean)));
    const stateIds = Array.from(new Set((transformedUsers || []).map((u: any) => u.state_id).filter(Boolean)));

    // Fetch cities in bulk with error handling
    let cityMap: Record<number, string> = {};
    if (cityIds.length > 0) {
      try {
        const { data: citiesData, error: citiesError } = await supabase
          .from("cities")
          .select("id, name")
          .in("id", cityIds);

        if (citiesError) {
          console.error("Failed to fetch cities:", citiesError);
        } else {
          cityMap = Object.fromEntries((citiesData || []).map((c: any) => [c.id, c.name]));
        }
      } catch (error) {
        console.error("Cities table query failed:", error);
        // Continue without city names - don't fail the entire request
      }
    }

    // Fetch states in bulk with error handling
    let stateMap: Record<number, string> = {};
    if (stateIds.length > 0) {
      try {
        const { data: statesData, error: statesError } = await supabase
          .from("states")
          .select("id, name")
          .in("id", stateIds);

        if (statesError) {
          console.error("Failed to fetch states:", statesError);
        } else {
          stateMap = Object.fromEntries((statesData || []).map((s: any) => [s.id, s.name]));
        }
      } catch (error) {
        console.error("States table query failed:", error);
        // Continue without state names - don't fail the entire request
      }
    }

    const enrichedUsers = transformedUsers.map((u: any) => ({
      ...u,
      city: u.city_id ? cityMap[u.city_id] || null : null,
      state: u.state_id ? stateMap[u.state_id] || null : null,
    }));

    if (queryError) {
      console.error("Database error:", queryError)
      return NextResponse.json({ 
        error: "Failed to fetch users", 
        details: queryError instanceof Error ? queryError.message : "Database query failed",
        users: [], 
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        stats: includeStats ? {
          totalUsers: 0,
          verifiedUsers: 0,
          todaySignups: 0,
          pendingVerifications: 0,
          maleUsers: 0,
          femaleUsers: 0,
          completedProfiles: 0,
        } : null
      }, { status: 200 }) // Return 200 instead of 500 with empty data
    }

    // Apply client-side filters for complex logic
    let filteredUsers = enrichedUsers || []
    
    // Filter by profile completion
    if (profileCompletionFilter !== "all") {
      filteredUsers = filteredUsers.filter((user) => {
        const completionScore = calculateProfileCompletion(user)
        if (profileCompletionFilter === "complete") {
          return completionScore >= 80
        } else if (profileCompletionFilter === "incomplete") {
          return completionScore < 80
        }
        return true
      })
    }
    
        // Apply photo filtering (client-side for reliability)
    if (photoFilter !== "all") {
      filteredUsers = filteredUsers.filter((user) => {
        const hasPhotos = user.user_photos && 
                         Array.isArray(user.user_photos) && 
                         user.user_photos.length > 0 &&
                         user.user_photos.some((photo: string) => photo && photo.trim() !== "")
        
        if (photoFilter === "has_photos") {
          return hasPhotos
        } else if (photoFilter === "no_photos") {
          return !hasPhotos
        }
        return true
      })
    }
    
    // Apply pagination to filtered results (only needed when client-side filtering is applied)
    let paginatedUsers = filteredUsers
    if (hasClientSideFilters) {
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      paginatedUsers = filteredUsers.slice(startIndex, endIndex)
    }

    // Use filtered count when client-side filters are applied (now only profile completion)
    const actualTotalCount = hasClientSideFilters ? filteredUsers.length : (count || 0)
    const totalPages = Math.ceil(actualTotalCount / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    const pagination = {
      page,
      limit,
      total: actualTotalCount,
      totalPages,
      hasNext,
      hasPrev,
    }

    let stats = null
    if (includeStats) {
      try {
        // Use multiple targeted count queries for better performance and accuracy
        const today = new Date()
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

        // Execute all count queries in parallel for better performance with error handling
        const [
          totalUsersResult,
          verifiedUsersResult,
          todaySignupsResult,
          pendingVerificationsResult,
          maleUsersResult,
          femaleUsersResult,
          completedProfilesResult
        ] = await Promise.allSettled([
          // Total users
          supabase.from("users").select("id", { count: "exact", head: true }),
          
          // Verified users
          supabase.from("users").select("id", { count: "exact", head: true }).eq("verification_status", "verified"),
          
          // Today's signups
          supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
          
          // Pending verifications
          supabase.from("users").select("id", { count: "exact", head: true }).in("verification_status", ["pending", "unverified"]),
          
          // Male users
          supabase.from("users").select("id", { count: "exact", head: true }).eq("gender", "Male"),
          
          // Female users
          supabase.from("users").select("id", { count: "exact", head: true }).eq("gender", "Female"),
          
          // Completed profiles
          supabase.from("users").select("id", { count: "exact", head: true }).eq("is_onboarded", true)
        ])

        // Process results with error handling
        const getCount = (result: any) => {
          if (result.status === 'fulfilled' && result.value?.count !== undefined) {
            return result.value.count || 0;
          }
          if (result.status === 'rejected') {
            console.error('Stats query failed:', result.reason);
          }
          return 0;
        };

        stats = {
          totalUsers: getCount(totalUsersResult),
          verifiedUsers: getCount(verifiedUsersResult),
          todaySignups: getCount(todaySignupsResult),
          pendingVerifications: getCount(pendingVerificationsResult),
          maleUsers: getCount(maleUsersResult),
          femaleUsers: getCount(femaleUsersResult),
          completedProfiles: getCount(completedProfilesResult),
        }
        
        // Log the stats for debugging
        console.log("Stats calculated with count queries:", stats)

      } catch (error) {
        console.error("Stats calculation error:", error)
        // Fallback stats
        stats = {
          totalUsers: 0,
          verifiedUsers: 0,
          todaySignups: 0,
          pendingVerifications: 0,
          maleUsers: 0,
          femaleUsers: 0,
          completedProfiles: 0,
        }
      }
    }

    return NextResponse.json({
      users: paginatedUsers,
      pagination,
      stats,
      success: true,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculateProfileCompletion(user: any): number {
  let score = 0
  const totalFields = 18 // Adjusted to match actual schema fields

  const fields = [
    user.first_name,
    user.last_name,
    user.email,
    user.phone,
    user.birthdate,
    user.gender,
    user.city,
    user.state,
    user.education,
    user.profession,
    user.about_me,
    user.height,
    user.mother_tongue,
    user.marital_status,
    user.diet,
    user.annual_income,
    user.temple_visit_freq,
  ]

  fields.forEach((field) => {
    if (field && field.toString().trim() !== "") score += 1
  })

  if (user.user_photos && user.user_photos.length > 0) score += 1
  if (user.daily_practices && user.daily_practices.length > 0) score += 1

  return Math.round((score / totalFields) * 100)
}
