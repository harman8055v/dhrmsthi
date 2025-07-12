import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/withAuth"
import type { SupabaseClient, User } from "@supabase/supabase-js"

export const GET = withAuth(async (request: NextRequest, { supabase, user }: { supabase: SupabaseClient; user: User }) => {
  if ((user.app_metadata as any)?.role !== 'admin' && (user.user_metadata as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
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
})

export const PATCH = withAuth(async (request: NextRequest, { supabase, user }: { supabase: SupabaseClient; user: User }) => {
  if ((user.app_metadata as any)?.role !== 'admin' && (user.user_metadata as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
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
}) 