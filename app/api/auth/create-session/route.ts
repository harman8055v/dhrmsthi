import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();
    
    if (!userId || !email) {
      return NextResponse.json({ error: "Missing userId or email" }, { status: 400 });
    }
    
    // Verify the user exists
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .eq("email", email)
      .single();
      
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Get the JWT secret from Supabase
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    
    if (!jwtSecret) {
      console.error("SUPABASE_JWT_SECRET not found in environment variables");
      // Fallback: use the service role key to create a session via admin API
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email: email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
        }
      });
      
      if (!sessionError && sessionData) {
        // Extract tokens from the recovery link
        const recoveryUrl = new URL(sessionData.properties.action_link);
        const accessToken = recoveryUrl.searchParams.get("access_token");
        const refreshToken = recoveryUrl.searchParams.get("refresh_token");
        
        if (accessToken && refreshToken) {
          return NextResponse.json({ 
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: "bearer",
            expires_in: 3600,
            user: { id: userId, email: email }
          });
        }
      }
    }
    
    // Create a custom JWT token that Supabase will accept
    const payload = {
      aud: "authenticated",
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
      sub: userId,
      email: email,
      role: "authenticated",
      session_id: crypto.randomUUID()
    };
    
    // Sign with Supabase JWT secret
    const token = jwt.sign(payload, jwtSecret!);
    
    return NextResponse.json({ 
      access_token: token,
      token_type: "bearer",
      expires_in: 60 * 60 * 24 * 7,
      refresh_token: token, // In this case, same as access token
      user: { id: userId, email: email }
    });
    
  } catch (err: any) {
    console.error("Session creation error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
