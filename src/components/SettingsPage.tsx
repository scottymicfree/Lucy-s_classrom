import React, { useState, useMemo } from 'react';
import { 
  Settings as SettingsIcon, Brain, Zap, Gauge, Code, Folder, 
  Shield, Search, Save, RotateCcw, ChevronRight, Check, AlertTriangle,
  Info, Monitor, Cpu, Terminal, Palette, Languages, HardDrive, Sparkles,
  Eye, Bug, Download, Upload, Trash2, Key, Beaker, Mic, Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings, Settings } from '../hooks/useSettings';
import { cn } from '../lib/utils';

type CategoryId = keyof Settings;

interface SettingField {
  id: string;
  label: string;
  description: string;
  type: 'select' | 'input' | 'number' | 'toggle' | 'slider';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

const CATEGORIES: { id: CategoryId; label: string; icon: any; desc: string }[] = [
  { id: 'general', label: 'General', icon: SettingsIcon, desc: 'Base application preferences' },
  { id: 'ai', label: 'AI & Models', icon: Brain, desc: 'Intelligence and inference settings' },
  { id: 'training', label: 'Training', icon: Zap, desc: 'Hardware & training parameters' },
  { id: 'monitoring', label: 'Resources', icon: Gauge, desc: 'Performance & health tracking' },
  { id: 'editor', label: 'Editor & UI', icon: Code, desc: 'Development environment visuals' },
  { id: 'projects', label: 'Projects', icon: Folder, desc: 'Workspace & data management' },
  { id: 'voice', label: 'Voice & Audio', icon: Mic, desc: 'NLP voice interaction specs' },
  { id: 'advanced', label: 'Advanced', icon: Shield, desc: 'Developer tools & API keys' },
];

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [activeCategory, setActiveCategory] = useState<CategoryId>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [showToast, setShowToast] = useState(false);

  const handleUpdate = (category: CategoryId, field: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
    setUnsavedChanges(true);
  };

  const handleAPIKeyUpdate = (keyName: string, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      advanced: {
        ...prev.advanced,
        apiKeys: {
          ...prev.advanced.apiKeys,
          [keyName]: value
        }
      }
    }));
    setUnsavedChanges(true);
  };

  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const testConnection = (keyName: string) => {
    setTestingConnection(keyName);
    setTimeout(() => {
      setTestingConnection(null);
      alert(`${keyName} Connection: Verified (Simulator)`);
    }, 1500);
  };

  const handleSave = () => {
    updateSettings(localSettings);
    setUnsavedChanges(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    setUnsavedChanges(false);
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return CATEGORIES;
    return CATEGORIES.filter(cat => 
      cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800 bg-[#0D0D0D]">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-tighter flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#00FF9F]" />
            Helix Control Studio
          </h2>
          <p className="text-[10px] uppercase font-mono text-zinc-500 mt-1 tracking-widest">Global Configuration & Helix Protocol Specs</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-[#00FF9F] transition-colors" />
            <input 
              type="text" 
              placeholder="Search settings..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-300 focus:outline-none focus:border-[#00FF9F]/50 transition-all font-mono"
            />
          </div>
          
          {unsavedChanges && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
               <button 
                 onClick={handleCancel}
                 className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest"
               >
                 Discard
               </button>
               <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-[#00FF9F] text-zinc-950 text-xs font-black rounded-lg hover:bg-[#20ffaf] transition-all shadow-[0_0_20px_rgba(0,255,159,0.2)] uppercase tracking-widest"
               >
                 <Save className="w-4 h-4" />
                 Apply Changes
               </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-zinc-800/60 bg-[#0D0D0D] flex flex-col">
          <div className="p-4 space-y-1">
            {filteredCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all group relative overflow-hidden",
                  activeCategory === cat.id 
                    ? "bg-[#00FF9F]/10 text-[#00FF9F]" 
                    : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
                )}
              >
                {activeCategory === cat.id && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute inset-0 bg-[#00FF9F]/5 border-l-2 border-[#00FF9F]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                <cat.icon className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-110 relative z-10",
                  activeCategory === cat.id ? "text-[#00FF9F]" : "text-zinc-500"
                )} />
                <div className="text-left relative z-10">
                  <span className="block font-bold truncate">{cat.label}</span>
                  <span className="block text-[9px] text-zinc-600 truncate uppercase tracking-tighter group-hover:text-zinc-500">{cat.desc}</span>
                </div>
                
                {activeCategory === cat.id && (
                  <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#00FF9F] shadow-[0_0_12px_#00FF9F] animate-pulse"></div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-auto p-4 border-t border-zinc-800/40">
            <button 
              onClick={() => {
                if(confirm('System Reset: All settings will be reverted to factory defaults. Continue?')) {
                  resetSettings();
                  setLocalSettings(settings);
                  setUnsavedChanges(false);
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all text-[10px] font-bold uppercase tracking-widest"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Factory Reset
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-[#0A0A0A] p-10 custom-scrollbar relative">
          <div className="max-w-3xl mx-auto pb-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-12"
              >
                {activeCategory === 'general' && (
                  <div className="space-y-8">
                    <SectionHeader icon={Palette} title="Visual Appearance" />
                    <div className="grid grid-cols-1 gap-6">
                      <SettingRow 
                        label="Application Theme" 
                        desc="Select the global UI color scheme. Note: GeForce theme provides maximum contrast for code."
                      >
                        <Select 
                          value={localSettings.general.theme} 
                          options={['Dark', 'Light', 'GeForce High Contrast']} 
                          onChange={v => handleUpdate('general', 'theme', v)} 
                        />
                      </SettingRow>
                      <SettingRow 
                        label="Localization" 
                        desc="Primary language for interface text and date formatting."
                      >
                        <Select 
                          value={localSettings.general.language} 
                          options={['English (US)', 'English (UK)', 'Spanish', 'French', 'German', 'Japanese', 'Chinese']} 
                          onChange={v => handleUpdate('general', 'language', v)} 
                        />
                      </SettingRow>
                    </div>

                    <SectionHeader icon={Monitor} title="Workspace Behavior" />
                    <div className="grid grid-cols-1 gap-6">
                      <SettingRow 
                        label="Background Persistence" 
                        desc="How often the application state is committed to local storage (seconds)."
                      >
                        <NumberInput 
                          value={localSettings.general.autoSaveInterval} 
                          min={5} max={300} 
                          onChange={v => handleUpdate('general', 'autoSaveInterval', v)} 
                        />
                      </SettingRow>
                      <SettingRow 
                        label="Startup Protocol" 
                        desc="Specify the default entry point when initializing the workspace."
                      >
                        <Select 
                          value={localSettings.general.startupBehavior} 
                          options={['Last Project', 'Mini-AGI Demo', 'Projects Hub']} 
                          onChange={v => handleUpdate('general', 'startupBehavior', v)} 
                        />
                      </SettingRow>
                      <SettingRow 
                        label="Default Project Path" 
                        desc="Root directory for connecting local repositories."
                      >
                        <input 
                          type="text" 
                          value={localSettings.general.defaultProjectPath}
                          onChange={e => handleUpdate('general', 'defaultProjectPath', e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] font-mono py-2 px-3 rounded-lg focus:outline-none focus:border-[#00FF9F]/30 w-full"
                        />
                      </SettingRow>
                    </div>
                  </div>
                )}

                {activeCategory === 'ai' && (
                  <div className="space-y-8">
                    <SectionHeader icon={Brain} title="Intelligence Core" />
                    <div className="grid grid-cols-1 gap-6">
                      <SettingRow 
                        label="Default Foundation Model" 
                        desc="The base architecture used for initializing new shards and training runs."
                      >
                        <Select 
                          value={localSettings.ai.defaultBaseModel} 
                          options={['Llama-3-8B-Base', 'Llama-3-70B-Instruct', 'Mistral-7B-v0.3', 'Qwen2.5-Coder-7B']} 
                          onChange={v => handleUpdate('ai', 'defaultBaseModel', v)} 
                        />
                      </SettingRow>
                      <SettingRow 
                        label="Compute Provider" 
                        desc="Preferred engine for assistant inference and co-editing."
                      >
                        <Select 
                          value={localSettings.ai.preferredProvider} 
                          options={['Local', 'Groq', 'OpenAI', 'Together.ai']} 
                          onChange={v => handleUpdate('ai', 'preferredProvider', v)} 
                        />
                      </SettingRow>
                    </div>

                    <SectionHeader icon={Sparkles} title="Co-Editor Parameters" />
                    <div className="grid grid-cols-1 gap-6">
                       <SettingRow label="Creativity (Temperature)" desc="Controls randomness: 0.0 is deterministic, 1.0 is creative.">
                          <Slider value={localSettings.ai.temperature} min={0} max={1} step={0.1} onChange={v => handleUpdate('ai', 'temperature', v)} />
                       </SettingRow>
                       <SettingRow label="Context Length (Max Tokens)" desc="Maximum length of assistant response buffers.">
                          <NumberInput value={localSettings.ai.maxTokens} min={256} max={8192} step={256} onChange={v => handleUpdate('ai', 'maxTokens', v)} />
                       </SettingRow>
                       <SettingRow label="Assistant Persona" desc="Defines the behavior and tone of the AI Co-Editor.">
                          <Select 
                            value={localSettings.ai.personality} 
                            options={['Helper', 'Teacher', 'Senior Engineer', 'AGI Tutor']} 
                            onChange={v => handleUpdate('ai', 'personality', v)} 
                          />
                       </SettingRow>
                       <SettingRow label="Ghost Text Suggestions" desc="Enable real-time inline code completion previews (LSP).">
                          <Toggle enabled={localSettings.ai.ghostText} onChange={v => handleUpdate('ai', 'ghostText', v)} />
                       </SettingRow>
                    </div>
                  </div>
                )}

                {activeCategory === 'training' && (
                  <div className="space-y-8">
                    <SectionHeader icon={Cpu} title="Compute Architecture" />
                    <div className="grid grid-cols-1 gap-6">
                      <SettingRow label="Numeric Precision" desc="Determines memory bandwidth vs calculation accuracy.">
                        <Select 
                          value={localSettings.training.precision} 
                          options={['bf16', 'fp16', 'fp8']} 
                          onChange={v => handleUpdate('training', 'precision', v)} 
                        />
                      </SettingRow>
                      <SettingRow label="VRAM Safety Margin" desc="Reserved video memory buffer for system stability (GB).">
                        <NumberInput value={localSettings.training.vramMargin} min={0} max={16} onChange={v => handleUpdate('training', 'vramMargin', v)} />
                      </SettingRow>
                      <SettingRow label="Distributed Strategy" desc="Workload distribution method for multi-gpu clusters.">
                        <Select 
                          value={localSettings.training.multiGpuStrategy} 
                          options={['DDP', 'FSDP', 'DeepSpeed']} 
                          onChange={v => handleUpdate('training', 'multiGpuStrategy', v)} 
                        />
                      </SettingRow>
                    </div>

                    <SectionHeader icon={ActivityIndicator} title="Training Orchestration" />
                    <div className="grid grid-cols-1 gap-6">
                       <SettingRow label="Global Batch Size" desc="Number of samples per training step across all GPUs.">
                          <NumberInput value={localSettings.training.batchSize} min={1} max={1024} step={1} onChange={v => handleUpdate('training', 'batchSize', v)} />
                       </SettingRow>
                       <SettingRow label="Default LoRA Preset" desc="Initial hyperparameter configuration for new finetuning tasks.">
                          <Select 
                            value={localSettings.training.defaultLoraPreset} 
                            options={['Light', 'Balanced', 'Deep', 'Experimental']} 
                            onChange={v => handleUpdate('training', 'defaultLoraPreset', v)} 
                          />
                       </SettingRow>
                       <SettingRow label="Flash Attention v2" desc="High-speed attention kernel for faster training convergence.">
                          <Toggle enabled={localSettings.training.flashAttention} onChange={v => handleUpdate('training', 'flashAttention', v)} />
                       </SettingRow>
                       <SettingRow label="Torch Compile" desc="Enable JIT compilation for neural network graphs.">
                          <Toggle enabled={localSettings.training.torchCompile} onChange={v => handleUpdate('training', 'torchCompile', v)} />
                       </SettingRow>
                       <SettingRow label="Auto-Optimize level" desc="Aggressiveness of the automated parameter optimizer.">
                          <Slider value={localSettings.training.autoOptimizeLevel} min={0} max={5} step={1} onChange={v => handleUpdate('training', 'autoOptimizeLevel', v)} />
                       </SettingRow>
                    </div>
                  </div>
                )}

                {activeCategory === 'monitoring' && (
                  <div className="space-y-8">
                    <SectionHeader icon={Gauge} title="Sensor Polling" />
                    <div className="grid grid-cols-1 gap-6">
                      <SettingRow label="Heartbeat Interval" desc="Frequency of hardware telemetry updates (seconds).">
                        <NumberInput value={localSettings.monitoring.refreshRate} min={0.5} max={10} step={0.5} onChange={v => handleUpdate('monitoring', 'refreshRate', v)} />
                      </SettingRow>
                      <SettingRow label="Thermal Warning" desc="Threshold to trigger visual alerts on GPU heat (Celsius).">
                        <div className="flex items-center gap-4">
                          <NumberInput value={localSettings.monitoring.gpuTempThreshold} min={50} max={95} onChange={v => handleUpdate('monitoring', 'gpuTempThreshold', v)} />
                          <span className="text-xs font-mono text-zinc-500">°C</span>
                        </div>
                      </SettingRow>
                      <SettingRow label="Thermal Killswitch" desc="Auto-pause training when GPU core temperature exceeds safety limits.">
                        <div className="flex items-center gap-4">
                          <NumberInput value={localSettings.monitoring.autoPauseTemp} min={60} max={105} onChange={v => handleUpdate('monitoring', 'autoPauseTemp', v)} />
                          <span className="text-xs font-mono text-zinc-500">°C</span>
                        </div>
                      </SettingRow>
                      <SettingRow label="Logging Verbosity" desc="Level of detail emitted to the system console during training.">
                        <Select 
                          value={localSettings.monitoring.loggingVerbosity} 
                          options={['Quiet', 'Normal', 'Verbose', 'Debug']} 
                          onChange={v => handleUpdate('monitoring', 'loggingVerbosity', v)} 
                        />
                      </SettingRow>
                      <SettingRow label="Live Token Counter" desc="Show real-time throughput metrics in the global header.">
                        <Toggle enabled={localSettings.monitoring.showLiveTokens} onChange={v => handleUpdate('monitoring', 'showLiveTokens', v)} />
                      </SettingRow>
                    </div>
                  </div>
                )}

                {activeCategory === 'editor' && (
                  <div className="space-y-8">
                    <SectionHeader icon={Code} title="Editor Preferences" />
                    <div className="grid grid-cols-1 gap-6">
                      <SettingRow label="Global Font Size" desc="Set character size for code editing components (pt).">
                        <NumberInput value={localSettings.editor.fontSize} min={8} max={24} onChange={v => handleUpdate('editor', 'fontSize', v)} />
                      </SettingRow>
                      <SettingRow label="Typeface Family" desc="Primary monospaced font used in the Helix editor.">
                        <Select 
                          value={localSettings.editor.fontFamily} 
                          options={['JetBrains Mono', 'Fira Code', 'Roboto Mono', 'Source Code Pro']} 
                          onChange={v => handleUpdate('editor', 'fontFamily', v)} 
                        />
                      </SettingRow>
                      <SettingRow label="Code Minimap" desc="Show vertical bird-eye preview of the current file buffer.">
                        <Toggle enabled={localSettings.editor.minimap} onChange={v => handleUpdate('editor', 'minimap', v)} />
                      </SettingRow>
                      <SettingRow label="Line Numeration" desc="Display sequential indices on the left side of the editor.">
                        <Toggle enabled={localSettings.editor.lineNumbers} onChange={v => handleUpdate('editor', 'lineNumbers', v)} />
                      </SettingRow>
                      <SettingRow label="Bracket Pair Colorization" desc="Visually link opening and closing syntax brackets with matching colors.">
                        <Toggle enabled={localSettings.editor.bracketPairs} onChange={v => handleUpdate('editor', 'bracketPairs', v)} />
                      </SettingRow>
                      <SettingRow label="Sidebar Auto-Hide" desc="Automatically collapse navigation sidebar when editor gains focus.">
                        <Toggle enabled={localSettings.editor.sidebarAutoHide} onChange={v => handleUpdate('editor', 'sidebarAutoHide', v)} />
                      </SettingRow>
                    </div>
                  </div>
                )}

                {activeCategory === 'projects' && (
                  <div className="space-y-8">
                    <SectionHeader icon={Folder} title="Workspace Defaults" />
                    <div className="grid grid-cols-1 gap-6">
                      <SettingRow label="Auto-Connect Repositories" desc="Search for Helix metadata when opening local directories.">
                        <Toggle enabled={localSettings.projects.autoImport} onChange={v => handleUpdate('projects', 'autoImport', v)} />
                      </SettingRow>
                      <SettingRow label="Default Project Template" desc="Base structure used when creating new AI initiatives.">
                        <Select 
                          value={localSettings.projects.defaultTemplate} 
                          options={['Mini-AGI Explorer', 'Pure Inference', 'LoRA Fine-Tune', 'Blank Helix']} 
                          onChange={v => handleUpdate('projects', 'defaultTemplate', v)} 
                        />
                      </SettingRow>
                      <SettingRow label="Project Backups" desc="Enable automated snapshots of project state and config files.">
                        <Toggle enabled={localSettings.projects.backupEnabled} onChange={v => handleUpdate('projects', 'backupEnabled', v)} />
                      </SettingRow>
                      <SettingRow label="Experiment Tracking Hub" desc="Platform for logging training checkpoints, curves, and weights.">
                        <Select 
                          value={localSettings.projects.experimentTracker} 
                          options={['None', 'W&B', 'MLFlow', 'Local']} 
                          onChange={v => handleUpdate('projects', 'experimentTracker', v)} 
                        />
                      </SettingRow>
                    </div>
                  </div>
                )}

                {activeCategory === 'voice' && (
                  <div className="space-y-8">
                    <SectionHeader icon={Mic} title="Neural Voice Mode" />
                    <div className="grid grid-cols-1 gap-6">
                      <SettingRow 
                        label="Enable Live Voice Mode" 
                        desc="Activate continuous listening and voice synthesis for real-time collaboration."
                      >
                        <Toggle enabled={localSettings.voice.enabled} onChange={v => handleUpdate('voice', 'enabled', v)} />
                      </SettingRow>
                      <SettingRow 
                        label="Auto-Send Transcription" 
                        desc="Automatically push your transcribed voice input to Helix when you stop speaking."
                      >
                        <Toggle enabled={localSettings.voice.autoSend} onChange={v => handleUpdate('voice', 'autoSend', v)} />
                      </SettingRow>
                      <SettingRow 
                        label="Prefer Male Helix Voice" 
                        desc="Filter available system voices to prioritize deep, professional male tones."
                      >
                        <Toggle enabled={localSettings.voice.maleVoiceOnly} onChange={v => handleUpdate('voice', 'maleVoiceOnly', v)} />
                      </SettingRow>
                      <SettingRow 
                        label="Wake Word (Hey Helix)" 
                        desc="The AI will passively listen for the 'Hey Helix' activation phrase. Uses lower power processing (Simulated)."
                      >
                        <Toggle enabled={localSettings.voice.wakeWordEnabled} onChange={v => handleUpdate('voice', 'wakeWordEnabled', v)} />
                      </SettingRow>
                    </div>

                    <SectionHeader icon={Volume2} title="Audio synthesis Specifications" />
                    <div className="grid grid-cols-1 gap-6">
                      <SettingRow label="Output Volume" desc="Adjust the signal strength of Helix's voice responses.">
                         <Slider value={localSettings.voice.volume} min={0} max={1} step={0.1} onChange={v => handleUpdate('voice', 'volume', v)} />
                      </SettingRow>
                      <SettingRow label="Speech Velocity" desc="Controls the words-per-minute (WPM) rate of synthesis.">
                         <Slider value={localSettings.voice.speed} min={0.5} max={2} step={0.1} onChange={v => handleUpdate('voice', 'speed', v)} />
                      </SettingRow>
                      <SettingRow label="Voice Pitch" desc="Adjust the frequency components of the generated audio.">
                         <Slider value={localSettings.voice.pitch} min={0.5} max={2} step={0.1} onChange={v => handleUpdate('voice', 'pitch', v)} />
                      </SettingRow>
                    </div>
                  </div>
                )}

                {activeCategory === 'advanced' && (
                  <div className="space-y-8">
                    <SectionHeader icon={Shield} title="Developer Access" />
                    <div className="grid grid-cols-1 gap-6">
                      <SettingRow label="Local Backend Relay" desc="Route AI instructions to a locally running inference server.">
                        <Toggle enabled={localSettings.advanced.localBackend} onChange={v => handleUpdate('advanced', 'localBackend', v)} />
                      </SettingRow>
                      <SettingRow label="Global Debug Mode" desc="Enable verbose runtime logging and state inspection tools.">
                        <Toggle enabled={localSettings.advanced.debugMode} onChange={v => handleUpdate('advanced', 'debugMode', v)} />
                      </SettingRow>
                      
                      <div className="space-y-4 p-6 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl">
                         <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                           <Key className="w-3.5 h-3.5" /> Secure Credential Manager
                         </p>
                         <div className="space-y-4">
                            <KeyField 
                              label="OpenAI API Key" 
                              value={localSettings.advanced.apiKeys['OpenAI'] || ''}
                              onChange={v => handleAPIKeyUpdate('OpenAI', v)}
                              onTest={() => testConnection('OpenAI')}
                              isTesting={testingConnection === 'OpenAI'}
                            />
                            <KeyField 
                              label="Anthropic API Key" 
                              value={localSettings.advanced.apiKeys['Anthropic'] || ''}
                              onChange={v => handleAPIKeyUpdate('Anthropic', v)}
                              onTest={() => testConnection('Anthropic')}
                              isTesting={testingConnection === 'Anthropic'}
                            />
                            <KeyField 
                              label="Groq API Key" 
                              value={localSettings.advanced.apiKeys['Groq'] || ''}
                              onChange={v => handleAPIKeyUpdate('Groq', v)}
                              onTest={() => testConnection('Groq')}
                              isTesting={testingConnection === 'Groq'}
                            />
                            <KeyField 
                              label="Weights & Biases Token" 
                              value={localSettings.advanced.apiKeys['W&B'] || ''}
                              onChange={v => handleAPIKeyUpdate('W&B', v)}
                              onTest={() => testConnection('W&B')}
                              isTesting={testingConnection === 'W&B'}
                            />
                         </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-800 flex flex-col sm:flex-row gap-4">
                      <button className="flex-1 flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all text-sm font-bold text-zinc-300">
                        <Download className="w-4 h-4" />
                        Export Config (.json)
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all text-sm font-bold text-zinc-300">
                        <Upload className="w-4 h-4" />
                        Import Config File
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Save Toast */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-[#00FF9F] text-zinc-950 px-6 py-3 rounded-xl font-bold shadow-[0_0_30px_rgba(0,255,159,0.4)] flex items-center gap-3 border border-white/20">
            <Check className="w-5 h-5" />
            <div>
              <p className="text-sm">Configuration Sync Successful</p>
              <p className="text-[10px] uppercase opacity-70">Changes applied to local environment</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: any, title: string }) {
  return (
    <div className="flex items-center gap-3 pb-2 border-b border-zinc-800/60">
      <div className="p-2 bg-zinc-900/50 rounded-lg text-zinc-400">
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">{title}</h3>
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string, desc: string, children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-1">
      <div className="flex-1 max-w-md">
        <h4 className="text-sm font-bold text-zinc-200 mb-1">{label}</h4>
        <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
      </div>
      <div className="flex-shrink-0 min-w-[200px] flex justify-end">
        {children}
      </div>
    </div>
  );
}

function Select({ value, options, onChange }: { value: string, options: string[], onChange: (v: any) => void }) {
  return (
    <select 
      value={value} 
      onChange={e => onChange(e.target.value)}
      className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] font-bold py-2 px-3 rounded-lg focus:outline-none focus:border-[#00FF9F]/50 cursor-pointer w-full tracking-wider"
    >
      {options.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
    </select>
  );
}

function NumberInput({ value, min, max, step = 1, onChange }: { value: number, min: number, max: number, step?: number, onChange: (v: number) => void }) {
  return (
    <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden w-full max-w-[140px]">
      <button 
        onClick={() => onChange(Math.max(min, value - step))}
        className="px-2 py-2 text-zinc-500 hover:text-white transition-colors border-r border-zinc-800"
      >
        -
      </button>
      <input 
        type="number" 
        value={value} 
        onChange={e => onChange(parseFloat(e.target.value))}
        className="bg-transparent w-full text-center text-[11px] font-mono text-[#00FF9F] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
      />
      <button 
        onClick={() => onChange(Math.min(max, value + step))}
        className="px-2 py-2 text-zinc-500 hover:text-white transition-colors border-l border-zinc-800"
      >
        +
      </button>
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean, onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-200 shadow-inner",
        enabled ? "bg-[#00FF9F]" : "bg-zinc-800"
      )}
    >
      <span
        className={cn(
          "inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200",
          enabled ? "translate-x-6 shadow-[0_0_8px_white]" : "translate-x-1"
        )}
      />
    </button>
  );
}

function Slider({ value, min, max, step, onChange }: { value: number, min: number, max: number, step: number, onChange: (v: number) => void }) {
  return (
    <div className="w-full flex items-center gap-3">
       <input 
         type="range" 
         min={min} 
         max={max} 
         step={step} 
         value={value} 
         onChange={e => onChange(parseFloat(e.target.value))}
         className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#00FF9F]"
       />
       <span className="text-[10px] font-mono text-[#00FF9F] w-8 text-right font-bold">{value}</span>
    </div>
  );
}

function KeyField({ label, value, onChange, onTest, isTesting }: { label: string, value: string, onChange: (v: string) => void, onTest: () => void, isTesting: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5 animate-in fade-in duration-300">
       <div className="flex justify-between items-center px-1">
          <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{label}</label>
          <div className="flex items-center gap-3">
            <button 
              onClick={onTest} 
              disabled={!value || isTesting}
              className={cn(
                "text-[9px] uppercase tracking-widest font-bold transition-colors",
                isTesting ? "text-zinc-600" : "text-[#00FF9F] hover:text-[#20ffaf] disabled:opacity-30 disabled:cursor-not-allowed"
              )}
            >
              {isTesting ? 'Verifying...' : 'Test Connection'}
            </button>
            <button onClick={() => setShow(!show)} className="text-[9px] text-zinc-400 hover:text-zinc-200 uppercase tracking-widest font-bold">
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
       </div>
       <div className="relative group">
          <Shield className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 group-focus-within:text-[#00FF9F] transition-colors" />
          <input 
            type={show ? 'text' : 'password'} 
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={`Enter ${label.split(' ')[0]} credential...`}
            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg pl-8 pr-4 py-2 text-[10px] text-zinc-400 font-mono focus:outline-none focus:border-[#00FF9F]/30 transition-all placeholder:text-zinc-800"
          />
       </div>
    </div>
  );
}

const ActivityIndicator = Cpu; // Fallback
