import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Share2, 
  TrendingUp, 
  Calendar, 
  CheckSquare, 
  Layout, 
  Settings2, 
  Plus, 
  X, 
  BarChart3,
  Users,
  MessageSquare,
  Clock,
  ArrowUpRight,
  Zap,
  LayoutDashboard,
  Globe,
  Activity,
  Cpu,
  Terminal,
  List,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldAlert,
  Inbox,
  Shield
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from "date-fns";

interface Widget {
  id: string;
  type: string;
  title: string;
  isVisible: boolean;
  order: number;
  moduleId?: string; // For pinned modules
}

const PINNABLE_MODULES = [
  { id: "SOCIAL", name: "Social Control", icon: Share2, metric: "Reach: 2.4M", trend: "+12%" },
  { id: "MARKETING", name: "Marketing Suite", icon: Zap, metric: "ROI: 4.2x", trend: "+5%" },
  { id: "SALES", name: "Sales Intelligence", icon: BarChart3, metric: "Pipeline: $1.2M", trend: "+18%" },
  { id: "AI_ENGINE", name: "AI Engine", icon: Cpu, metric: "Ops: 12k/s", trend: "Optimal" },
  { id: "SMART_INBOX", name: "Smart Inbox", icon: Inbox, metric: "Unread: 12", trend: "High Priority" },
  { id: "CLOUD_CONFIG", name: "Cloud Config", icon: Shield, metric: "Params: 4", trend: "Secure" },
  { id: "CREATOR", name: "Insta-Builder", icon: Layout, metric: "Drafts: 8", trend: "Active" },
];

const DEFAULT_WIDGETS: Widget[] = [
  { id: "stats", type: "stats", title: "Core Metrics", isVisible: true, order: 0 },
  { id: "diagnostics", type: "diagnostics", title: "Neural Diagnostics", isVisible: true, order: 1 },
  { id: "social", type: "social", title: "Social Engagement", isVisible: true, order: 2 },
  { id: "sales", type: "sales", title: "Sales Pipeline", isVisible: true, order: 3 },
  { id: "appointments", type: "appointments", title: "Upcoming Appointments", isVisible: true, order: 4 },
  { id: "tasks", type: "tasks", title: "Task Reminders", isVisible: true, order: 5 },
  { id: "pin_social", type: "pinned_module", title: "Social Control", isVisible: false, order: 6, moduleId: "SOCIAL" },
  { id: "pin_marketing", type: "pinned_module", title: "Marketing Suite", isVisible: false, order: 7, moduleId: "MARKETING" },
];

const STORAGE_KEY = "nexus_dashboard_widgets";

export const CustomDashboard = () => {
  const [renderCount, setRenderCount] = useState(0);
  const [latency, setLatency] = useState<number[]>([]);

  useEffect(() => {
    // Tracking render count as requested in debug logs
    if (typeof window !== 'undefined') {
      (window as any).renderCount = ((window as any).renderCount || 0) + 1;
      setRenderCount((window as any).renderCount);
    }
    
    const interval = setInterval(() => {
      setLatency(prev => {
        const next = [...prev, Math.random() * 50 + 10].slice(-20);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  const [widgets, setWidgets] = useState<Widget[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load dashboard state", e);
      }
    }
    return DEFAULT_WIDGETS;
  });

  const [isCustomizing, setIsCustomizing] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);

  const toggleWidget = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, isVisible: !w.isVisible } : w));
  };

  const addPinnedModule = (module: typeof PINNABLE_MODULES[0]) => {
    const id = `pin_${module.id.toLowerCase()}`;
    if (widgets.find(w => w.id === id)) {
      toggleWidget(id);
      return;
    }
    const newWidget: Widget = {
      id,
      type: "pinned_module",
      title: module.name,
      isVisible: true,
      order: widgets.length,
      moduleId: module.id
    };
    setWidgets(prev => [...prev, newWidget]);
  };

  const moveWidget = (id: string, direction: 'up' | 'down') => {
    const sorted = [...widgets].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex(w => w.id === id);
    if (direction === 'up' && index > 0) {
      const temp = sorted[index].order;
      sorted[index].order = sorted[index - 1].order;
      sorted[index - 1].order = temp;
    } else if (direction === 'down' && index < sorted.length - 1) {
      const temp = sorted[index].order;
      sorted[index].order = sorted[index + 1].order;
      sorted[index + 1].order = temp;
    }
    setWidgets([...sorted]);
  };

  const visibleWidgets = widgets
    .filter(w => w.isVisible)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight neon-text">NEXUS COMMAND</h1>
          <p className="text-nexus-text-dim mt-2 tracking-widest text-[10px] uppercase font-mono">
            Neural Desktop Interface <span className="text-nexus-accent ml-2">// OS_v.4.2</span>
          </p>
        </div>
        <button 
          onClick={() => setIsCustomizing(true)}
          className="glass px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-nexus-accent/10 transition-all text-xs font-bold uppercase tracking-wider group"
        >
          <Settings2 className="w-4 h-4 text-nexus-accent group-hover:rotate-90 transition-transform" />
          Customize Layout
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {visibleWidgets.map((widget) => (
            <motion.div
              key={widget.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: "circOut" }}
              className={cn(
                "glass rounded-3xl overflow-hidden flex flex-col",
                widget.type === "stats" ? "md:col-span-2 lg:col-span-3" : ""
              )}
            >
              {renderWidgetContent(widget, { renderCount, latency })}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {visibleWidgets.length === 0 && (
        <div className="flex flex-col items-center justify-center p-20 glass rounded-3xl border-dashed border-2 border-white/10">
          <LayoutDashboard className="w-16 h-16 text-nexus-text-dim/20 mb-4" />
          <p className="text-nexus-text-dim font-mono text-sm">NO MODULES ACTIVE ON PRIMARY RECEPTOR</p>
          <button 
            onClick={() => setIsCustomizing(true)}
            className="mt-6 px-6 py-2 bg-nexus-accent text-black font-bold rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(5,255,161,0.3)]"
          >
            RESTORE COMMAND INTERFACE
          </button>
        </div>
      )}

      {/* Customization Modal */}
      <AnimatePresence>
        {isCustomizing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass max-w-2xl w-full rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
            >
              <header className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Layout className="w-5 h-5 text-nexus-accent" />
                  <h3 className="text-lg font-display font-bold uppercase tracking-tight">Interface Calibration</h3>
                </div>
                <button 
                  onClick={() => setIsCustomizing(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-nexus-text-dim" />
                </button>
              </header>

              <div className="p-6 space-y-4">
                <p className="text-xs text-nexus-text-dim font-mono uppercase tracking-widest mb-6">Select Active Neural Modules</p>
                <div className="space-y-3">
                  {widgets.sort((a,b) => a.order - b.order).map((widget, i) => (
                    <div 
                      key={widget.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          widget.isVisible ? "bg-nexus-accent/20 text-nexus-accent" : "bg-white/5 text-nexus-text-dim"
                        )}>
                          {getWidgetIcon(widget.type, widget.moduleId)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm tracking-tight">{widget.title}</h4>
                          <p className="text-[10px] text-nexus-text-dim uppercase font-mono tracking-tighter">
                            {widget.type === "pinned_module" ? `Pinned Module: ${widget.moduleId}` : `Module ID: ${widget.id.toUpperCase()}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <button 
                            disabled={i === 0}
                            onClick={() => moveWidget(widget.id, 'up')}
                            className="p-1 hover:text-nexus-accent disabled:opacity-20 transition-colors"
                          >
                            <Plus className="w-3 h-3 rotate-45" />
                          </button>
                          <button 
                            disabled={i === widgets.length - 1}
                            onClick={() => moveWidget(widget.id, 'down')}
                            className="p-1 hover:text-nexus-accent disabled:opacity-20 transition-colors"
                          >
                            <Plus className="w-3 h-3 rotate-[135deg]" />
                          </button>
                        </div>
                        <button 
                          onClick={() => toggleWidget(widget.id)}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                            widget.isVisible 
                              ? "bg-nexus-accent text-black shadow-[0_0_15px_rgba(5,255,161,0.4)]" 
                              : "bg-white/5 text-nexus-text-dim hover:bg-white/10"
                          )}
                        >
                          {widget.isVisible ? "Enabled" : "Disabled"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/5">
                  <p className="text-xs text-nexus-text-dim font-mono uppercase tracking-widest mb-4">Pin New Neural Modules</p>
                  <div className="grid grid-cols-2 gap-3">
                    {PINNABLE_MODULES.map((module) => {
                      const isPinned = widgets.some(w => w.moduleId === module.id && w.isVisible);
                      return (
                        <button
                          key={module.id}
                          onClick={() => addPinnedModule(module)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                            isPinned 
                              ? "bg-nexus-accent/10 border-nexus-accent/30 text-nexus-accent" 
                              : "bg-white/5 border-white/5 text-nexus-text-dim hover:border-white/10 hover:text-white"
                          )}
                        >
                          <module.icon className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-tight">{module.name}</span>
                          {isPinned && <CheckSquare className="w-3 h-3 ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white/5 flex justify-end">
                <button 
                  onClick={() => setIsCustomizing(false)}
                  className="px-8 py-2 bg-nexus-accent text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(5,255,161,0.4)] transition-all"
                >
                  SAVE CONFIGURATION
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const getWidgetIcon = (type: string, moduleId?: string) => {
  if (type === "pinned_module" && moduleId) {
    const module = PINNABLE_MODULES.find(m => m.id === moduleId);
    if (module) return <module.icon className="w-5 h-5" />;
  }
  switch (type) {
    case "stats": return <TrendingUp className="w-5 h-5" />;
    case "diagnostics": return <Activity className="w-5 h-5" />;
    case "social": return <Share2 className="w-5 h-5" />;
    case "sales": return <BarChart3 className="w-5 h-5" />;
    case "appointments": return <Calendar className="w-5 h-5" />;
    case "tasks": return <CheckSquare className="w-5 h-5" />;
    default: return <Layout className="w-5 h-5" />;
  }
};

const AppointmentsWidget = () => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mock appointments with dates
  const appointments = [
    { id: 1, date: new Date(), time: "09:00", title: "Global Sync", subtitle: "Strategic Ops", icon: Globe },
    { id: 2, date: new Date(), time: "11:30", title: "Product Demo", subtitle: "Nexus V5 Preview", icon: Zap },
    { id: 3, date: new Date(), time: "15:00", title: "Investor Brief", subtitle: "Growth Metrics", icon: TrendingUp },
    { id: 4, date: addDays(new Date(), 1), time: "10:00", title: "Marketing Review", subtitle: "Q3 Campaign", icon: Share2 },
    { id: 5, date: addDays(new Date(), 2), time: "14:00", title: "Security Audit", subtitle: "Nexus Core", icon: ShieldAlert },
  ];

  const renderHeader = () => {
    return (
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-widest">Neural Meetings</h3>
        </div>
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
          <button 
            onClick={() => setViewMode('list')}
            className={cn(
              "p-1.5 rounded-md transition-all",
              viewMode === 'list' ? "bg-nexus-accent text-black" : "text-nexus-text-dim hover:text-white"
            )}
          >
            <List className="w-3 h-3" />
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={cn(
              "p-1.5 rounded-md transition-all",
              viewMode === 'calendar' ? "bg-nexus-accent text-black" : "text-nexus-text-dim hover:text-white"
            )}
          >
            <LayoutDashboard className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "MMMM yyyy";
    const days = ["S", "M", "T", "W", "T", "F", "S"];

    const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return (
      <div className="p-5 space-y-4 flex-1">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-mono font-bold text-nexus-text-dim uppercase">
            {format(currentMonth, dateFormat)}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:text-nexus-accent transition-colors">
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:text-nexus-accent transition-colors">
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {days.map((day, i) => (
            <div key={i} className="text-[9px] font-mono text-nexus-text-dim/50 font-bold">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            const hasAppointment = appointments.some(a => isSameDay(a.date, day));
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);

            return (
              <div 
                key={i} 
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "relative aspect-square flex items-center justify-center text-[10px] rounded-lg cursor-pointer transition-all border",
                  !isCurrentMonth ? "opacity-20 pointer-events-none" : "hover:bg-white/5",
                  isToday ? "border-nexus-accent/50 text-nexus-accent" : "border-transparent",
                  isSelected ? "bg-nexus-accent text-black font-bold" : "text-white/60"
                )}
              >
                {format(day, "d")}
                {hasAppointment && (
                  <div className={cn(
                    "absolute bottom-1 w-1 h-1 rounded-full",
                    isSelected ? "bg-black" : "bg-nexus-accent"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-white/5 space-y-2">
          <p className="text-[9px] font-mono text-nexus-text-dim uppercase">Agenda: {format(selectedDate, "MMM d")}</p>
          <div className="space-y-1">
            {appointments.filter(a => isSameDay(a.date, selectedDate)).length > 0 ? (
              appointments.filter(a => isSameDay(a.date, selectedDate)).map(a => (
                <div key={a.id} className="flex items-center gap-2 text-[10px]">
                  <span className="text-nexus-accent font-mono">{a.time}</span>
                  <span className="text-white/80">{a.title}</span>
                </div>
              ))
            ) : (
              <p className="text-[9px] italic text-nexus-text-dim">No events today</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderList = () => {
    return (
      <div className="p-5 space-y-3 flex-1 overflow-y-auto max-h-[300px]">
        {appointments.map((a, i) => (
          <div key={i} className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
            <div className="flex flex-col items-center justify-center border-r border-white/5 pr-4">
              <span className="text-[10px] font-bold text-nexus-accent font-mono">{a.time}</span>
              <div className="w-1 h-1 rounded-full bg-nexus-accent mt-1 shadow-[0_0_5px_rgba(5,255,161,1)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold">{a.title}</h4>
                <span className="text-[8px] text-nexus-text-dim uppercase font-mono px-1 border border-white/10 rounded">{format(a.date, "MMM d")}</span>
              </div>
              <p className="text-[10px] text-nexus-text-dim">{a.subtitle}</p>
            </div>
            <a.icon className="w-3 h-3 ml-auto text-nexus-text-dim opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {renderHeader()}
      {viewMode === 'list' ? renderList() : renderCalendar()}
    </div>
  );
};

const TasksWidget = () => {
  const [tasks, setTasks] = useState([
    { id: 1, task: "Update Neural Security Protocols", priority: "HIGH", completed: false },
    { id: 2, task: "Sync Social Matrix for Q3", priority: "MED", completed: false },
    { id: 3, task: "Review Sales Intelligence Report", priority: "LOW", completed: false },
    { id: 4, task: "Calibrate AI Core Variance", priority: "HIGH", completed: false },
  ]);

  const [completingId, setCompletingId] = useState<number | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "COMPLETED" | "ALL">("PENDING");

  const completeTask = (id: number) => {
    if (completingId) return;
    setCompletingId(id);
    setTimeout(() => {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
      setCompletingId(null);
    }, 600);
  };

  const filteredTasks = tasks.filter(t => {
    const matchesPriority = priorityFilter === "ALL" || t.priority === priorityFilter;
    const matchesStatus = statusFilter === "ALL" || 
                         (statusFilter === "PENDING" && !t.completed) || 
                         (statusFilter === "COMPLETED" && t.completed);
    return matchesPriority && matchesStatus;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-white/5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-nexus-accent" />
            Priority Tasking
          </h3>
          <span className="text-[10px] font-mono text-nexus-text-dim">
            {tasks.filter(t => !t.completed).length} PENDING
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {/* Status Filters */}
          <div className="flex gap-1">
            {["PENDING", "COMPLETED", "ALL"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s as any)}
                className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-mono border transition-all uppercase tracking-tighter",
                  statusFilter === s 
                    ? "bg-nexus-accent/20 border-nexus-accent/50 text-nexus-accent" 
                    : "bg-white/5 border-white/5 text-nexus-text-dim hover:bg-white/10"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          {/* Priority Filters */}
          <div className="flex gap-1">
            {["ALL", "HIGH", "MED", "LOW"].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-mono border transition-all uppercase tracking-tighter",
                  priorityFilter === p 
                    ? "bg-white/20 border-white/40 text-white" 
                    : "bg-white/5 border-white/5 text-nexus-text-dim hover:bg-white/10"
                )}
              >
                {p === "ALL" ? "ANY PR" : p}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="p-5 space-y-2 flex-1 relative overflow-hidden overflow-y-auto no-scrollbar">
        <AnimatePresence initial={false} mode="popLayout">
          {filteredTasks.map((t) => (
            <motion.div 
              key={t.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: completingId === t.id ? 0.5 : 1, 
                scale: completingId === t.id ? 0.98 : 1,
                filter: completingId === t.id ? "blur(2px)" : "blur(0px)",
              }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              transition={{ duration: 0.3 }}
              onClick={() => completeTask(t.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer relative overflow-hidden group",
                t.completed ? "bg-nexus-accent/5 border border-nexus-accent/10" : "bg-white/5 hover:bg-white/10 border border-white/5",
                completingId === t.id && "pointer-events-none"
              )}
            >
              <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-500",
                  (completingId === t.id || t.completed) ? "scale-0" : "scale-100",
                  t.priority === "HIGH" ? "bg-red-400" : t.priority === "MED" ? "bg-yellow-400" : "bg-blue-400"
                )} />
                <AnimatePresence>
                  {(completingId === t.id || t.completed) && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <CheckSquare className="w-4 h-4 text-nexus-accent" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <span className={cn(
                "text-xs transition-all duration-500 flex-1 truncate font-display",
                (completingId === t.id || t.completed) ? "text-nexus-accent line-through opacity-50" : "text-white/80 group-hover:text-white"
              )}>
                {t.task}
              </span>
              
              <span className="text-[8px] font-mono text-nexus-text-dim opacity-40">{t.priority}</span>

              {/* Progress Sweep for completion */}
              {completingId === t.id && (
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute inset-0 bg-nexus-accent/10 pointer-events-none"
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredTasks.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full py-8 text-center"
          >
            <Zap className="w-8 h-8 text-nexus-accent/20 mb-2 animate-pulse" />
            <p className="text-[10px] font-mono text-nexus-text-dim uppercase tracking-tighter">No tasks match filter</p>
          </motion.div>
        )}

        <button className="w-full mt-2 py-2 border border-dashed border-white/10 rounded-xl text-[10px] text-nexus-text-dim hover:text-white hover:border-nexus-accent/30 transition-all font-mono">
          ADD NEW PROTOCOL
        </button>
      </div>
    </div>
  );
};

const renderWidgetContent = (widget: Widget, extra: any = {}) => {
  switch (widget.type) {
    case "diagnostics":
      return (
        <>
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-nexus-accent" />
              Neural Diagnostics
            </h3>
            <span className="text-[10px] font-mono text-nexus-accent animate-pulse">MONITORING</span>
          </div>
          <div className="p-5 space-y-4 flex-1 font-mono">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-nexus-text-dim uppercase">Render Cycle</p>
                <p className="text-xl font-bold text-white">{extra.renderCount || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-nexus-text-dim uppercase">Mean Latency</p>
                <p className="text-xl font-bold text-nexus-accent">
                  {extra.latency?.length ? (extra.latency.reduce((a: any, b: any) => a + b, 0) / extra.latency.length).toFixed(2) : 0}ms
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] text-nexus-text-dim uppercase flex items-center gap-2">
                <Cpu className="w-3 h-3" /> Fiber Pulse
              </p>
              <div className="h-12 flex items-end gap-1 px-1">
                {extra.latency?.map((l: number, i: number) => (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.min(100, (l / 80) * 100)}%` }}
                    className="flex-1 bg-nexus-accent/30 rounded-t-sm"
                  />
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-2">
              <p className="text-[8px] text-nexus-text-dim uppercase tracking-tighter">Memory Snapshot (Simulated Internals)</p>
              <div className="text-[9px] text-nexus-accent/60 leading-tight">
                <p>$r.memoizedState: OK</p>
                <p>$r.props.user: ACTIVE</p>
                <p>updateQueue.lastEffect: SYNCED</p>
              </div>
            </div>
          </div>
        </>
      );
    case "stats":
      return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Neural Reach", value: "2.4M", trend: "+14.2%", icon: Users, color: "text-blue-400" },
            { label: "Active Nodes", value: "842", trend: "+2.1%", icon: Zap, color: "text-nexus-accent" },
            { label: "Comm Streams", value: "12.8k", trend: "+34.5%", icon: MessageSquare, color: "text-purple-400" },
            { label: "System Load", value: "24%", trend: "Stable", icon: TrendingUp, color: "text-cyan-400" },
          ].map((stat, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2 text-nexus-text-dim">
                <stat.icon className={cn("w-4 h-4", stat.color)} />
                <span className="text-[10px] font-mono uppercase tracking-widest">{stat.label}</span>
              </div>
              <div className="flex items-end justify-between">
                <h4 className="text-2xl font-display font-bold">{stat.value}</h4>
                <span className={cn(
                  "text-[10px] font-bold",
                  stat.trend.startsWith("+") ? "text-nexus-accent" : "text-nexus-text-dim"
                )}>{stat.trend}</span>
              </div>
            </div>
          ))}
        </div>
      );
    case "social":
      return (
        <>
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Share2 className="w-4 h-4 text-purple-400" />
              Social Sentiment
            </h3>
            <span className="text-[10px] font-mono text-nexus-accent">LIVE FEED</span>
          </div>
          <div className="p-5 space-y-4 flex-1">
            {[
              { platform: "Instagram", engagement: "84%", trend: "up" },
              { platform: "Twitter / X", engagement: "62%", trend: "down" },
              { platform: "LinkedIn", engagement: "91%", trend: "up" },
            ].map((p, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-nexus-text-dim uppercase font-mono">{p.platform}</span>
                  <span className="font-bold">{p.engagement}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: p.engagement }}
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      p.trend === "up" ? "bg-nexus-accent" : "bg-red-400"
                    )}
                  />
                </div>
              </div>
            ))}
            <div className="pt-4 border-t border-white/5">
              <p className="text-[9px] text-nexus-text-dim uppercase font-mono leading-relaxed">
                Most performing node: <span className="text-white">PROJECT_ZENITH_TEASER</span> with 42k interactions.
              </p>
            </div>
          </div>
        </>
      );
    case "sales":
      return (
        <>
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Pipeline Velocity
            </h3>
            <ArrowUpRight className="w-3 h-3 text-nexus-accent" />
          </div>
          <div className="p-5 space-y-3 flex-1">
            {[
              { stage: "Discovery", count: 24, value: "$124k" },
              { stage: "Proposal", count: 12, value: "$450k" },
              { stage: "Negotiation", count: 5, value: "$210k" },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-nexus-accent/30 transition-all">
                <div>
                  <p className="text-[10px] text-nexus-text-dim uppercase font-mono">{s.stage}</p>
                  <p className="text-sm font-bold">{s.count} Leads</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-nexus-accent">{s.value}</p>
                  <p className="text-[8px] text-nexus-text-dim underline underline-offset-2">CALCULATE ROI</p>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    case "appointments":
      return <AppointmentsWidget />;
    case "tasks":
      return <TasksWidget />;
    case "pinned_module":
      const moduleInfo = PINNABLE_MODULES.find(m => m.id === widget.moduleId);
      if (!moduleInfo) return null;
      return (
        <div className="p-6 flex flex-col h-full justify-between group cursor-pointer hover:bg-nexus-accent/5 transition-all">
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-2xl bg-nexus-accent/10 text-nexus-accent group-hover:scale-110 transition-transform">
              <moduleInfo.icon className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-nexus-text-dim opacity-40 group-hover:text-nexus-accent transition-colors" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-display font-bold text-white mb-1">{moduleInfo.name}</h3>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-mono text-nexus-accent">{moduleInfo.metric}</p>
              <span className="text-[9px] font-bold text-nexus-text-dim uppercase tracking-tighter">{moduleInfo.trend}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-[8px] text-nexus-text-dim uppercase font-mono tracking-widest">Neural Link Active</span>
            <div className="flex gap-0.5">
              {[1, 2, 3].map(i => <div key={i} className="w-1 h-3 bg-nexus-accent/20 rounded-full" />)}
            </div>
          </div>
        </div>
      );
    default:
      return <div className="p-10 text-center text-nexus-text-dim uppercase font-mono text-xs">Module under maintenance</div>;
  }
};
