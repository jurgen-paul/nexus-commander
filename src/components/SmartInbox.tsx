import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, 
  MessageSquare, 
  Share2, 
  Inbox, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  CornerUpLeft, 
  Trash2, 
  Brain,
  Zap,
  Star,
  ChevronRight,
  MoreVertical
} from "lucide-react";
import { cn } from "@/src/lib/utils";

interface Message {
  id: string;
  source: "email" | "social" | "support";
  sender: string;
  subject?: string;
  preview: string;
  timestamp: Date;
  urgency: number; // 0-100
  category: "Lead" | "Feedback" | "Support" | "General";
  isRead: boolean;
  isStarred: boolean;
  aiSuggestedAction?: string;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    source: "email",
    sender: "Sarah Jenkins",
    subject: "Urgent: Project Zenith Inquiry",
    preview: "Hi team, we're looking to scale our operations and need a quote for the Enterprise plan by EOD...",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    urgency: 95,
    category: "Lead",
    isRead: false,
    isStarred: true,
    aiSuggestedAction: "Generate Enterprise Quote & Draft Reply",
  },
  {
    id: "2",
    source: "social",
    sender: "@techguru_alpha",
    preview: "Loving the new NEXUS interface! One small bug in the dashboard layouts though...",
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    urgency: 65,
    category: "Feedback",
    isRead: false,
    isStarred: false,
    aiSuggestedAction: "Acknowledge Praise & Log Bug Ticket",
  },
  {
    id: "3",
    source: "support",
    sender: "Corporate Client #402",
    preview: "We are unable to sync our Facebook matrix nodes since the last update. Please assist.",
    timestamp: new Date(Date.now() - 1000 * 60 * 240),
    urgency: 88,
    category: "Support",
    isRead: true,
    isStarred: false,
    aiSuggestedAction: "Reset Node Permissions & Notify Ops",
  },
  {
    id: "4",
    source: "email",
    sender: "Marketing Weekly",
    subject: "Industry Trends Q2",
    preview: "See how competitors are using AI-driven spatial interfaces to drive engagement...",
    timestamp: new Date(Date.now() - 1000 * 60 * 1440),
    urgency: 20,
    category: "General",
    isRead: true,
    isStarred: false,
  },
];

export const SmartInbox = () => {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [selectedId, setSelectedId] = useState<string | null>(MOCK_MESSAGES[0].id);
  const [filter, setFilter] = useState<string>("All");

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => b.urgency - a.urgency);
  }, [messages]);

  const selectedMessage = messages.find(m => m.id === selectedId);

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isStarred: !m.isStarred } : m));
  };

  return (
    <div className="h-full flex flex-col bg-nexus-bg">
      <header className="p-8 border-b border-white/5 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight neon-text uppercase">Smart Inbox</h1>
          <p className="text-nexus-text-dim mt-2 tracking-widest text-[10px] uppercase font-mono">
            Neural Comm Aggregator <span className="text-nexus-accent ml-2">// PRIORITY_v.5.0</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nexus-text-dim group-focus-within:text-nexus-accent transition-colors" />
            <input 
              type="text" 
              placeholder="Search neural streams..."
              className="glass pl-10 pr-4 py-2 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-nexus-accent/50 w-64 transition-all"
            />
          </div>
          <button className="glass p-2 rounded-xl text-nexus-text-dim hover:text-white transition-all">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Inbox List */}
        <div className="w-1/3 border-r border-white/5 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-2">
            {sortedMessages.map((msg) => (
              <motion.button
                key={msg.id}
                onClick={() => setSelectedId(msg.id)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border transition-all relative group",
                  selectedId === msg.id 
                    ? "bg-nexus-accent/10 border-nexus-accent/30 shadow-[0_0_20px_rgba(5,255,161,0.1)]" 
                    : "bg-white/5 border-transparent hover:border-white/10"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {msg.source === "email" && <Mail className="w-3 h-3 text-blue-400" />}
                    {msg.source === "social" && <Share2 className="w-3 h-3 text-pink-500" />}
                    {msg.source === "support" && <MessageSquare className="w-3 h-3 text-purple-400" />}
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-tighter">
                      {msg.sender}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-nexus-text-dim">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h4 className={cn(
                  "text-xs font-bold truncate mb-1",
                  !msg.isRead ? "text-white" : "text-nexus-text-dim"
                )}>
                  {msg.subject || "No Subject"}
                </h4>
                <p className="text-[10px] text-nexus-text-dim line-clamp-2 leading-relaxed">
                  {msg.preview}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <div className={cn(
                    "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest",
                    msg.urgency > 80 ? "bg-red-500/20 text-red-400" : "bg-nexus-accent/20 text-nexus-accent"
                  )}>
                    {msg.category} // {msg.urgency}% URGENCY
                  </div>
                  <button 
                    onClick={(e) => toggleStar(msg.id, e)}
                    className={cn(
                      "transition-colors",
                      msg.isStarred ? "text-yellow-400" : "text-nexus-text-dim hover:text-white"
                    )}
                  >
                    <Star className="w-3 h-3" fill={msg.isStarred ? "currentColor" : "none"} />
                  </button>
                </div>

                {!msg.isRead && (
                  <div className="absolute top-4 right-2 w-1.5 h-1.5 rounded-full bg-nexus-accent shadow-[0_0_5px_rgba(5,255,161,1)]" />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Message View */}
        <div className="flex-1 bg-black/20 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {selectedMessage ? (
              <motion.div
                key={selectedMessage.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8 space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-nexus-accent/20 flex items-center justify-center text-nexus-accent text-xl font-bold">
                      {selectedMessage.sender[0]}
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-bold text-white">{selectedMessage.sender}</h2>
                      <p className="text-xs text-nexus-text-dim font-mono">{selectedMessage.source.toUpperCase()} STREAM // {selectedMessage.timestamp.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="glass p-2 rounded-xl text-nexus-text-dim hover:text-white transition-all">
                      <CornerUpLeft className="w-5 h-5" />
                    </button>
                    <button className="glass p-2 rounded-xl text-nexus-text-dim hover:text-white transition-all text-red-400">
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button className="glass p-2 rounded-xl text-nexus-text-dim hover:text-white transition-all">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="glass p-8 rounded-[40px] space-y-6">
                  {selectedMessage.subject && (
                    <h3 className="text-2xl font-display font-black tracking-tight text-white underline decoration-nexus-accent/30 underline-offset-8">
                      {selectedMessage.subject}
                    </h3>
                  )}
                  <p className="text-white/80 leading-relaxed text-lg italic font-serif">
                    "{selectedMessage.preview}..."
                  </p>
                </div>

                {/* AI Suggestions */}
                {selectedMessage.aiSuggestedAction && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-nexus-accent font-mono text-xs uppercase tracking-widest">
                      <Brain className="w-4 h-4" />
                      Neural Insights & Proposed Actions
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="glass p-6 rounded-3xl border border-nexus-accent/20 bg-nexus-accent/5 flex flex-col justify-between"
                      >
                        <div>
                          <Zap className="w-5 h-5 text-nexus-accent mb-3" />
                          <h4 className="text-sm font-bold text-white mb-2 uppercase">Suggested Resolution</h4>
                          <p className="text-xs text-nexus-text-dim leading-relaxed mb-4">
                            Based on priority levels and historical data, the AI recommends taking the following path:
                          </p>
                          <div className="px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-nexus-accent">
                            {selectedMessage.aiSuggestedAction}
                          </div>
                        </div>
                        <button className="mt-6 w-full py-2 bg-nexus-accent text-black font-bold rounded-xl text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(5,255,161,0.4)] transition-all">
                          Execute Protocol
                        </button>
                      </motion.div>

                      <div className="glass p-6 rounded-3xl border border-white/10 bg-white/5">
                        <AlertCircle className="w-5 h-5 text-blue-400 mb-3" />
                        <h4 className="text-sm font-bold text-white mb-2 uppercase">Contextual Analysis</h4>
                        <ul className="space-y-2">
                          {[
                            "Sentiment: Professional/Direct",
                            "Key Entities: Project Zenith, Enterprise",
                            "Risk Factor: Low",
                            "Urgency Match: High (+12m response target)"
                          ].map((insight, i) => (
                            <li key={i} className="flex items-center gap-2 text-[10px] text-nexus-text-dim font-mono">
                              <div className="w-1 h-1 rounded-full bg-blue-400" />
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-nexus-text-dim space-y-4">
                <Inbox className="w-16 h-16 opacity-10" />
                <p className="text-xs uppercase tracking-widest font-mono">Select a neural stream to view</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
