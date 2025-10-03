"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import AuthDialog from "@/components/auth-dialog"
import { useAuth } from "@/hooks/use-auth"

function LoginDialogWrapper() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [isOpen, setIsOpen] = useState(true)

	const defaultMode = (searchParams.get("mode") === "signup" ? "signup" : "login") as "signup" | "login"
	const prefillMobile = searchParams.get("mobile") || undefined

	const handleClose = () => {
		setIsOpen(false)
		// Navigate back to home when closing the dialog from the dedicated page
		router.push("/")
	}

	return (
		<AuthDialog
			isOpen={isOpen}
			onClose={handleClose}
			defaultMode={defaultMode}
			prefillMobile={prefillMobile}
		/>
	)
}

export default function LoginPage() {
	const { user, profile, loading } = useAuth()
	const router = useRouter()

	useEffect(() => {
		// Check if coming from password reset
		const isFromPasswordReset = typeof window !== 'undefined' && 
			(document.referrer.includes('/reset-password') || 
			 sessionStorage.getItem('password-reset-success') === 'true');
		
		if (isFromPasswordReset) {
			// Clear the flag
			sessionStorage.removeItem('password-reset-success');
			// Don't redirect, let them log in
			return;
		}

		if (!loading && user) {
			if (profile?.is_onboarded) {
				router.replace("/dashboard")
			} else {
				router.replace("/onboarding")
			}
		}
	}, [loading, user, profile, router])

	return (
		<main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
			<Suspense fallback={null}>
				<LoginDialogWrapper />
			</Suspense>
		</main>
	)
}


