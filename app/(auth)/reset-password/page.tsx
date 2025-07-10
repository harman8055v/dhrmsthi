import { Suspense } from "react"
import ResetPasswordClient from "./ResetPasswordClient"

export const dynamic = "force-static"; // page can be statically generated, inner handles client-side

export default function ResetPasswordPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordClient />
    </Suspense>
  )
} 