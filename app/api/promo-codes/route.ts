import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

/**
 * API route for validating and processing promo codes
 * Used by both web app and mobile app for promotional campaigns
 */

export async function POST(request: NextRequest) {
  try {
    const { promoCode, action = 'validate', userId } = await request.json()

    if (!promoCode) {
      return NextResponse.json({ error: "Promo code is required" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Get current user if not provided
    let currentUserId = userId
    if (!currentUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        currentUserId = user.id
      }
    }

    // Check if promo code exists and is valid
    const { data: campaign, error: campaignError } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('promo_code', promoCode)
      .eq('is_active', true)
      .gte('valid_until', new Date().toISOString())
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({
        valid: false,
        error: "Invalid or expired promo code"
      }, { status: 400 })
    }

    // Check usage limits if user is provided
    if (currentUserId) {
      const { data: usage, error: usageError } = await supabase
        .from('promo_code_usage')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('user_id', currentUserId)
        .single()

      if (usage && !usageError) {
        return NextResponse.json({
          valid: false,
          error: "Promo code already used"
        }, { status: 400 })
      }

      // Check campaign usage limits
      if (campaign.max_uses) {
        const { count: totalUsage } = await supabase
          .from('promo_code_usage')
          .select('*', { count: 'exact' })
          .eq('campaign_id', campaign.id)

        if (totalUsage && totalUsage >= campaign.max_uses) {
          return NextResponse.json({
            valid: false,
            error: "Promo code usage limit reached"
          }, { status: 400 })
        }
      }
    }

    // If action is 'validate', just return the campaign info
    if (action === 'validate') {
      return NextResponse.json({
        valid: true,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          type: campaign.type,
          discount: campaign.discount,
          validUntil: campaign.valid_until,
          description: campaign.description
        }
      })
    }

    // If action is 'redeem', record the usage
    if (action === 'redeem' && currentUserId) {
      const { error: redeemError } = await supabase
        .from('promo_code_usage')
        .insert({
          campaign_id: campaign.id,
          user_id: currentUserId,
          promo_code: promoCode,
          redeemed_at: new Date().toISOString(),
          discount_applied: campaign.discount
        })

      if (redeemError) {
        console.error('Error recording promo code usage:', redeemError)
        return NextResponse.json({
          error: "Failed to redeem promo code"
        }, { status: 500 })
      }

      // Track analytics
      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'promo_code_redeemed',
          user_id: currentUserId,
          properties: {
            promo_code: promoCode,
            campaign_id: campaign.id,
            discount: campaign.discount
          },
          timestamp: new Date().toISOString()
        })

      return NextResponse.json({
        success: true,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          discount: campaign.discount,
          description: campaign.description
        },
        message: "Promo code redeemed successfully"
      })
    }

    return NextResponse.json({
      error: "Invalid action"
    }, { status: 400 })

  } catch (error) {
    console.error("Promo code API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'

    const supabase = createRouteHandlerClient({ cookies })

    let query = supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('is_active', true)
      .gte('valid_until', new Date().toISOString())

    if (type !== 'all') {
      query = query.eq('type', type)
    }

    const { data: campaigns, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Filter out sensitive information
    const publicCampaigns = campaigns?.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      title: campaign.title,
      description: campaign.description,
      imageUrl: campaign.image_url,
      discount: campaign.discount,
      validUntil: campaign.valid_until,
      hasPromoCode: !!campaign.promo_code,
      priority: campaign.priority
    })) || []

    return NextResponse.json({
      campaigns: publicCampaigns
    })

  } catch (error) {
    console.error("Get campaigns error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch campaigns",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
