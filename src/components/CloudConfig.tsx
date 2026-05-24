import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  Key, 
  Terminal, 
  Cloud, 
  Plus, 
  History, 
  Search, 
  ChevronRight, 
  Copy, 
  Check, 
  AlertTriangle,
  Database,
  Globe,
  Settings,
  Archive,
  Code,
  Eye,
  EyeOff,
  User,
  Github,
  GitBranch,
  ExternalLink,
  Play,
  Activity
} from "lucide-react";
import { cn } from "@/src/lib/utils";

interface ParameterVersion {
  versionId: string;
  payload: string;
  createdAt: string;
  status: "ACTIVE" | "DEPRECATED";
}

interface CloudBlueprint {
  id: string;
  name: string;
  type: "TERRAFORM" | "GDM";
  payload: string;
}

interface APIKey {
  id: string;
  name: string;
  key: string;
  provider: string;
  createdAt: string;
}

interface Parameter {
  id: string;
  projectId: string;
  location: string;
  name: string;
  currentVersion: string;
  versions: ParameterVersion[];
}

interface GithubWorkflow {
  id: string;
  name: string;
  status: "success" | "failed" | "running";
  event: string;
  startedAt: string;
  duration: string;
}

interface GithubRepo {
  id: string;
  name: string;
  branch: string;
  status: "idle" | "building" | "success" | "failed";
  lastRun: string;
  webhooksEnabled: boolean;
  workflows: GithubWorkflow[];
}

const TERRAFORM_SCRIPT = `resource "google_sql_database_instance" "instance" {
  name             = "my-mysql-instance"
  database_version = "MYSQL_8_0"
  region           = "us-central1"
  project          = "oistarian-nexus-commander"
  deletion_protection = false

  settings {
    tier = "db-f1-micro"
    ip_configuration {
      ipv4_enabled = true
    }
  }
}

resource "google_sql_database" "database" {
  name     = "my-database"
  instance = google_sql_database_instance.instance.name
  project  = "oistarian-nexus-commander"
}

resource "google_sql_user" "users" {
  name     = "root"
  instance = google_sql_database_instance.instance.name
  project  = "oistarian-nexus-commander"
  host     = "%"
  password = "changeme123"
}`;

const INITIAL_BLUEPRINTS: CloudBlueprint[] = [
  { id: "b1", name: "MySQL Cloud SQL Instance", type: "TERRAFORM", payload: TERRAFORM_SCRIPT }
];

const INITIAL_KEYS: APIKey[] = [
  { id: "k1", name: "Gemini Pro Node", key: "AIzaSyAqM4X_pL8k", provider: "Google AI", createdAt: "2026-05-13" },
  { id: "k2", name: "Stripe Connect", key: "sk_live_51Mv9K2L", provider: "Stripe", createdAt: "2026-05-12" },
];

const INITIAL_PARAMETERS: Parameter[] = [
  {
    id: "OISTARIAN",
    projectId: "oistarian-nexus-commander",
    location: "global",
    name: "OISTARIAN",
    currentVersion: "1",
    versions: [
      { versionId: "1", payload: "******ENC_A102****", createdAt: "2026-05-12 14:20:00", status: "ACTIVE" }
    ]
  }
];

const INITIAL_REPOS: GithubRepo[] = [
  {
    id: "repo-1",
    name: "jurgen-paul/Oistarian-NEXUS-ONE-APP",
    branch: "main",
    status: "success",
    lastRun: "2026-05-24 11:45:10",
    webhooksEnabled: true,
    workflows: [
      { id: "wf-1", name: "CI / Build Production Asset", status: "success", event: "push", startedAt: "2026-05-24 11:45:10", duration: "1m 12s" },
      { id: "wf-2", name: "Linter & Strict Code Quality Control", status: "success", event: "push", startedAt: "2026-05-24 11:43:00", duration: "45s" },
      { id: "wf-3", name: "Trigger Cloud Run Deployment Sequence", status: "success", event: "push", startedAt: "2026-05-24 11:42:15", duration: "1m 32s" },
    ]
  },
  {
    id: "repo-2",
    name: "jurgen-paul/Oistarian-CLOUD-INFRA",
    branch: "production",
    status: "failed",
    lastRun: "2026-05-23 09:12:30",
    webhooksEnabled: false,
    workflows: [
      { id: "wf-4", name: "Terraform Cloud Provisioning Plan", status: "failed", event: "push", startedAt: "2026-05-23 09:12:30", duration: "12s" },
      { id: "wf-5", name: "VPC Networking Gateway Verification", status: "success", event: "manual", startedAt: "2026-05-22 17:34:00", duration: "1m 01s" }
    ]
  }
];

export const CloudConfig = () => {
  const [parameters, setParameters] = useState<Parameter[]>(INITIAL_PARAMETERS);
  const [selectedParam, setSelectedParam] = useState<Parameter | null>(INITIAL_PARAMETERS[0]);
  const [blueprints] = useState<CloudBlueprint[]>(INITIAL_BLUEPRINTS);
  const [selectedBlueprint, setSelectedBlueprint] = useState<CloudBlueprint | null>(INITIAL_BLUEPRINTS[0]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>(INITIAL_KEYS);
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(INITIAL_KEYS[0]);
  const [activeView, setActiveView] = useState<"params" | "blueprints" | "keys" | "github">("params");

  // GitHub Repository tracking states
  const [repos, setRepos] = useState<GithubRepo[]>(() => {
    const saved = localStorage.getItem("applet_github_repos");
    return saved ? JSON.parse(saved) : INITIAL_REPOS;
  });
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(() => {
    const saved = localStorage.getItem("applet_github_repos");
    const loaded = saved ? JSON.parse(saved) : INITIAL_REPOS;
    return loaded[0] || null;
  });
  const [isLinkingRepo, setIsLinkingRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoBranch, setNewRepoBranch] = useState("main");
  const [newRepoWebhook, setNewRepoWebhook] = useState(true);

  // Workflow running status simulation
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);

  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPayload, setNewPayload] = useState("");

  const triggerManualWorkflow = (repoId: string) => {
    if (isRunningPipeline) return;
    
    // Set repo state to building
    setRepos(prev => {
      const updated = prev.map(r => r.id === repoId ? { ...r, status: "building" as const } : r);
      localStorage.setItem("applet_github_repos", JSON.stringify(updated));
      return updated;
    });

    setIsRunningPipeline(true);
    setPipelineProgress(0);
    
    const logsSequence = [
      "⚡ [SYSTEM] Establishing secure SSH tunnel payload handshake...",
      "🔍 [CHECK] Finding Oistarian active runner environments...",
      "📦 [EXEC] Fetching master source code metadata from main branch tree...",
      "🧪 [TEST] Running linter static scan (tsc --noEmit & eslint)...",
      "✅ [COMPILATION] Successful. Vite code assets validated without exceptions.",
      "🚀 [DEPLOY] Transmitting Dockerized container image manifest to registry...",
      "🌍 [GATEWAY] Live domain route routing refreshed on Cloud Run.",
      "🎉 [COMPLETE] Deployment completed flawlessly. Action record established."
    ];

    setPipelineLogs([logsSequence[0]]);

    let progression = 0;
    const interval = setInterval(() => {
      progression += 10;
      setPipelineProgress(progression);

      // Add log statements periodically
      const stepIndex = Math.min(Math.floor(progression / 13.5), logsSequence.length - 1);
      setPipelineLogs(prev => {
        const nextLogs = [...prev];
        if (!nextLogs.includes(logsSequence[stepIndex])) {
          nextLogs.push(logsSequence[stepIndex]);
        }
        return nextLogs;
      });

      if (progression >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsRunningPipeline(false);
          
          setRepos(prev => {
            const updated = prev.map(r => {
              if (r.id === repoId) {
                const newWf: GithubWorkflow = {
                  id: "wf-" + Date.now(),
                  name: "Manual triggered build pipeline",
                  status: "success",
                  event: "manual",
                  startedAt: new Date().toISOString().replace('T', ' ').split('.')[0],
                  duration: "52s"
                };
                const updatedRepo = {
                  ...r,
                  status: "success" as const,
                  lastRun: newWf.startedAt,
                  workflows: [newWf, ...r.workflows]
                };
                if (selectedRepo?.id === repoId) {
                  setSelectedRepo(updatedRepo);
                }
                return updatedRepo;
              }
              return r;
            });
            localStorage.setItem("applet_github_repos", JSON.stringify(updated));
            return updated;
          });
        }, 600);
      }
    }, 300);
  };

  const toggleRepoWebhooks = (repoId: string) => {
    setRepos(prev => {
      const updated = prev.map(r => {
        if (r.id === repoId) {
          const updatedRepo = { ...r, webhooksEnabled: !r.webhooksEnabled };
          if (selectedRepo?.id === repoId) {
            setSelectedRepo(updatedRepo);
          }
          return updatedRepo;
        }
        return r;
      });
      localStorage.setItem("applet_github_repos", JSON.stringify(updated));
      return updated;
    });
  };

  const deleteWorkflowRun = (repoId: string, wfId: string) => {
    setRepos(prev => {
      const updated = prev.map(r => {
        if (r.id === repoId) {
          const updatedRepo = {
            ...r,
            workflows: r.workflows.filter(w => w.id !== wfId)
          };
          if (selectedRepo?.id === repoId) {
            setSelectedRepo(updatedRepo);
          }
          return updatedRepo;
        }
        return r;
      });
      localStorage.setItem("applet_github_repos", JSON.stringify(updated));
      return updated;
    });
  };

  const linkNewRepository = () => {
    if (!newRepoName) return;

    const newRepository: GithubRepo = {
      id: "repo-" + Date.now(),
      name: newRepoName.includes("/") ? newRepoName : "oistar-studio/" + newRepoName,
      branch: newRepoBranch,
      status: "idle",
      lastRun: "Never run yet",
      webhooksEnabled: newRepoWebhook,
      workflows: []
    };

    setRepos(prev => {
      const updated = [...prev, newRepository];
      localStorage.setItem("applet_github_repos", JSON.stringify(updated));
      return updated;
    });

    setSelectedRepo(newRepository);
    setNewRepoName("");
    setNewRepoBranch("main");
    setIsLinkingRepo(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const createNewVersion = () => {
    if (!newPayload || !selectedParam) return;
    
    const newVersion: ParameterVersion = {
      versionId: (selectedParam.versions.length + 1).toString(),
      payload: newPayload,
      createdAt: new Date().toISOString().replace('T', ' ').split('.')[0],
      status: "ACTIVE"
    };

    const updatedParams = parameters.map(p => {
      if (p.id === selectedParam.id) {
        return {
          ...p,
          currentVersion: newVersion.versionId,
          versions: [newVersion, ...p.versions]
        };
      }
      return p;
    });

    setParameters(updatedParams);
    setSelectedParam(updatedParams.find(p => p.id === selectedParam.id) || null);
    setNewPayload("");
    setIsCreating(false);
  };

  return (
    <div className="h-full flex flex-col bg-nexus-bg">
      <header className="p-8 border-b border-white/5 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight neon-text uppercase">Cloud Architect</h1>
          <p className="text-nexus-text-dim mt-2 tracking-widest text-[10px] uppercase font-mono">
            Infrastructure & Parameters <span className="text-nexus-accent ml-2">// ORCH_CENTER_v.2.0</span>
          </p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 overflow-x-auto gap-0.5">
          <button 
            onClick={() => setActiveView("params")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0",
              activeView === "params" ? "bg-nexus-accent text-black" : "text-nexus-text-dim hover:text-white"
            )}
          >
            Parameters
          </button>
          <button 
            onClick={() => setActiveView("blueprints")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0",
              activeView === "blueprints" ? "bg-nexus-accent text-black" : "text-nexus-text-dim hover:text-white"
            )}
          >
            Blueprints
          </button>
          <button 
            onClick={() => setActiveView("keys")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0",
              activeView === "keys" ? "bg-nexus-accent text-black" : "text-nexus-text-dim hover:text-white"
            )}
          >
            API Keys
          </button>
          <button 
            onClick={() => setActiveView("github")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5",
              activeView === "github" ? "bg-nexus-accent text-black" : "text-nexus-text-dim hover:text-white"
            )}
          >
            <Github className="w-3.5 h-3.5" /> GitHub CI/CD
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Resource List */}
        <div className="w-80 border-r border-white/5 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-nexus-text-dim" />
              <input 
                type="text" 
                placeholder="Filter resources..."
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-[10px] font-mono text-white focus:outline-none focus:border-nexus-accent/50 transition-colors"
              />
            </div>

            {activeView === "github" && (
              <button 
                onClick={() => setIsLinkingRepo(true)}
                className="w-full py-2.5 bg-nexus-accent/10 border border-nexus-accent/20 text-nexus-accent hover:bg-nexus-accent/20 rounded-xl text-[10px] font-bold font-mono tracking-widest uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Link Repository
              </button>
            )}

            <div className="space-y-2">
              {activeView === "params" ? parameters.map((param) => (
                <button
                  key={param.id}
                  onClick={() => setSelectedParam(param)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all",
                    selectedParam?.id === param.id 
                      ? "bg-nexus-accent/10 border-nexus-accent/30" 
                      : "bg-white/5 border-transparent hover:border-white/10"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Key className={cn("w-3 h-3", selectedParam?.id === param.id ? "text-nexus-accent" : "text-nexus-text-dim")} />
                    <span className="text-xs font-bold text-white uppercase">{param.name}</span>
                  </div>
                  <p className="text-[9px] text-nexus-text-dim truncate font-mono">{param.projectId}</p>
                </button>
              )) : activeView === "blueprints" ? blueprints.map((bp) => (
                <button
                  key={bp.id}
                  onClick={() => setSelectedBlueprint(bp)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all",
                    selectedBlueprint?.id === bp.id 
                      ? "bg-nexus-accent/10 border-nexus-accent/30" 
                      : "bg-white/5 border-transparent hover:border-white/10"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Code className={cn("w-3 h-3", selectedBlueprint?.id === bp.id ? "text-nexus-accent" : "text-nexus-text-dim")} />
                    <span className="text-xs font-bold text-white uppercase">{bp.name}</span>
                  </div>
                  <p className="text-[9px] text-nexus-text-dim truncate font-mono">{bp.type}</p>
                </button>
              )) : activeView === "keys" ? apiKeys.map((k) => (
                <button
                  key={k.id}
                  onClick={() => setSelectedKey(k)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all",
                    selectedKey?.id === k.id 
                      ? "bg-nexus-accent/10 border-nexus-accent/30" 
                      : "bg-white/5 border-transparent hover:border-white/10"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className={cn("w-3 h-3", selectedKey?.id === k.id ? "text-nexus-accent" : "text-nexus-text-dim")} />
                    <span className="text-xs font-bold text-white uppercase">{k.name}</span>
                  </div>
                  <p className="text-[9px] text-nexus-text-dim truncate font-mono">{k.provider}</p>
                </button>
              )) : repos.map((repo) => {
                const latestWf = repo.workflows && repo.workflows.length > 0 ? repo.workflows[0] : null;
                const status = repo.status === "building" ? "running" : (latestWf ? latestWf.status : "idle");
                
                return (
                  <button
                    key={repo.id}
                    onClick={() => setSelectedRepo(repo)}
                    className={cn(
                      "github-repo-card w-full text-left p-4 rounded-xl border transition-all space-y-2.5",
                      selectedRepo?.id === repo.id 
                        ? "bg-nexus-accent/10 border-nexus-accent/30 shadow-[0_4px_20px_rgba(5,255,161,0.05)]" 
                        : "bg-white/5 border-transparent hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Github className={cn("w-3 h-3 shrink-0", selectedRepo?.id === repo.id ? "text-nexus-accent" : "text-nexus-text-dim")} />
                        <span className="text-xs font-bold text-white truncate uppercase">{repo.name.split("/")[1] || repo.name}</span>
                        <span className="flex items-center gap-0.5 text-[8px] font-mono font-black text-nexus-text-dim px-1 py-0.5 rounded bg-white/5 border border-white/10 shrink-0 uppercase">
                          <GitBranch className="w-2.5 h-2.5 text-nexus-accent/80" />
                          {repo.branch}
                        </span>
                      </div>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        status === "running" ? "bg-amber-500 animate-pulse" : status === "success" ? "bg-emerald-500" : status === "failed" ? "bg-red-500" : "bg-zinc-500"
                      )} />
                    </div>
                    
                    <p className="text-[9px] text-nexus-text-dim truncate font-mono">{repo.name}</p>
                    
                    {/* Latest CI/CD Workflow Summary Status Indicator */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[8.5px] font-mono">
                      <span className="text-nexus-text-dim truncate max-w-[120px] uppercase">
                        {latestWf ? latestWf.name : "No Recent Runs"}
                      </span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded font-black uppercase tracking-widest shrink-0 text-[7px]",
                        status === "success" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : status === "failed" 
                            ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                            : status === "running"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                              : "bg-white/5 text-nexus-text-dim border border-white/10"
                      )}>
                        {status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dashboard Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20">
          {activeView === "params" && selectedParam && (
            <div className="p-8 space-y-8 max-w-5xl mx-auto">
              <section className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 glass p-8 rounded-[40px] border border-nexus-accent/20 bg-nexus-accent/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Cloud className="w-32 h-32 text-nexus-accent" />
                  </div>
                  <h2 className="text-3xl font-display font-black text-white uppercase mb-2">
                    {selectedParam.name}
                  </h2>
                  <div className="flex items-center gap-4 text-[10px] font-mono text-nexus-text-dim">
                    <span className="flex items-center gap-1.5"><Database className="w-3 h-3" /> {selectedParam.projectId}</span>
                    <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> {selectedParam.location}</span>
                  </div>
                  <div className="mt-8 flex gap-4">
                    <button 
                      onClick={() => setIsCreating(true)}
                      className="px-6 py-2 bg-nexus-accent text-black font-bold rounded-xl text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(5,255,161,0.4)] transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> New Version
                    </button>
                    <button className="px-6 py-2 glass border-white/10 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Parameters Settings
                    </button>
                  </div>
                </div>

                <div className="w-full md:w-64 space-y-4">
                  <div className="glass p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-mono text-nexus-text-dim uppercase tracking-widest mb-1">Active Version</p>
                    <p className="text-2xl font-display font-black text-white">v{selectedParam.currentVersion}</p>
                  </div>
                  <div className="glass p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-mono text-nexus-text-dim uppercase tracking-widest mb-1">Last Deployment</p>
                    <p className="text-xs font-mono text-nexus-accent">{selectedParam.versions[0].createdAt}</p>
                  </div>
                </div>
              </section>

              {/* Version History / Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-mono text-xs uppercase tracking-widest">
                    <History className="w-4 h-4 text-nexus-accent" />
                    Version Timeline
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedParam.versions.map((version) => (
                    <motion.div 
                      key={version.versionId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass p-5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs",
                          version.versionId === selectedParam.currentVersion ? "bg-nexus-accent text-black" : "bg-white/5 text-nexus-text-dim"
                        )}>
                          {version.versionId}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs font-bold text-white font-mono">ID: {version.versionId}</span>
                            <span className={cn(
                              "text-[8px] px-1.5 py-0.5 rounded font-bold uppercase",
                              version.status === "ACTIVE" ? "bg-nexus-accent/20 text-nexus-accent" : "bg-white/10 text-nexus-text-dim"
                            )}>{version.status}</span>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] font-mono text-nexus-text-dim">
                            <span>Created: {version.createdAt}</span>
                            <span className="cursor-pointer hover:text-white flex items-center gap-1" onClick={() => handleCopy(version.payload)}>
                              {copied === version.payload ? <Check className="w-3 h-3 text-nexus-accent" /> : <Copy className="w-3 h-3" />}
                              Payload
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 glass rounded-lg hover:text-blue-400 transition-colors">
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Version CLI Simulation */}
              <div className="glass p-6 rounded-3xl border border-white/5 bg-black/40 space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-nexus-text-dim">
                  <Terminal className="w-4 h-4" />
                  COMMAND PREVIEW
                </div>
                <div className="p-4 rounded-xl bg-black border border-white/5 text-[10px] font-mono text-nexus-accent overflow-x-auto whitespace-pre">
                  {`gcloud parametermanager parameters versions create projects/${selectedParam.projectId}/locations/${selectedParam.location}/parameters/${selectedParam.name} --parameter=${selectedParam.id} --location=${selectedParam.location} --payload-data="PARAMETER_PAYLOAD"`}
                </div>
              </div>
            </div>
          )}

          {activeView === "blueprints" && selectedBlueprint && (
            <div className="p-8 space-y-8 max-w-5xl mx-auto">
              <div className="flex justify-between items-center bg-nexus-accent/5 p-8 rounded-[40px] border border-nexus-accent/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Terminal className="w-32 h-32 text-nexus-accent" />
                </div>
                <div>
                  <h2 className="text-3xl font-display font-black text-white uppercase">{selectedBlueprint.name}</h2>
                  <p className="text-nexus-text-dim font-mono text-[10px] mt-1 uppercase tracking-widest">Type: {selectedBlueprint.type}</p>
                </div>
                <button 
                  onClick={() => handleCopy(selectedBlueprint.payload)}
                  className="px-6 py-2 bg-nexus-accent text-black font-bold rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all"
                >
                  {copied === selectedBlueprint.payload ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copy Code
                </button>
              </div>

              <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-nexus-text-dim tracking-widest">MAIN.TF</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-white/10" />)}
                  </div>
                </div>
                <div className="p-6 bg-black overflow-x-auto">
                  <pre className="text-nexus-accent font-mono text-[11px] leading-relaxed">
                    {selectedBlueprint.payload}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {((activeView === "params" && !selectedParam) || (activeView === "blueprints" && !selectedBlueprint) || (activeView === "keys" && !selectedKey) || (activeView === "github" && !selectedRepo)) && (
            <div className="h-full flex flex-col items-center justify-center text-nexus-text-dim space-y-4">
              <Settings className="w-16 h-16 opacity-10 animate-spin-slow" />
              <p className="text-xs uppercase tracking-widest font-mono">Select a resource to orchestrate</p>
            </div>
          )}

          {activeView === "keys" && selectedKey && (
            <div className="p-8 space-y-8 max-w-5xl mx-auto">
              <div className="flex justify-between items-center bg-nexus-accent/5 p-8 rounded-[40px] border border-nexus-accent/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Shield className="w-32 h-32 text-nexus-accent" />
                </div>
                <div>
                  <h2 className="text-3xl font-display font-black text-white uppercase">{selectedKey.name}</h2>
                  <p className="text-nexus-text-dim font-mono text-[10px] mt-1 uppercase tracking-widest">Provider: {selectedKey.provider}</p>
                </div>
                <div className="flex gap-4">
                  <button className="px-6 py-2 glass border-white/10 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                    Rotate Key
                  </button>
                </div>
              </div>

              <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
                <div>
                  <label className="block text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest mb-3">Secret API Key</label>
                  <div className="relative group">
                    <input 
                      type={showKey ? "text" : "password"}
                      value={selectedKey.key}
                      readOnly
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-6 pr-24 text-sm font-mono text-nexus-accent focus:outline-none focus:border-nexus-accent/50 transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button 
                        onClick={() => setShowKey(!showKey)}
                        className="p-2 text-nexus-text-dim hover:text-white transition-colors"
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleCopy(selectedKey.key)}
                        className="p-2 text-nexus-text-dim hover:text-white transition-colors"
                      >
                        {copied === selectedKey.key ? <Check className="w-4 h-4 text-nexus-accent" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-[9px] text-nexus-text-dim font-mono italic">
                    Key established on {selectedKey.createdAt}. High-frequency access detected.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[9px] font-mono text-nexus-text-dim uppercase tracking-widest mb-1">Access Level</p>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">FULL_ADMIN_WRITE</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[9px] font-mono text-nexus-text-dim uppercase tracking-widest mb-1">Usage Quota</p>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">UNLIMITED</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === "github" && selectedRepo && (
            <div className="p-8 space-y-8 max-w-5xl mx-auto">
              <section className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 glass p-8 rounded-[40px] border border-nexus-accent/20 bg-nexus-accent/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Github className="w-32 h-32 text-nexus-accent" />
                  </div>
                  <h2 className="text-3xl font-display font-black text-white uppercase mb-2">
                    {selectedRepo.name.split("/")[1] || selectedRepo.name}
                  </h2>
                  <div className="flex items-center gap-4 text-[10px] font-mono text-nexus-text-dim">
                    <span className="flex items-center gap-1.5"><Github className="w-4.5 h-4.5 text-nexus-accent" /> {selectedRepo.name}</span>
                    <span className="flex items-center gap-1.5"><GitBranch className="w-4 h-4 text-indigo-400" /> DEFAULT BRANCH: {selectedRepo.branch}</span>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <button 
                      onClick={() => triggerManualWorkflow(selectedRepo.id)}
                      disabled={isRunningPipeline || selectedRepo.status === "building"}
                      className={cn(
                        "px-6 py-2.5 bg-nexus-accent text-black font-bold rounded-xl text-xs uppercase tracking-widest transition-all flex items-center gap-2",
                        (isRunningPipeline || selectedRepo.status === "building") 
                          ? "opacity-55 cursor-not-allowed" 
                          : "hover:shadow-[0_0_20px_rgba(5,255,161,0.4)] cursor-pointer"
                      )}
                    >
                      {selectedRepo.status === "building" ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-900 border-t-transparent animate-spin shrink-0" />
                          Running ({pipelineProgress}%)
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 shrink-0" /> Trigger Pipeline
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => toggleRepoWebhooks(selectedRepo.id)}
                      className="px-6 py-2.5 glass border-white/10 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5 text-nexus-accent" /> 
                      {selectedRepo.webhooksEnabled ? "Webhook Connected" : "Connect Webhook"}
                    </button>
                  </div>
                </div>

                <div className="w-full md:w-64 space-y-4 shrink-0">
                  <div className="glass p-5 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-mono text-nexus-text-dim uppercase tracking-widest mb-1.5 font-bold">Latest Automation Status</p>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] px-2.5 py-1 rounded font-mono font-black uppercase text-xs",
                        selectedRepo.status === "success" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : selectedRepo.status === "failed" 
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : selectedRepo.status === "building"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                              : "bg-white/5 text-nexus-text-dim border border-white/10"
                      )}>
                        {selectedRepo.status}
                      </span>
                    </div>
                  </div>
                  <div className="glass p-5 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-mono text-nexus-text-dim uppercase tracking-widest mb-1.5 font-bold">Webhook Deliveries</p>
                    <p className="text-xs font-mono text-nexus-accent">{selectedRepo.webhooksEnabled ? "ACTIVE (LISTENING)" : "INACTIVE"}</p>
                  </div>
                </div>
              </section>

              {/* Simulation Terminal Log during active build state */}
              {selectedRepo.status === "building" && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass p-6 rounded-3xl border border-nexus-accent/30 bg-black/80 space-y-4"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-nexus-accent">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                      <Terminal className="w-4 h-4 animate-pulse" />
                      CI/CD INTERACTIVE PIPELINE STREAM
                    </div>
                    <span>{pipelineProgress}% Done</span>
                  </div>
                  
                  <div className="w-full bg-white/5 h-1 md:h-1.5 rounded-full overflow-hidden">
                    <div className="bg-nexus-accent h-full transition-all duration-300" style={{ width: `${pipelineProgress}%` }} />
                  </div>
                  <div className="p-4 rounded-xl bg-black border border-white/5 text-[10.5px] font-mono text-emerald-400 min-h-[140px] max-h-[220px] overflow-y-auto space-y-2.5 custom-scrollbar">
                    {pipelineLogs.map((log, index) => (
                      <div key={index} className="opacity-90 leading-relaxed font-semibold">{log}</div>
                    ))}
                    <div className="animate-pulse inline-block w-1.5 h-3 bg-nexus-accent" />
                  </div>
                </motion.div>
              )}

              {/* Workflows timelines logs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-white/5">
                  <div className="flex items-center gap-2 text-white font-mono text-xs uppercase tracking-widest font-extrabold text-white">
                    <History className="w-4 h-4 text-nexus-accent" />
                    Automation Run Records
                  </div>
                  <span className="text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest">
                    {selectedRepo.workflows.length} Triggered Actions
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedRepo.workflows.length === 0 ? (
                    <div className="glass p-8 text-center rounded-2xl border border-white/5 text-nexus-text-dim text-xs font-mono uppercase tracking-widest">
                      No jobs have run in this repository. Trigger a pipeline manual run to begin tracking automation.
                    </div>
                  ) : selectedRepo.workflows.map((wf) => (
                    <div 
                      key={wf.id}
                      className="glass p-5 rounded-2xl border border-white/5 flex items-center justify-between hover:border-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0",
                          wf.status === "success" 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : wf.status === "failed"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-amber-500/10 text-amber-400 animate-spin"
                        )}>
                          {wf.status === "success" ? "✓" : wf.status === "failed" ? "✗" : "⟳"}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">{wf.name}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] font-mono text-nexus-text-dim mt-2">
                            <span className="bg-white/5 px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-widest text-white">{wf.event} event</span>
                            <span>Triggered: {wf.startedAt}</span>
                            <span>Duration: {wf.duration}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <a 
                          href={`https://github.com/${selectedRepo.name}/actions`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-3 py-1.5 text-[8px] tracking-widest bg-white/5 hover:bg-white/10 text-white rounded font-mono uppercase font-bold flex items-center gap-1 cursor-pointer transition-colors inline-flex align-center"
                        >
                          Logs <ExternalLink className="w-2.5 h-2.5 ml-1" />
                        </a>
                        <button 
                          onClick={() => deleteWorkflowRun(selectedRepo.id, wf.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Purge record"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Version / GitHub Linking Modals */}
      <AnimatePresence>
        {isLinkingRepo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLinkingRepo(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg glass p-8 rounded-[40px] border border-nexus-accent/30 bg-nexus-bg shadow-[0_0_50px_rgba(5,255,161,0.1)] font-sans"
            >
              <h3 className="text-2xl font-display font-black text-white uppercase mb-6 flex items-center gap-3">
                <Github className="w-6 h-6 text-nexus-accent" />
                Link GitHub Repo
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest mb-2 font-bold">Repository Path (owner/repo)</label>
                  <input 
                    type="text"
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value)}
                    placeholder="e.g. jurgen-paul/Oistarian-SECURE-API"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-mono text-white focus:outline-none focus:border-nexus-accent/50 transition-all font-semibold"
                  />
                  <p className="mt-2 text-[9px] text-nexus-text-dim font-mono italic">
                    You can input standard owner/repo structures. Prefix defaults to "oistar-studio/" if simple format.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest mb-2 font-bold font-mono">Default Branch</label>
                    <input 
                      type="text"
                      value={newRepoBranch}
                      onChange={(e) => setNewRepoBranch(e.target.value)}
                      placeholder="e.g. main"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-xs font-mono text-white focus:outline-none focus:border-nexus-accent/50 transition-all font-semibold"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2.5 text-xs font-mono text-white uppercase tracking-wider cursor-pointer select-none pb-4 font-mono">
                      <input 
                        type="checkbox"
                        checked={newRepoWebhook}
                        onChange={(e) => setNewRepoWebhook(e.target.checked)}
                        className="w-4 h-4 accent-nexus-accent rounded border-white/10 bg-black/40"
                      />
                      Add Webhook
                    </label>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-nexus-accent/5 border border-nexus-accent/15 flex gap-3">
                  <Activity className="w-5 h-5 text-nexus-accent shrink-0" />
                  <p className="text-[10px] text-nexus-text-dim leading-relaxed font-mono">
                    Adding a webhook authorizes GitHub to ping this workspace on any push event to track real-time builds.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={linkNewRepository}
                    className="flex-1 py-3 bg-nexus-accent text-black font-bold rounded-xl text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all font-mono"
                  >
                    Confirm Link
                  </button>
                  <button 
                    onClick={() => setIsLinkingRepo(false)}
                    className="px-6 py-3 glass border-white/10 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-white/10 transition-all font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isCreating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreating(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg glass p-8 rounded-[40px] border border-nexus-accent/30 bg-nexus-bg shadow-[0_0_50px_rgba(5,255,161,0.1)]"
            >
              <h3 className="text-2xl font-display font-black text-white uppercase mb-6 flex items-center gap-3">
                <Shield className="w-6 h-6 text-nexus-accent" />
                Inject New Version
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono text-nexus-text-dim uppercase tracking-widest mb-2">Payload Data</label>
                  <textarea 
                    value={newPayload}
                    onChange={(e) => setNewPayload(e.target.value)}
                    placeholder="Enter raw payload string..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-mono text-white focus:outline-none focus:border-nexus-accent/50 min-h-[120px] transition-all"
                  />
                  <p className="mt-2 text-[9px] text-nexus-text-dim font-mono italic">
                    Note: Payload will be encrypted using Nexus Commander v2 protocols.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-[10px] text-red-400 leading-relaxed font-mono">
                    CAUTION: Creating a new version increments the globally available parameter. This action remains in the immutable audit log.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={createNewVersion}
                    className="flex-1 py-3 bg-nexus-accent text-black font-bold rounded-xl text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
                  >
                    Commit Version
                  </button>
                  <button 
                    onClick={() => setIsCreating(false)}
                    className="px-6 py-3 glass border-white/10 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
