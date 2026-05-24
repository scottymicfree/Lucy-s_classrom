import React, { useState } from 'react';
import { 
  Plus, Search, Filter, MoreVertical, Play, Square, 
  ExternalLink, Github, Folder, Zap, Brain, MessageSquare, 
  Library, Clock, Database, ArrowRight, Activity, Share2,
  Cpu, Terminal, BarChart3, Globe, Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Project, ProjectStatus } from '../types';

interface ProjectHomeProps {
  projects: Project[];
  onConnect: () => void;
  onOpenProject: (id: string) => void;
}

export function ProjectHome({ projects, onConnect, onOpenProject }: ProjectHomeProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('All');

  const filteredProjects = projects?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || p.category === filter;
    return matchesSearch && matchesFilter;
  }) || [];

  const categories = ['All', 'Fine-Tuning', 'Inference', 'Agentic AI', 'RAG', 'Evaluation'];

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 uppercase tracking-tight flex items-center gap-3">
            AI Project Hub
            <span className="text-[10px] bg-[#00FF9F]/10 text-[#00FF9F] px-2 py-0.5 rounded border border-[#00FF9F]/20 font-mono">UNIVERSAL</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Discover, connect, and manage your AI builds from one central command center.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onConnect}
            className="flex items-center gap-2 px-4 py-2 bg-[#00FF9F] text-zinc-950 rounded-lg font-bold text-sm hover:bg-[#88d400] transition-all shadow-[0_4px_20px_rgba(118,185,0,0.2)] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            CONNECT AI PROJECT
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search projects by name, model, or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-[#00FF9F]/50 transition-all font-mono"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border",
                filter === cat 
                  ? "bg-[#00FF9F]/10 border-[#00FF9F]/30 text-[#00FF9F]" 
                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
              )}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-12">
        {filteredProjects.map((project) => (
          <div key={project.id}>
            <ProjectCard project={project} onClick={() => onOpenProject(project.id)} />
          </div>
        ))}
        
        <button 
          onClick={onConnect}
          className="border-2 border-dashed border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:border-[#00FF9F]/30 hover:bg-[#00FF9F]/5 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 group-hover:text-[#00FF9F] group-hover:bg-[#00FF9F]/10 transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-zinc-400 group-hover:text-zinc-200">Connect New Resource</p>
            <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest">HuggingFace • Git • Local</p>
          </div>
        </button>
      </div>

      {/* Recipes Section */}
      <div className="pt-12 border-t border-zinc-800/60 pb-12">
        <div className="flex items-center justify-between mb-8">
           <div>
             <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-[0.2em] flex items-center gap-2">
               <Sparkles className="w-4 h-4 text-yellow-500" />
               Helix Marketplace & Recipes
             </h2>
             <p className="text-xs text-zinc-600 mt-1">One-click import of popular training and inference templates.</p>
           </div>
           <button className="text-[10px] font-bold text-[#00FF9F] hover:underline uppercase tracking-widest">Browse All</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
           <RecipeCard title="Llama-3 Fine-Tune LoRA" tags={['Official', 'Meta']} desc="Optimized config for 8B and 70B models." />
           <RecipeCard title="Stable Diffusion XL Helix" tags={['Vision', 'High-VRAM']} desc="Server-side inference for SDXL with custom nodes." />
           <RecipeCard title="RAG with LlamaIndex" tags={['Agents', 'Search']} desc="Connect your documents to a locally running LLM." />
           <RecipeCard title="Vision-LLM Quantizer" tags={['Utility']} desc="Convert models to GGUF/EXL2 for local edge nodes." />
        </div>
      </div>
    </div>
  );
}

function RecipeCard({ title, tags, desc }: { title: string, tags: string[], desc: string }) {
  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 hover:bg-zinc-800/40 hover:border-zinc-700 transition-all cursor-pointer group">
       <div className="flex gap-1 mb-3">
         {(tags || []).map(t => (
           <span key={t} className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 uppercase tracking-tighter">{t}</span>
         ))}
       </div>
       <h4 className="text-xs font-bold text-zinc-200 mb-1 group-hover:text-[#00FF9F] transition-colors">{title}</h4>
       <p className="text-[10px] text-zinc-600 leading-relaxed mb-4">{desc}</p>
       <button className="w-full py-1.5 rounded-lg bg-zinc-950 text-[9px] font-bold text-zinc-400 hover:text-white hover:bg-[#00FF9F]/10 transition-all border border-zinc-800 uppercase tracking-widest">Initialize Recipe</button>
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: Project, onClick: () => void }) {
  const isRunning = project.status === 'Running' || project.status === 'Training';

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden hover:border-[#00FF9F]/40 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[#00FF9F]/5",
        isRunning && "ring-1 ring-[#00FF9F]/20"
      )}
    >
      {/* Status Bar */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <div className={cn(
          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5",
          isRunning ? "bg-[#00FF9F]/10 text-[#00FF9F] border border-[#00FF9F]/20" : "bg-zinc-800 text-zinc-500 border border-zinc-700"
        )}>
          {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9F] animate-pulse"></span>}
          {project.status}
        </div>
      </div>

      {/* Hero Icon/Thumbnail Area */}
      <div className="h-32 bg-zinc-950 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ 
          backgroundImage: `linear-gradient(#00FF9F 1px, transparent 1px), linear-gradient(90deg, #00FF9F 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent"></div>
        
        <CategoryIcon category={project.category} className="w-12 h-12 text-zinc-800 group-hover:text-[#00FF9F]/40 group-hover:scale-110 transition-all duration-500" />
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">{project.category}</span>
            <span className="text-zinc-700">•</span>
            <ConnectionBadge type={project.connectionType} />
          </div>
          <h3 className="text-base font-bold text-zinc-100 group-hover:text-[#00FF9F] transition-colors">{project.name}</h3>
          <p className="text-[11px] text-zinc-500 font-mono mt-1">{project.model}</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-3 bg-black/40 rounded-xl border border-zinc-800/50">
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-600 font-bold uppercase block tracking-tighter">Throughput</span>
            <span className="text-xs font-mono text-zinc-300">{project.metrics?.throughput || '---'}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-600 font-bold uppercase block tracking-tighter">Loss / Acc</span>
            <span className="text-xs font-mono text-zinc-300">
              {project.metrics?.loss ? project.metrics.loss.toFixed(4) : '---'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-mono">
            <Clock className="w-3 h-3" />
            {project.lastRun || 'Never run'}
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors">
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-[#00FF9F]/20 text-zinc-200 hover:text-[#00FF9F] rounded-lg text-xs font-bold transition-all border border-zinc-700 hover:border-[#00FF9F]/40">
              OPEN
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryIcon({ category, className }: { category: string, className?: string }) {
  switch (category) {
    case 'Fine-Tuning': return <Brain className={className} />;
    case 'Inference': return <Zap className={className} />;
    case 'Agentic AI': return (
      <div className="relative">
        <Brain className={className} />
        <Zap className="w-5 h-5 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
      </div>
    );
    case 'Agent': return <MessageSquare className={className} />;
    case 'RAG': return <Library className={className} />;
    case 'Evaluation': return <BarChart3 className={className} />;
    default: return <Folder className={className} />;
  }
}

function ConnectionBadge({ type }: { type: string }) {
  const variants: Record<string, { icon: any, color: string }> = {
    'Local': { icon: Folder, color: 'text-blue-400' },
    'HuggingFace': { icon: Database, color: 'text-yellow-400' },
    'Git': { icon: Github, color: 'text-zinc-200' },
    'Endpoint': { icon: Globe, color: 'text-[#00FF9F]' },
    'Notebook': { icon: Terminal, color: 'text-purple-400' },
  };

  const { icon: Icon, color } = variants[type] || variants['Local'];

  return (
    <span className={cn("inline-flex items-center gap-1 text-[9px] font-bold uppercase", color)}>
      <Icon className="w-2.5 h-2.5" />
      {type}
    </span>
  );
}
