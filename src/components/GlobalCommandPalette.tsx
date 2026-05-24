import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Command as CommandIcon, Plus, Play, Square, 
  Terminal, Database, Brain, Zap, Activity, Settings, 
  HardDrive, Grid, Boxes, ArrowRight, Clock, Shield,
  ArrowUp, ArrowDown, CornerDownLeft, Box, Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Command } from '../types';

interface GlobalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
  currentContext?: string;
}

export function GlobalCommandPalette({ isOpen, onClose, commands, currentContext }: GlobalCommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter and prioritize commands
  const filteredCommands = useMemo(() => {
    if (!search) {
      // Prioritize context-aware commands when search is empty
      return commands ? [...commands].sort((a, b) => {
        const isAMatch = currentContext && a.context?.includes(currentContext);
        const isBMatch = currentContext && b.context?.includes(currentContext);
        
        if (isAMatch && !isBMatch) return -1;
        if (!isAMatch && isBMatch) return 1;
        return 0;
      }) : [];
    }

    const lowerSearch = search.toLowerCase();
    return (commands || [])
      .filter(cmd => 
        cmd.name.toLowerCase().includes(lowerSearch) || 
        cmd.category.toLowerCase().includes(lowerSearch)
      )
      .sort((a, b) => {
        // Priority 1: Context matches
        const isAMatch = currentContext && a.context?.includes(currentContext);
        const isBMatch = currentContext && b.context?.includes(currentContext);
        
        if (isAMatch && !isBMatch) return -1;
        if (!isAMatch && isBMatch) return 1;

        // Priority 2: Exact name prefix match
        const aPrefix = a.name.toLowerCase().startsWith(lowerSearch);
        const bPrefix = b.name.toLowerCase().startsWith(lowerSearch);
        if (aPrefix && !bPrefix) return -1;
        if (!aPrefix && bPrefix) return 1;

        return 0;
      });
  }, [search, commands, currentContext]);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          selected.action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filteredCommands, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    const activeItem = listRef.current?.children[selectedIndex] as HTMLElement;
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-[#0D0D0E] border border-zinc-800 rounded-2xl shadow-[0_0_50px_rgba(0,255,159,0.05)] overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-zinc-800/50 bg-[#151516]">
          <Search className="w-5 h-5 text-zinc-500" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Type a command or search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-zinc-100 text-lg outline-none placeholder:text-zinc-700 font-mono"
          />
          <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 rounded border border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-bold uppercase truncate">ESC to Close</span>
          </div>
        </div>

        {/* Command List */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2 no-scrollbar">
          {filteredCommands.length > 0 ? (
            <div className="space-y-1 px-2">
              {/* Contextual Suggestions Section */}
              {currentContext && filteredCommands.some(c => c.context?.includes(currentContext)) && !search && (
                <div className="space-y-1 mb-4">
                  <div className="px-4 pt-4 pb-1 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-[#00FF9F]" />
                    <span className="text-[10px] font-bold text-[#00FF9F] uppercase tracking-[0.2em]">Suggested for {currentContext}</span>
                  </div>
                  {filteredCommands
                    ?.filter(c => c.context?.includes(currentContext || ''))
                    ?.map((cmd) => {
                      const globalIdx = filteredCommands.findIndex(c => c.id === cmd.id);
                      const isSelected = globalIdx === selectedIndex;
                      const Icon = cmd.icon;

                      return (
                        <CommandButton 
                          key={`suggested-${cmd.id}`}
                          cmd={cmd}
                          isSelected={isSelected}
                          onClose={onClose}
                        />
                      );
                    })
                  }
                  <div className="h-px bg-zinc-800/30 mx-4 mt-4"></div>
                </div>
              )}

              {/* Grouped by Category */}
              {Array.from(new Set(filteredCommands
                ?.filter(c => !(!search && currentContext && c.context?.includes(currentContext)))
                ?.map(c => c.category))).map(category => (
                <div key={category} className="space-y-1">
                  <div className="px-4 pt-4 pb-1">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">{category}</span>
                  </div>
                  {filteredCommands
                    ?.filter(c => c.category === category && !(!search && currentContext && c.context?.includes(currentContext)))
                    ?.map((cmd) => {
                      const globalIdx = filteredCommands.findIndex(c => c.id === cmd.id);
                      const isSelected = globalIdx === selectedIndex;
                      return (
                        <CommandButton 
                          key={cmd.id}
                          cmd={cmd}
                          isSelected={isSelected}
                          onClose={onClose}
                        />
                      );
                    })
                  }
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center opacity-30 text-center">
               <Box className="w-12 h-12 mb-4" />
               <p className="text-sm font-bold uppercase tracking-widest">No matching commands</p>
               <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}
        </div>

        {/* Footer Hints */}
        <div className="px-6 py-4 bg-[#0A0A0A] border-t border-zinc-800/50 flex items-center gap-8 justify-center">
           <Hint icon={CornerDownLeft} text="to select" />
           <Hint icon={ArrowUp} text="" />
           <Hint icon={ArrowDown} text="to navigate" />
           <Hint icon={Search} text="to filter" />
        </div>
      </div>
    </div>
  );
}

function Hint({ icon: Icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex items-center gap-1.5 grayscale opacity-50">
       <div className="p-1 bg-zinc-900 rounded border border-zinc-800">
         <Icon className="w-3 h-3 text-zinc-300" />
       </div>
       <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{text}</span>
    </div>
  );
}

function CommandButton({ cmd, isSelected, onClose }: { cmd: Command, isSelected: boolean, onClose: () => void, key?: React.Key }) {
  const Icon = cmd.icon;
  return (
    <button
      onClick={() => {
        cmd.action();
        onClose();
      }}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group",
        isSelected 
          ? "bg-[#00FF9F]/10 border border-[#00FF9F]/20 shadow-[0_0_20px_rgba(118,185,0,0.05)]" 
          : "bg-transparent border border-transparent hover:bg-zinc-900/50"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-2 rounded-lg transition-colors",
          isSelected ? "bg-[#00FF9F]/20 text-[#00FF9F]" : "bg-zinc-900 text-zinc-500 group-hover:text-zinc-300"
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="text-left">
          <span className={cn(
            "text-sm font-medium block",
            isSelected ? "text-zinc-100" : "text-zinc-400 group-hover:text-zinc-200"
          )}>
            {cmd.name}
          </span>
          {cmd.category && !isSelected && (
             <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-tighter">{cmd.category}</span>
          )}
        </div>
      </div>
      {cmd.shortcut && (
        <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
           <span className="text-[10px] font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-500">{cmd.shortcut}</span>
        </div>
      )}
    </button>
  );
}
