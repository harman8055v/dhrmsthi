"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"

interface SettingsCardProps {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
  badge?: string
  badgeColor?: "default" | "success" | "warning" | "error"
}

export default function SettingsCard({
  title,
  description,
  icon,
  onClick,
  badge,
  badgeColor = "default",
}: SettingsCardProps) {
  const badgeStyles = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
              {icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{title}</h3>
                {badge && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeStyles[badgeColor]}`}>
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  )
}
