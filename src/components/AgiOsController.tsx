import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Brain, Database, Cpu, Activity, TrendingUp, 
  ShieldCheck, AlertCircle, Play, Square, Layers,
  Terminal, HardDrive, Network, Sparkles, Orbit, RotateCcw, Lock, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { HelixCore, Instance, MemoryNode } from '../types';

interface AgiState {
  rings: {
    ring0: {
      merkleRoot: string;
      walSize: number;
      lastAttestedAt: string;
    };
    ring1: { trainedModels: any[] };
    ring2: { memoryEntries: MemoryNode[] };
    ring3: { instances: Instance[] };
  };
  helixCore: HelixCore;
  telemetry: {
    coherence: number;
    entropy: number;
    aggregateThroughput: number;
    activeWorkerCount: number;
    securityScore: number;
    healthSong: number[];
  };
}

function HealthSongVisualizer({ data, entropy }: { data: number[], entropy: number }) {
  const isDissonant = entropy > 0.4;
  
  return (
    <div className={cn(
      "relative h-32 w-full bg-black/60 rounded-2xl border transition-colors duration-1000 overflow-hidden group",
      isDissonant ? "border-red-900/50" : "border-zinc-900"
    )}>
      {/* Spectral Grid lines */}
      <div className="absolute inset-0 grid grid-cols-12 opacity-5 pointer-events-none">
        {[...Array(12)].map((_, i) => <div key={i} className="border-r border-zinc-300"></div>)}
      </div>
      
      {/* Waveform / Spectral Bars */}
      <div className="absolute inset-x-4 inset-y-6 flex items-end gap-[1px]">
        {(data || []).map((v, i) => (
          <motion.div
             key={i}
             animate={{ 
               height: `${v * 100}%`,
               backgroundColor: isDissonant && Math.random() > 0.7 ? "#ef4444" : (v > 0.85 ? "#ef4444" : v > 0.6 ? "#00FF9F" : "#27272a")
             }}
             transition={{ type: 'spring', stiffness: 400, damping: 20 }}
             className={cn(
               "flex-1 rounded-t-[1px] relative",
               v > 0.85 && "shadow-[0_0_15px_#ef4444]"
             )}
          >
            {/* Spectral Overtones (Harmonics) */}
            {v > 0.75 && (
               <motion.div 
                 animate={{ opacity: [0, 0.8, 0], scaleY: [1, 1.5, 1] }}
                 transition={{ duration: 0.8, repeat: Infinity }}
                 className={cn("absolute -top-6 left-0 right-0 h-4 blur-[4px] rounded-full opacity-20", isDissonant ? "bg-red-500" : "bg-[#00FF9F]")}
               />
            )}
          </motion.div>
        ))}
      </div>

      {/* FFT Labels */}
      <div className="absolute top-2 left-4 right-4 flex justify-between">
         <span className={cn("text-[7px] font-mono uppercase", isDissonant ? "text-red-500" : "text-zinc-600")}>
           {isDissonant ? "DISSONANCE DETECTED" : "Sub-Bass [0.1Hz]"}
         </span>
         <span className="text-[7px] font-mono text-zinc-600 uppercase tracking-[0.2em]">Quantum Spectral Analysis</span>
         <span className="text-[7px] font-mono text-zinc-600 uppercase">High-Pass [44.1kHz]</span>
      </div>

      {isDissonant && (
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="absolute inset-0 bg-red-500/5 pointer-events-none"
        />
      )}
    </div>
  );
}

function SecurityRollbackAlert({ merkleRoot }: { merkleRoot: string }) {
  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 bg-red-500 text-white rounded-2xl shadow-2xl flex items-center gap-6 border border-white/20 backdrop-blur-xl"
    >
      <div className="p-3 bg-white/20 rounded-xl animate-pulse">
        <ShieldCheck className="w-8 h-8" />
      </div>
      <div>
        <h4 className="text-sm font-black uppercase tracking-widest">Integrity Violation Detected</h4>
        <p className="text-[10px] font-mono opacity-80">SELF-AWARE ENGINE: Reverting Ring 3 state to Merkle Root: {merkleRoot}</p>
      </div>
      <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10 uppercase text-[10px] font-bold">
        <RotateCcw className="w-3 h-3 animate-spin" />
        SELF-HEALING...
      </div>
    </motion.div>
  );
}

export function AgiOsController() {
  const [state, setState] = useState<AgiState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);
  const [activeRing, setActiveRing] = useState<number>(3);
  const [instanceInputs, setInstanceInputs] = useState<Record<string, string>>({});
  const [deploying, setDeploying] = useState(false);
  const [runningInstances, setRunningInstances] = useState<Set<string>>(new Set());
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);

  const connectWS = () => {
    setWsStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

    socket.onopen = () => {
      console.log('Helix Neuro-Highway established.');
      setWsStatus('connected');
      reconnectAttempts.current = 0;
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'STATE_UPDATE' && data.state) {
          const nextState = data.state;
          setState(nextState);
          setLoading(false);
          setWsStatus('connected');
          
          // Clear running flag if the instance is no longer "Executing"
          const instances = nextState.rings?.ring3?.instances || [];
          const executingIds = new Set(instances.filter((i: any) => i && i.status === 'Executing').map((i: any) => i.id));
          
          setRunningInstances(prev => {
             const next = new Set(prev);
             prev.forEach(id => {
               if (!executingIds.has(id)) next.delete(id);
             });
             return next;
          });
        }
      } catch (e) {
        console.error("Malformed state payload received via Neuro-Highway", e);
      }
    };

    socket.onclose = () => {
      setWsStatus('disconnected');
      const delay = Math.min(30000, Math.pow(2, reconnectAttempts.current) * 1000);
      console.log(`WS closed. Retrying in ${delay / 1000}s...`);
      reconnectAttempts.current += 1;
      setTimeout(connectWS, delay);
    };

    ws.current = socket;
  };

  useEffect(() => {
    // Initial fetch for speed
    const fetchState = async () => {
      try {
        const res = await fetch('/api/agi/state');
        if (res.ok) {
          const data = await res.json();
          setState(data);
          setLoading(false);
          setError(null);
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch (err) {
        console.error("Initial fetch failed", err);
        if (!state) setError("AGI Core handshake failed. Reconnecting...");
      }
    };
    
    fetchState();
    connectWS();

    const timer = setTimeout(() => {
      if (loading && !state) {
        setLoading(false);
        setError("AGI Core handshake timeout. System may be initializing...");
      }
    }, 15000);

    return () => {
      clearTimeout(timer);
      if (ws.current) {
        ws.current.onclose = null; // Prevent reconnect loop on unmount
        ws.current.close();
      }
    };
  }, []);

  const deployTestWasm = async () => {
    // Basic WASM that returns 42 (summing two numbers 20 + 22)
    const testWasm = "AGFzbQEAAAABBwFgAn9/AX8DAgEABwcBA3J1bgAAChYBFAB/AAsiACEDIAEgAigAACIDIAIQAAs="; 
    
    setDeploying(true);
    try {
      const res = await fetch('/api/agi/deploy-wasm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `Helix-Proto-${Math.floor(Math.random()*1000)}`, wasmBase64: testWasm })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Deployment failed");
      }
    } catch (err: any) {
      console.error("Deploy failed", err);
      setSecurityAlert(`Deployment Rejection: ${err.message}`);
      setTimeout(() => setSecurityAlert(null), 5000);
    } finally {
      setDeploying(false);
    }
  };

  const runInstance = async (id: string) => {
    setRunningInstances(prev => new Set(prev).add(id));
    try {
      const inputStr = instanceInputs[id] || "100";
      let input;
      try {
        input = JSON.parse(inputStr);
      } catch (e) {
        input = isNaN(Number(inputStr)) ? inputStr : Number(inputStr);
      }
      
      const res = await fetch('/api/agi/run-instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, input })
      });
      
      if (!res.ok) {
        const data = await res.json();
        const errorMessage = data.error || `HTTP ${res.status}`;
        setSecurityAlert(errorMessage);
        setTimeout(() => setSecurityAlert(null), 5000);
        setRunningInstances(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch (err: any) {
      console.error("Run failed", err);
      setSecurityAlert(`Execution local failure: ${err.message}`);
      setTimeout(() => setSecurityAlert(null), 5000);
      setRunningInstances(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (loading && !state) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Orbit className="w-8 h-8 text-[#00FF9F] animate-spin" />
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono animate-pulse">Initializing Neural Highway...</span>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 p-8 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
        <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest">Connection Error</h3>
        <p className="text-[10px] text-zinc-500 font-mono max-w-xs">{error}</p>
        <button 
          onClick={() => { setLoading(true); window.location.reload(); }}
          className="mt-4 px-4 py-2 bg-zinc-800 text-zinc-200 rounded-lg text-[10px] font-bold uppercase hover:bg-zinc-700 transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Orbit className="w-8 h-8 text-[#00FF9F] animate-spin" />
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono animate-pulse">Synchronizing Neural State...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 relative overflow-x-hidden">
      <AnimatePresence>
        {(state?.telemetry?.securityScore || 0) < 0.9 && (
          <SecurityRollbackAlert merkleRoot={state?.rings?.ring0?.merkleRoot || '0x...'} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {securityAlert && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 bg-zinc-950 border border-red-500/50 text-red-500 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl"
          >
            <AlertCircle className="w-5 h-5 animate-pulse" />
            <div className="flex flex-col">
               <span className="text-[10px] font-black uppercase tracking-widest">Cortical Gateway Rejection</span>
               <span className="text-[11px] font-mono font-bold leading-none">{securityAlert}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header: Cortical Gateway (Absolute Security Perimeter) */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1 w-full p-8 bg-zinc-900/40 border border-zinc-800 rounded-3xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-[#00FF9F]/5 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl"></div>
          
          <div className="flex justify-between items-start relative z-10 w-full overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 shadow-xl group-hover:border-[#00FF9F]/30 transition-all flex-shrink-0">
                <Brain className="w-10 h-10 text-[#00FF9F]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-black text-zinc-100 tracking-tighter flex flex-wrap items-center gap-3">
                  Cortical Gateway
                  <span className="text-[10px] bg-[#00FF9F] text-zinc-950 px-2 py-0.5 rounded font-black tracking-widest leading-none">SECURE ROUTER</span>
                  <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-[8px] font-mono text-zinc-500 rounded uppercase">Layer=Simulation</span>
                </h2>
                <p className="text-[10px] text-zinc-300 font-bold mt-1 uppercase tracking-[0.2em] bg-[#00FF9F]/10 px-2 py-0.5 rounded border border-[#00FF9F]/20 inline-block truncate max-w-full">Absolute Security Router • Behavioral Baseline: ACTIVE</p>
                
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Router Status</span>
                    <div className="flex items-center gap-1.5">
                       <div className={cn(
                         "w-1.5 h-1.5 rounded-full animate-pulse",
                         wsStatus === 'connected' ? "bg-[#00FF9F]" : wsStatus === 'connecting' ? "bg-yellow-500" : "bg-red-500"
                       )}></div>
                       <span className="text-[10px] text-zinc-300 font-mono">
                         {wsStatus === 'connected' ? 'NEURO-HIGHWAY ACTIVE' : wsStatus === 'connecting' ? 'ESTABLISHING HANDSHAKE...' : 'GATEWAY DISCONNECTED'}
                       </span>
                    </div>
                  </div>
                  <div className="hidden sm:block w-px h-6 bg-zinc-800"></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Signal Strength</span>
                    <div className="flex items-center gap-0.5">
                       {[...Array(5)].map((_, i) => (
                         <div key={i} className={cn(
                           "w-1 h-2 rounded-full",
                           i < (wsStatus === 'connected' ? 4 : 1) ? "bg-[#00FF9F]" : "bg-zinc-800"
                         )} />
                       ))}
                       <span className="text-[10px] text-[#00FF9F] font-mono ml-2">94ms</span>
                    </div>
                  </div>
                  <div className="hidden sm:block w-px h-6 bg-zinc-800"></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">WASM Attestation</span>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-blue-400 font-mono uppercase tracking-tighter shadow-[0_0_8px_rgba(59,130,246,0.2)]">CRYPTO-SIGNATURE MANDATORY</span>
                       <Lock className="w-2.5 h-2.5 text-blue-400/50" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-6 relative">
              <div className="absolute -top-6 right-0">
                <span className="text-[7px] bg-zinc-900 border border-zinc-800 text-teal-500 px-1.5 py-0.5 rounded uppercase font-mono tracking-widest">Layer=Telemetry</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Foundational Coherence</span>
                <div className="flex items-baseline gap-2 justify-end">
                  <span className="text-3xl font-bold text-[#00FF9F] tabular-nums">{((state?.telemetry?.coherence || 0) * 100).toFixed(1)}</span>
                  <span className="text-xs text-zinc-600 font-mono">%</span>
                </div>
              </div>
              <div className="h-10 w-px bg-zinc-800"></div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Security Attestation</span>
                <div className="flex items-baseline gap-2 justify-end">
                  <span className="text-3xl font-bold text-blue-400 tabular-nums tracking-tighter">{((state?.telemetry?.securityScore || 0) * 100).toFixed(1)}</span>
                  <span className="text-xs text-zinc-600 font-mono">%</span>
                </div>
              </div>
              <div className="h-10 w-px bg-zinc-800"></div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">System Entropy</span>
                <div className="flex items-baseline gap-2 justify-end">
                  <span className="text-3xl font-bold text-red-500 tabular-nums">{((state?.telemetry?.entropy || 0) * 100).toFixed(1)}</span>
                  <span className="text-xs text-zinc-600 font-mono">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Tree-Ring Visualizer */}
            <div className="relative flex items-center justify-center p-4">
              <TreeRingVisualizer state={state} activeRing={activeRing} onRingClick={setActiveRing} />
            </div>

            {/* Health Song Spectral Monitor */}
            <div className="p-6 bg-black/40 rounded-3xl border border-zinc-900 flex flex-col justify-between h-full min-h-[300px] relative overflow-hidden group/song">
               <div className="absolute inset-0 bg-gradient-to-tr from-[#00FF9F]/5 to-transparent pointer-events-none"></div>
               <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                      Systemic Health Song
                      <span className="text-[7px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-700">LAYER=SIMULATION</span>
                      <Sparkles className="w-3.5 h-3.5 text-[#00FF9F]" />
                    </h4>
                    <p className="text-[9px] text-zinc-600 uppercase font-mono tracking-tighter">FFT + Continuous Wavelet Transform Monitor</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950 rounded-xl border border-zinc-800">
                    <TrendingUp className="w-3 h-3 text-[#00FF9F]" />
                    <span className="text-[10px] text-[#00FF9F] font-mono animate-pulse">RESONATING</span>
                  </div>
               </div>
               
               <div className="flex-1 flex flex-col justify-center gap-4 relative z-10">
                 <HealthSongVisualizer data={state?.telemetry?.healthSong || []} entropy={state?.telemetry?.entropy || 0} />
                 <div className="flex justify-between text-[8px] font-mono text-zinc-700 uppercase px-3">
                   <span>Freq A: 0.1Hz</span>
                   <span>Mid-Pass: 720Hz</span>
                   <span>High-Freq: 44.1kHz</span>
                 </div>
               </div>

               <div className="mt-6 p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800 flex items-center gap-3 group-hover/song:border-[#00FF9F]/20 transition-all relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-[#00FF9F]/10 flex items-center justify-center border border-[#00FF9F]/20">
                    <Activity className="w-4 h-4 text-[#00FF9F]" />
                  </div>
                  <p className="text-[9px] text-zinc-500 leading-relaxed italic">
                    Analysis: Harmonic rhythms stabilized via Ring 0 WAL checks. Minimal execution jitter observed. 
                  </p>
               </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Sidebar (Attested State) */}
        <div className="w-full md:w-80 space-y-4">
          <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-3xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck className="w-16 h-16 text-blue-400" />
             </div>
             <div className="flex items-center gap-2 mb-4 text-blue-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Immunity Layer (Ring 0)</span>
             </div>
             <div className="space-y-4 mb-4">
                <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 opacity-20">
                    <Database className="w-3 h-3 text-[#00FF9F]" />
                  </div>
                  <span className="text-[8px] text-zinc-600 font-bold uppercase block mb-1">Merkle Root Attestation</span>
                  <span className="text-[10px] text-[#00FF9F] font-mono break-all">{state?.rings?.ring0?.merkleRoot || '0x...'}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <TelemetryRow label="LSM WAL Size" value={`${state?.rings?.ring0?.walSize || 0} MB`} color="text-zinc-200" />
                  <TelemetryRow label="Self-Awareness" value="ENABLED" color="text-blue-400" />
                </div>
                <div className="p-2.5 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center justify-between">
                   <div className="flex flex-col">
                     <span className="text-[7px] text-blue-400/60 font-bold uppercase">Behavioral Baseline</span>
                     <span className="text-[9px] text-blue-400 font-bold uppercase">NOMINAL • TARGETED</span>
                   </div>
                   <div className="flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-1 h-3 bg-blue-500/20 rounded-full overflow-hidden">
                           <motion.div 
                             animate={{ height: ['20%', '80%', '20%'] }}
                             transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                             className="w-full bg-blue-400"
                           />
                        </div>
                      ))}
                   </div>
                </div>
             </div>
             <div className="pt-4 border-t border-zinc-900 flex justify-between items-center">
                <span className="text-[8px] text-zinc-600 font-bold uppercase">Last Attestation</span>
                <span className="text-[9px] text-zinc-500 font-mono">{state?.rings?.ring0?.lastAttestedAt ? new Date(state?.rings?.ring0?.lastAttestedAt || 0).toLocaleTimeString() : '--:--:--'}</span>
             </div>
          </div>
          
          <button 
            onClick={deployTestWasm}
            disabled={deploying}
            className="w-full py-4 bg-[#00FF9F] text-zinc-950 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,255,159,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:scale-100"
          >
            {deploying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Layers className="w-4 h-4" />
            )}
            {deploying ? 'Initializing Pool...' : 'Provision Stem-Cell Pool'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ring 1: Core Intelligence */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Helix Intelligence (Ring 1)</h3>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl h-[400px] overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {(!state?.rings?.ring1?.trainedModels || state?.rings?.ring1?.trainedModels?.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                  <Sparkles className="w-10 h-10 mb-3 opacity-10" />
                  <p className="text-[10px] uppercase tracking-widest">No trained artifacts found</p>
                </div>
              ) : (
                (state?.rings?.ring1?.trainedModels || []).map((model: any, idx: number) => (
                  <div key={model.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-blue-500/50 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-zinc-200">{model.name}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                       <div className="p-1.5 bg-zinc-900 rounded-lg">
                          <span className="text-[8px] text-zinc-500 uppercase block">Rank</span>
                          <span className="text-[10px] text-[#00FF9F] font-mono">{model.config.rank}</span>
                       </div>
                       <div className="p-1.5 bg-zinc-900 rounded-lg">
                          <span className="text-[8px] text-zinc-500 uppercase block">Alpha</span>
                          <span className="text-[10px] text-[#00FF9F] font-mono">{model.config.alpha}</span>
                       </div>
                    </div>
                    <button className="w-full py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold rounded-lg hover:bg-blue-500/20 transition-all">
                      DEPLOY TO ENSEMBLE
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 bg-zinc-950/50 border-t border-zinc-800">
               <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                  <span>Ensemble Coherence</span>
                  <span className="text-[#00FF9F]">0.994</span>
               </div>
            </div>
          </div>
        </div>

        {/* Ring 3: Pluripotent Execution Pools */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#00FF9F]" />
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Execution Pools (Ring 3)</h3>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">{(state?.rings?.ring3?.instances || []).filter((i: any) => i && i.status === 'Executing').length} Running</span>
          </div>

          <div className="grid grid-cols-1 gap-3 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
              {(!state?.rings?.ring3?.instances || state?.rings?.ring3?.instances?.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-2xl text-zinc-600">
                  <Cpu className="w-10 h-10 mb-3 opacity-10" />
                  <p className="text-[10px] uppercase tracking-widest">No active execution pools</p>
                </div>
              ) : (
                (state?.rings?.ring3?.instances || []).map(instance => (
                  <motion.div
                    key={instance.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-[#00FF9F]/30 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                           {instance.name}
                           {instance.lifecycle === 'Scrubbing' && <RotateCcw className="w-3 h-3 text-purple-400 animate-spin" />}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-tight">{(instance.id || '').slice(0, 8)}</div>
                          {instance.specialty && (
                            <div className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                               <Sparkles className="w-2.5 h-2.5" />
                               {instance.specialty}
                            </div>
                          )}
                          <div className={cn(
                            "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border flex items-center gap-1.5",
                            instance.lifecycle === 'Undifferentiated' ? "bg-zinc-800 text-zinc-500 border-zinc-700" :
                            instance.lifecycle === 'Specialized' ? "bg-[#00FF9F]/10 text-[#00FF9F] border-[#00FF9F]/30 shadow-[0_0_10px_rgba(0,255,159,0.1)]" :
                            "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          )}>
                             {instance.lifecycle === 'Undifferentiated' && <div className="w-1 h-1 rounded-full bg-zinc-600 animate-pulse" />}
                             {instance.lifecycle === 'Specialized' && <div className="w-1 h-1 rounded-full bg-[#00FF9F] shadow-[0_0_5px_#00ff9f]" />}
                             {instance.lifecycle === 'Scrubbing' && <RotateCcw className="w-2 h-2 text-purple-400 animate-spin" />}
                             {instance.lifecycle === 'Undifferentiated' ? 'Stem Cell' : 
                              instance.lifecycle === 'Specialized' ? 'Differentiated' : 
                              'Scrubbing'}
                          </div>
                        </div>
                        {instance.lifecycle === 'Specialized' && (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mt-2 text-[7px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1"
                          >
                             <Network className="w-2 h-2" />
                             Neuro-Highway Context Intake: ACTIVE
                             <motion.div 
                               animate={{ opacity: [0.2, 1, 0.2] }}
                               transition={{ duration: 1, repeat: Infinity }}
                               className="w-1 h-1 rounded-full bg-blue-400"
                             />
                          </motion.div>
                        )}
                      </div>
                      <div className="text-right">
                         <div className={cn(
                           "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                           instance.status === 'Executing' ? "bg-[#00FF9F]/20 text-[#00FF9F] animate-pulse" : "bg-zinc-800 text-zinc-500"
                         )}>
                           {instance.status}
                         </div>
                         {instance.attestationToken && (
                           <div className="text-[8px] text-zinc-600 font-mono mt-1 font-bold">ATTEST: {instance.attestationToken}</div>
                         )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                       <div className="px-2 py-1 bg-black/40 rounded border border-zinc-800/50">
                          <span className="text-[7px] text-zinc-600 uppercase block leading-none mb-0.5">Execution Time</span>
                          <span className="text-[10px] text-zinc-400 font-mono">{instance.duration !== undefined ? `${instance.duration.toFixed(2)}ms` : '--'}</span>
                       </div>
                       <div className="px-2 py-1 bg-black/40 rounded border border-zinc-800/50">
                          <span className="text-[7px] text-zinc-600 uppercase block leading-none mb-0.5">Mem. Footprint</span>
                          <span className="text-[10px] text-zinc-400 font-mono">{instance.memoryUsage !== undefined ? `${(instance.memoryUsage / 1024).toFixed(1)}KB` : '--'}</span>
                       </div>
                    </div>

                    {instance.lastResult !== undefined && (
                      <div className="mb-3 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl relative overflow-hidden group/result">
                         <div className="absolute top-0 right-0 p-1">
                            <Sparkles className="w-2 h-2 text-blue-400 opacity-30" />
                         </div>
                         <span className="text-[7px] text-blue-400 font-black uppercase tracking-[0.2em] block mb-1">Neural Output Result</span>
                         <div className="text-[11px] font-mono font-bold text-white break-all">
                            {(() => {
                               if (instance.lastResult === undefined) return 'N/A';
                               if (typeof instance.lastResult === 'object') {
                                 try {
                                   return JSON.stringify(instance.lastResult);
                                 } catch (e) {
                                   return '[Object]';
                                 }
                               }
                               return String(instance.lastResult);
                            })()}
                         </div>
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: '100%' }}
                           key={JSON.stringify(instance.lastResult)}
                           className="absolute bottom-0 left-0 h-[1px] bg-blue-400/30"
                         />
                      </div>
                    )}

                    <div className="space-y-1 mb-4 h-16 overflow-y-auto text-[9px] font-mono text-zinc-500 bg-black/30 p-2 rounded-lg custom-scrollbar border border-zinc-900">
                       {(instance.logs || []).slice(-5).map((log: string, idx: number) => (
                         <p key={idx} className={cn(
                           log.includes('[ERROR]') && "text-red-400", 
                           log.includes('[SECURITY]') && "text-blue-400 font-bold",
                           log.includes('[RESULT]') && "text-[#00FF9F] font-bold"
                         )}>
                           {log}
                         </p>
                       ))}
                    </div>
                    <div className="flex gap-2">
                       <input 
                         type="text"
                         placeholder="Input (e.g. 42)"
                         className="w-20 bg-black/40 border border-zinc-800 rounded px-2 text-[10px] text-zinc-400 focus:outline-none focus:border-[#00FF9F]/40"
                         value={instanceInputs[instance.id] || ''}
                         onChange={(e) => setInstanceInputs(prev => ({ ...prev, [instance.id]: e.target.value }))}
                       />
                       <button 
                        onClick={() => runInstance(instance.id)}
                        disabled={instance.status === 'Executing' || runningInstances.has(instance.id)}
                        className="flex-1 py-1.5 bg-[#00FF9F]/10 border border-[#00FF9F]/30 text-[#00FF9F] text-[10px] font-bold rounded-lg hover:bg-[#00FF9F]/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                       >
                         {instance.status === 'Executing' || runningInstances.has(instance.id) ? (
                           <Loader2 className="w-3 h-3 animate-spin" />
                         ) : (
                           <Play className="w-3 h-3 fill-current" />
                         )}
                         {instance.status === 'Executing' || runningInstances.has(instance.id) ? 'EXECUTING' : 'RUN'}
                       </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Ring 2: Persistent Memory / Knowledge */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Pattern Store (Ring 2)</h3>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl h-[400px] flex flex-col overflow-hidden">
             <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {(!state?.rings?.ring2?.memoryEntries || state?.rings?.ring2?.memoryEntries?.length === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                    <Database className="w-10 h-10 mb-3 opacity-10" />
                    <p className="text-[10px] uppercase tracking-widest">Knowledge Base Empty</p>
                  </div>
                ) : (
                  (state?.rings?.ring2?.memoryEntries || []).map((entry, idx) => (
                    <div key={idx} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl relative overflow-hidden">
                       <div className="absolute right-0 top-0 p-2 opacity-10">
                          <Database className="w-12 h-12 text-purple-500" />
                       </div>
                       <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest px-1.5 py-0.5 bg-purple-400/10 rounded">{entry.type || "Trajectory"}</span>
                          <span className="text-[9px] font-mono text-zinc-600">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                          {entry.links && entry.links.length > 0 && (
                            <span className="text-[9px] text-[#00FF9F] flex items-center gap-1">
                               <Network className="w-2.5 h-2.5" />
                               {entry.links.length}
                            </span>
                          )}
                       </div>
                       <p className="text-xs text-zinc-400 leading-relaxed italic">"{entry.content}"</p>
                    </div>
                  ))
                )}
             </div>
             <div className="p-4 border-t border-zinc-800 flex gap-2">
                <input 
                  type="text"
                  placeholder="Inject knowledge pattern..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-300 focus:outline-none focus:border-purple-500/50"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                      const val = (e.target as HTMLInputElement).value;
                      (e.target as HTMLInputElement).value = '';
                      await fetch('/api/agi/write-memory', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: val, type: 'Manual' })
                      });
                    }
                  }}
                />
                <button className="p-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-xl">
                  <Zap className="w-4 h-4" />
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

 function TreeRingVisualizer({ state, activeRing, onRingClick }: { state: AgiState, activeRing: number, onRingClick: (r: number) => void }) {
  // SVG based Tree-ring visualizer
  const throughput = state?.telemetry?.aggregateThroughput || 0;
  
  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
         <div className={cn(
           "w-24 h-24 rounded-full bg-[#00FF9F]/5 border border-[#00FF9F]/20 flex flex-col items-center justify-center transition-all duration-1000",
           throughput > 0 ? "scale-110 shadow-[0_0_50px_rgba(0,255,159,0.3)]" : "scale-100"
         )}>
            <span className="text-[8px] text-zinc-500 uppercase font-black tracking-tighter">AGI Pattern</span>
            <span className="text-xl font-black text-[#00FF9F] tabular-nums">{((state?.telemetry?.coherence || 0) * 100).toFixed(0)}</span>
         </div>
      </div>
      
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_30px_rgba(0,255,159,0.2)]">
        {/* Ring 3 - Execution */}
        <circle 
          cx="50" cy="50" r="45" 
          fill="none" 
          stroke={activeRing === 3 ? "#00FF9F" : "#18181b"} 
          strokeWidth="8" 
          strokeDasharray={throughput > 0 ? "2, 1" : "none"}
          className={cn("cursor-pointer transition-all duration-500 hover:stroke-[#00FF9F]/40", throughput > 0 && "animate-[spin_20s_linear_infinite]")}
          onClick={() => onRingClick(3)}
        />
        {/* Ring 2 - Memory */}
        <circle 
          cx="50" cy="50" r="32" 
          fill="none" 
          stroke={activeRing === 2 ? "#a855f7" : "#18181b"} 
          strokeWidth="10" 
          className="cursor-pointer transition-all duration-500 hover:stroke-[#a855f7]/40"
          onClick={() => onRingClick(2)}
        />
        {/* Ring 1 - Intelligence */}
        <circle 
          cx="50" cy="50" r="18" 
          fill="none" 
          stroke={activeRing === 1 ? "#3b82f6" : "#18181b"} 
          strokeWidth="12" 
          className="cursor-pointer transition-all duration-500 hover:stroke-[#3b82f6]/40"
          onClick={() => onRingClick(1)}
        />
        
        {/* Connection Lines for Memory Graph */}
        {(state?.rings?.ring2?.memoryEntries || []).slice(0, 5).map((entry: any, i: number) => (
          (entry.links || []).map((link: any, j: number) => (
            <line 
              key={`${i}-${j}`}
              x1={50 + 32 * Math.cos((i * 72) * Math.PI / 180)}
              y1={50 + 32 * Math.sin((i * 72) * Math.PI / 180)}
              x2={50 + 32 * Math.cos((j * 144) * Math.PI / 180)}
              y2={50 + 32 * Math.sin((j * 144) * Math.PI / 180)}
              stroke="#a855f7"
              strokeWidth="0.2"
              strokeOpacity="0.3"
            />
          ))
        ))}

        {/* Pulse Animations for Activity & Neuro-Highway */}
        {(state?.rings?.ring3?.instances || []).some((i: any) => i && i.status === 'Executing') && (
          <>
            <circle cx="50" cy="50" r="45" fill="none" stroke="#00FF9F" strokeWidth="1" className="animate-ping opacity-20" />
            
            {/* Neuro-Highway Flow Simulation (Moving dots along lines) */}
            <motion.circle 
              r="1.5" fill="#00FF9F"
              animate={{ 
                cx: [50, 50 + 45 * Math.cos(0)], 
                cy: [50, 50 + 45 * Math.sin(0)],
                opacity: [0, 1, 0]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.circle 
              r="1.5" fill="#00FF9F"
              animate={{ 
                cx: [50, 50 + 45 * Math.cos(Math.PI)], 
                cy: [50, 50 + 45 * Math.sin(Math.PI)],
                opacity: [0, 1, 0]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1 }}
            />
          </>
        )}
        
        {/* Perimeter Shield Pulse */}
        <circle 
          cx="50" cy="50" r="49" 
          fill="none" 
          stroke="#00FF9F" 
          strokeWidth="0.5" 
          strokeDasharray="1, 8" 
          className="opacity-20 animate-[spin_60s_linear_infinite]" 
        />
        
        {/* Center Sparkle */}
        <circle cx="50" cy="50" r="4" fill="#00FF9F" className="animate-pulse shadow-[0_0_10px_#00FF9F]" />
      </svg>
      
      {/* Legend Labels */}
      <div className="absolute inset-0 pointer-events-none">
        <RingLabel r={45} label="Ring 3: Execution" active={activeRing === 3} color="text-[#00FF9F]" />
        <RingLabel r={32} label="Ring 2: Context" active={activeRing === 2} color="text-purple-400" />
        <RingLabel r={18} label="Ring 1: Core" active={activeRing === 1} color="text-blue-400" />
      </div>
    </div>
  );
}

function RingLabel({ r, label, active, color }: { r: number, label: string, active: boolean, color: string }) {
  return (
    <div 
      className={cn(
        "absolute left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-widest transition-opacity duration-300",
        active ? "opacity-100" : "opacity-0"
      )}
      style={{ top: `${50 - r}%` }}
    >
      <span className={cn("px-2 py-0.5 bg-zinc-950 rounded border border-zinc-800", color)}>{label}</span>
    </div>
  );
}

function TelemetryRow({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-zinc-900 last:border-0">
      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">{label}</span>
      <span className={cn("text-[11px] font-mono font-bold tabular-nums", color)}>{value}</span>
    </div>
  );
}
