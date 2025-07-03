import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "9")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const featured = searchParams.get("featured")

    const offset = (page - 1) * limit

    let query = supabase
      .from("blog_posts")
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image_url,
        read_time_minutes,
        views_count,
        likes_count,
        is_featured,
        published_at,
        tags,
        blog_authors!inner(name, avatar_url),
        blog_categories!inner(name, slug, color)
      `)
      .eq("status", "published")
      .order("published_at", { ascending: false })

    // Apply filters
    if (category && category !== "all") {
      query = query.eq("blog_categories.slug", category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,tags.cs.{${search}}`)
    }

    if (featured === "true") {
      query = query.eq("is_featured", true)
    }

    // Get total count for pagination
    const { count } = await supabase
      .from("blog_posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")

    // Get paginated results
    const { data: posts, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching blog posts:", error)
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }

    return NextResponse.json({
      posts: posts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Error in blog posts API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
