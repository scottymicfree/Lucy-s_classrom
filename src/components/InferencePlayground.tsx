import React, { useState } from 'react';
import { 
  Send, Sparkles, Zap, Brain, Globe, MessageSquare, 
  Settings, Save, Search, Play, Square, Code, History
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Project } from '../types';

interface InferencePlaygroundProps {
  projects: Project[];
}

export function InferencePlayground({ projects }: InferencePlaygroundProps) {
  const inferenceProjects = projects?.filter(p => p.category === 'Inference' || p.status === 'Running') || [];
  const [selectedProjectId, setSelectedProjectId] = useState(inferenceProjects[0]?.id || '');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [params, setParams] = useState({
    temperature: 0.72,
    topP: 0.95,
    maxTokens: 2048,
    repetitionPenalty: 1.1
  });

  const selectedProject = projects?.find(p => p.id === selectedProjectId);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    // Simulate inference
    setTimeout(() => {
      const assistantMessage = { role: 'assistant' as const, content: `Synthesized response from ${selectedProject?.name || 'Local Model'}: The parameters provided suggest a highly optimal configuration for ${selectedProject?.model || 'General Purpose AI'}. Results show 99% alignment with desired output vectors.` };
      setMessages(prev => [...prev, assistantMessage]);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="flex h-full animate-in fade-in duration-500 overflow-hidden">
      {/* Playground Sidebar */}
      <div className="w-80 border-r border-zinc-800 bg-[#0A0A0A] flex flex-col shrink-0">
        <div className="p-6 border-b border-zinc-800">
           <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Select Target Hub</h3>
           <div className="space-y-2">
             {inferenceProjects.map(proj => (
               <button 
                 key={proj.id}
                 onClick={() => setSelectedProjectId(proj.id)}
                 className={cn(
                   "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                   selectedProjectId === proj.id 
                     ? "bg-[#00FF9F]/10 border-[#00FF9F]/30 text-[#00FF9F]" 
                     : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/40"
                 )}
               >
                 <div className="p-1.5 bg-zinc-950 rounded-lg">
                   <Zap className="w-4 h-4" />
                 </div>
                 <div>
                   <p className="text-xs font-bold truncate">{proj.name}</p>
                   <p className="text-[9px] font-mono opacity-60 truncate">{proj.model}</p>
                 </div>
               </button>
             ))}
             {inferenceProjects.length === 0 && (
                <div className="p-4 border border-dashed border-zinc-800 rounded-xl text-center">
                  <p className="text-[10px] text-zinc-600 uppercase">No active endpoints</p>
                </div>
             )}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
           <div>
              <div className="flex items-center justify-between mb-4">
                 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Model Params</span>
                 <Settings className="w-3.5 h-3.5 text-zinc-600" />
              </div>
              <div className="space-y-4">
                 <PlaygroundSlider 
                   label="Temperature" 
                   value={params.temperature} 
                   min={0} 
                   max={1} 
                   step={0.01} 
                   onChange={v => setParams(p => ({ ...p, temperature: v }))} 
                 />
                 <PlaygroundSlider 
                   label="Top P" 
                   value={params.topP} 
                   min={0} 
                   max={1} 
                   step={0.01} 
                   onChange={v => setParams(p => ({ ...p, topP: v }))} 
                 />
                 <PlaygroundSlider 
                   label="Max Tokens" 
                   value={params.maxTokens} 
                   min={1} 
                   max={8192} 
                   step={128} 
                   onChange={v => setParams(p => ({ ...p, maxTokens: v }))} 
                 />
                 <PlaygroundSlider 
                   label="Repetition Penalty" 
                   value={params.repetitionPenalty} 
                   min={1} 
                   max={2} 
                   step={0.05} 
                   onChange={v => setParams(p => ({ ...p, repetitionPenalty: v }))} 
                 />
              </div>
           </div>

           <div className="pt-8 border-t border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-4">Connection Details</span>
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-3 font-mono text-[9px] text-zinc-500 break-all">
                 <p className="mb-1 text-zinc-400">ENDPOINT URL</p>
                 <p className="text-[#00FF9F]">https://ais.helixstudio.ai/v1/projects/{selectedProjectId}/chat</p>
              </div>
           </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#0A0A0A] relative">
        {/* Chat Header */}
        <div className="h-16 border-b border-zinc-800/80 bg-zinc-950/20 px-8 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-[#00FF9F]/10 rounded-full border border-[#00FF9F]/20">
               <MessageSquare className="w-4 h-4 text-[#00FF9F]" />
             </div>
             <div>
               <h3 className="text-sm font-bold text-zinc-100 italic">Playground Preview</h3>
               <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Target: {selectedProject?.name || 'Null Node'}</p>
             </div>
           </div>
           <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 text-[10px] font-bold uppercase text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all">
                <Code className="w-3 h-3" />
                View API Code
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-[10px] font-bold uppercase text-zinc-200 hover:bg-zinc-700 transition-all">
                <Save className="w-3 h-3" />
                Save Session
              </button>
           </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-12 py-8 space-y-8 no-scrollbar">
           {messages.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center opacity-20">
                <Sparkles className="w-12 h-12 mb-4" />
                <p className="text-sm font-bold uppercase tracking-[0.2em]">Universal Inference Playground</p>
                <p className="text-xs mt-2">Send a message to see the output from your connected models.</p>
             </div>
           )}
           {messages.map((m, i) => (
             <div key={i} className={cn(
               "flex gap-6 animate-in slide-in-from-bottom-2 duration-300",
               m.role === 'assistant' ? "text-zinc-100" : "text-zinc-400"
             )}>
               <div className="shrink-0 pt-1">
                 {m.role === 'user' ? (
                   <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                     <span className="text-[10px] font-bold uppercase">YOU</span>
                   </div>
                 ) : (
                   <div className="w-8 h-8 rounded-lg bg-[#00FF9F]/20 border border-[#00FF9F]/40 flex items-center justify-center">
                     <Zap className="w-4 h-4 text-[#00FF9F]" />
                   </div>
                 )}
               </div>
               <div className="flex-1">
                  <p className="text-sm leading-relaxed max-w-3xl whitespace-pre-wrap">{m.content}</p>
               </div>
             </div>
           ))}
           {isGenerating && (
             <div className="flex gap-6 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-[#00FF9F]/10 border border-[#00FF9F]/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#00FF9F]" />
                </div>
                <div className="flex-1 pt-3.5">
                   <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-[#00FF9F] rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-[#00FF9F] rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-[#00FF9F] rounded-full"></div>
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* Input Bar */}
        <div className="p-8 pb-12">
           <div className="relative group max-w-4xl mx-auto">
              <textarea 
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={`Ask ${selectedProject?.name || 'your model'} anything...`}
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl px-6 py-5 pr-24 text-sm text-zinc-100 outline-none focus:border-[#00FF9F]/50 selection:bg-[#00FF9F]/20 transition-all font-sans resize-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 <button 
                   onClick={handleSend}
                   disabled={!input.trim() || isGenerating}
                   className="p-3 bg-[#00FF9F] text-zinc-950 rounded-xl hover:bg-[#88d400] transition-all disabled:opacity-50 shadow-xl shadow-[#00FF9F]/10 group-active:scale-95"
                 >
                   <Send className="w-5 h-5" />
                 </button>
              </div>
           </div>
           <p className="text-center text-[10px] text-zinc-600 mt-4 uppercase tracking-[0.2em]">Inference token usage will be billed to account: scottymicfree</p>
        </div>
      </div>
    </div>
  );
}

function PlaygroundSlider({ label, value, min, max, step, onChange }: { label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">{label}</span>
        <span className="text-[10px] font-mono text-[#00FF9F] bg-[#00FF9F]/5 px-1.5 rounded">{value}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#00FF9F]" 
      />
    </div>
  );
}
