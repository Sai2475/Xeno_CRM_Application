"use client"

import { useEffect, useState } from "react"
import { fetchDashboard } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Send, CheckCircle2, Eye, MousePointerClick, RefreshCw } from "lucide-react"

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [liveEvents, setLiveEvents] = useState<any[]>([])

  const [stats, setStats] = useState({
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0
  })

  const loadData = () => {
    fetchDashboard().then(res => {
      setData(res.metrics)
      
      const newStats = { sent: 0, delivered: 0, opened: 0, clicked: 0 }
      if (res.metrics?.analytics) {
        res.metrics.analytics.forEach((a: any) => {
          if (newStats[a.metric as keyof typeof newStats] !== undefined) {
            newStats[a.metric as keyof typeof newStats] += a.count
          }
        })
      }
      setStats(newStats)
      setLoading(false)
    }).catch(console.error)
  }

  useEffect(() => {
    loadData()

    const ws = new WebSocket('ws://localhost:8000/ws/dashboard')
    
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data)
      if (payload.event === "global_status_update") {
        const status = payload.data.status
        setStats(prev => ({
          ...prev,
          [status]: (prev[status as keyof typeof prev] || 0) + 1
        }))
      }
    }

    return () => {
      ws.close()
    }
  }, [])

  if (loading) return <div className="animate-pulse flex items-center justify-center h-full">Loading dashboard...</div>

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Executive Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time performance and AI insights</p>
        </div>
        <button onClick={loadData} className="p-2 bg-muted rounded-full hover:bg-secondary transition-colors">
          <RefreshCw className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total_customers || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sent</CardTitle>
            <Send className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Delivered</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.delivered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Opened / Clicked</CardTitle>
            <Eye className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{stats.opened} / {stats.clicked}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-12 flex flex-col items-center justify-center border-dashed border-border text-center bg-card/30">
        <h3 className="text-xl font-bold mb-2">Ready to Launch?</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          Use the **Xeno Copilot** sidebar on the right to chat with the AI. Ask it to build a segment and draft a campaign, then launch it with one click!
        </p>
      </Card>
    </div>
  )
}
