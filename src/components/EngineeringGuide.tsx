import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Cpu, 
  Shield, 
  Zap, 
  Network, 
  Database, 
  Code2, 
  Radio,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

const EngineeringGuide: React.FC = () => {
  const sections = [
    {
      id: 'architecture',
      title: 'The Ring Architecture',
      icon: <Network className="w-5 h-5 text-blue-400" />,
      content: `Helix-OS operates on a segmented trust model called the "Ring Architecture." 
      
      • Ring 1 (Cortical Gateway): The system's centralized consciousness. It handles global state, security routing, and high-level goal orchestration.
      • Ring 2 (Semantic Memory): A high-speed vector-like memory layer that stores "Trajectories" (interaction histories) and successful agent strategies.
      • Ring 3 (Pluripotent Execution Pools): Isolated WebAssembly (WASM) environments where specialized tasks are performed. These pools start as "Undifferentiated" stem cells and specialize based on context injection.`
    },
    {
      id: 'pluripotent-pools',
      title: 'Working with Pluripotent Pools',
      icon: <Cpu className="w-5 h-5 text-purple-400" />,
      content: `Execution Pools are designed for ephemeral, high-security computation.
      
      1. Provisioning: A pool is initialized with a WASM binary (the "DNA").
      2. Context Intake: The "Neuro-Highway" injects specific variables and historical trajectories into the pool's heap.
      3. Differentiation: The pool takes on a specialty (Logic, Memory, Creative, Security) and begins execution.
      4. Scrubbing: Upon completion, the system performs a MADV_DONTNEED zero-fill memory scrub, returning the pool to a clean state.`
    },
    {
      id: 'curiosity-v2',
      title: 'Agentic Curiosity (V2)',
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      content: `Helix-OS implements a Curiosity-Beta protocol for autonomous discovery. When training an agent, you aren't just giving it data; you are defining an "Entropy Threshold."
      
      The agent will proactively search for data patterns that reduce system-wide entropy. If it succeeds, the "Coherence Score" increases, indicating a more stable and intelligent system state.`
    },
    {
      id: 'best-practices',
      title: 'Engineering Best Practices',
      icon: <Code2 className="w-5 h-5 text-green-400" />,
      content: `• Ephemeral Input: Never pass permanent secrets through the Neuro-Highway. Use short-lived Attestation Tokens.
      • Specialization Choice: Let the system auto-differentiate pools for general tasks, but manually force "Security" specialty for cryptography or authentication logic.
      • Telemetry Monitoring: Keep the Coherence Ratio above 0.85. If entropy spikes, initiate a global state "Re-synchronization" through the Cortical Gateway.`
    }
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic">Engineering Users Guide</h1>
          </div>
          <p className="text-zinc-400 text-lg leading-relaxed">
            A technical blueprint for orchestrating AGI within the Helix-OS ecosystem. This guide details the interaction between Ring logic, memory trajectories, and pluripotent workers.
          </p>
        </header>

        {/* Quick Nav */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section, idx) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-blue-500/30 transition-colors group cursor-pointer"
              onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-zinc-800 rounded-lg">
                  {section.icon}
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 transition-colors" />
              </div>
              <h3 className="font-bold text-lg mb-2">{section.title}</h3>
              <p className="text-zinc-500 text-sm line-clamp-2">
                Learn how {section.title.toLowerCase()} influences system behavior.
              </p>
            </motion.div>
          ))}
        </div>

        {/* Detailed Sections */}
        <div className="space-y-16 py-8 border-t border-zinc-800/50">
          {sections.map((section) => (
            <section id={section.id} key={section.id} className="space-y-6 scroll-mt-24">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-blue-500 rounded-full" />
                <h2 className="text-2xl font-black uppercase tracking-tight">{section.title}</h2>
              </div>
              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-8 leading-loose text-zinc-300">
                <div className="whitespace-pre-line text-lg">
                  {section.content}
                </div>
              </div>
              <div className="flex gap-4">
                <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-blue-400 transition-colors border border-zinc-800 rounded-full px-4 py-2">
                  <ExternalLink className="w-3 h-3" />
                  API Docs
                </button>
                <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-blue-400 transition-colors border border-zinc-800 rounded-full px-4 py-2">
                  <Info className="w-3 h-3" />
                  View Source
                </button>
              </div>
            </section>
          ))}
        </div>

        {/* Footer Note */}
        <footer className="pt-12 pb-24 border-t border-zinc-800/50 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/5 border border-orange-500/20 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500 mb-4">
            <Radio className="w-3 h-3 animate-pulse" />
            Live System Pulse: Nominal
          </div>
          <p className="text-zinc-600 text-xs">
            Helix-OS Protocol v2.4.0 • Engineering Documentation • Distributed under AGI-1 License
          </p>
        </footer>
      </div>
    </div>
  );
};

export default EngineeringGuide;
