import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Sparkles, 
  Palette, 
  Volume2, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  Activity,
  Check,
  ChevronRight,
  Info,
  Layers,
  Settings,
  X,
  Mic,
  MicOff
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Module } from "@/src/types";

interface Avatar {
  id: string;
  name: string;
  personality: string;
  description: string;
  style: "Ethereal" | "Cyberpunk" | "Minimalist";
  color: string;
  image: string;
  traits: string[];
}

const AVATARS: Avatar[] = [
  { 
    id: "aura", 
    name: "Aura", 
    personality: "Strategic & Calm", 
    description: "A holographic synthesis of pure nexus energy. Balanced, analytical, and highly intuitive.",
    style: "Ethereal",
    color: "blue",
    image: "https://picsum.photos/seed/aura-nexus/400/400",
    traits: ["Deep Analysis", "Calm Logic", "Intuitive Routing"]
  },
  { 
    id: "nova", 
    name: "Nova", 
    personality: "Dynamic & Precise", 
    description: "High-octane mechanical consciousness optimized for speed and aggressive performance mapping.",
    style: "Cyberpunk",
    color: "purple",
    image: "https://picsum.photos/seed/nova-cyber/400/400",
    traits: ["Overclocked Logic", "Real-time Auditing", "Threat Neutralization"]
  },
  { 
    id: "echo", 
    name: "Echo", 
    personality: "Adaptive & Helpful", 
    description: "Geometric humanoid construct designed for seamless multi-environment adaptation and user harmony.",
    style: "Minimalist",
    color: "cyan",
    image: "https://picsum.photos/seed/echo-geom/400/400",
    traits: ["Perfect Sync", "Humanoid Empathy", "Adaptive UI Scaling"]
  }
];

export const AIAssistant = () => {
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar>(AVATARS[0]);
  const [customization, setCustomization] = useState({
    themeIntensity: 60,
    vocalPitch: 42,
    renderLegacy: false,
    neonSync: true
  });

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastCommand, setLastCommand] = useState("");
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.interimResults = true;
    recognitionRef.current.continuous = false;

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);
    
    recognitionRef.current.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcriptValue = event.results[current][0].transcript;
      setTranscript(transcriptValue);

      if (event.results[current].isFinal) {
        processCommand(transcriptValue.toLowerCase());
        setLastCommand(transcriptValue);
        setTimeout(() => setTranscript(""), 2000);
      }
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const processCommand = (command: string) => {
    const triggerNavigation = (moduleId: string) => {
      window.dispatchEvent(new CustomEvent('nexus-navigate', { detail: moduleId }));
    };

    if (command.includes("open") || command.includes("go to") || command.includes("navigate to")) {
      if (command.includes("dashboard") || command.includes("center")) triggerNavigation(Module.DASHBOARD);
      else if (command.includes("marketing")) triggerNavigation(Module.MARKETING);
      else if (command.includes("social")) triggerNavigation(Module.SOCIAL);
      else if (command.includes("sales")) triggerNavigation(Module.SALES);
      else if (command.includes("settings")) triggerNavigation(Module.SETTINGS);
      else if (command.includes("ar") || command.includes("augmented")) triggerNavigation(Module.AR_VIEW);
      else if (command.includes("ai") || command.includes("engine")) triggerNavigation(Module.AI_ENGINE);
      else if (command.includes("deployment")) triggerNavigation(Module.DEPLOYMENT);
      else if (command.includes("forms") || command.includes("docs")) triggerNavigation(Module.DOCS);
      else if (command.includes("cloud") || command.includes("parameter")) triggerNavigation(Module.CLOUD_CONFIG);
    }
    
    if (command.includes("set avatar to") || command.includes("change avatar to")) {
      const found = AVATARS.find(a => command.includes(a.name.toLowerCase()));
      if (found) setSelectedAvatar(found);
    }

    if (command.includes("toggle neon") || command.includes("toggle neon sync")) {
      setCustomization(prev => ({ ...prev, neonSync: !prev.neonSync }));
    }
  };

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto custom-scrollbar">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight neon-text uppercase">Avatar Sync</h1>
          <p className="text-nexus-text-dim mt-2 tracking-widest text-[10px] uppercase font-mono">
            Neural Personality Matrix <span className="text-nexus-accent ml-2">// CONFIG_v.2.0</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass px-4 py-2 rounded-xl flex items-center gap-2">
            <Zap className="w-4 h-4 text-nexus-accent" />
            <span className="text-xs font-mono uppercase tracking-tighter">Sync State: 100%</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Avatar Selection */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-nexus-text-dim font-mono uppercase tracking-widest">Select Neural Personality</p>
            <div className="flex items-center gap-4">
              <AnimatePresence>
                {lastCommand && !transcript && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    className="text-[9px] font-mono text-nexus-text-dim uppercase"
                  >
                    Last: {lastCommand}
                  </motion.p>
                )}
                {transcript && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-2 px-3 py-1 bg-nexus-accent/10 border border-nexus-accent/20 rounded-lg"
                  >
                    <Activity className="w-3 h-3 text-nexus-accent animate-pulse" />
                    <span className="text-[10px] font-mono text-nexus-accent whitespace-nowrap">{transcript}...</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <button 
                onClick={startListening}
                className={cn(
                  "p-3 rounded-full transition-all relative group",
                  isListening ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "bg-nexus-accent hover:bg-white"
                )}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-black" />
                )}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-nexus-bg border border-white/10 px-3 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest">
                  {isListening ? "Stop Listening" : "Voice Commands"}
                </div>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {AVATARS.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => setSelectedAvatar(avatar)}
                className={cn(
                  "glass p-4 rounded-3xl border-2 transition-all relative overflow-hidden group",
                  selectedAvatar.id === avatar.id ? "border-nexus-accent bg-nexus-accent/5" : "border-white/5 hover:border-white/20"
                )}
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-black">
                  <img 
                    src={avatar.image} 
                    alt={avatar.name} 
                    className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className={cn(
                    "absolute inset-0 opacity-20",
                    avatar.color === "blue" ? "bg-blue-500" : avatar.color === "purple" ? "bg-purple-500" : "bg-cyan-500"
                  )} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight text-white">{avatar.name}</h3>
                <p className="text-[10px] text-nexus-text-dim uppercase font-mono mt-1">{avatar.personality}</p>
                
                {selectedAvatar.id === avatar.id && (
                  <div className="absolute top-2 right-2 p-1.5 rounded-full bg-nexus-accent text-black">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="glass p-8 rounded-[40px] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles className="w-32 h-32 text-nexus-accent" />
            </div>
            
            <div className="flex flex-col lg:flex-row gap-8 items-center">
              <div className="relative w-48 h-48 shrink-0">
                <div className="absolute inset-0 rounded-full border-2 border-nexus-accent/20 animate-[spin_10s_linear_infinite]" />
                <div className="absolute inset-2 rounded-full border border-dashed border-nexus-accent/10 animate-[spin_15s_linear_infinite_reverse]" />
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-nexus-accent p-1 shadow-[0_0_30px_rgba(5,255,161,0.2)]">
                  <img 
                    src={selectedAvatar.image} 
                    alt={selectedAvatar.name}
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight">{selectedAvatar.name} Profile</h2>
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-nexus-text-dim uppercase">
                    ID: {selectedAvatar.id.toUpperCase()}
                  </div>
                </div>
                <p className="text-nexus-text-dim text-sm leading-relaxed max-w-xl">
                  {selectedAvatar.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedAvatar.traits.map((trait, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-nexus-accent/10 border border-nexus-accent/20 text-[10px] font-bold text-nexus-accent uppercase">
                      <Zap className="w-3 h-3" />
                      {trait}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customization */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-6 rounded-3xl space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-5 h-5 text-nexus-accent" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white">Neural Personalization</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-nexus-text-dim uppercase">
                  <span>Theme Intensity</span>
                  <span className="text-nexus-accent">{customization.themeIntensity}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={customization.themeIntensity}
                  onChange={(e) => setCustomization(prev => ({ ...prev, themeIntensity: parseInt(e.target.value) }))}
                  className="w-full appearance-none h-1 bg-white/10 rounded-full accent-nexus-accent"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-nexus-text-dim uppercase">
                  <span>Vocal Signature</span>
                  <span className="text-nexus-accent">{customization.vocalPitch} Hz</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={customization.vocalPitch}
                  onChange={(e) => setCustomization(prev => ({ ...prev, vocalPitch: parseInt(e.target.value) }))}
                  className="w-full appearance-none h-1 bg-white/10 rounded-full accent-nexus-accent"
                />
              </div>

              <div className="pt-4 space-y-3">
                <button 
                  onClick={() => setCustomization(prev => ({ ...prev, neonSync: !prev.neonSync }))}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-nexus-accent/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-nexus-accent" />
                    <span className="text-[10px] font-bold uppercase text-white">Neon Sync Processing</span>
                  </div>
                  <div className={cn(
                    "w-10 h-5 rounded-full relative transition-colors",
                    customization.neonSync ? "bg-nexus-accent" : "bg-white/10"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                      customization.neonSync ? "left-6" : "left-1"
                    )} />
                  </div>
                </button>

                <button 
                  onClick={() => setCustomization(prev => ({ ...prev, renderLegacy: !prev.renderLegacy }))}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-nexus-accent/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] font-bold uppercase text-white">Legacy Projection Mode</span>
                  </div>
                  <div className={cn(
                    "w-10 h-5 rounded-full relative transition-colors",
                    customization.renderLegacy ? "bg-purple-500" : "bg-white/10"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                      customization.renderLegacy ? "left-6" : "left-1"
                    )} />
                  </div>
                </button>
              </div>
            </div>

            <button className="w-full py-4 bg-nexus-accent text-black font-bold rounded-2xl hover:shadow-[0_0_30px_rgba(5,255,161,0.4)] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-xs">
              Personalize Global Interface
            </button>
          </div>

          <div className="glass p-6 rounded-3xl border border-red-500/20 bg-red-500/5 space-y-4">
            <div className="flex items-center gap-3">
              <Info className="w-4 h-4 text-red-400" />
              <h4 className="text-[10px] font-bold uppercase text-red-400 tracking-widest">Protocol Warning</h4>
            </div>
            <p className="text-[10px] text-red-400/80 leading-relaxed font-mono italic">
              "Personality sync is irreversible for the next 24 neural cycles. Ensure compatibility with the current mission profile."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
