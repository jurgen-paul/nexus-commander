import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Navigation, MapPin, Cloud, Wind, Droplets, Sun, Compass, Globe, Zap, Search } from "lucide-react";
import { cn } from "@/src/lib/utils";

export const NavigationSystem = () => {
  const [location, setLocation] = useState("San Francisco, CA");
  const [weather, setWeather] = useState({
    temp: 24,
    condition: "Clear",
    wind: 12,
    humidity: 45,
    visibility: 10
  });

  // Mock real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setWeather(prev => ({
        ...prev,
        temp: prev.temp + (Math.random() > 0.5 ? 0.1 : -0.1)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto h-full flex flex-col">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-display font-bold">Navigation & Weather</h2>
          <p className="text-nexus-text-dim mt-1">Geospatial intelligence and environmental monitoring.</p>
        </div>
        <div className="flex gap-4">
          <div className="glass px-4 py-2 rounded-xl flex items-center gap-3">
            <Search className="w-4 h-4 text-nexus-text-dim" />
            <input 
              type="text" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-40 placeholder:text-nexus-text-dim"
              placeholder="Enter coordinates..."
            />
          </div>
          <button className="p-2 glass rounded-xl text-nexus-accent hover:bg-nexus-accent hover:text-black transition-all">
            <Compass className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-2 glass rounded-3xl relative overflow-hidden group min-h-[400px]">
          {/* Mock Map Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0" style={{ 
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0, 242, 255, 0.15) 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }} />
            <svg className="w-full h-full" viewBox="0 0 800 600">
              <path d="M100,100 L200,150 L300,100 L400,200 L500,150 L600,250 L700,200" fill="none" stroke="rgba(0, 242, 255, 0.2)" strokeWidth="2" />
              <path d="M50,300 L150,350 L250,300 L350,400 L450,350 L550,450 L650,400" fill="none" stroke="rgba(0, 242, 255, 0.1)" strokeWidth="1" />
              <circle cx="400" cy="300" r="150" fill="none" stroke="rgba(0, 242, 255, 0.05)" strokeWidth="1" />
              <circle cx="400" cy="300" r="100" fill="none" stroke="rgba(0, 242, 255, 0.05)" strokeWidth="1" />
            </svg>
          </div>

          {/* Map UI */}
          <div className="absolute inset-0 p-8 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="glass p-4 rounded-2xl backdrop-blur-md">
                <div className="flex items-center gap-2 text-nexus-accent mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Current Node</span>
                </div>
                <h3 className="text-xl font-display font-bold">{location}</h3>
                <p className="text-[10px] text-nexus-text-dim font-mono mt-1">LAT: 37.7749° N | LONG: 122.4194° W</p>
              </div>
              <div className="flex flex-col gap-2">
                <button className="p-3 glass rounded-xl hover:bg-white/10 transition-colors">
                  <Globe className="w-5 h-5" />
                </button>
                <button className="p-3 glass rounded-xl hover:bg-white/10 transition-colors">
                  <Zap className="w-5 h-5 text-nexus-accent" />
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="relative"
              >
                <div className="w-4 h-4 bg-nexus-accent rounded-full neon-glow" />
                <div className="absolute inset-[-8px] border border-nexus-accent/30 rounded-full animate-ping" />
              </motion.div>
            </div>

            <div className="flex justify-between items-end">
              <div className="glass p-4 rounded-2xl max-w-xs">
                <p className="text-[10px] font-mono text-nexus-accent mb-2">TRAFFIC ANALYSIS</p>
                <div className="space-y-2">
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[85%]" />
                  </div>
                  <p className="text-[10px] text-nexus-text-dim">Optimal routes detected. Travel time: 12m</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono text-nexus-text-dim">GEOSPATIAL LINK</p>
                <p className="text-xs font-bold text-nexus-accent">STABLE [98ms]</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-display font-semibold">Atmospheric Data</h3>
              <Sun className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="text-center mb-8">
              <h4 className="text-6xl font-display font-bold">{weather.temp.toFixed(1)}°</h4>
              <p className="text-nexus-text-dim uppercase tracking-widest text-sm mt-2">{weather.condition}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Wind", value: `${weather.wind} km/h`, icon: Wind },
                { label: "Humidity", value: `${weather.humidity}%`, icon: Droplets },
                { label: "Visibility", value: `${weather.visibility} km`, icon: Sun },
                { label: "UV Index", value: "Low", icon: Zap },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2 text-nexus-text-dim mb-1">
                    <item.icon className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
                  </div>
                  <p className="text-sm font-bold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-6 rounded-3xl flex-1">
            <h3 className="text-lg font-display font-semibold mb-4">Upcoming Conditions</h3>
            <div className="space-y-4">
              {[
                { time: "14:00", temp: "26°", icon: Sun },
                { time: "17:00", temp: "23°", icon: Cloud },
                { time: "20:00", temp: "19°", icon: Cloud },
              ].map((hour, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors">
                  <span className="text-sm font-mono text-nexus-text-dim">{hour.time}</span>
                  <hour.icon className="w-5 h-5 text-nexus-accent" />
                  <span className="text-sm font-bold">{hour.temp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
