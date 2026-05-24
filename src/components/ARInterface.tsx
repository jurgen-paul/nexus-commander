import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { 
  Box, 
  Layers, 
  Navigation, 
  Zap, 
  Layout, 
  Maximize2, 
  ChevronRight,
  Target,
  Activity,
  Cpu,
  Globe,
  Maximize,
  Compass
} from "lucide-react";
import { cn } from "@/src/lib/utils";

interface SpatialWidget {
  id: string;
  title: string;
  x: number;
  y: number;
  z: number;
  icon: any;
  color: string;
  value: string;
}

const SPATIAL_WIDGETS: SpatialWidget[] = [
  { id: "core", title: "SYSTEM CORE", x: 0, y: 0, z: 100, icon: Cpu, color: "text-nexus-accent", value: "STABLE" },
  { id: "net", title: "GRID STATUS", x: 150, y: -80, z: 50, icon: Globe, color: "text-blue-400", value: "942 Mbps" },
  { id: "psy", title: "NEURAL LOAD", x: -150, y: 100, z: 70, icon: Activity, color: "text-purple-400", value: "24%" },
  { id: "nav", title: "VECTOR PING", x: 120, y: 150, z: 30, icon: Compass, color: "text-cyan-400", value: "COORD: 42.1" },
];

export const ARInterface = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeWidget, setActiveWidget] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left - rect.width / 2) / 20,
        y: (e.clientY - rect.top - rect.height / 2) / 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-black flex items-center justify-center perspective-[1000px]"
    >
      {/* Background Grid - Spatial Reference */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* AR HUD Overlay */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-start z-50 pointer-events-none">
        <div className="space-y-1">
          <h2 className="text-nexus-accent font-mono text-[10px] tracking-[0.2em] uppercase">AR OPTICS ACTIVE</h2>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-display font-black tracking-tighter text-white">NEXUS_VISION_Pro</h1>
            <div className="px-2 py-0.5 rounded border border-nexus-accent/30 bg-nexus-accent/5 text-[8px] font-bold text-nexus-accent uppercase tracking-widest">
              LENS_v4.2
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white/40 font-mono text-[9px] uppercase tracking-tighter">LATENCY: 0.14ms</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-nexus-accent animate-pulse" />
            <span className="text-white text-[10px] font-bold font-mono tracking-widest">NEURAL_SYNC_OPTIMAL</span>
          </div>
        </div>
      </div>

      {/* Central Viewport Reticle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-30">
        <div className="w-64 h-64 border border-white/10 rounded-full flex items-center justify-center">
          <div className="w-32 h-32 border-2 border-dashed border-nexus-accent/20 rounded-full" />
          <div className="absolute w-[200px] h-[1px] bg-white/5" />
          <div className="absolute h-[200px] w-[1px] bg-white/5" />
          <Target className="w-8 h-8 text-nexus-accent opacity-50" />
        </div>
      </div>

      {/* Spatial Content Mount */}
      <motion.div 
        animate={{ 
          rotateX: -mousePos.y,
          rotateY: mousePos.x,
        }}
        transition={{ type: "spring", stiffness: 30, damping: 15 }}
        className="relative w-full h-full flex items-center justify-center preserve-3d"
      >
        {/* Holographic Core Dashboard */}
        <motion.div 
          initial={{ z: 120 }}
          className="absolute glass p-8 rounded-[40px] border border-nexus-accent/20 bg-nexus-accent/5 shadow-[0_0_50px_rgba(5,255,161,0.1)] w-[500px]"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-nexus-accent/20 text-nexus-accent">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-tight text-white">Spatial Workspace</h3>
                <p className="text-[9px] text-nexus-text-dim uppercase font-mono tracking-tighter">Instance: OMEGA_GRID_01</p>
              </div>
            </div>
            <Maximize className="w-4 h-4 text-nexus-text-dim hover:text-white cursor-pointer transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-nexus-accent/30 transition-all cursor-pointer group">
              <Layers className="w-4 h-4 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="text-[10px] font-bold uppercase text-white mb-1">Stack Depth</h4>
              <p className="text-xl font-display font-black text-white">42.8<span className="text-xs font-normal text-nexus-text-dim ml-1">ly</span></p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-nexus-accent/30 transition-all cursor-pointer group">
              <Navigation className="w-4 h-4 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="text-[10px] font-bold uppercase text-white mb-1">Drift Sync</h4>
              <p className="text-xl font-display font-black text-white">12.4<span className="text-xs font-normal text-nexus-text-dim ml-1">%</span></p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-nexus-accent" />
              <span className="text-[9px] font-mono text-nexus-text-dim uppercase">Spatial Projection Active</span>
            </div>
            <button className="px-4 py-1.5 bg-nexus-accent text-black text-[10px] font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all">
              INITIALIZE GESTURE
            </button>
          </div>
        </motion.div>

        {/* Floating Peripheral Widgets */}
        {SPATIAL_WIDGETS.map((widget) => (
          <motion.div
            key={widget.id}
            initial={{ 
              top: `calc(50% + ${widget.y}px)`,
              left: `calc(50% + ${widget.x}px)`,
              z: widget.z 
            }}
            whileHover={{ scale: 1.1, z: widget.z + 50 }}
            onHoverStart={() => setActiveWidget(widget.id)}
            onHoverEnd={() => setActiveWidget(null)}
            className={cn(
              "absolute glass p-4 rounded-3xl border border-white/10 flex items-center gap-4 cursor-pointer transition-all duration-500 min-w-[180px]",
              activeWidget === widget.id ? "bg-white/10 border-nexus-accent/30" : "bg-white/5"
            )}
          >
            <div className={cn("p-2 rounded-xl bg-white/5", widget.color)}>
              <widget.icon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[9px] font-bold uppercase text-nexus-text-dim tracking-widest">{widget.title}</h4>
              <p className="text-sm font-display font-bold text-white">{widget.value}</p>
            </div>
            <ChevronRight className="w-3 h-3 ml-auto text-nexus-text-dim" />
          </motion.div>
        ))}
      </motion.div>

      {/* AR Interaction Tips - Bottom */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-12 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-mono text-white">L</div>
          <p className="text-[9px] text-nexus-text-dim uppercase tracking-widest">DRAG TO ROTATE WORLD</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-mono text-white">R</div>
          <p className="text-[9px] text-nexus-text-dim uppercase tracking-widest">SCROLL TO ZOOM NEURAL FIELD</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-4 h-8 rounded-sm bg-nexus-accent/40" />
            <div className="w-4 h-8 rounded-sm bg-nexus-accent/20" />
          </div>
          <p className="text-[9px] text-nexus-text-dim uppercase tracking-widest">NEURAL GESTURE READY</p>
        </div>
      </div>

      {/* Global Navigation Pulse - Bottom Right */}
      <div className="absolute bottom-8 right-8 glass p-6 rounded-full border border-white/5 flex items-center justify-center pointer-events-auto cursor-pointer group">
        <Compass className="w-6 h-6 text-nexus-accent group-hover:rotate-[360deg] transition-all duration-1000" />
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-nexus-accent border-2 border-black" />
        <div className="absolute inset-0 rounded-full border border-nexus-accent/20 animate-ping" />
      </div>
    </div>
  );
};
