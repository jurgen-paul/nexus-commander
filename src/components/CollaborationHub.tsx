import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  MessageSquare, 
  Bell, 
  History, 
  Share2, 
  UserPlus, 
  Shield, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MoreHorizontal,
  ChevronRight,
  Zap,
  Activity,
  Filter,
  Search,
  Calendar,
  GitBranch,
  GitCommit,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Terminal
} from "lucide-react";
import { cn } from "@/src/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
  status: "ONLINE" | "OFFLINE" | "BUSY";
  lastActive: string;
}

interface Notification {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  type: "EDIT" | "COMMENT" | "ALERT" | "JOIN";
  unread: boolean;
}

interface ProjectVersion {
  id: string;
  version: string;
  author: string;
  timestamp: string;
  changes: string;
  status: "LIVE" | "STABLE" | "BETA" | "LEGACY";
}

const MEMBERS: TeamMember[] = [
  { id: "1", name: "Oistarian Prime", avatar: "OP", role: "OWNER", status: "ONLINE", lastActive: "Now" },
  { id: "2", name: "Aura AI", avatar: "AI", role: "ADMIN", status: "ONLINE", lastActive: "Now" },
  { id: "3", name: "Sarah Jenkins", avatar: "SJ", role: "EDITOR", status: "BUSY", lastActive: "12m ago" },
  { id: "4", name: "Mark Wilson", avatar: "MW", role: "VIEWER", status: "OFFLINE", lastActive: "2h ago" },
];

const NOTIFICATIONS: Notification[] = [
  { id: "n1", user: "Sarah Jenkins", action: "modified", target: "Social Content Calendar", timestamp: "3m ago", type: "EDIT", unread: true },
  { id: "n2", user: "Aura AI", action: "optimized", target: "Sales Pipeline v4", timestamp: "15m ago", type: "EDIT", unread: true },
  { id: "n3", user: "Nexus System", action: "flagged", target: "Unusual Login Activity", timestamp: "1h ago", type: "ALERT", unread: true },
  { id: "n4", user: "Mark Wilson", action: "joined", target: "Project Zenith", timestamp: "2h ago", type: "JOIN", unread: false },
];

const VERSIONS: ProjectVersion[] = [
  { id: "v1", version: "1.2.4", author: "Sarah Jenkins", timestamp: "2026-05-13 14:20", changes: "Updated marketing copy for Q3 launch", status: "LIVE" },
  { id: "v2", version: "1.2.3", author: "Oistarian Prime", timestamp: "2026-05-12 09:15", changes: "Adjusted budget projections", status: "STABLE" },
  { id: "v3", version: "1.2.2", author: "Aura AI", timestamp: "2026-05-11 23:45", changes: "Auto-optimized neural routing paths", status: "STABLE" },
  { id: "v4", version: "1.2.1", author: "Mark Wilson", timestamp: "2026-05-10 18:30", changes: "Initial framework deploy", status: "LEGACY" },
  { id: "v5", version: "1.2.0", author: "Sarah Jenkins", timestamp: "2026-05-09 11:00", changes: "Security protocol updates", status: "LEGACY" },
  { id: "v6", version: "1.1.9", author: "Oistarian Prime", timestamp: "2026-05-08 15:45", changes: "Asset pipeline optimization", status: "LEGACY" },
];

export const CollaborationHub = () => {
  const [activeTab, setActiveTab] = useState<"team" | "notifications" | "history" | "git">("team");
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  // Git State
  const [gitHistory, setGitHistory] = useState<any[]>([]);
  const [gitStatus, setGitStatus] = useState<any>(null);
  const [gitLoading, setGitLoading] = useState(false);
  const [gitError, setGitError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "git") {
      fetchGitData();
    }
  }, [activeTab]);

  const fetchGitData = async () => {
    setGitLoading(true);
    setGitError(null);
    try {
      const [historyRes, statusRes] = await Promise.all([
        fetch("/api/git/history"),
        fetch("/api/git/status")
      ]);
      
      const history = await historyRes.json();
      const status = await statusRes.json();
      
      if (historyRes.ok) setGitHistory(history);
      else setGitError(history.error);
      
      if (statusRes.ok) setGitStatus(status);
    } catch (err: any) {
      setGitError("Failed to connect to Nexus Git Terminal");
    } finally {
      setGitLoading(false);
    }
  };

  const handleGitAction = async (action: "pull" | "push" | "fetch") => {
    setGitLoading(true);
    try {
      const res = await fetch("/api/git/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        fetchGitData();
      } else {
        setGitError(data.error);
      }
    } catch (err) {
      setGitError(`Action ${action} failed connection.`);
    } finally {
      setGitLoading(false);
    }
  };

  // History Filters
  const [filterAuthor, setFilterAuthor] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const filteredVersions = VERSIONS.filter(v => {
    const matchesAuthor = filterAuthor === "All" || v.author === filterAuthor;
    const matchesStatus = filterStatus === "All" || v.status === filterStatus;
    const matchesSearch = v.changes.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         v.version.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAuthor && matchesStatus && matchesSearch;
  });

  const authors = ["All", ...Array.from(new Set(VERSIONS.map(v => v.author)))];
  const statuses = ["All", "LIVE", "STABLE", "BETA", "LEGACY"];

  return (
    <div className="h-full flex flex-col bg-nexus-bg">
      <header className="p-8 border-b border-white/5 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight neon-text uppercase">Nexus Collab</h1>
          <p className="text-nexus-text-dim mt-2 tracking-widest text-[10px] uppercase font-mono">
            Multi-User Neural Workspace <span className="text-nexus-accent ml-2">// SYNC_ACTIVE_v.4.0</span>
          </p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          {[
            { id: "team", label: "Team", icon: Users },
            { id: "notifications", label: "Activity", icon: Bell },
            { id: "history", label: "History", icon: History },
            { id: "git", label: "Git", icon: GitBranch },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                activeTab === tab.id ? "bg-nexus-accent text-black shadow-[0_0_15px_rgba(5,255,161,0.3)]" : "text-nexus-text-dim hover:text-white"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === "notifications" && notifications.some(n => n.unread) && (
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <AnimatePresence mode="wait">
          {activeTab === "git" && (
            <motion.div 
              key="git"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto space-y-8"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-display font-bold uppercase tracking-tight">Nexus Git Matrix</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest flex items-center gap-2">
                       Active Branch: <span className="text-nexus-accent">{gitStatus?.branch || "main"}</span>
                    </p>
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    <p className="text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest">
                       Status: <span className={cn(gitStatus?.status === "Clean" ? "text-green-400" : "text-yellow-400")}>{gitStatus?.status || "Analyzing..."}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleGitAction("pull")}
                    disabled={gitLoading}
                    className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500 hover:text-black transition-all disabled:opacity-50"
                  >
                    <ArrowDownCircle className="w-4 h-4" /> Pull
                  </button>
                  <button 
                    onClick={() => handleGitAction("push")}
                    disabled={gitLoading}
                    className="px-4 py-2 bg-nexus-accent/10 border border-nexus-accent/30 text-nexus-accent font-bold rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-nexus-accent hover:text-black transition-all disabled:opacity-50"
                  >
                    <ArrowUpCircle className="w-4 h-4" /> Push
                  </button>
                  <button 
                    onClick={fetchGitData}
                    disabled={gitLoading}
                    className={cn(
                      "p-2 bg-white/5 border border-white/10 rounded-xl text-white transition-all hover:bg-white/10",
                      gitLoading && "animate-spin"
                    )}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {gitError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-4">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Neural Link Error</p>
                    <p className="text-[10px] text-red-400 font-mono mt-0.5">{gitError}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass rounded-[32px] border border-white/5 overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                      <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <History className="w-4 h-4 text-nexus-accent" />
                        Commit Architecture
                      </h3>
                      <span className="text-[10px] font-mono text-nexus-text-dim">TOTAL_NODES: {gitHistory.length}</span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {gitHistory.map((commit, i) => (
                        <div key={commit.hash} className="p-6 hover:bg-white/[0.02] transition-colors group">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-nexus-accent/30 transition-all">
                                <GitCommit className="w-4 h-4 text-nexus-text-dim group-hover:text-nexus-accent" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white leading-none mb-1">{commit.message}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-nexus-accent bg-nexus-accent/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">{commit.hash}</span>
                                  <span className="text-[10px] text-nexus-text-dim uppercase tracking-wider">{commit.author}</span>
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-nexus-text-dim uppercase">{commit.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass p-6 rounded-[32px] border border-white/5 bg-nexus-accent/5">
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-nexus-accent" />
                      Branch Matrix
                    </h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-white/5 rounded-2xl border border-nexus-accent/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-nexus-accent shadow-[0_0_8px_rgba(5,255,161,0.5)]" />
                          <span className="text-xs font-bold text-white uppercase">{gitStatus?.branch || "main"}</span>
                        </div>
                        <span className="text-[9px] font-mono text-nexus-accent uppercase tracking-widest">Active</span>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between opacity-50">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-white/20" />
                          <span className="text-xs font-bold text-white uppercase">dev-beta-04</span>
                        </div>
                        <button className="text-[9px] font-mono text-nexus-text-dim hover:text-white uppercase tracking-widest">Switch</button>
                      </div>
                      <button className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-nexus-text-dim hover:text-white transition-all flex items-center justify-center gap-2">
                        + Initialize Neural Fork
                      </button>
                    </div>
                  </div>

                  <div className="glass p-6 rounded-[32px] border border-white/5">
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                       <Terminal className="w-4 h-4 text-nexus-text-dim" />
                       Nexus CLI
                    </h3>
                    <div className="bg-black/60 p-4 rounded-xl border border-white/10 font-mono text-[10px] space-y-2 h-48 overflow-y-auto">
                      <p className="text-nexus-accent">{">"} nexus git status</p>
                      <p className="text-white/60">On branch {gitStatus?.branch || "main"}</p>
                      <p className="text-white/60">Your branch is up to date with origin/{gitStatus?.branch || "main"}.</p>
                      <p className="text-white/60 mt-4">nothing to commit, working tree clean</p>
                      <p className="text-nexus-text-dim animate-pulse">_</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "team" && (
            <motion.div 
              key="team"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <div className="lg:col-span-full mb-4 flex justify-between items-center">
                <h2 className="text-xl font-display font-bold uppercase tracking-tight">Active Matrix Nodes</h2>
                <button className="px-4 py-2 bg-nexus-accent text-black font-bold rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all">
                  <UserPlus className="w-4 h-4" /> Invite Contributor
                </button>
              </div>

              {MEMBERS.map((member) => (
                <div key={member.id} className="glass p-6 rounded-3xl border border-white/5 hover:border-nexus-accent/30 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-bold text-white group-hover:bg-nexus-accent/10 transition-colors">
                        {member.avatar}
                      </div>
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-nexus-bg",
                        member.status === "ONLINE" ? "bg-nexus-accent" : member.status === "BUSY" ? "bg-yellow-500" : "bg-white/10"
                      )} />
                    </div>
                    <button className="text-nexus-text-dim hover:text-white transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-bold text-white mb-1">{member.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-nexus-text-dim uppercase tracking-widest">{member.role}</span>
                    <span className="text-[8px] text-nexus-text-dim uppercase">{member.lastActive}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                    <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all">Message</button>
                    <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all">Perms</button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div 
              key="notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto space-y-4"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-display font-bold uppercase tracking-tight">Neural Activity Stream</h2>
                <button onClick={markAllRead} className="text-[10px] font-bold uppercase text-nexus-accent hover:underline">Mark all as processed</button>
              </div>

              {notifications.map((notif) => (
                <div key={notif.id} className={cn(
                  "p-5 rounded-2xl border transition-all flex items-center justify-between",
                  notif.unread ? "bg-nexus-accent/10 border-nexus-accent/30" : "bg-white/5 border-white/5 opacity-60"
                )}>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      notif.type === "EDIT" ? "bg-blue-500/20 text-blue-400" : 
                      notif.type === "ALERT" ? "bg-red-500/20 text-red-500" : "bg-purple-500/20 text-purple-400"
                    )}>
                      {notif.type === "EDIT" && <Zap className="w-5 h-5" />}
                      {notif.type === "ALERT" && <AlertCircle className="w-5 h-5" />}
                      {notif.type === "JOIN" && <UserPlus className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm text-white">
                        <span className="font-bold">{notif.user}</span> {notif.action} <span className="font-bold text-nexus-accent">{notif.target}</span>
                      </p>
                      <p className="text-[10px] font-mono text-nexus-text-dim uppercase mt-1">{notif.timestamp}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-nexus-text-dim" />
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-6 pb-20"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-display font-bold uppercase tracking-tight">Temporal Version Audit</h2>
                  <p className="text-[10px] font-mono text-nexus-text-dim mt-1 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3 h-3" /> SNAPSHOT_RETENTION: 30D
                  </p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-nexus-text-dim" />
                    <input 
                      type="text"
                      placeholder="Search versions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-[10px] focus:outline-none focus:border-nexus-accent/50 transition-all font-mono uppercase tracking-wider"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="space-y-2">
                  <label className="text-[9px] font-mono font-bold text-nexus-text-dim uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-3 h-3" /> Filter by Author
                  </label>
                  <select 
                    value={filterAuthor}
                    onChange={(e) => setFilterAuthor(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-nexus-accent/50 transition-all appearance-none cursor-pointer"
                  >
                    {authors.map(author => (
                      <option key={author} value={author} className="bg-nexus-bg">{author}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-mono font-bold text-nexus-text-dim uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-3 h-3" /> Filter by Status
                  </label>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-nexus-accent/50 transition-all appearance-none cursor-pointer"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status} className="bg-nexus-bg">{status}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-mono font-bold text-nexus-text-dim uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Epoch Range
                  </label>
                  <button className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-left text-nexus-text-dim hover:text-white transition-all">
                    Last 30 Cycles
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredVersions.length > 0 ? filteredVersions.map((v) => (
                  <div key={v.id} className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-nexus-accent/30 transition-all">
                    {v.status === "LIVE" && (
                      <div className="absolute top-0 right-0 px-4 py-1 bg-nexus-accent text-black text-[8px] font-bold uppercase tracking-widest rounded-bl-xl shadow-[0_0_10px_rgba(5,255,161,0.2)]">
                        Current Live Node
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="px-3 py-1 rounded-lg bg-white/10 text-white font-mono text-xs border border-white/5">
                          v{v.version}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white">{v.author}</p>
                            <span className={cn(
                              "text-[7px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter",
                              v.status === "LIVE" ? "bg-nexus-accent/20 text-nexus-accent" :
                              v.status === "STABLE" ? "bg-blue-500/20 text-blue-400" :
                              v.status === "LEGACY" ? "bg-white/10 text-nexus-text-dim" : "bg-purple-500/20 text-purple-400"
                            )}>
                              {v.status}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-nexus-text-dim">{v.timestamp}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all">Compare</button>
                        <button className="px-4 py-1.5 bg-nexus-accent/10 border border-nexus-accent/30 text-nexus-accent rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-nexus-accent hover:text-black transition-all">Restore</button>
                      </div>
                    </div>
                    <p className="text-xs text-nexus-text-dim leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5 italic">
                      "{v.changes}"
                    </p>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <Filter className="w-12 h-12 text-white/5 mb-4" />
                    <p className="text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest">No temporal nodes match your filter criteria</p>
                    <button 
                      onClick={() => { setFilterAuthor("All"); setFilterStatus("All"); setSearchQuery(""); }}
                      className="mt-4 text-[10px] font-bold text-nexus-accent uppercase hover:underline"
                    >
                      Reset Matrix Filters
                    </button>
                  </div>
                )}
                
                {filteredVersions.length > 0 && (
                  <div className="pt-4 flex justify-center">
                    <button className="text-[9px] font-mono text-nexus-text-dim uppercase tracking-[0.2em] hover:text-white transition-all py-4">
                      [ End of Temporal Buffer ]
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-8 border-t border-white/5 bg-nexus-accent/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-nexus-accent animate-pulse" />
            <span className="text-[10px] font-mono text-nexus-accent uppercase tracking-widest">Real-time Synchronization Active</span>
          </div>
          <div className="flex -space-x-2">
            {MEMBERS.map(m => (
              <div key={m.id} className="w-8 h-8 rounded-full bg-nexus-bg border-2 border-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                {m.avatar}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
