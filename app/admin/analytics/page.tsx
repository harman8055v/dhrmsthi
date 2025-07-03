"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Activity, MousePointer, Eye, TrendingUp, Download } from "lucide-react"
import analytics from "@/lib/analytics"

interface AnalyticsData {
  totalEvents: number
  eventTypes: Record<string, number>
  buttonClicks: Record<string, number>
  pageViews: Record<string, number>
  lastActivity: Date | null
}

interface EngagementMetrics {
  total_events: number
  unique_sessions: number
  button_clicks: number
  page_views: number
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const loadAnalyticsData = async () => {
    try {
      // Get local analytics summary
      const summary = analytics.getAnalyticsSummary()
      setAnalyticsData(summary)

      // Fetch server-side analytics if available
      try {
        const response = await fetch(
          "/api/analytics?start_date=" + new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        )
        if (response.ok) {
          const serverData = await response.json()
          // Process server data here if needed
        }
      } catch (error) {
        console.log("Server analytics not available, using local data")
      }

      setLoading(false)
    } catch (error) {
      console.error("Failed to load analytics data:", error)
      setLoading(false)
    }
  }

  const exportAnalytics = () => {
    const events = analytics.getStoredEvents()
    const dataStr = JSON.stringify(events, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `dharma-saathi-analytics-${new Date().toISOString().split("T")[0]}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  const eventTypeData = analyticsData
    ? Object.entries(analyticsData.eventTypes).map(([name, count]) => ({
        name: name.replace("_", " ").toUpperCase(),
        count,
      }))
    : []

  const buttonClickData = analyticsData
    ? Object.entries(analyticsData.buttonClicks).map(([name, count]) => ({
        name,
        count,
      }))
    : []

  const pageViewData = analyticsData
    ? Object.entries(analyticsData.pageViews).map(([name, count]) => ({
        name,
        count,
      }))
    : []

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1"]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track user engagement and behavior insights</p>
        </div>
        <Button onClick={exportAnalytics} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground">All tracked user interactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Button Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData ? Object.values(analyticsData.buttonClicks).reduce((a, b) => a + b, 0) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Total button interactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData ? Object.values(analyticsData.pageViews).reduce((a, b) => a + b, 0) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Total page visits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.lastActivity ? new Date(analyticsData.lastActivity).toLocaleDateString() : "No data"}
            </div>
            <p className="text-xs text-muted-foreground">Most recent user activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Event Types</TabsTrigger>
          <TabsTrigger value="buttons">Button Clicks</TabsTrigger>
          <TabsTrigger value="pages">Page Views</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Types Distribution</CardTitle>
              <CardDescription>Breakdown of different user interaction types</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Count",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={eventTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {eventTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buttons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Button Click Analytics</CardTitle>
              <CardDescription>Most clicked buttons and their engagement rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Clicks",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={buttonClickData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Footer Button Specific Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Footer Button Performance</CardTitle>
              <CardDescription>Detailed analytics for footer CTA button</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analyticsData?.buttonClicks || {}).map(([buttonName, count]) => (
                  <div key={buttonName} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{buttonName}</p>
                      <p className="text-sm text-muted-foreground">Footer CTA Button</p>
                    </div>
                    <Badge variant="secondary">{count} clicks</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Page View Analytics</CardTitle>
              <CardDescription>Most visited pages and user navigation patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Views",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pageViewData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
