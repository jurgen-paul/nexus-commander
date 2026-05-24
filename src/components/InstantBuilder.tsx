import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Globe, Wand2, Layout, Type, Image as ImageIcon, Loader2, CheckCircle2, ArrowRight, Cpu, ExternalLink, Monitor, Smartphone, Tablet, Trash2, Plus, GripVertical, Palette, Layers, Save, RefreshCcw, Zap } from "lucide-react";
import { GoogleGenAI, Type as GenAIType } from "@google/genai";
import { cn } from "@/src/lib/utils";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type CreatorType = "BOOK" | "WEBSITE" | "LANDING_PAGE";
type PreviewMode = "desktop" | "tablet" | "mobile";
type StylePreset = "Cyberpunk" | "Minimalist" | "Corporate" | "Futuristic";

interface Section {
  id: string;
  heading: string;
  content: string;
  type?: string;
}

interface GeneratedContent {
  title: string;
  sections: Section[];
  branding: { primaryColor: string; font: string };
}

export const InstantBuilder = () => {
  const [type, setType] = useState<CreatorType>("WEBSITE");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<"IDLE" | "PREPARING" | "UPLOADING" | "LIVE">("IDLE");
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [stylePreset, setStylePreset] = useState<StylePreset>("Futuristic");

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setResult(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a detailed structure for a ${type} based on this prompt: "${prompt}". 
        The style should be ${stylePreset}.
        Include a catchy title, 4 main sections with content summaries, and branding suggestions (primary color hex and font style).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: GenAIType.OBJECT,
            properties: {
              title: { type: GenAIType.STRING },
              sections: {
                type: GenAIType.ARRAY,
                items: {
                  type: GenAIType.OBJECT,
                  properties: {
                    heading: { type: GenAIType.STRING },
                    content: { type: GenAIType.STRING }
                  },
                  required: ["heading", "content"]
                }
              },
              branding: {
                type: GenAIType.OBJECT,
                properties: {
                  primaryColor: { type: GenAIType.STRING },
                  font: { type: GenAIType.STRING }
                },
                required: ["primaryColor", "font"]
              }
            },
            required: ["title", "sections", "branding"]
          }
        }
      });

      const data = JSON.parse(response.text);
      // Inject IDs for internal management
      const content = {
        ...data,
        sections: data.sections.map((s: any, idx: number) => ({
          ...s,
          id: Math.random().toString(36).substr(2, 9)
        }))
      };
      setResult(content);
    } catch (error) {
      console.error("Generation Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    if (!result) return;
    setResult({
      ...result,
      sections: result.sections.map(s => s.id === id ? { ...s, ...updates } : s)
    });
  };

  const removeSection = (id: string) => {
    if (!result) return;
    setResult({
      ...result,
      sections: result.sections.filter(s => s.id !== id)
    });
  };

  const addSection = () => {
    if (!result) return;
    const newSection: Section = {
      id: Math.random().toString(36).substr(2, 9),
      heading: "New Section",
      content: "Add your neural content summary here..."
    };
    setResult({
      ...result,
      sections: [...result.sections, newSection]
    });
  };

  const handleDeploy = async () => {
    if (!result || isDeploying) return;
    setIsDeploying(true);
    setDeploymentStatus("PREPARING");
    
    // Simulated deployment sequence
    await new Promise(r => setTimeout(r, 1500));
    setDeploymentStatus("UPLOADING");
    await new Promise(r => setTimeout(r, 2000));
    setDeploymentStatus("LIVE");
    
    setTimeout(() => {
      setIsDeploying(false);
      setDeploymentStatus("IDLE");
    }, 3000);
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <header>
        <h2 className="text-3xl font-display font-bold">Instant Builder</h2>
        <p className="text-nexus-text-dim mt-1">Generate full digital assets with a single neural command.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-3xl space-y-6">
            <div>
              <label className="text-xs font-mono text-nexus-text-dim uppercase tracking-widest mb-3 block">Asset Type</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: "WEBSITE", label: "Full Website", icon: Globe },
                  { id: "BOOK", label: "E-Book / Guide", icon: BookOpen },
                  { id: "LANDING_PAGE", label: "Landing Page", icon: Layout },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setType(item.id as CreatorType)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                      type === item.id 
                        ? "bg-nexus-accent/10 border-nexus-accent text-nexus-accent" 
                        : "bg-white/5 border-white/5 text-nexus-text-dim hover:border-white/20"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-nexus-text-dim uppercase tracking-widest mb-3 block">Style Preset</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "Futuristic", icon: Wand2 },
                  { id: "Minimalist", icon: Monitor },
                  { id: "Cyberpunk", icon: Zap }, // I need to make sure Zap is imported or used if available
                  { id: "Corporate", icon: Globe },
                ].map((item) => {
                  const Icon = item.id === "Cyberpunk" ? RefreshCcw : item.icon; // Using RefreshCcw as placeholder if Zap is not there, but I'll use Palette
                  return (
                    <button
                      key={item.id}
                      onClick={() => setStylePreset(item.id as StylePreset)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold uppercase transition-all",
                        stylePreset === item.id 
                          ? "bg-nexus-accent/10 border-nexus-accent text-nexus-accent" 
                          : "bg-white/5 border-white/5 text-nexus-text-dim hover:border-white/20"
                      )}
                    >
                      <Palette className="w-3 h-3" />
                      {item.id}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-nexus-text-dim uppercase tracking-widest mb-3 block">Neural Prompt</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A futuristic coffee brand for space travelers..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-nexus-accent/50 transition-colors resize-none"
              />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-4 bg-nexus-accent text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-white transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  SYNTHESIZING...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  GENERATE ASSET
                </>
              )}
            </button>
          </div>

          <div className="glass p-6 rounded-3xl">
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-nexus-accent" />
              Included Features
            </h4>
            <ul className="space-y-3">
              {[
                "AI-Generated Copywriting",
                "Responsive Layout Design",
                "SEO Optimization",
                "Branding & Color Palette",
                "Instant Deployment Ready"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-nexus-text-dim">
                  <div className="w-1 h-1 rounded-full bg-nexus-accent" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {/* Preview Controls */}
          {result && (
            <div className="flex items-center justify-between glass px-4 py-2 rounded-2xl border border-white/5">
              <div className="flex gap-2">
                {[
                  { id: "desktop", icon: Monitor },
                  { id: "tablet", icon: Tablet },
                  { id: "mobile", icon: Smartphone },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setPreviewMode(mode.id as PreviewMode)}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      previewMode === mode.id ? "bg-nexus-accent text-black" : "text-nexus-text-dim hover:bg-white/5"
                    )}
                  >
                    <mode.icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: result.branding.primaryColor }} />
                  <span className="text-[10px] font-mono text-nexus-text-dim uppercase">{result.branding.primaryColor}</span>
                </div>
                <button className="flex items-center gap-2 text-[10px] font-bold text-nexus-text-dim hover:text-white transition-colors">
                  <RefreshCcw className="w-3 h-3" />
                  REGENERATE STYLE
                </button>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {!result && !isGenerating ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full glass rounded-3xl border-dashed border-2 flex flex-col items-center justify-center text-center p-12"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Layout className="w-10 h-10 text-nexus-text-dim" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">Preview Neural Output</h3>
                <p className="text-nexus-text-dim max-w-sm">
                  Enter a prompt and select an asset type to begin the generation process.
                </p>
              </motion.div>
            ) : isGenerating ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full glass rounded-3xl flex flex-col items-center justify-center p-12"
              >
                <div className="relative mb-8">
                  <div className="w-24 h-24 rounded-full border-4 border-nexus-accent/20 border-t-nexus-accent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Cpu className="w-8 h-8 text-nexus-accent animate-pulse" />
                  </div>
                </div>
                <h3 className="text-xl font-display font-bold mb-2">Neural Synthesis in Progress</h3>
                <div className="space-y-2 w-full max-w-xs">
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-nexus-accent"
                      animate={{ width: ["0%", "30%", "60%", "90%", "100%"] }}
                      transition={{ duration: 5, repeat: Infinity }}
                    />
                  </div>
                  <p className="text-[10px] font-mono text-nexus-text-dim text-center uppercase tracking-widest">
                    Analyzing structure & branding...
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                  width: previewMode === "desktop" ? "100%" : previewMode === "tablet" ? "768px" : "375px",
                  margin: "0 auto"
                }}
                className="glass rounded-3xl overflow-hidden flex flex-col h-[700px] transition-all duration-500"
              >
                <div className="p-8 border-b border-nexus-border bg-gradient-to-r from-nexus-accent/5 to-transparent sticky top-0 bg-nexus-bg z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 rounded-full bg-nexus-accent/10 border border-nexus-accent/30 text-[10px] font-bold text-nexus-accent uppercase tracking-widest">
                      {type} GENERATED
                    </span>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: result?.branding.primaryColor }} />
                      <span className="text-[10px] font-mono text-nexus-text-dim">{result?.branding.font}</span>
                    </div>
                  </div>
                  <h3 className="text-4xl font-display font-extrabold tracking-tight" contentEditable onBlur={(e) => setResult({...result!, title: e.currentTarget.textContent || ""})}>
                    {result?.title}
                  </h3>
                </div>

                <div className="flex-1 p-8 overflow-y-auto space-y-12 scrollbar-none">
                  {result?.sections.map((section, i) => (
                    <motion.div 
                      key={section.id} 
                      className="group relative space-y-4 p-6 rounded-2xl border border-white/5 hover:border-nexus-accent/20 transition-all hover:bg-white/5"
                    >
                      {/* Section Controls */}
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => removeSection(section.id)}
                          className="p-1.5 rounded-lg bg-black/50 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-lg bg-black/50 text-nexus-text-dim hover:text-white transition-colors cursor-grab">
                          <GripVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <h4 
                          className="text-xl font-display font-bold text-nexus-accent outline-none"
                          contentEditable
                          onBlur={(e) => updateSection(section.id, { heading: e.currentTarget.textContent || "" })}
                        >
                          {section.heading}
                        </h4>
                        <div 
                          className="text-sm text-nexus-text-dim leading-relaxed outline-none"
                          contentEditable
                          onBlur={(e) => updateSection(section.id, { content: e.currentTarget.textContent || "" })}
                        >
                          {section.content}
                        </div>
                        <button className="flex items-center gap-2 text-[9px] font-bold text-nexus-accent hover:text-white transition-colors bg-nexus-accent/5 px-2 py-1 rounded-md border border-nexus-accent/20">
                          <ImageIcon className="w-3 h-3" />
                          SUGGEST NEURAL IMAGE
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  <button 
                    onClick={addSection}
                    className="w-full py-6 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-2 text-nexus-text-dim hover:border-nexus-accent/50 hover:text-nexus-accent transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">Add Neural Component</span>
                  </button>
                </div>

                <div className="p-6 bg-white/5 border-t border-nexus-border flex justify-between items-center shrink-0">
                  <div className="flex gap-4">
                    <button className="flex items-center gap-2 text-xs font-bold text-nexus-text-dim hover:text-white transition-colors">
                      <Save className="w-4 h-4" />
                      SAVE DRAFT
                    </button>
                    <button className="flex items-center gap-2 text-xs font-bold text-nexus-text-dim hover:text-white transition-colors">
                      <Layers className="w-4 h-4" />
                      COMPONENT LIST
                    </button>
                  </div>
                  <button 
                    onClick={handleDeploy}
                    disabled={isDeploying}
                    className="px-6 py-2 bg-white text-black font-bold rounded-xl flex items-center gap-2 hover:bg-nexus-accent transition-all disabled:opacity-50 min-w-[160px] justify-center"
                  >
                    {isDeploying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {deploymentStatus === "PREPARING" && "PREPARING..."}
                        {deploymentStatus === "UPLOADING" && "UPLOADING..."}
                        {deploymentStatus === "LIVE" && "LIVE!"}
                      </>
                    ) : (
                      <>
                        DEPLOY ASSET
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {deploymentStatus === "LIVE" && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-green-500/10 border-t border-green-500/20 p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-xs font-bold text-green-500 uppercase tracking-widest">Deployment Successful</p>
                          <p className="text-[10px] text-nexus-text-dim">Your {type.toLowerCase()} is now live on the global edge network.</p>
                        </div>
                      </div>
                      <button className="flex items-center gap-2 text-[10px] font-bold text-white hover:text-nexus-accent transition-colors">
                        VIEW LIVE <ExternalLink className="w-3 h-3" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
