import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, Users, MessageSquare, Upload, Megaphone } from "lucide-react";
import ChatSidebar from "@/components/ChatSidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Xeno AI - Chat-First CRM",
  description: "AI-Native Mini CRM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground flex h-screen overflow-hidden`}>
        
        {/* Navigation Sidebar */}
        <nav className="w-16 md:w-64 border-r border-border bg-card flex flex-col z-20">
          <div className="p-4 md:p-6 border-b border-border">
            <h1 className="text-xl font-bold text-primary hidden md:block">
              Xeno AI
            </h1>
            <h1 className="text-xl font-bold text-primary md:hidden text-center">
              X
            </h1>
          </div>
          
          <div className="flex-1 px-2 md:px-4 py-4 space-y-2">
            <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium text-muted-foreground hover:text-foreground">
              <LayoutDashboard className="w-5 h-5" />
              <span className="hidden md:block">Dashboard</span>
            </Link>
            <Link href="/upload" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium text-muted-foreground hover:text-foreground">
              <Upload className="w-5 h-5" />
              <span className="hidden md:block">Data Ingestion</span>
            </Link>
            <Link href="/campaigns" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm font-medium text-muted-foreground hover:text-foreground">
              <Megaphone className="w-5 h-5" />
              <span className="hidden md:block">Campaigns</span>
            </Link>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative z-0 flex flex-col md:flex-row">
          
          <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto overflow-y-auto">
            {children}
          </div>

          {/* AI Chat Sidebar */}
          <ChatSidebar />

        </main>
      </body>
    </html>
  );
}
