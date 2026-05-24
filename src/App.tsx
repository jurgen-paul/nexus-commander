/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Edit2, 
  Save, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Check, 
  FileText, 
  Layout, 
  Sliders, 
  Palette, 
  BookOpen,
  Hash,
  Activity,
  ArrowRight,
  User as UserIcon,
  ExternalLink,
  ChevronRight,
  Database,
  CloudLightning,
  UserCheck,
  Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings } from './components/AppSettings';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Design Theme Presets matching design guidelines:
// Theme 1: Warm Organic (Crafted serif, soft earth tones)
// Theme 2: Technical Matte (Precision grids, dark instrument UI)
// Theme 3: Clean Minimal (Trustworthy, banking utility lines)
type ThemeId = 'warm' | 'technical' | 'minimal';

interface CardItem {
  id: string;
  title: string;
  category: string;
  content: string;
  updatedAt: string;
}

const DEFAULT_DESCRIPTION = "A professional and minimal creative workspace dashboard featuring rich typography, data visualization, and an integrated AI assistant to curate draft project outlines and custom copy.";

const INITIAL_CARDS: CardItem[] = [
  {
    id: '1',
    title: 'Editorial Framework',
    category: 'Draft',
    content: 'Define consistent rhythmic typography and grid systems across major editorial components.',
    updatedAt: '2026-05-19 12:30'
  },
  {
    id: '2',
    title: 'Gemini Integration Module',
    category: 'Active',
    content: 'Establish secure server-side proxy routes to query AI models seamlessly without browser key leakage.',
    updatedAt: '2026-05-19 14:15'
  },
  {
    id: '3',
    title: 'Visual Assets Moodboard',
    category: 'Inspiration',
    content: 'A high-contrast aesthetic exploration featuring clean stone borders, thin divider rules, and raw monospace overlays.',
    updatedAt: '2026-05-19 15:02'
  }
];

export default function App() {
  // Navigation View
  const [currentView, setCurrentView] = useState<'desk' | 'settings'>('desk');

  // Account / Profile states
  const [avatar, setAvatar] = useState<string>(() => {
    return localStorage.getItem('applet_avatar') || 'https://picsum.photos/seed/commander/120/120';
  });
  const [alias, setAlias] = useState<string>(() => {
    return localStorage.getItem('applet_alias') || 'COMMANDER';
  });
  const [email, setEmail] = useState<string>(() => {
    return localStorage.getItem('applet_email') || 'commander@nexus.one';
  });
  const [rank, setRank] = useState<string>(() => {
    return localStorage.getItem('applet_rank') || 'System Architect / Lead';
  });
  const [accessLevel, setAccessLevel] = useState<string>(() => {
    return localStorage.getItem('applet_access_level') || 'ULTRA-VIOLET';
  });

  // Firebase auth & cloud sync parameters
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsSyncing(true);
        try {
          const docRef = doc(db, 'user_profiles', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.alias) {
              setAlias(data.alias);
              localStorage.setItem('applet_alias', data.alias);
            }
            if (data.email) {
              setEmail(data.email);
              localStorage.setItem('applet_email', data.email);
            }
            if (data.rank) {
              setRank(data.rank);
              localStorage.setItem('applet_rank', data.rank);
            }
            if (data.accessLevel) {
              setAccessLevel(data.accessLevel);
              localStorage.setItem('applet_access_level', data.accessLevel);
            }
            if (data.theme) {
              setTheme(data.theme as ThemeId);
              localStorage.setItem('applet_theme', data.theme);
            }
            if (data.avatar) {
              setAvatar(data.avatar);
              localStorage.setItem('applet_avatar', data.avatar);
            }
            setLastSynced(new Date().toLocaleTimeString());
          } else {
            // First time login - seed local profile data to Firestore
            const seedAlias = localStorage.getItem('applet_alias') || 'COMMANDER';
            const seedEmail = user.email || localStorage.getItem('applet_email') || 'commander@nexus.one';
            const seedRank = localStorage.getItem('applet_rank') || 'System Architect / Lead';
            const seedAccess = localStorage.getItem('applet_access_level') || 'ULTRA-VIOLET';
            const seedTheme = localStorage.getItem('applet_theme') || 'warm';
            const seedAvatar = user.photoURL || localStorage.getItem('applet_avatar') || 'https://picsum.photos/seed/commander/120/120';

            const profileData = {
              userId: user.uid,
              alias: seedAlias,
              email: seedEmail,
              rank: seedRank,
              accessLevel: seedAccess,
              theme: seedTheme,
              avatar: seedAvatar,
              updatedAt: new Date().toISOString()
            };
            await setDoc(docRef, profileData);
            setLastSynced(new Date().toLocaleTimeString());
          }
        } catch (error) {
          console.error("Cloud synchronization failed during auth change:", error);
        } finally {
          setIsSyncing(false);
        }
      } else {
        setLastSynced(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setIsSyncing(true);
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google authenticated popup login failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSyncing(true);
      await signOut(auth);
    } catch (error) {
      console.error("Firebase authentications exit request failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const cloudCommitProfile = async (newAlias: string, newEmail: string, newRank: string, newAccess: string, newAvatarUrl: string) => {
    if (!auth.currentUser) return;
    setIsSyncing(true);
    try {
      const docRef = doc(db, 'user_profiles', auth.currentUser.uid);
      const profileData = {
        userId: auth.currentUser.uid,
        alias: newAlias,
        email: newEmail,
        rank: newRank,
        accessLevel: newAccess,
        theme: theme,
        avatar: newAvatarUrl,
        updatedAt: new Date().toISOString()
      };
      await setDoc(docRef, profileData);
      setLastSynced(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Failed to commit settings to Firebase Firestore:", error);
      try {
        handleFirestoreError(error, OperationType.WRITE, `user_profiles/${auth.currentUser.uid}`);
      } catch (err) {
        // caught
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Persistence state
  const [description, setDescription] = useState<string>(() => {
    return localStorage.getItem('applet_description') || DEFAULT_DESCRIPTION;
  });
  const [isEditingDesc, setIsEditingDesc] = useState<boolean>(false);
  const [descInput, setDescInput] = useState<string>(description);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [theme, setTheme] = useState<ThemeId>(() => {
    return (localStorage.getItem('applet_theme') as ThemeId) || 'warm';
  });

  const [cards, setCards] = useState<CardItem[]>(() => {
    const saved = localStorage.getItem('applet_cards');
    return saved ? JSON.parse(saved) : INITIAL_CARDS;
  });

  // AI Assistant States
  const [aiVibe, setAiVibe] = useState<string>('editorial');
  const [isGeneratingDesc, setIsGeneratingDesc] = useState<boolean>(false);
  const [aiPromptTopic, setAiPromptTopic] = useState<string>('');
  const [isGeneratingCard, setIsGeneratingCard] = useState<boolean>(false);
  const [aiOutput, setAiOutput] = useState<string>('');
  const [activeTemplate, setActiveTemplate] = useState<string>('');
  
  // Custom Card Input States
  const [newCardTitle, setNewCardTitle] = useState<string>('');
  const [newCardCat, setNewCardCat] = useState<string>('Draft');
  const [newCardContent, setNewCardContent] = useState<string>('');
  const [isCreatingCard, setIsCreatingCard] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Save state to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('applet_description', description);
  }, [description]);

  // Debounced auto-save for description
  useEffect(() => {
    // Only auto-save if editing and the input differs from the current description
    if (!isEditingDesc || descInput === description) return;

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      setDescription(descInput);
      setSaveStatus('saved');
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [descInput, isEditingDesc, description]);

  // Handle resetting saved status back to idle after a brief duration
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  useEffect(() => {
    localStorage.setItem('applet_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('applet_cards', JSON.stringify(cards));
  }, [cards]);

  // Handle Description Updates
  const handleSaveDescription = (newText: string) => {
    setDescription(newText);
    setIsEditingDesc(false);
  };

  // call Gemini API on server side to generate a polished description
  const handleAiDescriptionGenerate = async () => {
    setIsGeneratingDesc(true);
    try {
      const prompt = `Rewrite and polish this application description for an app named 'Master Command Centre'.
      The target vibe / style is: "${aiVibe}" (e.g. brutalist, minimalist, luxury, technical, warm, corporate).
      
      Current description to refine: "${description}"
      
      Requirements:
      - Write exactly 1-2 powerful, professional, and evocative sentences.
      - Return only the refined description. Do not include introductory text, tags, quotes, or any formatting.`;

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: 'You are an elite silicon-valley branding specialist and creative copywriter.'
        })
      });

      const data = await res.json();
      if (data.text) {
        const cleanedText = data.text.trim().replace(/^"|"$/g, '');
        setDescription(cleanedText);
        setDescInput(cleanedText);
      } else if (data.error) {
        alert(`Gemini response error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Could not generate description. Is the server running? Check backend logs.');
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  // Generate a new workspace card suggestion using AI
  const handleAiCardGenerate = async (templateId: string, customPromptText?: string) => {
    setIsGeneratingCard(true);
    let systemInstruction = 'You are a brilliant chief product engineer and product manager brainstorm assistant.';
    let prompt = '';

    if (templateId === 'card_idea') {
      prompt = `Generate a creative feature or draft note for a workspace card in an app called 'Master Command Centre'.
      It should be relevant to curation, design, productivity, or writing.
      Current context/mood: "${theme === 'warm' ? 'Refined Editorial Craft' : theme === 'technical' ? 'Precision Instrument Dashboard' : 'Trustworthy Minimal Utility'}".
      
      Format the response in pure JSON exactly like this:
      {
        "title": "A punchy feature/draft title",
        "category": "One of: Draft, Active, Inspiration, Core, UI",
        "content": "A high-quality 1-sentence description suggesting a task, layout ideal, code block setup, or asset."
      }
      
      Return ONLY the raw JSON string and nothing else.`;
      systemInstruction = 'You are an API that outputs strictly raw JSON conformant to the requested structure.';
    } else {
      prompt = `Generate helpful copy or project brainstorm outline for this custom prompt: "${customPromptText || 'Drafting copy for project dashboard'}".
      Theme style: "${theme}". 
      Write a beautiful curated outline or set of copywriting drafts. Make it look professional with elegant markdown.`;
    }

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction })
      });
      const data = await res.json();
      
      if (data.text) {
        if (templateId === 'card_idea') {
          // Parse the JSON representation
          try {
            const parsed = JSON.parse(data.text.trim().replace(/```json|```/g, ''));
            const newCardItem: CardItem = {
              id: Date.now().toString(),
              title: parsed.title || 'Brand Strategy Concept',
              category: parsed.category || 'Inspiration',
              content: parsed.content || 'Detailed concept crafted automatically with AI assistance.',
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
            };
            setCards(prev => [newCardItem, ...prev]);
            setAiOutput('Successfully spawned a new AI curated card in your list!');
          } catch {
            // Fallback if formatting was slightly off
            const lines = data.text.split('\n');
            const fallbackCard: CardItem = {
              id: Date.now().toString(),
              title: 'Brainstorm Concept',
              category: 'Inspiration',
              content: data.text.trim().substring(0, 150),
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
            };
            setCards(prev => [fallbackCard, ...prev]);
          }
        } else {
          setAiOutput(data.text);
        }
      } else if (data.error) {
        setAiOutput(`Failed to generate: ${data.error}`);
      }
    } catch (e: any) {
      console.error(e);
      setAiOutput('Connection failed. Server may be compiling/restarting. Please try again.');
    } finally {
      setIsGeneratingCard(false);
    }
  };

  // Add Manual Card
  const handleAddNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;

    const newItem: CardItem = {
      id: Date.now().toString(),
      title: newCardTitle,
      category: newCardCat,
      content: newCardContent || 'No description provided yet.',
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setCards(prev => [newItem, ...prev]);
    setNewCardTitle('');
    setNewCardContent('');
    setIsCreatingCard(false);
  };

  // Delete Card
  const handleDeleteCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

  // Search filter
  const filteredCards = cards.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics calculations
  const totalCharacters = description.length + cards.reduce((sum, c) => sum + c.title.length + c.content.length, 0);
  const estimatedReadTime = Math.ceil((description.split(/\s+/).length + cards.reduce((sum, c) => sum + c.content.split(/\s+/).length, 0)) / 180);

  // Theme styles classes picker
  const getThemeContainerClass = () => {
    switch(theme) {
      case 'technical':
        return 'bg-zinc-950 text-zinc-100 font-mono border-zinc-800';
      case 'minimal':
        return 'bg-white text-slate-900 font-sans border-slate-200';
      case 'warm':
      default:
        return 'bg-stone-50 text-stone-900 font-sans border-stone-200/60';
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${getThemeContainerClass()} pb-20`}>
      
      {/* Top Banner Navigation */}
      <nav className={`border-b transition-colors duration-300 ${theme === 'technical' ? 'border-zinc-800 bg-zinc-900/40' : theme === 'minimal' ? 'border-slate-200 bg-slate-50' : 'border-stone-200 bg-stone-100/60'} px-6 py-4`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Top Left Monospace Status Indicator & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <img 
              src="/src/assets/images/mcc_logo_1779624175088.png"
              alt="Master Command Centre Logo"
              className="w-10 h-10 rounded-xl object-cover border border-zinc-805 bg-black/40 aspect-square shadow-sm"
              referrerPolicy="no-referrer"
            />
            <span className={`text-[10px] tracking-widest uppercase font-semibold px-2 py-0.5 rounded ${theme === 'technical' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-stone-200 text-stone-700'}`}>
              [ SERVER OK ]
            </span>
            {firebaseUser ? (
              <span className={`text-[10px] tracking-widest uppercase font-semibold px-2 py-0.5 rounded flex items-center gap-1.5 ${
                isSyncing 
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-blue-400 animate-ping' : 'bg-emerald-400'}`} />
                [ CLOUD SYNCED ]
              </span>
            ) : (
              <span className="text-[10px] tracking-widest uppercase font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono">
                [ OFFLINE ]
              </span>
            )}
            <button 
              onClick={() => setCurrentView('desk')}
              className={`text-xs opacity-80 flex items-center gap-1 font-mono hover:text-indigo-500 transition-colors uppercase ${currentView === 'desk' ? 'font-bold' : ''}`}
            >
              CURATE <ChevronRight size={10} /> DESK
            </button>
            {currentView === 'settings' && (
              <span className="text-xs opacity-80 flex items-center gap-1 font-mono text-indigo-500 uppercase font-bold">
                <ChevronRight size={10} /> SYSTEM CONTROL
              </span>
            )}
          </div>

          {/* Theme Dynamic Controller & Profile Button */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono opacity-60 flex items-center gap-1.5 mr-2">
                <Palette size={13} /> STYLESHEET:
              </span>
              <div className={`p-1 rounded-lg flex gap-1 ${theme === 'technical' ? 'bg-zinc-900 border border-zinc-800' : 'bg-stone-200/50'}`}>
                <button 
                  id="theme-warm-btn"
                  onClick={() => setTheme('warm')}
                  className={`px-2.5 py-1 text-xs rounded transition-all duration-200 font-serif ${theme === 'warm' ? 'bg-stone-800 text-stone-100 font-medium' : 'text-stone-600 hover:text-stone-900'}`}
                >
                  Warm Editorial
                </button>
                <button 
                  id="theme-tech-btn"
                  onClick={() => setTheme('technical')}
                  className={`px-2.5 py-1 text-xs rounded transition-all duration-200 font-mono ${theme === 'technical' ? 'bg-zinc-100 text-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-100'}`}
                >
                  Tech Matte
                </button>
                <button 
                  id="theme-min-btn"
                  onClick={() => setTheme('minimal')}
                  className={`px-2.5 py-1 text-xs rounded transition-all duration-200 font-sans ${theme === 'minimal' ? 'bg-slate-900 text-white font-medium' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Clean Utility
                </button>
              </div>
            </div>

            {/* Profile Avatar Trigger Button */}
            <button
              id="user-profile-nav-trigger"
              onClick={() => setCurrentView(currentView === 'settings' ? 'desk' : 'settings')}
              className={`flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-xl border transition-all hover:scale-[1.01] ${
                currentView === 'settings'
                  ? 'bg-indigo-500/10 border-indigo-500/35 text-indigo-400 font-semibold'
                  : theme === 'technical'
                    ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-850 text-zinc-200'
                    : 'bg-white border-stone-250 hover:bg-stone-50 text-stone-800 shadow-sm'
              }`}
            >
              <img 
                src={avatar} 
                alt={`${alias}'s Avatar`}
                className="w-5.5 h-5.5 rounded-full object-cover border border-stone-200 dark:border-zinc-850"
                referrerPolicy="no-referrer"
              />
              <div className="text-left font-mono">
                <span className="text-[9px] block font-bold uppercase leading-none">{alias}</span>
                <span className="text-[7.5px] opacity-50 block leading-none truncate max-w-[80px]">{rank}</span>
              </div>
            </button>
          </div>

        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-12">
        
        {/* PROMINENT HEADING AT TOP (As requested by user: 'Untitled' prominence) */}
        <header className="mb-12 border-b pb-10 transition-colors duration-300 border-dashed border-stone-300 dark:border-zinc-800">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <motion.h1 
                id="app-heading-title"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-5xl md:text-7xl font-black tracking-tight uppercase leading-none ${theme === 'warm' ? 'font-serif text-stone-900 italic' : theme === 'technical' ? 'font-mono text-white' : 'font-sans text-slate-950'}`}
              >
                MASTER COMMAND CENTRE
              </motion.h1>
              <p className={`mt-3 text-sm tracking-wider uppercase font-mono ${theme === 'technical' ? 'text-zinc-400' : 'text-stone-500'}`}>
                Workspace sandbox // dynamic documentation & curation tools
              </p>
            </div>
            
            {/* Quick Metrics display (craftsmanship details) */}
            <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-xl border ${theme === 'technical' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-stone-100 border-stone-200/60'}`}>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Workspace Density</span>
                <span className="text-xl font-bold font-mono text-emerald-500">{cards.length} Items</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Character Budget</span>
                <span className="text-xl font-bold font-mono">{totalCharacters}</span>
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest font-bold">Estimated Read</span>
                <span className="text-xl font-bold font-mono">{estimatedReadTime} min</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Grid Layout */}
        {currentView === 'settings' ? (
          <AppSettings 
            avatar={avatar}
            setAvatar={setAvatar}
            alias={alias}
            setAlias={setAlias}
            email={email}
            setEmail={setEmail}
            rank={rank}
            setRank={setRank}
            accessLevel={accessLevel}
            setAccessLevel={setAccessLevel}
            theme={theme}
            onBack={() => setCurrentView('desk')}
            firebaseUser={firebaseUser}
            isSyncing={isSyncing}
            lastSynced={lastSynced}
            onGoogleSignIn={handleGoogleSignIn}
            onSignOut={handleSignOut}
            onCloudCommitProfile={cloudCommitProfile}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column Left: Application Description Panel & AI Assistant (Lg: 5 columns) */}
          <section className="lg:col-span-5 space-y-8">
            
            {/* APPLICATION DESCRIPTION CARD (As requested by user) */}
            <div 
              id="app-description-container"
              className={`p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                theme === 'technical' 
                  ? 'bg-zinc-900 border-zinc-800' 
                  : theme === 'minimal' 
                    ? 'bg-white shadow-sm border-slate-200' 
                    : 'bg-stone-50 border-stone-300/80 shadow-sm shadow-stone-100'
              }`}
            >
              {/* Card visual elements (atmospheric glow if warm, grid accents if tech) */}
              {theme === 'warm' && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/5 to-rose-500/5 rounded-full blur-2xl pointer-events-none" />
              )}

              <div className="flex items-center justify-between mb-4 border-b pb-2 transition-colors duration-300 border-stone-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <h2 className={`font-semibold flex items-center gap-2 tracking-wide uppercase text-xs font-mono opacity-90`}>
                    <FileText size={14} className="text-amber-500" /> Application Description
                  </h2>
                  
                  {/* Auto-save status badge */}
                  <AnimatePresence mode="wait">
                    {isEditingDesc && (
                      <motion.span
                        key={saveStatus}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium flex items-center gap-1 transition-colors ${
                          saveStatus === 'saving'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-550/10 dark:text-amber-400'
                            : saveStatus === 'saved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-550/10 dark:text-emerald-400'
                              : 'bg-stone-100 text-stone-500 dark:bg-zinc-800 dark:text-zinc-500'
                        }`}
                      >
                        {saveStatus === 'saving' && (
                          <>
                            <RefreshCw size={10} className="animate-spin" /> Saving...
                          </>
                        )}
                        {saveStatus === 'saved' && (
                          <>
                            <Check size={10} /> Saved
                          </>
                        )}
                        {saveStatus === 'idle' && (
                          <>
                            Auto-save active
                          </>
                        )}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Save / Edit Control Buttons */}
                <button
                  id="toggle-edit-desc-btn"
                  onClick={() => {
                    if (isEditingDesc) {
                      handleSaveDescription(descInput);
                    } else {
                      setIsEditingDesc(true);
                      setDescInput(description);
                    }
                  }}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-all duration-200 ${
                    theme === 'technical' 
                      ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' 
                      : 'bg-stone-200/80 text-stone-800 hover:bg-stone-300 text-stone-700'
                  }`}
                >
                  {isEditingDesc ? (
                    <>
                      <Check size={12} /> Done
                    </>
                  ) : (
                    <>
                      <Edit2 size={12} /> Edit
                    </>
                  )}
                </button>
              </div>

              {/* Rich Display of application description */}
              <div className="space-y-4">
                {isEditingDesc ? (
                  <div className="space-y-2">
                    <textarea
                      id="desc-textarea-input"
                      value={descInput}
                      onChange={(e) => setDescInput(e.target.value)}
                      rows={4}
                      className={`w-full p-3 text-sm rounded-lg border focus:ring-1 focus:outline-none transition-all ${
                        theme === 'technical' 
                          ? 'bg-zinc-950 border-zinc-700 text-zinc-100 focus:ring-emerald-500 focus:border-emerald-500' 
                          : 'bg-white border-stone-300 text-stone-900 focus:ring-stone-600 focus:border-stone-600'
                      }`}
                      placeholder="Enter description..."
                    />
                    <div className="flex justify-end gap-2 items-center">
                      <span className="text-[10px] font-mono opacity-50 mr-auto">
                        {saveStatus === 'saving' ? 'Auto-saving soon...' : saveStatus === 'saved' ? 'Saved!' : 'Auto-save active'}
                      </span>
                      <button
                        id="cancel-edit-desc-btn"
                        onClick={() => setIsEditingDesc(false)}
                        className="px-3 py-1 text-xs border border-transparent rounded-md text-stone-500 hover:text-stone-800"
                      >
                        Close
                      </button>
                      <button
                        id="save-edit-desc-btn"
                        onClick={() => handleSaveDescription(descInput)}
                        className={`px-3 py-1 text-xs font-semibold rounded-md ${
                          theme === 'technical'
                            ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                            : 'bg-stone-900 text-stone-100 hover:bg-stone-850'
                        }`}
                      >
                        Apply Instantly
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <blockquote className={`text-lg leading-relaxed ${theme === 'warm' ? 'font-serif italic text-stone-850' : 'text-stone-700 dark:text-zinc-300'}`}>
                      "{description}"
                    </blockquote>
                    <p className="text-[11px] font-mono mt-4 opacity-50">
                      * Rest assured, these modifications are persisted safely in your browser filesystem state.
                    </p>
                  </div>
                )}
              </div>

              {/* Server-Side AI Brainstorming Box (Polishes the description) */}
              <div className={`mt-6 pt-5 border-t ${theme === 'technical' ? 'border-zinc-800/80' : 'border-stone-200'}`}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono opacity-80 flex items-center gap-1">
                      <Sparkles size={12} className="text-indigo-400" /> AI REBRANDING VIBE:
                    </span>
                    <select
                      id="ai-vibe-select"
                      value={aiVibe}
                      onChange={(e) => setAiVibe(e.target.value)}
                      className={`text-xs p-1 rounded font-mono border ${
                        theme === 'technical' 
                          ? 'bg-zinc-950 text-zinc-200 border-zinc-700' 
                          : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      <option value="warm editorial">Warm Editorial</option>
                      <option value="brutalist creative">Creative Brutalist</option>
                      <option value="ultra minimalist">Ultra Minimalist</option>
                      <option value="cyberpunk sci-fi">Technical Sci-Fi</option>
                      <option value="executive corporate">Silicon Executive</option>
                    </select>
                  </div>

                  <button
                    id="ai-generate-desc-btn"
                    onClick={handleAiDescriptionGenerate}
                    disabled={isGeneratingDesc}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold font-mono tracking-wider transition-all duration-300 ${
                      isGeneratingDesc ? 'opacity-50 cursor-not-allowed' : ''
                    } ${
                      theme === 'technical' 
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-100 text-amber-900 hover:bg-amber-200 hover:scale-[1.01]'
                    }`}
                  >
                    <RefreshCw size={13} className={isGeneratingDesc ? 'animate-spin' : ''} />
                    {isGeneratingDesc ? 'INTERROSPECTING GEMINI...' : 'REWRITE DESCRIPTION WITH GEMINI'}
                  </button>
                </div>
              </div>
            </div>

            {/* AI PLAYGROUND AND CREATIVE ASSISTANT CARD */}
            <div 
              id="ai-sandbox-panel"
              className={`p-6 rounded-2xl border transition-all duration-300 ${
                theme === 'technical' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-250 hover:shadow-md'
              }`}
            >
              <h3 className="font-semibold text-xs font-mono uppercase tracking-widest flex items-center gap-2 opacity-90 mb-4">
                <Sparkles size={13} className="text-violet-500" /> Interactive AI Playground
              </h3>

              <div className="space-y-4">
                <p className="text-xs opacity-75">
                  Leverage the server-side `@google/genai` environment to generate fresh draft summaries or outline structured ideas.
                </p>

                {/* AI Assistant Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="template-outline-btn"
                    onClick={() => {
                      setActiveTemplate('Draft a detailed project roadmap for a modern dashboard designer workspace.');
                      handleAiCardGenerate('custom', 'Draft a detailed project roadmap for a modern dashboard designer workspace.');
                    }}
                    className={`text-[11px] p-2.5 rounded-lg text-left transition-colors border ${
                      theme === 'technical' 
                        ? 'bg-zinc-950 border-zinc-800 hover:bg-zinc-800' 
                        : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    ⚡ Project Roadmap
                  </button>
                  <button
                    id="template-slogans-btn"
                    onClick={() => {
                      setActiveTemplate('Brainstorm 5 innovative slogans for our Master Command Centre portal.');
                      handleAiCardGenerate('custom', 'Brainstorm 5 innovative slogans for our Master Command Centre portal.');
                    }}
                    className={`text-[11px] p-2.5 rounded-lg text-left transition-colors border ${
                      theme === 'technical' 
                        ? 'bg-zinc-950 border-zinc-800 hover:bg-zinc-800' 
                        : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    ⚡ Brainstorm Slogans
                  </button>
                </div>

                {/* Custom User Prompt Input */}
                <div className="space-y-2 mt-4">
                  <label htmlFor="custom-ai-prompt" className="text-[10px] font-mono uppercase opacity-70">
                    Custom Prompt Command:
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="custom-ai-prompt"
                      type="text"
                      placeholder="Ask the co-writer anything..."
                      value={aiPromptTopic}
                      onChange={(e) => setAiPromptTopic(e.target.value)}
                      className={`flex-1 p-2 text-xs rounded-lg border focus:outline-none focus:ring-1 ${
                        theme === 'technical' 
                          ? 'bg-zinc-950 border-zinc-700 text-zinc-100 focus:ring-emerald-500' 
                          : 'bg-stone-50 border-stone-300 text-stone-900 focus:ring-stone-600'
                      }`}
                    />
                    <button
                      id="submit-ai-prompt"
                      onClick={() => {
                        if (aiPromptTopic.trim()) {
                          handleAiCardGenerate('custom', aiPromptTopic);
                        }
                      }}
                      disabled={isGeneratingCard || !aiPromptTopic.trim()}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'technical'
                          ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400'
                          : 'bg-stone-900 text-white hover:bg-stone-800'
                      } disabled:opacity-50`}
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Custom Co-Writer Output Showcase */}
                {(isGeneratingCard || aiOutput) && (
                  <div className={`p-4 rounded-xl border text-xs mt-4 ${
                    theme === 'technical' ? 'bg-zinc-950 border-zinc-800' : 'bg-stone-50 border-stone-200'
                  }`}>
                    {isGeneratingCard ? (
                      <div className="flex items-center gap-2 text-stone-500 font-mono">
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Generating custom narrative copy from Gemini...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono opacity-50 border-b pb-1 mb-2">
                          <span>GEMINI DRAFT ENGINE</span>
                          <button 
                            id="clear-ai-output"
                            onClick={() => setAiOutput('')}
                            className="text-stone-400 hover:text-stone-900"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="leading-relaxed whitespace-pre-line font-serif italic text-stone-800 dark:text-zinc-300">
                          {aiOutput}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Column Right: Interactive Card Dashboard Curation list (Lg: 7 columns) */}
          <section className="lg:col-span-7 space-y-6">
            
            {/* Header Dashboard Filters and Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Card List Search Bar */}
              <div className="relative w-full sm:w-72">
                <input
                  id="search-cards-input"
                  type="text"
                  placeholder="Filter curated cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-3 pr-8 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 ${
                    theme === 'technical' 
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100 focus:ring-emerald-500' 
                      : 'bg-white border-stone-250 text-stone-900 focus:ring-stone-600'
                  }`}
                />
                <Hash size={12} className="absolute right-3 top-3 opacity-40" />
              </div>

              {/* Action Buttons to curate more components */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  id="ai-curate-card-btn"
                  onClick={() => handleAiCardGenerate('card_idea')}
                  disabled={isGeneratingCard}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-mono font-bold transition-all ${
                    theme === 'technical'
                      ? 'bg-zinc-900 text-emerald-400 border border-zinc-800 hover:bg-zinc-800'
                      : 'bg-stone-950 text-stone-50 hover:bg-stone-850 hover:scale-[1.01]'
                  }`}
                >
                  <Sparkles size={12} /> SPARK AI CARD
                </button>

                <button
                  id="open-manual-form-btn"
                  onClick={() => setIsCreatingCard(!isCreatingCard)}
                  className={`py-2 px-3 focus:outline-none rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1 border border-stone-300 ${
                    theme === 'technical' ? 'border-zinc-800 text-zinc-100' : 'bg-white hover:bg-stone-50'
                  }`}
                >
                  <Plus size={14} /> MANUAL
                </button>
              </div>
            </div>

            {/* Manual Card Creation Form Overlay style */}
            <AnimatePresence>
              {isCreatingCard && (
                <motion.form
                  id="manual-card-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddNewCard}
                  className={`p-5 rounded-2xl border transition-colors duration-200 overflow-hidden space-y-4 ${
                    theme === 'technical' ? 'bg-zinc-900 border-zinc-800' : 'bg-stone-100/80 border-stone-200'
                  }`}
                >
                  <h4 className="text-xs font-mono uppercase font-bold text-stone-500">
                    Draft a Curated Asset / Technical Card
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="card-title-input" className="text-[10px] font-mono opacity-65">CARD TITLE</label>
                      <input
                        id="card-title-input"
                        type="text"
                        placeholder="e.g. Navigation Refactor"
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        className={`w-full p-2 text-xs rounded-lg border ${
                          theme === 'technical' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-stone-300'
                        }`}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="card-cat-input" className="text-[10px] font-mono opacity-65">CATEGORY TYPE</label>
                      <select
                        id="card-cat-input"
                        value={newCardCat}
                        onChange={(e) => setNewCardCat(e.target.value)}
                        className={`w-full p-2 text-xs rounded-lg border ${
                          theme === 'technical' ? 'bg-zinc-950 border-zinc-800 text-white font-mono' : 'bg-white border-stone-300'
                        }`}
                        required
                      >
                        <option value="Draft">Draft Notes</option>
                        <option value="Active">Active Epic</option>
                        <option value="Inspiration">Creative Mood</option>
                        <option value="Core">Core System</option>
                        <option value="UI">Aesthetic Grid</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="card-content-input" className="text-[10px] font-mono opacity-65">DESCRIPTION CONTENT</label>
                    <textarea
                      id="card-content-input"
                      placeholder="Specify task directives, technical code ideas, or copy block content."
                      value={newCardContent}
                      onChange={(e) => setNewCardContent(e.target.value)}
                      rows={2}
                      className={`w-full p-2 text-xs rounded-lg border ${
                        theme === 'technical' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-stone-300'
                      }`}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      id="cancel-manual-card"
                      type="button"
                      onClick={() => setIsCreatingCard(false)}
                      className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800"
                    >
                      Cancel
                    </button>
                    <button
                      id="submit-manual-card"
                      type="submit"
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg text-white ${
                        theme === 'technical' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-stone-900 hover:bg-stone-850'
                      }`}
                    >
                      Save Card into Stack
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* CURATED GRID OF CARDS IN THE WORKSPACE */}
            {filteredCards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {filteredCards.map((card) => (
                    <motion.div
                      id={`workspace-card-${card.id}`}
                      key={card.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`p-5 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                        theme === 'technical' 
                          ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:shadow-zinc-900/40 hover:shadow-lg' 
                          : theme === 'minimal'
                            ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                            : 'bg-stone-100/50 hover:bg-stone-100 border-stone-200/90 hover:border-stone-350 hover:shadow-md'
                      }`}
                    >
                      <div>
                        {/* Title and Badge Metadata Row */}
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded font-bold ${
                            card.category === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10' :
                            card.category === 'Inspiration' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/10' :
                            card.category === 'Core' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/10' :
                            'bg-stone-200 text-stone-600'
                          }`}>
                            {card.category}
                          </span>
                          
                          {/* Sync details */}
                          <button
                            id={`delete-card-${card.id}`}
                            onClick={() => handleDeleteCard(card.id)}
                            className="p-1 rounded-md text-stone-400 hover:text-rose-500 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Remove Card"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {/* Card Content Text */}
                        <h4 className={`text-base font-bold ${theme === 'warm' ? 'font-serif text-stone-900' : 'text-stone-950 dark:text-zinc-100'} mb-2`}>
                          {card.title}
                        </h4>
                        
                        <p className={`text-xs leading-relaxed opacity-85 mb-4 ${theme === 'technical' ? 'text-zinc-300/90' : 'text-stone-650'}`}>
                          {card.content}
                        </p>
                      </div>

                      {/* Card Footer details */}
                      <div className="flex items-center justify-between pt-3 border-t border-dashed border-stone-200 dark:border-zinc-800">
                        <span className="text-[10px] font-mono opacity-40">
                          {card.updatedAt}
                        </span>
                        
                        {/* Small interactive detail to showcase high-craftsmanship clicks */}
                        <span className="text-[9px] font-mono opacity-50 flex items-center gap-0.5 pointer-events-none uppercase">
                          CURATED WORKSPACE <ArrowRight size={8} />
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className={`p-12 rounded-2xl border text-center font-mono ${
                theme === 'technical' ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-stone-100 text-stone-500'
              }`}>
                <Layout size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Workspace registry is clean.</p>
                <p className="text-xs mt-1 opacity-70">Query Gemini above to inject mock idea files or click Manual!</p>
              </div>
            )}

            {/* QUICK PROJECT DESIGN INSPIRATIONS CAROUSEL (Showcases deep craft & typography guidelines) */}
            <div className={`p-6 rounded-2xl border ${theme === 'technical' ? 'bg-zinc-900 border-zinc-800' : 'bg-stone-100/40 border-stone-200'}`}>
              <h4 className="text-xs font-mono uppercase tracking-widest font-bold opacity-80 mb-4 flex items-center gap-1.5">
                <Activity size={12} className="text-indigo-400" /> AESTHETIC DIRECTIVES FEED & CODE INSIGHTS
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-white dark:bg-zinc-950 rounded-xl border border-stone-200/60 dark:border-zinc-800">
                  <span className="font-bold block text-[10px] uppercase font-mono tracking-wider text-amber-600 mb-1">01 / WARM DESIGN</span>
                  <p className="opacity-80 leading-relaxed text-[11px]">
                    Use Cormorant Garamond / Georgia display names paired with a warm off-white background and soft roundings.
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-zinc-950 rounded-xl border border-stone-200/60 dark:border-zinc-800">
                  <span className="font-bold block text-[10px] uppercase font-mono tracking-wider text-emerald-500 mb-1">02 / INTERACTION</span>
                  <p className="opacity-80 leading-relaxed text-[11px]">
                    Ensure touch surfaces have clear hover states, animated entry states, and distinct click triggers.
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-zinc-950 rounded-xl border border-stone-200/60 dark:border-zinc-800">
                  <span className="font-bold block text-[10px] uppercase font-mono tracking-wider text-indigo-400 mb-1">03 / STABILITY</span>
                  <p className="opacity-80 leading-relaxed text-[11px]">
                    All API interfaces are fully proxy-bound server-side. Workspace registries are preserved inside standard localStorage storage.
                  </p>
                </div>
              </div>
            </div>

          </section>
        </div>
        )}

      </main>

      {/* Footer Branding Panel */}
      <footer className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-dashed border-stone-350 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
        <div className="flex items-center gap-4 text-xs font-mono">
          <span>MASTER COMMAND CENTRE v1.4.3</span>
          <span>•</span>
          <span>SECURED BY SERVER HANDLERS</span>
          <span>•</span>
          <span>CURATION ENGINE</span>
        </div>
        <div className="text-xs font-mono flex items-center gap-1">
          <span>AI Studio Build</span>
          <ExternalLink size={10} />
        </div>
      </footer>

    </div>
  );
}
