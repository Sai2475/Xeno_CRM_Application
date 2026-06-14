"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Megaphone, Activity, Users, Eye, CheckCircle2, Send, List, ChevronRight, Clock } from "lucide-react"

export default function CampaignsHub() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [liveMetrics, setLiveMetrics] = useState<any>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/campaigns")
      .then(res => res.json())
      .then(data => {
        setCampaigns(data.campaigns || [])
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to fetch campaigns", err)
        setLoading(false)
      })
  }, [])

  const connectToCampaign = (id: string) => {
    if (ws) ws.close()
    setSelectedCampaignId(id)
    setLiveMetrics(null)
    
    // Fetch initial state
    fetch(`http://127.0.0.1:8000/api/campaigns/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Not found")
        return res.json()
      })
      .then(data => {
        setLiveMetrics(data)
      })
      .catch(() => {
        setLiveMetrics(null)
        alert("Campaign not found or hasn't started sending yet.")
        return;
      })

    const wsUrlBase = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000"
    const newWs = new WebSocket(`${wsUrlBase}/ws/campaigns/${id}`)
    newWs.onmessage = (event) => {
      const payload = JSON.parse(event.data)
      if (payload.event === "status_update") {
        setLiveMetrics(payload.data)
      }
    }
    setWs(newWs)
  }

  useEffect(() => {
    return () => {
      if (ws) ws.close()
    }
  }, [ws])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          Campaign Hub <Megaphone className="w-6 h-6 text-primary" />
        </h1>
        <p className="text-muted-foreground mt-1">Track your fitness campaigns and class attendance impact in real-time.</p>
      </div>

      {!selectedCampaignId ? (
        <Card className="border-border bg-card/80 backdrop-blur shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <List className="w-5 h-5 text-primary" /> Recent Campaigns
            </CardTitle>
            <CardDescription>Select a campaign to view its live performance metrics.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 rounded-full border-4 border-t-primary border-muted animate-spin"></div>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No campaigns found. Use the FitFlow Copilot to draft and launch one!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaigns.map((camp) => (
                  <div 
                    key={camp.campaign_id}
                    onClick={() => connectToCampaign(camp.campaign_id)}
                    className="p-5 border border-border rounded-xl bg-background hover:border-primary hover:shadow-[0_0_20px_-5px_rgba(79,70,229,0.2)] cursor-pointer transition-all group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{camp.name}</h3>
                      <div className="px-2 py-1 bg-muted rounded-md text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {camp.channel}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1.5"><Users className="w-4 h-4"/> {camp.customer_count} Target</div>
                      <div className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> {new Date(camp.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                      View Metrics <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedCampaignId(null)}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" /> Back to Campaigns List
          </button>

          {liveMetrics ? (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-xl font-bold">Live Simulation <span className="text-muted-foreground text-sm font-normal">({liveMetrics.campaign_id})</span></h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="border-t-4 border-t-blue-500 bg-card/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle>
                    <Send className="w-4 h-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-foreground">{liveMetrics.sent || 0}</div>
                    <div className="w-full bg-muted h-1.5 mt-4 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-full" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-t-4 border-t-yellow-500 bg-card/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle>
                    <CheckCircle2 className="w-4 h-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-yellow-500">{liveMetrics.delivered || 0}</div>
                    <div className="w-full bg-muted h-1.5 mt-4 rounded-full overflow-hidden">
                      <div className="bg-yellow-500 h-full transition-all duration-500" style={{ width: `${(liveMetrics.delivered / Math.max(liveMetrics.sent, 1)) * 100}%` }} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-t-4 border-t-indigo-400 bg-card/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Opened / Read</CardTitle>
                    <Eye className="w-4 h-4 text-indigo-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-indigo-400">{liveMetrics.opened || 0} <span className="text-lg font-normal text-muted-foreground">/ {liveMetrics.read || 0}</span></div>
                    <div className="w-full bg-muted h-1.5 mt-4 rounded-full overflow-hidden">
                      <div className="bg-indigo-400 h-full transition-all duration-500" style={{ width: `${(liveMetrics.opened / Math.max(liveMetrics.delivered, 1)) * 100}%` }} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-t-4 border-t-primary bg-card/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Clicked</CardTitle>
                    <Users className="w-4 h-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-primary">{liveMetrics.clicked || 0}</div>
                    <div className="w-full bg-muted h-1.5 mt-4 rounded-full overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-500" style={{ width: `${(liveMetrics.clicked / Math.max(liveMetrics.opened, 1)) * 100}%` }} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-t-4 border-t-stone-700 bg-card/50 shadow-[0_0_15px_-3px_rgba(34,197,94,0.25)]">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Converted</CardTitle>
                    <Activity className="w-4 h-4 text-stone-700" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-stone-700">{liveMetrics.converted || 0}</div>
                    <div className="w-full bg-muted h-1.5 mt-4 rounded-full overflow-hidden">
                      <div className="bg-stone-700 h-full transition-all duration-500" style={{ width: `${(liveMetrics.converted / Math.max(liveMetrics.clicked, 1)) * 100}%` }} />
                    </div>
                  </CardContent>
                </Card>
              </div>

               <Card className="bg-gradient-to-br from-card to-muted border border-border mt-8 p-8 flex flex-col items-center justify-center text-center">
                 <Activity className="w-12 h-12 text-primary mb-4 opacity-50" />
                 <h3 className="text-xl font-bold">Class Attendance Impact</h3>
                 <p className="text-muted-foreground max-w-md mt-2">
                    Waitlist conversions and class check-ins will populate here once the campaign finishes its delivery cycle. 
                 </p>
                 <div className="mt-6 px-4 py-2 bg-background border border-border rounded-full text-xs font-mono font-bold text-foreground inline-block">
                    Simulated attendance metrics arrive after 5-10 minutes.
                 </div>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-12 h-12 rounded-full border-4 border-t-primary border-muted animate-spin mb-4"></div>
              <p className="text-muted-foreground">Connecting to live feed...</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
