import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  Newspaper, 
  Search, 
  Plus, 
  MessageSquare, 
  Share2, 
  Eye, 
  Clock, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Tag
} from "lucide-react";
import { cn } from "@/src/lib/utils";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  views: number;
  comments: number;
  image: string;
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  category: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  url: string;
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: "1",
    title: "The Future of Neural Interface Design",
    excerpt: "Exploring how quantum-level haptics will reshape our daily interaction with digital systems.",
    author: "Dr. Elara Vance",
    date: "2026-05-12",
    category: "Neural Tech",
    readTime: "8 min read",
    views: 1240,
    comments: 42,
    image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&q=80"
  },
  {
    id: "2",
    title: "Optimizing Serverless Edge Clusters",
    excerpt: "New benchmarks show 45% latency reduction using Nexus Edge-04 routing protocols.",
    author: "Marco Rossi",
    date: "2026-05-10",
    category: "Infrastructure",
    readTime: "12 min read",
    views: 890,
    comments: 15,
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80"
  }
];

const NEWS_ITEMS: NewsItem[] = [
  {
    id: "n1",
    title: "Global Neural Mesh Upgrade Scheduled for Cycle 42",
    source: "Nexus Core",
    time: "2 hours ago",
    category: "System",
    priority: "HIGH",
    url: "#"
  },
  {
    id: "n2",
    title: "Mars Colony Alpha Reports Successful Data Link Reconstruction",
    source: "Interplanetary Net",
    time: "5 hours ago",
    category: "Space",
    priority: "MEDIUM",
    url: "#"
  },
  {
    id: "n3",
    title: "New AI Ethics Accord Signed by Major Systems Hubs",
    source: "Tech Review",
    time: "Yesterday",
    category: "Policy",
    priority: "LOW",
    url: "#"
  }
];

export const ContentHub = () => {
  const [activeTab, setActiveTab] = useState<"blog" | "news">("blog");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBlog = BLOG_POSTS.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.date.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNews = NEWS_ITEMS.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.time.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-nexus-bg/50 overflow-hidden">
      <header className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-nexus-bg/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h2 className="text-3xl font-display font-bold bg-gradient-to-r from-nexus-accent to-purple-400 bg-clip-text text-transparent">Nexus Content Matrix</h2>
          <p className="text-nexus-text-dim mt-1 text-sm">Synchronized broadcast and deep-dive analytics.</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nexus-text-dim" />
            <input 
              type="text" 
              placeholder="Search by title, category, author, or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-nexus-accent/50 transition-all font-mono"
            />
          </div>
          <button className="px-4 py-2 bg-nexus-accent text-black font-bold rounded-xl flex items-center gap-2 hover:bg-white transition-all text-sm whitespace-nowrap">
            <Plus className="w-4 h-4" />
            NEW BROADCAST
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {/* View Toggles */}
          <div className="flex gap-4 border-b border-white/5 pb-4">
            <button 
              onClick={() => setActiveTab("blog")}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                activeTab === "blog" 
                  ? "bg-nexus-accent/10 text-nexus-accent border border-nexus-accent/30 shadow-[0_0_20px_rgba(5,255,161,0.1)]" 
                  : "text-nexus-text-dim hover:text-white"
              )}
            >
              <FileText className="w-4 h-4" />
              Journal Logs
            </button>
            <button 
              onClick={() => setActiveTab("news")}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                activeTab === "news" 
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]" 
                  : "text-nexus-text-dim hover:text-white"
              )}
            >
              <Newspaper className="w-4 h-4" />
              Neural Feed
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "blog" ? (
              <motion.div 
                key="blog"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                {filteredBlog.map((post) => (
                  <div key={post.id} className="glass rounded-[32px] overflow-hidden group border border-white/5 hover:border-nexus-accent/30 transition-all duration-500 flex flex-col h-full">
                    <div className="relative h-64 overflow-hidden">
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60 group-hover:opacity-100"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-nexus-accent border border-nexus-accent/30">
                          {post.category}
                        </span>
                      </div>
                      <div className="absolute bottom-4 right-4">
                        <div className="p-2 bg-nexus-accent/20 backdrop-blur-md rounded-xl border border-nexus-accent/40 text-nexus-accent">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-8 flex flex-col flex-1">
                      <div className="flex items-center gap-3 text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest mb-4">
                        <Clock className="w-3 h-3" />
                        {post.date}
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        {post.readTime}
                      </div>
                      
                      <h3 className="text-2xl font-display font-bold mb-4 line-clamp-2 group-hover:text-nexus-accent transition-colors">
                        {post.title}
                      </h3>
                      
                      <p className="text-nexus-text-dim text-sm line-clamp-3 mb-8 flex-1">
                        {post.excerpt}
                      </p>
                      
                      <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-nexus-accent/20 flex items-center justify-center border border-nexus-accent/30">
                            <span className="text-[10px] font-bold">{post.author.charAt(0)}</span>
                          </div>
                          <span className="text-xs font-bold text-white/80">{post.author}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-nexus-text-dim">
                          <div className="flex items-center gap-1.5">
                            <Eye className="w-4 h-4" />
                            <span className="text-[10px] font-mono">{post.views}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-[10px] font-mono">{post.comments}</span>
                          </div>
                          <button className="p-2 hover:text-nexus-accent transition-colors">
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="news"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/5 border border-purple-500/20 rounded-xl w-fit mb-6">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-widest">Live Streaming Enabled</span>
                </div>

                <div className="space-y-3">
                  {filteredNews.map((item) => (
                    <div key={item.id} className="glass p-6 rounded-3xl border border-white/5 hover:border-purple-500/30 transition-all group relative overflow-hidden">
                      <div className="flex items-start justify-between gap-6 relative z-10">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={cn(
                              "text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter",
                              item.priority === "HIGH" ? "bg-red-500/20 text-red-500" :
                              item.priority === "MEDIUM" ? "bg-yellow-500/20 text-yellow-500" :
                              "bg-blue-500/20 text-blue-500"
                            )}>
                              {item.priority} ALERT
                            </span>
                            <span className="text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest">{item.source}</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest">{item.time}</span>
                          </div>
                          <h3 className="text-lg font-bold group-hover:text-purple-400 transition-colors">{item.title}</h3>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-bold text-nexus-text-dim uppercase border border-white/5">
                            {item.category}
                          </span>
                          <button className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group-hover:border-purple-500/30 border border-transparent">
                            <ExternalLink className="w-4 h-4 text-nexus-text-dim group-hover:text-white" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Decorative Background Element */}
                      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-purple-500/5 to-transparent pointer-events-none" />
                    </div>
                  ))}
                </div>

                {/* News Ticker Footer */}
                <div className="mt-12 p-4 glass rounded-2xl border-dashed border-white/10 flex items-center gap-6 overflow-hidden">
                  <div className="text-[10px] font-bold text-nexus-accent uppercase tracking-[0.2em] whitespace-nowrap bg-nexus-accent/10 px-3 py-1 rounded-lg">
                    TICKER:LIVE
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <motion.div 
                      animate={{ x: [0, -1000] }}
                      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                      className="flex gap-12 text-[10px] font-mono text-nexus-text-dim uppercase whitespace-nowrap"
                    >
                      {[1,2,3].map(i => (
                        <span key={i} className="flex gap-12">
                          <span>NEXUS INDEX: [STABLE]</span>
                          <span>NEURAL THROUGHPUT: 98.4 PB/S</span>
                          <span>EDGE LATENCY: 0.22MS</span>
                          <span>HUB-ALPHA: ONLINE</span>
                          <span>QUANTUM SYNC: ACTIVE</span>
                        </span>
                      ))}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
