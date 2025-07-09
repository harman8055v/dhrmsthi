"use client"

import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface SectionHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  backButton?: boolean
  actions?: ReactNode
  className?: string
}

export default function SectionHeader({
  title,
  subtitle,
  onBack,
  backButton = true,
  actions,
  className = "",
}: SectionHeaderProps) {
  const router = useRouter()

  return (
    <div className={`mb-6 mt-5 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {backButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack ? onBack : () => router.back()}
              className="p-2 flex-shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 truncate">{title}</h1>
            {subtitle && <p className="text-sm text-gray-600 whitespace-normal break-words">{subtitle}</p>}
          </div>
        </div>
        {actions && (
          <div className="grid grid-cols-2 gap-3 w-full sm:flex sm:w-auto sm:gap-2 mt-3 sm:mt-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
} 