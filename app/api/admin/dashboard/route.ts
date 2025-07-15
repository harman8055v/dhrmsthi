import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
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

    // Build the base query with actual schema columns from your database
    let baseQuery = supabase.from("users").select(`
      id, phone, email, email_verified, mobile_verified, full_name, first_name, last_name,
      gender, birthdate, city_id, state_id, country_id, profile_photo_url, user_photos,
      spiritual_org, daily_practices, diet, temple_visit_freq, artha_vs_moksha,
      vanaprastha_interest, favorite_spiritual_quote, education, profession, annual_income,
      marital_status, super_likes_count, swipe_count, message_highlights_count,
      is_onboarded, is_verified, account_status, preferred_gender, preferred_age_min,
      preferred_age_max, preferred_height_min, preferred_height_max, preferred_location,
      preferred_diet, preferred_profession, created_at, updated_at, daily_swipe_count,
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

      // Apply photo filter
      if (photoFilter !== "all") {
        if (photoFilter === "has_photos") {
          query = query.not("user_photos", "is", null).neq("user_photos", "{}")
        } else if (photoFilter === "no_photos") {
          query = query.or("user_photos.is.null,user_photos.eq.{}")
        }
      }

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

    // Apply sorting and pagination to the main query
    const { data: users, error } = await baseQuery
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1)

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

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Filter by profile completion if needed (client-side filtering for complex logic)
    let filteredUsers = transformedUsers || []
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

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    const pagination = {
      page,
      limit,
      total: totalCount,
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

        // Execute all count queries in parallel for better performance
        const [
          totalUsersResult,
          verifiedUsersResult,
          todaySignupsResult,
          pendingVerificationsResult,
          maleUsersResult,
          femaleUsersResult,
          completedProfilesResult
        ] = await Promise.all([
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

        stats = {
          totalUsers: totalUsersResult.count || 0,
          verifiedUsers: verifiedUsersResult.count || 0,
          todaySignups: todaySignupsResult.count || 0,
          pendingVerifications: pendingVerificationsResult.count || 0,
          maleUsers: maleUsersResult.count || 0,
          femaleUsers: femaleUsersResult.count || 0,
          completedProfiles: completedProfilesResult.count || 0,
        }
        
        // Log the stats for debugging
        console.log("Stats calculated with count queries:", stats)

        // Check for any errors in the queries
        const errors = [
          totalUsersResult.error,
          verifiedUsersResult.error,
          todaySignupsResult.error,
          pendingVerificationsResult.error,
          maleUsersResult.error,
          femaleUsersResult.error,
          completedProfilesResult.error
        ].filter(Boolean)

        if (errors.length > 0) {
          console.error("Some stats queries failed:", errors)
        }

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
      users: filteredUsers,
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
