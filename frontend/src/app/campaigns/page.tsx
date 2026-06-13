"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Megaphone, Activity, CheckCircle2, XCircle, Send } from "lucide-react"

export default function CampaignsPage() {
  // In a real flow, you would pass the launched campaign ID via context or URL parameter
  // For demo purposes, we will provide an input to track a specific campaign
  const [campaignId, setCampaignId] = useState("")
  const [activeTrackingId, setActiveTrackingId] = useState("")
  const [socket, setSocket] = useState<WebSocket | null>(null)
  
  const [stats, setStats] = useState({
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    failed: 0
  })

  useEffect(() => {
    if (!activeTrackingId) return

    // Fetch initial state
    fetch(`http://localhost:8000/api/campaigns/${activeTrackingId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.detail) {
          setStats({
            sent: data.sent || 0,
            delivered: data.delivered || 0,
            opened: data.opened || 0,
            clicked: data.clicked || 0,
            failed: data.failed || 0
          })
        }
      })
      .catch(console.error)

    const ws = new WebSocket(`ws://localhost:8000/ws/campaigns/${activeTrackingId}`)
    
    ws.onopen = () => {
      console.log("Connected to WebSocket for campaign", activeTrackingId)
    }

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data)
      if (payload.event === "status_update") {
        const d = payload.data
        setStats({
          sent: d.sent || 0,
          delivered: d.delivered || 0,
          opened: d.opened || 0,
          clicked: d.clicked || 0,
          failed: d.failed || 0
        })
      }
    }

    ws.onclose = () => {
      console.log("WebSocket disconnected")
    }

    setSocket(ws)

    return () => {
      ws.close()
    }
  }, [activeTrackingId])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          Campaign Hub <Megaphone className="w-6 h-6 text-blue-400" />
        </h1>
        <p className="text-muted-foreground mt-1">Track your live campaigns in real-time.</p>
      </div>

      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle>Live Campaign Tracking</CardTitle>
          <CardDescription>Enter a Campaign ID to connect to the WebSocket stream.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <input 
              value={campaignId}
              onChange={e => setCampaignId(e.target.value)}
              className="flex-1 h-10 px-3 bg-muted border border-border rounded-md text-sm focus:outline-none focus:border-primary"
              placeholder="Paste MongoDB Campaign ID here..."
            />
            <button 
              onClick={() => {
                setStats({ sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 })
                setActiveTrackingId(campaignId)
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
            >
              Track Live
            </button>
          </div>

          {activeTrackingId ? (
             <div className="pt-6">
                <div className="flex items-center gap-2 mb-4 text-green-400 font-medium text-sm">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  WebSocket Connected to {activeTrackingId}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 text-center">
                  <div className="p-4 bg-muted rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground uppercase">Sent</p>
                    <p className="text-3xl font-bold mt-2">{stats.sent}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground uppercase">Delivered</p>
                    <p className="text-3xl font-bold mt-2 text-green-400">{stats.delivered}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground uppercase">Opened</p>
                    <p className="text-3xl font-bold mt-2 text-purple-400">{stats.opened}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground uppercase">Clicked</p>
                    <p className="text-3xl font-bold mt-2 text-blue-400">{stats.clicked}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-xl border border-red-500/20">
                    <p className="text-xs text-red-500/70 uppercase">Failed</p>
                    <p className="text-3xl font-bold mt-2 text-red-400">{stats.failed}</p>
                  </div>
                </div>

                {/* Funnel Visualization */}
                <div className="mt-8 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Delivery Pipeline Funnel</p>
                  <div className="h-4 w-full bg-muted rounded-full overflow-hidden flex relative">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500" 
                      style={{ width: stats.sent > 0 ? '100%' : '0%' }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>Targeted</span>
                    <span>Delivered</span>
                    <span>Opened</span>
                    <span>Converted</span>
                  </div>
                </div>
             </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground border-t border-border mt-4">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Connect to a campaign to see the live metrics funnel.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
