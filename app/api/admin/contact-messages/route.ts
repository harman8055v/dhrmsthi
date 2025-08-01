import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Helper function to check if role is admin (case-insensitive)
const isAdminRole = (role: string | null): boolean => {
  if (!role) return false
  const normalizedRole = role.toLowerCase()
  return normalizedRole === "admin" || normalizedRole === "super_admin" || normalizedRole === "superadmin"
}

export async function GET(request: NextRequest) {
  try {
    // Authentication and authorization check
    const cookieStore = await cookies()
    const authClient = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const {
      data: { session },
      error: sessionError,
    } = await authClient.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, is_active")
      .eq("id", session.user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!userData.is_active) {
      return NextResponse.json({ error: "Account deactivated" }, { status: 403 })
    }

    if (!isAdminRole(userData.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status") || "all"
    const search = searchParams.get("search") || ""

    const offset = (page - 1) * limit

    // Build the base query
    let query = supabase
      .from("contact_messages")
      .select(`
        id, name, email, subject, message, status,
        replied_by, replied_at, created_at, updated_at,
        replied_by_user:users!replied_by(first_name, last_name, email)
      `)

    // Apply status filter
    if (status !== "all") {
      query = query.eq("status", status)
    }

    // Apply search filter
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`
      )
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq(status !== "all" ? "status" : "id", status !== "all" ? status : undefined)

    if (countError) {
      console.error("Count query error:", countError)
      return NextResponse.json({ error: "Failed to count messages" }, { status: 500 })
    }

    // Get paginated results
    const { data: messages, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
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

    return NextResponse.json({
      messages: messages || [],
      pagination,
      success: true,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Authentication and authorization check
    const cookieStore = await cookies()
    const authClient = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const {
      data: { session },
      error: sessionError,
    } = await authClient.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, is_active")
      .eq("id", session.user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!userData.is_active) {
      return NextResponse.json({ error: "Account deactivated" }, { status: 403 })
    }

    if (!isAdminRole(userData.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get("id")
    const body = await request.json()
    const { status, replied_by } = body

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ["unread", "read", "replied", "resolved"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: any = { updated_at: new Date().toISOString() }
    
    if (status) {
      updateData.status = status
      
      // If marking as replied, set replied timestamp
      if (status === "replied" && replied_by) {
        updateData.replied_by = replied_by
        updateData.replied_at = new Date().toISOString()
      }
    }

    // Update the message
    const { data, error } = await supabase
      .from("contact_messages")
      .update(updateData)
      .eq("id", messageId)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to update message" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Message updated successfully",
      data,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 