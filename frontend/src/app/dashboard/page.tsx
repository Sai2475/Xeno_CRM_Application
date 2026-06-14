"use client"

import { useEffect, useState } from "react"
import { fetchDashboard } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Send, CheckCircle2, Eye, RefreshCw, Activity, AlertTriangle, CalendarClock } from "lucide-react"

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({
    sent: 0,
    delivered: 0,
    opened: 0,
    read: 0,
    clicked: 0,
    converted: 0
  })

  const loadData = () => {
    fetchDashboard().then(res => {
      setData(res.metrics)
      
      const newStats = { sent: 0, delivered: 0, opened: 0, read: 0, clicked: 0, converted: 0 }
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

    const wsUrlBase = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000"
    const ws = new WebSocket(`${wsUrlBase}/ws/dashboard`)
    
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

  if (loading) return <div className="animate-pulse flex items-center justify-center h-full text-primary">Loading FitFlow Dashboard...</div>

  // Calculated metrics
  const activeMembers = data?.total_customers ? data.total_customers - (data.at_risk || 0) : 0;
  const retentionRate = data?.total_customers ? Math.round((activeMembers / data.total_customers) * 100) : 0;
  const churnRiskPct = data?.total_customers ? Math.round(((data?.at_risk || 0) / data.total_customers) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor real-time campaign performance and member retention metrics.
          </p>
        </div>
        <button 
          onClick={loadData} 
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors border border-border"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm font-medium">Refresh Data</span>
        </button>
      </div>

      <h2 className="text-xl font-bold">Member Health Overview</h2>
      
      {/* Metrics Row 1: Gym Specific */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-t-4 border-t-primary shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
            <Activity className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{activeMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">{retentionRate}% current retention</p>
          </CardContent>
        </Card>
        
        <Card className="border-t-4 border-t-destructive shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/10 rounded-bl-full"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Churn Risk</CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{data?.at_risk || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{churnRiskPct}% of total base</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-yellow-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Renewals Due</CardTitle>
            <CalendarClock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">{data?.renewals_due || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Expiring within 30 days</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold pt-4">Campaign Engagement</h2>

      {/* Metrics Row 2: Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Targeted</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total_customers || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sent / Delivered</CardTitle>
            <Send className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent} <span className="text-sm font-normal text-muted-foreground">/ {stats.delivered}</span></div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Opened / Read</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.opened} <span className="text-sm font-normal text-muted-foreground">/ {stats.read}</span></div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clicked</CardTitle>
            <Eye className="w-4 h-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-400">{stats.clicked}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border border-green-500/30 shadow-[0_0_15px_-3px_rgba(34,197,94,0.2)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Converted</CardTitle>
            <Activity className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.converted}</div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
