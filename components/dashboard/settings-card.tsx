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
    <Card 
      className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:from-[#8b0000]/5 hover:to-red-50/50 group" 
      onClick={onClick}
    >
      <CardContent className="p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#8b0000]/10 to-red-100 rounded-2xl flex items-center justify-center text-[#8b0000] shadow-md group-hover:shadow-lg group-hover:from-[#8b0000]/20 group-hover:to-red-200 transition-all duration-300">
              {icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-gray-900 text-base md:text-lg group-hover:text-[#8b0000] transition-colors duration-300">{title}</h3>
                {badge && (
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${badgeStyles[badgeColor]}`}>
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
            </div>
          </div>
          <div className="ml-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8b0000]/10 to-red-100 flex items-center justify-center group-hover:from-[#8b0000]/20 group-hover:to-red-200 transition-all duration-300">
              <ChevronRight className="w-4 h-4 text-[#8b0000] group-hover:translate-x-0.5 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
