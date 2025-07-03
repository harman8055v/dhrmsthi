"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Monitor } from "lucide-react"

interface LoginHistory {
  id: number
  login_at: string
  ip_address: string | null
  user_agent: string | null
}

interface UserLoginHistoryProps {
  userId: string
}

export function UserLoginHistory({ userId }: UserLoginHistoryProps) {
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLoginHistory()
  }, [userId])

  const fetchLoginHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("login_history")
        .select("*")
        .eq("user_id", userId)
        .order("login_at", { ascending: false })
        .limit(10)

      if (error) throw error
      setLoginHistory(data || [])
    } catch (error) {
      console.error("Error fetching login history:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getBrowserFromUserAgent = (userAgent: string | null) => {
    if (!userAgent) return "Unknown"

    if (userAgent.includes("Chrome")) return "Chrome"
    if (userAgent.includes("Firefox")) return "Firefox"
    if (userAgent.includes("Safari")) return "Safari"
    if (userAgent.includes("Edge")) return "Edge"
    return "Other"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Login History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Login History ({loginHistory.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loginHistory.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No login history found</div>
        ) : (
          <div className="space-y-3">
            {loginHistory.map((login) => (
              <div key={login.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">{formatDate(login.login_at)}</span>
                  </div>
                  {login.ip_address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{login.ip_address}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="text-xs">
                    <Monitor className="h-3 w-3 mr-1" />
                    {getBrowserFromUserAgent(login.user_agent)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
