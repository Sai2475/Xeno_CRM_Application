"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { LayoutDashboard, Upload, Megaphone } from "lucide-react"
import ChatSidebar from "./ChatSidebar"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const leftWidth = 256;
  
  const [rightWidth, setRightWidth] = useState(420)
  const [isDraggingRight, setIsDraggingRight] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRight) {
        setRightWidth(Math.max(300, Math.min(window.innerWidth - e.clientX, 800)))
      }
    }

    const handleMouseUp = () => {
      setIsDraggingRight(false)
    }

    if (isDraggingRight) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDraggingRight])

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      {/* Navigation Sidebar */}
      <nav 
        style={{ width: leftWidth }} 
        className="flex-shrink-0 border-r border-border bg-card flex flex-col z-20 relative transition-[width] duration-75 ease-out"
      >
        <div className="p-4 md:p-6 border-b border-border flex items-center justify-center md:justify-start">
          <h1 className="text-xl font-extrabold text-primary truncate tracking-tight">
            {leftWidth > 120 ? "FitFlow" : "FF"}
          </h1>
        </div>
        
        <div className="flex-1 px-2 py-4 space-y-2 overflow-hidden">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium text-muted-foreground hover:text-foreground">
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {leftWidth > 120 && <span className="truncate">Home</span>}
          </Link>
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium text-muted-foreground hover:text-foreground">
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {leftWidth > 120 && <span className="truncate">Dashboard</span>}
          </Link>
          <Link href="/upload" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium text-muted-foreground hover:text-foreground">
            <Upload className="w-5 h-5 flex-shrink-0" />
            {leftWidth > 120 && <span className="truncate">Data Ingestion</span>}
          </Link>
          <Link href="/campaigns" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium text-muted-foreground hover:text-foreground">
            <Megaphone className="w-5 h-5 flex-shrink-0" />
            {leftWidth > 120 && <span className="truncate">Campaigns</span>}
          </Link>
        </div>

      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative z-0 flex flex-row h-screen overflow-hidden">
        <div className="flex-1 p-6 md:p-8 relative overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full h-full">
            {children}
          </div>
        </div>

        {/* Right Sidebar Wrap */}
        <div className="relative h-full flex-shrink-0 z-20 flex">
          <ChatSidebar width={rightWidth} onResizeStart={() => setIsDraggingRight(true)} />
        </div>
      </main>

      {/* Global Drag Cursor Overlay */}
      {isDraggingRight && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}
    </div>
  )
}
