import ResetPasswordClient from "./ResetPasswordClient"

// This page MUST be dynamic to handle auth state and URL parameters
export const dynamic = "force-dynamic"

export default function ResetPasswordPage() {
  return <ResetPasswordClient />
} 