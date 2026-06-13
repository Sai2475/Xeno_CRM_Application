"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UploadCloud, FileType } from "lucide-react"

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

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
      const res = await fetch("http://localhost:8000/api/customers/upload", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Upload failed")
      setResult(data)
      setFile(null)
    } catch (e: any) {
      setResult({ error: e.message })
    }
    
    setLoading(false)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          Data Ingestion <UploadCloud className="w-6 h-6 text-blue-400" />
        </h1>
        <p className="text-muted-foreground mt-1">Upload your customer CSV file to populate the CRM.</p>
      </div>

      <Card className="border-dashed border-2 border-border bg-card/50">
        <CardHeader className="text-center pb-2">
          <CardTitle>Upload CSV</CardTitle>
          <CardDescription>File should contain: email, phone, name, last_purchase_date, total_spent, purchase_count</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <FileType className="w-8 h-8 text-primary" />
          </div>
          
          <label className="cursor-pointer">
            <span className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors inline-block font-medium text-sm">
              Select CSV File
            </span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          </label>

          {file && (
            <div className="text-sm text-blue-400 font-medium">Selected: {file.name}</div>
          )}

          <Button 
            className="w-full max-w-sm mt-4" 
            disabled={!file || loading} 
            onClick={handleUpload}
          >
            {loading ? "Uploading..." : "Import Customers"}
          </Button>

          {result && !result.error && (
            <div className="mt-4 p-4 bg-green-500/20 text-green-400 rounded-md border border-green-500/30 w-full text-center text-sm font-medium">
              {result.message} <br/>
              Total Database Size: {result.total_customers} customers.
            </div>
          )}

          {result && result.error && (
            <div className="mt-4 p-4 bg-red-500/20 text-red-400 rounded-md border border-red-500/30 w-full text-center text-sm font-medium">
              {result.error}
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
