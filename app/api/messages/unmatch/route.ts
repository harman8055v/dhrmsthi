import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies(); const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { match_id } = await request.json()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!match_id) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 })
    }

    // Verify user is part of the match
    const { data: match, error: matchError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('id', match_id)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found or access denied" }, { status: 404 })
    }

    // Delete all messages for this match first
    const { error: messagesError } = await supabaseAdmin
      .from("messages")
      .delete()
      .eq("match_id", match_id)

    if (messagesError) {
      console.error("Error deleting messages:", messagesError)
      // Continue even if message deletion fails
    }

    // Delete the match
    const { error: unmatchError } = await supabaseAdmin
      .from("matches")
      .delete()
      .eq("id", match_id)

    if (unmatchError) {
      console.error("Error deleting match:", unmatchError)
      return NextResponse.json({ error: "Failed to unmatch" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unmatch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 