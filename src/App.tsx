import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, Database, Settings, Cpu, HardDrive, Bell, Search, Menu, 
  Zap, Activity, Image as ImageIcon, Terminal, Play, Square, Pause, Share2, Brain,
  Plus, ListTree, Grid, Boxes, X, MessageSquare, Github, Sparkles, Trash2, Command,
  Gauge, TrendingUp, Activity as ActivityIndicator, ChevronRight, Download, RotateCcw,
  BookOpen
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ModelsView } from './components/ModelsView';
import { CodeTrainingStudio } from './components/CodeTrainingStudio';
import { ProjectHome } from './components/ProjectHome';
import { ConnectProjectModal } from './components/ConnectProjectModal';
import { InferencePlayground } from './components/InferencePlayground';
import { GlobalCommandPalette } from './components/GlobalCommandPalette';
import { GlobalResourceMonitor } from './components/GlobalResourceMonitor';
import EngineeringGuide from './components/EngineeringGuide';
import SettingsPage from './components/SettingsPage';
import { useResourceMonitor } from './hooks/useResourceMonitor';
import { useSettings } from './hooks/useSettings';
import { VoiceProvider } from './contexts/VoiceContext';
import { cn } from './lib/utils';
import { Project, Command as CommandType } from './types';

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'agi-explorer',
    name: 'Mini-AGI Explorer',
    category: 'Agentic AI',
    status: 'Ready',
    connectionType: 'Local',
    model: 'Qwen2.5-Coder-7B-Instruct',
    lastRun: 'Never',
    created: '2024-05-17',
    tokenCount: '450k',
    datasetSize: '125 MB',
    template: 'AGI Explorer',
    entryPoints: ['src/agent.py', 'train.py', 'src/tools.py'],
    metrics: { accuracy: 0, loss: 0, throughput: '0k tok/s' }
  },
  {
    id: 'default',
    name: 'Llama-3-FineTune',
    category: 'Fine-Tuning',
    status: 'Running',
    connectionType: 'Local',
    model: 'Llama-3-8B-Base',
    lastRun: '2 mins ago',
    created: '2024-05-10',
    tokenCount: '1.2M',
    datasetSize: '420 MB',
    metrics: { accuracy: 0.94, loss: 0.1243, throughput: '4.2k tok/s' }
  },
  {
    id: 'inf-1',
    name: 'Stable-Diffusion-H100',
    category: 'Inference',
    status: 'Stopped',
    connectionType: 'Endpoint',
    model: 'SDXL-v1.0',
    lastRun: '1 hour ago',
    created: '2024-05-12',
    metrics: { throughput: '1.2 img/s' }
  }
];

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentCost, setCurrentCost] = useState(420.150);
  const [currentView, setCurrentView] = useState('Dashboard'); // Default to Dashboard
  const { settings } = useSettings();
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('af_projects_v2');
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    } catch (e) {
      console.error("Failed to parse projects from localStorage", e);
      return INITIAL_PROJECTS;
    }
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD/CTRL + SHIFT + P
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // CTRL / CMD + ,
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setCurrentView('Settings');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('theme-light', 'theme-high-contrast');
    if (settings.general.theme === 'Light') {
      document.documentElement.classList.add('theme-light');
    } else if (settings.general.theme === 'GeForce High Contrast') {
      document.documentElement.classList.add('theme-high-contrast');
    }
  }, [settings.general.theme]);

  // Handle Sidebar Auto-Hide
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const shouldHideSidebar = settings.editor.sidebarAutoHide && !isSidebarHovered && currentView === 'Code Training';

  const commands: CommandType[] = [
    { id: 'new-proj', name: 'Connect AI Project...', icon: Plus, category: 'Workspace', action: () => setShowConnectModal(true) },
    { id: 'open-projects', name: 'Open Projects Hub', icon: Grid, category: 'Navigation', shortcut: 'G P', action: () => setCurrentView('Projects') },
    { id: 'open-models', name: 'Open Models View', icon: Database, category: 'Navigation', action: () => setCurrentView('Models') },
    { id: 'open-studio', name: 'Open Code Training Studio', icon: Brain, category: 'Navigation', action: () => setCurrentView('Code Training') },
    { id: 'open-inference', name: 'Open Inference Playground', icon: Zap, category: 'Navigation', action: () => setCurrentView('Inference') },
    { id: 'open-integrations', name: 'Open Integrations', icon: Boxes, category: 'Navigation', action: () => setCurrentView('Integrations') },
    { id: 'open-hardware', name: 'Open Hardware Monitor', icon: HardDrive, category: 'Navigation', action: () => setCurrentView('Hardware') },
    { id: 'open-guide', name: 'Open Engineering Guide', icon: BookOpen, category: 'Navigation', action: () => setCurrentView('Guide') },
    { id: 'show-monitor', name: 'Show Resource Monitor', icon: Gauge, category: 'Monitoring', action: () => setCurrentView('Hardware') },
    { id: 'optim-alloc', name: 'Optimize GPU Allocation', icon: TrendingUp, category: 'Monitoring', action: () => {} },
    { id: 'open-exps', name: 'Open Experiments Hub', icon: Activity, category: 'Navigation', action: () => setCurrentView('Experiments') },
    { id: 'open-settings', name: 'Open System Settings', icon: Settings, category: 'Navigation', shortcut: '⌘,', action: () => setCurrentView('Settings') },
    { id: 'install-pwa', name: 'Install Helix (PWA)', icon: Download, category: 'System', action: () => handleInstallClick() },
    
    // Code Training Studio Context
    { id: 'start-train', name: 'Start Training Cycle', icon: Play, category: 'Training', context: ['Code Training'], action: () => window.dispatchEvent(new CustomEvent('run-terminal-command', { detail: 'python train.py' })) },
    { id: 'eval-run', name: 'Run HumanEval Benchmark', icon: ActivityIndicator, category: 'Training', context: ['Code Training'], action: () => window.dispatchEvent(new CustomEvent('run-terminal-command', { detail: 'python eval.py' })) },
    { id: 'optim-hp', name: 'Optimize Hyperparameters', icon: Sparkles, category: 'Training', context: ['Code Training'], action: () => {} },
    { id: 'recipe-lora', name: 'Recipe: Quick LoRA Code Tune', icon: Zap, category: 'Training', context: ['Code Training'], action: () => window.dispatchEvent(new CustomEvent('studio-action', { detail: 'recipe:quick-lora' })) },
    { id: 'recipe-full', name: 'Recipe: Full Performance Tune', icon: Activity, category: 'Training', context: ['Code Training'], action: () => window.dispatchEvent(new CustomEvent('studio-action', { detail: 'recipe:full-finetune' })) },
    { id: 'recipe-synth', name: 'Recipe: Synthetic Data Engine', icon: Database, category: 'Training', context: ['Code Training'], action: () => window.dispatchEvent(new CustomEvent('studio-action', { detail: 'recipe:synthetic-data' })) },
    { id: 'view-checkpoints', name: 'Browse Checkpoints', icon: ListTree, category: 'Training', context: ['Code Training'], action: () => {} },
    
    // Models View Context
    { id: 'import-hf', name: 'Import from Hugging Face', icon: Database, category: 'Models', context: ['Models'], action: () => {} },
    { id: 'quantize-model', name: 'Quantize Model (GGUF/EXL2)', icon: Cpu, category: 'Models', context: ['Models'], action: () => {} },
    { id: 'prune-weights', name: 'Prune Unused Weights', icon: Trash2, category: 'Models', context: ['Models'], action: () => {} },
    
    // Inference Playground Context
    { id: 'clear-chat', name: 'Clear Active Session', icon: Trash2, category: 'Inference', context: ['Inference'], action: () => {} },
    { id: 'toggle-sys', name: 'Edit System Prompt', icon: MessageSquare, category: 'Inference', context: ['Inference'], action: () => {} },
    { id: 'export-logs', name: 'Export Chat Logs', icon: Share2, category: 'Inference', context: ['Inference'], action: () => {} },

    // Projects Context
    { id: 'scan-local', name: 'Scan Local Path', icon: Search, category: 'Projects', context: ['Projects'], action: () => setShowConnectModal(true) },
    { id: 'git-sync', name: 'Sync with Remote Repository', icon: Github, category: 'Projects', context: ['Projects'], action: () => {} },

    // Global Terminal / System
    { id: 'run-smi', name: 'Run nvidia-smi', icon: HardDrive, category: 'Terminal', action: () => window.dispatchEvent(new CustomEvent('run-terminal-command', { detail: 'nvidia-smi' })) },
    { id: 'run-app', name: 'Run app.py', icon: Play, category: 'Terminal', action: () => window.dispatchEvent(new CustomEvent('run-terminal-command', { detail: 'python app.py' })) },
    { id: 'refresh-gpu', name: 'Refresh GPU Status', icon: Activity, category: 'System', action: () => {} },
    { id: 'export-all', name: 'Export All Experiments', icon: Share2, category: 'System', action: () => {} },
    { id: 'toggle-dark', name: 'Toggle Dark Mode', icon: Settings, category: 'Settings', action: () => {} },
    { id: 'pal-settings', name: 'Command Palette Settings...', icon: Settings, category: 'Settings', action: () => {} },
    { id: 'clear-logs', name: 'Clear All Logs', icon: Trash2, category: 'System', action: () => {} },
  ];

  useEffect(() => {
    localStorage.setItem('af_projects_v2', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCost(prev => prev + 0.0018); 
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const navigationOptions = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Projects', icon: Grid },
    { name: 'Models', icon: Database },
    { name: 'Code Training', icon: Brain },
    { name: 'Inference', icon: Zap },
    { name: 'Integrations', icon: Boxes },
    { name: 'Resources', icon: Gauge },
    { name: 'Guide', icon: BookOpen },
    { name: 'Experiments', icon: Activity },
    { name: 'Settings', icon: Settings },
  ];

  const handleConnect = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    setShowConnectModal(false);
  };

  const handleCreateProject = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    setSelectedProjectId(newProject.id);
    setCurrentView('Code Training');
  };

  const handleOpenProject = (id: string) => {
    setSelectedProjectId(id);
    setCurrentView('Code Training');
  };

  const navigation = navigationOptions.map(item => ({
    ...item,
    current: item.name === currentView
  }));

  return (
    <VoiceProvider>
      <div className={cn(
        "min-h-screen flex font-sans transition-colors duration-500 bg-app-bg text-app-text",
      )}>
      {/* Sidebar for desktop */}
      <aside 
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={cn(
          "hidden lg:flex w-64 flex-col fixed inset-y-0 border-r z-50 transition-all duration-300 bg-app-bg border-app-border",
          shouldHideSidebar ? "-translate-x-full opacity-0" : "translate-x-0 opacity-100"
        )}
      >
        <div className="flex items-center h-16 px-6 border-b border-zinc-800/60">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 rounded-md bg-[#00FF9F]/20 border border-[#00FF9F]/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,159,0.3)] group-hover:rotate-[360deg] transition-transform duration-1000 ease-in-out">
              <Zap className="text-[#00FF9F] w-5 h-5 drop-shadow-[0_0_8px_rgba(0,255,159,0.8)]" />
            </div>
            <span className="font-bold text-lg tracking-wider uppercase text-zinc-100 drop-shadow-[0_0_10px_rgba(0,255,159,0.4)] transition-all group-hover:text-[#00FF9F]">HelixStudio</span>
          </div>
        </div>
        <div className="flex-1 py-6 px-4 overflow-y-auto space-y-1">
          <p className="px-2 text-[10px] font-mono font-semibold tracking-[0.2em] text-zinc-500 uppercase mb-4">Command Center</p>
          {navigation.map((item) => (
            <a
              key={item.name}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setCurrentView(item.name);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                item.current
                  ? 'bg-[#00FF9F]/10 text-[#00FF9F] shadow-[inset_2px_0_0_#00FF9F] shadow-[0_0_15px_rgba(0,255,159,0.05)]'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <item.icon className={`w-4 h-4 transition-all ${item.current ? 'text-[#00FF9F] drop-shadow-[0_0_5px_rgba(0,255,159,0.5)] scale-110' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              {item.name}
              {item.current && <div className="absolute right-2 w-1 h-1 rounded-full bg-[#00FF9F] shadow-[0_0_8px_#00FF9F]"></div>}
            </a>
          ))}
          
          <div className="pt-6">
             <button 
               onClick={() => setShowConnectModal(true)}
               className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#00FF9F]/5 border border-[#00FF9F]/20 text-[#00FF9F] hover:bg-[#00FF9F]/10 transition-all text-xs font-bold"
             >
               <Plus className="w-3.5 h-3.5" />
               CONNECT PROJECT
             </button>
          </div>
        </div>
        
        <div className="p-4 border-t border-zinc-800/60">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-xs font-semibold text-zinc-300">GPU Cluster</h4>
              <span className="text-[10px] font-mono text-[#00FF9F]">82%</span>
            </div>
            <div className="w-full bg-zinc-950 rounded-full h-1.5 mb-3 overflow-hidden border border-zinc-800">
              <div className="bg-gradient-to-r from-[#00FF9F]/50 to-[#00FF9F] h-full shadow-[0_0_10px_#00FF9F] relative" style={{ width: '82%' }}>
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <div className="flex justify-between text-[8px] text-zinc-600 font-mono tracking-widest uppercase mb-4">
              <span>Nodes: 32</span>
              <span>VRAM: 2.4TB</span>
            </div>
            <button className="text-xs font-semibold text-zinc-950 bg-[#00FF9F] w-full py-1.5 rounded-md hover:bg-[#20ffaf] transition-colors shadow-[0_0_10px_rgba(0,255,159,0.2)] mb-3">
              REALLOCATE
            </button>
            <div className="flex justify-center border-t border-zinc-800 pt-3">
               <span className="text-[8px] font-mono text-zinc-700 tracking-[0.3em] uppercase">v1.1.0-Helix Protocol</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Node */}
      <main className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300",
        shouldHideSidebar ? "lg:pl-0" : "lg:pl-64"
      )}>
        {/* Header */}
        <header className="h-16 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-zinc-800/60 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center lg:hidden">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="text-zinc-400 hover:text-zinc-200 p-2 -ml-2 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          
          <div className="hidden lg:flex items-center flex-1 max-w-3xl gap-6">
            {/* Global File Menu */}
            <div className="flex items-center">
               <GlobalFileMenu 
                 onNew={() => setShowConnectModal(true)} 
                 onImport={() => {
                   setCurrentView('Code Training');
                   // This is a bit tricky since I don't have direct access to setModals in Studio
                   // But I can use a custom event
                   window.dispatchEvent(new CustomEvent('studio-action', { detail: 'import' }));
                 }}
                 onExport={() => {
                   setCurrentView('Code Training');
                   window.dispatchEvent(new CustomEvent('studio-action', { detail: 'export' }));
                 }}
               />
            </div>

            <div className="relative w-full max-w-sm group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-hover:text-[#00FF9F] transition-colors" />
              <input 
                readOnly
                onClick={() => setShowCommandPalette(true)}
                type="text" 
                placeholder="Ctrl+Shift+P for commands..." 
                className="w-full pl-9 pr-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-300 focus:outline-none focus:border-[#00FF9F]/50 transition-all font-mono cursor-pointer hover:bg-zinc-800/80"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40">
                <Command className="w-3 h-3" />
                <span className="text-[10px] font-mono">P</span>
              </div>
            </div>
            {/* Quick Metrics */}
            <div className="hidden xl:flex items-center gap-4">
               <TopResourceMonitor />
               <div className="w-px h-6 bg-zinc-800"></div>
               <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                     <span className="text-zinc-500">Live Projects</span>
                     <span className="text-zinc-200">{projects.length}</span>
                  </div>
                  <div className="w-px h-3 bg-zinc-800"></div>
                  <div className="flex items-center gap-1.5">
                     <span className="text-zinc-500">Global Burn</span>
                     <span className="text-red-400 tabular-nums font-semibold tracking-tight shadow-[0_0_8px_rgba(248,113,113,0.3)]">${currentCost.toFixed(3)}</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00FF9F]/10 border border-[#00FF9F]/40 text-[#00FF9F] hover:bg-[#00FF9F]/20 transition-all text-xs font-bold uppercase tracking-wider animate-pulse"
              >
                <Download className="w-4 h-4" />
                Install App
              </button>
            )}
            <button 
              onClick={() => setShowConnectModal(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-all text-xs font-bold uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              Connect
            </button>
            <button className="p-2 text-zinc-400 hover:text-zinc-200 relative rounded-md hover:bg-zinc-900 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00FF9F] shadow-[0_0_5px_#00FF9F] rounded-full"></span>
            </button>
            <div className="h-6 w-px bg-zinc-800 hidden sm:block"></div>
            <button className="flex items-center gap-2 pl-1 pr-2 rounded-md hover:bg-zinc-900 transition-colors">
              <img src="https://i.pravatar.cc/150?u=scott" alt="User" className="w-7 h-7 rounded border border-zinc-800" />
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className={cn("flex-1 px-4 flex", (currentView === 'Code Training' || currentView === 'Projects') && "px-0")}>
          <div className={cn(
            "flex-1 h-[calc(100vh-4rem)] overflow-y-auto",
            currentView !== 'Code Training' && currentView !== 'Projects' ? "py-6 pr-4 border-r border-zinc-800/60" : ""
          )}>
            {currentView === 'Dashboard' && <div className="p-8 pb-0"><Dashboard /></div>}
            {currentView === 'Projects' && (
              <div className="p-8 pb-0">
                <ProjectHome 
                  projects={projects} 
                  onConnect={() => setShowConnectModal(true)} 
                  onOpenProject={handleOpenProject}
                />
              </div>
            )}
            {currentView === 'Models' && <ModelsView />}
            {currentView === 'Inference' && <InferencePlayground projects={projects} />}
            {currentView === 'Code Training' && (
              <CodeTrainingStudio 
                projects={projects} 
                selectedProjectId={selectedProjectId || projects[0]?.id || 'default'} 
                onProjectCreate={handleCreateProject}
              />
            )}
            {currentView === 'Resources' && <div className="p-8 h-full overflow-auto custom-scrollbar"><GlobalResourceMonitor projects={projects || []} /></div>}
            {currentView === 'Settings' && <SettingsPage />}
            {currentView === 'Integrations' && <IntegrationsView />}
            {currentView === 'Guide' && <EngineeringGuide />}
            
            {currentView !== 'Dashboard' && currentView !== 'Settings' && currentView !== 'Inference' && currentView !== 'Projects' && currentView !== 'Models' && currentView !== 'Code Training' && currentView !== 'Integrations' && currentView !== 'Resources' && currentView !== 'Guide' && (() => {
              const currentNav = navigation.find(n => n.name === currentView);
              const Icon = currentNav?.icon || LayoutDashboard;
              return (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                  <Icon className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-bold uppercase tracking-[0.2em] text-[10px]">Universal Interface: {currentView}</p>
                  <p className="text-xs mt-2 text-zinc-600">Adapter pending for this subsystem.</p>
                </div>
              );
            })()}
          </div>

          {/* Right Panel - Contextual */}
          {currentView !== 'Code Training' && currentView !== 'Projects' && (
            <aside className="hidden xl:block w-80 py-6 pl-4 h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm tracking-wide text-zinc-200">System Logs</h3>
                <Terminal className="w-4 h-4 text-zinc-500" />
              </div>
              
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3 font-mono text-[10px] leading-relaxed text-zinc-400 h-96 overflow-y-auto shadow-inner">
                <p><span className="text-zinc-600">[14:32:01]</span> INFO: Master connection established.</p>
                <p><span className="text-[#00FF9F]">SUCCESS</span>: Discovered 2 active deployments.</p>
                <p className="animate-pulse">_</p>
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* Modals */}
      {showConnectModal && (
        <ConnectProjectModal 
          onClose={() => setShowConnectModal(false)}
          onConnect={handleConnect}
        />
      )}

      <GlobalCommandPalette 
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commands}
        currentContext={currentView}
      />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden text-zinc-100">
          <div className="fixed inset-0 bg-[#0A0A0A]/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <aside className="fixed inset-y-0 left-0 w-64 bg-[#111111] border-r border-zinc-800 shadow-2xl flex flex-col transform transition-transform">
            <div className="flex items-center justify-between h-16 px-6 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-[#00FF9F]/10 border border-[#00FF9F]/30 flex items-center justify-center">
                  <Zap className="text-[#00FF9F] w-5 h-5" />
                </div>
                <span className="font-bold tracking-wider uppercase text-lg">HelixStudio</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-zinc-500 hover:text-zinc-300 p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 py-6 px-4 overflow-y-auto space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentView(item.name);
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    item.current
                      ? 'bg-[#00FF9F]/10 text-[#00FF9F]'
                      : 'text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${item.current ? 'text-[#00FF9F]' : 'text-zinc-500'}`} />
                  {item.name}
                </a>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
    </VoiceProvider>
  );
}

function IntegrationsView() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [configModal, setConfigModal] = useState<any>(null);
  const [installModal, setInstallModal] = useState(false);
  const [adapters, setAdapters] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [installData, setInstallData] = useState({ name: '', description: '', type: 'Intelligence', icon: 'Cpu' });

  const fetchAdapters = useCallback(async () => {
    try {
      const res = await fetch('/api/agi/state');
      const data = await res.json();
      if (data.helixCore?.adapters) {
        setAdapters(data.helixCore.adapters);
      }
    } catch (err) {
      console.error("Failed to fetch adapters", err);
    }
  }, []);

  useEffect(() => {
    fetchAdapters();
    const interval = setInterval(fetchAdapters, 5000);
    return () => clearInterval(interval);
  }, [fetchAdapters]);

  const handleInstall = async () => {
    try {
      const res = await fetch('/api/helix/adapters/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adapter: installData })
      });
      if (res.ok) {
        setInstallModal(false);
        fetchAdapters();
      }
    } catch (err) {
      console.error("Install failed", err);
    }
  };

  const handleConfigure = async (id: string, config: any) => {
    try {
      const res = await fetch('/api/helix/adapters/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adapterId: id, config })
      });
      if (res.ok) {
        setConfigModal(null);
        fetchAdapters();
      }
    } catch (err) {
      console.error("Config failed", err);
    }
  };

  const handleSync = async (id: string) => {
    setIsSyncing(id);
    try {
      const res = await fetch('/api/helix/adapters/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adapterId: id })
      });
      if (res.ok) {
        fetchAdapters();
      }
    } catch (err) {
      console.error("Sync failed", err);
    } finally {
      setIsSyncing(null);
    }
  };

  const categories = ['All', 'SourceControl', 'Intelligence', 'Deployment', 'Compute', 'Monitoring'];

  const filteredAdapters = adapters.filter(int => {
    const matchesCategory = filter === 'All' || int.type === filter;
    const matchesSearch = int.name.toLowerCase().includes(search.toLowerCase()) || int.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header & Controls */}
      <div className="p-8 pb-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-tight">System Adapters & Integrations</h2>
          <button 
            onClick={() => setInstallModal(true)}
            className="px-4 py-2 bg-[#00FF9F] text-black rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#20ffaf] transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,159,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Install Adapter
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                  filter === cat 
                    ? "bg-[#00FF9F]/10 border border-[#00FF9F]/30 text-[#00FF9F]" 
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search integrations..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-[#00FF9F]/50 transition-all font-mono placeholder:text-zinc-600"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAdapters.map(int => {
            const Icon = (int.icon === 'Github' ? Github : (int.icon === 'Zap' ? Zap : (int.icon === 'Database' ? Database : Cpu)));
            return (
              <div key={int.id} className="flex flex-col h-full bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 group hover:border-[#00FF9F]/30 hover:bg-zinc-900/80 transition-all shadow-lg relative overflow-hidden">
                {int.status === 'Connected' && <div className="absolute top-0 right-0 w-16 h-16 bg-[#00FF9F]/5 blur-2xl rounded-full"></div>}
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className={cn(
                    "p-2.5 rounded-xl border transition-colors shadow-inner",
                    int.status === 'Connected' ? "bg-zinc-950 border-[#00FF9F]/20 text-[#00FF9F]" : "bg-zinc-950 border-zinc-800 text-zinc-500 group-hover:text-zinc-300"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={cn(
                      "text-[9px] font-bold uppercase px-2 py-0.5 rounded border tracking-widest",
                      int.status === 'Connected' ? "bg-[#00FF9F]/10 border-[#00FF9F]/30 text-[#00FF9F] shadow-[0_0_10px_rgba(0,255,159,0.1)]" : "bg-zinc-800 border-zinc-700 text-zinc-500"
                    )}>
                      {int.status}
                    </span>
                    {int.config?.lastSyncAt && (
                      <span className="text-[8px] font-mono text-zinc-600 font-bold uppercase">Sync: {new Date(int.config.lastSyncAt).toLocaleTimeString()}</span>
                    )}
                  </div>
                </div>
                
                <div className="relative z-10 flex-1">
                  <h4 className="text-sm font-bold text-zinc-100 mb-1">{int.name}</h4>
                  <span className="inline-block text-[10px] text-zinc-500 uppercase tracking-widest font-mono mb-3">{int.type}</span>
                  <p className="text-xs text-zinc-400 leading-relaxed font-medium">{int.description}</p>
                  
                  {int.features && (
                    <div className="flex flex-wrap gap-1 mt-4">
                      {int.features.map((f: string) => (
                        <span key={f} className="text-[8px] px-1.5 py-0.5 bg-black/40 border border-zinc-800 text-zinc-500 rounded uppercase font-bold">{f}</span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-6 relative z-10">
                  <button 
                    onClick={() => setConfigModal(int)}
                    className="py-2.5 rounded-lg border bg-zinc-950 border-zinc-700 text-zinc-300 text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-[#00FF9F]/50 transition-all flex items-center justify-center gap-2"
                  >
                    <Settings className="w-3 h-3" />
                    Configure
                  </button>
                  <button 
                    disabled={int.status !== 'Connected' || isSyncing === int.id}
                    onClick={() => handleSync(int.id)}
                    className={cn(
                      "py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                      int.status === 'Connected' && isSyncing !== int.id
                        ? "bg-[#00FF9F]/10 border border-[#00FF9F]/20 text-[#00FF9F] hover:bg-[#00FF9F]/20" 
                        : "bg-zinc-800 border-transparent text-zinc-600 cursor-not-allowed"
                    )}
                  >
                    <RotateCcw className={cn("w-3 h-3", isSyncing === int.id && "animate-spin")} />
                    Sync
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Config Modal Overlay */}
      {configModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1e1e1e] border border-zinc-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#252526]">
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#00FF9F]" />
                {configModal.name} Configuration
              </h3>
              <button onClick={() => setConfigModal(null)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const config: any = {};
              if (formData.get('token')) config.token = formData.get('token');
              if (formData.get('endpoint')) config.endpoint = formData.get('endpoint');
              if (formData.get('repo')) config.repoName = formData.get('repo');
              handleConfigure(configModal.id, config);
            }} className="p-6 space-y-5">
              {configModal.id === 'github' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Personal Access Token</label>
                    <input name="token" type="password" required defaultValue={configModal.config?.token || ''} placeholder="ghp_************************" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-[#00FF9F]/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Target Repository</label>
                    <input name="repo" type="text" defaultValue={configModal.config?.repoName || ''} placeholder="username/project-repo" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-[#00FF9F]/50" />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">API Key / Secret</label>
                    <input name="token" type="password" required defaultValue={configModal.config?.token || ''} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-[#00FF9F]/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Service Endpoint</label>
                    <input name="endpoint" type="text" defaultValue={configModal.config?.endpoint || ''} placeholder="https://api.example.com" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-[#00FF9F]/50" />
                  </div>
                </>
              )}

              {configModal.status === 'Connected' && (
                <div className="flex items-center gap-3 p-3 bg-[#00FF9F]/10 border border-[#00FF9F]/20 rounded-lg">
                  <div className="w-2 h-2 bg-[#00FF9F] rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold text-[#00FF9F] uppercase tracking-widest">Adapter active & health verified.</span>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setConfigModal(null)} className="flex-1 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-[#00FF9F] text-black text-xs font-bold uppercase tracking-widest hover:bg-[#20ffaf] transition-colors shadow-[0_0_15px_rgba(0,255,159,0.3)]">
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Install Modal */}
      {installModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1e1e1e] border border-zinc-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#252526]">
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#00FF9F]" />
                Install New Adapter
              </h3>
              <button onClick={() => setInstallModal(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Adapter Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Hugging Face, Ollama" 
                    value={installData.name}
                    onChange={e => setInstallData({ ...installData, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-xs text-zinc-300 outline-none focus:border-[#00FF9F]/50"
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Description</label>
                  <textarea 
                    placeholder="What does this integration do?" 
                    value={installData.description}
                    onChange={e => setInstallData({ ...installData, description: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-xs text-zinc-300 outline-none focus:border-[#00FF9F]/50 min-h-[80px]"
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Type</label>
                     <select 
                       value={installData.type}
                       onChange={e => setInstallData({ ...installData, type: e.target.value })}
                       className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-[#00FF9F]/50 appearance-none"
                     >
                        <option>Intelligence</option>
                        <option>SourceControl</option>
                        <option>Deployment</option>
                        <option>Compute</option>
                        <option>Monitoring</option>
                     </select>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Icon</label>
                     <select 
                       value={installData.icon}
                       onChange={e => setInstallData({ ...installData, icon: e.target.value })}
                       className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-[#00FF9F]/50 appearance-none"
                     >
                        <option value="Cpu">Generic Cpu</option>
                        <option value="Github">Github</option>
                        <option value="Zap">Zap / Active</option>
                        <option value="Database">Database</option>
                     </select>
                  </div>
               </div>

               <button 
                 disabled={!installData.name}
                 onClick={handleInstall}
                 className="w-full mt-4 py-3 bg-[#00FF9F] text-black font-black text-xs uppercase tracking-widest rounded-lg hover:bg-[#20ffaf] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,255,159,0.2)]"
               >
                 Install To AGI-OS
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GlobalFileMenu({ onNew, onImport, onExport }: { onNew: () => void, onImport: () => void, onExport: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2 rounded-lg hover:bg-zinc-900 border border-transparent",
          isOpen && "bg-zinc-900 border-zinc-800 text-white"
        )}
      >
        File
        <ChevronRight className={cn("w-3 h-3 transition-transform", isOpen ? "rotate-90" : "")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 mt-2 w-56 bg-[#111] border border-zinc-800 rounded-xl shadow-2xl z-[70] py-2 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
            <div className="px-4 py-2 mb-1">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Project Management</span>
            </div>
            <FileMenuOption 
              label="New Project" 
              icon={Plus} 
              shortcut="⌘N" 
              onClick={() => { onNew(); setIsOpen(false); }} 
            />
            <FileMenuOption 
              label="Import Repository" 
              icon={HardDrive} 
              onClick={() => { onImport(); setIsOpen(false); }} 
            />
            <div className="h-px bg-zinc-800 my-2 mx-3"></div>
            <FileMenuOption 
              label="Export Workspace" 
              icon={HardDrive} 
              onClick={() => { onExport(); setIsOpen(false); }} 
            />
            <div className="h-px bg-zinc-800 my-2 mx-3"></div>
            <FileMenuOption 
              label="Exit Dashboard" 
              icon={X} 
              onClick={() => setIsOpen(false)} 
            />
          </div>
        </>
      )}
    </div>
  );
}

function FileMenuOption({ label, icon: Icon, shortcut, onClick }: { label: string, icon: any, shortcut?: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#00FF9F]/10 text-zinc-400 hover:text-[#00FF9F] transition-all group"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-zinc-500 group-hover:text-[#00FF9F]" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {shortcut && <span className="text-[10px] font-mono text-zinc-600 group-hover:text-[#00FF9F]/50">{shortcut}</span>}
    </button>
  );
}

function TopResourceMonitor() {
  const { stats } = useResourceMonitor();
  
  return (
    <div className="flex items-center gap-4 text-xs font-mono">
       <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-[#00FF9F]" />
          <div className="flex flex-col">
             <div className="flex items-center gap-1">
                <span className="text-[9px] text-zinc-500 uppercase">GPU Load</span>
                <span className="text-[#00FF9F] font-bold text-[10px]">{stats.avgUtilization.toFixed(0)}%</span>
             </div>
             <div className="w-16 bg-zinc-950 h-0.5 rounded-full overflow-hidden border border-zinc-800">
                <div className="bg-[#00FF9F] h-full shadow-[0_0_5px_rgba(0,255,159,0.3)] transition-all duration-700" style={{ width: `${stats.avgUtilization}%` }}></div>
             </div>
          </div>
       </div>
       <div className="flex items-center gap-2">
          <HardDrive className="w-3.5 h-3.5 text-blue-400" />
          <div className="flex flex-col">
             <div className="flex items-center gap-1">
                <span className="text-[9px] text-zinc-500 uppercase">VRAM</span>
                <span className="text-blue-400 font-bold text-[10px]">{stats.totalVramUsed.toFixed(0)}GB</span>
             </div>
             <div className="w-16 bg-zinc-950 h-0.5 rounded-full overflow-hidden border border-zinc-800">
                <div className="bg-blue-500 h-full shadow-[0_0_5px_rgba(59,130,246,0.3)] transition-all duration-700" style={{ width: `${(stats.totalVramUsed / stats.totalVram) * 100}%` }}></div>
             </div>
          </div>
       </div>
       <div className="hidden 2xl:flex items-center gap-3">
          <div className="h-6 w-px bg-zinc-800 mx-2"></div>
          <div className="flex flex-col items-end">
             <span className="text-[8px] text-zinc-600 uppercase font-bold tracking-tighter">Throughput</span>
             <span className="text-[10px] text-[#00FF9F] font-bold tabular-nums">{(stats.tokensPerSec / 1000).toFixed(0)}k <span className="text-zinc-500">t/s</span></span>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[8px] text-zinc-600 uppercase font-bold tracking-tighter">Compute</span>
             <span className="text-[10px] text-zinc-300 font-bold tabular-nums">{stats.onlineNodes}<span className="text-zinc-500">/8 Nodes</span></span>
          </div>
       </div>
    </div>
  );
}

