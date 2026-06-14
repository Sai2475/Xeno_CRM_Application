"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Database, Network, Send, BarChart3, ChevronRight, Activity, Users, Mail, Smartphone, MessageSquare } from "lucide-react"

export default function LandingPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans selection:bg-primary/30">

      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center">
        <div className="absolute top-[-10%] w-[800px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-[-10%] w-[600px] h-[400px] bg-indigo-900/30 rounded-full blur-[100px] opacity-50" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto border-b border-white/5">
        <div className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> FitFlow
        </div>
        <Link href="/dashboard">
          <button className="px-5 py-2 rounded-md bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors border border-border">
            Let's Start
          </button>
        </Link>
      </header>

      {/* Hero Section */}
      <div className="relative pt-32 pb-24 flex flex-col items-center text-center max-w-5xl mx-auto px-6 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-8 tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            FitFlow CRM is Live
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-foreground">
            The AI-Native CRM <br /> for Fitness Studios.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl leading-relaxed">
            Ingest member data, predict churn risk, and deploy automated WhatsApp and SMS campaigns—all from a single, intelligent interface.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <Link href="/dashboard">
              <button className="h-12 px-8 rounded-md bg-primary text-primary-foreground font-medium text-base hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center gap-2">
                Launch Dashboard <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="#features">
              <button className="h-12 px-8 rounded-md bg-transparent text-foreground font-medium text-base hover:bg-secondary transition-all border border-border flex items-center gap-2">
                Explore Features
              </button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* CRM Features Dashboard Mockup */}
      <div className="relative max-w-6xl mx-auto px-6 z-10 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="w-full h-auto rounded-xl border border-border bg-card shadow-2xl overflow-hidden glass-panel flex flex-col md:flex-row"
        >
          <div className="w-full md:w-64 bg-secondary/50 border-r border-border p-4 space-y-4">
            <div className="h-8 w-32 bg-border rounded-md mb-8" />
            <div className="h-8 w-full bg-primary/20 border border-primary/30 rounded-md" />
            <div className="h-8 w-full bg-border/50 rounded-md" />
            <div className="h-8 w-full bg-border/50 rounded-md" />
            <div className="h-8 w-full bg-border/50 rounded-md" />
          </div>
          <div className="flex-1 p-8 bg-card/50">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold">Campaign Performance</h3>
              <div className="flex gap-2">
                <div className="px-3 py-1 bg-border rounded-md text-xs">Last 30 Days</div>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Sent", value: "12,402", trend: "+12%" },
                { label: "Delivered", value: "98.5%", trend: "+1.2%" },
                { label: "Opened", value: "64.2%", trend: "+4.5%" },
                { label: "Converted", value: "8.4%", trend: "+2.1%" },
              ].map((stat, i) => (
                <div key={i} className="p-4 bg-secondary/30 rounded-lg border border-border">
                  <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-emerald-400 mt-1">{stat.trend}</div>
                </div>
              ))}
            </div>
            <div className="w-full h-48 bg-secondary/20 rounded-lg border border-border flex items-end px-4 py-4 gap-2">
              {/* Fake Bar Chart */}
              {[30, 45, 60, 40, 80, 55, 90, 70, 50, 65, 85, 40].map((h, i) => (
                <div key={i} className="flex-1 bg-primary/40 rounded-sm hover:bg-primary transition-colors" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bento Grid Features */}
      <div id="features" className="bg-background py-24 relative z-10 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Everything a modern CRM needs.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Powerful infrastructure to manage your audience, completely automated by AI.</p>
          </div>

          <motion.div
            variants={container as any}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Bento 1: Ingest */}
            <motion.div variants={item as any} className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors group relative overflow-hidden">
              <Database className="w-8 h-8 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-3">1. Ingest Data</h3>
              <p className="text-muted-foreground">Seamlessly ingest members, class attendance, and purchase history. FitFlow stores your data securely and structures it for AI consumption.</p>
            </motion.div>

            {/* Bento 2: Segment */}
            <motion.div variants={item as any} className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors group relative overflow-hidden">
              <Network className="w-8 h-8 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-3">2. Segment Shoppers</h3>
              <p className="text-muted-foreground">Let the AI carve out exact audiences based on behavior. Target "High Churn Risk", "Premium Members", or "Inactive Users" effortlessly.</p>
            </motion.div>

            {/* Bento 3: Send */}
            <motion.div variants={item as any} className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors group relative overflow-hidden md:col-span-2 lg:col-span-1">
              <Send className="w-8 h-8 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-3">3. Dispatch Communications</h3>
              <p className="text-muted-foreground mb-6">Dispatch tailored, personalized messages to your chosen audiences through integrated channel services.</p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm font-medium bg-secondary px-3 py-1.5 rounded-md border border-border"><Smartphone className="w-4 h-4" /> WhatsApp</div>
                <div className="flex items-center gap-2 text-sm font-medium bg-secondary px-3 py-1.5 rounded-md border border-border"><MessageSquare className="w-4 h-4" /> SMS</div>
                <div className="flex items-center gap-2 text-sm font-medium bg-secondary px-3 py-1.5 rounded-md border border-border"><Mail className="w-4 h-4" /> Email</div>
              </div>
            </motion.div>

            {/* Bento 4: Analytics */}
            <motion.div variants={item as any} className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors group relative overflow-hidden md:col-span-2 lg:col-span-1">
              <BarChart3 className="w-8 h-8 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-3">4. Surface Insights</h3>
              <p className="text-muted-foreground">Track and present how your communications perform. Monitor Sent, Delivered, Opened, Clicked, and Converted metrics via our real-time simulated webhooks.</p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background text-center text-sm text-muted-foreground">
        FitFlow CRM © {new Date().getFullYear()}. Designed for modern fitness brands.
      </footer>
    </div>
  )
}
