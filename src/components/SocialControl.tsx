import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Share2, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Facebook, 
  Plus, 
  Calendar, 
  BarChart2, 
  Zap, 
  MessageSquare,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Film,
  Trash2,
  UploadCloud,
  TrendingUp,
  Users,
  Eye,
  ChevronDown,
  Filter,
  Sparkles,
  Loader2,
  Settings2,
  Maximize2,
  Github,
  Youtube,
  Link2,
  Play,
  Save,
  Bookmark,
  History,
  Activity,
  Type,
  AlignLeft,
  Monitor,
  Shield
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { GoogleGenAI } from "@google/genai";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

interface ScheduledPost {
  id: string;
  time: string;
  title: string;
  platformIds: string[];
  status: "Ready" | "AI Generating" | "Scheduled" | "Draft";
  media?: { url: string; type: "image" | "video" }[];
  platformConfigs?: Record<string, any>;
}

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-500", provider: "instagram" },
  { id: "twitter", name: "Twitter / X", icon: Twitter, color: "text-blue-400", provider: "twitter" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-600", provider: "linkedin" },
  { id: "github", name: "GitHub", icon: Github, color: "text-white", provider: "github" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-500", provider: "facebook" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "text-red-500", provider: "google" },
];

const ANALYTICS_DATA = [
  { date: "Apr 01", reach: 4500, engagement: 1200, growth: 120 },
  { date: "Apr 02", reach: 5200, engagement: 1500, growth: 150 },
  { date: "Apr 03", reach: 4800, engagement: 1100, growth: 90 },
  { date: "Apr 04", reach: 6100, engagement: 1800, growth: 210 },
  { date: "Apr 05", reach: 5900, engagement: 1700, growth: 180 },
  { date: "Apr 06", reach: 7200, engagement: 2200, growth: 280 },
  { date: "Apr 07", reach: 8500, engagement: 2800, growth: 350 },
];

const LIVE_ANALYTICS_DATA = [
  { time: "00:00", viewers: 120, retention: 95 },
  { time: "05:00", viewers: 450, retention: 92 },
  { time: "10:00", viewers: 890, retention: 88 },
  { time: "15:00", viewers: 1200, retention: 85 },
  { time: "20:00", viewers: 1560, retention: 82 },
  { time: "25:00", viewers: 1420, retention: 80 },
  { time: "30:00", viewers: 1840, retention: 78 },
  { time: "35:00", viewers: 1650, retention: 75 },
  { time: "40:00", viewers: 1500, retention: 72 },
];

export const SocialControl = () => {
  const [activeTab, setActiveTab] = useState<"control" | "analytics" | "generator" | "presets">("control");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<{provider: string, message: string} | null>(null);
  const [showLinkedInDiagnostic, setShowLinkedInDiagnostic] = useState(false);
  const [showFacebookDiagnostic, setShowFacebookDiagnostic] = useState(false);
  const [showInstagramDiagnostic, setShowInstagramDiagnostic] = useState(false);
  const [tokens, setTokens] = useState<Record<string, any>>({});
  const [isInitiatingLive, setIsInitiatingLive] = useState(false);
  const [postFilter, setPostFilter] = useState<"All" | "Scheduled" | "Draft" | "Live">("All");

  const [presets, setPresets] = useState<{ name: string; configs: Record<string, any>; platforms: string[] }[]>(() => {
    const saved = localStorage.getItem("nexus_presets");
    return saved ? JSON.parse(saved) : [];
  });
  const [platformPresets, setPlatformPresets] = useState<Record<string, {name: string, config: any}[]>>(() => {
    const saved = localStorage.getItem("nexus_platform_presets");
    return saved ? JSON.parse(saved) : {
      youtube: [],
      linkedin: [],
      twitter: [],
      instagram: [],
      facebook: []
    } as any;
  });

  const [callbackPresets, setCallbackPresets] = useState<Record<string, {name: string, config: any}[]>>(() => {
    const saved = localStorage.getItem("nexus_callback_presets");
    return saved ? JSON.parse(saved) : {
      youtube: [],
      linkedin: [],
      twitter: [],
      instagram: [],
      facebook: []
    };
  });

  const [newPresetName, setNewPresetName] = useState("");
  const [showPresetSave, setShowPresetSave] = useState(false);

  useEffect(() => {
    localStorage.setItem("nexus_presets", JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    localStorage.setItem("nexus_platform_presets", JSON.stringify(platformPresets));
  }, [platformPresets]);

  useEffect(() => {
    localStorage.setItem("nexus_callback_presets", JSON.stringify(callbackPresets));
  }, [callbackPresets]);

  const savePreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset = {
      name: newPresetName.trim(),
      configs: JSON.parse(JSON.stringify(platformConfigs)),
      platforms: [...selectedPlatforms]
    };
    setPresets(prev => [...prev, newPreset]);
    setNewPresetName("");
    setShowPresetSave(false);
  };

  const loadPreset = (presetConfigs: Record<string, any>, platforms: string[]) => {
    setPlatformConfigs(JSON.parse(JSON.stringify(presetConfigs)));
    setSelectedPlatforms(platforms);
  };

  const deletePreset = (name: string) => {
    setPresets(prev => prev.filter(p => p.name !== name));
  };

  const savePlatformPreset = (platform: string, name: string) => {
    if (!name.trim()) return;
    const config = JSON.parse(JSON.stringify(platformConfigs[platform]));
    setPlatformPresets(prev => ({
      ...prev,
      [platform]: [...(prev[platform] || []), { name: name.trim(), config }]
    }));
  };

  const loadPlatformPreset = (platform: string, config: any) => {
    setPlatformConfigs(prev => ({
      ...prev,
      [platform]: JSON.parse(JSON.stringify(config))
    }));
  };

  const deletePlatformPreset = (platform: string, name: string) => {
    setPlatformPresets(prev => ({
      ...prev,
      [platform]: (prev[platform] || []).filter(p => p.name !== name)
    }));
  };

  const saveCallbackPreset = (platform: string, name: string) => {
    if (!name.trim()) return;
    const config = JSON.parse(JSON.stringify(platformConfigs[platform].callback));
    setCallbackPresets(prev => ({
      ...prev,
      [platform]: [...(prev[platform] || []), { name: name.trim(), config }]
    }));
  };

  const loadCallbackPreset = (platform: string, config: any) => {
    setPlatformConfigs(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        callback: JSON.parse(JSON.stringify(config))
      }
    }));
  };

  const deleteCallbackPreset = (platform: string, name: string) => {
    setCallbackPresets(prev => ({
      ...prev,
      [platform]: (prev[platform] || []).filter(p => p.name !== name)
    }));
  };

  const [platformPresetNaming, setPlatformPresetNaming] = useState<string | null>(null);
  const [tempPlatformPresetName, setTempPlatformPresetName] = useState("");

  const [callbackPresetNaming, setCallbackPresetNaming] = useState<string | null>(null);
  const [tempCallbackPresetName, setTempCallbackPresetName] = useState("");

  const PlatformPresetManager = ({ platform, color }: { platform: string; color: string }) => {
    const platformPresetsList = platformPresets[platform] || [];
    const isNaming = platformPresetNaming === platform;

    return (
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-nexus-text-dim uppercase font-mono tracking-widest">Neural Presets</span>
          <button 
            onClick={() => {
              if (isNaming) {
                savePlatformPreset(platform, tempPlatformPresetName);
                setPlatformPresetNaming(null);
                setTempPlatformPresetName("");
              } else {
                setPlatformPresetNaming(platform);
              }
            }}
            className={cn(
              "text-[10px] font-bold transition-all flex items-center gap-1.5 px-2 py-1 rounded-lg border",
              isNaming ? "bg-nexus-accent text-black border-nexus-accent" : "text-nexus-accent border-nexus-accent/20 hover:bg-nexus-accent/10"
            )}
          >
            {isNaming ? <CheckCircle2 className="w-3 h-3" /> : <Save className="w-3 h-3" />}
            {isNaming ? "CONFIRM" : "SAVE NEW"}
          </button>
        </div>

        {isNaming && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2"
          >
            <input 
              type="text"
              autoFocus
              value={tempPlatformPresetName}
              onChange={(e) => setTempPlatformPresetName(e.target.value)}
              placeholder="Preset Name..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-nexus-accent/50"
            />
            <button 
              onClick={() => setPlatformPresetNaming(null)}
              className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {platformPresetsList.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {platformPresetsList.map(p => (
              <div key={p.name} className="group relative">
                <button
                  onClick={() => loadPlatformPreset(platform, p.config)}
                  className={cn(
                    "text-[9px] px-2 py-1 rounded-lg border transition-all flex items-center gap-1.5",
                    "bg-white/5 border-white/5 hover:border-nexus-accent/50 hover:bg-nexus-accent/10 text-nexus-text-dim hover:text-white"
                  )}
                >
                  <Bookmark className="w-2.5 h-2.5" />
                  {p.name}
                </button>
                <button 
                  onClick={() => deletePlatformPreset(platform, p.name)}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="w-2 h-2" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const CallbackSystemControl = ({ platform }: { platform: string }) => {
    const config = platformConfigs[platform]?.callback || { enabled: false, trigger: "Comment", keywords: "", action: "CRM Entry" };
    const presetsList = callbackPresets[platform] || [];
    const isNaming = callbackPresetNaming === platform;
    
    return (
      <div className="mt-4 p-3 rounded-xl bg-nexus-accent/5 border border-nexus-accent/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className={cn("w-3.5 h-3.5", config.enabled ? "text-nexus-accent animate-pulse" : "text-nexus-text-dim")} />
            <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Neural Callback Interface</span>
          </div>
          <button 
            onClick={() => setPlatformConfigs(prev => ({
              ...prev,
              [platform]: {
                ...prev[platform],
                callback: { ...config, enabled: !config.enabled }
              }
            }))}
            className={cn(
              "px-2 py-0.5 rounded text-[8px] font-bold border transition-all",
              config.enabled ? "bg-nexus-accent text-black border-nexus-accent" : "bg-white/5 text-nexus-text-dim border-white/10"
            )}
          >
            {config.enabled ? "ACTIVE" : "STANDBY"}
          </button>
        </div>

        {config.enabled && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <span className="text-[9px] text-nexus-text-dim uppercase font-mono tracking-widest">Callback Presets</span>
              <button 
                onClick={() => {
                  if (isNaming) {
                    saveCallbackPreset(platform, tempCallbackPresetName);
                    setCallbackPresetNaming(null);
                    setTempCallbackPresetName("");
                  } else {
                    setCallbackPresetNaming(platform);
                  }
                }}
                className={cn(
                  "text-[8px] font-bold transition-all flex items-center gap-1 px-1.5 py-0.5 rounded border",
                  isNaming ? "bg-nexus-accent text-black border-nexus-accent" : "text-nexus-accent border-nexus-accent/20 hover:bg-nexus-accent/10"
                )}
              >
                {isNaming ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Save className="w-2.5 h-2.5" />}
                {isNaming ? "OK" : "SAVE"}
              </button>
            </div>

            {isNaming && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2"
              >
                <input 
                  type="text"
                  autoFocus
                  value={tempCallbackPresetName}
                  onChange={(e) => setTempCallbackPresetName(e.target.value)}
                  placeholder="Callback Preset Name..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white outline-none focus:border-nexus-accent/30"
                />
                <button 
                  onClick={() => setCallbackPresetNaming(null)}
                  className="px-1.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </motion.div>
            )}

            {presetsList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 overflow-x-auto max-h-20 py-1 scrollbar-none">
                {presetsList.map(p => (
                  <div key={p.name} className="group relative">
                    <button
                      onClick={() => loadCallbackPreset(platform, p.config)}
                      className={cn(
                        "text-[8px] px-2 py-0.5 rounded border transition-all flex items-center gap-1 whitespace-nowrap",
                        "bg-white/5 border-white/5 hover:border-nexus-accent/50 hover:bg-nexus-accent/10 text-nexus-text-dim hover:text-white"
                      )}
                    >
                      <Bookmark className="w-2 h-2" />
                      {p.name}
                    </button>
                    <button 
                      onClick={() => deleteCallbackPreset(platform, p.name)}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-2 h-2" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/5">
              <div className="space-y-1">
                <label className="text-[8px] text-nexus-text-dim uppercase font-mono">Trigger Type</label>
                <select 
                  value={config.trigger}
                  onChange={(e) => setPlatformConfigs(prev => ({
                    ...prev,
                    [platform]: { ...prev[platform], callback: { ...config, trigger: e.target.value } }
                  }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[9px] outline-none hover:border-nexus-accent/20 cursor-pointer transition-all"
                >
                  <option value="Comment">Comment</option>
                  <option value="Mention">Mention</option>
                  <option value="Message">Direct Message</option>
                  <option value="Share">Share / Re-post</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] text-nexus-text-dim uppercase font-mono">Automated Action</label>
                <select 
                  value={config.action}
                  onChange={(e) => setPlatformConfigs(prev => ({
                    ...prev,
                    [platform]: { ...prev[platform], callback: { ...config, action: e.target.value } }
                  }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[9px] outline-none hover:border-nexus-accent/20 cursor-pointer transition-all"
                >
                  <option value="CRM Entry">Add to CRM</option>
                  <option value="Lead Score">Lead Scoring</option>
                  <option value="Auto-Reply">Neural Auto-Reply</option>
                  <option value="Direct Message">Inbound DM</option>
                  <option value="Email Sequence">Email Enrollment</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] text-nexus-text-dim uppercase font-mono">Neural Keywords (CSV)</label>
              <input 
                type="text"
                value={config.keywords}
                onChange={(e) => setPlatformConfigs(prev => ({
                  ...prev,
                  [platform]: { ...prev[platform], callback: { ...config, keywords: e.target.value } }
                }))}
                placeholder="e.g. price, info, demo"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[9px] outline-none focus:border-nexus-accent/30 transition-all"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const [generatorPrompt, setGeneratorPrompt] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showSummaryInput, setShowSummaryInput] = useState(false);
  const [longContentText, setLongContentText] = useState("");
  const [generatorMode, setGeneratorMode] = useState<"ideas" | "summarize">("ideas");
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<{ idea: string; caption: string; hashtags: string }[]>([]);

  const summarizeContent = async () => {
    const textToSummarize = activeTab === "generator" ? generatorPrompt : longContentText;
    if (!textToSummarize) return;
    setIsSummarizing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Summarize the following long-form content into high-impact social media captions optimized for the NEXUS ONE platform. 
      You MUST provide exactly two variations:
      1. A short, punchy variation for Twitter/X (under 280 characters).
      2. A more professional, authority-building version for LinkedIn.
      
      Content to summarize: "${textToSummarize}"
      
      Tone: Futuristic, Professional, Thought-Leader, Direct.
      
      Format the response as a JSON array of 2 objects with keys: 
      "platform": "Twitter" or "LinkedIn"
      "idea": A short label for this variation
      "caption": The synthesized caption
      "hashtags": 2-3 relevant hashtags (as a string)
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are the NEXUS ONE Content Distiller. You perform hyper-efficient neural summarization for maximum social engagement."
        }
      });

      const data = JSON.parse(response.text || "[]");
      if (activeTab === "generator") {
        setGeneratedIdeas(data);
      } else {
        // If in modal, we can pick the best one or just join them
        const combined = data.map((d: any) => `[${d.platform} Variation]\n${d.caption}\n\n${d.hashtags}`).join("\n\n---\n\n");
        setNewPostTitle(combined);
        setShowSummaryInput(false);
        setLongContentText("");
      }
    } catch (error) {
      console.error("Neural Summarization Error:", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { provider, tokens: newTokens } = event.data;
        setConnectedPlatforms(prev => [...new Set([...prev, provider])]);
        setTokens(prev => ({ ...prev, [provider]: newTokens }));
        setIsConnecting(null);
        setConnectionError(null);
        setShowLinkedInDiagnostic(false);
        setShowFacebookDiagnostic(false);
        setShowInstagramDiagnostic(false);
      } else if (event.data?.type === 'OAUTH_AUTH_FAILURE') {
        const { provider, error } = event.data;
        setConnectionError({ provider, message: error || "Authentication failed" });
        setIsConnecting(null);
        if (provider === 'linkedin') {
          setShowLinkedInDiagnostic(true);
        } else if (provider === 'facebook') {
          setShowFacebookDiagnostic(true);
        } else if (provider === 'instagram') {
          setShowInstagramDiagnostic(true);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async (provider: string) => {
    setIsConnecting(provider);
    setConnectionError(null);
    try {
      const response = await fetch(`/api/auth/${provider}/url`);
      if (!response.ok) throw new Error('Neural interface failed to generate authorization link.');
      const { url } = await response.json();

      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const authWindow = window.open(
        url,
        'nexus_oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!authWindow) {
        setConnectionError({ 
          provider, 
          message: 'Neural link blocked by browser. Please authorize popups in your terminal settings.' 
        });
        setIsConnecting(null);
        return;
      }

      // Check if window is closed by user
      const checkWindowContent = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkWindowContent);
          setIsConnecting(prev => {
            if (prev === provider) {
              return null;
            }
            return prev;
          });
        }
      }, 1000);

    } catch (error: any) {
      console.error('Connection error:', error);
      setConnectionError({ 
        provider, 
        message: error.message || 'Quantum stabilization failure in neural link.' 
      });
      setIsConnecting(null);
    }
  };

  const [posts, setPosts] = useState<ScheduledPost[]>(() => {
    const saved = localStorage.getItem("nexus_posts");
    return saved ? JSON.parse(saved) : [
      { id: "1", time: "Today, 18:00", title: "Product Launch Teaser", platformIds: ["instagram", "twitter"], status: "Scheduled" },
      { id: "2", time: "Tomorrow, 10:00", title: "Customer Success Story", platformIds: ["linkedin", "facebook"], status: "Draft" },
      { id: "3", time: "Monday, 09:00", title: "Weekly Tech Roundup", platformIds: ["twitter", "linkedin"], status: "Scheduled" },
    ];
  });

  useEffect(() => {
    localStorage.setItem("nexus_posts", JSON.stringify(posts));
  }, [posts]);

  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  // Analytics Filters
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [dateRange, setDateRange] = useState("7d");

  // Form State
  const [newPostTitle, setNewPostTitle] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [attachedMedia, setAttachedMedia] = useState<{ url: string; type: "image" | "video" }[]>([]);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [platformConfigs, setPlatformConfigs] = useState<Record<string, any>>({
    twitter: { charLimit: 280, thread: false, callback: { enabled: false, trigger: "Mention", keywords: "help, info", action: "Lead Score" } },
    instagram: { ratio: "1:1", autoCrop: true, callback: { enabled: false, trigger: "Comment", keywords: "price, buy", action: "Direct Message" } },
    linkedin: { 
      visibility: "Public",
      isLive: false,
      description: "",
      streamTitle: "",
      streamDate: "",
      streamTime: "",
      callback: { enabled: false, trigger: "Comment", keywords: "interested, demo", action: "CRM Entry" }
    },
    facebook: { audience: "Public", callback: { enabled: false, trigger: "Message", keywords: "details", action: "Auto-Reply" } },
    youtube: { 
      visibility: "public", 
      category: "Entertainment", 
      isLive: false, 
      description: "",
      streamTitle: "",
      streamDate: "",
      streamTime: "",
      callback: { enabled: false, trigger: "Comment", keywords: "tutorial, link", action: "Email Sequence" }
    }
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateAICaption = async () => {
    if (!newPostTitle && attachedMedia.length === 0) return;
    
    setIsGeneratingCaption(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Generate a short, engaging social media caption for a post with the following title/context: "${newPostTitle}". 
      ${attachedMedia.length > 0 ? `The post includes ${attachedMedia.length} media assets.` : ""}
      The tone should be futuristic, professional, and slightly hype-driven. Include 2-3 relevant hashtags.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are the NEXUS ONE Social Media AI. You generate high-engagement captions that are futuristic and professional."
        }
      });

      const text = response.text || "";
      setNewPostTitle(text.trim());
    } catch (error) {
      console.error("AI Caption Error:", error);
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleGenerateIdeas = async () => {
    if (!generatorPrompt) return;
    setIsGeneratingIdeas(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Generate 3 creative and high-engagement social media post ideas based on this topic: "${generatorPrompt}". 
      For each idea, provide:
      1. A short, catchy title/idea.
      2. A full engaging caption.
      3. A list of 3-5 relevant hashtags.
      Format the response as a JSON array of objects with keys: "idea", "caption", "hashtags" (as a string).`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are the NEXUS ONE Content Strategist. You generate innovative, high-engagement content ideas in JSON format."
        }
      });

      const text = response.text || "[]";
      const ideas = JSON.parse(text);
      setGeneratedIdeas(ideas);
    } catch (error) {
      console.error("Idea Generation Error:", error);
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const useIdea = (idea: { idea: string; caption: string; hashtags: string }) => {
    setNewPostTitle(`${idea.idea}\n\n${idea.caption}\n\n${idea.hashtags}`);
    setIsModalOpen(true);
  };

  const openEditModal = (post: ScheduledPost) => {
    setEditingPostId(post.id);
    setNewPostTitle(post.title);
    setSelectedPlatforms(post.platformIds);
    
    // Parse time
    if (post.time !== "Not Scheduled") {
      const [date, time] = post.time.split(", ");
      setScheduleDate(date);
      setScheduleTime(time);
    }

    setAttachedMedia(post.media || []);
    setPlatformConfigs(post.platformConfigs || {
      twitter: { charLimit: 280, thread: false },
      instagram: { ratio: "1:1", autoCrop: true },
      linkedin: { 
        visibility: "Public",
        isLive: false,
        description: "",
        streamTitle: "",
        streamDate: "",
        streamTime: ""
      },
      facebook: { audience: "Public" },
      youtube: { 
        visibility: "public", 
        category: "Entertainment", 
        isLive: false, 
        description: "",
        streamTitle: "",
        streamDate: "",
        streamTime: ""
      }
    });
    setIsModalOpen(true);
  };

  const syncStreamFields = (platform: "youtube" | "linkedin") => {
    setPlatformConfigs(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        streamTitle: prev[platform].streamTitle || newPostTitle,
        description: prev[platform].description || "Neural Broadcast from NEXUS ONE system."
      }
    }));
  };

  const handleSave = (status: "Scheduled" | "Draft") => {
    if (!newPostTitle || selectedPlatforms.length === 0) return;
    if (status === "Scheduled" && (!scheduleDate || !scheduleTime)) return;

    const postData: ScheduledPost = {
      id: editingPostId || Math.random().toString(36).substr(2, 9),
      title: newPostTitle,
      time: status === "Draft" ? "Not Scheduled" : `${scheduleDate}, ${scheduleTime}`,
      platformIds: [...selectedPlatforms],
      status,
      media: attachedMedia,
      platformConfigs: { ...platformConfigs }
    };

    if (editingPostId) {
      setPosts(prev => prev.map(p => p.id === editingPostId ? postData : p));
    } else {
      setPosts([postData, ...posts]);
    }
    
    setIsModalOpen(false);
    setEditingPostId(null);
    // Reset form
    setNewPostTitle("");
    setSelectedPlatforms([]);
    setScheduleDate("");
    setScheduleTime("");
    setAttachedMedia([]);
    setPlatformConfigs({
      twitter: { charLimit: 280, thread: false },
      instagram: { ratio: "1:1", autoCrop: true },
      linkedin: { 
        visibility: "Public",
        isLive: false,
        description: "",
        streamTitle: "",
        streamDate: "",
        streamTime: ""
      },
      facebook: { audience: "Public" },
      youtube: { 
        visibility: "public", 
        category: "Entertainment", 
        isLive: false, 
        description: "",
        streamTitle: "",
        streamDate: "",
        streamTime: ""
      }
    });
  };

  const initiateLiveStream = async (targetPost?: ScheduledPost) => {
    const configs = targetPost ? targetPost.platformConfigs : platformConfigs;
    const title = targetPost ? targetPost.title : newPostTitle;
    const selected = targetPost ? targetPost.platformIds : selectedPlatforms;
    
    const isYoutubeLive = configs?.youtube?.isLive && selected.includes("youtube");
    const isLinkedinLive = configs?.linkedin?.isLive && selected.includes("linkedin");
    
    if ((!isYoutubeLive && !isLinkedinLive) || isInitiatingLive) {
      if (targetPost && !isYoutubeLive && !isLinkedinLive) {
        alert("This post is not configured for a live stream broadcast.");
      }
      return;
    }
    
    setIsInitiatingLive(true);
    try {
      if (isYoutubeLive) {
        const streamTitle = configs.youtube.streamTitle || title;
        const finalStartTime = configs.youtube.streamDate && configs.youtube.streamTime 
          ? `${configs.youtube.streamDate}T${configs.youtube.streamTime}:00Z`
          : (targetPost ? targetPost.time.replace(", ", "T") + ":00Z" : (scheduleDate && scheduleTime ? `${scheduleDate}T${scheduleTime}:00Z` : new Date().toISOString()));

        const response = await fetch("/api/youtube/live-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: streamTitle,
            description: configs.youtube.description,
            privacyStatus: configs.youtube.visibility,
            category: configs.youtube.category,
            scheduledStartTime: finalStartTime,
            tokens: tokens.google
          })
        });

        const data = await response.json();
        if (data.success) {
          alert(`YouTube Success: ${data.message}\nStream key: ${data.streamKey}`);
        } else {
          throw new Error(data.error || "Failed to initiate YouTube live stream");
        }
      }

      if (isLinkedinLive) {
        const streamTitle = configs.linkedin.streamTitle || title;
        const finalStartTime = configs.linkedin.streamDate && configs.linkedin.streamTime 
          ? `${configs.linkedin.streamDate}T${configs.linkedin.streamTime}:00Z`
          : (targetPost ? targetPost.time.replace(", ", "T") + ":00Z" : (scheduleDate && scheduleTime ? `${scheduleDate}T${scheduleTime}:00Z` : new Date().toISOString()));

        const response = await fetch("/api/linkedin/live-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: streamTitle,
            description: configs.linkedin.description,
            visibility: configs.linkedin.visibility,
            scheduledStartTime: finalStartTime,
            tokens: tokens.linkedin
          })
        });

        const data = await response.json();
        if (data.success) {
          alert(`LinkedIn Success: ${data.message}`);
        } else {
          throw new Error(data.error || "Failed to initiate LinkedIn live stream");
        }
      }

      if (!targetPost) {
        handleSave("Scheduled");
      } else {
        // Mark as initiated or just alert success
        setPosts(prev => prev.map(p => p.id === targetPost.id ? { ...p, status: "Ready" } : p));
      }
    } catch (error: any) {
      console.error("Live Stream Initiation Error:", error);
      alert(`Error initializing neural stream: ${error.message}`);
    } finally {
      setIsInitiatingLive(false);
    }
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (validFiles.length === 0) return;

    setAttachedMedia(prev => {
      const remainingSlots = 4 - prev.length;
      if (remainingSlots <= 0) return prev;
      
      const newMedia = validFiles.slice(0, remainingSlots).map(file => ({
        url: URL.createObjectURL(file),
        type: (file.type.startsWith("video") ? "video" : "image") as "video" | "image"
      }));
      
      return [...prev, ...newMedia];
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeMedia = (index: number) => {
    setAttachedMedia(prev => {
      const updated = [...prev];
      if (updated[index]?.url) {
        URL.revokeObjectURL(updated[index].url);
      }
      return updated.filter((_, i) => i !== index);
    });
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto relative">
      <header className="flex justify-between items-end">
        <div className="space-y-4">
          <div>
            <h2 className="text-3xl font-display font-bold">Omni-Platform Control</h2>
            <p className="text-nexus-text-dim mt-1">Unified social media management and auto-engagement.</p>
          </div>
          
          <div className="flex p-1 bg-white/5 rounded-xl w-fit border border-white/5">
            <button 
              onClick={() => setActiveTab("control")}
              className={cn(
                "px-6 py-2 rounded-lg text-xs font-bold transition-all",
                activeTab === "control" ? "bg-nexus-accent text-black" : "text-nexus-text-dim hover:text-white"
              )}
            >
              CONTROL CENTER
            </button>
            <button 
              onClick={() => setActiveTab("analytics")}
              className={cn(
                "px-6 py-2 rounded-lg text-xs font-bold transition-all",
                activeTab === "analytics" ? "bg-nexus-accent text-black" : "text-nexus-text-dim hover:text-white"
              )}
            >
              ANALYTICS
            </button>
            <button 
              onClick={() => setActiveTab("generator")}
              className={cn(
                "px-6 py-2 rounded-lg text-xs font-bold transition-all",
                activeTab === "generator" ? "bg-nexus-accent text-black" : "text-nexus-text-dim hover:text-white"
              )}
            >
              IDEA GENERATOR
            </button>
            <button 
              onClick={() => setActiveTab("presets")}
              className={cn(
                "px-6 py-2 rounded-lg text-xs font-bold transition-all",
                activeTab === "presets" ? "bg-nexus-accent text-black" : "text-nexus-text-dim hover:text-white"
              )}
            >
              NEURAL PRESETS
            </button>
          </div>
        </div>
        
        {activeTab === "presets" && (
          <motion.div 
            key="presets"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="glass p-8 rounded-3xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Bookmark className="w-6 h-6 text-nexus-accent" />
                  <div>
                    <h3 className="text-xl font-display font-bold">Neural Preset Registry</h3>
                    <p className="text-xs text-nexus-text-dim uppercase tracking-widest mt-1">Global management interface for cross-platform configurations</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Global Presets */}
                <div className="lg:col-span-3">
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                    <h4 className="text-xs font-mono text-nexus-text-dim uppercase tracking-[0.2em]">Global System Presets</h4>
                    <button 
                      onClick={() => setShowPresetSave(!showPresetSave)}
                      className={cn(
                        "text-[10px] font-bold px-3 py-1 rounded-lg border transition-all flex items-center gap-2",
                        showPresetSave ? "bg-nexus-accent text-black border-nexus-accent" : "text-nexus-accent border-nexus-accent/20 hover:bg-nexus-accent/10"
                      )}
                    >
                      <Plus className="w-3 h-3" />
                      SAVE CURRENT AS PRESET
                    </button>
                  </div>

                  <AnimatePresence>
                    {showPresetSave && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-6 overflow-hidden"
                      >
                        <div className="p-6 rounded-3xl bg-nexus-accent/5 border border-nexus-accent/20 flex flex-col md:flex-row gap-4 items-end">
                          <div className="flex-1 space-y-2 w-full">
                            <label className="text-[10px] text-nexus-text-dim uppercase font-mono">New Preset Name</label>
                            <input 
                              type="text"
                              value={newPresetName}
                              onChange={(e) => setNewPresetName(e.target.value)}
                              placeholder="e.g. Q3 Launch Strategy, Night Stream Config..."
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-nexus-accent/50 transition-all"
                            />
                          </div>
                          <div className="flex-1 space-y-2 w-full">
                            <label className="text-[10px] text-nexus-text-dim uppercase font-mono">Captured Platforms</label>
                            <div className="flex flex-wrap gap-2 py-1">
                              {selectedPlatforms.length === 0 ? (
                                <span className="text-[10px] text-red-400 italic">No platforms selected in system.</span>
                              ) : (
                                selectedPlatforms.map(pid => {
                                  const P = PLATFORMS.find(p => p.id === pid);
                                  return P ? <P.icon key={pid} className={cn("w-4 h-4", P.color)} /> : null;
                                })
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-2 w-full md:w-auto">
                            <button 
                              onClick={() => setShowPresetSave(false)}
                              className="flex-1 md:flex-none px-6 py-2 rounded-xl bg-white/5 text-nexus-text-dim font-bold text-xs hover:bg-white/10 transition-all uppercase"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={savePreset}
                              disabled={!newPresetName.trim() || selectedPlatforms.length === 0}
                              className="flex-1 md:flex-none px-8 py-2 rounded-xl bg-nexus-accent text-black font-bold text-xs hover:shadow-[0_0_20px_rgba(5,255,161,0.3)] transition-all uppercase disabled:opacity-50"
                            >
                              Store Preset
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {presets.length === 0 ? (
                    <div className="p-12 border-2 border-dashed border-white/5 rounded-3xl text-center">
                      <p className="text-sm text-nexus-text-dim">No global neural presets initialized.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {presets.map(preset => (
                        <div key={preset.name} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-nexus-accent/30 transition-all group flex flex-col h-full">
                          <div className="flex justify-between items-start mb-4">
                            <div className="p-2 rounded-lg bg-nexus-accent/10">
                              <Zap className="w-4 h-4 text-nexus-accent" />
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  loadPreset(preset.configs, preset.platforms || []);
                                  setIsModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-nexus-accent/10 text-nexus-accent hover:bg-nexus-accent hover:text-black transition-all opacity-0 group-hover:opacity-100"
                                title="Apply & Open Modal"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => deletePreset(preset.name)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-nexus-text-dim hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <h5 className="font-bold text-white mb-2">{preset.name}</h5>
                          <div className="flex flex-wrap gap-2 mb-4 flex-grow">
                            {preset.platforms?.map(pid => {
                              const P = PLATFORMS.find(p => p.id === pid);
                              return P ? (
                                <div key={pid} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5">
                                  <P.icon className={cn("w-3 h-3", P.color)} />
                                  <span className="text-[9px] font-bold text-nexus-text-dim uppercase tracking-widest">{P.name}</span>
                                </div>
                              ) : null;
                            })}
                          </div>
                          <button 
                            onClick={() => {
                              loadPreset(preset.configs, preset.platforms || []);
                              alert(`Preset "${preset.name}" applied to neural system.`);
                            }}
                            className="w-full py-2 bg-white/5 hover:bg-nexus-accent hover:text-black rounded-xl text-[10px] font-bold transition-all border border-white/5 group-hover:border-nexus-accent/50"
                          >
                            APPLY TO SYSTEM
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Platform Specific Presets */}
                {PLATFORMS.map(platform => {
                  const pList = platformPresets[platform.id] || [];
                  const cList = callbackPresets[platform.id] || [];
                  if (pList.length === 0 && cList.length === 0) return null;

                  return (
                    <div key={platform.id} className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-6">
                      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <div className={cn("p-2 rounded-xl bg-white/5", platform.color)}>
                          <platform.icon className="w-5 h-5" />
                        </div>
                        <h5 className="font-bold text-lg uppercase tracking-tight">{platform.name} Matrix</h5>
                      </div>

                      {pList.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-[10px] text-nexus-text-dim uppercase font-mono tracking-widest">Protocol Presets</p>
                          <div className="space-y-2">
                            {pList.map(p => (
                              <div key={p.name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-nexus-accent/30 transition-all group cursor-pointer" onClick={() => {
                                loadPlatformPreset(platform.id, p.config);
                                alert(`${platform.name} protocol "${p.name}" loaded.`);
                              }}>
                                <div className="flex items-center gap-3">
                                  <Bookmark className="w-3.5 h-3.5 text-nexus-text-dim" />
                                  <span className="text-xs font-medium">{p.name}</span>
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deletePlatformPreset(platform.id, p.name);
                                  }}
                                  className="p-1 rounded-md hover:bg-red-500/10 text-nexus-text-dim hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {cList.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-[10px] text-nexus-text-dim uppercase font-mono tracking-widest">Callback Routines</p>
                          <div className="space-y-2">
                            {cList.map(p => (
                              <div key={p.name} className="flex items-center justify-between p-3 rounded-xl bg-nexus-accent/5 border border-nexus-accent/10 hover:border-nexus-accent transition-all group cursor-pointer" onClick={() => {
                                loadCallbackPreset(platform.id, p.config);
                                alert(`${platform.name} callback "${p.name}" loaded.`);
                              }}>
                                <div className="flex items-center gap-3">
                                  <Zap className="w-3.5 h-3.5 text-nexus-accent" />
                                  <span className="text-xs font-medium">{p.name}</span>
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteCallbackPreset(platform.id, p.name);
                                  }}
                                  className="p-1 rounded-md hover:bg-red-500/10 text-nexus-text-dim hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* API Token Vault */}
                <div className="lg:col-span-3 pt-8 border-t border-white/5">
                  <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-5 h-5 text-nexus-accent" />
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest">Neural API Token Vault</h4>
                      <p className="text-[10px] text-nexus-text-dim uppercase tracking-widest mt-1">Manual integration with platform-specific API tokens</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {PLATFORMS.filter(p => p.id === "youtube" || p.id === "linkedin").map(platform => (
                      <div key={platform.id} className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                        <div className="flex items-center gap-3">
                          <platform.icon className={cn("w-5 h-5", platform.color)} />
                          <h5 className="font-bold">{platform.name} Token</h5>
                        </div>
                        <input 
                          type="password"
                          placeholder={`Paste ${platform.name} API Token / Secret...`}
                          value={tokens[platform.provider]?.accessToken || ""}
                          onChange={(e) => setTokens(prev => ({
                            ...prev,
                            [platform.provider]: { ...prev[platform.provider], accessToken: e.target.value }
                          }))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-nexus-accent/50 transition-all font-mono"
                        />
                        <div className="p-3 rounded-xl bg-nexus-accent/5 border border-nexus-accent/10">
                          <p className="text-[9px] text-nexus-text-dim leading-relaxed italic">
                            Tokens are stored in temporary neural memory. For production, ensure these are linked to your system environment.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "control" && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-nexus-accent text-black font-bold rounded-xl flex items-center gap-2 hover:bg-white transition-all shadow-lg shadow-nexus-accent/20"
          >
            <Plus className="w-4 h-4" />
            NEW POST
          </button>
        )}
      </header>

      <AnimatePresence mode="wait">
        {activeTab === "control" ? (
          <motion.div 
            key="control"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               {PLATFORMS.map((platform, i) => {
                 const isConnected = connectedPlatforms.includes(platform.provider) || !!tokens[platform.provider]?.accessToken;
                 const isThisConnecting = isConnecting === platform.provider;
                 const hasError = connectionError?.provider === platform.provider;

                 return (
                   <button 
                     key={i} 
                     onClick={() => !isConnected && handleConnect(platform.provider)}
                     disabled={isThisConnecting}
                     className={cn(
                       "glass p-4 rounded-2xl flex items-center gap-4 text-left transition-all group relative",
                       isConnected ? "border-green-500/30 bg-green-500/5" : hasError ? "border-red-500/30 bg-red-500/5" : "hover:border-nexus-accent/50"
                     )}
                   >
                     <div className={cn(
                       "p-2 rounded-lg bg-white/5 transition-colors", 
                       platform.color,
                       isConnected && "bg-green-500/20 text-green-500",
                       hasError && "bg-red-500/20 text-red-500"
                     )}>
                       {isThisConnecting ? (
                         <Loader2 className="w-5 h-5 animate-spin" />
                       ) : isConnected ? (
                         <CheckCircle2 className="w-5 h-5" />
                       ) : hasError ? (
                         <AlertCircle className="w-5 h-5" />
                       ) : (
                         <platform.icon className="w-5 h-5" />
                       )}
                     </div>
                     <div className="flex-1">
                       <p className={cn(
                         "text-sm font-bold",
                         isConnected ? "text-green-500" : hasError ? "text-red-500" : "text-white"
                       )}>{platform.name}</p>
                       <div className="flex items-center gap-1">
                         <div className={cn(
                           "w-1.5 h-1.5 rounded-full",
                           isConnected ? "bg-green-500 animate-pulse" : hasError ? "bg-red-500" : "bg-nexus-text-dim"
                         )} />
                         <p className="text-[10px] text-nexus-text-dim uppercase tracking-widest font-mono">
                           {isThisConnecting ? "Initiating..." : isConnected ? "Verified" : hasError ? "Failed" : "Link Neural Interface"}
                         </p>
                       </div>
                     </div>
                     {!isConnected && !isThisConnecting && !hasError && (
                       <Link2 className="w-4 h-4 text-nexus-text-dim opacity-0 group-hover:opacity-100 transition-opacity" />
                     )}
                     {hasError && (
                       <div className="absolute inset-x-0 -bottom-1 flex justify-center">
                         <div className="bg-red-500 text-white text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter shadow-lg">
                           Interface Error
                         </div>
                       </div>
                     )}
                   </button>
                 );
               })}
            </div>
            
            {/* LinkedIn Neural Diagnostic Interface */}
            <AnimatePresence>
              {showLinkedInDiagnostic && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="glass p-6 rounded-3xl border border-red-500/20 bg-red-500/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <h4 className="text-sm font-bold uppercase tracking-widest text-red-500">LinkedIn Neural Diagnostic</h4>
                      </div>
                      <button 
                        onClick={() => setShowLinkedInDiagnostic(false)}
                        className="p-1 hover:bg-white/10 rounded-lg transition-all"
                      >
                        <X className="w-4 h-4 text-nexus-text-dim" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-black/40 border border-white/5 font-mono text-[11px] space-y-2">
                        <p className="text-nexus-text-dim uppercase tracking-tighter">ERROR CODE: <span className="text-red-400">{connectionError?.message || "PX-SYNC-LNK-01"}</span></p>
                        <p className="text-white/80 leading-relaxed italic border-l-2 border-nexus-accent pl-3">
                          "Neural synchronization with LinkedIn professional database failed. Authorization handshake was rejected by the host node."
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-nexus-text-dim">Potential Root Causes</p>
                          <ul className="space-y-1.5">
                            {[
                              "User aborted the neural authorization handshake.",
                              "LinkedIn API Quota or Developer Tier restrictions.",
                              "Mismatched Redirect URI in LinkedIn Neural Dashboard.",
                              "Insufficient permissions granted during protocol sync."
                            ].map((cause, i) => (
                              <li key={i} className="flex items-center gap-2 text-[10px] text-white/60">
                                <Activity className="w-3 h-3 text-red-500/50" />
                                {cause}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-nexus-accent">Protocol Remediation</p>
                          <div className="space-y-2">
                            <button 
                              onClick={() => handleConnect('linkedin')}
                              className="w-full py-2 bg-nexus-accent text-black text-[10px] font-bold rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                            >
                              <Zap className="w-3 h-3" />
                              RETRY NEURAL SYNC
                            </button>
                            <a 
                              href="https://www.linkedin.com/developers/apps" 
                              target="_blank" 
                              rel="noreferrer"
                              className="w-full py-2 bg-white/5 border border-white/10 text-white text-[10px] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all font-mono"
                            >
                              <Monitor className="w-3 h-3" />
                              CHECK LINKEDIN DEV CONSOLE
                            </a>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2 flex items-center justify-center">
                        <p className="text-[9px] text-nexus-text-dim uppercase tracking-tighter font-mono">
                          STATUS: WAITING FOR USER ACTION | LATENCY: <span className="text-nexus-accent">14ms</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Facebook Neural Diagnostic Interface */}
            <AnimatePresence>
              {showFacebookDiagnostic && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="glass p-6 rounded-3xl border border-blue-500/20 bg-blue-500/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Facebook className="w-5 h-5 text-blue-500" />
                        <h4 className="text-sm font-bold uppercase tracking-widest text-blue-500">Facebook Protocol Failure</h4>
                      </div>
                      <button 
                        onClick={() => setShowFacebookDiagnostic(false)}
                        className="p-1 hover:bg-white/10 rounded-lg transition-all"
                      >
                        <X className="w-4 h-4 text-nexus-text-dim" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-black/40 border border-white/5 font-mono text-[11px] space-y-2">
                        <p className="text-nexus-text-dim uppercase tracking-tighter">ERROR: <span className="text-red-400">{connectionError?.message || "FB-LINK-ERR-07"}</span></p>
                        <p className="text-white/80 leading-relaxed italic border-l-2 border-blue-500 pl-3">
                          "Meta Graph API handshake rejected. Neural tether failed to establish secure tunnel to social node."
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-nexus-text-dim">Host Rejection Log</p>
                          <ul className="space-y-1.5">
                            {[
                              "Handshake timeout during token exchange.",
                              "App ID or App Secret mismatch in environment headers.",
                              "Facebook Business permissions not verified.",
                              "Redirect URL mismatch in Meta Developer Console."
                            ].map((cause, i) => (
                              <li key={i} className="flex items-center gap-2 text-[10px] text-white/60">
                                <Activity className="w-3 h-3 text-blue-500/50" />
                                {cause}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-nexus-accent">Quantum Recovery</p>
                          <div className="space-y-2">
                            <button 
                              onClick={() => handleConnect('facebook')}
                              className="w-full py-2 bg-nexus-accent text-black text-[10px] font-bold rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                            >
                              <Zap className="w-3 h-3" />
                              RE-ESTABLISH LINK
                            </button>
                            <a 
                              href="https://developers.facebook.com/apps/" 
                              target="_blank" 
                              rel="noreferrer"
                              className="w-full py-2 bg-white/5 border border-white/10 text-white text-[10px] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all font-mono"
                            >
                              <Monitor className="w-3 h-3" />
                              META DEV CONSOLE
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Instagram Neural Diagnostic Interface */}
          <AnimatePresence>
            {showInstagramDiagnostic && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass p-6 rounded-3xl border border-pink-500/20 bg-pink-500/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Instagram className="w-5 h-5 text-pink-500" />
                      <h4 className="text-sm font-bold uppercase tracking-widest text-pink-500">Instagram Protocol Failure</h4>
                    </div>
                    <button 
                      onClick={() => setShowInstagramDiagnostic(false)}
                      className="p-1 hover:bg-white/10 rounded-lg transition-all"
                    >
                      <X className="w-4 h-4 text-nexus-text-dim" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 font-mono text-[11px] space-y-2">
                      <p className="text-nexus-text-dim uppercase tracking-tighter">ERROR: <span className="text-red-400">{connectionError?.message || "IG-LINK-ERR-12"}</span></p>
                      <p className="text-white/80 leading-relaxed italic border-l-2 border-pink-500 pl-3">
                        "Instagram Basic Display API synchronization failed. Neural tether rejected by the visual sub-node."
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-nexus-text-dim">Visual Rejection Log</p>
                        <ul className="space-y-1.5">
                          {[
                            "User declined permission for media synthesis.",
                            "Invalid Client ID or Client Secret in environment vault.",
                            "Mismatched OAuth redirect URI in Instagram dashboard.",
                            "API legacy mode detected. Upgrade to Graph API requested."
                          ].map((cause, i) => (
                            <li key={i} className="flex items-center gap-2 text-[10px] text-white/60">
                              <Activity className="w-3 h-3 text-pink-500/50" />
                              {cause}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-nexus-accent">Quantum Recovery</p>
                        <div className="space-y-2">
                          <button 
                            onClick={() => handleConnect('instagram')}
                            className="w-full py-2 bg-nexus-accent text-black text-[10px] font-bold rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                          >
                            <Zap className="w-3 h-3" />
                            RE-ESTABLISH VISUAL LINK
                          </button>
                          <a 
                            href="https://www.instagram.com/developer/" 
                            target="_blank" 
                            rel="noreferrer"
                            className="w-full py-2 bg-white/5 border border-white/10 text-white text-[10px] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all font-mono"
                          >
                            <Monitor className="w-3 h-3" />
                            INSTAGRAM DEV CONSOLE
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="glass p-6 rounded-3xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-display font-semibold flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-nexus-accent" />
                      Content Queue
                    </h3>
                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                      {["All", "Scheduled", "Draft", "Live"].map((f) => (
                        <button
                          key={f}
                          onClick={() => setPostFilter(f as any)}
                          className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                            postFilter === f ? "bg-nexus-accent text-black" : "text-nexus-text-dim hover:text-white"
                          )}
                        >
                          {f.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <AnimatePresence initial={false}>
                      {posts
                        .filter(p => {
                          if (postFilter === "All") return true;
                          if (postFilter === "Live") return p.platformConfigs?.youtube?.isLive || p.platformConfigs?.linkedin?.isLive;
                          return p.status === postFilter;
                        })
                        .map((post) => (
                        <motion.div 
                          key={post.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex flex-col group"
                        >
                          <div 
                            onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                            className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between hover:border-nexus-accent/30 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-nexus-accent/10 flex items-center justify-center relative overflow-hidden">
                                {post.media && post.media.length > 0 ? (
                                  post.media[0].type === "image" ? (
                                    <img src={post.media[0].url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-nexus-accent/20">
                                      <Film className="w-5 h-5 text-nexus-accent" />
                                    </div>
                                  )
                                ) : post.platformConfigs?.youtube?.isLive || post.platformConfigs?.linkedin?.isLive ? (
                                  <div className="w-full h-full flex items-center justify-center bg-red-500/20">
                                    <Play className="w-5 h-5 text-red-500 fill-red-500" />
                                  </div>
                                ) : (
                                  <Zap className="w-6 h-6 text-nexus-accent" />
                                )}
                                {(post.platformConfigs?.youtube?.isLive || post.platformConfigs?.linkedin?.isLive) && (
                                  <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold">{post.title}</h4>
                                <p className="text-xs text-nexus-text-dim mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {post.time}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex -space-x-2">
                                {post.platformIds.map((pid, j) => {
                                  const platform = PLATFORMS.find(p => p.id === pid);
                                  const Icon = platform?.icon || Share2;
                                  return (
                                    <div key={j} className="w-6 h-6 rounded-full bg-nexus-bg border border-nexus-border flex items-center justify-center">
                                      <Icon className="w-3 h-3 text-nexus-text-dim" />
                                    </div>
                                  );
                                })}
                              </div>
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest",
                                (post.platformConfigs?.youtube?.isLive || post.platformConfigs?.linkedin?.isLive) ? "bg-red-500/10 text-red-500" :
                                post.status === "Ready" ? "bg-green-500/10 text-green-500" : 
                                post.status === "Draft" ? "bg-white/10 text-nexus-text-dim" :
                                "bg-nexus-accent/10 text-nexus-accent"
                              )}>
                                {(post.platformConfigs?.youtube?.isLive || post.platformConfigs?.linkedin?.isLive) ? "Live Stream" : post.status}
                              </span>
                              <ChevronDown className={cn("w-4 h-4 text-nexus-text-dim transition-transform", expandedPost === post.id && "rotate-180")} />
                            </div>
                          </div>

                          <AnimatePresence>
                            {expandedPost === post.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 mx-4 mb-2 -mt-2 bg-white/5 border-x border-b border-white/5 rounded-b-2xl space-y-4">
                                  {post.platformConfigs?.youtube?.isLive && (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2 text-red-500 mb-1">
                                        <Youtube className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Neural Broadcast Config (YouTube)</span>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                          <p className="text-[9px] text-nexus-text-dim uppercase tracking-tighter">Neural Stream Title</p>
                                          <p className="text-xs font-medium text-white">{post.platformConfigs.youtube.streamTitle || post.title}</p>
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-[9px] text-nexus-text-dim uppercase tracking-tighter">Visibility Status</p>
                                          <p className="text-xs font-medium text-white uppercase">{post.platformConfigs.youtube.visibility}</p>
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                          <p className="text-[9px] text-nexus-text-dim uppercase tracking-tighter">Broadcast Description</p>
                                          <p className="text-xs font-medium text-white leading-relaxed">{post.platformConfigs.youtube.description || "No description provided."}</p>
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                          <p className="text-[9px] text-nexus-text-dim uppercase tracking-tighter">Scheduled Start Time</p>
                                          <p className="text-xs font-medium text-nexus-accent">
                                            {(post.platformConfigs.youtube.streamDate && post.platformConfigs.youtube.streamTime) 
                                              ? `${post.platformConfigs.youtube.streamDate} @ ${post.platformConfigs.youtube.streamTime}`
                                              : post.time}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {post.platformConfigs?.linkedin?.isLive && (
                                    <div className="space-y-3 pt-4 border-t border-white/5">
                                      <div className="flex items-center gap-2 text-blue-500 mb-1">
                                        <Linkedin className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">LinkedIn Broadcast Config</span>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                          <p className="text-[9px] text-nexus-text-dim uppercase tracking-tighter">Stream Title</p>
                                          <p className="text-xs font-medium text-white">{post.platformConfigs.linkedin.streamTitle || post.title}</p>
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-[9px] text-nexus-text-dim uppercase tracking-tighter">Visibility Setting</p>
                                          <p className="text-xs font-medium text-white uppercase">{post.platformConfigs.linkedin.visibility}</p>
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                          <p className="text-[9px] text-nexus-text-dim uppercase tracking-tighter">Stream Description</p>
                                          <p className="text-xs font-medium text-white leading-relaxed">{post.platformConfigs.linkedin.description || "No description provided."}</p>
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                          <p className="text-[9px] text-nexus-text-dim uppercase tracking-tighter">Scheduled Start Time</p>
                                          <p className="text-xs font-medium text-nexus-accent">
                                            {(post.platformConfigs.linkedin.streamDate && post.platformConfigs.linkedin.streamTime) 
                                              ? `${post.platformConfigs.linkedin.streamDate} @ ${post.platformConfigs.linkedin.streamTime}`
                                              : post.time}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditModal(post);
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-white/5 text-[10px] font-bold hover:bg-white/10 transition-colors uppercase"
                                    >
                                      Edit Configuration
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        initiateLiveStream(post);
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-nexus-accent/10 text-nexus-accent text-[10px] font-bold hover:bg-nexus-accent hover:text-black transition-colors uppercase"
                                    >
                                      Instant Broadcast
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass p-6 rounded-3xl">
                  <h3 className="text-lg font-display font-semibold mb-6 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-nexus-accent" />
                    Engagement Pulse
                  </h3>
                  <div className="space-y-6">
                    {[
                      { label: "Total Interactions", value: "42.5K", trend: "+12%" },
                      { label: "Avg. Response Time", value: "1.2m", trend: "-15%" },
                      { label: "Sentiment Score", value: "98/100", trend: "+2%" },
                    ].map((stat, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-end mb-2">
                          <p className="text-xs text-nexus-text-dim uppercase tracking-widest">{stat.label}</p>
                          <span className="text-xs font-bold text-green-400">{stat.trend}</span>
                        </div>
                        <p className="text-2xl font-display font-bold">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass p-6 rounded-3xl">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-nexus-accent" />
                    AI Auto-Engagement
                  </h3>
                  <p className="text-xs text-nexus-text-dim mb-4 leading-relaxed">
                    The AI is currently monitoring 12 active threads and responding to common inquiries using your brand voice.
                  </p>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-nexus-accent/5 border border-nexus-accent/20">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Status</span>
                    <span className="text-[10px] font-bold text-nexus-accent">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeTab === "generator" ? (
          <motion.div
            key="generator"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="glass p-8 rounded-[40px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-nexus-accent/5 blur-[100px] rounded-full -mr-32 -mt-32" />
              <div className="relative z-10 max-w-2xl">
                <h3 className="text-2xl font-display font-bold mb-2 flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-nexus-accent animate-pulse" />
                  Neural Content Architect
                </h3>
                <p className="text-nexus-text-dim mb-8">Ignite your digital footprint with AI-engineered post strategies and captions.</p>
                
                <div className="space-y-6">
                  <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit border border-white/5">
                    <button 
                      onClick={() => setGeneratorMode("ideas")}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                        generatorMode === "ideas" ? "bg-nexus-accent text-black shadow-lg shadow-nexus-accent/20" : "text-nexus-text-dim hover:text-white"
                      )}
                    >
                      Idea Generation
                    </button>
                    <button 
                      onClick={() => setGeneratorMode("summarize")}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                        generatorMode === "summarize" ? "bg-nexus-accent text-black shadow-lg shadow-nexus-accent/20" : "text-nexus-text-dim hover:text-white"
                      )}
                    >
                      Content Summarizer
                    </button>
                  </div>

                  <div className="relative">
                    <textarea
                      value={generatorPrompt}
                      onChange={(e) => setGeneratorPrompt(e.target.value)}
                      placeholder={generatorMode === "ideas" ? "What is the objective? (e.g., Launching a futuristic AI trading bot...)" : "Paste long-form content to summarize (articles, blogs, etc.)..."}
                      className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm outline-none focus:border-nexus-accent/50 transition-all min-h-[160px] resize-none"
                    />
                    <button
                      onClick={generatorMode === "ideas" ? handleGenerateIdeas : summarizeContent}
                      disabled={isGeneratingIdeas || isSummarizing || !generatorPrompt}
                      className="absolute bottom-4 right-4 bg-nexus-accent text-black p-4 rounded-2xl hover:bg-white transition-all disabled:opacity-50 disabled:grayscale group shadow-xl shadow-nexus-accent/10"
                    >
                      {isGeneratingIdeas || isSummarizing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-widest hidden group-hover:inline transition-all">
                            {generatorMode === "ideas" ? "Generate Blueprints" : "Neural Summarize"}
                          </span>
                          <Zap className="w-5 h-5" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {generatedIdeas.map((idea, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass p-6 rounded-[32px] flex flex-col group hover:border-nexus-accent/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 rounded-lg bg-nexus-accent/10">
                        <Sparkles className="w-4 h-4 text-nexus-accent" />
                      </div>
                      <span className="text-[10px] font-bold text-nexus-text-dim uppercase tracking-tighter">Option {i + 1}</span>
                    </div>
                    
                    <h4 className="text-lg font-bold mb-3">{idea.idea}</h4>
                    <p className="text-xs text-nexus-text-dim leading-relaxed mb-4 flex-grow line-clamp-4">
                      {idea.caption}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-6">
                      {idea.hashtags.split(" ").map((tag, j) => (
                        <span key={j} className="text-[10px] text-nexus-accent font-mono">{tag}</span>
                      ))}
                    </div>

                    <button 
                      onClick={() => useIdea(idea)}
                      className="w-full p-4 rounded-2xl bg-white/5 text-white font-bold text-xs hover:bg-nexus-accent hover:text-black transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      DEPLOY DRAFT
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {generatedIdeas.length === 0 && !isGeneratingIdeas && (
              <div className="py-20 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-nexus-text-dim text-sm max-w-xs italic">Awaiting neural input. Describe your goal to generate content blueprints.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Analytics Filters */}
            <div className="flex flex-wrap gap-4 items-center justify-between glass p-4 rounded-2xl">
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedPlatform("all")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                    selectedPlatform === "all" ? "bg-nexus-accent/10 border-nexus-accent text-nexus-accent" : "bg-white/5 border-white/5 text-nexus-text-dim hover:border-white/20"
                  )}
                >
                  ALL PLATFORMS
                </button>
                {PLATFORMS.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setSelectedPlatform(p.id)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2",
                      selectedPlatform === p.id ? "bg-nexus-accent/10 border-nexus-accent text-nexus-accent" : "bg-white/5 border-white/5 text-nexus-text-dim hover:border-white/20"
                    )}
                  >
                    <p.icon className="w-3 h-3" />
                    {p.name.toUpperCase()}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2">
                {["7d", "30d", "90d"].map(range => (
                  <button 
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                      dateRange === range ? "bg-nexus-accent/10 border-nexus-accent text-nexus-accent" : "bg-white/5 border-white/5 text-nexus-text-dim hover:border-white/20"
                    )}
                  >
                    LAST {range.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Total Reach", value: "1.2M", trend: "+18.4%", icon: Eye, color: "text-blue-400" },
                { label: "Engagement Rate", value: "4.8%", trend: "+2.1%", icon: Zap, color: "text-nexus-accent" },
                { label: "Follower Growth", value: "+12.4K", trend: "+5.2%", icon: Users, color: "text-purple-400" },
              ].map((metric, i) => (
                <div key={i} className="glass p-6 rounded-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <metric.icon className="w-24 h-24" />
                  </div>
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn("p-3 rounded-2xl bg-white/5", metric.color)}>
                      <metric.icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">
                      {metric.trend}
                    </span>
                  </div>
                  <p className="text-xs text-nexus-text-dim uppercase tracking-widest mb-1">{metric.label}</p>
                  <h4 className="text-3xl font-display font-bold">{metric.value}</h4>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass p-8 rounded-3xl">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-display font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-nexus-accent" />
                    Growth Trajectory
                  </h3>
                  <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-nexus-text-dim">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-nexus-accent" />
                      Reach
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      Engagement
                    </div>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ANALYTICS_DATA}>
                      <defs>
                        <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorEngage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#ffffff30" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#ffffff30" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value / 1000}k`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0a0a0c", border: "1px solid #ffffff10", borderRadius: "12px" }}
                        itemStyle={{ fontSize: "12px" }}
                      />
                      <Area type="monotone" dataKey="reach" stroke="#00f2ff" fillOpacity={1} fill="url(#colorReach)" strokeWidth={3} />
                      <Area type="monotone" dataKey="engagement" stroke="#a855f7" fillOpacity={1} fill="url(#colorEngage)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass p-8 rounded-3xl">
                <h3 className="text-lg font-display font-semibold mb-8 flex items-center gap-2">
                  <Users className="w-5 h-5 text-nexus-accent" />
                  Follower Acquisition
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ANALYTICS_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#ffffff30" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#ffffff30" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        cursor={{ fill: "#ffffff05" }}
                        contentStyle={{ backgroundColor: "#0a0a0c", border: "1px solid #ffffff10", borderRadius: "12px" }}
                        itemStyle={{ fontSize: "12px" }}
                      />
                      <Bar dataKey="growth" radius={[4, 4, 0, 0]}>
                        {ANALYTICS_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === ANALYTICS_DATA.length - 1 ? "#00f2ff" : "#ffffff10"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Live Stream Intelligence Section */}
            {(selectedPlatform === "all" || selectedPlatform === "youtube" || selectedPlatform === "linkedin") && (
              <div className="space-y-8 pt-8 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                    <Play className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold">Neural Live Intelligence</h3>
                    <p className="text-xs text-nexus-text-dim uppercase tracking-widest">Real-Time Ingestion Performance</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: "Concurrent Viewers", value: "1.8K", trend: "+12.4%", icon: Users, color: "text-red-400" },
                    { label: "Peak Viewers", value: "2.4K", trend: "Peak Reached", icon: TrendingUp, color: "text-nexus-accent" },
                    { label: "Total Views", value: "45.2K", trend: "+5.2%", icon: Eye, color: "text-blue-400" },
                    { label: "Audience Retention", value: "72%", trend: "Stable", icon: Activity, color: "text-purple-400" },
                  ].map((metric, i) => (
                    <div key={i} className="glass p-5 rounded-2xl relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-3">
                        <div className={cn("p-2 rounded-xl bg-white/5", metric.color)}>
                          <metric.icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-nexus-accent bg-nexus-accent/10 px-2 py-1 rounded-lg">
                          {metric.trend}
                        </span>
                      </div>
                      <p className="text-[10px] text-nexus-text-dim uppercase tracking-widest mb-1">{metric.label}</p>
                      <h4 className="text-2xl font-display font-bold">{metric.value}</h4>
                    </div>
                  ))}
                </div>

                <div className="glass p-8 rounded-3xl">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-display font-semibold flex items-center gap-2">
                      <Activity className="w-5 h-5 text-red-500" />
                      Live Pulse: Viewership vs Retention
                    </h3>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={LIVE_ANALYTICS_DATA}>
                        <defs>
                          <linearGradient id="colorViewers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis 
                          dataKey="time" 
                          stroke="#ffffff30" 
                          fontSize={10} 
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#ffffff30" 
                          fontSize={10} 
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#0a0a0c", border: "1px solid #ffffff10", borderRadius: "12px" }}
                          itemStyle={{ fontSize: "12px" }}
                        />
                        <Area type="monotone" dataKey="viewers" stroke="#ef4444" fillOpacity={1} fill="url(#colorViewers)" strokeWidth={3} />
                        <Area type="monotone" dataKey="retention" stroke="#a855f7" fillOpacity={1} fill="url(#colorRetention)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl glass rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-nexus-border flex justify-between items-center bg-gradient-to-r from-nexus-accent/5 to-transparent shrink-0">
                <h3 className="text-xl font-display font-bold flex items-center gap-2">
                  {editingPostId ? <Settings2 className="w-5 h-5 text-nexus-accent" /> : <Plus className="w-5 h-5 text-nexus-accent" />}
                  {editingPostId ? "Modify Neural Post" : "Schedule Neural Post"}
                </h3>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingPostId(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-mono text-nexus-text-dim uppercase tracking-widest block">Post Content / Title</label>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleSave("Draft")}
                        disabled={!newPostTitle || selectedPlatforms.length === 0}
                        className="flex items-center gap-2 text-[10px] font-bold text-nexus-text-dim hover:text-white transition-colors disabled:opacity-50"
                      >
                        <Save className="w-3 h-3" />
                        SAVE DRAFT
                      </button>
                      <button 
                        onClick={() => setShowSummaryInput(!showSummaryInput)}
                        className="flex items-center gap-2 text-[10px] font-bold text-nexus-text-dim hover:text-white transition-colors"
                      >
                        <Activity className="w-3 h-3" />
                        SUMMARIZE LONG CONTENT
                      </button>
                      <button 
                        onClick={generateAICaption}
                        disabled={isGeneratingCaption || (!newPostTitle && attachedMedia.length === 0)}
                        className="flex items-center gap-2 text-[10px] font-bold text-nexus-accent hover:text-white transition-colors disabled:opacity-50"
                      >
                        {isGeneratingCaption ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        AI GENERATE CAPTION
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showSummaryInput && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-4 space-y-3 overflow-hidden"
                      >
                        <textarea 
                          value={longContentText}
                          onChange={(e) => setLongContentText(e.target.value)}
                          placeholder="Paste the long article or post content here to be distilled by Nexus AI..."
                          className="w-full h-32 bg-nexus-accent/5 border border-nexus-accent/20 rounded-2xl p-4 text-xs outline-none focus:border-nexus-accent/50 transition-colors resize-none"
                        />
                        <div className="flex justify-between items-center bg-nexus-accent/5 p-3 rounded-xl border border-nexus-accent/10">
                          <p className="text-[10px] text-nexus-text-dim font-mono italic">
                            Nexus AI will generate platform-balanced summaries for Twitter and LinkedIn.
                          </p>
                          <button 
                            onClick={summarizeContent}
                            disabled={isSummarizing || !longContentText}
                            className="px-4 py-1.5 bg-nexus-accent text-black text-[10px] font-bold rounded-lg hover:bg-white transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                            START DISTILLATION
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <textarea 
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="What's the message for the digital universe?"
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-nexus-accent/50 transition-colors resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-mono text-nexus-text-dim uppercase tracking-widest block">Media Assets</label>
                    <span className="text-[10px] font-mono text-nexus-text-dim">
                      {attachedMedia.length} / 4 ASSETS
                    </span>
                  </div>
                  
                  <div 
                    className={cn(
                      "relative min-h-[160px] rounded-3xl border-2 border-dashed transition-all duration-300 group/dropzone overflow-hidden",
                      isDragging 
                        ? "border-nexus-accent bg-nexus-accent/10 scale-[0.99] shadow-[0_0_30px_rgba(5,255,161,0.1)]" 
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {/* Background Pattern when dragging */}
                    {isDragging && (
                      <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--nexus-accent)_1px,transparent_1px)] bg-[size:20px_20px]" />
                      </div>
                    )}

                    <div className="p-4 h-full">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 h-full">
                        <AnimatePresence mode="popLayout">
                          {attachedMedia.map((media, i) => (
                            <motion.div 
                              key={media.url}
                              layout
                              initial={{ opacity: 0, scale: 0.8, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8, y: 10 }}
                              className="aspect-square rounded-2xl glass relative group/item overflow-hidden border border-white/10"
                            >
                              {media.type === "image" ? (
                                <img src={media.url} className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full relative">
                                  <video 
                                    src={media.url} 
                                    className="w-full h-full object-cover" 
                                    muted 
                                    loop
                                    onMouseEnter={(e) => e.currentTarget.play()}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.pause();
                                      e.currentTarget.currentTime = 0;
                                    }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none group-hover/item:bg-black/40 transition-colors">
                                    <div className="p-3 rounded-full bg-nexus-accent/20 backdrop-blur-md border border-nexus-accent/30 group-hover/item:scale-110 transition-transform">
                                      <Film className="w-6 h-6 text-nexus-accent shadow-[0_0_15px_rgba(5,255,161,0.5)]" />
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none" />
                              
                              <button 
                                onClick={() => removeMedia(i)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-lg shadow-xl opacity-0 group-hover/item:opacity-100 transition-all hover:scale-110 active:scale-95 z-20 backdrop-blur-sm"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              
                              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-mono text-white opacity-0 group-hover/item:opacity-100 transition-opacity">
                                {media.type.toUpperCase()}
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {attachedMedia.length < 4 && (
                          <motion.button 
                            layout
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                              "aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden",
                              isDragging 
                                ? "border-nexus-accent bg-nexus-accent/5 text-nexus-accent animate-pulse" 
                                : "border-white/10 bg-white/5 hover:border-nexus-accent/50 hover:bg-nexus-accent/5 text-nexus-text-dim hover:text-nexus-accent"
                            )}
                          >
                            <div className={cn(
                              "p-3 rounded-2xl bg-white/5 transition-all group-hover/dropzone:scale-110",
                              isDragging && "bg-nexus-accent/20 scale-125"
                            )}>
                              {isDragging ? (
                                <Zap className="w-6 h-6 text-nexus-accent animate-pulse" />
                              ) : (
                                <UploadCloud className="w-6 h-6" />
                              )}
                            </div>
                            <div className="text-center">
                              <span className="text-[10px] font-bold uppercase tracking-widest block">
                                {isDragging ? "RELEASE TO SYNC" : "ATTACH ASSETS"}
                              </span>
                              {attachedMedia.length === 0 && !isDragging && (
                                <span className="text-[8px] opacity-40 uppercase tracking-tighter mt-1 block">
                                  Drag & Drop supported
                                </span>
                              )}
                            </div>
                          </motion.button>
                        )}
                      </div>
                    </div>

                    {attachedMedia.length === 0 && !isDragging && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <div className="flex flex-col items-center gap-4">
                          <div className="flex gap-4">
                            <ImageIcon className="w-8 h-8" />
                            <Film className="w-8 h-8" />
                          </div>
                          <p className="text-[10px] font-mono tracking-[0.2em] uppercase">Neural Media Hub</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-[9px] text-nexus-text-dim uppercase font-mono tracking-tighter">Images (JPG, PNG, WEBP)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-[9px] text-nexus-text-dim uppercase font-mono tracking-tighter">Videos (MP4, WEBM)</span>
                    </div>
                  </div>

                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-nexus-text-dim uppercase tracking-widest mb-3 block">Select Platforms</label>
                  <div className="grid grid-cols-2 gap-3">
                    {PLATFORMS.map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => togglePlatform(platform.id)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all group",
                          selectedPlatforms.includes(platform.id)
                            ? "bg-nexus-accent/10 border-nexus-accent text-nexus-accent shadow-[0_0_15px_rgba(5,255,161,0.1)]"
                            : "bg-white/5 border-white/5 text-nexus-text-dim hover:border-white/20"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                          selectedPlatforms.includes(platform.id) ? "bg-nexus-accent/20" : "bg-white/5 group-hover:bg-white/10"
                        )}>
                          <platform.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", platform.color)} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-tight">{platform.name}</span>
                        {selectedPlatforms.includes(platform.id) && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-nexus-text-dim uppercase tracking-widest mb-3 block">Date</label>
                    <input 
                      type="date" 
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-nexus-accent/50 transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-nexus-text-dim uppercase tracking-widest mb-3 block">Time</label>
                    <input 
                      type="time" 
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-nexus-accent/50 transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>

                {selectedPlatforms.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-mono text-nexus-text-dim uppercase tracking-widest block">Neural Platform Configs</label>
                      <button 
                        onClick={() => setShowPresetSave(!showPresetSave)}
                        className="text-[10px] font-bold text-nexus-accent hover:text-white transition-colors flex items-center gap-1"
                      >
                        <Bookmark className="w-3 h-3" />
                        PRESETS
                      </button>
                    </div>

                    {showPresetSave && (
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            placeholder="Preset Name (e.g., Live Standard)"
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-nexus-accent/50"
                          />
                          <button 
                            onClick={savePreset}
                            disabled={!newPresetName.trim()}
                            className="px-3 py-1.5 bg-nexus-accent text-black rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-white transition-colors flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            SAVE
                          </button>
                        </div>

                        {presets.length > 0 && (
                          <div className="pt-2 border-t border-white/10">
                            <span className="text-[10px] text-nexus-text-dim uppercase block mb-2">Saved Neural Presets</span>
                            <div className="flex flex-wrap gap-2">
                              {presets.map(preset => (
                                <div key={preset.name} className="group relative">
                                  <button 
                                    onClick={() => loadPreset(preset.configs, preset.platforms || [])}
                                    className="pl-3 pr-4 py-1.5 rounded-xl bg-white/10 hover:bg-nexus-accent hover:text-black transition-all text-[10px] font-bold flex items-center gap-2 border border-white/5 hover:border-nexus-accent"
                                  >
                                    <div className="flex -space-x-1">
                                      {(preset.platforms || []).map(pid => {
                                        const P = PLATFORMS.find(p => p.id === pid);
                                        return P ? <P.icon key={pid} className="w-2.5 h-2.5" /> : null;
                                      })}
                                    </div>
                                    {preset.name}
                                  </button>
                                  <button 
                                    onClick={() => deletePreset(preset.name)}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-3">
                      {selectedPlatforms.includes("twitter") && (
                        <div className="p-4 rounded-2xl bg-blue-400/5 border border-blue-400/10 space-y-3 relative overflow-hidden group">
                          <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <Twitter className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Twitter / X Protocol</span>
                          </div>

                          <PlatformPresetManager platform="twitter" color="blue-400" />

                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-[10px] text-nexus-text-dim uppercase font-mono">Protocol Mode</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setPlatformConfigs(prev => ({ ...prev, twitter: { ...prev.twitter, thread: false } }))}
                                className={cn(
                                  "px-2 py-1 rounded text-[10px] border transition-all",
                                  !platformConfigs.twitter.thread ? "bg-blue-400/20 border-blue-400 text-blue-400" : "bg-white/5 border-white/5 text-nexus-text-dim"
                                )}
                              >
                                SINGLE TWEET
                              </button>
                              <button
                                onClick={() => setPlatformConfigs(prev => ({ ...prev, twitter: { ...prev.twitter, thread: true } }))}
                                className={cn(
                                  "px-2 py-1 rounded text-[10px] border transition-all",
                                  platformConfigs.twitter.thread ? "bg-blue-400/20 border-blue-400 text-blue-400" : "bg-white/5 border-white/5 text-nexus-text-dim"
                                )}
                              >
                                NEURAL THREAD
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-nexus-text-dim uppercase font-mono">Character Limit</span>
                            <select 
                              value={platformConfigs.twitter.charLimit}
                              onChange={(e) => setPlatformConfigs(prev => ({ ...prev, twitter: { ...prev.twitter, charLimit: parseInt(e.target.value) } }))}
                              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] outline-none hover:border-blue-400/30 transition-all"
                            >
                              <option value="280">280 (Standard)</option>
                              <option value="4000">4000 (Premium)</option>
                            </select>
                          </div>

                          <CallbackSystemControl platform="twitter" />
                        </div>
                      )}

                      {selectedPlatforms.includes("instagram") && (
                        <div className="p-4 rounded-2xl bg-pink-500/5 border border-pink-500/10 space-y-3 relative overflow-hidden group">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-pink-500">
                              <Instagram className="w-4 h-4" />
                              <span className="text-xs font-bold uppercase tracking-wider">Instagram Protocol</span>
                            </div>
                            {connectedPlatforms.includes("instagram") && (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-pink-500/10 text-pink-500 border border-pink-500/20">
                                <Shield className="w-2.5 h-2.5" />
                                <span className="text-[8px] font-bold uppercase tracking-tighter">Secure Link</span>
                              </div>
                            )}
                          </div>

                          <PlatformPresetManager platform="instagram" color="pink-500" />

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-nexus-text-dim uppercase font-mono">Image Ratio</span>
                            <div className="flex gap-2">
                              {["1:1", "4:5", "16:9"].map(ratio => (
                                <button
                                  key={ratio}
                                  onClick={() => setPlatformConfigs(prev => ({ ...prev, instagram: { ...prev.instagram, ratio } }))}
                                  className={cn(
                                    "px-2 py-1 rounded text-[10px] border transition-all",
                                    platformConfigs.instagram.ratio === ratio 
                                      ? "bg-pink-500/20 border-pink-500 text-pink-500" 
                                      : "bg-white/5 border-white/5 text-nexus-text-dim"
                                  )}
                                >
                                  {ratio}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-nexus-text-dim uppercase font-mono">Auto-Crop Neural Assets</span>
                            <button
                              onClick={() => setPlatformConfigs(prev => ({ ...prev, instagram: { ...prev.instagram, autoCrop: !prev.instagram.autoCrop } }))}
                              className={cn(
                                "px-2 py-1 rounded text-[10px] border transition-all",
                                platformConfigs.instagram.autoCrop 
                                  ? "bg-pink-500/20 border-pink-500 text-pink-500" 
                                  : "bg-white/5 border-white/5 text-nexus-text-dim"
                              )}
                            >
                              {platformConfigs.instagram.autoCrop ? "ENABLED" : "DISABLED"}
                            </button>
                          </div>

                          <CallbackSystemControl platform="instagram" />
                        </div>
                      )}

                      {selectedPlatforms.includes("youtube") && (
                        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-red-500">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                platformConfigs.youtube.isLive ? "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-red-500/20"
                              )} />
                              <Youtube className="w-4 h-4" />
                              <span className="text-xs font-bold uppercase tracking-wider">YouTube Settings</span>
                            </div>
                            <button 
                              onClick={() => setPlatformConfigs(prev => ({ ...prev, youtube: { ...prev.youtube, isLive: !prev.youtube.isLive } }))}
                              className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-2",
                                platformConfigs.youtube.isLive ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20" : "bg-white/5 border-white/5 text-nexus-text-dim hover:border-red-500/30"
                              )}
                            >
                              <Play className="w-3 h-3" />
                              LIVE STREAM
                            </button>
                          </div>
                          
                          {platformConfigs.youtube.isLive && (
                            <div className="space-y-4 p-4 bg-black/20 rounded-xl border border-white/5 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4">
                                <button 
                                  onClick={() => syncStreamFields("youtube")}
                                  className="text-[9px] font-bold text-red-400 hover:text-white transition-colors flex items-center gap-1"
                                  title="Sync from Post Title"
                                >
                                  <Zap className="w-3 h-3" />
                                  SYNC
                                </button>
                              </div>

                              <PlatformPresetManager platform="youtube" color="red-500" />

                              <div className="flex items-center gap-2 pb-2 border-b border-white/5 mb-2">
                                <Settings2 className="w-3 h-3 text-red-400" />
                                <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Advanced Stream Settings</span>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <label className="text-[9px] text-nexus-text-dim uppercase mb-1.5 flex items-center gap-1.5 font-mono">
                                    <Type className="w-2.5 h-2.5" />
                                    Stream Title
                                  </label>
                                  <input 
                                    type="text"
                                    value={platformConfigs.youtube.streamTitle}
                                    onChange={(e) => setPlatformConfigs(prev => ({ ...prev, youtube: { ...prev.youtube, streamTitle: e.target.value } }))}
                                    placeholder="Enter the broadcast title..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs outline-none focus:border-red-500/30 transition-all"
                                  />
                                </div>
                                
                                <div>
                                  <label className="text-[9px] text-nexus-text-dim uppercase mb-1.5 flex items-center gap-1.5 font-mono">
                                    <AlignLeft className="w-2.5 h-2.5" />
                                    Stream Description
                                  </label>
                                  <textarea 
                                    value={platformConfigs.youtube.description}
                                    onChange={(e) => setPlatformConfigs(prev => ({ ...prev, youtube: { ...prev.youtube, description: e.target.value } }))}
                                    placeholder="Enter the stream description..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs outline-none h-20 resize-none focus:border-red-500/30 transition-all"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[9px] text-nexus-text-dim uppercase mb-1.5 flex items-center gap-1.5 font-mono">
                                      <Calendar className="w-2.5 h-2.5" />
                                      Start Date
                                    </label>
                                    <input 
                                      type="date"
                                      value={platformConfigs.youtube.streamDate}
                                      onChange={(e) => setPlatformConfigs(prev => ({ ...prev, youtube: { ...prev.youtube, streamDate: e.target.value } }))}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs outline-none focus:border-red-500/30 [color-scheme:dark]"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-nexus-text-dim uppercase mb-1.5 flex items-center gap-1.5 font-mono">
                                      <Clock className="w-2.5 h-2.5" />
                                      Start Time
                                    </label>
                                    <input 
                                      type="time"
                                      value={platformConfigs.youtube.streamTime}
                                      onChange={(e) => setPlatformConfigs(prev => ({ ...prev, youtube: { ...prev.youtube, streamTime: e.target.value } }))}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs outline-none focus:border-red-500/30 [color-scheme:dark]"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                  <div className="space-y-1.5">
                                    <label className="text-[9px] text-nexus-text-dim uppercase flex items-center gap-1.5 font-mono">
                                      <Eye className="w-2.5 h-2.5" />
                                      Visibility
                                    </label>
                                    <select 
                                      value={platformConfigs.youtube.visibility}
                                      onChange={(e) => setPlatformConfigs(prev => ({ ...prev, youtube: { ...prev.youtube, visibility: e.target.value } }))}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-[10px] outline-none hover:border-red-500/30 transition-all cursor-pointer"
                                    >
                                      <option value="public">🌍 Public</option>
                                      <option value="unlisted">🔗 Unlisted</option>
                                      <option value="private">🔒 Private</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[9px] text-nexus-text-dim uppercase flex items-center gap-1.5 font-mono">
                                      <Monitor className="w-2.5 h-2.5" />
                                      Category
                                    </label>
                                    <select 
                                      value={platformConfigs.youtube.category}
                                      onChange={(e) => setPlatformConfigs(prev => ({ ...prev, youtube: { ...prev.youtube, category: e.target.value } }))}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-[10px] outline-none hover:border-red-500/30 transition-all cursor-pointer"
                                    >
                                      <option value="Entertainment">🎬 Entertainment</option>
                                      <option value="Education">🎓 Education</option>
                                      <option value="Tech">💻 Tech</option>
                                      <option value="Gaming">🎮 Gaming</option>
                                    </select>
                                  </div>
                                </div>
                              </div>

                              <CallbackSystemControl platform="youtube" />
                            </div>
                          )}

                          {!platformConfigs.youtube.isLive && (
                            <div className="space-y-4">
                              <PlatformPresetManager platform="youtube" color="red-500" />
                              
                              <div className="space-y-1.5 pt-2 border-t border-white/5">
                                <label className="text-[10px] text-nexus-text-dim uppercase font-mono">Video Description</label>
                                <textarea 
                                  value={platformConfigs.youtube.description}
                                  onChange={(e) => setPlatformConfigs(prev => ({ ...prev, youtube: { ...prev.youtube, description: e.target.value } }))}
                                  placeholder="Neural video metadata..."
                                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[10px] outline-none h-16 resize-none focus:border-red-500/30 transition-all"
                                />
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[10px] text-nexus-text-dim uppercase font-mono">Visibility Settings</span>
                                <select 
                                  value={platformConfigs.youtube.visibility}
                                  onChange={(e) => setPlatformConfigs(prev => ({ ...prev, youtube: { ...prev.youtube, visibility: e.target.value } }))}
                                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] outline-none hover:border-red-500/30 transition-all"
                                >
                                  <option value="public">🌍 Public (Broadcast)</option>
                                  <option value="unlisted">🔗 Unlisted</option>
                                  <option value="private">🔒 Private</option>
                                </select>
                              </div>

                              <CallbackSystemControl platform="youtube" />
                            </div>
                          )}
                        </div>
                      )}

                      {selectedPlatforms.includes("linkedin") && (
                        <div className="p-4 rounded-2xl bg-blue-600/5 border border-blue-600/10 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-blue-600">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                platformConfigs.linkedin.isLive ? "bg-blue-600 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.8)]" : "bg-blue-600/20"
                              )} />
                              <Linkedin className="w-4 h-4" />
                              <span className="text-xs font-bold uppercase tracking-wider">LinkedIn Settings</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {connectedPlatforms.includes("linkedin") && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20">
                                  <Shield className="w-2.5 h-2.5" />
                                  <span className="text-[8px] font-bold uppercase tracking-tighter">Secure Link</span>
                                </div>
                              )}
                              <button 
                                onClick={() => setPlatformConfigs(prev => ({ ...prev, linkedin: { ...prev.linkedin, isLive: !prev.linkedin.isLive } }))}
                                className={cn(
                                  "px-3 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-2",
                                  platformConfigs.linkedin.isLive ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20" : "bg-white/5 border-white/5 text-nexus-text-dim hover:border-blue-600/30"
                                )}
                              >
                                <Play className="w-3 h-3" />
                                LIVE STREAM
                              </button>
                            </div>
                          </div>
                          
                          {platformConfigs.linkedin.isLive && (
                            <div className="space-y-4 p-4 bg-black/20 rounded-xl border border-white/5 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4">
                                <button 
                                  onClick={() => syncStreamFields("linkedin")}
                                  className="text-[9px] font-bold text-blue-400 hover:text-white transition-colors flex items-center gap-1"
                                  title="Sync from Post Title"
                                >
                                  <Zap className="w-3 h-3" />
                                  SYNC
                                </button>
                              </div>

                              <PlatformPresetManager platform="linkedin" color="blue-600" />

                              <div className="flex items-center gap-2 pb-2 border-b border-white/5 mb-2">
                                <Settings2 className="w-3 h-3 text-blue-400" />
                                <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Advanced Event Settings</span>
                              </div>
                              
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[9px] text-nexus-text-dim uppercase mb-1.5 flex items-center gap-1.5 font-mono">
                                    <Type className="w-2.5 h-2.5" />
                                    Event Title
                                  </label>
                                  <input 
                                    type="text"
                                    value={platformConfigs.linkedin.streamTitle}
                                    onChange={(e) => setPlatformConfigs(prev => ({ ...prev, linkedin: { ...prev.linkedin, streamTitle: e.target.value } }))}
                                    placeholder="Enter official event title..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs outline-none focus:border-blue-600/30 transition-all"
                                  />
                                </div>
                                
                                <div>
                                  <label className="text-[9px] text-nexus-text-dim uppercase mb-1.5 flex items-center gap-1.5 font-mono">
                                    <AlignLeft className="w-2.5 h-2.5" />
                                    Event Description
                                  </label>
                                  <textarea 
                                    value={platformConfigs.linkedin.description}
                                    onChange={(e) => setPlatformConfigs(prev => ({ ...prev, linkedin: { ...prev.linkedin, description: e.target.value } }))}
                                    placeholder="Professional event details..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs outline-none h-20 resize-none focus:border-blue-600/30 transition-all"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[9px] text-nexus-text-dim uppercase mb-1.5 flex items-center gap-1.5 font-mono">
                                      <Calendar className="w-2.5 h-2.5" />
                                      Start Date
                                    </label>
                                    <input 
                                      type="date"
                                      value={platformConfigs.linkedin.streamDate}
                                      onChange={(e) => setPlatformConfigs(prev => ({ ...prev, linkedin: { ...prev.linkedin, streamDate: e.target.value } }))}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs outline-none focus:border-blue-600/30 [color-scheme:dark]"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-nexus-text-dim uppercase mb-1.5 flex items-center gap-1.5 font-mono">
                                      <Clock className="w-2.5 h-2.5" />
                                      Start Time
                                    </label>
                                    <input 
                                      type="time"
                                      value={platformConfigs.linkedin.streamTime}
                                      onChange={(e) => setPlatformConfigs(prev => ({ ...prev, linkedin: { ...prev.linkedin, streamTime: e.target.value } }))}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs outline-none focus:border-blue-600/30 [color-scheme:dark]"
                                    />
                                  </div>
                                </div>

                                <div className="pt-1">
                                  <label className="text-[9px] text-nexus-text-dim uppercase mb-1.5 flex items-center gap-1.5 font-mono">
                                    <Eye className="w-2.5 h-2.5" />
                                    Visibility Setting
                                  </label>
                                  <select 
                                    value={platformConfigs.linkedin.visibility}
                                    onChange={(e) => setPlatformConfigs(prev => ({ ...prev, linkedin: { ...prev.linkedin, visibility: e.target.value } }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-[10px] outline-none hover:border-blue-600/30 transition-all cursor-pointer"
                                  >
                                    <option value="Public">🌍 Public</option>
                                    <option value="Connections Only">👥 Connections Only</option>
                                    <option value="Private">🔒 Private</option>
                                  </select>
                                </div>
                              </div>

                              <CallbackSystemControl platform="linkedin" />
                            </div>
                          )}

                          {!platformConfigs.linkedin.isLive && (
                            <div className="space-y-3">
                               <PlatformPresetManager platform="linkedin" color="blue-600" />
                               
                               <div className="space-y-1.5 pt-2 border-t border-white/5">
                                 <label className="text-[10px] text-nexus-text-dim uppercase font-mono">Post Description</label>
                                 <textarea 
                                   value={platformConfigs.linkedin.description}
                                   onChange={(e) => setPlatformConfigs(prev => ({ ...prev, linkedin: { ...prev.linkedin, description: e.target.value } }))}
                                   placeholder="Professional context..."
                                   className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[10px] outline-none h-16 resize-none focus:border-blue-600/30 transition-all"
                                 />
                               </div>

                               <div className="flex items-center justify-between pt-1">
                                 <span className="text-[10px] text-nexus-text-dim uppercase font-mono">Visibility Level</span>
                                 <select 
                                   value={platformConfigs.linkedin.visibility}
                                   onChange={(e) => setPlatformConfigs(prev => ({ ...prev, linkedin: { ...prev.linkedin, visibility: e.target.value } }))}
                                   className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] outline-none hover:border-blue-600/30 transition-all"
                                 >
                                   <option value="Public">🌍 Public</option>
                                   <option value="Connections Only">👥 Connections Only</option>
                                 </select>
                               </div>

                               <CallbackSystemControl platform="linkedin" />
                            </div>
                          )}
                        </div>
                      )}

                      {selectedPlatforms.includes("facebook") && (
                        <div className="p-4 rounded-2xl bg-blue-600/5 border border-blue-600/10 space-y-3 relative overflow-hidden group">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-blue-600">
                              <Facebook className="w-4 h-4" />
                              <span className="text-xs font-bold uppercase tracking-wider">Facebook Protocol</span>
                            </div>
                            {connectedPlatforms.includes("facebook") && (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                <Shield className="w-2.5 h-2.5" />
                                <span className="text-[8px] font-bold uppercase tracking-tighter">Secure Link</span>
                              </div>
                            )}
                          </div>

                          <PlatformPresetManager platform="facebook" color="blue-600" />

                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-[10px] text-nexus-text-dim uppercase">Audience Scope</span>
                            <select 
                              value={platformConfigs.facebook.audience}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPlatformConfigs(prev => ({
                                  ...prev,
                                  facebook: { ...prev.facebook, audience: val }
                                }));
                              }}
                              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] outline-none"
                            >
                              <option value="Public">Public</option>
                              <option value="Friends">Friends</option>
                              <option value="Private">Only Me</option>
                            </select>
                          </div>

                          <CallbackSystemControl platform="facebook" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-nexus-accent/5 border border-nexus-accent/20">
                  <AlertCircle className="w-5 h-5 text-nexus-accent shrink-0" />
                  <p className="text-[10px] text-nexus-text-dim leading-relaxed">
                    NEXUS ONE will automatically optimize the post timing based on audience activity if "Neural Optimization" is enabled in settings.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-white/5 border-t border-nexus-border flex justify-end gap-4 shrink-0">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 text-sm font-bold text-nexus-text-dim hover:text-white transition-colors"
                >
                  CANCEL
                </button>
                {(selectedPlatforms.includes("youtube") && platformConfigs.youtube.isLive) || (selectedPlatforms.includes("linkedin") && platformConfigs.linkedin.isLive) ? (
                  <button 
                    onClick={() => initiateLiveStream()}
                    disabled={isInitiatingLive || !newPostTitle || (selectedPlatforms.includes("youtube") && platformConfigs.youtube.isLive && !connectedPlatforms.includes("google") && !tokens.google?.accessToken) || (selectedPlatforms.includes("linkedin") && platformConfigs.linkedin.isLive && !connectedPlatforms.includes("linkedin") && !tokens.linkedin?.accessToken)}
                    className="px-8 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-white hover:text-black transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isInitiatingLive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    INITIATE NEURAL STREAM
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => handleSave("Draft")}
                      disabled={!newPostTitle || selectedPlatforms.length === 0}
                      className="px-6 py-2 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all disabled:opacity-50"
                    >
                      SAVE DRAFT
                    </button>
                    <button 
                      onClick={() => handleSave("Scheduled")}
                      disabled={!newPostTitle || selectedPlatforms.length === 0 || !scheduleDate || !scheduleTime}
                      className="px-8 py-2 bg-nexus-accent text-black font-bold rounded-xl hover:bg-white transition-all disabled:opacity-50"
                    >
                      SCHEDULE POST
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
