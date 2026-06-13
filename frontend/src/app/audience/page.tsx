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
          Audience Builder <Sparkles className="w-6 h-6 text-yellow-400" />
        </h1>
        <p className="text-gray-400 mt-1">Use natural language to segment your customers.</p>
      </div>

      <Card className="border-blue-500/30 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input
                className="w-full h-12 pl-12 pr-4 rounded-lg bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="e.g. Customers who spent more than ₹5000 and haven't purchased in 45 days"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
            </div>
            <Button size="lg" className="h-12 px-8 bg-blue-600 hover:bg-blue-500" onClick={handleGenerate} disabled={loading}>
              {loading ? "Generating..." : "Generate Segment"}
            </Button>
          </div>
          
          <div className="mt-4 flex gap-2">
            <span className="text-xs text-gray-500">Suggestions:</span>
            <button onClick={() => setQuery("Show green health score customers from Mumbai")} className="text-xs text-blue-400 hover:underline">Loyal customers in Mumbai</button>
            <span className="text-gray-600">•</span>
            <button onClick={() => setQuery("Show red health score customers")} className="text-xs text-blue-400 hover:underline">Churning customers</button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 flex items-center gap-2 font-medium">
              <Users className="w-4 h-4" />
              {result.count} Customers Found
            </div>
            <div className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30 flex items-center gap-2 text-sm">
              <Filter className="w-4 h-4" />
              AI Filter Generated: {JSON.stringify(result.filter_applied)}
            </div>
            <div className="flex-1" />
            <Button variant="outline" className="border-white/20">Save Segment</Button>
            <Button className="bg-gradient-primary border-0">Create Campaign</Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-black/40 border-b border-white/10 text-gray-400">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Total Spend</th>
                    <th className="px-6 py-4">Health</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {result.customers.map((c: any) => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{c.name}</div>
                        <div className="text-gray-500 text-xs">{c.email}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{c.city}</td>
                      <td className="px-6 py-4 text-gray-300">₹{c.total_spend.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          c.health_score === 'Green' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          c.health_score === 'Yellow' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {c.health_score}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="ghost" size="sm" className="h-8">View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.customers.length === 0 && (
              <div className="p-8 text-center text-gray-500">No customers matched this filter.</div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
