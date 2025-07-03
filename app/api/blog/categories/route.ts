import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const { data: categories, error } = await supabase
      .from("blog_categories")
      .select("id, name, slug, description, color")
      .order("name")

    if (error) {
      console.error("Error fetching categories:", error)
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
    }

    return NextResponse.json({ categories: categories || [] })
  } catch (error) {
    console.error("Error in categories API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
