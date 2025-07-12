import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params

    // Get the blog post
    const { data: post, error } = await supabase
      .from("blog_posts")
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        featured_image_url,
        read_time_minutes,
        views_count,
        likes_count,
        published_at,
        tags,
        meta_title,
        meta_description,
        blog_authors!inner(name, bio, avatar_url),
        blog_categories!inner(name, slug, color)
      `)
      .eq("slug", slug)
      .eq("status", "published")
      .single()

    if (error || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Increment view count
    await supabase.rpc("increment_post_views", { post_uuid: post.id })

    // Get related posts
    const { data: relatedPosts } = await supabase
      .from("blog_posts")
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image_url,
        read_time_minutes,
        published_at,
        blog_authors!inner(name),
        blog_categories!inner(name, color)
      `)
      .eq("status", "published")
      .neq("id", post.id)
      .limit(3)
      .order("published_at", { ascending: false })

    return NextResponse.json({
      post: {
        ...post,
        views_count: post.views_count + 1, // Update the count in response
      },
      relatedPosts: relatedPosts || [],
    })
  } catch (error) {
    console.error("Error fetching blog post:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
