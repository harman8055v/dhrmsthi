// lib/auth-utils.ts

import { SupabaseClient, Session, User } from "@supabase/supabase-js"

/**
 * Waits until Supabase auth has a valid session & user.
 * Retries with exponential back-off up to the provided timeout.
 *
 * @param supabase    Supabase client instance
 * @param timeoutMs   Maximum total time to wait (default 10s)
 * @param initialDelayMs Delay before first retry (default 250ms)
 * @param factor      Exponential factor for back-off (default 2)
 * @returns           Session & User objects once available
 * @throws            Error if timeout reached without a valid user
 */
export async function waitForAuthReady(
  supabase: SupabaseClient,
  {
    timeoutMs = 10_000,
    initialDelayMs = 250,
    factor = 2,
  }: { timeoutMs?: number; initialDelayMs?: number; factor?: number } = {},
): Promise<{ session: Session; user: User }> {
  let attemptDelay = initialDelayMs
  const start = Date.now()

  // Helper delay function
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

  while (Date.now() - start < timeoutMs) {
    // getSession is cheaper (single network call) and gives us user when ready
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      // non-fatal – log & retry
      if (process.env.NODE_ENV === "development") {
        console.warn("[waitForAuthReady] getSession error", sessionError)
      }
    }

    if (session?.user?.id) {
      return { session, user: session.user }
    }

    // Fallback to getUser (covers edge-cases where session may be null but user present)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError && process.env.NODE_ENV === "development") {
      console.warn("[waitForAuthReady] getUser error", userError)
    }

    if (user?.id) {
      // Build a synthetic session for consistency
      return { session: session as Session, user }
    }

    await sleep(attemptDelay)
    attemptDelay *= factor
  }

  throw new Error("Authentication not ready – please try again.")
} 