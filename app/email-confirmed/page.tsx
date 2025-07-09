"use client"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

export default function EmailConfirmedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Email Confirmed!</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-gray-600">Your email address has been successfully verified.</p>

          <Link href="/dashboard" className="block">
            <Button className="mt-6 w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white">
              Continue
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
} 