import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap,
  X,
  Loader2,
  Sparkles,
  DollarSign,
  Share2,
  Layout,
  Save,
  Trash2,
  Bookmark
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { GoogleGenAI, Type } from "@google/genai";
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

const data = [
  { name: "Cycle 1", reach: 4000, conversion: 2400 },
  { name: "Cycle 2", reach: 3000, conversion: 1398 },
  { name: "Cycle 3", reach: 2000, conversion: 9800 },
  { name: "Cycle 4", reach: 2780, conversion: 3908 },
  { name: "Cycle 5", reach: 1890, conversion: 4800 },
  { name: "Cycle 6", reach: 2390, conversion: 3800 },
  { name: "Cycle 7", reach: 3490, conversion: 4300 },
];

const segmentData = [
  { name: "Gen Z", value: 45, color: "#00f2ff" },
  { name: "Millennials", value: 30, color: "#7000ff" },
  { name: "Gen X", value: 15, color: "#ff00e5" },
  { name: "Others", value: 10, color: "#ffffff" },
];

interface Campaign {
  name: string;
  objective: string;
  posts: { platform: string; content: string }[];
  budget: { platform: string; percentage: number; amount: string }[];
}

interface ABTest {
  id: string;
  name: string;
  status: "Active" | "Completed" | "Draft";
  variants: {
    name: string;
    creative: string;
    audience: string;
    metrics: {
      reach: number;
      ctr: number;
      conversions: number;
    }
  }[];
  startDate: string;
}

const INITIAL_AB_TESTS: ABTest[] = [
  {
    id: "AB-210",
    name: "Summer Blast Creative Split",
    status: "Active",
    startDate: "2026-04-20",
    variants: [
      {
        name: "Variant A (High Energy)",
        creative: "Fast-paced motion graphics with upbeat audio.",
        audience: "Urban Athletes (18-24)",
        metrics: { reach: 12400, ctr: 4.2, conversions: 512 }
      },
      {
        name: "Variant B (Minimalist)",
        creative: "Clean, static aesthetic with focus on ingredients.",
        audience: "Urban Athletes (18-24)",
        metrics: { reach: 11800, ctr: 3.8, conversions: 489 }
      }
    ]
  }
];

const COLORS = ["#00f2ff", "#7000ff", "#ff00e5", "#ffffff", "#3b82f6", "#ef4444"];

export const MarketingSuite = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [abTests, setAbTests] = useState<ABTest[]>(INITIAL_AB_TESTS);
  const [activeTab, setActiveTab] = useState<"insights" | "campaigns" | "ab-testing">("insights");
  const [presets, setPresets] = useState<{ name: string; prompt: string }[]>(() => {
    const saved = localStorage.getItem("nexus_marketing_presets");
    return saved ? JSON.parse(saved) : [];
  });
  const [presetName, setPresetName] = useState("");

  const savePreset = () => {
    if (!presetName.trim() || !prompt.trim()) return;
    const newPresets = [...presets, { name: presetName, prompt }];
    setPresets(newPresets);
    localStorage.setItem("nexus_marketing_presets", JSON.stringify(newPresets));
    setPresetName("");
  };

  const deletePreset = (index: number) => {
    const newPresets = presets.filter((_, i) => i !== index);
    setPresets(newPresets);
    localStorage.setItem("nexus_marketing_presets", JSON.stringify(newPresets));
  };

  const [isAuditGenerating, setIsAuditGenerating] = useState(false);
  const [auditResults, setAuditResults] = useState<{ title: string; desc: string; action: string }[]>([]);

  const generateCampaign = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setCampaign(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: `Generate a hyper-specialized marketing campaign strategy for: "${prompt}". 
        Include:
        1. A campaign name (creative and unique).
        2. A primary objective focused on ROI and scale.
        3. 3 social media posts (specify platform and generate high-conversion content).
        4. Detailed budget allocation across 4 specific digital platforms (platform, percentage, and a sample amount assuming $10,000 total).` }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              objective: { type: Type.STRING },
              posts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    platform: { type: Type.STRING },
                    content: { type: Type.STRING }
                  },
                  required: ["platform", "content"]
                }
              },
              budget: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    platform: { type: Type.STRING },
                    percentage: { type: Type.NUMBER },
                    amount: { type: Type.STRING }
                  },
                  required: ["platform", "percentage", "amount"]
                }
              }
            },
            required: ["name", "objective", "posts", "budget"]
          }
        }
      });

      const resultText = response.text || "{}";
      const data = JSON.parse(resultText);
      setCampaign(data);
      // Automatically trigger an audit for the new campaign
      runStrategicAudit(data);
    } catch (error) {
      console.error("Campaign Generation Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const runStrategicAudit = async (campaignData: Campaign) => {
    setIsAuditGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ 
          role: "user", 
          parts: [{ text: `Perform a deep neural audit on this marketing campaign: ${JSON.stringify(campaignData)}. 
          Provide 3 distinct optimization recommendations based on market trends for 2026.
          Return a JSON array of objects with keys: title, desc, action.` }] 
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                desc: { type: Type.STRING },
                action: { type: Type.STRING }
              },
              required: ["title", "desc", "action"]
            }
          }
        }
      });
      const auditText = response.text || "[]";
      setAuditResults(JSON.parse(auditText));
    } catch (error) {
      console.error("Audit Generation Error:", error);
    } finally {
      setIsAuditGenerating(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-display font-bold">AI Marketing Suite</h2>
          <p className="text-nexus-text-dim mt-1">Predictive analytics and campaign optimization engine.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass p-1 rounded-xl flex gap-1">
            {[
              { id: "insights", label: "Insights", icon: BarChart3 },
              { id: "ab-testing", label: "A/B Matrix", icon: Target },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                  activeTab === tab.id ? "bg-nexus-accent text-black" : "text-nexus-text-dim hover:text-white"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label.toUpperCase()}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-nexus-accent/10 border border-nexus-accent/30 text-nexus-accent rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-nexus-accent hover:text-black transition-all"
          >
            <Zap className="w-4 h-4" />
            GENERATE CAMPAIGN
          </button>
        </div>
      </header>

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
              className="relative w-full max-w-2xl glass rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-nexus-border flex justify-between items-center bg-gradient-to-r from-nexus-accent/5 to-transparent shrink-0">
                <h3 className="text-xl font-display font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-nexus-accent" />
                  Neural Campaign Generator
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto">
                {!campaign && !isGenerating ? (
                  <div className="space-y-6">
                    {presets.length > 0 && (
                      <div>
                        <label className="text-xs font-mono text-nexus-text-dim uppercase tracking-widest mb-3 block">Neural Presets</label>
                        <div className="flex flex-wrap gap-2">
                          {presets.map((p, i) => (
                            <div key={i} className="flex items-center gap-1 group">
                              <button
                                onClick={() => setPrompt(p.prompt)}
                                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-nexus-text-dim hover:text-nexus-accent hover:border-nexus-accent/30 transition-all"
                              >
                                {p.name}
                              </button>
                              <button 
                                onClick={() => deletePreset(i)}
                                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-nexus-text-dim hover:text-red-400 hover:border-red-400/30 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-mono text-nexus-text-dim uppercase tracking-widest mb-3 block">Campaign Brief / Prompt</label>
                      <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g. Launching a new eco-friendly energy drink for urban athletes..."
                        className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-nexus-accent/50 transition-colors resize-none"
                      />
                    </div>

                    {prompt.trim() && (
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={presetName}
                          onChange={(e) => setPresetName(e.target.value)}
                          placeholder="PRESET NAME..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono outline-none focus:border-nexus-accent/30 transition-colors"
                        />
                        <button 
                          onClick={savePreset}
                          disabled={!presetName.trim()}
                          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-nexus-text-dim hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          SAVE AS PRESET
                        </button>
                      </div>
                    )}

                    <button 
                      onClick={generateCampaign}
                      disabled={!prompt.trim()}
                      className="w-full py-4 bg-nexus-accent text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-white transition-all disabled:opacity-50"
                    >
                      <Zap className="w-5 h-5" />
                      SYNTHESIZE CAMPAIGN
                    </button>
                  </div>
                ) : isGenerating ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="relative mb-8">
                      <div className="w-20 h-20 rounded-full border-4 border-nexus-accent/20 border-t-nexus-accent animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-nexus-accent animate-pulse" />
                      </div>
                    </div>
                    <h4 className="text-xl font-display font-bold mb-2">Analyzing Market Neural Patterns</h4>
                    <p className="text-nexus-text-dim text-sm max-w-xs">
                      NEXUS ONE is calculating optimal budget distribution and creative resonance...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="p-6 rounded-2xl bg-nexus-accent/5 border border-nexus-accent/20">
                      <h4 className="text-2xl font-display font-bold mb-1">{campaign?.name}</h4>
                      <p className="text-xs text-nexus-text-dim uppercase tracking-widest font-mono">Objective: {campaign?.objective}</p>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-sm font-bold flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-nexus-accent" />
                        Social Media Assets
                      </h5>
                      <div className="grid grid-cols-1 gap-3">
                        {campaign?.posts.map((post, i) => (
                          <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-nexus-accent" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-nexus-accent">{post.platform}</span>
                            </div>
                            <p className="text-sm text-nexus-text-dim leading-relaxed">{post.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-sm font-bold flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-nexus-accent" />
                        Neural Budget Allocation
                      </h5>
                      
                      {campaign?.budget && (
                        <div className="h-48 w-full glass rounded-2xl p-4 border border-white/5">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={campaign.budget}>
                              <XAxis 
                                dataKey="platform" 
                                stroke="rgba(255,255,255,0.3)" 
                                fontSize={9} 
                                tickLine={false} 
                                axisLine={false} 
                              />
                              <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: "#0f0f14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                                itemStyle={{ fontSize: "10px", color: "#00f2ff" }}
                              />
                              <Bar dataKey="percentage" radius={[4, 4, 0, 0]} barSize={30}>
                                {campaign.budget.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {campaign?.budget.map((item, i) => (
                          <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                            <div>
                              <p className="text-xs font-bold">{item.platform}</p>
                              <p className="text-[10px] text-nexus-text-dim uppercase tracking-widest">{item.percentage}% Allocation</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-mono text-nexus-accent">{item.amount}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setCampaign(null);
                        setPrompt("");
                      }}
                      className="w-full py-3 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                    >
                      GENERATE NEW VARIANT
                    </button>
                  </div>
                )}
              </div>

              {campaign && (
                <div className="p-6 bg-white/5 border-t border-nexus-border flex justify-end gap-4 shrink-0">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 text-sm font-bold text-nexus-text-dim hover:text-white transition-colors"
                  >
                    CLOSE
                  </button>
                  <button className="px-8 py-2 bg-nexus-accent text-black font-bold rounded-xl hover:bg-white transition-all">
                    DEPLOY CAMPAIGN
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {activeTab === "insights" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Market Sentiment", value: "Positive", icon: Target, trend: "+8.2%", up: true },
          { label: "Customer LTV", value: "$1,240", icon: Users, trend: "+12.5%", up: true },
          { label: "Ad Efficiency", value: "94%", icon: BarChart3, trend: "-2.1%", up: false },
          { label: "Predicted Growth", value: "240%", icon: TrendingUp, trend: "+45%", up: true },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-2xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <stat.icon className="w-5 h-5 text-nexus-accent" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold",
                stat.up ? "text-green-400" : "text-red-400"
              )}>
                {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <p className="text-nexus-text-dim text-xs uppercase tracking-widest font-mono">{stat.label}</p>
            <h3 className="text-2xl font-display font-bold mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-6 rounded-2xl h-[400px]">
          <h3 className="text-lg font-display font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-nexus-accent" />
            Performance Forecasting
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="rgba(255,255,255,0.3)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="rgba(255,255,255,0.3)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: "#0f0f14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                itemStyle={{ fontSize: "12px" }}
              />
              <Area 
                type="monotone" 
                dataKey="reach" 
                stroke="#00f2ff" 
                fillOpacity={1} 
                fill="url(#colorReach)" 
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass p-6 rounded-2xl h-[400px]">
          <h3 className="text-lg font-display font-semibold mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-nexus-accent" />
            Audience Segmentation
          </h3>
          <div className="h-48 mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segmentData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" fontSize={10} width={80} />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {segmentData.map((segment, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: segment.color }} />
                  <span className="text-sm text-nexus-text-dim">{segment.name}</span>
                </div>
                <span className="text-sm font-mono">{segment.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-display font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-nexus-accent" />
            Neural Optimization Recommendations
          </h3>
          {campaign && (
            <button 
              onClick={() => runStrategicAudit(campaign)}
              disabled={isAuditGenerating}
              className="px-3 py-1.5 glass border border-nexus-accent/30 text-[10px] font-bold text-nexus-accent rounded-lg flex items-center gap-2 hover:bg-nexus-accent hover:text-black transition-all disabled:opacity-50"
            >
              {isAuditGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              REFRESH AUDIT
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isAuditGenerating && auditResults.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl">
              <Loader2 className="w-8 h-8 text-nexus-accent animate-spin mb-4" />
              <p className="text-xs font-mono text-nexus-text-dim uppercase tracking-widest">Running Predictive Neural Audit...</p>
            </div>
          ) : (auditResults.length > 0 ? auditResults : [
            { title: "Target Expansion", desc: "Neuro-targeting suggests a high resonance with minimalist lifestyle segments in EU-West.", action: "Explore" },
            { title: "Creative Synergy", desc: "Video-first strategies on vertical platforms are showing 40% higher retention rates today.", action: "Optimize" },
            { title: "Budget Efficiency", desc: "CPM on secondary networks is dropping. Re-allocating 5% could yield 2k more impressions.", action: "Adjust" },
          ]).map((rec, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-20 transition-opacity">
                <Target className="w-12 h-12" />
              </div>
              <div className="mb-4">
                <h4 className="text-sm font-bold text-nexus-accent flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-nexus-accent" />
                  {rec.title}
                </h4>
                <p className="text-xs text-nexus-text-dim mt-2 leading-relaxed">{rec.desc}</p>
              </div>
              <button className="w-full text-[10px] font-bold py-2 rounded-lg border border-white/10 hover:border-nexus-accent/50 hover:text-nexus-accent transition-all uppercase tracking-widest">
                {rec.action}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  ) : (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-display font-bold">Neural A/B Matrix</h3>
          <p className="text-nexus-text-dim text-sm mt-1">Cross-variant testing for creative resonance and audience fit.</p>
        </div>
        <button className="px-4 py-2 glass border border-white/10 text-xs font-bold rounded-xl hover:bg-white/5 transition-all flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" />
          NEW A/B PROTOCOL
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {abTests.map((test) => (
          <div key={test.id} className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6">
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                test.status === "Active" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-white/5 text-nexus-text-dim"
              )}>
                {test.status}
              </span>
            </div>
            
            <div className="mb-8">
              <h4 className="text-2xl font-display font-bold">{test.name}</h4>
              <p className="text-nexus-text-dim text-xs font-mono uppercase mt-2">Started: {test.startDate} • ID: {test.id}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {test.variants.map((variant, i) => (
                <div key={i} className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div>
                      <h5 className="font-bold text-nexus-accent">{variant.name}</h5>
                      <p className="text-[10px] text-nexus-text-dim uppercase tracking-widest mt-1">{variant.audience}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-display font-bold text-white">{variant.metrics.conversions}</p>
                      <p className="text-[9px] text-nexus-text-dim uppercase font-mono">Conversions</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                      <p className="text-xs text-nexus-text-dim uppercase font-mono">Reach</p>
                      <p className="text-lg font-bold mt-1">{(variant.metrics.reach / 1000).toFixed(1)}k</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                      <p className="text-xs text-nexus-text-dim uppercase font-mono">CTR</p>
                      <p className="text-lg font-bold mt-1 text-green-400">{variant.metrics.ctr}%</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                      <p className="text-xs text-nexus-text-dim uppercase font-mono">CPA</p>
                      <p className="text-lg font-bold mt-1 text-white">$4.12</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-white/5 bg-black/20">
                    <p className="text-[10px] text-nexus-text-dim uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      AD Creative Variant
                    </p>
                    <p className="text-xs leading-relaxed text-white/80">{variant.creative}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-nexus-accent/20 border-2 border-nexus-bg flex items-center justify-center">
                      <Users className="w-3.5 h-3.5 text-nexus-accent" />
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-nexus-text-dim uppercase font-mono">24,320 Nodes Monitored</span>
              </div>
              <div className="flex gap-4">
                <button className="px-6 py-2 text-[10px] font-bold uppercase border border-white/10 rounded-xl hover:bg-white/5 transition-all">Pause Protocol</button>
                <button className="px-6 py-2 text-[10px] font-bold uppercase bg-nexus-accent text-black rounded-xl hover:bg-white transition-all">Scale Winner</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}
</div>
  );
};
