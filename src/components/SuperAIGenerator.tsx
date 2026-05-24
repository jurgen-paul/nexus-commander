import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Terminal, 
  Cpu, 
  Zap, 
  Copy, 
  Check, 
  RotateCcw, 
  Maximize2, 
  ChevronRight, 
  Sliders, 
  Dna, 
  Sparkles, 
  Gauge, 
  Globe, 
  MessageSquare,
  FileText,
  Share2,
  List,
  Target,
  Wand2,
  Loader2,
  Clock,
  Type,
  UserCheck,
  Languages,
  BookOpen
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from "react-markdown";

const CONTENT_TYPES = [
  { id: "blog", label: "Blog Article", icon: FileText },
  { id: "social", label: "Social Media Post", icon: Share2 },
  { id: "email", label: "Email Campaign", icon: MessageSquare },
  { id: "product", label: "Product Description", icon: Target },
  { id: "landing", label: "Landing Page Copy", icon: Globe },
  { id: "ad", label: "Ad Copy", icon: Zap },
  { id: "script", label: "Video Script", icon: Sliders },
  { id: "thread", label: "Twitter Thread", icon: List },
  { id: "linkedin", label: "LinkedIn Post", icon: Check },
  { id: "press", label: "Press Release", icon: Terminal },
  { id: "story", label: "Short Story", icon: BookOpen },
  { id: "poem", label: "Poem", icon: Sparkles },
];

const AUDIENCES = [
  "Tech Enthusiasts", "Business Professionals", "Creative Artists", 
  "General Public", "Gen Z / Alpha", "C-Level Executives", 
  "Developers", "Students", "Health & Wellness"
];

const TONES = [
  "Professional", "Persuasive", "Humorous", "Bold", "Witty", 
  "Technical", "Empathetic", "Sarcastic", "Informative", 
  "Visionary", "Minimalist", "Aggressive"
];

const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "es", label: "Spanish" },
  { id: "fr", label: "French" },
  { id: "nl", label: "Dutch" },
  { id: "jp", label: "Japanese" },
  { id: "de", label: "German" },
  { id: "it", label: "Italian" },
  { id: "pt", label: "Portuguese" },
];

const AUGMENTATIONS = [
  { id: "seo", label: "SEO Optimization", desc: "Embed high-intent keywords" },
  { id: "cta", label: "Magnetic CTA", desc: "High-conversion closing" },
  { id: "hashtags", label: "Hashtag Synthesis", desc: "Contextual social tags" },
  { id: "power", label: "Power Words", desc: "Psychological triggers" },
  { id: "stats", label: "Stats & Hooks", desc: "Data-driven authority" },
  { id: "arc", label: "Storytelling Arc", desc: "Hero's journey structure" },
  { id: "hooks", label: "Question Hooks", desc: "Engagement loops" },
  { id: "bullets", label: "Bullet Summaries", desc: "Rapid info digestion" },
  { id: "emojis", label: "Visual Anchors", desc: "Emoji placement logic" },
  { id: "polish", label: "Matrix Polish", desc: "Readability enhancement" },
];

export const SuperAIGenerator = () => {
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState("blog");
  const [audience, setAudience] = useState("Tech Enthusiasts");
  const [tone, setTone] = useState("Professional");
  const [language, setLanguage] = useState("en");
  const [length, setLength] = useState("medium");
  const [pov, setPov] = useState("first");
  const [creativity, setCreativity] = useState(70);
  const [formality, setFormality] = useState(50);
  const [activeAugmentations, setActiveAugmentations] = useState<string[]>(["seo", "cta"]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const toggleAugmentation = (id: string) => {
    setActiveAugmentations(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!topic.trim() || isGenerating) return;

    setIsGenerating(true);
    setOutput("");

    const selectedType = CONTENT_TYPES.find(t => t.id === contentType)?.label;
    const selectedAugments = AUGMENTATIONS.filter(a => activeAugmentations.includes(a.id)).map(a => a.label).join(", ");

    const prompt = `Matrix Content Generation Request:
Target Topic: ${topic}
Content Type: ${selectedType}
Audience: ${audience}
Tone: ${tone}
Language: ${language}
Target Length: ${length}
Point of View: ${pov}
Creativity Level: ${creativity}%
Formality Level: ${formality}%
Active Augmentations: ${selectedAugments}

Please generate the content now. Ensure it matches the NEXUS ONE futuristic and high-authority aesthetic.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: `You are the NEXUS ONE Content Architect, an elite AI specialized in high-performance content generation. 
          Your output must be polished, impactful, and perfectly aligned with the user's specific configuration. 
          Use Markdown for formatting. Avoid generic boilerplate. 
          If SEO is active, integrate keywords naturally. 
          If CTA is active, end with a powerful call to action.
          The user environment is a cyberpunk-themed dashboard called NEXUS ONE.`
        }
      });

      setOutput(response.text || "Generation failure: Neural signal lost.");
    } catch (error) {
      console.error("Gen Error:", error);
      setOutput("CRITICAL ERROR: Neural broadcast interrupted. Please verify matrix credentials.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex h-full overflow-hidden bg-[#050608]">
      {/* Configuration Sidebar */}
      <aside className="w-80 border-r border-white/5 flex flex-col glass h-full overflow-y-auto no-scrollbar">
        <div className="p-6 border-b border-white/5 bg-nexus-accent/5">
          <div className="flex items-center gap-2 mb-1">
            <Wand2 className="w-4 h-4 text-nexus-accent" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-nexus-accent">Content Architect</h2>
          </div>
          <p className="text-[10px] text-nexus-text-dim uppercase font-mono tracking-tighter">Neural Synthesis Engine v4.0</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Topic Input */}
          <div className="space-y-3">
            <label className="text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest flex items-center gap-2">
              <Terminal className="w-3 h-3" /> 0x01. Core Topic
            </label>
            <textarea 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter concepts, keywords, or title..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-display focus:border-nexus-accent/40 outline-none transition-all min-h-[100px] resize-none"
            />
          </div>

          {/* Type Grid */}
          <div className="space-y-3">
            <label className="text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest flex items-center gap-2">
              <Dna className="w-3 h-3" /> 0x02. Biological Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setContentType(type.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-xl border transition-all group",
                    contentType === type.id 
                      ? "bg-nexus-accent/20 border-nexus-accent/50 text-nexus-accent" 
                      : "bg-white/5 border-white/5 text-nexus-text-dim hover:bg-white/10"
                  )}
                >
                  <type.icon className={cn("w-4 h-4 mb-1", contentType === type.id && "animate-pulse")} />
                  <span className="text-[8px] font-mono uppercase tracking-tighter text-center">{type.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Deep Config */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest flex items-center gap-2">
                  <UserCheck className="w-3 h-3" /> Audience
                </label>
                <select 
                  value={audience} 
                  onChange={(e) => setAudience(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-mono text-nexus-accent focus:ring-0 cursor-pointer"
                >
                  {AUDIENCES.map(a => <option key={a} value={a} className="bg-[#0a0b0d]">{a}</option>)}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Tone
                </label>
                <select 
                  value={tone} 
                  onChange={(e) => setTone(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-mono text-nexus-accent focus:ring-0 cursor-pointer text-right"
                >
                  {TONES.map(t => <option key={t} value={t} className="bg-[#0a0b0d]">{t}</option>)}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest flex items-center gap-2">
                  <Languages className="w-3 h-3" /> Output Lang
                </label>
                <div className="flex gap-1">
                  {LANGUAGES.slice(0, 4).map(l => (
                    <button 
                      key={l.id}
                      onClick={() => setLanguage(l.id)}
                      className={cn(
                        "w-6 h-6 rounded flex items-center justify-center text-[8px] font-mono transition-all",
                        language === l.id ? "bg-nexus-accent text-black" : "bg-white/5 text-nexus-text-dim hover:bg-white/10"
                      )}
                    >
                      {l.id.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Range Sliders */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-nexus-text-dim uppercase">
                  <span>Creativity</span>
                  <span className="text-nexus-accent">{creativity}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={creativity} 
                  onChange={(e) => setCreativity(Number(e.target.value))}
                  className="w-full accent-nexus-accent bg-white/5 h-1 rounded-full appearance-none cursor-pointer" 
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-nexus-text-dim uppercase">
                  <span>Formality</span>
                  <span className="text-nexus-accent">{formality}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={formality} 
                  onChange={(e) => setFormality(Number(e.target.value))}
                  className="w-full accent-nexus-accent bg-white/5 h-1 rounded-full appearance-none cursor-pointer" 
                />
              </div>
            </div>

            {/* Length & POV */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-mono text-nexus-text-dim uppercase tracking-widest">Dimension</label>
                <div className="flex flex-col gap-1">
                  {["short", "medium", "long", "extra"].map(l => (
                    <button
                      key={l}
                      onClick={() => setLength(l)}
                      className={cn(
                        "w-full py-1.5 px-2 rounded-lg text-[9px] font-mono uppercase tracking-tighter text-left transition-all",
                        length === l ? "bg-nexus-accent/20 text-nexus-accent border border-nexus-accent/30" : "bg-white/5 text-nexus-text-dim hover:bg-white/10 border border-transparent"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-mono text-nexus-text-dim uppercase tracking-widest">Perspective</label>
                <div className="flex flex-col gap-1">
                  {["first", "second", "third"].map(p => (
                    <button
                      key={p}
                      onClick={() => setPov(p)}
                      className={cn(
                        "w-full py-1.5 px-2 rounded-lg text-[9px] font-mono uppercase tracking-tighter text-left transition-all",
                        pov === p ? "bg-nexus-accent/20 text-nexus-accent border border-nexus-accent/30" : "bg-white/5 text-nexus-text-dim hover:bg-white/10 border border-transparent"
                      )}
                    >
                      {p} person
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Augmentations */}
          <div className="space-y-3 pt-6 border-t border-white/5">
            <label className="text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest flex items-center gap-2">
              <Gauge className="w-3 h-3" /> 0x03. Augmentations
            </label>
            <div className="grid grid-cols-1 gap-2">
              {AUGMENTATIONS.map((aug) => (
                <button
                  key={aug.id}
                  onClick={() => toggleAugmentation(aug.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all text-left group",
                    activeAugmentations.includes(aug.id) 
                      ? "bg-nexus-accent/10 border-nexus-accent/30" 
                      : "bg-white/5 border-white/5 hover:border-white/10"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                    activeAugmentations.includes(aug.id) ? "border-nexus-accent bg-nexus-accent" : "border-white/20"
                  )}>
                    {activeAugmentations.includes(aug.id) && <Check className="w-2.5 h-2.5 text-black" />}
                  </div>
                  <div>
                    <p className={cn("text-[10px] font-bold uppercase tracking-widest", activeAugmentations.includes(aug.id) ? "text-nexus-accent" : "text-white")}>{aug.label}</p>
                    <p className="text-[8px] text-nexus-text-dim font-mono tracking-tighter">{aug.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button Container */}
        <div className="p-6 sticky bottom-0 bg-[#050608]/80 backdrop-blur-xl border-t border-white/5 mt-auto">
          <button
            onClick={handleGenerate}
            disabled={!topic.trim() || isGenerating}
            className={cn(
              "w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-[0.3em] transition-all relative overflow-hidden group shadow-[0_0_30px_rgba(5,255,161,0.1)]",
              !topic.trim() || isGenerating 
                ? "bg-white/5 text-white/20 grayscale cursor-not-allowed" 
                : "bg-nexus-accent text-black hover:bg-white hover:shadow-[0_0_50px_rgba(5,255,161,0.3)]"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Synchronizing...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 group-hover:animate-pulse" />
                <span>Execute Synthesis</span>
              </>
            )}
            
            {/* Energy Wave Effect */}
            {!isGenerating && topic.trim() && (
              <motion.div 
                className="absolute inset-0 bg-white/20 translate-x-[-100%]"
                animate={{ translateX: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            )}
          </button>
        </div>
      </aside>

      {/* Main Output Panel */}
      <main className="flex-1 flex flex-col relative">
        {/* Terminal Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 glass relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
            </div>
            <div className="h-4 w-px bg-white/10 mx-2" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest">Terminal Output</span>
              <span className="px-1.5 py-0.5 rounded bg-nexus-accent/10 border border-nexus-accent/20 text-[9px] font-mono text-nexus-accent">LIVE</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-4 mr-4 text-[10px] font-mono text-nexus-text-dim uppercase">
              <span>Word Count: <span className="text-white">{output.split(/\s+/).filter(w => w).length}</span></span>
              <span>Char Count: <span className="text-white">{output.length}</span></span>
            </div>
            <button 
              onClick={handleCopy}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-nexus-accent/50 text-nexus-text-dim hover:text-nexus-accent transition-all relative group"
              title="Copy Output"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => { setOutput(""); setTopic(""); }}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-nexus-accent/50 text-nexus-text-dim hover:text-nexus-accent transition-all group"
              title="Reset Architect"
            >
              <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            </button>
            <button 
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-nexus-accent/50 text-nexus-text-dim hover:text-nexus-accent transition-all"
              title="Maximize View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Output Content */}
        <div className="flex-1 overflow-y-auto p-12 bg-grid relative scrollbar-nexus">
          <AnimatePresence mode="wait">
            {!output && !isGenerating ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto"
              >
                <div className="w-24 h-24 rounded-3xl bg-nexus-accent/5 border border-nexus-accent/10 flex items-center justify-center mb-8 relative">
                   <div className="absolute inset-0 bg-nexus-accent/10 blur-[40px] rounded-full animate-pulse" />
                   <Cpu className="w-10 h-10 text-nexus-accent relative z-10" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-4">Awaiting Signal</h3>
                <p className="text-nexus-text-dim leading-relaxed mb-8">
                  Configure your content parameters in the sidebar and execute synthesis. Our neural models will weave your concepts into high-authority matrix content.
                </p>
                <div className="grid grid-cols-2 gap-4 w-full">
                   <div className="glass p-4 rounded-2xl border border-white/5 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-3 h-3 text-nexus-accent" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-nexus-text-dim">Latency</span>
                      </div>
                      <p className="text-lg font-bold font-mono">~2.4s</p>
                   </div>
                   <div className="glass p-4 rounded-2xl border border-white/5 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <Type className="w-3 h-3 text-nexus-accent" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-nexus-text-dim">Models</span>
                      </div>
                      <p className="text-lg font-bold font-mono text-nexus-accent">ULTRA</p>
                   </div>
                </div>
              </motion.div>
            ) : isGenerating ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center"
              >
                 <div className="relative mb-12">
                    <div className="w-32 h-32 rounded-full border border-nexus-accent/20 animate-[spin_10s_linear_infinity]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Zap className="w-8 h-8 text-nexus-accent animate-pulse" />
                    </div>
                    {/* Floating Particles */}
                    <motion.div 
                      className="absolute top-0 left-1/2 w-1 h-1 bg-nexus-accent rounded-full"
                      animate={{ y: [-20, 20], opacity: [0, 1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                 </div>
                 <div className="text-center space-y-4">
                    <p className="text-lg font-mono tracking-[0.3em] font-bold text-nexus-accent uppercase animate-pulse">Initializing Synthesis</p>
                    <div className="flex items-center gap-1.5 justify-center">
                       <div className="w-1.5 h-1.5 rounded-full bg-nexus-accent animate-bounce [animation-delay:-0.3s]" />
                       <div className="w-1.5 h-1.5 rounded-full bg-nexus-accent animate-bounce [animation-delay:-0.15s]" />
                       <div className="w-1.5 h-1.5 rounded-full bg-nexus-accent animate-bounce" />
                    </div>
                    <p className="text-xs font-mono text-nexus-text-dim max-w-xs mx-auto">Accessing neural node 0x7F... Extracting semantic vectors... Polishing matrix output...</p>
                 </div>
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto pb-24"
              >
                {/* Meta Header */}
                <div className="mb-12 flex items-center justify-between p-4 rounded-2xl glass border border-nexus-accent/20">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-nexus-accent/10 flex items-center justify-center">
                         <FileText className="w-5 h-5 text-nexus-accent" />
                      </div>
                      <div>
                         <p className="text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest">{contentType} synthesis</p>
                         <p className="text-sm font-bold truncate max-w-[200px]">{topic}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest">neural score</p>
                      <p className="text-lg font-bold font-mono text-nexus-accent">99.2%</p>
                   </div>
                </div>

                <div className="prose prose-invert prose-nexus max-w-none prose-headings:font-display prose-headings:text-nexus-accent prose-p:text-nexus-text-dim prose-p:leading-relaxed">
                   <ReactMarkdown>{output}</ReactMarkdown>
                </div>

                <div className="mt-16 flex items-center gap-4 p-8 rounded-3xl border border-dashed border-white/10 bg-white/5 group transition-all hover:bg-nexus-accent/5">
                   <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Share2 className="w-6 h-6 text-nexus-accent" />
                   </div>
                   <div className="flex-1">
                      <h4 className="font-bold mb-1">External Deployment</h4>
                      <p className="text-xs text-nexus-text-dim">Your content is ready for the external nodes. Export direct to matrix channels.</p>
                   </div>
                   <button className="px-6 py-2 bg-white/10 hover:bg-nexus-accent hover:text-black font-bold text-xs rounded-xl transition-all uppercase tracking-widest">
                      Broadcast
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Action Bar */}
        <AnimatePresence>
          {output && !isGenerating && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl glass border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-20"
            >
              <button 
                onClick={handleGenerate}
                className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-xl transition-all group"
              >
                <RotateCcw className="w-4 h-4 text-nexus-accent group-hover:rotate-180 transition-transform" />
                <span className="text-[10px] font-mono font-bold uppercase">Regenerate</span>
              </button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-xl transition-all group">
                <Maximize2 className="w-4 h-4 text-nexus-accent group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-mono font-bold uppercase">Refine in Chat</span>
              </button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 px-6 py-2 bg-nexus-accent text-black font-bold rounded-xl hover:bg-white transition-all group"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 group-hover:scale-110" />}
                <span className="text-[10px] font-bold uppercase">{copied ? "Copied" : "Copy Content"}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Terminal Scanline overlays */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%]" />
      </main>
    </div>
  );
};
