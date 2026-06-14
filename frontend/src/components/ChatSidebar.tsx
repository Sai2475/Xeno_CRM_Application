"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Sparkles, Zap, ChevronRight, X, MessageCircle, TrendingUp, CheckCircle2 } from "lucide-react"
import { Button } from "./ui/button"
import { chatAgent, launchCampaign } from "@/lib/api"
import { motion, AnimatePresence } from "framer-motion"

export default function ChatSidebar({ width = 420, onResizeStart }: { width?: number, onResizeStart?: () => void }) {
  const [displayMode, setDisplayMode] = useState<"closed" | "sidebar" | "modal">("closed")
  const [messages, setMessages] = useState<any[]>([
    { role: "assistant", text: "Hi! I'm FitFlow AI. Describe the gym members you want to reach or ask for churn risk predictions, and I'll generate a campaign." }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [launched, setLaunched] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState(0)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [currentSegment, setCurrentSegment] = useState<any>({})
  const [currentDraft, setCurrentDraft] = useState<any>(null)
  const [selectedChannel, setSelectedChannel] = useState<string>("sms")
  const [lastQueryName, setLastQueryName] = useState("Audience Campaign")

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (displayMode !== "closed") scrollToBottom()
  }, [messages, displayMode, currentDraft, launched])

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput("")
    setLastQueryName(userMsg.length > 30 ? userMsg.substring(0, 30) + "..." : userMsg)
    setMessages(prev => [...prev, { role: "user", text: userMsg }])
    setLoading(true)
    setLaunched(false)

    try {
      const res = await chatAgent(userMsg)
      
      let newAssistantMsg: any = { role: "assistant", text: res.reply }

      // Implicitly save any query as the current target audience
      if (res.segment_query) {
        setCurrentSegment(res.segment_query)
      }

      if (res.action === "segment_created") {
        newAssistantMsg.segment = { query: res.segment_query, count: res.count }
      }
      
      if (res.action === "campaign_drafted") {
        setCurrentDraft(res.draft)
        setSelectedVariant(0)
        setSelectedChannel(res.draft.recommended_channel || "sms")
        newAssistantMsg.draft = res.draft
      }

      setMessages(prev => [...prev, newAssistantMsg])
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", text: "Connection error. Make sure the backend is running." }])
    }
    
    setLoading(false)
  }

  const handleLaunch = async () => {
    if (!currentSegment || !currentDraft) return
    setLoading(true)
    try {
      const variantToSend = currentDraft.variants[selectedVariant];
      const segmentValues = Object.values(currentSegment).filter(v => typeof v === 'string' || typeof v === 'number').join(" ");
      const campaignName = segmentValues ? `Campaign: ${segmentValues}` : `Campaign: ${lastQueryName}`;
      const result = await launchCampaign(currentSegment, selectedChannel, variantToSend.message, campaignName)
      setLaunched(true)
      setMessages(prev => [...prev, { 
        role: "assistant", 
        text: `🚀 Campaign launched successfully!\n\nIt has been automatically added to your Campaigns Hub. Click on it to track live performance.`
      }])
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", text: "Failed to launch campaign." }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* Bottom Floating Button */}
      <button 
        onClick={() => setDisplayMode("modal")}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-2 bg-card border border-border shadow-lg rounded-full px-4 py-2 hover:bg-muted transition-colors group"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center">
          <Bot className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
        </div>
        <span className="font-bold text-sm text-foreground">Aura AI</span>
      </button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {displayMode === "modal" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden relative"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-border flex justify-between items-center bg-card flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm">Aura AI</h2>
                    <p className="text-xs text-muted-foreground">Gym Retention Expert</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setDisplayMode("sidebar")}
                    className="text-muted-foreground hover:text-foreground text-xs font-bold px-3 py-1.5 bg-muted rounded-md transition-colors"
                  >
                    Dock to Sidebar
                  </button>
                  <button 
                    onClick={() => setDisplayMode("closed")}
                    className="text-muted-foreground hover:text-foreground p-1.5 hover:bg-muted rounded-md transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Shared Chat Content Rendered as Modal */}
              <ChatContent 
                messages={messages} 
                loading={loading} 
                input={input} 
                setInput={setInput} 
                handleSend={handleSend} 
                scrollToBottom={scrollToBottom} 
                messagesEndRef={messagesEndRef}
                selectedChannel={selectedChannel}
                setSelectedChannel={setSelectedChannel}
                selectedVariant={selectedVariant}
                setSelectedVariant={setSelectedVariant}
                launched={launched}
                handleLaunch={handleLaunch}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Layout */}
      <div 
        style={{ width: displayMode === "sidebar" ? width : 0 }}
        className="h-full bg-card border-l border-border flex flex-col relative transition-[width] duration-300 ease-in-out z-20"
      >
        {/* Resizer Handle */}
        {displayMode === "sidebar" && (
          <div 
            className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 active:bg-primary z-30 transition-colors"
            onMouseDown={onResizeStart}
          />
        )}

        {/* Floating Toggle Button for Sidebar */}
        {displayMode === "closed" && (
          <button 
            onClick={() => setDisplayMode("sidebar")}
            className="absolute -left-12 top-1/2 -translate-y-1/2 w-12 py-4 bg-card border border-r-0 border-border rounded-l-xl flex flex-col items-center justify-center gap-2 hover:bg-muted text-muted-foreground hover:text-primary transition-all group z-30 shadow-[-5px_0_15px_-5px_rgba(0,0,0,0.2)]"
          >
            <Bot className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            <div className="text-[10px] font-bold uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 group-hover:text-primary">Aura</div>
          </button>
        )}

        {/* Sidebar Content */}
        <div className={`flex flex-col h-full w-full overflow-hidden transition-opacity duration-300 ${displayMode === "sidebar" ? 'opacity-100' : 'opacity-0'}`}>
          {/* Header */}
          <div className="p-4 border-b border-border flex justify-between items-center bg-card flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-sm">Aura AI</h2>
                <p className="text-xs text-muted-foreground">Gym Retention Expert</p>
              </div>
            </div>
            <button 
              onClick={() => setDisplayMode("closed")}
              className="text-muted-foreground hover:text-foreground text-sm p-2 hover:bg-muted rounded-md transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Shared Chat Content Rendered as Sidebar */}
          <ChatContent 
            messages={messages} 
            loading={loading} 
            input={input} 
            setInput={setInput} 
            handleSend={handleSend} 
            scrollToBottom={scrollToBottom} 
            messagesEndRef={messagesEndRef}
            selectedChannel={selectedChannel}
            setSelectedChannel={setSelectedChannel}
            selectedVariant={selectedVariant}
            setSelectedVariant={setSelectedVariant}
            launched={launched}
            handleLaunch={handleLaunch}
          />
        </div>
      </div>
    </>
  )
}

function ChatContent({ 
  messages, loading, input, setInput, handleSend, messagesEndRef,
  selectedChannel, setSelectedChannel, selectedVariant, setSelectedVariant,
  launched, handleLaunch 
}: any) {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
            {messages.map((msg, i) => (
              <motion.div 
                initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                key={i} 
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 mt-1 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-secondary" : "bg-gradient-primary"}`}>
                  {msg.role === "user" ? <User className="w-4 h-4 text-foreground" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none border border-border"}`}>
                    {msg.text}
                  </div>

                  {msg.segment && (
                    <div className="p-4 bg-card border border-border rounded-xl w-full text-sm shadow-md">
                      <div className="flex items-center gap-2 font-bold text-primary mb-2">
                        <Sparkles className="w-4 h-4" /> Gym Segment Built
                      </div>
                      <div className="bg-muted p-2 rounded text-xs font-mono mb-3 overflow-x-auto border border-border/50">
                        {JSON.stringify(msg.segment.query)}
                      </div>
                      <div className="text-xs font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-md inline-block">{msg.segment.count} members matched</div>
                    </div>
                  )}

                  {msg.draft && (
                    <div className="p-4 bg-card border border-border rounded-xl w-full text-sm space-y-4 shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-primary"></div>
                      <div className="flex items-center gap-2 font-bold text-transparent bg-clip-text bg-gradient-primary">
                        <Zap className="w-4 h-4 text-indigo-400" /> Campaign Drafted
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted p-3 rounded-lg border border-border/50 flex flex-col justify-center">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">Channel</span>
                          <select
                            value={selectedChannel}
                            onChange={(e) => setSelectedChannel(e.target.value)}
                            className="bg-transparent text-sm font-bold text-foreground focus:outline-none cursor-pointer border border-border/40 rounded px-1 -ml-1 py-0.5"
                          >
                            <option value="sms" className="bg-card text-foreground">SMS</option>
                            <option value="email" className="bg-card text-foreground">Email</option>
                            <option value="whatsapp" className="bg-card text-foreground">WhatsApp</option>
                          </select>
                        </div>
                        {msg.draft.optimal_send_time && (
                          <div className="bg-muted p-3 rounded-lg border border-border/50">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">Smart Time</span>
                            <span className="text-sm font-bold text-amber-500">{msg.draft.optimal_send_time}</span>
                          </div>
                        )}
                      </div>

                      {msg.draft.send_time_reasoning && (
                        <div className="text-xs text-muted-foreground bg-secondary p-3 rounded-lg border border-border">
                          {msg.draft.send_time_reasoning}
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">A/B Variants Generated</span>
                        <div className="flex flex-col gap-3">
                          {msg.draft.variants.map((variant: any, idx: number) => (
                            <div 
                              key={idx} 
                              onClick={() => setSelectedVariant(idx)}
                              className={`w-full p-4 rounded-lg border cursor-pointer transition-all ${selectedVariant === idx ? 'border-primary bg-primary/5 shadow-[0_0_15px_-3px_rgba(79,70,229,0.3)] scale-[1.02]' : 'border-border bg-muted opacity-80 hover:opacity-100 hover:scale-[1.01]'}`}
                            >
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-xs px-3 py-1 bg-background rounded-md border font-bold text-foreground">{variant.tone} Tone</span>
                                <span className="text-xs font-bold text-green-500 flex items-center gap-1"><TrendingUp className="w-4 h-4"/> {variant.estimated_click_rate}</span>
                              </div>
                              <p className="text-[15px] font-medium text-foreground leading-relaxed">{variant.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {!launched ? (
                        <motion.button 
                          whileTap={{ scale: 0.97 }}
                          onClick={handleLaunch} 
                          disabled={loading} 
                          className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold bg-gradient-primary text-white hover:opacity-90 transition-opacity border-0 shadow-lg mt-4 text-base"
                        >
                          <Send className="w-5 h-5" /> Launch Selected Variant
                        </motion.button>
                      ) : (
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold bg-green-500 text-white shadow-lg mt-4 text-base"
                        >
                          <CheckCircle2 className="w-6 h-6" /> Launched Successfully!
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex gap-3">
                 <div className="w-8 h-8 mt-1 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
                   <Bot className="w-4 h-4 text-white" />
                 </div>
                 <div className="px-4 py-3 rounded-2xl text-sm bg-muted rounded-tl-none animate-pulse border border-border shadow-sm flex items-center gap-2">
                   <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                   <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75" />
                   <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-150" />
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>

      <div className="p-4 border-t border-border bg-card shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
          <input
            className="w-full h-12 pl-4 pr-12 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-inner"
            placeholder="Ask FitFlow..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 w-8 h-8 bg-gradient-primary text-white rounded-lg flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </>
  )
}
