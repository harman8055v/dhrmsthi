import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createRecoverySession(email: string, code: string) {
  try {
    // Find the user by email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();

    if (userError || !user) {
      console.log(`User lookup failed for email: ${email}`, userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the JWT secret from Supabase
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;

    if (!jwtSecret) {
      console.error("SUPABASE_JWT_SECRET not found in environment variables");
      console.log("Attempting to use admin API to generate recovery link...");

      try {
        // Fallback: use the service role key to create a session via admin API
        const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
          type: "recovery",
          email: email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
          }
        });

        if (sessionError) {
          console.error("Admin generateLink error:", sessionError);
          return NextResponse.json({ error: "Failed to generate recovery link" }, { status: 500 });
        }

        if (!sessionData) {
          console.error("No session data returned from generateLink");
          return NextResponse.json({ error: "Failed to generate recovery link" }, { status: 500 });
        }

        console.log("Generated recovery link:", sessionData.properties.action_link);

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
            user: { id: user.id, email: user.email }
          });
        } else {
          console.error("No tokens found in recovery URL");
          return NextResponse.json({ error: "Invalid recovery link generated" }, { status: 500 });
        }
      } catch (adminError) {
        console.error("Admin API error:", adminError);
        return NextResponse.json({ error: "Failed to generate recovery session" }, { status: 500 });
      }
    }

    // Create a custom JWT token that Supabase will accept
    const payload = {
      aud: "authenticated",
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
      sub: user.id,
      email: email,
      role: "authenticated",
      session_id: crypto.randomUUID(),
      // Add recovery-specific claims
      recovery_code: code,
      type: "recovery"
    };

    console.log("Creating JWT token for recovery session:", { email, userId: user.id });

    // Sign with Supabase JWT secret
    const token = jwt.sign(payload, jwtSecret!);

    return NextResponse.json({
      access_token: token,
      token_type: "bearer",
      expires_in: 60 * 60,
      refresh_token: token, // In this case, same as access token
      user: { id: user.id, email: user.email }
    });

  } catch (err: any) {
    console.error("Recovery session creation error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, email, code } = await req.json();
    console.log("API request:", { userId: !!userId, email: !!email, code: !!code });

    // Support both the original endpoint and the new recovery endpoint
    if (code && email && !userId) {
      // This is a recovery session request (no userId provided)
      console.log("Processing recovery session request:", { email, hasCode: !!code });
      return await createRecoverySession(email, code);
    }

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
