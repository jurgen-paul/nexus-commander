import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Network, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Info, 
  Pencil, 
  Check, 
  AlertCircle,
  Database,
  Cpu,
  Package,
  Layers,
  MousePointer2,
  Grab,
  Maximize2
} from "lucide-react";
import { cn } from "@/src/lib/utils";

interface DependencyNode {
  id: string;
  label: string;
  type: "app" | "service" | "pkg" | "db";
  desc: string;
}

interface DependencyEdge {
  from: string;
  to: string;
}

interface Pos {
  x: number;
  y: number;
}

const COLORS = {
  app:     { fill: 'rgba(55, 138, 221, 0.1)', stroke: '#378ADD', text: '#378ADD' },
  service: { fill: 'rgba(29, 158, 117, 0.1)', stroke: '#1D9E75', text: '#1D9E75' },
  pkg:     { fill: 'rgba(186, 117, 23, 0.1)', stroke: '#BA7517', text: '#BA7517' },
  db:      { fill: 'rgba(212, 83, 126, 0.1)', stroke: '#D4537E', text: '#D4537E' },
};

const DEFAULT_DATA = {
  nodes: [
    { id: 'web',     label: 'Web App',      type: 'app',     desc: 'React SPA served via CDN' },
    { id: 'mobile',  label: 'Mobile App',   type: 'app',     desc: 'React Native iOS / Android' },
    { id: 'gateway', label: 'API Gateway',  type: 'service', desc: 'Rate limiting, auth routing' },
    { id: 'auth',    label: 'Auth Service', type: 'service', desc: 'JWT / OAuth2 provider' },
    { id: 'orders',  label: 'Orders API',   type: 'service', desc: 'Manages order lifecycle' },
    { id: 'payments',label: 'Payments API', type: 'service', desc: 'Stripe integration layer' },
    { id: 'redis',   label: 'Redis',        type: 'db',      desc: 'Session & cache store' },
    { id: 'pg',      label: 'PostgreSQL',   type: 'db',      desc: 'Primary relational store' },
    { id: 'express', label: 'Express',      type: 'pkg',     desc: 'Node.js HTTP framework' },
    { id: 'prisma',  label: 'Prisma',       type: 'pkg',     desc: 'ORM for PostgreSQL' },
    { id: 'queue',   label: 'Message Queue',type: 'service', desc: 'RabbitMQ async jobs' },
  ] as DependencyNode[],
  edges: [
    { from: 'web',     to: 'gateway' },
    { from: 'mobile',  to: 'gateway' },
    { from: 'gateway', to: 'auth' },
    { from: 'gateway', to: 'orders' },
    { from: 'gateway', to: 'payments' },
    { from: 'auth',    to: 'redis' },
    { from: 'orders',  to: 'pg' },
    { from: 'orders',  to: 'queue' },
    { from: 'payments',to: 'pg' },
    { from: 'orders',  to: 'prisma' },
    { from: 'payments',to: 'express' },
    { from: 'orders',  to: 'express' },
  ] as DependencyEdge[]
};

export const DependencyMap = () => {
  const [data, setData] = useState(DEFAULT_DATA);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [jsonInput, setJsonInput] = useState(JSON.stringify(DEFAULT_DATA, null, 2));
  const [jsonError, setJsonError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const positionsRef = useRef<Record<string, Pos>>({});

  // Layout Logic
  useEffect(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    
    const n = data.nodes;
    const layers = [
      n.filter(x => x.type === 'app').map(x => x.id),
      n.filter(x => x.id === 'gateway').map(x => x.id),
      n.filter(x => x.type === 'service' && x.id !== 'gateway').map(x => x.id),
      n.filter(x => x.type === 'pkg' || x.type === 'db').map(x => x.id),
    ];

    const newPositions: Record<string, Pos> = {};
    layers.forEach((layer, li) => {
      const y = 80 + li * 120;
      const step = width / (layer.length + 1);
      layer.forEach((id, i) => {
        newPositions[id] = { x: step * (i + 1), y };
      });
    });
    positionsRef.current = newPositions;
    draw();
  }, [data]);

  const visibleNodes = useMemo(() => {
    return data.nodes.filter(n => {
      if (filterType !== 'all' && n.type !== filterType) return false;
      if (searchTerm && !n.label.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [data.nodes, filterType, searchTerm]);

  const visibleEdges = useMemo(() => {
    const s = new Set(visibleNodes.map(n => n.id));
    return data.edges.filter(e => s.has(e.from) && s.has(e.to));
  }, [data.edges, visibleNodes]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const scale = window.devicePixelRatio || 1;
    ctx.save();
    
    // Draw edges
    visibleEdges.forEach(e => {
      const a = positionsRef.current[e.from];
      const b = positionsRef.current[e.to];
      if (!a || !b) return;

      const sa = { x: a.x * zoom + pan.x, y: a.y * zoom + pan.y };
      const sb = { x: b.x * zoom + pan.x, y: b.y * zoom + pan.y };
      
      const isDimmed = selectedId && selectedId !== e.from && selectedId !== e.to;
      ctx.globalAlpha = isDimmed ? 0.1 : 0.4;
      ctx.strokeStyle = '#888780';
      ctx.lineWidth = 1.5 * zoom;
      
      const dx = sb.x - sa.x;
      const dy = sb.y - sa.y;
      const len = Math.sqrt(dx*dx + dy*dy);
      const nr = 40 * zoom / len;
      const ex = sb.x - dx * nr;
      const ey = sb.y - dy * nr;

      ctx.beginPath();
      ctx.moveTo(sa.x, sa.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Arrow head
      const angle = Math.atan2(dy, dx);
      const hs = 8 * zoom;
      ctx.fillStyle = '#888780';
      ctx.beginPath();
      ctx.moveTo(ex + Math.cos(angle) * hs, ey + Math.sin(angle) * hs);
      ctx.lineTo(ex + Math.cos(angle - 2.4) * hs * 0.7, ey + Math.sin(angle - 2.4) * hs * 0.7);
      ctx.lineTo(ex + Math.cos(angle + 2.4) * hs * 0.7, ey + Math.sin(angle + 2.4) * hs * 0.7);
      ctx.closePath();
      ctx.fill();
    });

    // Draw nodes
    const NW = 110, NH = 40, R = 12;
    visibleNodes.forEach(node => {
      const p = positionsRef.current[node.id];
      if (!p) return;

      const s = { x: p.x * zoom + pan.x, y: p.y * zoom + pan.y };
      const nx = s.x - (NW * zoom) / 2, ny = s.y - (NH * zoom) / 2;
      const nw = NW * zoom, nh = NH * zoom, rr = R * zoom;
      
      const isNeighbor = selectedId && data.edges.some(e => 
        (e.from === selectedId && e.to === node.id) || (e.to === selectedId && e.from === node.id)
      );
      const isSelected = selectedId === node.id;
      const isDimmed = selectedId && !isSelected && !isNeighbor;

      ctx.globalAlpha = isDimmed ? 0.2 : 1;

      // Glow effect for selected or neighbors
      if (isSelected || isNeighbor) {
        ctx.shadowColor = COLORS[node.type].stroke;
        ctx.shadowBlur = (isSelected ? 15 : 8) * zoom;
      }

      // Rounded Rect
      ctx.fillStyle = COLORS[node.type].fill;
      ctx.strokeStyle = isSelected ? COLORS[node.type].stroke : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = (isSelected ? 2 : 1) * zoom;
      
      ctx.beginPath();
      ctx.roundRect(nx, ny, nw, nh, rr);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Text
      ctx.fillStyle = isSelected ? '#fff' : COLORS[node.type].text;
      ctx.font = `600 ${Math.round(13 * zoom)}px font-mono`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label.toUpperCase(), s.x, s.y);
    });

    ctx.restore();
  };

  useEffect(() => {
    draw();
  }, [visibleNodes, visibleEdges, zoom, pan, selectedId]);

  // Interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return;
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    
    // Check hit
    const NW = 110, NH = 40;
    const hit = [...visibleNodes].reverse().find(n => {
      const p = positionsRef.current[n.id];
      if (!p) return false;
      const s = { x: p.x * zoom + pan.x, y: p.y * zoom + pan.y };
      return mx >= s.x - (NW * zoom) / 2 && mx <= s.x + (NW * zoom) / 2 &&
             my >= s.y - (NH * zoom) / 2 && my <= s.y + (NH * zoom) / 2;
    });

    if (hit) {
      setSelectedId(prev => prev === hit.id ? null : hit.id);
    } else {
      setIsDragging(true);
      lastPosRef.current = { x: mx, y: my };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return;
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    setPan(prev => ({
      x: prev.x + (mx - lastPosRef.current.x),
      y: prev.y + (my - lastPosRef.current.y)
    }));
    lastPosRef.current = { x: mx, y: my };
  };

  const handleWheel = (e: React.WheelEvent) => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return;
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const delta = e.deltaY < 0 ? 1.05 : 0.95;
    const newZoom = Math.min(Math.max(zoom * delta, 0.4), 3);
    
    setZoom(newZoom);
    setPan(prev => ({
      x: mx - (mx - prev.x) * delta,
      y: my - (my - prev.y) * delta
    }));
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.nodes || !parsed.edges) throw new Error("Missing nodes/edges protocol");
      setData(parsed);
      setJsonError("");
      setIsEditing(false);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid Matrix JSON");
    }
  };

  const selectedNode = data.nodes.find(n => n.id === selectedId);

  return (
    <div className="flex flex-col h-full bg-[#050608] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--nexus-accent)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Toolbar */}
      <header className="h-20 border-b border-white/5 bg-nexus-accent/5 backdrop-blur-xl px-8 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-nexus-accent/10 flex items-center justify-center border border-nexus-accent/20">
              <Network className="w-5 h-5 text-nexus-accent" />
            </div>
            <div>
              <h1 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-nexus-accent">Neural Dependency Map</h1>
              <p className="text-[10px] text-nexus-text-dim uppercase font-mono tracking-tighter">System Topology Visualizer v2.4</p>
            </div>
          </div>

          <div className="h-8 w-px bg-white/10 mx-2" />

          <div className="flex items-center gap-2">
            {['all', 'app', 'service', 'pkg', 'db'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-all uppercase tracking-tighter",
                  filterType === t 
                    ? "bg-nexus-accent/20 border-nexus-accent/30 text-nexus-accent" 
                    : "bg-white/5 border-white/5 text-nexus-text-dim hover:bg-white/10 hover:text-white"
                )}
              >
                {t}s
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-nexus-text-dim group-focus-within:text-nexus-accent transition-colors" />
            <input 
              type="text" 
              placeholder="Filter nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-nexus-accent/40 w-48 transition-all font-mono"
            />
          </div>
          <button 
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-nexus-accent/40 text-nexus-text-dim hover:text-nexus-accent transition-all"
            title="Reset Matrix View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "p-2.5 rounded-xl border transition-all",
              isEditing ? "bg-nexus-accent text-black border-nexus-accent" : "bg-white/5 border-white/10 hover:border-nexus-accent/40 text-nexus-text-dim hover:text-nexus-accent"
            )}
            title="Edit Protocol JSON"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <div className="flex-1 relative flex overflow-hidden">
        <div 
          ref={containerRef}
          className="flex-1 relative cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onWheel={handleWheel}
        >
          <canvas 
            ref={canvasRef}
            width={1200}
            height={800}
            className="block w-full h-full"
          />

          {/* Canvas Scanline Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%]" />

          {/* Interaction Guide */}
          <div className="absolute left-8 bottom-8 flex gap-6 text-[9px] font-mono text-nexus-text-dim uppercase tracking-widest opacity-60">
            <div className="flex items-center gap-2">
              <Grab className="w-3 h-3" /> Drag to Pan
            </div>
            <div className="flex items-center gap-2">
              <Maximize2 className="w-3 h-3" /> Scroll to Zoom
            </div>
            <div className="flex items-center gap-2">
              <MousePointer2 className="w-3 h-3" /> Click for Nodes
            </div>
          </div>
        </div>

        {/* Selected Info Sidebar */}
        <AnimatePresence>
          {selectedId && (
            <motion.aside
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="w-96 border-l border-white/5 bg-[#050608]/80 backdrop-blur-2xl relative z-30 p-8 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] h-full overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase",
                  `bg-${selectedNode?.type === 'app' ? 'blue' : selectedNode?.type === 'service' ? 'emerald' : selectedNode?.type === 'pkg' ? 'amber' : 'rose'}-500/20`,
                  `text-${selectedNode?.type === 'app' ? 'blue' : selectedNode?.type === 'service' ? 'emerald' : selectedNode?.type === 'pkg' ? 'amber' : 'rose'}-400`
                )}>
                  {selectedNode?.type} module
                </div>
                <button 
                  onClick={() => setSelectedId(null)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-nexus-text-dim" />
                </button>
              </div>

              <h2 className="text-3xl font-display font-bold text-white mb-2">{selectedNode?.label}</h2>
              <p className="text-nexus-text-dim text-sm leading-relaxed mb-10">{selectedNode?.desc}</p>

              <div className="space-y-8">
                <div>
                  <h3 className="text-[10px] font-mono text-nexus-accent uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" /> Direct Dependencies
                  </h3>
                  <div className="space-y-2">
                    {data.edges.filter(e => e.from === selectedId).map(e => {
                      const target = data.nodes.find(n => n.id === e.to);
                      return (
                        <div key={e.to} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                          <span className="text-sm font-medium">{target?.label}</span>
                          <span className="text-[9px] font-mono text-nexus-text-dim uppercase">{target?.type}</span>
                        </div>
                      );
                    })}
                    {data.edges.filter(e => e.from === selectedId).length === 0 && (
                      <p className="text-[10px] text-nexus-text-dim italic">No downstream dependencies detected.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-mono text-nexus-accent uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Database className="w-3.5 h-3.5" /> Consumed By
                  </h3>
                  <div className="space-y-2">
                    {data.edges.filter(e => e.to === selectedId).map(e => {
                      const source = data.nodes.find(n => n.id === e.from);
                      return (
                        <div key={e.from} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                          <span className="text-sm font-medium">{source?.label}</span>
                          <span className="text-[9px] font-mono text-nexus-text-dim uppercase">{source?.type}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 rounded-2xl bg-nexus-accent/5 border border-nexus-accent/10">
                <div className="flex items-center gap-2 mb-2 text-nexus-accent">
                  <Info className="w-4 h-4" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Protocol Metadata</span>
                </div>
                <div className="space-y-2 text-[10px] font-mono text-nexus-text-dim">
                  <div className="flex justify-between">
                    <span>Identity:</span>
                    <span className="text-white">{selectedId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Integrity:</span>
                    <span className="text-nexus-accent">VERIFIED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Matrix Node:</span>
                    <span className="text-white">NODE_{Math.floor(Math.random() * 999)}</span>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* JSON Editor Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-8 backdrop-blur-xl bg-black/60"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-2xl glass border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(5,255,161,0.1)]"
            >
              <div className="p-6 border-b border-white/5 bg-nexus-accent/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-nexus-accent">
                  <Pencil className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase tracking-[0.2em]">Matrix Protocol Configuration</span>
                </div>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-nexus-text-dim" />
                </button>
              </div>
              <div className="p-6">
                <textarea 
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full h-96 bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-xs text-nexus-text-dim focus:text-white outline-none focus:border-nexus-accent/40 transition-all resize-none scrollbar-nexus"
                  placeholder="Paste Matrix JSON..."
                />
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-[10px] font-mono text-red-400 uppercase tracking-widest">{jsonError}</p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-nexus-text-dim hover:text-white transition-colors"
                    >
                      Abort
                    </button>
                    <button 
                      onClick={applyJson}
                      className="px-8 py-2 bg-nexus-accent text-black font-bold text-xs rounded-xl hover:bg-white transition-all uppercase tracking-widest flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Apply Protocol
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="h-10 border-t border-white/5 bg-black px-8 flex items-center gap-8 z-20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#378ADD]" />
          <span className="text-[9px] font-mono text-nexus-text-dim uppercase tracking-tighter">Application</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#1D9E75]" />
          <span className="text-[9px] font-mono text-nexus-text-dim uppercase tracking-tighter">Microservice</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#BA7517]" />
          <span className="text-[9px] font-mono text-nexus-text-dim uppercase tracking-tighter">Package</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#D4537E]" />
          <span className="text-[9px] font-mono text-nexus-text-dim uppercase tracking-tighter">Database</span>
        </div>
      </footer>
    </div>
  );
};
