"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Sparkles, Search, Filter } from "lucide-react"
import { generateAudience } from "@/lib/api"

export default function AudienceBuilder() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleGenerate = async () => {
    if (!query) return
    setLoading(true)
    try {
      const res = await generateAudience(query)
      setResult(res)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          Audience Builder <Sparkles className="w-6 h-6 text-[#06b6d4]" />
        </h1>
        <p className="text-muted-foreground mt-1">Use natural language to segment your gym members.</p>
      </div>

      <Card className="border-[#06b6d4]/30 shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)] bg-card/80 backdrop-blur">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
              <input
                className="w-full h-12 pl-12 pr-4 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#06b6d4] focus:ring-1 focus:ring-[#06b6d4] transition-all"
                placeholder="e.g. Show me VIP members at risk of churning who love CrossFit"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
            </div>
            <Button size="lg" className="h-12 px-8 bg-gradient-primary text-white hover:opacity-90 border-0" onClick={handleGenerate} disabled={loading}>
              {loading ? "Analyzing..." : "Generate Segment"}
            </Button>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">AI Suggestions:</span>
            <button onClick={() => setQuery("Show me members at risk of churning")} className="text-xs text-[#06b6d4] hover:underline bg-[#06b6d4]/10 px-2 py-1 rounded">High Churn Risk</button>
            <button onClick={() => setQuery("Show me VIP members")} className="text-xs text-[#8b5cf6] hover:underline bg-[#8b5cf6]/10 px-2 py-1 rounded">VIP Members</button>
            <button onClick={() => setQuery("Show me members who love Yoga")} className="text-xs text-[#ec4899] hover:underline bg-[#ec4899]/10 px-2 py-1 rounded">Yoga Enthusiasts</button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="px-4 py-2 bg-[#06b6d4]/10 text-[#06b6d4] rounded-lg border border-[#06b6d4]/20 flex items-center gap-2 font-medium">
              <Users className="w-4 h-4" />
              {result.count} Members Found
            </div>
            <div className="px-4 py-2 bg-[#8b5cf6]/10 text-[#8b5cf6] rounded-lg border border-[#8b5cf6]/20 flex items-center gap-2 text-sm font-mono overflow-hidden max-w-md">
              <Filter className="w-4 h-4 shrink-0" />
              <span className="truncate">{JSON.stringify(result.filter_applied)}</span>
            </div>
            <div className="flex-1" />
            <Button className="bg-gradient-primary text-white border-0 hover:opacity-90 transition-opacity shadow-lg" onClick={() => alert("Audience saved successfully!")}>Save Audience</Button>
          </div>

          <Card className="overflow-hidden border-border bg-card/50">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4">Member</th>
                    <th className="px-6 py-4">Tier</th>
                    <th className="px-6 py-4">Favorite Class</th>
                    <th className="px-6 py-4">Health Status</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {result.customers.map((c: any) => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{c.name}</div>
                        <div className="text-muted-foreground text-xs">{c.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-secondary rounded text-xs font-semibold">{c.membership_type}</span>
                      </td>
                      <td className="px-6 py-4 text-foreground font-medium">{c.favorite_class || "None"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          c.health_score === 'Green' ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
                          c.health_score === 'Yellow' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                          'bg-red-500/20 text-red-500 border border-red-500/30 shadow-[0_0_10px_-2px_rgba(239,68,68,0.5)]'
                        }`}>
                          {c.health_score === 'Red' ? 'High Risk' : c.health_score === 'Yellow' ? 'At Risk' : 'Healthy'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="ghost" size="sm" className="h-8 hover:text-[#06b6d4]">View Profile</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.customers.length === 0 && (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                <Users className="w-12 h-12 opacity-20" />
                <p>No members matched this AI filter.</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
