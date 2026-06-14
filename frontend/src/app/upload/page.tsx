"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UploadCloud, FileType, CheckCircle2, RefreshCw } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

const COLORS = ['#4F46E5', '#3B82F6', '#818CF8', '#A78BFA', '#F472B6', '#34D399'];

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  const fetchStats = async () => {
    setLoadingStats(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"}/customers/stats`)
      const data = await res.json()
      setStats(data)
    } catch (e) {
      console.error(e)
    }
    setLoadingStats(false)
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"}/customers/upload`, {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Upload failed")
      setResult(data)
      setFile(null)
      fetchStats()
    } catch (e: any) {
      setResult({ error: e.message })
    }
    
    setLoading(false)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-end border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Data Ingestion <UploadCloud className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-muted-foreground mt-1">Upload your CSV and view dynamic dataset visualizations.</p>
        </div>
        <button onClick={fetchStats} className="p-2 bg-secondary text-secondary-foreground rounded-md border border-border hover:bg-secondary/80">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border bg-card shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle>Upload CSV</CardTitle>
              <CardDescription className="text-xs">
                Format must include: <br/>
                <span className="font-mono text-[10px] text-muted-foreground bg-secondary px-1 rounded block mt-2 p-2 text-left">
                  email, phone, name, membership_type, join_date, last_visit_date, classes_attended, favorite_class, churn_risk_score
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shadow-inner border border-primary/20">
                <FileType className="w-8 h-8 text-primary" />
              </div>
              
              <label className="cursor-pointer mt-4 w-full">
                <span className="w-full py-3 bg-secondary text-secondary-foreground text-center rounded-md hover:bg-secondary/80 transition-colors inline-block font-medium text-sm border border-border">
                  Browse CSV File
                </span>
                <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              </label>

              {file && (
                <div className="text-sm text-primary font-medium flex items-center gap-2">
                   <CheckCircle2 className="w-4 h-4" /> {file.name}
                </div>
              )}

              <Button 
                className="w-full mt-4 font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-opacity border-0 h-10 rounded-md" 
                disabled={!file || loading} 
                onClick={handleUpload}
              >
                {loading ? "Importing..." : "Import Dataset"}
              </Button>

              {result && !result.error && (
                <div className="mt-4 p-3 bg-green-500/10 text-green-500 rounded-md border border-green-500/20 w-full text-center text-xs font-medium">
                  {result.message} <br/>
                  Total DB Size: {result.total_customers} members
                </div>
              )}
              {result && result.error && (
                <div className="mt-4 p-3 bg-red-500/10 text-red-500 rounded-md border border-red-500/20 w-full text-center text-xs font-medium">
                  {result.error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Visualizations */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {loadingStats ? (
            <div className="col-span-full h-64 flex items-center justify-center bg-card rounded-xl border border-border animate-pulse text-muted-foreground">
              Loading Visualizations...
            </div>
          ) : !stats || stats.tiers.length === 0 ? (
            <div className="col-span-full h-64 flex flex-col items-center justify-center bg-card/50 rounded-xl border border-border border-dashed text-muted-foreground">
              <p>No visualization data available.</p>
              <p className="text-sm">Upload a dataset to generate insights.</p>
            </div>
          ) : (
            <>
              <Card className="bg-card shadow-lg border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Membership Tiers</CardTitle>
                </CardHeader>
                <CardContent className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.tiers} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                        {stats.tiers.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{backgroundColor: '#171717', borderColor: '#262626'}} itemStyle={{color: '#F8FAFC'}}/>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card shadow-lg border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Churn Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.risk}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="name" stroke="#A3A3A3" fontSize={10} />
                      <YAxis stroke="#A3A3A3" fontSize={10} />
                      <Tooltip cursor={{fill: '#262626'}} contentStyle={{backgroundColor: '#171717', borderColor: '#262626'}} />
                      <Bar dataKey="value" fill="#4F46E5" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card shadow-lg border-border md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Class Preferences</CardTitle>
                </CardHeader>
                <CardContent className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.classes} layout="vertical" margin={{ left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis type="number" stroke="#A3A3A3" fontSize={10} />
                      <YAxis dataKey="name" type="category" stroke="#A3A3A3" fontSize={10} />
                      <Tooltip cursor={{fill: '#262626'}} contentStyle={{backgroundColor: '#171717', borderColor: '#262626'}} />
                      <Bar dataKey="value" fill="#818CF8" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
