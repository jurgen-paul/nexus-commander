import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Settings, 
  User, 
  Shield, 
  Key, 
  Monitor, 
  Cpu, 
  Globe, 
  Zap,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Cloud,
  Lock,
  Smartphone,
  Search,
  ArrowRight,
  Image as ImageIcon,
  UploadCloud,
  Camera,
  Trash2,
  Copy,
  Check,
  ChevronLeft,
  Download
} from "lucide-react";
import { cn } from "@/src/lib/utils";

interface AppSettingsProps {
  avatar: string;
  setAvatar: (val: string) => void;
  alias: string;
  setAlias: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  rank: string;
  setRank: (val: string) => void;
  accessLevel: string;
  setAccessLevel: (val: string) => void;
  theme: 'warm' | 'technical' | 'minimal';
  onBack: () => void;
}

interface LibraryImage {
  id: string;
  url: string;
  name: string;
  size: string;
  date: string;
  category: string;
}

const PRESET_IMAGES: LibraryImage[] = [
  {
    id: "preset-1",
    url: "https://picsum.photos/seed/nexus-core/600/600",
    name: "Nebula Core Grid",
    size: "142.1 KB",
    date: "2026-05-19",
    category: "System Renders"
  },
  {
    id: "preset-2",
    url: "https://picsum.photos/seed/slate-structure/600/600",
    name: "Architectural Slate",
    size: "204.5 KB",
    date: "2026-05-19",
    category: "Space Art"
  },
  {
    id: "preset-3",
    url: "https://picsum.photos/seed/cyber-grid/600/600",
    name: "Neural Grid Wave",
    size: "98.2 KB",
    date: "2026-05-20",
    category: "Sci-Fi Patterns"
  },
  {
    id: "preset-4",
    url: "https://picsum.photos/seed/neon-abstractions/600/600",
    name: "Vibrant Luminescence",
    size: "312.0 KB",
    date: "2026-05-21",
    category: "Ambient Visuals"
  },
  {
    id: "preset-5",
    url: "https://picsum.photos/seed/editorial-minimalism/600/600",
    name: "Warm Tactile Frame",
    size: "185.3 KB",
    date: "2026-05-22",
    category: "Aesthetics"
  },
  {
    id: "preset-6",
    url: "https://picsum.photos/seed/cosmic-dust/600/600",
    name: "Deep Field Monolith",
    size: "276.7 KB",
    date: "2026-05-23",
    category: "Space Art"
  }
];

export const AppSettings = ({
  avatar,
  setAvatar,
  alias,
  setAlias,
  email,
  setEmail,
  rank,
  setRank,
  accessLevel,
  setAccessLevel,
  theme,
  onBack
}: AppSettingsProps) => {
  const [activeTab, setActiveTab] = useState<"profile" | "library" | "neural" | "api" | "security">("profile");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [commitStatus, setCommitStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isDragging, setIsDragging] = useState(false);
  
  // Local profile temporary edits
  const [tempAlias, setTempAlias] = useState(alias);
  const [tempEmail, setTempEmail] = useState(email);
  const [tempRank, setTempRank] = useState(rank);
  const [tempAccess, setTempAccess] = useState(accessLevel);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User uploaded Custom Images
  const [libraryImages, setLibraryImages] = useState<LibraryImage[]>(() => {
    const saved = localStorage.getItem("applet_library_images");
    return saved ? JSON.parse(saved) : PRESET_IMAGES;
  });

  const toggleKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFiles(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImageFiles(files);
    }
  };

  const processImageFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) {
        triggerToast("Only image uploads are accepted.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const b64 = event.target?.result as string;
        const newImg: LibraryImage = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
          url: b64,
          name: file.name,
          size: (file.size / 1024).toFixed(1) + " KB",
          date: new Date().toISOString().substring(0, 10),
          category: "User Upload"
        };
        
        setLibraryImages(prev => {
          const updated = [newImg, ...prev];
          localStorage.setItem("applet_library_images", JSON.stringify(updated));
          return updated;
        });
        triggerToast("Image added to library!");
      };
      reader.readAsDataURL(file);
    });
  };

  const deleteLibraryImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLibraryImages(prev => {
      const updated = prev.filter(img => img.id !== id);
      localStorage.setItem("applet_library_images", JSON.stringify(updated));
      return updated;
    });
    triggerToast("Image removed from library.");
  };

  const selectAvatarFromLibrary = (imageUrl: string) => {
    setAvatar(imageUrl);
    localStorage.setItem("applet_avatar", imageUrl);
    triggerToast("Profile avatar updated!");
  };

  const copyImageLink = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    triggerToast("Image link copied to clipboard!");
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleCommitProfile = () => {
    setCommitStatus("saving");
    setTimeout(() => {
      setAlias(tempAlias);
      setEmail(tempEmail);
      setRank(tempRank);
      setAccessLevel(tempAccess);
      
      localStorage.setItem("applet_alias", tempAlias);
      localStorage.setItem("applet_email", tempEmail);
      localStorage.setItem("applet_rank", tempRank);
      localStorage.setItem("applet_access_level", tempAccess);

      setCommitStatus("saved");
      triggerToast("System protocol configurations committed!");
      setTimeout(() => setCommitStatus("idle"), 2050);
    }, 1000);
  };

  const handleExportConfig = () => {
    try {
      const configData = {
        meta: {
          system: "Master Command Centre",
          build: "v2.0-secure",
          exportedAt: new Date().toISOString(),
          operatorEmail: email
        },
        profile: {
          alias,
          email,
          rank,
          accessLevel,
          avatar
        },
        interface: {
          theme
        }
      };

      const blob = new Blob([JSON.stringify(configData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mcc_config_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      triggerToast("Configuration JSON exported successfully!");
    } catch (err) {
      triggerToast("Failed to export configurations.");
    }
  };

  const handleFactoryWipe = () => {
    if (confirm("Are you majorly sure you want to reset all configurations and local media? This cannot be undone.")) {
      localStorage.clear();
      setAvatar("https://picsum.photos/seed/commander/120/120");
      setAlias("COMMANDER");
      setEmail("commander@nexus.one");
      setRank("System Architect / Lead");
      setAccessLevel("ULTRA-VIOLET");
      setTempAlias("COMMANDER");
      setTempEmail("commander@nexus.one");
      setTempRank("System Architect / Lead");
      setTempAccess("ULTRA-VIOLET");
      setLibraryImages(PRESET_IMAGES);
      triggerToast("All settings factory reset complete.");
    }
  };

  const allSettings = [
    { id: "alias", label: "Neural Alias", tab: "profile", icon: User },
    { id: "email", label: "Encryption Email", tab: "profile", icon: Globe },
    { id: "rank", label: "System Rank", tab: "profile", icon: Shield },
    { id: "theme", label: "Interface Aesthetics", tab: "neural", icon: Monitor },
    { id: "animations", label: "Animation Dynamics", tab: "neural", icon: Zap },
    { id: "keys", label: "Neural Key Matrix", tab: "api", icon: Key },
    { id: "2fa", label: "Neural Biometrics", tab: "security", icon: Shield },
  ];

  const filteredSettings = allSettings.filter(s => 
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: "profile", label: "Identity & Profile", icon: User },
    { id: "library", label: "Image Library", icon: ImageIcon },
    { id: "neural", label: "Interface", icon: Monitor },
    { id: "api", label: "API Matrix", icon: Key },
    { id: "security", label: "Protocols", icon: Shield },
  ];

  const themeAccentStyle = theme === 'technical' ? 'text-emerald-400 border-zinc-800' : theme === 'minimal' ? 'text-slate-950 border-slate-200' : 'text-stone-850 border-stone-200';

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-6xl mx-auto relative">
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl border text-xs font-mono font-bold flex items-center gap-2.5 transition-colors ${
              theme === 'technical' 
                ? 'bg-zinc-900 border-emerald-500/30 text-emerald-400 shadow-emerald-900/10' 
                : theme === 'minimal'
                  ? 'bg-slate-900 border-slate-700 text-white shadow-slate-900/30'
                  : 'bg-stone-900 border-stone-750 text-stone-100 shadow-stone-900/45'
            }`}
          >
            <Check size={14} className="text-emerald-500 animate-pulse" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 border-dashed border-stone-300 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className={`p-2.5 rounded-xl border transition-all flex items-center justify-center hover:scale-105 ${
              theme === 'technical' ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-250'
            }`}
            title="Return to Curation Desk"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <h2 className={`text-3xl font-bold flex items-center gap-3 ${theme === 'warm' ? 'font-serif italic text-stone-950' : 'text-stone-900 dark:text-zinc-100'}`}>
              <Settings className="w-8 h-8 text-indigo-500" />
              Settings & Account Profile
            </h2>
            <p className="text-xs opacity-60 font-mono mt-1">Configure your workspace agent metadata and media repository.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={handleExportConfig}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold font-mono tracking-widest flex items-center justify-center gap-2 hover:scale-[1.01] transition-all border ${
              theme === 'technical'
                ? 'bg-zinc-950 border-zinc-800 text-emerald-400 hover:bg-zinc-900/50 hover:border-emerald-500/30'
                : theme === 'minimal'
                  ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-905 shadow-sm'
                  : 'bg-stone-50 border-stone-250 hover:bg-stone-100 text-stone-850 shadow-sm'
            }`}
          >
            <Download size={14} className="shrink-0" />
            EXPORT JSON
          </button>

          <button 
            onClick={handleCommitProfile}
            disabled={commitStatus === "saving"}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold font-mono tracking-widest flex items-center justify-center gap-2 hover:scale-[1.01] transition-all ${
              theme === 'technical'
                ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:bg-emerald-400'
                : 'bg-stone-950 text-white hover:bg-stone-850 shadow-md'
            }`}
          >
            {commitStatus === "saving" ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                COMMITTING...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                COMMIT CHANGES
              </>
            )}
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group text-left",
                activeTab === tab.id 
                  ? theme === 'technical'
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : theme === 'minimal'
                      ? "bg-slate-900 text-white"
                      : "bg-stone-950 text-stone-100 shadow-sm shadow-stone-900/15"
                  : theme === 'technical'
                    ? "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              )}
            >
              <tab.icon className={cn("w-4 h-4", activeTab === tab.id && "animate-pulse")} />
              <span className="text-xs font-bold uppercase tracking-widest font-mono">{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Dynamic Content Frame */}
        <main className="flex-1">
          <div className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 ${
            theme === 'technical' 
              ? 'bg-zinc-900 border-zinc-800' 
              : theme === 'minimal'
                ? 'bg-white border-slate-200'
                : 'bg-stone-50 border-stone-250'
          }`}>
            
            {/* Tab 1: Profile & Identity */}
            {activeTab === "profile" && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 border-b pb-6 border-dashed border-stone-200 dark:border-zinc-800/60">
                  {/* Interactive Avatar Container with Click to Library */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative group cursor-pointer" onClick={() => setActiveTab("library")}>
                      <div className={`w-36 h-36 rounded-2xl overflow-hidden border-2 transition-transform duration-300 group-hover:scale-105 flex items-center justify-center relative ${
                        theme === 'technical' ? 'bg-zinc-950 border-emerald-500/20' : 'bg-white border-stone-200 shadow-sm'
                      }`}>
                        <img 
                          src={avatar} 
                          alt="Neural Avatar" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-stone-900/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-center p-2">
                          <ImageIcon className="w-5 h-5 mb-1 text-indigo-400" />
                          <span className="text-[10px] font-mono tracking-tight font-bold uppercase">Change Image</span>
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-zinc-900">
                        <Camera className="w-4 h-4" />
                      </div>
                    </div>
                    <span className="text-[9px] font-mono opacity-50 uppercase text-center">Click avatar to browse library</span>
                  </div>

                  {/* Profile Form Details */}
                  <div className="flex-1 w-full space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] opacity-60 uppercase tracking-widest font-mono font-bold">Neural Alias</label>
                        <input 
                          type="text" 
                          value={tempAlias}
                          onChange={(e) => setTempAlias(e.target.value)}
                          className={`w-full p-2.5 text-sm font-bold rounded-lg border focus:outline-none focus:ring-1 ${
                            theme === 'technical' 
                              ? 'bg-zinc-950 border-zinc-700 text-emerald-400 focus:ring-emerald-500' 
                              : 'bg-white border-stone-300 focus:ring-stone-850'
                          }`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] opacity-60 uppercase tracking-widest font-mono font-bold">Encryption Email</label>
                        <input 
                          type="email" 
                          value={tempEmail}
                          onChange={(e) => setTempEmail(e.target.value)}
                          className={`w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 ${
                            theme === 'technical' 
                              ? 'bg-zinc-950 border-zinc-700 focus:ring-emerald-500' 
                              : 'bg-white border-stone-300 focus:ring-stone-850'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] opacity-60 uppercase tracking-widest font-mono font-bold">System Designation Role</label>
                        <input 
                          type="text" 
                          value={tempRank}
                          onChange={(e) => setTempRank(e.target.value)}
                          className={`w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 ${
                            theme === 'technical' 
                              ? 'bg-zinc-950 border-zinc-700 focus:ring-emerald-500' 
                              : 'bg-white border-stone-300 focus:ring-stone-850'
                          }`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] opacity-60 uppercase tracking-widest font-mono font-bold">Clearance Level</label>
                        <select 
                          value={tempAccess}
                          onChange={(e) => setTempAccess(e.target.value)}
                          className={`w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 font-mono ${
                            theme === 'technical' 
                              ? 'bg-zinc-950 border-zinc-700 focus:ring-emerald-500 text-yellow-500' 
                              : 'bg-white border-stone-300 focus:ring-stone-850'
                          }`}
                        >
                          <option value="INFRARED">INFRARED (RESTRICTED)</option>
                          <option value="GREEN-CHANNEL">GREEN-CHANNEL (VERIFIED)</option>
                          <option value="ULTRA-VIOLET">ULTRA-VIOLET (FULL CONTROL)</option>
                          <option value="ADMINISTRATOR">SYSTEM ROOT ADMINISTRATOR</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Identity Protocol Badges */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2 font-mono">
                    <Shield className="w-4 h-4" />
                    Identity Protocol Clearance Info
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-xl border ${theme === 'technical' ? 'bg-zinc-950 border-zinc-850' : 'bg-white border-stone-200'}`}>
                      <p className="text-[9px] opacity-50 uppercase mb-1 font-mono">Rank ID Status</p>
                      <p className="text-xs font-bold font-mono text-emerald-500">ACTIVE SYSTEM NODE</p>
                    </div>
                    <div className={`p-4 rounded-xl border ${theme === 'technical' ? 'bg-zinc-950 border-zinc-850' : 'bg-white border-stone-200'}`}>
                      <p className="text-[9px] opacity-50 uppercase mb-1 font-mono">Assigned IP Port ID</p>
                      <p className="text-xs font-bold font-mono">localhost:3000</p>
                    </div>
                    <div className={`p-4 rounded-xl border ${theme === 'technical' ? 'bg-zinc-950 border-zinc-850' : 'bg-white border-stone-200'}`}>
                      <p className="text-[9px] opacity-50 uppercase mb-1 font-mono">File Access Index</p>
                      <p className="text-xs font-bold font-mono text-indigo-400">968 lines validated</p>
                    </div>
                  </div>
                </div>

                {/* Export Backup Section */}
                <div className="pt-6 border-t border-dashed border-stone-250 dark:border-zinc-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2 font-mono">
                        <Download className="w-4 h-4" />
                        Aesthetics & Identity Configuration Export
                      </h4>
                      <p className="text-[10px] opacity-65 uppercase mt-1 leading-normal">
                        Export your current profile parameters and interface aesthetic variables as a portable JSON file.
                      </p>
                    </div>
                    <button 
                      onClick={handleExportConfig}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold font-mono tracking-widest flex items-center justify-center gap-2 hover:scale-[1.01] transition-all shrink-0 border ${
                        theme === 'technical'
                          ? 'bg-zinc-950 border-zinc-800 text-emerald-400 hover:bg-zinc-900 shadow-sm'
                          : theme === 'minimal'
                            ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-900 shadow-sm'
                            : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-900 shadow-sm'
                      }`}
                    >
                      <Download size={13} />
                      DOWNLOAD CONFIG BACKUP
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 2: Media Matrix / Upload Image Library (The NEW Section) */}
            {activeTab === "library" && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${theme === 'warm' ? 'font-serif text-stone-900' : 'text-stone-900 dark:text-zinc-100'}`}>
                    <ImageIcon className="w-5 h-5 text-indigo-500" />
                    Interactive Media Curation Registry
                  </h3>
                  <p className="text-xs opacity-60 font-mono mt-1">
                    Drag, select, or manage visual media files to customize UI assets or workspace profile pictures seamlessly.
                  </p>
                </div>

                {/* Uplink Drag & Drop Upload Space */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : theme === 'technical'
                        ? 'border-zinc-800 bg-zinc-950/40 hover:border-emerald-500/30 hover:bg-zinc-900/40'
                        : 'border-stone-300 bg-stone-100/50 hover:bg-stone-100 hover:border-stone-400'
                  }`}
                >
                  <input 
                    type="file"
                    id="media-uploader-input"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <UploadCloud className={`w-10 h-10 mb-2 transition-transform ${isDragging ? 'animate-bounce text-indigo-500' : 'opacity-60'}`} />
                  <p className="text-xs font-bold uppercase tracking-wider font-mono">
                    Drag & Drop File Upload Here
                  </p>
                  <p className="text-[10px] opacity-50 font-mono mt-1 text-center">
                    or click to manually browse PNG, JPG or WEBP image assets
                  </p>
                </div>

                {/* Library Image Grid Selector */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-1 dark:border-zinc-800">
                    <span className="text-[10px] font-mono font-bold opacity-60 uppercase">
                      Media Registry ({libraryImages.length} items)
                    </span>
                    <span className="text-[9px] opacity-40 font-mono text-right">
                      * Supports Base64 compression
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {libraryImages.map((img) => {
                      const isActiveAvatar = avatar === img.url;
                      return (
                        <div 
                          key={img.id}
                          onClick={() => selectAvatarFromLibrary(img.url)}
                          className={cn(
                            "group rounded-xl overflow-hidden border transition-all cursor-pointer hover:scale-[1.02] flex flex-col relative",
                            isActiveAvatar 
                              ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20" 
                              : theme === 'technical' 
                                ? "border-zinc-800 bg-zinc-950" 
                                : "border-stone-200 bg-white"
                          )}
                        >
                          {/* Image Box */}
                          <div className="aspect-square w-full overflow-hidden relative bg-stone-100 dark:bg-zinc-950 flex items-center justify-center">
                            <img 
                              src={img.url} 
                              alt={img.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              referrerPolicy="no-referrer"
                            />
                            
                            {/* Active Avatar Badge */}
                            {isActiveAvatar && (
                              <div className="absolute top-2 left-2 bg-emerald-500 text-black text-[9px] font-bold font-mono px-1.5 py-0.5 rounded shadow-md flex items-center gap-1.5">
                                <Check size={10} strokeWidth={3} /> ACTIVE AVATAR
                              </div>
                            )}

                            {/* Floating control Actions */}
                            <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => copyImageLink(img.url, e)}
                                className="p-1.5 bg-zinc-900/80 text-white rounded hover:bg-zinc-900 transition-colors"
                                title="Copy base64 URL link"
                              >
                                <Copy size={11} />
                              </button>
                              <button 
                                onClick={(e) => deleteLibraryImage(img.id, e)}
                                className="p-1.5 bg-red-650/80 text-white rounded hover:bg-red-500 transition-colors"
                                title="Delete library image"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>

                            {/* Set Avatar overlay on hover */}
                            {!isActiveAvatar && (
                              <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-1 bg-indigo-650 rounded shadow">
                                  Use as Avatar
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Image Info Details */}
                          <div className="p-2.5 space-y-0.5 text-left border-t border-stone-100 dark:border-zinc-800">
                            <p className="text-[10px] font-bold truncate opacity-90">{img.name}</p>
                            <div className="flex items-center justify-between text-[8px] font-mono opacity-50">
                              <span>{img.size}</span>
                              <span className="bg-stone-200 dark:bg-zinc-800 text-[7px] px-1 py-0.2 rounded uppercase">
                                {img.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 3: Interface Aesthetics */}
            {activeTab === "neural" && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                {/* Search Configurations */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className={cn(
                      "w-4 h-4 transition-colors duration-300",
                      searchQuery ? "text-emerald-400" : "text-stone-500"
                    )} />
                  </div>
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="QUERY PRESETS..."
                    className={`w-full py-3.5 pl-12 pr-4 text-xs font-mono font-bold tracking-widest uppercase rounded-xl border focus:outline-none transition-all ${
                      theme === 'technical' 
                        ? 'bg-zinc-950 border-zinc-800 focus:border-emerald-500/50 focus:bg-zinc-900/40' 
                        : 'bg-white border-stone-250 focus:border-stone-400'
                    }`}
                  />
                  {searchQuery && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`absolute top-full left-0 right-0 mt-2 p-2 rounded-xl z-50 max-h-64 overflow-y-auto shadow-2xl border ${
                        theme === 'technical' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-stone-200'
                      }`}
                    >
                      {filteredSettings.length > 0 ? (
                        <div className="space-y-1">
                          {filteredSettings.map(setting => (
                            <button
                              key={setting.id}
                              onClick={() => {
                                setActiveTab(setting.tab as any);
                                setSearchQuery("");
                              }}
                              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-900 group transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <setting.icon className="w-4 h-4 text-indigo-500" />
                                <div className="text-left">
                                  <p className="text-xs font-bold uppercase tracking-wider">{setting.label}</p>
                                  <p className="text-[9px] opacity-40 font-mono uppercase">{setting.tab} matrix</p>
                                </div>
                              </div>
                              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all text-indigo-500" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-[10px] opacity-50 uppercase tracking-widest font-mono">No matching configurations found</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                <div className="space-y-6">
                  <h4 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 font-mono">
                    <Monitor className="w-4 h-4 text-indigo-500" />
                    Interface Aesthetics Presets
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { name: "NEON TYPE", desc: "Dark mode technical visual matrix" },
                      { name: "TACTILE CRAFT", desc: "Warm editorial paper tone styling" },
                      { name: "CLEAR CELL", desc: "Minimalist layout & thin margins" }
                    ].map(type => {
                      const isMatch = type.name === "TACTILE CRAFT" && theme === "warm" ||
                                      type.name === "NEON TYPE" && theme === "technical" ||
                                      type.name === "CLEAR CELL" && theme === "minimal";
                      return (
                        <div 
                          key={type.name}
                          className={cn(
                            "p-5 rounded-xl border transition-all text-left group",
                            isMatch 
                              ? "border-indigo-500 bg-indigo-500/5" 
                              : "bg-stone-100/50 dark:bg-zinc-950/40 border-stone-200 dark:border-zinc-800"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-lg mb-3 flex items-center justify-center transition-transform group-hover:scale-105",
                            isMatch ? "bg-indigo-500/20 text-indigo-500" : "bg-stone-200 dark:bg-zinc-900"
                          )}>
                            <Monitor className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold tracking-widest uppercase font-mono block">{type.name}</span>
                          <span className="text-[9px] opacity-50 block mt-1 leading-normal uppercase">{type.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-pink-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase font-mono">Animation Dynamics</p>
                        <p className="text-[9px] opacity-50 uppercase">Motion.React Spring Loops</p>
                      </div>
                    </div>
                    <div className="flex bg-stone-200 dark:bg-zinc-800 rounded-lg p-0.5">
                      {["SILENT", "RESTRAINED", "EXUBERANT"].map(lvl => (
                        <button key={lvl} className={cn(
                          "px-3 py-1 rounded text-[8px] font-mono font-bold transition-all",
                          lvl === "EXUBERANT" ? "bg-indigo-600 text-white" : "opacity-60 hover:opacity-100"
                        )}>{lvl}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 4: API credentials */}
            {activeTab === "api" && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 font-mono">
                    <Key className="w-4 h-4 text-indigo-500" />
                    Neural Key Matrix
                  </h4>
                  <button onClick={() => triggerToast("All external credentials synchronized successfully!")} className="text-[10px] font-mono font-bold opacity-60 hover:opacity-100 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    SYNC KEYMATRIX
                  </button>
                </div>

                {[
                  { name: "Gemini Intelligence API", icon: Cpu, value: "sk-••••••••••••••••", status: "Active" },
                  { name: "Google Social Proxy", icon: Globe, value: "gs-••••••••••••••••", status: "Active" },
                  { name: "System Image Generator Core", icon: ImageIcon, value: "img-••••••••••••••••", status: "Linked" },
                  { name: "Vite Environment Local Gate", icon: Lock, value: "vt-••••••••••••••••", status: "Connected" },
                ].map((key, i) => (
                  <div key={i} className="p-4 rounded-xl border transition-all hover:scale-[1.005] dark:border-zinc-800 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-stone-250 dark:bg-zinc-800/60 flex items-center justify-center">
                        <key.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold font-mono uppercase">{key.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-[9px] opacity-70 bg-stone-200/50 dark:bg-zinc-950 px-2 py-0.5 rounded font-mono">
                            {showKeys[key.name] ? "sk-3921-x992-nexus-a1" : key.value}
                          </code>
                          <button 
                            onClick={() => toggleKey(key.name)}
                            className="text-indigo-400 hover:text-indigo-500 transition-colors"
                          >
                            {showKeys[key.name] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)] animate-pulse" />
                      <span className="text-[9px] font-bold opacity-50 uppercase font-mono">{key.status}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Tab 5: Security Protocols */}
            {activeTab === "security" && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h4 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-rose-500 font-mono">
                  <Shield className="w-4 h-4" />
                  Security Protocols
                </h4>
                
                <div className="space-y-4">
                  {[
                    { id: "2fa", label: "Biometric Two-Factor Clearance", desc: "Lock credential panels on screen state timeouts", active: true },
                    { id: "enc", label: "Zero-Knowledge Storage Client", desc: "Local state is fully encrypted client-side in base64 formats", active: true },
                    { id: "log", label: "Immutable Activity Audits", desc: "Capture user action metadata logs in background storage console", active: false },
                  ].map((proto) => (
                    <div key={proto.id} className="flex items-center justify-between p-4 rounded-xl border dark:border-zinc-800">
                      <div className="space-y-0.5 text-left">
                        <p className="text-xs font-bold uppercase font-mono">{proto.label}</p>
                        <p className="text-[10px] opacity-50 uppercase leading-normal">{proto.desc}</p>
                      </div>
                      <button className={cn(
                        "w-10 h-5 rounded-full relative transition-colors duration-300 px-0.5 flex items-center",
                        proto.active ? "bg-emerald-500" : "bg-stone-300 dark:bg-zinc-700"
                      )}>
                        <div className={cn(
                          "w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow",
                          proto.active ? "translate-x-5" : "translate-x-0"
                        )} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-dashed border-stone-250 dark:border-zinc-800">
                  <button 
                    onClick={handleFactoryWipe}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold font-mono transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow"
                  >
                    <Trash2 className="w-4 h-4" />
                    INITIATE FACTORY CONFIGURATION WIPE
                  </button>
                  <p className="text-[9px] opacity-40 text-center mt-3 uppercase font-mono tracking-tight leading-normal">
                    Warning: Doing this will clear all descriptions, cards, custom library uploads, and customized identity data completely.
                  </p>
                </div>
              </motion.div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};
