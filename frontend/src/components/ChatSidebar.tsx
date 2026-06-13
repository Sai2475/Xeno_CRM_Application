"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Sparkles, Zap, ChevronRight } from "lucide-react"
import { Button } from "./ui/button"
import { chatAgent, launchCampaign } from "@/lib/api"

export default function ChatSidebar() {
  const [messages, setMessages] = useState<any[]>([
    { role: "assistant", text: "Hi! I'm Xeno AI. Describe the audience you want to reach, and I'll generate the segment and campaign for you." }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Current working state built up via chat
  const [currentSegment, setCurrentSegment] = useState<any>(null)
  const [currentDraft, setCurrentDraft] = useState<any>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", text: userMsg }])
    setLoading(true)

    try {
      const res = await chatAgent(userMsg)
      
      let newAssistantMsg: any = { role: "assistant", text: res.reply }

      if (res.action === "segment_created") {
        setCurrentSegment(res.segment_query)
        newAssistantMsg.segment = { query: res.segment_query, count: res.count }
      }
      
      if (res.action === "campaign_drafted") {
        setCurrentDraft(res.draft)
        newAssistantMsg.draft = res.draft
      }

      setMessages(prev => [...prev, newAssistantMsg])
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", text: "Connection error. Make sure the backend is running and MONGODB_URI is configured." }])
    }
    
    setLoading(false)
  }

  const handleLaunch = async () => {
    if (!currentSegment || !currentDraft) return
    setLoading(true)
    try {
      const result = await launchCampaign(currentSegment, currentDraft.recommended_channel, currentDraft.variants[0].message)
      setMessages(prev => [...prev, { 
        role: "assistant", 
        text: `🚀 Campaign launched successfully! Campaign ID: ${result.campaign_id}\n\nYou can track it live by pasting this ID into the Campaigns hub.`
      }])
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", text: "Failed to launch campaign." }])
    }
    setLoading(false)
  }

  return (
    <aside className="w-full md:w-96 border-l border-border bg-card/50 flex flex-col h-full z-10 backdrop-blur-sm">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">Xeno Copilot</h2>
          <p className="text-xs text-muted-foreground">Always active</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-secondary" : "bg-primary/20"}`}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
            </div>
            <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`px-4 py-2 rounded-2xl text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none"}`}>
                {msg.text}
              </div>

              {/* Segment Widget */}
              {msg.segment && (
                <div className="p-3 bg-background border border-border rounded-xl w-full text-sm">
                  <div className="flex items-center gap-2 font-semibold text-primary mb-1">
                    <Sparkles className="w-4 h-4" /> Segment Built
                  </div>
                  <p className="text-muted-foreground text-xs mb-2">Query generated from intent</p>
                  <div className="bg-muted p-2 rounded text-xs font-mono mb-2 overflow-x-auto">
                    {JSON.stringify(msg.segment.query)}
                  </div>
                  <div className="text-xs font-semibold">{msg.segment.count} customers matched</div>
                </div>
              )}

              {/* Draft Widget */}
              {msg.draft && (
                <div className="p-3 bg-background border border-border rounded-xl w-full text-sm space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-blue-400">
                    <Zap className="w-4 h-4" /> Campaign Drafted
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Channel</span>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs uppercase font-bold">{msg.draft.recommended_channel}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Message Variant 1</span>
                    <p className="bg-muted p-2 rounded mt-1 italic">{msg.draft.variants[0]?.message}</p>
                  </div>
                  {currentSegment ? (
                    <Button onClick={handleLaunch} disabled={loading} className="w-full gap-2 mt-2">
                      <Send className="w-4 h-4" /> Execute Campaign
                    </Button>
                  ) : (
                    <p className="text-xs text-yellow-500 mt-2">Please ask me to create an audience segment first before launching.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
               <Bot className="w-4 h-4 text-primary" />
             </div>
             <div className="px-4 py-2 rounded-2xl text-sm bg-muted rounded-tl-none animate-pulse">
               Thinking...
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
          <input
            className="w-full h-12 pl-4 pr-12 rounded-full bg-muted border border-border text-sm focus:outline-none focus:border-primary transition-colors"
            placeholder="e.g. Find customers who haven't bought in 60 days..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="absolute right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-50 transition-opacity"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
  )
}
