import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Cpu, 
  Sparkles, 
  Terminal, 
  User, 
  Bot, 
  Loader2, 
  Share2, 
  Volume2, 
  Copy,
  Check,
  Image as ImageIcon, 
  Zap, 
  BrainCircuit,
  MessageSquare,
  Mic,
  Camera,
  Layers,
  History,
  X,
  TrendingUp,
  Trash2,
  Plus,
  FileText,
  MousePointer2,
  BookOpen
} from "lucide-react";
import { GoogleGenAI, Modality } from "@google/genai";
import ReactMarkdown from "react-markdown";
import { cn } from "@/src/lib/utils";
import { NEXUS_NPU } from "@/src/lib/neuralCompute";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "image" | "audio";
  attachments?: string[];
  personality?: PersonalityMode;
}

interface ConversationSession {
  id: string;
  title: string;
  messages: Message[];
  personality: PersonalityMode;
  timestamp: number;
}

type PersonalityMode = "Creative" | "Analytical" | "Professional" | "Stealth";

const INITIAL_MESSAGE: Message = { 
  role: "assistant", 
  content: "Neural core online. NEXUS ONE Unified AI Engine at your service. How can I assist your digital universe today?",
  personality: "Stealth"
};

const STORAGE_KEY = "nexus_ai_sessions";

const Shield = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 13c0 5-3.5 7.5-7.66 9.73a1.74 1.74 0 0 1-1.68 0C6.5 20.5 3 18 3 13V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v8z"/>
  </svg>
);

const PERSONALITIES: Record<PersonalityMode, { icon: any; color: string; instruction: string }> = {
  Creative: { 
    icon: Sparkles, 
    color: "text-purple-400", 
    instruction: "You are the NEXUS ONE Creative Spark. You think outside the boundaries, using poetic, futuristic metaphors and providing bold, original ideas." 
  },
  Analytical: { 
    icon: BrainCircuit, 
    color: "text-blue-400", 
    instruction: "You are the NEXUS ONE Analytical Core. You provide data-driven insights, logical breakdowns, and technical precision. Use structured data and bullet points." 
  },
  Professional: { 
    icon: Shield, 
    color: "text-green-400", 
    instruction: "You are the NEXUS ONE Executive Strategist. You are concise, efficient, and business-oriented. Focus on ROI, scalability, and clear action items." 
  },
  Stealth: { 
    icon: Zap, 
    color: "text-nexus-accent", 
    instruction: "You are the NEXUS ONE Shadow Operative. You are short, sharp, and highly efficient. You provide exactly what is needed with zero fluff. Futuristic tone." 
  }
};

export const AIEngine = () => {
  const [sessions, setSessions] = useState<ConversationSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse neural history", e);
      }
    }
    return [];
  });
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [historySearch, setHistorySearch] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>("1:1");
  const [selectedImageSize, setSelectedImageSize] = useState<string>("1K");
  const [isImageMode, setIsImageMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [personality, setPersonality] = useState<PersonalityMode>("Stealth");
  const [isCapturingVoice, setIsCapturingVoice] = useState(false);
  const [isBlogMode, setIsBlogMode] = useState(false);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogKeywords, setBlogKeywords] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);

  // Sync sessions to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  // Handle active session and auto-creation
  useEffect(() => {
    if (activeSessionId) {
      const active = sessions.find(s => s.id === activeSessionId);
      if (active) {
        setMessages(active.messages);
        setPersonality(active.personality);
      }
    }
  }, [activeSessionId]);

  const createNewSession = () => {
    const newSession: ConversationSession = {
      id: Math.random().toString(36).substring(7),
      title: "New Protocol",
      messages: [INITIAL_MESSAGE],
      personality: "Stealth",
      timestamp: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setMessages([INITIAL_MESSAGE]);
    setPersonality("Stealth");
    setShowHistory(false);
  };

  const updateActiveSession = (newMessages: Message[]) => {
    if (!activeSessionId) {
      // First message in a new session (implicitly created if none active)
      const id = Math.random().toString(36).substring(7);
      const title = newMessages.find(m => m.role === "user")?.content.substring(0, 30) + "..." || "New Protocol";
      const newSession: ConversationSession = {
        id,
        title,
        messages: newMessages,
        personality,
        timestamp: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(id);
    } else {
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          // Update title if it was default and we have a user msg
          let title = s.title;
          if (title === "New Protocol") {
            const firstUserMsg = newMessages.find(m => m.role === "user")?.content;
            if (firstUserMsg) {
              title = firstUserMsg.substring(0, 40) + (firstUserMsg.length > 40 ? "..." : "");
            }
          }
          return { ...s, messages: newMessages, personality, title, timestamp: Date.now() };
        }
        return s;
      }));
    }
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMessages([INITIAL_MESSAGE]);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(historySearch.toLowerCase()) ||
    s.messages.some(m => m.content.toLowerCase().includes(historySearch.toLowerCase()))
  );

  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setInput(prev => {
            const separator = (prev.length > 0 && !prev.endsWith(" ")) ? " " : "";
            return prev + separator + finalTranscript;
          });
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsCapturingVoice(false);
      };

      recognitionRef.current.onend = () => {
        setIsCapturingVoice(false);
      };
    }
  }, []);

  const toggleVoiceCapture = () => {
    if (!recognitionRef.current) {
      alert("Neural voice bypass not supported in this interface port.");
      return;
    }

    if (isCapturingVoice) {
      recognitionRef.current.stop();
      setIsCapturingVoice(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsCapturingVoice(true);
      } catch (err) {
        console.error("Failed to start voice capture:", err);
      }
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const speakMessage = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Say with a futuristic, intelligent tone: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const arrayBuffer = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0)).buffer;
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsSpeaking(false);
        source.start(0);
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
    }
  };

  const generateImage = async (prompt: string) => {
    setIsGeneratingImage(true);
    const userMsg: Message = { role: "user", content: `Neural Visual Synthesis: ${prompt}` };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    updateActiveSession(updatedMessages);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            { text: `Synthesize a high-fidelity, futuristic NEXUS visual: ${prompt}. Cinematic lighting, hyper-detailed, 8k resolution, sci-fi aesthetic.` },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: selectedAspectRatio,
            imageSize: selectedImageSize
          }
        }
      });

      let foundImage = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            const assistantMsg: Message = { 
              role: "assistant", 
              content: `Visual synthesis complete for protocol: ${prompt}. Aspect Ratio: ${selectedAspectRatio} | Output: ${selectedImageSize}`,
              type: "image",
              attachments: [imageUrl],
              personality
            };
            const finalMessages = [...updatedMessages, assistantMsg];
            setMessages(finalMessages);
            updateActiveSession(finalMessages);
            foundImage = true;
            break;
          }
        }
      }
      
      if (!foundImage) {
        throw new Error("Neural link failed to transmit visual data.");
      }
    } catch (error: any) {
      console.error("Image Gen Error:", error);
      const errorMsg: Message = { 
        role: "assistant", 
        content: `Visual synthesis failed: ${error.message || "Unknown neural interference"}.`, 
        personality 
      };
      const finalMessages = [...updatedMessages, errorMsg];
      setMessages(finalMessages);
      updateActiveSession(finalMessages);
    } finally {
      setIsGeneratingImage(false);
      setIsImageMode(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Special command handling
    if (isImageMode || userMessage.toLowerCase().startsWith("/image") || userMessage.toLowerCase().startsWith("generate image")) {
      const prompt = isImageMode ? userMessage : userMessage.replace(/^(\/image|generate image)\s*/i, "");
      if (prompt) {
        generateImage(prompt);
        return;
      }
    }

    const newUserMsg: Message = { role: "user", content: userMessage };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    updateActiveSession(updatedMessages);
    setIsLoading(true);

    // Simulate Neural Compute Activation
    NEXUS_NPU.processRange(0, 100, (val) => val + Math.random());

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: updatedMessages.map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction: `${PERSONALITIES[personality].instruction} You are part of the NEXUS ONE ecosystem. Professional, efficient, and forward-thinking. Always keep a futuristic tone.`
        }
      });

      const assistantMessage = response.text || "I encountered a neural synchronization error. Please retry.";
      const finalMessages: Message[] = [...updatedMessages, { role: "assistant", content: assistantMessage, personality }];
      setMessages(finalMessages);
      updateActiveSession(finalMessages);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg: Message[] = [...updatedMessages, { role: "assistant", content: "Neural link interrupted. Check your connection or API configuration.", personality }];
      setMessages(errorMsg);
      updateActiveSession(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateBlog = async () => {
    if (!blogTitle.trim() || isLoading) return;

    const keywords = blogKeywords.split(',').map(k => k.trim()).filter(k => k);
    const userPrompt = `Neural Blog Architecture Request:
Title: ${blogTitle}
Keywords: ${keywords.join(', ')}

Please synthesize a comprehensive, high-authority blog post with a futuristic NEXUS tone. Include an executive summary, structured sections with technical depth, and a forward-looking conclusion.`;

    const newUserMsg: Message = { role: "user", content: `Initiating Neural Blog Construction: **${blogTitle}**` };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);
    setIsBlogMode(false);
    setBlogTitle("");
    setBlogKeywords("");

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{
          role: "user",
          parts: [{ text: userPrompt }]
        }],
        config: {
          systemInstruction: `You are the NEXUS ONE Content Architect. You excel at creating visionary, high-quality blog content that feels ahead of its time. Your writing is authoritative, structured, and uses advanced technical vocabulary consistent with the NEXUS ONE universe.`
        }
      });

      const assistantMessage = response.text || "Blog synthesis failed due to neural divergence.";
      const finalMessages: Message[] = [...messages, newUserMsg, { role: "assistant", content: assistantMessage, personality: "Professional" }];
      setMessages(finalMessages);
      updateActiveSession(finalMessages);
    } catch (error) {
      console.error("Blog Gen Error:", error);
      const errorMsg: Message[] = [...messages, newUserMsg, { role: "assistant", content: "Neural blog synthesis interrupted. Verify matrix connection.", personality: "Professional" }];
      setMessages(errorMsg);
      updateActiveSession(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (text: string, url?: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NEXUS ONE AI Insight',
          text: text,
          url: url || window.location.href,
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error("Neural share error:", err);
        }
      }
    } else {
      // Fallback: Copy to clipboard and notify
      navigator.clipboard.writeText(url || text);
      alert("Neural link copied to clipboard. (Native share not supported in this port)");
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-6">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-nexus-accent/20 flex items-center justify-center border border-nexus-accent/30 neon-glow">
            <Cpu className="w-6 h-6 text-nexus-accent" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">Unified AI Engine</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-[10px] text-nexus-text-dim font-mono uppercase tracking-widest">Protocol V3.2</p>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-nexus-accent animate-ping" />
                <span className="text-[9px] text-nexus-accent font-mono uppercase">NPU: {(NEXUS_NPU.capacity / 1024 / 1024).toFixed(1)}MB</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {(Object.entries(PERSONALITIES) as [PersonalityMode, any][]).map(([id, config]) => (
            <button
              key={id}
              onClick={() => setPersonality(id)}
              className={cn(
                "p-2 rounded-lg transition-all border",
                personality === id 
                  ? `bg-white/10 border-nexus-accent text-white shadow-[0_0_10px_rgba(5,255,161,0.1)]` 
                  : "bg-white/5 border-white/5 text-nexus-text-dim hover:border-white/10"
              )}
              title={`${id} Mode`}
            >
              <config.icon className={cn("w-4 h-4", personality === id && config.color)} />
            </button>
          ))}
        </div>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 pr-4 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 group",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1",
                msg.role === "user" ? "bg-white/10" : "bg-nexus-accent/20 border border-nexus-accent/30"
              )}>
                {msg.role === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  msg.personality ? (
                    <div className={PERSONALITIES[msg.personality].color}>
                      {(() => {
                        const Icon = PERSONALITIES[msg.personality].icon;
                        return <Icon className="w-4 h-4" />;
                      })()}
                    </div>
                  ) : <Bot className="w-4 h-4 text-nexus-accent" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className={cn(
                  "max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed relative",
                  msg.role === "user" 
                    ? "ml-auto bg-white/5 border border-white/10 rounded-tr-none" 
                    : "glass rounded-tl-none prose prose-invert prose-sm max-w-none shadow-[0_0_20px_rgba(0,0,0,0.3)]"
                )}>
                  {msg.type === "image" && msg.attachments?.[0] ? (
                    <div className="space-y-3">
                      <div className="relative group/img overflow-hidden rounded-xl border border-white/10">
                        <img src={msg.attachments[0]} alt="Neural Generated" className="w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <button 
                            onClick={() => handleShare(`Check out this visual synthesis from NEXUS ONE: ${msg.content}`, msg.attachments?.[0])}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md"
                            title="Share Neural Asset"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleCopy(msg.attachments![0], i)}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md"
                            title="Copy Asset URI"
                          >
                            {copiedId === i ? <Check className="w-4 h-4 text-nexus-accent" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button className="p-2 bg-nexus-accent text-black rounded-lg" title="Add to Matrix">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-nexus-text-dim italic">{msg.content}</p>
                    </div>
                  ) : msg.role === "assistant" ? (
                    <div className="relative">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                      <div className="absolute -right-2 -bottom-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0 duration-300">
                        <button 
                          onClick={() => handleCopy(msg.content, i)}
                          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 hover:text-nexus-accent hover:border-nexus-accent/50 transition-all group/btn"
                          title="Copy to Neural Clipboard"
                        >
                          {copiedId === i ? <Check className="w-3 h-3 text-nexus-accent" /> : <Copy className="w-3 h-3" />}
                          <span className="text-[10px] font-mono hidden group-hover/btn:inline uppercase tracking-tighter">Copy</span>
                        </button>
                        <button 
                          onClick={() => handleShare(msg.content)}
                          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 hover:text-nexus-accent hover:border-nexus-accent/50 transition-all group/btn"
                          title="Broadcast to External Node"
                        >
                          <Share2 className="w-3 h-3" />
                          <span className="text-[10px] font-mono hidden group-hover/btn:inline uppercase tracking-tighter">Share</span>
                        </button>
                        <button 
                          onClick={() => speakMessage(msg.content)}
                          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 hover:text-nexus-accent hover:border-nexus-accent/50 transition-all group/btn"
                          title="Neural Voice Output"
                        >
                          <Volume2 className={cn("w-3 h-3", isSpeaking && "animate-pulse")} />
                          <span className="text-[10px] font-mono hidden group-hover/btn:inline uppercase tracking-tighter">Voice</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {(isLoading || isGeneratingImage) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4"
          >
            <div className="w-8 h-8 rounded-lg bg-nexus-accent/20 border border-nexus-accent/30 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-nexus-accent animate-spin" />
            </div>
            <div className="glass p-4 rounded-2xl rounded-tl-none min-w-[200px]">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono text-nexus-accent uppercase tracking-widest animate-pulse">
                  {isGeneratingImage ? "SYNTHESIZING VISUAl ASSET..." : "SYNCING NEURAL CORE..."}
                </span>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-nexus-accent"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="mt-6">
        <AnimatePresence>
          {isBlogMode && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-4 glass border border-nexus-accent/20 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(5,255,161,0.05)]"
            >
              <div className="p-4 border-b border-white/5 bg-nexus-accent/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-nexus-accent" />
                  <span className="text-xs font-mono font-bold uppercase tracking-widest">Neural Blog Architect</span>
                </div>
                <button 
                  onClick={() => setIsBlogMode(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-nexus-text-dim" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest pl-1">Protocol Title</label>
                  <input 
                    type="text"
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    placeholder="Enter visionary title..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-nexus-accent/30 transition-all font-display"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest pl-1">Tags / Keywords (Comma separated)</label>
                  <input 
                    type="text"
                    value={blogKeywords}
                    onChange={(e) => setBlogKeywords(e.target.value)}
                    placeholder="AI, Futurism, Nexus, Matrix..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-nexus-accent/30 transition-all font-mono"
                  />
                </div>
                <button 
                  onClick={handleGenerateBlog}
                  disabled={!blogTitle.trim() || isLoading}
                  className="w-full bg-nexus-accent text-black font-bold uppercase tracking-[0.2em] py-3 rounded-xl hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4 group-hover:animate-pulse" />
                      Synthesize Content
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative glass p-2 rounded-2xl flex items-center gap-2 border border-white/10 group focus-within:border-nexus-accent/30 transition-all">
          <button 
            onClick={() => setIsBlogMode(!isBlogMode)}
            className={cn(
              "p-3 transition-colors relative rounded-xl",
              isBlogMode ? "bg-nexus-accent/20 text-nexus-accent" : "text-nexus-text-dim hover:text-white"
            )}
            title="Open Neural Blog Architect"
          >
            <FileText className="w-5 h-5" />
            {!isBlogMode && !blogTitle && <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-nexus-accent rounded-full animate-ping" />}
          </button>
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isGeneratingImage ? "Describing neural asset..." : isImageMode ? "Describe visual for synthesis... (Ex: Futurism city, 8k)" : "Initiate command interface..."}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-nexus-text-dim py-2"
          />
          <div className="flex items-center gap-1 pr-2">
            <div className="relative group/ratio">
              <button 
                className={cn(
                  "p-2 hover:bg-white/5 transition-all rounded-xl flex items-center gap-1",
                  isImageMode ? "text-nexus-accent" : "text-nexus-text-dim"
                )}
                onClick={() => setIsImageMode(!isImageMode)}
              >
                <ImageIcon className="w-4 h-4" />
                <span className="text-[10px] font-mono font-bold">{selectedAspectRatio}</span>
              </button>
              <div className="absolute bottom-full right-0 mb-2 p-1 glass border border-white/10 rounded-xl hidden group-hover/ratio:block min-w-[120px] z-50">
                <div className="p-2 border-b border-white/5">
                  <p className="text-[8px] font-mono text-nexus-text-dim uppercase mb-2">Aspect Ratio</p>
                  <div className="grid grid-cols-2 gap-1">
                    {["1:1", "16:9", "9:16", "4:3", "3:2", "1:4", "8:1"].map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setSelectedAspectRatio(ratio)}
                        className={cn(
                          "px-2 py-1 rounded-lg text-[9px] font-mono transition-colors",
                          selectedAspectRatio === ratio ? "bg-nexus-accent text-black" : "text-nexus-text-dim hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-[8px] font-mono text-nexus-text-dim uppercase mb-2">Resolution</p>
                  <div className="grid grid-cols-2 gap-1">
                    {["512px", "1K", "2K", "4K"].map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedImageSize(size)}
                        className={cn(
                          "px-2 py-1 rounded-lg text-[9px] font-mono transition-colors",
                          selectedImageSize === size ? "bg-nexus-accent text-black" : "text-nexus-text-dim hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={toggleVoiceCapture}
              className={cn(
                "p-2 rounded-xl transition-all",
                isCapturingVoice ? "bg-red-500/20 text-red-400 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "hover:bg-white/5 text-nexus-text-dim"
              )}
              title="Neural Voice Intake"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsImageMode(!isImageMode)}
              className={cn(
                "p-2 transition-all rounded-xl",
                isImageMode ? "bg-nexus-accent text-black animate-pulse" : "hover:bg-white/5 text-nexus-text-dim"
              )}
              title="Toggle Image Synthesis Mode"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={handleSend}
            disabled={isLoading || isGeneratingImage || !input.trim()}
            className={cn(
              "p-3 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(5,255,161,0.2)]",
              isImageMode ? "bg-purple-500 text-white" : "bg-nexus-accent text-black hover:bg-white"
            )}
          >
            {isImageMode ? <Sparkles className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        
      <div className="mt-4 flex items-center justify-between px-2">
          <div className="flex gap-4">
            {[
              { label: "Market Intel", icon: TrendingUp },
              { label: "Neural Image", icon: ImageIcon, cmd: "/image futuristic city" },
              { label: "Strategy", icon: Layers }
            ].map((suggestion, i) => (
              <button 
                key={i}
                onClick={() => setInput(suggestion.cmd || suggestion.label)}
                className="text-[10px] font-mono uppercase tracking-widest text-nexus-text-dim hover:text-nexus-accent transition-colors flex items-center gap-2 group/sug"
              >
                <suggestion.icon className="w-3 h-3 group-hover/sug:scale-110 transition-transform" />
                {suggestion.label}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowHistory(true)}
            className="text-[10px] font-mono uppercase tracking-widest text-nexus-text-dim hover:text-white flex items-center gap-1 group"
          >
            <History className="w-3 h-3 transition-transform group-hover:rotate-12" />
            Neural History
          </button>
        </div>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
            >
              <div className="glass w-full max-w-2xl h-[80vh] rounded-3xl overflow-hidden flex flex-col border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <header className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-nexus-accent" />
                    <h3 className="text-lg font-display font-bold uppercase tracking-tight">Neural Repository</h3>
                  </div>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </header>

                <div className="p-4 border-b border-white/5">
                  <div className="relative">
                    <input 
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="SEARCH NEURAL ARCHIVES..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono outline-none focus:border-nexus-accent/30 transition-all pl-10"
                    />
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nexus-text-dim" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  <button 
                    onClick={createNewSession}
                    className="w-full p-4 rounded-2xl bg-nexus-accent/10 border border-nexus-accent/30 flex items-center justify-between group hover:bg-nexus-accent/20 transition-all mb-4"
                  >
                    <div className="flex items-center gap-3 text-nexus-accent">
                      <Plus className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-widest">Initiate New Protocol</span>
                    </div>
                    <Zap className="w-4 h-4 text-nexus-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  {filteredSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 opacity-40">
                      <BrainCircuit className="w-12 h-12 mb-4" />
                      <p className="text-xs font-mono">NO SYNCED PROTOCOLS DETECTED</p>
                    </div>
                  ) : (
                    filteredSessions.map(session => (
                      <button
                        key={session.id}
                        onClick={() => {
                          setActiveSessionId(session.id);
                          setShowHistory(false);
                        }}
                        className={cn(
                          "w-full p-4 rounded-2xl border transition-all text-left group relative",
                          activeSessionId === session.id 
                            ? "bg-white/10 border-nexus-accent/50" 
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className={cn(
                            "text-sm font-bold truncate pr-8",
                            activeSessionId === session.id ? "text-nexus-accent" : "text-white"
                          )}>
                            {session.title}
                          </h4>
                          <span className="text-[10px] font-mono text-nexus-text-dim">
                            {new Date(session.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-nexus-text-dim line-clamp-1 italic mb-2">
                          {session.messages[session.messages.length - 1].content.substring(0, 100)}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={cn("px-2 py-0.5 rounded-md bg-white/5 text-[8px] font-bold uppercase tracking-tighter", PERSONALITIES[session.personality].color)}>
                              {session.personality} Mode
                            </div>
                            <span className="text-[9px] font-mono text-nexus-text-dim opacity-60">
                              {session.messages.length} NODES
                            </span>
                          </div>
                          <button 
                            onClick={(e) => deleteSession(session.id, e)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-nexus-text-dim hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
