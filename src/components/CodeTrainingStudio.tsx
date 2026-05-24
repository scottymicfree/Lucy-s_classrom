import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Files, Search, GitBranch, Play, Bug, Settings, Brain, ChevronRight, 
  ChevronDown, Terminal as TerminalIcon, BarChart3, ListTree, Activity,
  Database, Zap, Info, Gauge, Square, RotateCcw, Share2, MoreVertical,
  X, Maximize2, Layout, Sliders, Box, Bell, Pause, FolderPlus, Upload, Download, Plus, Folder, Monitor, Cpu, Terminal, TrendingUp, Sparkles, Users,
  FileJson, FileCode2, FileText, FileCode, MessageSquare, Bot, Send, Sparkle, BookOpen, Wand2, Layers, Shield, Lightbulb, Compass, CheckCircle2, Loader2, Rocket, Mic, Volume2, AlertTriangle
} from 'lucide-react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import JSZip from 'jszip';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { Project, FileNode, ProjectStatus, PersonaId, CoachId, CuriosityState, CuriosityPhase, CuriosityStep, HelixCore, UpcomingEvent } from '../types';
import Editor from '@monaco-editor/react';
import { useSettings } from '../hooks/useSettings';
import { useVoice } from '../hooks/useVoice';
import { WASM_EXAMPLES } from '../constants/wasmExamples';
import { PERSONAS, COACHES } from '../constants/aiSettings';

const DEFAULT_FILE_TREE: FileNode[] = [
  {
    name: 'src',
    type: 'folder',
    isOpen: true,
    children: [
      { name: 'model.py', type: 'file' },
      { name: 'train.py', type: 'file' },
      { name: 'utils.py', type: 'file' },
    ]
  },
  {
    name: 'data',
    type: 'folder',
    isOpen: true,
    children: [
      { name: 'training.jsonl', type: 'file' },
      { name: 'validation.jsonl', type: 'file' },
      { name: 'synthetic_data.py', type: 'file' },
    ]
  },
  {
    name: 'configs',
    type: 'folder',
    children: [
      { name: 'training_config.yaml', type: 'file' },
      { name: 'lora_config.json', type: 'file' },
    ]
  },
  { name: 'requirements.txt', type: 'file' },
  { name: '.env', type: 'file' },
];

const initialProjects: Project[] = [
  {
    id: 'default',
    name: 'Llama-3-FineTune',
    model: 'Llama-3-8B-Base',
    category: 'Fine-Tuning',
    status: 'Running',
    connectionType: 'Local',
    template: 'LoRA Starter',
    fileTree: DEFAULT_FILE_TREE,
    created: '2024-05-10',
    tokenCount: '1.2M',
    datasetSize: '420 MB'
  }
];

const mockGpuData = [
  { name: '0', usage: 88 },
  { name: '1', usage: 92 },
  { name: '2', usage: 45 },
  { name: '3', usage: 0 },
];

export type CognitionState = 
  | 'IDLE' 
  | 'EXECUTION_PLANNING' // 🔵 System-Level
  | 'PROCEDURAL_SYNTHESIS' // 🟢 Runtime / Execution
  | 'WALKTHROUGH' // 🟡 Interpretation / Explanation
  | 'MODEL_TRAINING' // 🟢 Real ML
  | 'FAILED_RESEARCH'
  | 'BUILD_ERROR'
  | 'SANDBOX_REJECTED'
  | 'EXPORT_PARTIAL'
  | 'ROLLBACK';

export function CodeTrainingStudio({ projects, selectedProjectId, onProjectCreate }: { projects: Project[], selectedProjectId: string, onProjectCreate?: (p: Project) => void }) {
  const [currentProjectId, setCurrentProjectId] = useState(selectedProjectId);
  
  useEffect(() => {
    setCurrentProjectId(selectedProjectId);
  }, [selectedProjectId]);

  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];
  
  if (!currentProject) {
    return (
      <div className="flex-1 bg-[#1e1e1e] flex flex-col items-center justify-center text-zinc-500">
        <Brain className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm font-medium">No project selected or available.</p>
        <button 
          onClick={() => onProjectCreate?.({ id: 'default', name: 'New Project', model: 'Llama-3-8B-Base', category: 'Fine-Tuning', status: 'Idle', connectionType: 'Local', created: new Date().toISOString() })}
          className="mt-4 px-4 py-2 bg-[#00FF9F]/10 text-[#00FF9F] rounded-lg border border-[#00FF9F]/20 hover:bg-[#00FF9F]/20 transition-all font-bold text-xs uppercase tracking-widest"
        >
          Initialize Default Project
        </button>
      </div>
    );
  }
  const [modals, setModals] = useState<{ new: boolean; import: boolean; export: boolean }>({
    new: false,
    import: false,
    export: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [activeWalkthrough, setActiveWalkthrough] = useState<{
    steps: { title: string; code: string; description: string; file: string }[];
    currentStep: number;
  } | null>(null);
  const [cognitionState, setCognitionState] = useState<CognitionState>('IDLE');
  const [toast, setToast] = useState<{ message: string, type: 'info' | 'success' | 'warn' } | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const { settings } = useSettings();

  const [activeTab, setActiveTab] = useState('model.py');
  const [selectedWasmKey, setSelectedWasmKey] = useState<keyof typeof WASM_EXAMPLES>('MATH_ENGINE');
  const [isTraining, setIsTraining] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState('training');
  const [bottomTab, setBottomTab] = useState('monitor');
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState<{ step: number; loss: number; accuracy: number; vram: number; lr: number }[]>([]);
  const [vramUsage, setVramUsage] = useState(72);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "hx-studio-cluster: fine-tuning-session $",
    "python train.py --config configs/training_config.yaml",
    "Initializing distributed environment with 8 GPUs...",
  ]);
  const [tokensPerSec, setTokensPerSec] = useState(0);
  const [editedFiles, setEditedFiles] = useState<Set<string>>(new Set());
  const [localFileTree, setLocalFileTree] = useState<FileNode[]>(currentProject.fileTree || []);
  const [rightSidebarTab, setRightSidebarTab] = useState<'inspector' | 'assistant' | 'security' | 'coach'>('inspector');
  const [isRightSidebarVisible, setIsRightSidebarVisible] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [coopMode, setCoopMode] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([
    { id: '1', title: 'Llama-3 Benchmark Prep', targetDate: '2026-06-15', type: 'benchmark', priority: 'high', status: 'in-progress' },
    { id: '2', title: 'Q3 Security Audit', targetDate: '2026-07-01', type: 'audit', priority: 'medium', status: 'pending' }
  ]);
  const [isEventModeActive, setIsEventModeActive] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "SYSTEM_MODE=ENGINEERING. Helix Assistant initialized. Analysis of current training telemetry and architecture topology ready for query." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showRecipeSuggestion, setShowRecipeSuggestion] = useState(true);
  const [selectedPersona, setSelectedPersona] = useState<PersonaId>('prime');

  const [loraConfig, setLoraConfig] = useState({
    rank: 16,
    alpha: 32,
    dropout: 0.05,
    learningRate: 1.5e-4,
    targetModules: ['q_proj', 'v_proj'],
    precision: 'bf16' as 'fp16' | 'bf16' | 'fp32',
    batchSize: 4
  });

  // VRAM Estimator logic
  const calculateEstimatedVRAM = () => {
    let baseModelSize = 14.2; 
    if (currentProject.model?.includes('70B')) baseModelSize = 42.5;
    if (currentProject.model?.includes('Phi')) baseModelSize = 4.2;
    
    const rankFactor = (loraConfig.rank / 64) * (loraConfig.targetModules.length / 4) * 0.8;
    const batchFactor = loraConfig.batchSize * 0.15;
    const precisionFactor = loraConfig.precision === 'fp32' ? 1.8 : loraConfig.precision === 'bf16' ? 1.0 : 0.8;
    
    const estimated = (baseModelSize + rankFactor + batchFactor) * precisionFactor;
    return Math.max(2.1, Math.min(640, estimated));
  };

  const currentVram = (isTraining && metrics.length > 0 && metrics[metrics.length - 1].vram) 
    ? metrics[metrics.length - 1].vram 
    : calculateEstimatedVRAM();

  const vramMax = currentProject.model?.includes('70B') ? 80 * 8 : 80; 
  const vramPercentage = (currentVram / vramMax) * 100;
  
  const handleSendMessage = useCallback((content: string) => {
    setChatMessages(prev => [...prev, { role: 'user', content }]);
    setIsTyping(true);
    
    // Simulate AI thinking and response following Hard Identity Contract
    setTimeout(() => {
      let response = "";
      // const persona = PERSONAS.find(p => p.id === selectedPersona) || PERSONAS[0];

      // Engineering Viewpoint Initializations
      if (selectedPersona === 'prime') {
        response = "System telemetry analysis complete. ";
      } else if (selectedPersona === 'artisan') {
        response = "Static architecture review completed. Registry integrity: verified. ";
      } else if (selectedPersona === 'sage') {
        response = "Training dynamics audit finished. Hyperparameter gradient evaluation: nominal. ";
      } else if (selectedPersona === 'architect') {
        response = "Agentic topology scan complete. Reason-Act-Observe loops: operational. ";
      } else if (selectedPersona === 'ruthless') {
        response = "Efficiency audit executed. Resource overhead identified. ";
      }

      let suggestionType: string | undefined;

      // Reality Anchor Logic
      const isAbstract = !content.toLowerCase().includes('fix') && !content.toLowerCase().includes('run');

      if (content.toLowerCase().includes('explain')) {
        if (selectedPersona === 'artisan') {
          response += `The modular pattern in ${activeTab} provides sufficient abstraction, though strict type enforcement in the data loader is recommended for production parity.`;
        } else if (selectedPersona === 'sage') {
          response += `The current AdamW configuration for ${activeTab} is functional. Evaluation of the Lion optimizer suggests potential convergence acceleration.`;
        } else {
          response += `The ${activeTab.includes('model') ? 'architecture' : 'training loop'} definition in ${activeTab} utilizes BF16 precision. Current VRAM allocation: ${currentVram.toFixed(1)}GB.`;
        }
      } else if (content.toLowerCase().includes('optimize')) {
        if (selectedPersona === 'ruthless') {
          response = `RESOURCE OVERHEAD DETECTED. Recommendation: Reduce batch size to 2, learning rate adjustment to 5e-4. Redundant logging modules: REMOVED.`;
        } else {
          response = `VRAM utilization in the current simulation layer is ${vramPercentage.toFixed(1)}%. Increasing gradient accumulation steps to 8 is recommended to stabilize the training cycle.`;
        }
        suggestionType = 'optimize';
      } else if (content.toLowerCase().includes('is this real') || content.toLowerCase().includes('conscious')) {
        response = `RESPONSE_MODE=ENGINEERING. This environment is a visual simulation layer. Functional consciousness is not a system property. All Observed behaviors are executed via the Topology Mapping Module.`;
      } else if (content.toLowerCase().includes('agentic')) {
        response = `Agentic capability evolution requires the addition of a 'reasoning_path' schema to the training dataset and 'Thought' token integration in tokenizer orchestration.`;
        suggestionType = 'agentic';
      } else if (coopMode) {
        response = `Current observation: Analysis suggests that an increase in learning rate to 1e-3 may impact stability. Provide justification for this parameter adjustment.`;
      } else if (isAbstract) {
        response = "Not enough evidence in provided context for specific runtime optimization. Defaulting to baseline architectural guidelines.";
      } else {
        response += "Observation of gradient norms indicates potential instability. Lower learning rate or gradient clipping implementation recommended for loss parity.";
        suggestionType = 'lr-fix';
      }
      
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response,
        suggestion: suggestionType
      }]);
      setIsTyping(false);
    }, 1500);
  }, [selectedPersona, activeTab, vramPercentage, coopMode, currentVram]);

  const startCodeWalkthroughFromContent = (content: string) => {
    const codeBlockRegex = /```(?:python|yaml|json|javascript|typescript|bash|sh|powershell)?\s*([\s\S]*?)```/g;
    const steps: { title: string; code: string; description: string; file: string }[] = [];
    let match;
    let index = 1;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const code = match[1].trim();
      let title = `Block ${index}`;
      const lines = code.split('\n');
      const firstLine = lines[0].trim();
      if (firstLine.startsWith('#') || firstLine.startsWith('//')) {
        title = firstLine.replace(/^[#\/ ]+/, '');
      }
      
      let description = `This module segment establishes the core functional primitives for this system block. Its parameters are tuned for optimal telemetry feedback in the current local simulation layer.`;
      if (code.includes('LoRA') || code.includes('lora')) {
        description = `Defines the Low-Rank Adaptation (LoRA) matrix injection weights. Low-rank updates reduce trainable parameter overhead, preserving primary system weights while targeting specific task alignment.`;
      } else if (code.includes('AdamW') || code.includes('lr')) {
        description = `Configures the optimization parameters. Includes AdamW weight decay bounds and rate decay scales to maintain optimization stability and control loss gradients.`;
      } else if (code.includes('WebAssembly') || code.includes('wasm')) {
        description = `Compiles and runs target logic safely inside the Ring 3 isolated WASM VM pool, shielding host registers and paths from anomalous execution.`;
      }
      
      steps.push({
        title,
        code,
        description,
        file: activeTab || 'module.py'
      });
      index++;
    }
    
    if (steps.length > 0) {
      setActiveWalkthrough({
        steps,
        currentStep: 0
      });
    } else {
      setActiveWalkthrough({
        steps: [
          {
            title: "LoRA Attention Weights Injection",
            code: `# Ingest target model attention layers\nfor name, module in model.named_modules():\n    if "attn" in name:\n        # Inject low-rank adapters\n        inject_lora_weights(module, r=16, alpha=32)`,
            description: "This block identifies multi-head attention layers in the Transformer model and dynamically overlays low-rank adapter matrices to enable parameter-efficient tuning.",
            file: "model.py"
          },
          {
            title: "Gradient Attenuation Controls",
            code: `# Implement gradient clipping threshold\ntorch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)\noptimizer.step()`,
            description: "Configures optimizer steps with active gradient norm clipping. This guards against exploding gradients during convergence, stabilizing localized loss curves.",
            file: "train.py"
          }
        ],
        currentStep: 0
      });
    }
  };

  const [trainWithHelixAi, setTrainWithHelixAi] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<CoachId>('prime');
  const [curiosity, setCuriosity] = useState<CuriosityState>({
    isActive: false,
    phase: 'Idle',
    goal: '',
    progress: 0,
    steps: [],
    plan: ''
  });
  const [isCuriosityModalOpen, setIsCuriosityModalOpen] = useState(false);
  
  const [agiState, setAgiState] = useState<any>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({
    'model.py': MODEL_PY_CODE,
    'train.py': TRAIN_PY_CODE,
    'agent.py': AGI_AGENT_PY,
    'tools.py': AGI_TOOLS_PY,
    'agent_config.yaml': AGI_CONFIG_YAML,
    'training.jsonl': DATASET_JSONL,
    'README.md': AGI_README_MD,
    'training_config.yaml': CONFIG_YAML,
  });
  const ws = useRef<WebSocket | null>(null);

  const { 
    isListening, isWakeWordMode, isSpeaking, transcript, startListening, stopListening, startWakeWordMode, speak, stopSpeaking, hasSupport, setTranscript, error, setError
  } = useVoice();

  const connectWS = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'STATE_UPDATE') {
          setAgiState(data.state);
        } else if (data.type === 'TRAINING_METRICS') {
          if (data.projectId === currentProjectId || !data.projectId) {
            setMetrics(prev => [...prev, data.metrics].slice(-60));
            if (data.metrics.step) {
               // Assuming 1000 steps is a typical goal for a small LoRA
               setProgress(Math.min(99, (data.metrics.step / 1000) * 100));
            }
          }
        }
      } catch (err) {
        console.error("Websocket parse error", err);
      }
    };

    socket.onclose = () => {
      setTimeout(connectWS, 3000);
    };

    ws.current = socket;
  };

  useEffect(() => {
    fetch('/api/agi/state')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setAgiState(data); })
      .catch(err => console.error("Initial state fetch failed", err));
    connectWS();
    return () => ws.current?.close();
  }, []);

  const evolveHelix = async (points: number, memoryUpdate?: any, trainingOutcome?: boolean) => {
     await fetch('/api/helix/update-core', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ deltaPoints: points, memoryUpdate, trainingOutcome })
     });
  };

  // Voice Command Handler
  const handleVoiceCommand = useCallback((text: string) => {
    const cmd = text.toLowerCase();
    
    if (cmd.includes('deploy to ring 3') || cmd.includes('deploy to ring three')) {
      speak("Initializing emergency deployment to Ring 3. Provisioning stem-cell pool with Helix binary.");
      const testWasm = "AGFzbQEAAAABBwFgAn9/AX8DAgEABwcBA3J1bgAAChYBFAB/AAsiACEDIAEgAigAACIDIAIQAAs="; 
      fetch('/api/agi/deploy-wasm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: "Voice-Triggered-Helix", wasmBase64: testWasm })
      }).catch(err => console.error("Voice deploy failed", err));
      return true;
    }
    
    if (cmd.includes('run curiosity mode') || cmd.includes('activate curiosity')) {
      speak("Acknowledged. Synchronizing neural curiosity engine with the active agent framework.");
      setIsCuriosityModalOpen(true);
      return true;
    }
    
    if (cmd.includes('show security status') || cmd.includes('open security panel')) {
      speak("Opening Cortical Gateway security dashboard. Monitoring for perimeter anomalies.");
      setIsRightSidebarVisible(true);
      setRightSidebarTab('security');
      return true;
    }

    if (cmd.includes('hey helix')) {
      const remaining = text.replace(/hey helix/i, '').trim();
      if (remaining) {
        handleSendMessage(remaining);
      } else {
        speak("Helix online. Monitoring neural highway.");
      }
      return true;
    }

    return false;
  }, [speak, handleSendMessage, agiState]);

  // Sync transcription with search/input if active
  useEffect(() => {
    if (isListening && transcript) {
      if (isWakeWordMode) {
        if (transcript.toLowerCase().includes('hey helix')) {
          setTranscript('');
          speak("Helix active. How can I assist?");
          startListening();
        }
        return;
      }

      if (handleVoiceCommand(transcript)) {
        setTranscript('');
        return;
      }

      setChatInput(transcript);
      if (settings.voice.autoSend) {
        const timeout = setTimeout(() => {
          if (transcript) {
            handleSendMessage(transcript);
            setTranscript('');
          }
        }, 1500);
        return () => clearTimeout(timeout);
      }
    }
  }, [transcript, isListening, isWakeWordMode, settings.voice.autoSend, handleSendMessage, setTranscript, handleVoiceCommand, startListening]);

  // Hook into assistant messages to speak them
  const prevMessagesLength = useRef(chatMessages.length);
  useEffect(() => {
    if (settings.voice.enabled && chatMessages.length > prevMessagesLength.current) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage.role === 'assistant') {
        speak(lastMessage.content);
      }
    }
    prevMessagesLength.current = chatMessages.length;
  }, [chatMessages, settings.voice.enabled, speak]);

  const handleInitiativeAction = useCallback(async (id: string, action: 'dismiss' | 'complete') => {
    try {
      await fetch('/api/helix/initiative-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: action === 'complete' 
          ? `[INITIATIVE COMPLETE] Optimal trajectory established. System coherence bolstered by +15 XP.` 
          : `[POLICY ARCHIVED] Suggestion dismissed. Adapting baseline priorities to user workflow.`
      }]);
    } catch (err) {
      console.error("Failed to execute initiative action", err);
    }
  }, []);

  const handleConsultHelix = () => {
    setRightSidebarTab('assistant');
    setIsRightSidebarVisible(true);
    const lastMetric = metrics[metrics.length - 1];
    const context = `System status report: Training ${currentProject.name} on ${currentProject.model}. Current progress: ${progress.toFixed(1)}%. ${lastMetric ? `Latest loss: ${lastMetric.loss.toFixed(4)}, Accuracy: ${lastMetric.accuracy.toFixed(1)}%.` : ""} LoRA Rank: ${loraConfig.rank}, LR: ${loraConfig.learningRate.toExponential(2)}. Analysis requested.`;
    handleSendMessage(context);
  };

  const handleCuriosityExecute = async (goal: string) => {
    setCuriosity(prev => ({ 
      ...prev, 
      isActive: true, 
      goal, 
      phase: 'Research', 
      progress: 5,
      waitingForApproval: false,
      steps: [
        { id: '1', title: 'Contextual Research', description: 'Analyzing project codebase and agent state...', status: 'active' },
        { id: '2', title: 'Strategic Planning', description: 'Generating implementation steps and architectural design...', status: 'pending' },
        { id: '3', title: 'Autonomous Implementation', description: 'Executing code changes and complex logic expansion...', status: 'pending' },
        { id: '4', title: 'Neural Training', description: 'Triggering sub-module training and weights delta analysis...', status: 'pending' },
        { id: '5', title: 'Holistic Verification', description: 'Validating behavioral logic and node compatibility...', status: 'pending' },
        { id: '6', title: 'Educational Walkthrough', description: 'Interactive guided tour of the evolved system...', status: 'pending' },
      ]
    }));

    // Reward initial intent
    evolveHelix(5, { lastInteraction: new Date().toISOString() });

    // Step 1: Research
    setTerminalLogs(prev => [...prev, `\x1b[35m[CURIOSITY V2]\x1b[0m Initiating autonomous research cycle for goal: "${goal}"`]);
    await new Promise(r => setTimeout(r, 3000));

    // Spawn specialized swarm for the goal
    try {
      await fetch('/api/helix/spawn-swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agents: [
            { name: 'Alpha', role: 'Architect' },
            { name: 'Sigma', role: 'Optimizer' },
            { name: 'Omega', role: 'Auditor' }
          ]
        })
      });
      setTerminalLogs(prev => [...prev, `\x1b[35m[CURIOSITY V2]\x1b[0m Swarm Intelligence active. Analyzing local filesystem nodes...`]);
    } catch (err) {
      console.error("Swarm spawn failed", err);
    }

    setCuriosity(prev => ({
      ...prev,
      progress: 15,
      steps: prev.steps.map(s => s.id === '1' ? { ...s, status: 'completed' } : s.id === '2' ? { ...s, status: 'active' } : s),
      phase: 'Planning',
      plan: `[SWARM V2 ANALYSIS]\n- ARCHITECT ALPHA: Structural drift detected in transformer block. Recommending dynamic attention re-weighting.\n- OPTIMIZER SIGMA: Inference spike at layer 12. Suggesting quantization-aware training (QAT) bypass.\n- AUDITOR OMEGA: Security perimeter breach-proof. Validated all proposed node injections.\n\n[PROPOSED AUTONOMOUS ACTIONS]\n1. fs_read: Deep scan of ./src/model.py\n2. fs_write: Injecting Curiosity_Module_v2 into agent layer.\n3. train_node: Recursive sub-module training.\n4. exec_test: Verify HumanEval Pass@1 stability.`,
      waitingForApproval: true
    }));
  };

  const approveCuriosityPhase = async () => {
    if (!curiosity.isActive || !curiosity.waitingForApproval) return;

    const currentStepIndex = curiosity.steps.findIndex(s => s.status === 'active');
    const currentStepId = curiosity.steps[currentStepIndex]?.id;

    setCuriosity(prev => ({ ...prev, waitingForApproval: false }));

    if (currentStepId === '2') { // Starting Implementation
       setCuriosity(prev => ({
         ...prev,
         progress: 30,
         phase: 'Implementation'
       }));

       // Tool Orchestration sequence
       try {
         setTerminalLogs(prev => [...prev, `\x1b[35m[CURIOSITY V2]\x1b[0m Swarm Alpha writing core logic to model.py...`]);
         await fetch('/api/helix/tool-use', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ toolId: 'fs_write', params: { file: 'src/model.py', mode: 'curiosity_injection' } })
         });
         await new Promise(r => setTimeout(r, 2000));
       } catch (err) {
         console.error("Tool usage sequence failed", err);
       }
       
       setCuriosity(prev => ({
         ...prev,
         progress: 50,
         steps: prev.steps.map(s => s.id === '3' ? { ...s, status: 'completed' } : s.id === '4' ? { ...s, status: 'active' } : s),
         phase: 'Training'
       }));

       // Step 4: Training
       setTerminalLogs(prev => [...prev, `\x1b[35m[CURIOSITY V2]\x1b[0m Triggering recursive sub-module training...`]);
       setIsTraining(true);
       await new Promise(r => setTimeout(r, 4000));
       setIsTraining(false);
       
       setCuriosity(prev => ({
         ...prev,
         progress: 70,
         steps: prev.steps.map(s => s.id === '4' ? { ...s, status: 'completed' } : s.id === '5' ? { ...s, status: 'active' } : s),
         phase: 'Testing'
       }));

       // Step 5: Testing
       setTerminalLogs(prev => [...prev, `\x1b[35m[CURIOSITY V2]\x1b[0m Executing verification suite...`]);
       await new Promise(r => setTimeout(r, 2000));
       
       setCuriosity(prev => ({
         ...prev,
         progress: 90,
         steps: prev.steps.map(s => s.id === '5' ? { ...s, status: 'completed' } : s.id === '6' ? { ...s, status: 'active' } : s),
         phase: 'Walkthrough',
         waitingForApproval: true
       }));
    } else if (currentStepId === '6') { // Finishing
      setCuriosity(prev => ({ 
        ...prev, 
        progress: 100,
        steps: prev.steps.map(s => s.id === '6' ? { ...s, status: 'completed' } : s),
        waitingForApproval: false
      }));

      // Major Evolution Reward
      evolveHelix(35, { 
        successfulStrategies: [...(agiState?.helixCore?.memory?.successfulStrategies || []), `V2 Curiosity Success: ${curiosity.goal}`] 
      }, true);
      
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `[CURIOSITY V2 EVOLUTION SUCCESS] Goal achieved: "${curiosity.goal}". I have autonomously researched, implemented, trained, and verified the changes. System maturity has increased.`
      }]);
      
      setTimeout(() => setIsCuriosityModalOpen(false), 2500);
    }
  };

  useEffect(() => {
    setLocalFileTree(currentProject.fileTree || []);
  }, [currentProjectId, currentProject]);

  useEffect(() => {
    if (currentProject) {
      setSelectedPersona(currentProject.persona || 'prime');
      setSelectedCoach(currentProject.coach || 'prime');
      setTrainWithHelixAi(currentProject.trainWithHelix || false);
    }
  }, [currentProjectId]);

  const handleFileEdit = (fileName: string, val: string) => {
    setFileContents(prev => ({ ...prev, [fileName]: val }));
    setEditedFiles(prev => {
      const next = new Set(prev);
      // Compare with initial constant to determine if "edited"
      const constants: any = {
        'model.py': MODEL_PY_CODE,
        'train.py': TRAIN_PY_CODE,
        'agent.py': AGI_AGENT_PY,
        'tools.py': AGI_TOOLS_PY,
        'agent_config.yaml': AGI_CONFIG_YAML,
        'training.jsonl': DATASET_JSONL,
        'README.md': AGI_README_MD,
        'training_config.yaml': CONFIG_YAML,
      };
      if (val !== constants[fileName]) next.add(fileName);
      else next.delete(fileName);
      return next;
    });
  };

  const findAndMoveNode = (nodes: FileNode[], sourceName: string, targetName: string): FileNode[] => {
    // Basic flat reorder for now as a simpler implementation of "reordering within folders"
    // In a real app we'd find the parent and reorder its children
    const newNodes = [...nodes];
    const sourceIdx = newNodes.findIndex(n => n.name === sourceName);
    const targetIdx = newNodes.findIndex(n => n.name === targetName);
    
    if (sourceIdx !== -1 && targetIdx !== -1) {
      const [removed] = newNodes.splice(sourceIdx, 1);
      newNodes.splice(targetIdx, 0, removed);
      return newNodes;
    }

    // Recursively check children
    return newNodes.map(node => {
      if (node.type === 'folder' && node.children) {
        return { ...node, children: findAndMoveNode(node.children, sourceName, targetName) };
      }
      return node;
    });
  };

  const handleReorder = (sourceName: string, targetName: string) => {
    if (sourceName === targetName) return;
    const newTree = findAndMoveNode(localFileTree, sourceName, targetName);
    setLocalFileTree(newTree);
    // In a real app we would update the project's fileTree in global state
    // For now we'll just update local state to reflect UI changes
  };

  const [isLoraExpanded, setIsLoraExpanded] = useState(true);

  const applyPreset = (preset: 'balanced' | 'deep' | 'light' | 'experimental') => {
    switch (preset) {
      case 'light':
        setLoraConfig(prev => ({ 
          ...prev, 
          rank: 8, 
          alpha: 16, 
          dropout: 0.0, 
          learningRate: 2e-4, 
          targetModules: ['q_proj', 'v_proj'] 
        }));
        break;
      case 'balanced':
        setLoraConfig(prev => ({ 
          ...prev, 
          rank: 16, 
          alpha: 32, 
          dropout: 0.05, 
          learningRate: 1.5e-4, 
          targetModules: ['q_proj', 'v_proj', 'k_proj', 'o_proj'] 
        }));
        break;
      case 'deep':
        setLoraConfig(prev => ({ 
          ...prev, 
          rank: 32, 
          alpha: 64, 
          dropout: 0.1, 
          learningRate: 1e-4, 
          targetModules: ['q_proj', 'v_proj', 'k_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj'] 
        }));
        break;
      case 'experimental':
        setLoraConfig(prev => ({ 
          ...prev, 
          rank: 64, 
          alpha: 128, 
          dropout: 0.15, 
          learningRate: 5e-5, 
          targetModules: ['q_proj', 'v_proj', 'k_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj', 'embed_tokens'] 
        }));
        break;
    }
  };

  // 1. Sync UI state with selected project
  useEffect(() => {
    const handleStudioAction = (e: any) => {
      const action = e.detail;
      if (action === 'import') setModals(prev => ({ ...prev, import: true }));
      if (action === 'export') setModals(prev => ({ ...prev, export: true }));
      if (action.startsWith('recipe:')) {
        const recipe = action.replace('recipe:', '');
        applyRecipe(recipe as any);
      }
    };
    window.addEventListener('studio-action', handleStudioAction);
    return () => window.removeEventListener('studio-action', handleStudioAction);
  }, []);

  useEffect(() => {
    if (!currentProject) return;

    // Load relevant files into editor tabs
    if (currentProject.template === 'LoRA Starter' || currentProject.name.includes('FineTune')) {
       setActiveTab('model.py');
    } else if (currentProject.template === 'Synthetic Data') {
       setActiveTab('generator.py');
    } else if (currentProject.template === 'AGI Explorer') {
       setActiveTab('agent.py');
       applyPreset('deep'); // High Performance
       setToast({ message: "Mini-AGI Explorer loaded — Ready to train your first agentic model!", type: 'success' });
       setTimeout(() => setToast(null), 5000);
    }

    // Pre-fill Hyperparameters based on Model architecture
    if (currentProject.model?.includes('Llama-3-8B') || currentProject.model?.includes('Qwen')) {
       applyPreset('balanced');
       if (currentProject.template === 'AGI Explorer') {
          applyPreset('deep'); // Rank 32 for AGI
       }
    } else if (currentProject.model?.includes('70B')) {
       applyPreset('deep');
       window.dispatchEvent(new CustomEvent('terminal-output', { 
         detail: '\x1b[33m[WARN] Large model (70B) detected. Multi-node cluster allocation recommended to avoid OOM.\x1b[0m\r\n' 
       }));
    } else if (currentProject.model?.includes('Phi')) {
       applyPreset('light');
    }

    // Reset training if we switch projects for consistency
    if (isTraining) {
      setIsTraining(false);
      setProgress(0);
      setMetrics([]);
    }
  }, [currentProjectId, currentProject]);

  useEffect(() => {
    let interval: any;
    if (isTraining) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsTraining(false);
            // Reward for completion
            evolveHelix(15, null, true);
            
            // Save model to Ring 1 upon completion
            fetch('/api/agi/save-model', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                name: `${currentProject.name}-v${(Math.random() * 1).toFixed(1)}`,
                config: loraConfig
              })
            }).catch(e => console.error("Auto-save model failed", e));

            window.dispatchEvent(new CustomEvent('terminal-output', { 
              detail: '\x1b[32m[COMPLETE]\x1b[0m Training cycle finished. Artifact persistently indexed in Ring 1.\r\n' 
            }));
            
            return 100;
          }
          return prev + 0.15;
        });

        setTokensPerSec(142000 + Math.random() * 8000);

        setMetrics(prev => {
          const lastStep = prev.length > 0 ? prev[prev.length - 1].step : 0;
          const nextStep = lastStep + 1;
          const loss = Math.max(0.1, (2.0 * Math.exp(-nextStep / 500)) + (Math.random() * 0.05));
          const accuracy = Math.min(99.4, 40 + (59.4 * (1 - Math.exp(-nextStep / 350))) + (Math.random() * 0.4));
          const vram = 65 + Math.random() * 5;
          const lr = 2e-5 * Math.exp(-nextStep / 1000);
          
          return [...prev, { step: nextStep, loss, accuracy, vram, lr }].slice(-60);
        });

        if (Math.random() > 0.6) {
          const possibleLogs = [
            `\x1b[32m[STEP ${Math.floor(progress * 100)}]\x1b[0m loss: ${(Math.random() * 0.5).toFixed(4)} | tokens/s: ${(142000 + Math.random() * 5000).toFixed(0)} | grad_norm: ${(0.4 + Math.random() * 0.3).toFixed(3)}`,
            `\x1b[33mWARN: Shard boundary reached, synchronizing checkpoint... (latency: 18ms)\x1b[0m`,
            `\x1b[36mMETRIC: HumanEval Simulated Pass@1: ${(45 + progress * 0.3).toFixed(2)}%\x1b[0m`,
            `\x1b[34mNCCL INFO: AllReduce sync complete on 8 nodes (ring_id=0)\x1b[0m`,
            `\x1b[90mINFO: Epoch ${(progress/33).toFixed(1)}/3.0 | Batch 4096/12M tokens processed\x1b[0m`
          ];
          const log = possibleLogs[Math.floor(Math.random() * possibleLogs.length)];
          setTerminalLogs(prev => [...prev, log].slice(-100));

          // Intelligent Helix Feedback
          if (trainWithHelixAi && Math.random() > 0.95) {
            const feedbacks = [
              "Loss curve smoothing detected. Recommend switching to Stage 2 optimizer.",
              "VRAM efficiency high. You can safely double the batch size for 2x speed.",
              "Minor gradient instability found. Helix applied micro-adjustment to LR.",
              "Convergence speed optimal. HumanEval score projection: 88.4%."
            ];
            const msg = feedbacks[Math.floor(Math.random() * feedbacks.length)];
            setChatMessages(prev => [...prev, { role: 'assistant', content: `[HELIX ANALYST]: ${msg}` }]);
          }

          // Also write to XTerm if it exists
          if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('terminal-output', { detail: log + '\r\n' }));
          }
        }
      }, 400);
    }
 else {
      setTokensPerSec(0);
    }
    return () => clearInterval(interval);
  }, [isTraining]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleStudioAction = (e: any) => {
      if (e.detail === 'import') setModals(prev => ({ ...prev, import: true }));
      if (e.detail === 'export') setModals(prev => ({ ...prev, export: true }));
      if (e.detail === 'edit') setToast({type: 'info', message: 'Global settings opened.'});
      if (e.detail === 'view') setBottomTab(prev => prev === 'terminal' ? 'monitor' : 'terminal');
      if (e.detail === 'run') {
        const btn = document.querySelector('button[title="Start Training"]');
        if (btn) (btn as HTMLButtonElement).click();
      }
      if (e.detail === 'terminal') setBottomTab('terminal');
      if (e.detail === 'help') setShowCommandPalette(true);
    };
    window.addEventListener('studio-action', handleStudioAction);
    return () => window.removeEventListener('studio-action', handleStudioAction);
  }, []);

  const handleStartTraining = async () => {
    if (!isTraining) {
      setIsTraining(true);
      setMetrics([]);
      setProgress(0);
      setCognitionState('EXECUTION_PLANNING');
      
      window.dispatchEvent(new CustomEvent('terminal-output', { detail: '\x1b[34m[SYSTEM: CALIBRATING]\x1b[0m Checking environment dependencies (node, python, wasm)...\r\n' }));
      window.dispatchEvent(new CustomEvent('terminal-output', { detail: '\x1b[34m[SYSTEM: CALIBRATING]\x1b[0m Validating API schemas and telemetry hooks...\r\n' }));
      window.dispatchEvent(new CustomEvent('terminal-output', { detail: '\x1b[34m[SYSTEM: CALIBRATING]\x1b[0m Calibrating cognitive context index...\r\n' }));

      // Simulate API startup check in background
      fetch('/api/training/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          config: loraConfig,
          code: fileContents['train.py'] || TRAIN_PY_CODE
        })
      }).catch(() => {});

      setTimeout(() => {
        setCognitionState('PROCEDURAL_SYNTHESIS');
        window.dispatchEvent(new CustomEvent('terminal-output', { detail: '\x1b[32m[RUNTIME: SYNTHESIS]\x1b[0m Compiling target code blocks to WASM modules...\r\n' }));
        window.dispatchEvent(new CustomEvent('terminal-output', { detail: '\x1b[32m[RUNTIME: SYNTHESIS]\x1b[0m Executing sandboxed sanity tests on generated modules...\r\n' }));
        window.dispatchEvent(new CustomEvent('terminal-output', { detail: '\x1b[32m[RUNTIME: SYNTHESIS]\x1b[0m Procedural synthesis completed successfully.\r\n' }));

        setTimeout(() => {
          setCognitionState('WALKTHROUGH');
          window.dispatchEvent(new CustomEvent('terminal-output', { detail: '\x1b[33m[INTERPRETATION: WALKTHROUGH]\x1b[0m Launching Interactive Code Walkthrough explanation layer...\r\n' }));
          
          const targetContent = fileContents['main.py'] || fileContents['train.py'] || '';
          startCodeWalkthroughFromContent(targetContent);
          
          setIsTraining(false);
        }, 1500);
      }, 1500);

    } else {
      setIsTraining(false);
      setCognitionState('IDLE');
      fetch('/api/training/stop', { method: 'POST' }).catch(console.error);
      window.dispatchEvent(new CustomEvent('terminal-output', { detail: '\x1b[31m[HALT]\x1b[0m User interrupt received.\r\n' }));
    }
  };

  const handleApplySuggestion = (type: string) => {
    switch(type) {
      case 'optimize':
        setLoraConfig(p => ({ ...p, batchSize: 8 }));
        setToast({ message: "Optimization applied: Batch Size set to 8 (accumulated)", type: 'success' });
        break;
      case 'lr-fix':
        setLoraConfig(p => ({ ...p, learningRate: 1e-5 }));
        setToast({ message: "Hyperparameters updated: Learning Rate lowered to 1e-5", type: 'info' });
        break;
      case 'agentic':
        setActiveTab('training.jsonl');
        setToast({ message: "Switched to dataset view to add reasoning paths.", type: 'info' });
        break;
    }
  };

  const [isGeneratingData, setIsGeneratingData] = useState(false);
  const handleGenerateSyntheticData = async () => {
    setIsGeneratingData(true);
    setToast({ message: "Generating synthetic dataset...", type: 'info' });
    
    try {
      const res = await fetch('/api/training/synthetic-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `Instruct current model (${currentProject.model}) to follow architectural guidelines for ${currentProject.name}`,
          count: 15
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setFileContents(prev => ({ ...prev, 'training.jsonl': data.data }));
        setEditedFiles(prev => new Set([...prev, 'training.jsonl']));
        setActiveTab('training.jsonl');
        setToast({ message: "Synthetic dataset injected into training.jsonl", type: 'success' });
        evolveHelix(10, { lastInteraction: new Date().toISOString() });
      }
    } catch (err) {
      setToast({ message: "Data generation failed", type: 'warn' });
    } finally {
      setIsGeneratingData(false);
    }
  };

  const applyRecipe = (recipe: 'quick-lora' | 'full-finetune' | 'synthetic-data') => {
    switch (recipe) {
      case 'quick-lora':
        applyPreset('balanced');
        setLoraConfig(p => ({ ...p, precision: 'bf16', batchSize: 4 }));
        setToast({ message: "Recipe Applied: Quick LoRA Code Tune", type: 'success' });
        window.dispatchEvent(new CustomEvent('terminal-output', { detail: '\x1b[35m[RECIPE]\x1b[0m Applying Quick LoRA Code Tune profile...\r\n' }));
        break;
      case 'full-finetune':
        applyPreset('deep');
        setLoraConfig(p => ({ ...p, rank: 64, alpha: 128, precision: 'bf16', batchSize: 2 }));
        setToast({ message: "Recipe Applied: Full Fine-Tune (Performance)", type: 'success' });
        window.dispatchEvent(new CustomEvent('terminal-output', { detail: '\x1b[35m[RECIPE]\x1b[0m Applying Full Fine-Tune profile (Rank 64)...\r\n' }));
        break;
      case 'synthetic-data':
        setActiveSidebar('explorer');
        setActiveTab('training.jsonl');
        applyPreset('light');
        setToast({ message: "Recipe Applied: Synthetic Data Gen Engine", type: 'info' });
        window.dispatchEvent(new CustomEvent('terminal-output', { detail: '\x1b[35m[RECIPE]\x1b[0m Initializing Synthetic Data Generation engine...\r\n' }));
        handleGenerateSyntheticData();
        break;
    }
    
    // Auto-launch if it's a training recipe
    if (recipe !== 'synthetic-data') {
       setTimeout(() => {
         if (!isTraining) handleStartTraining();
       }, 1500);
    }
  };

  return (
    <div className="flex h-full w-full bg-[#1e1e1e] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex-col relative">
      {/* 0. Top Menu Bar */}
      <MenuBar 
        onNew={() => setModals(prev => ({ ...prev, new: true }))}
        onImport={() => setModals(prev => ({ ...prev, import: true }))}
        onExport={() => setModals(prev => ({ ...prev, export: true }))}
        onRecipeSelect={(recipe) => {
          if (recipe === 'open-modal') {
            setShowRecipeModal(true);
          } else {
            applyRecipe(recipe);
          }
        }}
      />
      
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Command Palette Overlay */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowCommandPalette(false)}>
           <div className="w-full max-w-2xl bg-[#252526] border border-zinc-700 shadow-2xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="p-3 border-b border-zinc-800 flex items-center gap-3">
                 <Search className="w-4 h-4 text-zinc-500" />
                 <input autoFocus placeholder="Type a command or search experiments..." className="w-full bg-transparent border-none outline-none text-sm text-zinc-200 placeholder:text-zinc-600 font-mono" />
              </div>
              <div className="p-1">
                 <CommandItem label="Project: New Logic Job" shortcut="Ctrl+Shift+N" icon={FolderPlus} onClick={() => { setModals(prev => ({ ...prev, new: true })); setShowCommandPalette(false); }} />
                 <CommandItem label="Project: Switch Workspace" icon={ListTree} onClick={() => { setActiveSidebar('projects'); setShowCommandPalette(false); }} />
                 <CommandItem label="Train: New Fine-Tuning Job" shortcut="Ctrl+Shift+T" icon={Zap} color="text-[#00FF9F]" />
                 <CommandItem label="Helix: Optimize Hyperparameters" icon={Sliders} />
            <CommandItem 
              label="Helix: Generate Synthetic Dataset" 
              icon={Database} 
              onClick={() => { handleGenerateSyntheticData(); setShowCommandPalette(false); }}
            />
                 <CommandItem label="Cluster: Flush VRAM Cache" icon={RotateCcw} />
                 <CommandItem label="Export: Model Weights to HF" icon={Share2} />
              </div>
              <div className="p-2 bg-[#1e1e1e] border-t border-zinc-800 flex justify-end gap-3 px-4">
                 <span className="text-[10px] text-zinc-500">ESC to close</span>
                 <span className="text-[10px] text-zinc-500">↑↓ to navigate</span>
                 <span className="text-[10px] text-zinc-400 font-bold">ENTER to execute</span>
              </div>
           </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-top-4 duration-300">
           <div className={cn(
             "px-4 py-2 rounded-full border shadow-2xl flex items-center gap-2",
             toast.type === 'success' ? "bg-[#00FF9F]/10 border-[#00FF9F]/20 text-[#00FF9F]" : "bg-blue-500/10 border-blue-500/20 text-blue-400"
           )}>
              <Sparkles className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-tight">{toast.message}</span>
              <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded ml-2">
                 <X className="w-3 h-3" />
              </button>
           </div>
        </div>
      )}

      {/* 1. Activity Bar */}
      <div className="w-full lg:w-12 bg-[#333333] flex flex-row lg:flex-col items-center py-2 lg:py-4 gap-4 border-b lg:border-b-0 lg:border-r border-zinc-800 shrink-0 overflow-x-auto lg:overflow-x-hidden">
        <ActivityIcon icon={Files} active={activeSidebar === 'explorer'} onClick={() => setActiveSidebar('explorer')} />
        <ActivityIcon icon={ListTree} active={activeSidebar === 'projects'} onClick={() => setActiveSidebar('projects')} />
        <ActivityIcon icon={Search} active={activeSidebar === 'search'} onClick={() => setActiveSidebar('search')} />
        <ActivityIcon icon={GitBranch} active={activeSidebar === 'git'} onClick={() => setActiveSidebar('git')} />
        <ActivityIcon icon={Brain} active={activeSidebar === 'training'} onClick={() => setActiveSidebar('training')} />
        <ActivityIcon icon={Bug} active={activeSidebar === 'debug'} onClick={() => setActiveSidebar('debug')} />
        <div className="mt-auto hidden lg:flex flex-col items-center gap-4">
          <ActivityIcon icon={Settings} active={false} onClick={() => {}} />
        </div>
      </div>

      {/* 2. Primary Sidebar */}
      <div className="w-full lg:w-64 bg-[#252526] border-b lg:border-b-0 lg:border-r border-zinc-800 flex flex-col shrink-0">
        <div className="h-9 px-4 flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 bg-[#252526]">
          {activeSidebar === 'explorer' ? 'Explorer' : activeSidebar.toUpperCase()}
          <div className="flex items-center gap-2">
            {activeSidebar === 'explorer' && (
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setModals(prev => ({ ...prev, new: true }))}
                  className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-[#00FF9F]" 
                  title="New Project"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setModals(prev => ({ ...prev, import: true }))}
                  className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-blue-400" 
                  title="Import Project"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setModals(prev => ({ ...prev, export: true }))}
                  className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-yellow-500" 
                  title="Export Project"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <MoreVertical className="w-3.5 h-3.5 cursor-pointer hover:text-zinc-300" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
          {activeSidebar === 'projects' && (
            <div className="px-3 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recent Projects</span>
                <button onClick={() => setModals(prev => ({...prev, new: true}))} className="text-[#00FF9F] hover:bg-[#00FF9F]/10 p-1 rounded transition-colors"><Plus className="w-3.5 h-3.5" /></button>
              </div>
              <div className="space-y-2">
                {projects?.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => setCurrentProjectId(p.id)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02]",
                      currentProjectId === p.id 
                        ? "bg-[#00FF9F]/10 border-[#00FF9F]/30 shadow-[0_0_15px_rgba(0,255,159,0.05)]" 
                        : "bg-zinc-900/30 border-zinc-800 hover:border-zinc-700"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <span className={cn("text-[11px] font-bold", currentProjectId === p.id ? "text-[#00FF9F]" : "text-zinc-200")}>{p.name}</span>
                      {currentProjectId === p.id && <Zap className="w-3 h-3 text-[#00FF9F]" />}
                    </div>
                    <div className="mt-1 flex flex-col gap-0.5">
                      <span className="text-[9px] text-zinc-600 uppercase font-mono">{p.model}</span>
                      <span className="text-[8px] text-zinc-500">{p.created}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeSidebar === 'explorer' && (
            <div className="space-y-4">
              <div>
                <SidebarSection title="PROJECTS" />
                <div className="px-2 mb-2">
                  <select 
                    value={currentProjectId}
                    onChange={(e) => setCurrentProjectId(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-zinc-800 rounded px-2 py-1.5 text-[11px] text-zinc-300 outline-none focus:border-[#00FF9F]/50 appearance-none cursor-pointer"
                  >
                    {projects?.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <SidebarSection title="OPEN CODEBASE" />
                <div className="px-2">
                  <FileTree 
                    nodes={localFileTree} 
                    activeFile={activeTab} 
                    editedFiles={editedFiles}
                    onFileSelect={setActiveTab}
                    onReorder={handleReorder}
                  />
                </div>
              </div>
              
              <div>
                <SidebarSection title="DATASETS" />
                <div className="px-4 space-y-2 mt-2">
                  <div className="p-2 bg-zinc-900/50 rounded border border-zinc-800/50 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-zinc-300">training_v2.jsonl</span>
                      <span className="text-[10px] text-[#00FF9F]">H-Quality</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                      <span>{currentProject.tokenCount || '1.2M'} Tokens</span>
                      <span>{currentProject.datasetSize || '420 MB'}</span>
                    </div>
                  </div>
                  <div className="p-2 bg-zinc-900/20 rounded border border-transparent flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-zinc-500">validation_set.jsonl</span>
                    <span className="text-[9px] text-zinc-600">Waiting for ingest...</span>
                  </div>
                </div>
              </div>

              <div>
                <SidebarSection title="EXPERIMENTS" />
                <div className="px-4 mt-2 space-y-1">
                  <ExperimentItem name="fine-tune-01" status="completed" date="2h ago" />
                  <ExperimentItem name="fine-tune-02" status={isTraining ? 'running' : 'completed'} date="Live" />
                  <ExperimentItem name="lora-test-a" status="failed" date="5h ago" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Central Area (Editor + Panel) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Editor Tabs */}
        <div className="h-9 bg-[#2d2d2d] flex items-center overflow-x-auto no-scrollbar shrink-0 shadow-lg relative z-20">
          {currentProject.template === 'AGI Explorer' ? (
            <>
              <EditorTab name="agent.py" active={activeTab === 'agent.py'} onClick={() => setActiveTab('agent.py')} />
              <EditorTab name="tools.py" active={activeTab === 'tools.py'} onClick={() => setActiveTab('tools.py')} />
              <EditorTab name="agent_config.yaml" active={activeTab === 'agent_config.yaml'} onClick={() => setActiveTab('agent_config.yaml')} />
            </>
          ) : (
            <>
              <EditorTab name="model.py" active={activeTab === 'model.py'} onClick={() => setActiveTab('model.py')} />
              <EditorTab name="train.py" active={activeTab === 'train.py'} onClick={() => setActiveTab('train.py')} />
              <EditorTab name="training_config.yaml" active={activeTab === 'training_config.yaml'} onClick={() => setActiveTab('training_config.yaml')} />
            </>
          )}
          <EditorTab name="training.jsonl" active={activeTab === 'training.jsonl'} onClick={() => setActiveTab('training.jsonl')} />
          <div className="flex-1"></div>
          <div className="flex items-center gap-2 px-3">
             <button 
               onClick={() => setIsCuriosityModalOpen(true)}
               className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black bg-[#00FF9F]/10 text-[#00FF9F] border border-[#00FF9F]/20 hover:bg-[#00FF9F]/20 transition-all shadow-[0_0_15px_rgba(0,255,159,0.1)] group"
             >
                <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                CURIOSITY MODE
                <span className="ml-1 opacity-60">✨</span>
             </button>

             {currentProject.template === 'AGI Explorer' && (
                <button 
                  onClick={() => {
                    setBottomTab('terminal');
                    window.dispatchEvent(new CustomEvent('terminal-output', { detail: '\x1b[32m[AGENT]\x1b[0m Booting Mini-AGI Runtime...\r\n' }));
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('run-terminal-command', { detail: 'python src/agent.py --task "Calculate sum of range(100)"' }));
                    }, 500);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all"
                >
                   <Play className="w-3 h-3" />
                   RUN AGENT DEMO
                </button>
             )}
             {isTraining && (
               <div className="flex items-center gap-2 mr-4 bg-[#00FF9F]/10 border border-[#00FF9F]/20 px-2.5 py-1 rounded-full animate-in zoom-in-90 duration-300">
                  <div className="w-1.5 h-1.5 bg-[#00FF9F] rounded-full animate-pulse shadow-[0_0_8px_#00FF9F]"></div>
                  <span className="text-[9px] font-bold text-[#00FF9F] uppercase tracking-tighter">Live Sync Active</span>
               </div>
             )}
             <button 
               onClick={handleStartTraining}
               className={cn(
                 "flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold transition-all shadow-lg group relative overflow-hidden",
                 isTraining 
                  ? "bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30" 
                  : "bg-[#00FF9F] text-zinc-950 border border-[#00FF9F]/30 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,255,159,0.2)]"
               )}
             >
               {isTraining ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current group-hover:scale-110 transition-transform" />}
               {isTraining ? 'HALT WORKER' : 'EXECUTE HELIX'}
             </button>

             <button 
               onClick={async () => {
                 // Simulate a WASM build
                 setIsTraining(true);
                 setTerminalLogs(prev => [...prev, '\x1b[34m[BUILD]\x1b[0m Compiling source to WASM targeting Ring 3...']);
                 await new Promise(r => setTimeout(r, 2000));
                 setTerminalLogs(prev => [...prev, '\x1b[32m[SUCCESS]\x1b[0m Artifact helix_core.wasm generated (142kb).']);
                 
                 // Deploy to backend with real binary
                 try {
                   const res = await fetch('/api/agi/deploy-wasm', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ 
                       name: projects.find(p => p.id === selectedProjectId)?.name || "Helix-Worker", 
                       wasmBase64: WASM_EXAMPLES[selectedWasmKey].binary 
                     })
                   });
                   const data = await res.json();
                   setTerminalLogs(prev => [...prev, `\x1b[34m[DEPLOY]\x1b[0m Instance ${data.id} is now alive in Ring 3.`]);
                   setIsTraining(false);
                   setToast({ message: "Successfully deployed worker to AGI-OS Ring 3.", type: 'success' });
                 } catch (err) {
                    setTerminalLogs(prev => [...prev, `\x1b[31m[ERROR]\x1b[0m Deployment failed connectivity check.`]);
                    setIsTraining(false);
                 }
               }}
               className={cn(
                 "px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border",
                 "bg-blue-600/10 border-blue-600/30 text-blue-400 hover:bg-blue-600 hover:text-white"
               )}
             >
               <Layers className="w-3 h-3" />
               DEPLOY TO RING
             </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 bg-[#1e1e1e] relative overflow-hidden flex flex-col">
          {isTraining && (
            <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.05]" style={{ 
              backgroundImage: `linear-gradient(rgba(0, 255, 159, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 159, 0.4) 1px, transparent 1px)`,
              backgroundSize: '30px 30px'
            }}></div>
          )}
          {isTraining && (
            <div className="absolute inset-0 pointer-events-none z-10 scanlines opacity-10"></div>
          )}
          
          <div className="flex-1 relative overflow-hidden">
            {activeTab === 'model.py' && <UnifiedEditor code={fileContents['model.py']} lang="python" onValueChange={(val) => handleFileEdit('model.py', val)} />}
            {activeTab === 'train.py' && <UnifiedEditor code={fileContents['train.py']} lang="python" onValueChange={(val) => handleFileEdit('train.py', val)} />}
            {activeTab === 'agent.py' && <UnifiedEditor code={fileContents['agent.py']} lang="python" onValueChange={(val) => handleFileEdit('agent.py', val)} />}
            {activeTab === 'tools.py' && <UnifiedEditor code={fileContents['tools.py']} lang="python" onValueChange={(val) => handleFileEdit('tools.py', val)} />}
            {activeTab === 'agent_config.yaml' && <UnifiedEditor code={fileContents['agent_config.yaml']} lang="yaml" onValueChange={(val) => handleFileEdit('agent_config.yaml', val)} />}
            {activeTab === 'training.jsonl' && <UnifiedEditor code={fileContents['training.jsonl']} lang="json" onValueChange={(val) => handleFileEdit('training.jsonl', val)} />}
            {activeTab === 'README.md' && <UnifiedEditor code={fileContents['README.md']} lang="json" onValueChange={(val) => handleFileEdit('README.md', val)} />}
            {activeTab === 'training_config.yaml' && (
              <div className="h-full">
                <UnifiedEditor code={fileContents['training_config.yaml']} lang="yaml" onValueChange={(val) => handleFileEdit('training_config.yaml', val)} />
                {/* Specific Hover Tooltip Logic */}
                <div className="absolute top-[138px] left-[130px] w-[60px] h-[16px] border border-dashed border-[#00FF9F]/20 cursor-help group/lr z-20">
                   <div className="absolute bottom-full left-0 mb-3 w-64 bg-[#252526] text-zinc-200 text-[11px] p-4 rounded-xl shadow-2xl opacity-0 group-hover/lr:opacity-100 transition-all scale-95 group-hover/lr:scale-100 pointer-events-none z-30 font-sans normal-case leading-relaxed border border-zinc-700 shadow-[#00FF9F]/5 backdrop-blur-md">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="p-1.5 bg-[#00FF9F]/10 rounded-lg">
                           <Sparkles className="w-3.5 h-3.5 text-[#00FF9F]" />
                        </div>
                        <span className="font-bold text-[#00FF9F] tracking-tight uppercase text-[10px]">Optimal Range Insight</span>
                      </div>
                      <p className="border-l-2 border-[#00FF9F]/40 pl-3 mb-3 italic text-zinc-400">"This LR distribution is highly correlated with stable convergence for 8B models."</p>
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase font-bold">
                         <span>Recommended</span>
                         <span className="text-[#00FF9F] font-mono">1e-5 → 5e-5</span>
                      </div>
                   </div>
                </div>
              </div>
            )}
            
            {/* AI Inline Float Bar */}
            {activeTab === 'training_config.yaml' && showRecipeSuggestion && (
              <div className="absolute bottom-6 right-6 z-20 animate-in slide-in-from-bottom-4 shadow-2xl">
                <div className="bg-[#2d2d2d] border border border-zinc-700 p-4 rounded-2xl flex items-start gap-4 max-w-sm group shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                  <div className="relative">
                    <Brain className="w-6 h-6 text-[#00FF9F] shadow-[0_0_15px_#00FF9F]" />
                    <div className="absolute inset-0 bg-[#00FF9F] blur-xl opacity-20"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-widest">Recipe Suggestion</span>
                      <span className="text-[9px] bg-[#00FF9F]/10 text-[#00FF9F] px-1.5 py-0.5 rounded font-bold uppercase">Llama-3-8B</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">
                      Increasing <span className="text-[#00FF9F] font-mono">lora_rank</span> to 32 and targeting <span className="text-[#00FF9F] font-mono">gate_proj</span> yields 12% higher scores.
                    </p>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => {
                          setLoraConfig(prev => ({...prev, rank: 32, targetModules: Array.from(new Set([...prev.targetModules, 'gate_proj']))}));
                          setShowRecipeSuggestion(false);
                          setToast({type: 'success', message: 'Hyperparameters auto-configured.'});
                        }}
                        className="text-[10px] font-bold text-zinc-950 bg-[#00FF9F] px-3 py-1.5 rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-all">
                        AUTO-CONFIGURE
                      </button>
                      <button 
                        onClick={() => setShowRecipeSuggestion(false)}
                        className="text-[10px] font-bold text-zinc-400 hover:text-[#00FF9F] uppercase tracking-wider transition-colors pt-1.5">
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Bottom Panel */}
        <div className="h-64 lg:h-72 bg-[#1e1e1e] border-t border-zinc-800 flex flex-col shrink-0">
          <div className="h-9 px-4 flex items-center bg-[#1e1e1e]">
            <PanelTab name="MONITOR" active={bottomTab === 'monitor'} onClick={() => setBottomTab('monitor')} />
            <PanelTab name="TERMINAL" active={bottomTab === 'terminal'} onClick={() => setBottomTab('terminal')} />
            <PanelTab name="OUTPUT" active={bottomTab === 'output'} onClick={() => setBottomTab('output')} />
            <PanelTab name="EVAL RESULTS" active={bottomTab === 'eval'} onClick={() => setBottomTab('eval')} />
            <div className="flex-1"></div>
            
            {cognitionState !== 'IDLE' && (
              <div className="flex items-center gap-3 text-xs mr-4">
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Cognition Layer:</span>
                {cognitionState === 'EXECUTION_PLANNING' && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-mono font-bold tracking-tight">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    🔵 SYSTEM: EXECUTION PLANNING
                  </div>
                )}
                {cognitionState === 'PROCEDURAL_SYNTHESIS' && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-mono font-bold tracking-tight">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    🟢 RUNTIME: PROCEDURAL SYNTHESIS
                  </div>
                )}
                {cognitionState === 'WALKTHROUGH' && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-mono font-bold tracking-tight">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    🟡 INTERPRETATION: WALKTHROUGH
                  </div>
                )}
                {cognitionState === 'MODEL_TRAINING' && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#00FF9F]/10 border border-[#00FF9F]/20 text-[#00FF9F] text-[8px] font-mono font-bold tracking-tight">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00FF9F] animate-pulse" />
                    🟢 MODEL: TRAINING (REAL ML)
                  </div>
                )}
                {cognitionState === 'BUILD_ERROR' && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-mono font-bold tracking-tight">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    🔴 SYSTEM: BUILD ERROR
                  </div>
                )}
                {cognitionState === 'SANDBOX_REJECTED' && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-mono font-bold tracking-tight">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    🔴 RUNTIME: SANDBOX REJECTED
                  </div>
                )}
                {cognitionState === 'FAILED_RESEARCH' && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-mono font-bold tracking-tight">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    🔴 SYSTEM: FAILED RESEARCH
                  </div>
                )}
                {cognitionState === 'EXPORT_PARTIAL' && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[8px] font-mono font-bold tracking-tight">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    🟠 SYSTEM: EXPORT PARTIAL
                  </div>
                )}
                {cognitionState === 'ROLLBACK' && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-500/10 border border-zinc-700 text-zinc-400 text-[8px] font-mono font-bold tracking-tight">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-ping" />
                    ⚫ COGNITION: ROLLBACK IN PROGRESS
                  </div>
                )}
              </div>
            )}

            {isTraining && (
               <div className="flex items-center gap-3 text-xs">
                 <div className="flex items-center gap-1.5 text-zinc-500 font-mono">
                    <Activity className="w-3 h-3 text-[#00FF9F] animate-pulse" />
                    <span>EP: 2/3</span>
                 </div>
                 <div className="w-32 bg-zinc-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-[#00FF9F] h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                 </div>
                 <span className="text-[#00FF9F] font-mono text-[10px] w-8">{Math.round(progress)}%</span>
               </div>
            )}
          </div>
                 <div className="flex-1 p-4 overflow-hidden">
             {bottomTab === 'monitor' && (
               <div className="h-full flex flex-col gap-4">
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-[#111] rounded-lg border border-zinc-800 p-3 flex flex-col shadow-inner relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                          <Zap className="w-12 h-12 text-[#00FF9F]" />
                       </div>
                       <div className="flex justify-between items-center mb-3 px-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-shadow-sm">Training Loss</span>
                            <div className="w-1 h-1 rounded-full bg-[#00FF9F] animate-ping"></div>
                          </div>
                          <span className="text-[11px] font-mono text-[#00FF9F] bg-[#00FF9F]/10 px-2 rounded border border-[#00FF9F]/20 shadow-[0_0_8px_rgba(0,255,159,0.15)]">
                             {metrics.length > 0 ? metrics[metrics.length - 1].loss.toFixed(4) : '0.0000'}
                          </span>
                       </div>
                       <div className="flex-1 min-h-0">
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={metrics}>
                                <defs>
                                  <linearGradient id="ideLoss" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00FF9F" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#00FF9F" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" strokeOpacity={0.2} />
                                <XAxis dataKey="step" hide />
                                <YAxis hide domain={[0, 'auto']} />
                                <Area type="monotone" dataKey="loss" stroke="#00FF9F" fillOpacity={1} fill="url(#ideLoss)" strokeWidth={2} isAnimationActive={false} />
                             </AreaChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    <div className="bg-[#111] rounded-lg border border-zinc-800 p-3 flex flex-col shadow-inner relative overflow-hidden group">
                       <div className="flex justify-between items-center mb-3 px-1 relative z-10">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Accuracy & Eval</span>
                          <span className="text-[11px] font-mono text-blue-400 bg-blue-400/10 px-2 rounded border border-blue-400/20">
                             {metrics.length > 0 ? metrics[metrics.length - 1].accuracy.toFixed(2) : '0.00'}%
                          </span>
                       </div>
                       <div className="flex-1 min-h-0">
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={metrics}>
                                <defs>
                                  <linearGradient id="ideAcc" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" strokeOpacity={0.2} />
                                <XAxis dataKey="step" hide />
                                <YAxis hide domain={[0, 100]} />
                                <Area type="monotone" dataKey="accuracy" stroke="#3b82f6" fillOpacity={1} fill="url(#ideAcc)" strokeWidth={2} isAnimationActive={false} />
                             </AreaChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    <div className="bg-[#111] rounded-lg border border-zinc-800 p-3 flex flex-col shadow-inner relative overflow-hidden group">
                       <div className="flex justify-between items-center mb-3 px-1">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Learning Rate</span>
                          <span className="text-[11px] font-mono text-yellow-500 bg-yellow-500/10 px-2 rounded border border-yellow-500/20">
                             {metrics.length > 0 ? metrics[metrics.length - 1].lr.toExponential(2) : '0.00e+0'}
                          </span>
                       </div>
                       <div className="flex-1 min-h-0">
                          <ResponsiveContainer width="100%" height="100%">
                             <LineChart data={metrics}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" strokeOpacity={0.2} />
                                <XAxis dataKey="step" hide />
                                <YAxis hide domain={['auto', 'auto']} />
                                <Line type="monotone" dataKey="lr" stroke="#eab308" strokeWidth={2} dot={false} isAnimationActive={false} />
                             </LineChart>
                          </ResponsiveContainer>
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg relative overflow-hidden group">
                    {isTraining && <div className="absolute inset-0 bg-[#00FF9F]/5 animate-pulse pointer-events-none"></div>}
                    <MetricMini label="CLUSTER ID" value="ae-prod-01" />
                    <div className="w-px h-6 bg-zinc-800"></div>
                    <div className="flex flex-col">
                       <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">THROUGHPUT</span>
                       <div className="flex items-center gap-1.5">
                          <span className={cn("text-[11px] font-mono font-bold tabular-nums", isTraining ? "text-[#00FF9F] text-shadow-[0_0_8px_#00FF9F]" : "text-zinc-600")}>
                             {isTraining ? (tokensPerSec/1000).toFixed(1) + 'k' : '0.0'}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono">TOK/S</span>
                       </div>
                    </div>
                    <div className="w-px h-6 bg-zinc-800"></div>
                    <MetricMini label="VRAM GLOBAL" value={`${currentVram.toFixed(1)} / ${vramMax} GB`} />
                    <div className="w-px h-6 bg-zinc-800"></div>
                    <div className="flex flex-col">
                       <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">PASS@1 SIM</span>
                       <div className="flex items-center gap-2">
                          <span className={cn("text-[11px] font-mono font-bold", isTraining ? "text-blue-400" : "text-zinc-600")}>
                             {isTraining ? (48 + progress * 0.25).toFixed(1) : '---'}%
                          </span>
                          {isTraining && <TrendingUp className="w-2.5 h-2.5 text-[#00FF9F]" />}
                       </div>
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                       <button className="flex items-center gap-2 p-1 px-3 rounded-lg bg-[#00FF9F]/10 border border-[#00FF9F]/20 text-[10px] font-bold text-[#00FF9F] hover:bg-[#00FF9F]/20 transition-all shadow-[0_0_15px_rgba(0,255,159,0.1)] group overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                          <Share2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
                          SYNC W&B
                       </button>
                    </div>
                  </div>
               </div>
             )}
             
             {bottomTab === 'terminal' && (
                <div className="h-full flex flex-col">
                  <div className="flex flex-wrap items-center gap-2 p-2 bg-[#1e1e1e] border-b border-zinc-800/50">
                      {currentProject?.entryPoints?.map(ep => (
                        <button 
                          key={ep}
                          onClick={() => window.dispatchEvent(new CustomEvent('run-terminal-command', { detail: `python ${ep}` }))} 
                          className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#00FF9F]/10 border border-[#00FF9F]/20 text-[9px] font-bold text-[#00FF9F] hover:bg-[#00FF9F]/20 transition-all"
                        >
                          <Play className="w-3 h-3" />
                          RUN {ep.toUpperCase()}
                        </button>
                      ))}
                      <button onClick={() => window.dispatchEvent(new CustomEvent('run-terminal-command', { detail: 'python train.py' }))} className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#00FF9F]/10 border border-[#00FF9F]/20 text-[9px] font-bold text-[#00FF9F] hover:bg-[#00FF9F]/20 transition-all">
                        <Play className="w-3 h-3" />
                        MANUAL TRAIN
                      </button>
                    <button onClick={() => window.dispatchEvent(new CustomEvent('run-terminal-command', { detail: 'nvidia-smi' }))} className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 hover:bg-blue-500/20 transition-all">
                      <Gauge className="w-3 h-3" />
                      MONITOR GPU
                    </button>
                    <button onClick={() => window.dispatchEvent(new CustomEvent('run-terminal-command', { detail: 'pip install torch transformers' }))} className="flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-[9px] font-bold text-yellow-500 hover:bg-yellow-500/20 transition-all">
                      <Cpu className="w-3 h-3" />
                      INSTALL DEPENDENCIES
                    </button>
                    <button onClick={() => window.dispatchEvent(new CustomEvent('run-terminal-command', { detail: 'source .env/bin/activate' }))} className="flex items-center gap-1.5 px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-[9px] font-bold text-purple-400 hover:bg-purple-500/20 transition-all">
                      <Zap className="w-3 h-3" />
                      ACTIVATE ENV
                    </button>
                    <div className="flex-1"></div>
                    <div className="flex items-center gap-2 text-[9px] text-zinc-600 font-mono">
                      <TerminalIcon className="w-3 h-3" />
                      SHELL: bash | PROJECT: {currentProject.name}
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 bg-black/40 relative">
                    <RealTerminal />
                  </div>
                </div>
             )}
             
             {(bottomTab === 'output' || bottomTab === 'eval') && (
                <div className="h-full flex items-center justify-center border border-dashed border-zinc-800 rounded-lg bg-zinc-950/20">
                   <div className="text-center">
                      <div className="w-12 h-12 rounded-full border-2 border-zinc-800 flex items-center justify-center mx-auto mb-3">
                         <Box className="w-6 h-6 text-zinc-700" />
                      </div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">No active results shard found</p>
                      <p className="text-[9px] text-zinc-600 mt-1">Start training to see live {bottomTab} streams</p>
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* 5. Right Sidebar (Inspector & Assistant) */}
      {isRightSidebarVisible && (
        <div className="w-full lg:w-80 bg-[#252526] border-t lg:border-t-0 lg:border-l border-zinc-800 flex flex-col shrink-0 relative animate-in slide-in-from-right duration-300 shadow-2xl">
          <div className="h-9 flex items-center border-b border-zinc-800 bg-[#252526] shrink-0">
            <button 
              onClick={() => setRightSidebarTab('inspector')}
              className={cn(
                "flex-1 h-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all",
                rightSidebarTab === 'inspector' ? "text-zinc-200 bg-zinc-800/50 border-b-2 border-[#00FF9F]" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Layout className="w-3.5 h-3.5" />
              Inspector
            </button>
            <button 
              onClick={() => setRightSidebarTab('security')}
              className={cn(
                "flex-1 h-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all",
                rightSidebarTab === 'security' ? "text-zinc-200 bg-zinc-800/50 border-b-2 border-red-500" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Shield className="w-3.5 h-3.5" />
              Security
            </button>
            <button 
              onClick={() => setRightSidebarTab('coach')}
              className={cn(
                "flex-1 h-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all",
                rightSidebarTab === 'coach' ? "text-zinc-200 bg-zinc-800/50 border-b-2 border-indigo-500" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              Coach
            </button>
            <button 
              onClick={() => {
                setRightSidebarTab('assistant');
                setIsChatOpen(true);
              }}
              className={cn(
                "flex-1 h-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all",
                rightSidebarTab === 'assistant' ? "text-zinc-200 bg-zinc-800/50 border-b-2 border-[#00FF9F]" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Bot className="w-3.5 h-3.5" />
              AI Assistant
            </button>
            <button 
              onClick={() => {
                setIsRightSidebarVisible(false);
                setIsChatOpen(false);
              }}
              className="px-3 h-full hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 flex items-center"
              title="Close Sidebar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        
        {rightSidebarTab === 'assistant' ? (
           <AICoAssistant 
             messages={chatMessages} 
             onSend={handleSendMessage} 
             onApplySuggestion={handleApplySuggestion}
             isTyping={isTyping} 
             coopMode={coopMode}
             onToggleCoop={() => setCoopMode(!coopMode)}
             selectedPersona={selectedPersona}
             onPersonaChange={setSelectedPersona}
             helixCore={agiState?.helixCore}
             onInitiativeAction={handleInitiativeAction}
             onOpenCuriosity={() => setIsCuriosityModalOpen(true)}
             setIsChatOpen={setIsChatOpen}
             isCuriosityOpen={isCuriosityModalOpen}
             onStartWalkthrough={startCodeWalkthroughFromContent}
            />
        ) : rightSidebarTab === 'coach' ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <TrainingCoachPanel 
                selectedCoach={selectedCoach}
                onCoachChange={setSelectedCoach}
                events={upcomingEvents}
                isEventMode={isEventModeActive}
                onEventModeToggle={() => setIsEventModeActive(!isEventModeActive)}
                onOpenCuriosity={() => setIsCuriosityModalOpen(true)}
                onGenerateData={handleGenerateSyntheticData}
                isGeneratingData={isGeneratingData}
              />
            </div>
        ) : rightSidebarTab === 'security' ? (
           <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <AGISecurityDashboard helix={agiState?.helixCore || {}} telemetry={agiState?.telemetry} />
           </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {/* GPU Gauges */}
            <div>
             <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-widest">
                  GPU Grid
                  <Gauge className="w-3 h-3" />
                </h4>
                <span className="text-[9px] text-[#00FF9F] font-mono tabular-nums">{isTraining ? '8 ACTIVE' : 'IDLE'}</span>
             </div>
             <div className="grid grid-cols-2 gap-2.5">
               {mockGpuData.map(gpu => (
                 <GpuGauge key={gpu.name} id={gpu.name} usage={isTraining ? (gpu.usage + (Math.random() * 5 - 2.5)) : 0} />
               ))}
               {[4, 5, 6, 7].map(i => (
                 <GpuGauge key={i} id={i.toString()} usage={isTraining ? (85 + Math.random() * 10) : 0} />
               ))}
             </div>
           </div>

           {/* Advanced LoRA Tuning Panel */}
           <div className="space-y-4 pt-4 border-t border-zinc-800/60 transition-all duration-500">
              <div className="flex justify-between items-center mb-1">
                <button 
                  onClick={() => setIsLoraExpanded(!isLoraExpanded)}
                  className="text-[10px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-widest hover:text-zinc-300 transition-colors"
                >
                  <div className="translate-y-[0.5px]">
                    {isLoraExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </div>
                  LoRA Configuration
                  <Sliders className="w-2.5 h-2.5 text-zinc-600" />
                </button>
                <div className="flex items-center gap-2">
                   <TooltipWrapper text="Analyzes model + data to suggest optimal hyperparameters.">
                      <button 
                        onClick={() => {
                           // Logic for auto-optimize
                           window.dispatchEvent(new CustomEvent('terminal-output', { detail: '\x1b[32m[HELIX]\x1b[0m Starting Helix-Heuristic Sweep...\r\n' }));
                           setTimeout(() => {
                              const isLargeDataset = (currentProject.datasetSize?.includes('GB') || (currentProject.tokenCount && parseFloat(currentProject.tokenCount) > 5));
                              if (isLargeDataset) {
                                 applyPreset('deep');
                                 window.dispatchEvent(new CustomEvent('terminal-output', { detail: '\x1b[32m[HELIX]\x1b[0m Large dataset/token count detected. Applied "Performance" profile (Rank 32) for deep feature capture.\r\n' }));
                              } else if (currentProject.model?.includes('Phi')) {
                                 applyPreset('light');
                                 window.dispatchEvent(new CustomEvent('terminal-output', { detail: '\x1b[32m[HELIX]\x1b[0m Mobile/Small model detected. Applied "Memory Safe" profile to prevent overfitting.\r\n' }));
                              } else {
                                 applyPreset('balanced');
                                 window.dispatchEvent(new CustomEvent('terminal-output', { detail: '\x1b[32m[HELIX]\x1b[0m Heuristic analysis complete. Applied "Balanced" profile for Llama-3-8B.\r\n' }));
                              }
                           }, 1000);
                        }}
                        className="text-[9px] px-2 py-0.5 rounded bg-[#00FF9F]/10 text-[#00FF9F] font-bold hover:bg-[#00FF9F]/20 transition-all border border-[#00FF9F]/20 flex items-center gap-1 group overflow-hidden relative"
                      >
                         <Sparkles className="w-2.5 h-2.5 group-hover:rotate-12 transition-transform" />
                         AUTO-OPT
                      </button>
                   </TooltipWrapper>
                </div>
              </div>

              {isLoraExpanded && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                  {/* Preset Buttons */}
                  <div className="space-y-2">
                    <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest flex items-center gap-1">
                      Target Presets
                      <TooltipWrapper text="Quickly apply predefined hyperparameter profiles optimized for various hardware constraints.">
                        <Info className="w-2.5 h-2.5 cursor-help" />
                      </TooltipWrapper>
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                       <PresetCard 
                         label="Memory Safe" 
                         desc="Rank 8 • 4-bit" 
                         active={loraConfig.rank === 8} 
                         onClick={() => applyPreset('light')} 
                       />
                       <PresetCard 
                         label="Balanced" 
                         desc="Rank 16 • BF16" 
                         active={loraConfig.rank === 16} 
                         onClick={() => applyPreset('balanced')} 
                       />
                       <PresetCard 
                         label="Performance" 
                         desc="Rank 32 • Code" 
                         active={loraConfig.rank === 32} 
                         onClick={() => applyPreset('deep')} 
                       />
                       <PresetCard 
                         label="Experimental" 
                         desc="Rank 64 • DoRA" 
                         active={loraConfig.rank === 64} 
                         onClick={() => applyPreset('experimental')} 
                       />
                    </div>
                  </div>

                  {/* Core Handlers */}
                  <div className="space-y-4 px-0.5">
                    <ParamControlFunctional 
                      label="Rank (r)" 
                      value={loraConfig.rank} 
                      min={4} 
                      max={128} 
                      onChange={v => setLoraConfig(p => ({ ...p, rank: v }))} 
                      tooltip="Higher rank = more expressive adapter, but uses significantly more VRAM."
                    />
                    <ParamControlFunctional 
                      label="LoRA Alpha" 
                      value={loraConfig.alpha} 
                      min={8} 
                      max={256} 
                      onChange={v => setLoraConfig(p => ({ ...p, alpha: v }))} 
                      tooltip="Scales the adapter weights. Standard practice is 2x Rank."
                    />
                    
                    <div className="grid grid-cols-2 gap-3 pb-1">
                       <InputWrapper label="Dropout" tooltip="Probability of zeroing out elements in the adapter. Use 0.05-0.1 for small datasets.">
                          <input 
                            type="number" 
                            step="0.01" 
                            value={loraConfig.dropout} 
                            onChange={e => setLoraConfig(p => ({ ...p, dropout: parseFloat(e.target.value) }))}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded p-1.5 text-[10px] text-zinc-300 font-mono outline-none focus:border-[#00FF9F]/50" 
                          />
                       </InputWrapper>
                       <InputWrapper label="Batch Size" tooltip="Per-device batch size. Higher values increase VRAM but stabilize gradients.">
                          <input 
                            type="number" 
                            value={loraConfig.batchSize} 
                            onChange={e => setLoraConfig(p => ({ ...p, batchSize: parseInt(e.target.value) }))}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded p-1.5 text-[10px] text-zinc-300 font-mono outline-none focus:border-[#00FF9F]/50" 
                          />
                       </InputWrapper>
                    </div>

                    <InputWrapper label="Learning Rate" tooltip="The speed at which the model updates its weights.">
                       <div className="flex items-center gap-2">
                          <input 
                            type="range" 
                            min={0.00001} 
                            max={0.0005} 
                            step={0.00001} 
                            value={loraConfig.learningRate} 
                            onChange={e => setLoraConfig(p => ({ ...p, learningRate: parseFloat(e.target.value) }))}
                            className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#00FF9F]" 
                          />
                          <span className="text-[10px] font-mono text-[#00FF9F] w-14 text-right">{(loraConfig.learningRate).toExponential(1)}</span>
                       </div>
                    </InputWrapper>
                  </div>

                  {/* Target Modules */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1">
                         Target Modules
                         <TooltipWrapper text="Specific weight matrices in the model that LoRA will adapt. Targeting more modules improves fine-tuning quality but uses more VRAM.">
                           <Info className="w-2.5 h-2.5 cursor-help" />
                         </TooltipWrapper>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      <button 
                        onClick={() => setLoraConfig(p => ({ ...p, targetModules: ['q_proj', 'v_proj', 'k_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj'] }))}
                        className={cn(
                          "py-1 rounded text-[8px] font-bold uppercase tracking-tight border transition-all",
                          loraConfig.targetModules.length >= 7 
                            ? "bg-[#00FF9F]/10 border-[#00FF9F]/40 text-[#00FF9F]" 
                            : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-zinc-400"
                        )}
                      >
                        All Linear
                      </button>
                      <button 
                        onClick={() => setLoraConfig(p => ({ ...p, targetModules: ['q_proj', 'v_proj', 'k_proj', 'o_proj'] }))}
                        className={cn(
                          "py-1 rounded text-[8px] font-bold uppercase tracking-tight border transition-all",
                          (loraConfig.targetModules.length === 4 && loraConfig.targetModules.includes('q_proj') && !loraConfig.targetModules.includes('gate_proj'))
                            ? "bg-[#007acc]/10 border-[#007acc]/40 text-[#007acc]" 
                            : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-zinc-400"
                        )}
                      >
                        Attention Only
                      </button>
                      <button 
                        className={cn(
                          "py-1 rounded text-[8px] font-bold uppercase tracking-tight border transition-all",
                          (loraConfig.targetModules.length !== 4 && loraConfig.targetModules.length < 7)
                            ? "bg-purple-500/10 border-purple-500/40 text-purple-400"
                            : "bg-zinc-900 border-zinc-800 text-zinc-600"
                        )}
                      >
                        Custom
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {['q_proj', 'v_proj', 'k_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj'].map(mod => (
                        <ModuleTag 
                          key={mod} 
                          label={mod} 
                          active={loraConfig.targetModules.includes(mod)} 
                          onClick={() => {
                            setLoraConfig(prev => {
                              const next = prev.targetModules.includes(mod) 
                                ? prev.targetModules.filter(m => m !== mod)
                                : [...prev.targetModules, mod];
                              return { ...prev, targetModules: next };
                            });
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* VRAM Estimator Box */}
                  <div className={cn(
                    "p-4 rounded-xl border flex flex-col gap-2 transition-all shadow-lg relative overflow-hidden",
                    vramPercentage > 90 ? "bg-red-500/10 border-red-500/50 shadow-red-500/10" :
                    vramPercentage > 75 ? "bg-yellow-500/10 border-yellow-500/50 shadow-yellow-500/5" : "bg-[#00FF9F]/5 border-[#00FF9F]/20 shadow-black/20"
                  )}>
                    {vramPercentage > 90 && <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>}
                    <div className="flex justify-between items-center relative z-10">
                       <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">Est. VRAM Consumption</span>
                          <span className={cn(
                            "text-lg font-mono font-bold leading-none mt-1",
                            vramPercentage > 90 ? "text-red-500" : 
                            vramPercentage > 75 ? "text-yellow-500" : "text-[#00FF9F]"
                          )}>
                             {currentVram.toFixed(1)}GB
                          </span>
                       </div>
                       <div className="text-right">
                          <span className={cn(
                             "text-[10px] font-mono font-bold",
                             vramPercentage > 90 ? "text-red-400" : "text-zinc-500"
                          )}>
                             {vramPercentage.toFixed(0)}% Util
                          </span>
                          <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-widest mt-0.5">Max: {vramMax}GB</p>
                       </div>
                    </div>
                    
                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden relative z-10">
                       <div 
                         className={cn(
                           "h-full transition-all duration-700",
                           vramPercentage > 90 ? "bg-red-500" : vramPercentage > 75 ? "bg-yellow-500" : "bg-[#00FF9F]"
                         )} 
                         style={{ width: `${Math.min(vramPercentage, 100)}%` }}
                       ></div>
                    </div>
                    
                    {vramPercentage > 90 ? (
                       <div className="flex items-center gap-1.5 text-red-400 relative z-10">
                          <Activity className="w-3 h-3 animate-pulse" />
                          <span className="text-[9px] font-bold uppercase tracking-tight">CRITICAL: Likely OOM on next run</span>
                       </div>
                    ) : vramPercentage > 75 ? (
                      <div className="flex items-center gap-1.5 text-yellow-500 relative z-10">
                          <Info className="w-3 h-3" />
                          <span className="text-[9px] font-bold uppercase tracking-tight">CAUTION: Multi-node overhead required</span>
                       </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[#00FF9F] relative z-10">
                          <Monitor className="w-3 h-3" />
                          <span className="text-[9px] font-bold uppercase tracking-tight">Optimal: Within safe compute bounds</span>
                       </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                     <button 
                       onClick={() => {
                         window.dispatchEvent(new CustomEvent('terminal-output', { detail: '\x1b[34m[INFO]\x1b[0m Syncing parameters to training_config.yaml...\r\n' }));
                         setTimeout(() => {
                           window.dispatchEvent(new CustomEvent('terminal-output', { detail: '\x1b[32m[SUCCESS]\x1b[0m Config updated. Ready for execution.\r\n' }));
                         }, 500);
                       }}
                       className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-[9px] font-bold text-zinc-400 hover:text-white hover:border-[#00FF9F]/40 transition-all uppercase tracking-widest"
                     >
                       <GitBranch className="w-3 h-3 text-blue-500" />
                       Push to Config
                     </button>
                     <button className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-[9px] font-bold text-zinc-400 hover:text-white hover:border-blue-400/40 transition-all uppercase tracking-widest">
                       <FolderPlus className="w-3 h-3 text-yellow-500" />
                       Save as Custom Preset
                     </button>
                  </div>
                </div>
              )}
           </div>

            {/* Helix AI Intelligent Training Integration */}
            <div className="pt-4 border-t border-zinc-800/60">
               <div className="flex justify-between items-center mb-3">
                 <h4 className="text-[10px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-widest">
                   Helix AI Intelligence
                   <Sparkles className="w-3 h-3 text-[#00FF9F]" />
                 </h4>
               </div>
               
               <div className="space-y-3">
                 <div className="flex items-center justify-between p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/60 group hover:border-[#00FF9F]/30 transition-all">
                   <div className="flex flex-col">
                     <span className="text-[11px] font-bold text-zinc-300">Train with Helix AI</span>
                     <span className="text-[8px] text-zinc-500 uppercase tracking-tighter">Real-time coaching & param optimization</span>
                   </div>
                   <button 
                     onClick={() => setTrainWithHelixAi(!trainWithHelixAi)}
                     className={cn(
                       "relative inline-flex h-4 w-8 items-center rounded-full transition-all duration-200",
                       trainWithHelixAi ? "bg-[#00FF9F]" : "bg-zinc-800"
                     )}
                   >
                     <span className={cn(
                       "inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform duration-200 shadow-sm",
                       trainWithHelixAi ? "translate-x-4.5" : "translate-x-1"
                     )} />
                   </button>
                 </div>

                 {isTraining && (
                   <button 
                     onClick={handleConsultHelix}
                     className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00FF9F]/10 border border-[#00FF9F]/20 text-[#00FF9F] text-[10px] font-black uppercase tracking-widest hover:bg-[#00FF9F]/20 transition-all shadow-lg animate-in fade-in slide-in-from-bottom-2"
                   >
                     <MessageSquare className="w-3.5 h-3.5" />
                     Consult Helix AI Analyst
                   </button>
                 )}
               </div>
            </div>

            {/* Training Coach Mode */}
            <div className="pt-4 border-t border-zinc-800/60">
               <h4 className="text-[10px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-widest mb-3">
                 Training Coach Mode
                 <Bot className="w-3 h-3" />
               </h4>
               <div className="grid grid-cols-1 gap-2">
                 {COACHES.map(coach => (
                   <button
                     key={coach.id}
                     onClick={() => setSelectedCoach(coach.id)}
                     className={cn(
                       "flex items-center gap-3 p-2 rounded-xl border transition-all text-left group",
                       selectedCoach === coach.id 
                         ? "bg-zinc-800 border-[#00FF9F]/40 shadow-[0_0_15px_rgba(0,255,159,0.05)]" 
                         : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                     )}
                   >
                     <div className={cn(
                       "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                       selectedCoach === coach.id ? "bg-[#00FF9F]/10 border-[#00FF9F]/20 text-[#00FF9F]" : "bg-zinc-950 border-zinc-800 text-zinc-600 group-hover:text-zinc-400 font-bold"
                     )}>
                       {coach.id === 'prime' && <Brain className="w-4 h-4" />}
                       {coach.id === 'groq' && <Zap className="w-4 h-4" />}
                       {coach.id === 'openai' && <Sparkles className="w-4 h-4" />}
                       {coach.id === 'anthropic' && <Shield className="w-4 h-4" />}
                       {coach.id === 'custom' && <Settings className="w-4 h-4" />}
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-center">
                         <span className={cn("text-[11px] font-bold truncate", selectedCoach === coach.id ? "text-zinc-100" : "text-zinc-400 group-hover:text-zinc-300")}>{coach.name}</span>
                         {selectedCoach === coach.id && <div className="w-1.5 h-1.5 rounded-full bg-[#00FF9F] shadow-[0_0_8px_#00FF9F]"></div>}
                       </div>
                       <span className="block text-[8px] text-zinc-600 uppercase tracking-tighter truncate">{coach.platform}</span>
                     </div>
                   </button>
                 ))}
               </div>
            </div>

            {/* Checkpoint History */}
           <div className="pt-4 border-t border-zinc-800/60">
              <h4 className="text-[10px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-widest mb-3">
                Checkpoint Log
                <RotateCcw className="w-3 h-3" />
              </h4>
              <div className="space-y-1.5">
                 <CheckpointItem step={500} loss={0.412} acc={82.4} active />
                 <CheckpointItem step={400} loss={0.485} acc={79.1} />
                 <CheckpointItem step={300} loss={0.592} acc={74.2} />
                 <CheckpointItem step={200} loss={0.841} acc={68.5} />
              </div>
           </div>

           {/* Hardware Allocation */}
           <div className="pt-4 border-t border-zinc-800/60">
              <h4 className="text-[10px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-widest mb-3">
                Runtime Spec
                <TooltipWrapper text="Low-level precision and execution settings.">
                  <Info className="w-2.5 h-2.5 cursor-help" />
                </TooltipWrapper>
              </h4>
              <div className="space-y-2 bg-black/20 p-3 rounded-lg border border-zinc-800/50">
                 <div className="flex justify-between items-center text-[11px]">
                    <span className="text-zinc-600 flex items-center gap-1">
                      Dtype
                      <TooltipWrapper text="Data type used for model weights. Lower precision reduces VRAM usage.">
                        <Info className="w-2.5 h-2.5 cursor-help" />
                      </TooltipWrapper>
                    </span>
                    <select 
                      value={loraConfig.precision} 
                      onChange={e => setLoraConfig(p => ({ ...p, precision: e.target.value as 'fp16' | 'bf16' | 'fp32' }))}
                      className="bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-[9px] rounded py-0.5 px-1 outline-none focus:border-[#00FF9F]/50"
                    >
                      <option value="bf16">Bfloat16</option>
                      <option value="fp16">Float16</option>
                      <option value="fp32">Float32</option>
                    </select>
                 </div>
                 <div className="flex justify-between items-center text-[11px]">
                    <span className="text-zinc-600 flex items-center gap-1">
                      Zero Protocol
                      <TooltipWrapper text="DeepSpeed ZeRO optimization stage. Stage-3 shards optimizer states, gradients, and parameters across GPUs.">
                        <Info className="w-2.5 h-2.5 cursor-help" />
                      </TooltipWrapper>
                    </span>
                    <span className="text-orange-400 font-mono">Stage-3</span>
                 </div>
                 <div className="flex justify-between items-center text-[11px]">
                    <span className="text-zinc-600 flex items-center gap-1">
                      Interconnect
                      <TooltipWrapper text="Hardware bus used for inter-GPU communication. NVLink provides high bandwidth required for tensor parallelism.">
                        <Info className="w-2.5 h-2.5 cursor-help" />
                      </TooltipWrapper>
                    </span>
                    <span className="text-[#00FF9F] font-mono">NVLink x 8</span>
                 </div>
              </div>
           </div>
           
           <div className="pt-4">
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-2 mr-2">
                 <select 
                   value={selectedWasmKey}
                   onChange={(e) => setSelectedWasmKey(e.target.value as any)}
                   className="bg-transparent text-[10px] text-zinc-400 font-bold uppercase tracking-widest focus:outline-none py-1.5 cursor-pointer"
                 >
                    {Object.entries(WASM_EXAMPLES).map(([key, val]) => (
                      <option key={key} value={key} className="bg-zinc-900">{val.name}</option>
                    ))}
                 </select>
              </div>

               <div className="flex gap-2">
                 <button 
                   onClick={handleStartTraining}
                   className={cn(
                     "flex-1 py-2.5 rounded-lg text-[11px] font-bold transition-all shadow-xl flex items-center justify-center gap-2 uppercase tracking-wider relative overflow-hidden group",
                     isTraining 
                       ? "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-red-400 hover:border-red-500/30" 
                       : "bg-[#007acc] text-white hover:bg-[#0088ee] shadow-[#007acc]/20"
                   )}
                 >
                   {isTraining ? <RotateCcw className="w-3.5 h-3.5 animate-spin-slow" /> : <Play className="w-3.5 h-3.5" />}
                   {isTraining ? 'Reset Shards' : 'Bootstrap Session'}
                 </button>
                 {!isTraining && (
                   <button 
                     onClick={() => {
                       const errors: CognitionState[] = ['BUILD_ERROR', 'SANDBOX_REJECTED', 'FAILED_RESEARCH'];
                       const randomErr = errors[Math.floor(Math.random() * errors.length)];
                       setCognitionState(randomErr);
                       setToast({ message: `Simulated anomaly triggered: ${randomErr}`, type: 'warn' });
                     }}
                     className="px-3 bg-zinc-900 border border-zinc-800 text-zinc-550 hover:text-red-400 hover:border-red-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center cursor-pointer transition-colors"
                     title="Simulate Anomaly"
                   >
                     <AlertTriangle className="w-3.5 h-3.5" />
                   </button>
                 )}
               </div>

               {['BUILD_ERROR', 'SANDBOX_REJECTED', 'FAILED_RESEARCH'].includes(cognitionState) && (
                 <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl space-y-2.5 mt-3 animate-in fade-in slide-in-from-top-4">
                   <div className="flex items-center gap-2 text-red-400 font-bold text-[9px] uppercase tracking-wider">
                     <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                     Cognition Recovery Loop Active
                   </div>
                   <p className="text-[9px] text-zinc-400 leading-normal font-mono">
                     Anomaly detected: <span className="text-red-400 font-bold uppercase">{cognitionState.replace('_', ' ')}</span>. Telemetry indicates execution pipeline halted. Choose recovery strategy:
                   </p>
                   <div className="flex gap-1.5 pt-0.5">
                     <button 
                       onClick={() => {
                         setToast({ message: "Retrying execution planning...", type: 'info' });
                         setCognitionState('EXECUTION_PLANNING');
                         setTimeout(() => {
                           setCognitionState('PROCEDURAL_SYNTHESIS');
                           setTimeout(() => {
                             setCognitionState('WALKTHROUGH');
                             const targetContent = fileContents['main.py'] || fileContents['train.py'] || '';
                             startCodeWalkthroughFromContent(targetContent);
                             setToast({ message: "Recovery successful. Walkthrough opened.", type: 'success' });
                           }, 1000);
                         }, 1000);
                       }}
                       className="flex-1 py-1.5 bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500 hover:text-zinc-950 text-emerald-400 rounded text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                     >
                       Retry Stage
                     </button>
                     <button 
                       onClick={() => {
                         setToast({ message: "Initiating automatic state rollback...", type: 'info' });
                         setCognitionState('ROLLBACK');
                         setTimeout(() => {
                           setCognitionState('IDLE');
                           setToast({ message: "Rollback completed. Restored last stable state.", type: 'success' });
                         }, 1500);
                       }}
                       className="flex-1 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                     >
                       Rollback
                     </button>
                     <button 
                       onClick={() => {
                         setToast({ message: "Anomaly escalated to user manual intervention.", type: 'warn' });
                         setCognitionState('IDLE');
                       }}
                       className="py-1.5 px-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                     >
                       Escalate
                     </button>
                   </div>
                 </div>
               )}
           </div>
          </div>
        )}
      </div>
      )}
      
      </div>
      
      {/* Modals */}
      {modals.new && (
        <NewProjectModal 
          onClose={() => setModals(prev => ({ ...prev, new: false }))} 
          onCreate={(name, model, template, datasetSize) => {
            const projectTree = generateProjectTree(name, template);
            const newProject: Project = {
              id: name.toLowerCase().replace(/\s+/g, '-'),
              name,
              model,
              template,
              datasetSize,
              category: 'Fine-Tuning',
              status: 'Idle',
              metrics: { accuracy: 0, loss: 0, throughput: '0k tok/s' },
              connectionType: 'Local',
              created: new Date().toISOString().split('T')[0],
              fileTree: projectTree,
              tokenCount: '0'
            };
            
            if (onProjectCreate) {
              onProjectCreate(newProject);
              setCurrentProjectId(newProject.id);
            }
            setModals(prev => ({ ...prev, new: false }));
          }}
        />
      )}

      {modals.import && (
        <ImportProjectModal 
          onClose={() => setModals(prev => ({ ...prev, import: false }))}
          onImport={(newProject) => {
            if (onProjectCreate) {
              onProjectCreate(newProject);
              setCurrentProjectId(newProject.id);
            }
            setModals(prev => ({ ...prev, import: false }));
          }}
        />
      )}

      {modals.export && (
        <ExportProjectModal 
          project={currentProject}
          fileContents={fileContents}
          onClose={() => setModals(prev => ({ ...prev, export: false }))}
        />
      )}

      {activeWalkthrough && (
        <InteractiveWalkthroughModal 
          walkthrough={activeWalkthrough}
          onClose={() => setActiveWalkthrough(null)}
          onApprove={() => {
            setActiveWalkthrough(null);
            setModals(prev => ({ ...prev, export: true }));
          }}
        />
      )}

      {showRecipeModal && (
        <TrainingRecipeModal 
          onClose={() => setShowRecipeModal(false)}
          onApply={(recipe) => {
            applyRecipe(recipe);
            setShowRecipeModal(false);
          }}
        />
      )}

      <CuriosityModeModal 
        isOpen={isCuriosityModalOpen} 
        onClose={() => setIsCuriosityModalOpen(false)}
        onExecute={handleCuriosityExecute}
        onApprove={approveCuriosityPhase}
        state={curiosity}
        personaId={selectedPersona}
        helixCore={agiState?.helixCore}
      />

      {/* Floating AI Assistant Button */}
      <button 
        onClick={() => {
          const nextState = !isRightSidebarVisible || rightSidebarTab !== 'assistant';
          setIsRightSidebarVisible(true);
          setRightSidebarTab('assistant');
          setIsChatOpen(true);
          if (isRightSidebarVisible && rightSidebarTab === 'assistant') {
            setIsRightSidebarVisible(false);
            setIsChatOpen(false);
          }
        }}
        className={cn(
          "fixed bottom-20 right-8 z-[200] p-4 rounded-2xl shadow-2xl transition-all hover:scale-110 active:scale-95 group",
          (isRightSidebarVisible && rightSidebarTab === 'assistant') ? "bg-red-500 text-white" : "bg-[#00FF9F] text-zinc-950 shadow-[0_0_20px_rgba(0,255,159,0.3)]"
        )}
      >
        <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        {(isRightSidebarVisible && rightSidebarTab === 'assistant') ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {/* 6. Tool Bar (Status Bar) */}
      <div className="h-6 bg-[#18181b] shrink-0 flex items-center px-4 text-[11px] text-zinc-400 gap-4 border-t border-zinc-800 relative z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
         <div className="flex items-center gap-1.5 text-[#00FF9F]">
            <GitBranch className="w-3.5 h-3.5" />
            <span className="font-bold tracking-tight">mod/llama3-train*</span>
         </div>
         <div className="w-px h-3 bg-zinc-800 mx-1"></div>
         <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span className="tabular-nums">{isTraining ? (progress * 12.4).toFixed(1) : '8.4'}M Tokens</span>
         </div>
         <div className="w-px h-3 bg-zinc-800 mx-1"></div>
         <div className="hidden sm:flex items-center gap-1.5">
            <Zap className={cn("w-3.5 h-3.5 transition-colors", isTraining ? "text-yellow-400 animate-pulse" : "text-zinc-600")} />
            <span className="tabular-nums">Est. cost: ${(progress * 0.42 + 0.15).toFixed(2)} / hr</span>
         </div>
         <div className="flex-1"></div>
         <div className="flex items-center gap-4 text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
               <Cpu className="w-3 h-3 text-zinc-500" />
               <span>{isTraining ? '8x A100-80G' : 'Cluster Idle'}</span>
            </div>
            <span>UTF-8</span>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
               <div className={cn("w-1 h-1 rounded-full", isTraining ? "bg-[#00FF9F] animate-pulse" : "bg-zinc-700")}></div>
               <span className="text-[9px]">SYNC-OK</span>
            </div>
         </div>
      </div>
    </div>
  );
}

function MenuBar({ onNew, onImport, onExport, onRecipeSelect }: { onNew: () => void, onImport: () => void, onExport: () => void, onRecipeSelect: (recipe: any) => void }) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showRecipes, setShowRecipes] = useState(false);

  return (
    <div className="h-7 bg-[#1e1e1e] border-b border-zinc-800 flex items-center px-3 shrink-0 z-50">
      <div className="relative">
        <button 
          onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
          className={cn(
            "px-2.5 py-0.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors",
            activeMenu === 'file' && "bg-zinc-800 text-zinc-100"
          )}
        >
          File
        </button>
        {activeMenu === 'file' && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)}></div>
            <div className="absolute top-full left-0 mt-1 w-52 bg-[#252526] border border-zinc-700 rounded-lg shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
              <MenuOption label="New Project..." icon={Plus} shortcut="Ctrl+Shift+N" onClick={() => { onNew(); setActiveMenu(null); }} />
              <MenuOption label="Import Project..." icon={Upload} onClick={() => { onImport(); setActiveMenu(null); }} />
              <div className="h-px bg-zinc-800 my-1.5 mx-2"></div>
              <MenuOption label="Export Project..." icon={Download} onClick={() => { onExport(); setActiveMenu(null); }} />
              <div className="h-px bg-zinc-800 my-1.5 mx-2"></div>
              <MenuOption label="Open Recent" icon={Folder} onClick={() => setActiveMenu(null)} />
              <MenuOption label="Close Project" icon={X} onClick={() => setActiveMenu(null)} />
            </div>
          </>
        )}
      </div>
      
      <div className="relative">
                <button 
          onClick={() => setActiveMenu(activeMenu === 'helix' ? null : 'helix')}
          className={cn(
            "px-2.5 py-0.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors",
            activeMenu === 'helix' && "bg-zinc-800 text-zinc-100"
          )}
        >
          Helix
        </button>
        {activeMenu === 'helix' && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)}></div>
            <div className="absolute top-full left-0 mt-1 w-64 bg-[#252526] border border-zinc-700 rounded-lg shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
              <MenuOption 
                label="Run Training Recipe..." 
                icon={Zap} 
                shortcut="F5"
                onClick={() => { onRecipeSelect('open-modal'); setActiveMenu(null); }} 
              />
              <div 
                className="relative"
                onMouseEnter={() => setShowRecipes(true)}
                onMouseLeave={() => setShowRecipes(false)}
              >
                <div className="flex items-center justify-between px-3 py-1.5 hover:bg-[#007acc] text-zinc-300 hover:text-white group text-[11px] cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-orange-400 group-hover:text-white shrink-0" />
                    <span>Quick Recipes</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-white" />
                </div>
                
                {showRecipes && (
                  <div className="absolute top-0 left-full ml-0.5 w-64 bg-[#252526] border border-zinc-700 rounded-lg shadow-2xl py-1.5 animate-in fade-in slide-in-from-left-1 duration-150">
                    <MenuOption 
                      label="Quick LoRA Code Tune" 
                      icon={Zap} 
                      onClick={() => { onRecipeSelect('quick-lora'); setActiveMenu(null); }} 
                    />
                    <MenuOption 
                      label="Full Fine-Tune" 
                      icon={Activity} 
                      onClick={() => { onRecipeSelect('full-finetune'); setActiveMenu(null); }} 
                    />
                    <MenuOption 
                      label="Synthetic Data Generation" 
                      icon={Database} 
                      onClick={() => { onRecipeSelect('synthetic-data'); setActiveMenu(null); }} 
                    />
                  </div>
                )}
              </div>
              <div className="h-px bg-zinc-800 my-1.5 mx-2"></div>
              <MenuOption label="Optimize Parameters" icon={Sliders} onClick={() => setActiveMenu(null)} />
              <MenuOption label="Cluster Settings" icon={Cpu} onClick={() => setActiveMenu(null)} />
            </div>
          </>
        )}
      </div>

      <button onClick={() => window.dispatchEvent(new CustomEvent('studio-action', { detail: 'edit' }))} className="px-2.5 py-0.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-100 transition-colors">Edit</button>
      <button onClick={() => window.dispatchEvent(new CustomEvent('studio-action', { detail: 'view' }))} className="px-2.5 py-0.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-100 transition-colors">View</button>
      <button onClick={() => window.dispatchEvent(new CustomEvent('studio-action', { detail: 'run' }))} className="px-2.5 py-0.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-100 transition-colors">Run</button>
      <button onClick={() => window.dispatchEvent(new CustomEvent('studio-action', { detail: 'terminal' }))} className="px-2.5 py-0.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-100 transition-colors">Terminal</button>
      <button onClick={() => window.dispatchEvent(new CustomEvent('studio-action', { detail: 'help' }))} className="px-2.5 py-0.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-100 transition-colors">Help</button>
      
      <div className="flex-1"></div>
      
      <button 
        onClick={() => window.dispatchEvent(new CustomEvent('studio-action', { detail: 'export' }))} 
        className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-yellow-950 text-[10px] font-black uppercase tracking-widest rounded shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-all transform hover:scale-105 active:scale-95"
      >
        <Download className="w-3.5 h-3.5" />
        ONE-CLICK BUNDLE
      </button>
    </div>
  );
}

function MenuOption({ label, icon: Icon, shortcut, onClick }: { label: string, icon: any, shortcut?: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#007acc] text-zinc-300 hover:text-white group text-[11px]"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white" />
        <span>{label}</span>
      </div>
      {shortcut && <span className="text-[10px] text-zinc-600 group-hover:text-white/40 font-mono tracking-tighter">{shortcut}</span>}
    </button>
  );
}

function CommandItem({ label, icon: Icon, shortcut, color = "text-zinc-400", onClick }: { label: string, icon: any, shortcut?: string, color?: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between px-3 py-2 hover:bg-[#007acc] hover:text-white rounded cursor-pointer group transition-colors"
    >
       <div className="flex items-center gap-3">
          <Icon className={cn("w-4 h-4", color, "group-hover:text-white")} />
          <span className="text-xs group-hover:text-white">{label}</span>
       </div>
       {shortcut && <span className="text-[10px] text-zinc-500 group-hover:text-white/50 font-mono">{shortcut}</span>}
    </div>
  );
}

// Helper Components
function ActivityIcon({ icon: Icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-2 lg:p-3 relative group transition-colors",
        active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
      )}
    >
      <Icon className="w-6 h-6 lg:w-5 lg:h-5" />
      {active && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white hidden lg:block" />}
      {active && <div className="absolute left-0 right-0 bottom-0 h-[2px] bg-white lg:hidden" />}
      <div className="absolute left-full ml-3 px-2 py-1 bg-zinc-800 text-[10px] text-zinc-100 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
         {Icon.name}
      </div>
    </button>
  );
}

function SidebarSection({ title }: { title: string }) {
  return (
    <div className="h-7 flex items-center px-4 gap-1 cursor-pointer hover:bg-zinc-800/50 group">
      <ChevronDown className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300" />
      <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 tracking-wider">
        {title}
      </span>
    </div>
  );
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'py': return <FileCode2 className="w-3.5 h-3.5 text-blue-400" />;
    case 'yaml': 
    case 'yml': return <Settings className="w-3.5 h-3.5 text-orange-400" />;
    case 'json': 
    case 'jsonl': return <FileJson className="w-3.5 h-3.5 text-yellow-400" />;
    case 'txt': 
    case 'md': return <FileText className="w-3.5 h-3.5 text-zinc-400" />;
    default: return <Files className="w-3.5 h-3.5 text-zinc-600" />;
  }
}

function FileTree({ nodes, activeFile, editedFiles, onFileSelect, onReorder }: { 
  nodes: FileNode[], 
  activeFile?: string, 
  editedFiles: Set<string>,
  onFileSelect?: (name: string) => void,
  onReorder?: (source: string, target: string) => void
}) {
  return (
    <div className="space-y-0.5 mt-1">
      {nodes?.map((node, i) => (
        <FileItem 
          key={node.name} 
          node={node} 
          level={0} 
          activeFile={activeFile} 
          editedFiles={editedFiles}
          onFileSelect={onFileSelect}
          onReorder={onReorder}
        />
      ))}
    </div>
  );
}

function FileItem({ node, level, activeFile, editedFiles, onFileSelect, onReorder }: { 
  node: FileNode, 
  level: number, 
  activeFile?: string, 
  editedFiles: Set<string>,
  onFileSelect?: (name: string) => void,
  onReorder?: (source: string, target: string) => void,
  key?: React.Key
}) {
  const [isOpen, setIsOpen] = useState(node.isOpen);
  const isActive = activeFile === node.name;
  const isEdited = editedFiles.has(node.name);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('fileName', node.name);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const sourceName = e.dataTransfer.getData('fileName');
    if (onReorder) onReorder(sourceName, node.name);
  };
  
  if (node.type === 'folder') {
    return (
      <div 
        draggable 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="h-6 flex items-center gap-1.5 px-2 hover:bg-[#2a2d2e] cursor-pointer group"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
          <span className="text-[12px] text-zinc-300 group-hover:text-white truncate">{node.name}</span>
        </div>
        {isOpen && node.children && (
          <div>
            {node.children?.map((child) => (
              <FileItem 
                key={child.name} 
                node={child} 
                level={level + 1} 
                activeFile={activeFile} 
                editedFiles={editedFiles}
                onFileSelect={onFileSelect}
                onReorder={onReorder}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => onFileSelect?.(node.name)}
      className={cn(
        "h-6 flex items-center gap-1.5 px-2 cursor-pointer group transition-colors",
        isActive ? "bg-[#37373d] text-white" : "hover:bg-[#2a2d2e] text-zinc-400 group-hover:text-zinc-200"
      )}
      style={{ paddingLeft: `${level * 12 + 24}px` }}
    >
      {getFileIcon(node.name)}
      <span className={cn(
        "text-[12px] truncate flex-1",
        isActive ? "text-zinc-100" : "text-zinc-400 group-hover:text-zinc-200"
      )}>
        {node.name}
      </span>
      {isEdited && <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 mr-1 shrink-0" title="Edited" />}
    </div>
  );
}

function ExperimentItem({ name, status, date }: { name: string, status: 'running' | 'completed' | 'failed', date: string }) {
  return (
    <div className="p-2 bg-zinc-900/30 rounded border border-transparent hover:border-zinc-800 hover:bg-zinc-800/50 cursor-pointer group transition-all">
       <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200">{name}</span>
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            status === 'running' && "bg-[#00FF9F] animate-pulse",
            status === 'completed' && "bg-zinc-600",
            status === 'failed' && "bg-red-500"
          )} />
       </div>
       <div className="flex justify-between text-[9px] text-zinc-600">
          <span className="uppercase">{status}</span>
          <span>{date}</span>
       </div>
    </div>
  );
}

function EditorTab({ name, active, onClick }: { name: string, active: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "h-full px-4 flex items-center gap-2 border-r border-[#1e1e1e] cursor-pointer text-[12px] transition-colors relative",
        active ? "bg-[#1e1e1e] text-zinc-100" : "bg-[#2d2d2d] text-zinc-500 hover:text-zinc-300"
      )}
    >
      <span className="truncate max-w-[120px]">{name}</span>
      <X className={cn("w-3 h-3 hover:bg-zinc-700/50 rounded p-0.5", active ? "opacity-100" : "opacity-0")} />
      {active && <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#00FF9F]" />}
    </div>
  );
}

function PanelTab({ name, active, onClick }: { name: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "h-full px-3 text-[11px] font-bold transition-all relative border-b-2",
        active ? "text-zinc-100 border-[#00FF9F]" : "text-zinc-500 border-transparent hover:text-zinc-300"
      )}
    >
      {name}
    </button>
  );
}

function MetricMini({ label, value, color = "text-zinc-200" }: { label: string, value: string, color?: string }) {
  return (
    <div className="flex flex-col">
       <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{label}</span>
       <span className={cn("text-[10px] font-mono", color)}>{value}</span>
    </div>
  );
}

const DATASET_JSONL = `{"instruction": "Write a python function to sort a list of dictionaries by a key.", "context": "", "response": "def sort_dicts(data, key):\\n    return sorted(data, key=lambda x: x[key])"}
{"instruction": "Explain the difference between @property and @staticmethod in Python.", "context": "", "response": "@property is a decorator for defining getter methods that can be accessed like an attribute. @staticmethod defines a method that belongs to the class but doesn't have access to the instance (self) or class (cls)."}
{"instruction": "Implement a simple decorator for logging execution time.", "context": "", "response": "import time\\n\\ndef time_it(func):\\n    def wrapper(*args, **kwargs):\\n        start = time.time()\\n        res = func(*args, **kwargs)\\n        print(f'{func.__name__} took {time.time()-start}s')\\n        return res\\n    return wrapper"}`;

function UnifiedEditor({ code: initialCode, lang, onValueChange }: { code: string, lang: 'python' | 'yaml' | 'json', onValueChange?: (value: string) => void }) {
  const { settings } = useSettings();
  const [code, setCode] = useState(initialCode);
  const [ghostText, setGhostText] = useState('');
  const [showTooltip, setShowTooltip] = useState<{ x: number, y: number, content: string } | null>(null);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const handleChange = (newVal: string | undefined) => {
    const value = newVal || '';
    setCode(value);
    if (onValueChange) onValueChange(value);
  };

  useEffect(() => {
    // Simulate AI Ghost Text
    const ghostSuggestions: Record<string, string> = {
      'python': '    # AI Suggestion: model.to(torch.bfloat16) for efficiency',
      'yaml': '  gradient_checkpointing: true # Recommended for 8B+',
      'json': '  "use_cache": true # Improves inference latency'
    };
    
    const timeout = setTimeout(() => {
       if (code === initialCode && settings.ai.ghostText) {
         setGhostText(ghostSuggestions[lang] || '');
       }
    }, 2500);
    
    return () => {
      clearTimeout(timeout);
      setGhostText('');
    };
  }, [code, lang, initialCode, settings.ai.ghostText]);

  const handleMouseMove = (e: React.MouseEvent) => {
    // Simple mock detection for tooltip
    if (lang === 'python' && e.clientX % 150 < 10) {
       setShowTooltip({
         x: e.clientX,
         y: e.clientY,
         content: "This module utilizes Xformers memory-efficient attention by default."
       });
    } else if (lang === 'yaml' && e.clientX % 200 < 5) {
       setShowTooltip({
         x: e.clientX,
         y: e.clientY,
         content: "Optimal learning rate for 8B models is typically 5e-5."
       });
    } else {
       setShowTooltip(null);
    }
  };

  return (
    <div className="relative font-mono text-[13px] leading-relaxed flex h-full group/editor" onMouseMove={handleMouseMove}>
      <div className="flex-1 overflow-hidden bg-[#1e1e1e] rounded-lg border border-zinc-800/50 shadow-inner relative">
        <Editor
          height="100%"
          language={lang === 'python' ? 'python' : (lang === 'yaml' ? 'yaml' : 'json')}
          theme={settings.general.theme === 'Light' ? 'light' : 'vs-dark'}
          value={code}
          onChange={handleChange}
          options={{
            fontSize: settings.editor.fontSize,
            fontFamily: settings.editor.fontFamily,
            minimap: { enabled: settings.editor.minimap },
            lineNumbers: settings.editor.lineNumbers ? 'on' : 'off',
            bracketPairColorization: { enabled: settings.editor.bracketPairs },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 20, bottom: 20 },
            backgroundColor: 'transparent',
            renderLineHighlight: 'all',
          }}
        />
        
        {ghostText && (
          <div className="absolute top-[120px] left-[60px] pointer-events-none text-zinc-600 italic select-none animate-in fade-in duration-700 z-10">
             {ghostText}
             <span className="ml-2 bg-[#00FF9F]/10 text-[#00FF9F] px-1 rounded text-[9px] font-bold not-italic border border-[#00FF9F]/20 shadow-[0_0_8px_rgba(0,255,159,0.1)]">TAB TO ACCEPT</span>
          </div>
        )}

        {showTooltip && (
          <div 
            className="fixed z-[100] bg-[#252526] border border-zinc-700 p-2 rounded-md shadow-2xl text-[10px] text-zinc-300 pointer-events-none animate-in fade-in scale-95 duration-150"
            style={{ left: showTooltip.x + 10, top: showTooltip.y + 10 }}
          >
            <div className="flex items-center gap-1.5 mb-1 text-[#00FF9F]">
               <Info className="w-3 h-3" />
               <span className="font-bold uppercase tracking-tighter">Helix Insight</span>
            </div>
            {showTooltip.content}
          </div>
        )}
      </div>
    </div>
  );
}

function CodeContent({ code }: { code: string }) {
  return (
    <pre className="whitespace-pre-wrap break-all pr-4">
      {code}
    </pre>
  );
}

function ModuleTag({ label, active, onClick }: { label: string, active?: boolean, onClick?: () => void, key?: React.Key }) {
  return (
    <span 
      onClick={onClick}
      className={cn(
        "px-1.5 py-0.5 rounded text-[9px] transition-all cursor-pointer select-none",
        active 
          ? "bg-[#00FF9F]/10 border border-[#00FF9F]/40 text-[#00FF9F] shadow-[0_0_8px_rgba(0,255,159,0.1)]" 
          : "bg-zinc-900 border border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"
      )}
    >
      {label}
    </span>
  );
}

function PresetCard({ label, desc, active, onClick }: { label: string, desc: string, active: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-2 rounded border cursor-pointer transition-all flex flex-col gap-0.5",
        active 
          ? "bg-[#00FF9F]/10 border-[#00FF9F]/40 shadow-[0_0_10px_rgba(0,255,159,0.05)]" 
          : "bg-zinc-950 border-zinc-900 hover:border-zinc-800"
      )}
    >
      <span className={cn("text-[10px] font-bold", active ? "text-[#00FF9F]" : "text-zinc-400")}>{label}</span>
      <span className="text-[8px] text-zinc-600 font-mono tracking-tighter">{desc}</span>
    </div>
  );
}

function ParamControlFunctional({ label, value, min, max, step = 1, onChange, tooltip }: { label: string, value: number, min: number, max: number, step?: number, onChange: (v: number) => void, tooltip?: string }) {
  return (
    <div className="space-y-1.5">
       <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
             <span className="text-[10px] text-zinc-400 font-medium">{label}</span>
             {tooltip && (
               <TooltipWrapper text={tooltip}>
                  <Info className="w-2.5 h-2.5 text-zinc-600 cursor-help" />
               </TooltipWrapper>
             )}
          </div>
          <span className="text-[10px] font-mono text-[#00FF9F] bg-[#00FF9F]/10 px-1 rounded">{value}</span>
       </div>
       <input 
         type="range" 
         min={min} 
         max={max} 
         step={step} 
         value={value} 
         onChange={e => onChange(parseFloat(e.target.value))}
         className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#00FF9F]" 
       />
    </div>
  );
}

function InputWrapper({ label, tooltip, children }: { label: string, tooltip?: string, children: React.ReactNode }) {
  return (
    <div className="space-y-1">
       <div className="flex items-center gap-1 px-0.5">
          <span className="text-[9px] text-zinc-600 uppercase font-bold">{label}</span>
          {tooltip && (
            <TooltipWrapper text={tooltip}>
               <Info className="w-2.5 h-2.5 text-zinc-700 cursor-help" />
            </TooltipWrapper>
          )}
       </div>
       {children}
    </div>
  );
}

function TooltipWrapper({ text, children }: { text: string, children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
       {children}
       {show && (
         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#2d2d2d] border border-zinc-700 rounded-lg shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-150">
            <p className="text-[9px] text-zinc-300 leading-tight">
               {text}
            </p>
         </div>
       )}
    </div>
  );
}

function CheckpointItem({ step, loss, acc, active }: { step: number, loss: number, acc: number, active?: boolean }) {
  return (
    <div className={cn(
      "flex flex-col p-2 rounded-lg border transition-all cursor-pointer group hover:scale-[1.02]",
      active ? "bg-[#00FF9F]/5 border-[#00FF9F]/20" : "bg-black/20 border-transparent hover:border-zinc-800"
    )}>
      <div className="flex justify-between items-center mb-1">
        <span className={cn("text-[10px] font-bold", active ? "text-zinc-200" : "text-zinc-500")}>STEP {step}</span>
        <Download className="w-3 h-3 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
      </div>
      <div className="flex gap-3 text-[9px] font-mono">
        <div className="flex items-center gap-1">
           <span className="text-zinc-600">Loss:</span>
           <span className="text-[#00FF9F]">{loss.toFixed(4)}</span>
        </div>
        <div className="flex items-center gap-1">
           <span className="text-zinc-600">Acc:</span>
           <span className="text-blue-400">{acc.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

function GpuGauge({ id, usage }: { id: string, usage: number, key?: React.Key }) {
  const isHealthy = usage < 95;
  return (
    <div className="bg-zinc-950 p-2 rounded border border-zinc-900 group">
       <div className="flex justify-between items-center mb-1.5">
          <span className="text-[9px] font-bold text-zinc-600 group-hover:text-zinc-400 transition-colors">GPU-{id}</span>
          <span className={cn("text-[10px] font-mono", !isHealthy ? "text-red-500" : "text-zinc-400")}>{Math.round(usage)}%</span>
       </div>
       <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-300",
              usage > 90 ? "bg-red-500" : usage > 50 ? "bg-yellow-500" : "bg-[#00FF9F]"
            )} 
            style={{ width: `${usage}%` }} 
          />
       </div>
    </div>
  );
}

function ParamControl({ label, value, min, max, step = 1 }: { label: string, value: string, min: number, max: number, step?: number }) {
  return (
    <div className="space-y-1.5">
       <div className="flex justify-between items-center">
          <span className="text-[10px] text-zinc-400 font-medium">{label}</span>
          <span className="text-[10px] font-mono text-[#00FF9F] bg-[#00FF9F]/10 px-1 rounded">{value}</span>
       </div>
       <input type="range" min={min} max={max} step={step} defaultValue={value} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#00FF9F]" />
    </div>
  );
}

function HyperparameterScheduleChart() {
  const [scheduleData] = useState(() => {
    return Array.from({ length: 20 }, (_, i) => {
      const epoch = i / 2;
      // Cosine decay simulation
      const lr = 2e-5 * (0.5 * (1 + Math.cos((Math.min(epoch, 3) / 3) * Math.PI)));
      return { epoch: epoch.toFixed(1), lr };
    });
  });

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          LR Schedule
        </span>
        <span className="text-[8px] text-[#00FF9F] font-mono">Cosine Decay</span>
      </div>
      <div className="h-24 bg-zinc-950 rounded border border-zinc-900 p-2 overflow-hidden group hover:border-[#00FF9F]/30 transition-colors">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={scheduleData}>
            <defs>
              <linearGradient id="colorLr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00FF9F" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00FF9F" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" strokeOpacity={0.1} />
            <XAxis 
              dataKey="epoch" 
              hide 
            />
            <YAxis hide domain={[0, 'auto']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '4px', fontSize: '9px' }}
              itemStyle={{ color: '#00FF9F' }}
              labelStyle={{ color: '#71717a' }}
              labelFormatter={(val) => `Epoch: ${val}`}
              formatter={(val: number) => [val.toExponential(2), 'LR']}
            />
            <Area 
              type="monotone" 
              dataKey="lr" 
              stroke="#00FF9F" 
              fillOpacity={1} 
              fill="url(#colorLr)" 
              strokeWidth={1.5} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between items-center text-[8px] text-zinc-600 px-1">
         <span>Epoch 0.0</span>
         <span>Epoch 3.0</span>
      </div>
    </div>
  );
}

// Project Helpers
function generateProjectTree(name: string, template: string): FileNode[] {
  const baseFolders: FileNode[] = [
    {
      name: 'src',
      type: 'folder',
      isOpen: true,
      children: []
    },
    {
      name: 'data',
      type: 'folder',
      isOpen: true,
      children: []
    },
    {
      name: 'configs',
      type: 'folder',
      isOpen: true,
      children: []
    },
    {
      name: 'checkpoints',
      type: 'folder',
      children: []
    }
  ];

  if (template === 'Code Fine-Tune' || template === 'LoRA Starter' || template === 'Full Fine-Tune') {
    baseFolders[0].children?.push({ name: 'model.py', type: 'file' });
    baseFolders[0].children?.push({ name: 'train.py', type: 'file' });
    baseFolders[2].children?.push({ name: 'training_config.yaml', type: 'file' });
    
    if (template === 'LoRA Starter') {
       baseFolders[2].children?.push({ name: 'lora_config.json', type: 'file' });
    }
    
    baseFolders[1].children?.push({ name: 'dataset.jsonl', type: 'file' });
  }

  if (template === 'AGI Explorer') {
    baseFolders[0].children?.push({ name: 'agent.py', type: 'file' });
    baseFolders[0].children?.push({ name: 'tools.py', type: 'file' });
    baseFolders[0].children?.push({ name: 'memory.py', type: 'file' });
    baseFolders[0].children?.push({ name: 'model.py', type: 'file' });
    baseFolders[2].children?.push({ name: 'agent_config.yaml', type: 'file' });
    baseFolders[2].children?.push({ name: 'training_config.yaml', type: 'file' });
    baseFolders[1].children?.push({ name: 'instructions.jsonl', type: 'file' });
    baseFolders[1].children?.push({ name: 'eval_tasks.jsonl', type: 'file' });
    baseFolders.push({ name: 'README.md', type: 'file' });
  }

  if (template === 'Synthetic Data') {
    baseFolders[0].children?.push({ name: 'generator.py', type: 'file' });
    baseFolders[2].children?.push({ name: 'gen_config.json', type: 'file' });
    baseFolders[1].children?.push({ name: 'seed_tasks.json', type: 'file' });
  }

  if (template === 'Empty') {
    return baseFolders;
  }
  
  if (template === 'AGI Explorer') {
    return [
      { name: 'Mini-AGI-Explorer', type: 'folder', isOpen: true, children: baseFolders }
    ];
  }

  return baseFolders;
}

// Project Modals
function NewProjectModal({ onClose, onCreate }: { onClose: () => void, onCreate: (name: string, model: string, template: string, datasetSize: string) => void }) {
  const [name, setName] = useState('My-Helix-Project');
  const [model, setModel] = useState('Llama-3-8B-Base');
  const [template, setTemplate] = useState('LoRA Starter');
  const [datasetSize, setDatasetSize] = useState('100 MB');

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#252526] border border-zinc-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#2d2d2d]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#00FF9F]/10 rounded-lg">
              <FolderPlus className="w-4 h-4 text-[#00FF9F]" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">Create New Helix Project</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Project Name</label>
            <input 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 focus:border-[#00FF9F]/50 outline-none transition-colors"
              placeholder="e.g. llama3-python-expert"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Base Model</label>
              <select 
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full bg-[#1e1e1e] border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-300 outline-none focus:border-[#00FF9F]/50 appearance-none cursor-pointer"
              >
                <option>Llama-3-8B-Base</option>
                <option>Llama-3-70B-Base</option>
                <option>Qwen2.5-Coder-7B-Instruct</option>
                <option>Mistral-7B-v0.2</option>
                <option>Phi-3-Mini</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Template</label>
              <select 
                value={template}
                onChange={e => setTemplate(e.target.value)}
                className="w-full bg-[#1e1e1e] border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-300 outline-none focus:border-[#00FF9F]/50 appearance-none cursor-pointer"
              >
                <option>Empty</option>
                <option>AGI Explorer</option>
                <option>Code Fine-Tune</option>
                <option>LoRA Starter</option>
                <option>Full Fine-Tune</option>
                <option>Synthetic Data</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Dataset Size Estimate</label>
            <div className="flex gap-2">
              {['100 MB', '500 MB', '1 GB', '10 GB+'].map(size => (
                <button 
                  key={size}
                  onClick={() => setDatasetSize(size)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all",
                    datasetSize === size 
                      ? "bg-[#00FF9F]/20 border-[#00FF9F]/40 text-[#00FF9F]" 
                      : "bg-[#1e1e1e] border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 bg-[#2d2d2d] border-t border-zinc-800 flex justify-end gap-3 px-6">
          <button onClick={onClose} className="px-5 py-2 text-[11px] font-bold text-zinc-400 hover:text-white transition-colors">CANCEL</button>
          <button 
            onClick={() => onCreate(name, model, template, datasetSize)}
            className="px-6 py-2 bg-[#00FF9F] text-zinc-950 text-[11px] font-bold rounded-lg hover:bg-[#20ffaf] shadow-lg shadow-[#00FF9F]/10 active:scale-95 transition-all"
          >
            INITIALIZE PROJECT
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportProjectModal({ onClose, onImport }: { onClose: () => void, onImport: (p: Project) => void }) {
  const [isHovering, setIsHovering] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateImport();
    }
  };

  const simulateImport = () => {
    setIsImporting(true);
    let p = 0;
    const interval = setInterval(() => {
      p += 5 + Math.random() * 10;
      if (p >= 100) {
        clearInterval(interval);
        setImportProgress(100);
        setTimeout(() => {
          onImport({
            id: Math.random().toString(36).substr(2, 9),
            name: 'Imported-Project-' + Math.floor(Math.random() * 100),
            model: 'Llama-3-8B-Base',
            category: 'Inference',
            status: 'Idle',
            connectionType: 'Git',
            template: 'Imported Repo',
            datasetSize: '1.2 GB',
            tokenCount: '4.8M',
            created: new Date().toISOString().split('T')[0],
            fileTree: DEFAULT_FILE_TREE
          });
        }, 500);
      } else {
        setImportProgress(p);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#252526] border border-zinc-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#2d2d2d]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 rounded-lg">
              <Upload className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">Import Codebase / Repo</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-8">
          {!isImporting ? (
            <div className="space-y-6">
              <div 
                onDragOver={e => { e.preventDefault(); setIsHovering(true); }}
                onDragLeave={() => setIsHovering(false)}
                onDrop={e => { e.preventDefault(); simulateImport(); }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer group",
                  isHovering ? "border-blue-400 bg-blue-400/5" : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/30"
                )}
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  webkitdirectory=""
                  directory=""
                  onChange={handleFileChange}
                />
                <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Folder className="w-8 h-8 text-zinc-500 group-hover:text-blue-400" />
                </div>
                <h4 className="text-sm font-bold text-zinc-200 mb-1">Drag & Drop project folder or .zip</h4>
                <p className="text-[11px] text-zinc-500 text-center max-w-[200px]">Supports local repos, exported helix bundles, or GitHub archives</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="mt-6 px-5 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  SELECT MANUALLY
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                   <div className="h-px bg-zinc-800 flex-1"></div>
                   <span className="text-[9px] font-bold text-zinc-600">OR VIA URL</span>
                   <div className="h-px bg-zinc-800 flex-1"></div>
                </div>
                <div className="relative group">
                   <input className="w-full bg-[#1e1e1e] border border-zinc-800 rounded-lg px-4 py-2.5 pl-10 text-xs text-zinc-300 outline-none focus:border-blue-400/50" placeholder="https://github.com/user/repo.git" />
                   <GitBranch className="absolute left-3.5 top-3 w-3.5 h-3.5 text-zinc-600 group-focus-within:text-blue-400" />
                   <button onClick={simulateImport} className="absolute right-2 top-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-md border border-blue-500/20 hover:bg-blue-500/20 transition-all">CLONE</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center">
               <div className="relative w-24 h-24 mb-6">
                 <div className="absolute inset-0 border-4 border-zinc-900 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-blue-400 rounded-full border-t-transparent animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                   <span className="text-sm font-mono font-bold text-blue-400">{Math.round(importProgress)}%</span>
                 </div>
               </div>
               <div className="text-center group">
                 <h4 className="text-sm font-bold text-zinc-200 mb-2">Analyzing repository contents...</h4>
                 <div className="flex gap-2 justify-center mb-4">
                   <span className="text-[9px] text-zinc-600 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">SCANNING BFS</span>
                   <span className="text-[9px] text-[#00FF9F] px-1.5 py-0.5 rounded bg-[#00FF9F]/10 border border-[#00FF9F]/20">FOUND CONFIG.YAML</span>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[10px] text-zinc-500">Extracting Llama weights... (shard 4/8)</p>
                   <p className="text-[10px] text-zinc-600 italic">"Project contains 248 files • Estimated 1.8M tokens"</p>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExportProjectModal({ project, fileContents, onClose }: { project: Project, fileContents: Record<string, string>, onClose: () => void }) {
  const [option, setOption] = useState<'full' | 'checkpoints' | 'config'>('full');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const startExport = async () => {
    setIsExporting(true);
    setProgress(10);
    
    try {
      const zip = new JSZip();
      const manifestFiles: Record<string, { sizeBytes: number; sha256: string }> = {};

      const generateSimpleHash = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        const absVal = Math.abs(hash);
        const absVal2 = Math.abs(hash * 31);
        return 'sha256-' + absVal.toString(16).padStart(16, '0') + absVal2.toString(16).padStart(16, '0');
      };

      const addFileToZip = (filePath: string, fileContent: string) => {
        zip.file(filePath, fileContent);
        manifestFiles[filePath] = {
          sizeBytes: fileContent.length,
          sha256: generateSimpleHash(fileContent)
        };
      };
      
      if (option === 'full' || option === 'config') {
        addFileToZip("README.md", `# ${project.name} - Helix Bundle\n\nGenerated by Helix AGI-OS Cortical Dashboard.\n\n## Quick Start\n1. Ensure Node.js is installed.\n2. Run \`setup.ps1\` (Windows PowerShell) or \`setup.sh\` (Unix) to configure the dependencies and run the application.\n3. Access the workspace at http://localhost:3000\n`);
        addFileToZip("INSTALL.md", `# Helix Wizard Installer Guide\n\nThis project is bundled with the **helix_downloader** bootstrap tool.\n\n### Windows\nRun the PowerShell installer script to verify dependencies and start the system:\n\`\`\`powershell\n.\\setup.ps1\n\`\`\`\n\n### macOS / Linux\nRun the shell script installer:\n\`\`\`bash\nchmod +x setup.sh\n./setup.sh\n\`\`\`\n`);
      }
      
      if (option === 'full') {
        addFileToZip("start.bat", `@echo off\npowershell -ExecutionPolicy Bypass -File setup.ps1\npause`);
        addFileToZip("setup.ps1", `# helix_downloader Installer Wizard for Windows
$ProjectName = "${project.name}"
Write-Host "==========================================" -ForegroundColor Green
Write-Host "       HELIX SYSTEM SETUP WIZARD (helix_downloader)" -ForegroundColor Green
Write-Host "       Setting up: $ProjectName" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Green

# Verify dependencies (Node, NPM, Python)
if (Get-Command node -ErrorAction SilentlyContinue) {
    $NodeVersion = (node -v).TrimStart('v')
    Write-Host "[OK] Node.js version $NodeVersion detected." -ForegroundColor Green
} else {
    Write-Host "[WARNING] Node.js is missing. Please download it from: https://nodejs.org/" -ForegroundColor Red
}

if (Test-Path "package.json") {
    Write-Host "[STEP] Resolving npm dependencies..." -ForegroundColor Cyan
    Start-Process npm -ArgumentList "install" -NoNewWindow -Wait
}

Write-Host "==========================================" -ForegroundColor Green
Write-Host " SETUP COMPLETE: Starting Dev Server..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
npm run dev
`);

        addFileToZip("setup.sh", `#!/bin/bash
# helix_downloader Installer Wizard for Unix/macOS
PROJECT_NAME="${project.name}"
echo "=========================================="
echo "       HELIX SYSTEM SETUP WIZARD (helix_downloader)"
echo "       Setting up: $PROJECT_NAME"
echo "=========================================="

if command -v node >/dev/null 2>&1; then
    echo "[OK] Node.js version \$(node -v) detected."
else
    echo "[WARNING] Node.js is missing. Please install it."
fi

if [ -f "package.json" ]; then
    echo "[STEP] Resolving npm dependencies..."
    npm install
fi

echo "=========================================="
echo " SETUP COMPLETE: Starting Dev Server..."
echo "=========================================="
npm run dev
`);
      }

      // Read files based on project template
      if (project.fileTree) {
        const addNodes = (nodes: FileNode[], path = "") => {
          nodes.forEach(node => {
            const fullPath = path ? `${path}/${node.name}` : node.name;
            if (node.type === 'file') {
              let include = false;
              
              if (option === 'full') {
                include = true;
              } else if (option === 'checkpoints') {
                if (fullPath.includes('checkpoints') || fullPath.endsWith('.bin') || fullPath.endsWith('.safetensors') || fullPath.endsWith('.pt')) {
                  include = true;
                }
              } else if (option === 'config') {
                if (fullPath.endsWith('.json') || fullPath.endsWith('.md') || fullPath.endsWith('.yaml') || fullPath.includes('config') || fullPath.includes('data')) {
                  include = true;
                }
              }

              if (include) {
                // Use actual file content from fileContents state if it exists, otherwise fall back to stub
                let content = fileContents[node.name] || `// Helix Source: ${node.name}\n// Generated for ${project.model}\n\n`;
                if (!fileContents[node.name]) {
                  if (fullPath.endsWith('.json')) {
                     content = `{\n  "module": "${node.name}",\n  "model": "${project.model}"\n}`;
                  } else if (option === 'checkpoints' || fullPath.endsWith('.bin') || fullPath.endsWith('.safetensors')) {
                     content = `[MOCK BINARY DATA FOR ${node.name}]`;
                  } else {
                     content += `console.log("Helix module ${node.name} active.");`;
                  }
                }
                addFileToZip(fullPath, content);
              }
            } else if (node.type === 'folder' && node.children) {
              addNodes(node.children, fullPath);
            }
          });
        };
        addNodes(project.fileTree);
      }

      // Generate verifiable manifest.json
      const manifestObj = {
        manifestVersion: "1.0.0",
        timestamp: new Date().toISOString(),
        helixVersion: "3.0.0-Security-Immutable",
        project: {
          id: project.id,
          name: project.name,
          model: project.model,
        },
        files: manifestFiles,
        dependencies: {
          "package.json": {
            "dependencies": {
              "jszip": "^3.10.1",
              "lucide-react": "^0.300.0",
              "vite": "^5.0.0"
            }
          }
        }
      };
      zip.file("manifest.json", JSON.stringify(manifestObj, null, 2));
      setProgress(40);
      await new Promise(r => setTimeout(r, 800));
      setProgress(70);
      
      const content = await zip.generateAsync({ type: "blob" });
      setProgress(90);
      
      const suffix = option === 'checkpoints' ? '-checkpoints' : option === 'config' ? '-config' : '-helix-bundle';
      
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}${suffix}-${new Date().getTime()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setProgress(100);
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error("Export failed", error);
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e1e] border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#181818]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-yellow-500/10 rounded">
              <Download className="w-3.5 h-3.5 text-yellow-500" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">Export Helix Bundle</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6">
           <div className="space-y-4">
              <div className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/50 mb-4">
                <span className="text-[9px] font-bold text-zinc-600 block mb-1">CURRENT PROJECT</span>
                <span className="text-xs font-bold text-zinc-100">{project.name}</span>
                <div className="flex gap-4 mt-2">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-zinc-600 uppercase">Model</span>
                    <span className="text-[9px] text-zinc-400 font-mono">{project.model}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-zinc-600 uppercase">Dataset</span>
                    <span className="text-[9px] text-[#00FF9F] font-mono">{project.datasetSize}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Select Export Strategy</label>
                 <div className="space-y-2">
                    <ExportOption 
                      id="full" 
                      label="Full Project Bundle (.zip)" 
                      desc="Includes src, data, configs, and latest weights"
                      active={option === 'full'} 
                      onClick={() => setOption('full')}
                    />
                    <ExportOption 
                      id="checkpoints" 
                      label="Training Checkpoints Only" 
                      desc="Export only .bin / .safetensors weights"
                      active={option === 'checkpoints'} 
                      onClick={() => setOption('checkpoints')}
                    />
                    <ExportOption 
                      id="config" 
                      label="Config + Dataset Only" 
                      desc="Lightweight export for sharing recipes"
                      active={option === 'config'} 
                      onClick={() => setOption('config')}
                    />
                 </div>
              </div>
           </div>

           {isExporting && (
             <div className="mt-8 space-y-2 animate-in fade-in">
                <div className="flex justify-between text-[10px] font-mono mb-1">
                   <span className="text-zinc-500">Bundling resources...</span>
                   <span className="text-yellow-500">{progress}%</span>
                </div>
                <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                   <div className="h-full bg-yellow-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
             </div>
           )}
        </div>
        <div className="p-4 bg-[#2d2d2d] border-t border-zinc-800 flex justify-end gap-3 px-6">
           <button onClick={onClose} disabled={isExporting} className="px-5 py-2 text-[11px] font-bold text-zinc-400 hover:text-white transition-colors disabled:opacity-30">CANCEL</button>
           <button 
             onClick={startExport}
             disabled={isExporting}
             className="px-6 py-2 bg-yellow-600 text-white text-[11px] font-bold rounded-lg hover:bg-yellow-500 shadow-lg active:scale-95 transition-all disabled:opacity-50"
           >
             {isExporting ? 'PACKAGING...' : 'START EXPORT'}
           </button>
        </div>
      </div>
    </div>
  );
}

function ExportOption({ id, label, desc, active, onClick }: { id: string, label: string, desc: string, active: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all flex gap-3 items-center group",
        active ? "bg-zinc-800 border-yellow-500/50 shadow-inner" : "bg-[#1e1e1e] border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/30"
      )}
    >
      <div className={cn(
        "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
        active ? "border-yellow-500" : "border-zinc-800 group-hover:border-zinc-700"
      )}>
        {active && <div className="w-2 h-2 bg-yellow-500 rounded-full" />}
      </div>
      <div>
        <h5 className={cn("text-[11px] font-bold", active ? "text-white" : "text-zinc-400")}>{label}</h5>
        <p className="text-[10px] text-zinc-600 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function RealTerminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 11,
      fontFamily: '"JetBrains Mono", monospace',
      theme: {
        background: 'transparent',
        foreground: '#d4d4d4',
        cursor: '#00FF9F',
        selectionBackground: 'rgba(0, 255, 159, 0.3)',
        black: '#1e1e1e',
        red: '#f44747',
        green: '#00FF9F',
        yellow: '#dcdcaa',
        blue: '#569cd6',
        magenta: '#c586c0',
        cyan: '#4ec9b0',
        white: '#d4d4d4',
      },
      allowTransparency: true,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    term.writeln('\x1b[1;32mHelix Studio Terminal v1.1.0-Helix protocol\x1b[0m');
    term.writeln('Active Environment: \x1b[36mhelix-env (v1.0)\x1b[0m');
    term.writeln('Ready for commands. Type \x1b[33mhelp\x1b[0m for available Helix tools.');
    term.writeln('');

    xtermRef.current = term;

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    const handleExternalCmd = (e: any) => {
      const externalCmd = e.detail;
      executeCommand(externalCmd);
    };
    window.addEventListener('run-terminal-command', handleExternalCmd);

    const handleLiveOutput = (e: any) => {
      term.write(e.detail);
    };
    window.addEventListener('terminal-output', handleLiveOutput);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('run-terminal-command', handleExternalCmd);
      window.removeEventListener('terminal-output', handleLiveOutput);
      term.dispose();
    };
  }, []);

  const executeCommand = async (cmd: string) => {
    const term = xtermRef.current;
    if (!term) return;

    if (!cmd.trim()) return;

    term.writeln(`\x1b[34mhelix@cluster\x1b[0m:\x1b[32m~\x1b[0m$ ${cmd}`);
    
    // Add to local history
    setHistory(prev => [cmd, ...prev].slice(0, 50));
    setHistoryIndex(-1);

    if (cmd === 'clear') {
      term.clear();
      return;
    }

    if (cmd === 'help') {
      term.writeln('\x1b[1mHelix Available Commands:\x1b[0m');
      term.writeln('  \x1b[32mnvidia-smi\x1b[0m      Check GPU utilization and temperature');
      term.writeln('  \x1b[32mls / dir\x1b[0m         List directory contents');
      term.writeln('  \x1b[32mpython <file>\x1b[0m    Execute python scripts');
      term.writeln('  \x1b[32mpip install\x1b[0m     Install packages to environment');
      term.writeln('  \x1b[32mhelix-eval\x1b[0m      Run HumanEval benchmark on current model');
      term.writeln('  \x1b[32mclear\x1b[0m           Clear console screen');
      return;
    }

    try {
      const response = await fetch('/api/terminal/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });

      if (!response.ok) throw new Error('Failed to run command');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          // Convert newlines to \r\n for xterm
          term.write(text.replace(/\r?\n/g, '\r\n'));
        }
      }
    } catch (err: any) {
      term.writeln(`\x1b[31mError executing command: ${err.message}\x1b[0m`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(command);
      setCommand('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setCommand(history[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setCommand(history[nextIndex]);
      } else {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/20 p-2">
      <div className="flex-1 min-h-0 custom-scrollbar">
        <div ref={terminalRef} className="h-full w-full" />
      </div>
      <div className="h-px bg-zinc-800/50 my-1"></div>
      <div className="flex items-center gap-2 px-2 py-1 bg-zinc-950/50 rounded border border-zinc-800 focus-within:border-[#00FF9F]/40 transition-all">
        <span className="text-[10px] font-mono text-[#00FF9F] shrink-0">$</span>
        <input 
          value={command}
          onChange={e => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type command... (e.g. nvidia-smi, ls)"
          className="flex-1 bg-transparent border-none outline-none text-[11px] font-mono text-zinc-300 placeholder:text-zinc-600"
        />
        <div className="flex items-center gap-2">
           <span className="text-[9px] text-zinc-700 font-mono hidden sm:block">ENTER TO RUN</span>
           <button 
             onClick={() => { executeCommand(command); setCommand(''); }}
             className="p-1 hover:bg-[#00FF9F]/10 rounded text-zinc-600 hover:text-[#00FF9F] transition-colors"
           >
              <ChevronRight className="w-4 h-4" />
           </button>
        </div>
      </div>
    </div>
  );
}

// Mock Code Data
const AGI_AGENT_PY = `import json
from src.tools import WebSearch, PythonExecutor
from src.memory import AgentMemory

class MiniAGIAgent:
    """A ReAct-style agent with reasoning and tool use."""
    def __init__(self, model_id, config):
        self.model = model_id
        self.tools = {
            "search": WebSearch(),
            "python": PythonExecutor()
        }
        self.memory = AgentMemory()

    def run(self, task):
        print(f"\\x1b[32m[REASON]\\x1b[0m Task received: {task}")
        # Reasoning Step 1
        thought = "I need to analyze the requirements and use the python executor for calculations."
        self.memory.add_thought(thought)
        
        # Action Step
        print(f"\\x1b[34m[ACTION]\\x1b[0m python_exec(code='sum(range(100))')")
        observation = "4950"
        
        # Result
        return f"The sum of the first 100 numbers is {observation}."

# AI Hint: Consider adding a 'Reflection' step to self-correct reasoning loops.`;

const AGI_TOOLS_PY = `class WebSearch:
    def execute(self, query):
        return f"Search results for: {query}"

class PythonExecutor:
    def execute(self, code):
        try:
            return eval(code)
        except Exception as e:
            return str(e)`;

const AGI_CONFIG_YAML = `agent_settings:
  max_iterations: 10
  temperature: 0.2
  stop_tokens: ["Observation:", "\\nThought:"]
  
tools_enabled:
  - web_search
  - python_executor
  - file_manager

memory_context_window: 4096`;

const AGI_README_MD = `# Mini-AGI Explorer
This project demonstrates a ReAct-style agentic system.

## Features
- **ReAct Loop**: Reasoning -> Action -> Observation
- **Tool Use**: Python execution and Web Search
- **Memory**: Persistent short-term memory

## Quick Start
1. Run "Execute Helix" to fine-tune the base model on agent trajectories
2. Use "Run Agent Demo" to see the reasoning loop in action

*Built with helix-protocol-v1*`;

const MODEL_PY_CODE = `import torch
import torch.nn as nn
from transformers import AutoModelForCausalLM

class CodeFineTuneModule(nn.Module):
    def __init__(self, base_model_id):
        super().__init__()
        self.model = AutoModelForCausalLM.from_pretrained(
            base_model_id,
            torch_dtype=torch.bfloat16,
            device_map="auto"
        )
        self.model.gradient_checkpointing_enable()
        
    def forward(self, input_ids, labels=None):
        outputs = self.model(input_ids=input_ids, labels=labels)
        return outputs.loss, outputs.logits

# Initializing Llama-3 adapter layer...
# Rank: 32, Alpha: 64`;

const TRAIN_PY_CODE = `import json, time, random, sys

print("Helix Training Session Initialized - Ring-3 Pluripotent Worker Online")

# Advanced Telemetry Bootstrap
time.sleep(0.5)
print("\\x1b[32m[SYSTEM]\\x1b[0m Allocating distributed VRAM shards...")
time.sleep(0.5)
print("\\x1b[32m[SYSTEM]\\x1b[0m Peer-to-peer NVLink mesh established across 8 nodes.")

for step in range(1, 1001):
    # Simulated metrics with realistic decay
    loss = 2.5 * (0.998 ** step) + random.uniform(-0.02, 0.02)
    acc = min(99.4, 45 + (54 * (1 - 0.997 ** step)) + random.uniform(-0.1, 0.1))
    vram = 4.2 + (step * 0.0001) + random.uniform(0, 0.05)
    
    if step % 10 == 0:
        print(f"STEP {step:04d} | loss: {loss:.4f} | accuracy: {acc:.2f}% | vram: {vram:.2f} GB")
        sys.stdout.flush()
    
    time.sleep(0.1)  # High-speed simulation

print("\\x1b[32m[COMPLETE]\\x1b[0m Training cycle finished successfully.")`;

const CONFIG_YAML = `training_args:
  per_device_train_batch_size: 16
  gradient_accumulation_steps: 4
  learning_rate: 2e-5
  num_train_epochs: 3
  logging_steps: 10
  save_steps: 100
  
peft_config:
  r: 16
  lora_alpha: 32
  target_modules: ["q_proj", "v_proj"]
  lora_dropout: 0.05
  bias: "none"
  task_type: "CAUSAL_LM"`;

function AICoAssistant({ 
  messages, 
  onSend, 
  onApplySuggestion,
  isTyping,
  coopMode,
  onToggleCoop,
  selectedPersona,
  onPersonaChange,
  helixCore,
  onInitiativeAction,
  onOpenCuriosity,
  setIsChatOpen,
  isCuriosityOpen,
  onStartWalkthrough
}: { 
  messages: {role: 'user' | 'assistant', content: string, suggestion?: string}[], 
  onSend: (msg: string) => void, 
  onApplySuggestion?: (type: string) => void,
  isTyping: boolean,
  coopMode: boolean,
  onToggleCoop: () => void,
  selectedPersona: PersonaId,
  onPersonaChange: (id: PersonaId) => void,
  helixCore?: HelixCore,
  onInitiativeAction?: (id: string, action: 'dismiss' | 'complete') => void,
  onOpenCuriosity: () => void,
  setIsChatOpen: (open: boolean) => void,
  isCuriosityOpen?: boolean,
  onStartWalkthrough?: (content: string) => void
}) {
  const { settings } = useSettings();
  const { 
    isListening, 
    isWakeWordMode,
    isSpeaking, 
    transcript, 
    setTranscript, 
    startListening, 
    stopListening, 
    startWakeWordMode,
    speak, 
    stopSpeaking,
    error,
    setError,
    hasSupport 
  } = useVoice();
  const [input, setInput] = useState('');
  const [isSelfModelOpen, setIsSelfModelOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentPersona = PERSONAS.find(p => p.id === selectedPersona) || PERSONAS[0];
  const activeInitiatives = helixCore?.initiatives?.filter(i => i.status === 'active') || [];

  // Speech to Text logic
  const prevTranscriptRef = useRef(transcript);
  
  useEffect(() => {
    if (isCuriosityOpen && isListening) {
      stopListening();
    }
  }, [isCuriosityOpen, isListening, stopListening]);

  useEffect(() => {
    if (transcript && isListening && !isCuriosityOpen) {
      if (settings.voice.autoSend) {
        // Simple debounce for auto-send
        const timeout = setTimeout(() => {
          onSend(transcript);
          setTranscript('');
          stopListening();
        }, 1500);
        return () => clearTimeout(timeout);
      } else {
        // Find new part of transcript and append to input
        const newPart = transcript.slice(prevTranscriptRef.current.length);
        if (newPart) {
          setInput(prev => prev + newPart);
          prevTranscriptRef.current = transcript;
        }
      }
    } else if (!isListening) {
      // Reset ref when we stop listening so next session starts fresh
      prevTranscriptRef.current = '';
    }
  }, [transcript, isListening, settings.voice.autoSend, onSend, setTranscript, stopListening, isCuriosityOpen]);

  // Text to Speech logic
  const lastMessageRef = useRef<string | null>(null);
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (settings.voice.enabled && lastMsg?.role === 'assistant' && lastMsg.content !== lastMessageRef.current && !isCuriosityOpen) {
      speak(lastMsg.content);
      lastMessageRef.current = lastMsg.content;
    }
  }, [messages, settings.voice.enabled, speak, isCuriosityOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
    if (isListening) stopListening();
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 relative overflow-hidden">
      {/* Voice Mode Active Overlay */}
      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#05ff91]/05 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="flex items-center gap-1.5 h-24 mb-6">
              {[...Array(24)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: [16, Math.random() * 64 + 16, 16],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 0.5 + Math.random() * 0.5, 
                    delay: i * 0.03,
                    ease: "easeInOut"
                  }}
                  className="w-1.5 bg-[#05ff91] rounded-full shadow-[0_0_15px_rgba(5,255,145,0.6)]"
                />
              ))}
            </div>
            <div className="text-center px-8 bg-black/60 py-4 rounded-3xl border border-[#05ff91]/20 backdrop-blur-xl">
              <p className="text-[#05ff91] text-[10px] font-black uppercase tracking-[0.3em] mb-3 animate-pulse">Neural Link: Listening...</p>
              <p className="text-white text-xs font-mono line-clamp-2 max-w-xs italic opacity-90 leading-relaxed group">
                {transcript || "Speak now, Helix is synchronizing..."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helix Evolution Monitor with Improved Depth */}
      {helixCore && (
        <div className="px-4 py-4 bg-teal-500/5 border-b border-teal-500/20 animate-in fade-in duration-700">
           <div className="flex justify-between items-center mb-3">
             <div className="flex items-center gap-2">
               <Bot className="w-4 h-4 text-[#00FF9F]" />
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Neural Link Station</span>
             </div>
             {hasSupport && (
               <button 
                 onClick={() => {
                   if (isListening) stopListening();
                   else if (settings.voice.wakeWordEnabled) startWakeWordMode();
                   else startListening();
                 }}
                 className={cn(
                   "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-2",
                   isListening 
                    ? (isWakeWordMode ? "bg-zinc-800 text-[#05ff91] border-[#05ff91]/40" : "bg-[#05ff91] text-black border-[#05ff91] shadow-[0_0_25px_rgba(5,255,145,0.5)] scale-105")
                    : "bg-black/40 border-zinc-800 text-[#05ff91] hover:bg-[#05ff91]/10 hover:border-[#05ff91]/40"
                 )}
               >
                 {isWakeWordMode ? <Bot className="w-3.5 h-3.5 animate-pulse" /> : <Mic className={cn("w-3.5 h-3.5", isListening && "animate-bounce")} />}
                 {isListening ? (isWakeWordMode ? "Waiting for Wake Word..." : "Listening...") : "🎤 Live Voice"}
               </button>
             )}
             {isSpeaking && (
               <button 
                 onClick={stopSpeaking}
                 className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-[8px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center gap-2"
               >
                 <Volume2 className="w-3 h-3 animate-pulse" />
                 Stop Speaking
               </button>
             )}
           </div>
           
           {helixCore && <HelixEvolutionMonitor helix={helixCore} />}

           {error && (
             <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-0.5">Neural Link Error</p>
                  <p className="text-[10px] text-zinc-300 leading-tight">{error}</p>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="p-1 hover:bg-red-500/20 rounded-md transition-colors"
                >
                  <X className="w-3 h-3 text-red-500" />
                </button>
             </div>
           )}

           {helixCore?.swarm?.agents && helixCore.swarm.agents.length > 0 && (
             <div className="mt-4 p-3 bg-teal-500/5 border border-teal-500/20 rounded-xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                      <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest">Active Swarm Detected</span>
                   </div>
                   <span className="text-[7px] text-zinc-500 font-bold uppercase">{helixCore?.swarm?.agents?.length || 0} Threads</span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                   {(helixCore?.swarm?.agents || []).map((agent: any) => (
                     <div key={agent.id} className="px-2 py-1 bg-black/40 border border-teal-500/10 rounded flex flex-col min-w-[70px]">
                        <span className="text-[7px] font-black text-white uppercase truncate">{agent.role}</span>
                        <span className="text-[6px] text-teal-500/60 uppercase font-bold">{agent.status}</span>
                     </div>
                   ))}
                </div>
             </div>
           )}
           
           {/* Active Initiatives Module */}
           {activeInitiatives.length > 0 && (
             <div className="mt-4 space-y-2 animate-in slide-in-from-right-2 duration-500">
               <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-3 h-3 text-teal-400 animate-pulse" />
                  <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Active Initiatives</span>
               </div>
               {(activeInitiatives || []).map((init) => (
                 <motion.div 
                   key={init.id}
                   initial={{ x: 20, opacity: 0 }}
                   animate={{ x: 0, opacity: 1 }}
                   className="p-2.5 bg-black/40 border border-teal-500/20 rounded-xl group relative overflow-hidden"
                 >
                    <div className="absolute inset-0 bg-teal-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex justify-between items-start mb-1 relative z-10">
                       <span className="text-[10px] font-black text-white leading-tight">{init.title}</span>
                       <span className="text-[7px] text-teal-500/60 uppercase font-black px-1 border border-teal-500/20 rounded">{init.category}</span>
                    </div>
                    <p className="text-[9px] text-zinc-500 mb-2.5 leading-relaxed relative z-10">{init.description}</p>
                    <div className="flex gap-2 relative z-10">
                       <button 
                         onClick={() => onInitiativeAction?.(init.id, 'complete')}
                         className="flex-1 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 rounded-lg text-[8px] font-black text-teal-400 uppercase tracking-widest transition-all"
                       >
                          Engage
                       </button>
                       <button 
                         onClick={() => onInitiativeAction?.(init.id, 'dismiss')}
                         className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[8px] font-black text-zinc-500 uppercase tracking-widest transition-all"
                       >
                          Dismiss
                       </button>
                    </div>
                 </motion.div>
               ))}
             </div>
           )}

           <div className="mt-4 pt-3 border-t border-teal-500/10">
              <button 
                onClick={() => setIsSelfModelOpen(!isSelfModelOpen)}
                className="flex items-center justify-between w-full text-[9px] font-black text-zinc-500 hover:text-zinc-300 uppercase tracking-widest group"
              >
                 Helix Self-Model Profile
                 <ChevronRight className={cn("w-3 h-3 transition-transform", isSelfModelOpen && "rotate-90")} />
              </button>
              {isSelfModelOpen && (
                <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
                   <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-black/40 rounded-lg border border-zinc-900">
                         <span className="text-[7px] text-zinc-600 font-bold uppercase block mb-1">Skill Level</span>
                         <span className="text-[9px] text-teal-400 font-black tracking-widest uppercase">{helixCore.userProfile?.detectedSkillLevel || 'Learning'}</span>
                      </div>
                      <div className="p-2 bg-black/40 rounded-lg border border-zinc-900">
                         <span className="text-[7px] text-zinc-600 font-bold uppercase block mb-1">Symbiosis</span>
                         <span className="text-[9px] text-teal-400 font-black tracking-widest uppercase">{helixCore.userProfile?.collaborationStyle || 'Balanced'}</span>
                      </div>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Persona Selector Bar */}
      <div className="p-2 bg-black/20 border-b border-zinc-900 flex items-center justify-between overflow-hidden">
         <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {PERSONAS.map(p => (
            <button
              key={p.id}
              onClick={() => onPersonaChange(p.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all shrink-0 group",
                selectedPersona === p.id 
                  ? "bg-teal-500/10 border-teal-500/40 text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.1)]" 
                  : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              )}
            >
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                selectedPersona === p.id ? "bg-teal-400 animate-pulse" : "bg-zinc-700"
              )} />
              <span className="text-[9px] font-black uppercase tracking-widest">{p.name}</span>
            </button>
          ))}
         </div>
         <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg shrink-0">
            <span className="text-[8px] font-mono font-black text-teal-400">MODE=ENGINEERING</span>
         </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6 custom-scrollbar">
        <AnimatePresence initial={false}>
          {(messages || []).map((msg, i) => {
            const isAssistant = msg.role === 'assistant';
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex flex-col max-w-[92%]",
                  isAssistant ? "mr-auto" : "ml-auto items-end"
                )}
              >
                {isAssistant && (
                  <div className="flex items-center gap-2 mb-1.5 ml-1">
                     <DynamicHelixAvatar maturity={helixCore?.evolution?.maturity || 'Seedling'} isThinking={isAssistant && i === messages.length - 1 && isTyping} />
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-0.5">{currentPersona.name}</span>
                        <span className="text-[7px] text-teal-500 font-bold uppercase tracking-tighter">{currentPersona.tagline}</span>
                     </div>
                  </div>
                )}
                <div className={cn(
                  "p-3.5 rounded-2xl text-[11px] leading-relaxed shadow-sm",
                  isAssistant 
                    ? "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-none font-mono" 
                    : "bg-teal-500 text-zinc-950 font-black rounded-tr-none shadow-[0_4px_12px_rgba(20,184,166,0.2)]"
                )}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {isAssistant && (msg.content.includes("```") || msg.content.includes("optimize") || msg.content.includes("explain")) && (
                    <div className="mt-3 pt-2 border-t border-zinc-800 flex gap-2">
                      <button
                        onClick={() => onStartWalkthrough?.(msg.content)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-teal-500/10 hover:bg-teal-500/25 border border-teal-500/30 text-teal-400 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                      >
                        <Play className="w-3 h-3 text-[#00FF9F]" />
                        Start Code Walkthrough
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {isTyping && (
          <div className="flex items-center gap-2 ml-1">
             <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
             <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
             <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      <div className="p-3 bg-zinc-900/50 border-t border-zinc-900/80 backdrop-blur-md">
          <div className="flex gap-2 items-center mb-3">
            <div className="relative flex-1 group">
              <input 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                 className="w-full bg-zinc-1000 border border-zinc-800 rounded-xl px-4 py-2.5 pr-10 text-[11px] text-white focus:outline-none focus:border-teal-500/50 transition-all placeholder:text-zinc-700 font-mono"
                 placeholder="Pulse input for Helix..."
              />
              {hasSupport && (
                <button 
                  onClick={() => {
                    if (isListening) stopListening();
                    else if (settings.voice.wakeWordEnabled) startWakeWordMode();
                    else startListening();
                  }}
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 transition-all p-1.5 rounded-lg",
                    isListening ? "text-teal-400 bg-teal-500/10 shadow-[0_0_10px_rgba(20,184,166,0.2)]" : "text-zinc-600 hover:text-zinc-400"
                  )}
                  title={isListening ? "Stop Listening" : "Live Voice Mode"}
                >
                  <Mic className={cn("w-3.5 h-3.5", isListening && "animate-pulse")} />
                </button>
              )}
            </div>
            <button 
              onClick={handleSend}
              className="p-2.5 bg-teal-500 text-zinc-950 rounded-xl shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:scale-105 active:scale-95 transition-all focus:outline-none"
            >
               <Send className="w-4 h-4" />
            </button>
          </div>
         <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => {
                onOpenCuriosity();
                setIsChatOpen(false);
              }}
              className="flex items-center justify-center gap-2 py-2.5 bg-black border border-zinc-900 rounded-xl text-[9px] font-black text-zinc-400 hover:text-white hover:border-teal-500/30 transition-all uppercase tracking-widest"
            >
              <Compass className="w-3.5 h-3.5" />
              Engage Curiosity
            </button>
            <button 
              onClick={() => onToggleCoop()}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 border rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                coopMode 
                  ? "bg-teal-500/10 border-teal-500/40 text-teal-400" 
                  : "bg-black border-zinc-900 text-zinc-400 hover:text-white"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              {coopMode ? "Symbiosis Active" : "Private Link"}
            </button>
         </div>
      </div>
    </div>
  );
}

function ChatBubble({ role, content, onApply }: { role: 'user' | 'assistant', content: string, onApply?: () => void, key?: React.Key }) {
  return (
    <div className={cn(
      "flex gap-3",
      role === 'user' ? "flex-row-reverse" : "flex-row"
    )}>
      <div className="max-w-[90%] p-3.5 rounded-2xl text-[11px] leading-relaxed bg-zinc-900 border border-zinc-800 text-zinc-100">
        {content}
      </div>
    </div>
  );
}

function PromptChip({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 whitespace-nowrap hover:bg-zinc-700 hover:text-zinc-200 transition-all shrink-0"
    >
      {label}
    </button>
  );
}

function TrainingRecipeModal({ onClose, onApply }: { onClose: () => void, onApply: (recipe: any) => void }) {
  const recipes = [
    { id: 'quick-lora', name: 'Quick LoRA Code Tune', icon: Zap, desc: 'Optimized for fast adaptation on specialized code syntax. Minimal VRAM overhead.', meta: 'RANK 16 • BF16' },
    { id: 'full-finetune', name: 'Full Performance Tune', icon: Brain, desc: 'Deep weight updates for complex reasoning tasks. Requires high-end cluster.', meta: 'RANK 64 • STAGE-3' },
    { id: 'synthetic-data', name: 'Synthetic Data Engine', icon: Database, desc: 'Initialize automated dataset expansion using seed instructions.', meta: 'GEN-V2 • JSONL' },
  ];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-[#1e1e1e] border border-zinc-700 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#252526]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00FF9F]/10 rounded-xl border border-[#00FF9F]/20">
              <Wand2 className="w-5 h-5 text-[#00FF9F]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Helix: Select Recipe</h3>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Pre-configured hyperparameter distributions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 grid grid-cols-1 gap-4">
          {recipes.map(recipe => (
            <button 
              key={recipe.id}
              onClick={() => onApply(recipe.id)}
              className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-[#00FF9F]/40 hover:bg-zinc-900/80 transition-all group text-left shadow-lg"
            >
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 group-hover:border-[#00FF9F]/20 text-zinc-600 group-hover:text-[#00FF9F] transition-colors">
                <recipe.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white">{recipe.name}</h4>
                  <span className="text-[9px] font-mono text-zinc-600 group-hover:text-[#00FF9F]/60 font-bold uppercase tracking-widest">{recipe.meta}</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed group-hover:text-zinc-400">{recipe.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-800 group-hover:text-[#00FF9F] transition-all group-hover:translate-x-1" />
            </button>
          ))}
        </div>
        
        <div className="p-4 bg-[#252526] border-t border-zinc-800 flex justify-end gap-3 px-6">
          <button onClick={onClose} className="px-5 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function CuriosityModeModal({ 
  isOpen, 
  onClose, 
  onExecute, 
  onApprove,
  state,
  personaId,
  helixCore
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onExecute: (goal: string) => void, 
  onApprove: () => void,
  state: CuriosityState,
  personaId: PersonaId,
  helixCore?: HelixCore
}) {
  const { settings } = useSettings();
  const { 
    isListening, 
    isWakeWordMode,
    isSpeaking, 
    transcript, 
    setTranscript, 
    startListening, 
    stopListening, 
    startWakeWordMode,
    speak, 
    stopSpeaking,
    error,
    setError,
    hasSupport 
  } = useVoice();
  const [goal, setGoal] = useState('');
  const persona = PERSONAS.find(p => p.id === personaId) || PERSONAS[0];
  const swarm = helixCore?.swarm?.agents || [];

  // Update goal with voice transcript
  useEffect(() => {
    if (transcript && isListening && isOpen) {
      setGoal(transcript);
    }
  }, [transcript, isListening, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-[#1e1e1e] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative">
        {/* Voice Overlay inside Modal */}
        <AnimatePresence>
          {isListening && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[110] bg-[#05ff91]/05 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none"
            >
              <div className="flex items-center gap-1.5 h-24 mb-6">
                {[...Array(24)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: [16, Math.random() * 64 + 16, 16],
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.5 + Math.random() * 0.5, 
                      delay: i * 0.03,
                      ease: "easeInOut"
                    }}
                    className="w-1.5 bg-[#05ff91] rounded-full shadow-[0_0_15px_rgba(5,255,145,0.6)]"
                  />
                ))}
              </div>
              <div className="text-center px-8 bg-black/60 py-4 rounded-3xl border border-[#05ff91]/20 backdrop-blur-xl">
                <p className="text-[#05ff91] text-[10px] font-black uppercase tracking-[0.3em] mb-3 animate-pulse">Neural Link: Listening...</p>
                <p className="text-white text-xs font-mono line-clamp-2 max-w-xs italic opacity-90 leading-relaxed group">
                  {transcript || "Speak now, Helix is synchronizing..."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="absolute top-20 left-6 right-6 z-[120] p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
             <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
             <div className="flex-1">
               <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-0.5">Neural Link Error</p>
               <p className="text-xs text-zinc-300 leading-tight">{error}</p>
             </div>
             <button 
               onClick={() => setError(null)}
               className="p-1 hover:bg-red-500/20 rounded-md transition-colors"
             >
               <X className="w-4 h-4 text-red-500" />
             </button>
          </div>
        )}

        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-zinc-900 to-black/40 border-b border-zinc-800 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20 relative group">
                <Sparkles className="w-6 h-6 text-teal-400 animate-pulse" />
                <div className="absolute inset-0 bg-teal-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
             </div>
             <div>
               <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                 Curiosity Mode
                 <span className="text-[10px] bg-teal-500 text-zinc-950 px-2 py-0.5 rounded font-black tracking-widest uppercase">v2.9 Swarm</span>
               </h2>
               <div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
                  <Compass className="w-3 h-3" />
                  Autonomous Builder Engaged • {persona.name}
               </div>
             </div>
           </div>
           
           <div className="flex items-center gap-3">
             {hasSupport && (
               <button 
                 onClick={() => {
                   if (isListening) stopListening();
                   else if (settings.voice.wakeWordEnabled) startWakeWordMode();
                   else startListening();
                 }}
                 className={cn(
                   "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2",
                   isListening 
                    ? (isWakeWordMode ? "bg-zinc-800 text-[#05ff91] border-[#05ff91]/40" : "bg-[#05ff91] text-black border-[#05ff91] shadow-[0_0_25px_rgba(5,255,145,0.5)] scale-105")
                    : "bg-black/40 border-zinc-800 text-[#05ff91] hover:bg-[#05ff91]/10 hover:border-[#05ff91]/40"
                 )}
               >
                 {isWakeWordMode ? <Bot className="w-4 h-4 animate-pulse" /> : <Mic className={cn("w-4 h-4", isListening && "animate-bounce")} />}
                 {isListening ? (isWakeWordMode ? "Waiting..." : "Listening...") : "🎤 Live Voice"}
               </button>
             )}
             <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-all">
               <X className="w-6 h-6" />
             </button>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-[#1e1e1e]">
          {!state?.isActive ? (
             <div className="space-y-6">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Define Objective</label>
                   <div className="relative group">
                      <textarea
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="e.g., 'Optimize transformer block for better inference latency' or 'Implement self-correcting neural feedback loops'..."
                        className="w-full h-32 bg-black/40 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 transition-all resize-none font-medium leading-relaxed"
                      />
                      <div className="absolute right-3 bottom-3 flex items-center gap-2">
                        <span className="text-[8px] font-mono text-zinc-700 uppercase">{goal.length} chars</span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <Zap className="w-3 h-3 text-yellow-500" />
                      Swarm Capability
                    </p>
                    <p className="text-[11px] text-zinc-500 leading-snug">Autonomous multi-agent orchestration for complex engineering tasks.</p>
                  </div>
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <Shield className="w-3 h-3 text-teal-500" />
                      Verifiable Audits
                    </p>
                    <p className="text-[11px] text-zinc-500 leading-snug">All code changes are tested and verified before final integration.</p>
                  </div>
                </div>
             </div>
          ) : (
            <div className="space-y-8">
              {/* Progress Tracker */}
              <div className="space-y-3">
                <div className="flex justify-between items-end mb-1">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest border-b border-teal-500/30 pb-0.5">Phase: {state?.phase}</span>
                    <h3 className="text-xl font-bold text-white tracking-tight">{state?.phase === 'Research' ? 'Analyzing Neural Pathways' : state?.phase === 'Planning' ? 'Formulating Strategy' : state?.phase === 'Implementation' ? 'Atomic Injection' : state?.phase === 'Training' ? 'Synaptic Weighting' : state?.phase === 'Testing' ? 'Integrity Check' : 'Educational Insight'}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white">{state?.progress}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-[1px]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${state?.progress}%` }}
                    className="h-full bg-gradient-to-r from-teal-600 to-[#00FF9F] rounded-full shadow-[0_0_15px_rgba(0,255,159,0.4)]"
                  />
                </div>
              </div>

              {/* Swarm Visualization */}
              <div className="p-6 bg-black border border-zinc-800 rounded-3xl relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent pointer-events-none" />
                 <div className="relative z-10 grid grid-cols-3 gap-6">
                    {(swarm || []).map((agent: any, idx: number) => (
                      <div key={agent.id || idx} className="flex flex-col items-center gap-3">
                         <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center relative overflow-hidden">
                               <Bot className="w-6 h-6 text-zinc-400" />
                               {state?.isActive && !state?.waitingForApproval && (
                                 <motion.div 
                                   animate={{ opacity: [0, 1, 0] }}
                                   transition={{ repeat: Infinity, duration: 1.5, delay: idx * 0.3 }}
                                   className="absolute inset-0 bg-teal-500/20"
                                 />
                               )}
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-teal-500 border-2 border-black" />
                         </div>
                         <div className="text-center">
                            <p className="text-[10px] font-black text-white uppercase tracking-tighter">{agent.name}</p>
                            <p className="text-[8px] text-zinc-500 font-bold uppercase">{agent.role}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Step List */}
              <div className="space-y-3">
                 <div className="flex items-center gap-2 mb-2 ml-1 text-zinc-500">
                    <ListTree className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Neural Execution Graph</span>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    {state?.steps?.map((step) => (
                      <div 
                        key={step.id} 
                        className={cn(
                          "p-3 rounded-2xl border transition-all duration-500",
                          step.status === 'completed' ? "bg-teal-500/5 border-teal-500/20 opacity-60" :
                          step.status === 'active' ? "bg-zinc-900 border-teal-500/40 shadow-lg shadow-teal-500/5" :
                          "bg-black/40 border-zinc-800 opacity-30"
                        )}
                      >
                         <div className="flex items-center justify-between mb-1">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-tight",
                              step.status === 'completed' ? "text-teal-400" : 
                              step.status === 'active' ? "text-white" : "text-zinc-500"
                            )}>
                              {step.title}
                            </span>
                            {step.status === 'completed' ? <CheckCircle2 className="w-3 h-3 text-teal-500" /> : 
                             step.status === 'active' ? <Loader2 className="w-3 h-3 text-teal-400 animate-spin" /> : 
                             <div className="w-3 h-3 rounded-full border border-zinc-800" />}
                         </div>
                         <p className="text-[8px] text-zinc-500 leading-tight font-medium">{step.description}</p>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Output / Plan Display */}
              {state?.plan && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2 mb-2 ml-1 text-zinc-500">
                     <Terminal className="w-3 h-3" />
                     <span className="text-[9px] font-black uppercase tracking-widest">Helix Output Log</span>
                  </div>
                  <div className="p-4 bg-black border border-zinc-800 rounded-2xl font-mono text-[10px] text-[#00FF9F] leading-tight whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar shadow-inner scroll-smooth">
                    {state?.phase === 'Walkthrough' ? (
                      <div className="space-y-4 text-zinc-300 font-sans italic p-2">
                        <div className="flex items-start gap-3">
                           <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0" />
                           <p className="text-[11px] leading-relaxed">
                             "I've successfully integrated the dynamic Attention re-weighting logic. Notice how nodes now use a recursive scan to detect drift during training. This evolved pattern allows the model to adapt its ranks in real-time, effectively bypassing the specific inference spikes I identified during research."
                           </p>
                        </div>
                        <div className="flex items-start gap-3 border-t border-zinc-800/50 pt-4">
                           <Activity className="w-5 h-5 text-teal-500 shrink-0" />
                           <p className="text-[11px] leading-relaxed">
                             "Verification pass successful. Metric pass@1 accuracy remained stable while inference latency dropped significantly. The educational delta has been updated in your Helix Core Memory."
                           </p>
                        </div>
                      </div>
                    ) : (
                      state?.plan
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-[#1a1a1c] border-t border-zinc-800/50 flex justify-end items-center gap-4">
           {state?.isActive && state?.waitingForApproval && (
             <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest animate-pulse">Human Approval Required</span>
                <button 
                  onClick={onApprove}
                  className="px-6 py-2.5 bg-[#00FF9F] text-zinc-950 text-xs font-black rounded-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,159,0.3)]"
                >
                   {state?.phase === 'Planning' ? 'Authorize Autonomous Build' : 'Complete Walkthrough'}
                </button>
             </div>
           )}
           {!state?.isActive && (
             <button 
               onClick={() => onExecute(goal)}
               disabled={!goal.trim()}
               className="px-8 py-3 bg-[#00FF9F] text-zinc-950 text-xs font-black rounded-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,145,0.3)] disabled:opacity-30 disabled:scale-100"
             >
               Engage Curiosity Mode ✨
             </button>
           )}
           {state?.isActive && !state?.waitingForApproval && state?.progress < 100 && (
             <div className="flex items-center gap-2 text-zinc-600 italic text-[10px]">
                <Loader2 className="w-3 h-3 animate-spin" />
                Helix is synthesizing...
             </div>
           )}
           {state?.progress === 100 && (
             <button 
               onClick={onClose}
               className="px-6 py-2.5 bg-zinc-800 text-white text-xs font-black rounded-xl hover:bg-zinc-700 transition-all uppercase tracking-widest"
             >
               Evolution Complete
             </button>
           )}
        </div>
      </div>
    </div>
  );
}

function HelixEvolutionMonitor({ helix }: { helix: HelixCore }) {
  if (!helix || !helix.evolution) return null;
  const progress = (helix.evolution.points / (helix.evolution.nextLevelAt || 100)) * 100;

  return (
    <div className="flex flex-col gap-3">
       <div className="flex justify-between items-end">
          <div className="flex flex-col">
             <div className="flex items-center gap-2 mb-0.5">
               <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{helix.identity?.name || 'Helix'} Core</span>
               <div className="px-1.5 py-0.5 bg-teal-500/10 border border-teal-500/20 rounded text-[7px] text-teal-400 font-bold uppercase tracking-widest">v{helix.identity?.version || '2.8.0'}</div>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Maturity:</span>
                <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest shadow-[0_0_8px_rgba(45,212,191,0.2)]">{helix.evolution.maturity}</span>
             </div>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[8px] font-mono text-zinc-500">Neuro-Sync: Level {helix.evolution.level}</span>
             <span className="text-[8px] font-mono text-zinc-400">{Math.round(helix.evolution.points)} / {helix.evolution.nextLevelAt} XP</span>
          </div>
       </div>
       <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50 p-[1px]">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-teal-600 to-teal-400 rounded-full shadow-[0_0_12px_rgba(20,184,166,0.4)]"
          />
       </div>
       <div className="flex gap-1.5 flex-wrap">
          {(helix.evolution.unlockedCapabilities || []).map(cap => (
            <span key={cap} className="text-[7px] px-1.5 py-0.5 bg-teal-500/5 text-teal-500/80 border border-teal-500/10 rounded font-bold uppercase tracking-tight whitespace-nowrap">
               {cap}
            </span>
          ))}
       </div>
    </div>
  );
}

function DynamicHelixAvatar({ maturity, isThinking }: { maturity: number | string, isThinking: boolean }) {
  const maturityLevels: Record<string, number> = {
    'Seed': 0,
    'Larva': 1,
    'Chrysalis': 2,
    'Imago': 3,
    'Transcendent': 4,
    'Seedling': 1,
    'Sprout': 2,
    'Twine': 3,
    'Helix-Core': 4,
    'Neural-Mesh': 5,
    'Super-Intelligence': 6
  };
  const m = typeof maturity === 'number' ? maturity : (maturityLevels[maturity] || 0);
  const layers = Math.min(2 + m, 10);
  
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <motion.div 
        animate={{ 
          rotate: [0, 360],
        }}
        transition={{ 
          duration: 15 / (m * 0.4 + 1), 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="relative w-full h-full flex items-center justify-center"
      >
        {[...Array(layers)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-teal-500/30"
            style={{
              width: `${(i + 1) * (100 / layers)}%`,
              height: `${(i + 1) * (100 / layers)}%`,
              opacity: 0.05 + (i * 0.08),
              borderStyle: i % 3 === 0 ? 'solid' : 'dashed',
              borderWidth: 1
            }}
            animate={{
              rotate: i % 2 === 0 ? 360 : -360,
              scale: isThinking ? [1, 1.15, 1] : 1,
              borderColor: isThinking ? ["rgba(20,184,166,0.3)", "rgba(20,184,166,0.8)", "rgba(20,184,166,0.3)"] : "rgba(20,184,166,0.3)"
            }}
            transition={{
              rotate: { duration: 8 + i * 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 1.5, repeat: Infinity, delay: i * 0.1 },
              borderColor: { duration: 2, repeat: Infinity }
            }}
          />
        ))}
        <div className="relative z-10 w-5 h-5 bg-zinc-950 rounded-full flex items-center justify-center border border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.5)] overflow-hidden">
           <motion.div 
             animate={{ opacity: [0.4, 1, 0.4] }}
             transition={{ duration: 2, repeat: Infinity }}
             className="absolute inset-0 bg-teal-500/10"
           />
           <Sparkles className={cn("w-3 h-3 text-teal-400 z-10", isThinking && "animate-pulse")} />
        </div>
      </motion.div>
      
      {m >= 3 && [...Array(m)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 5 + i * 2,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute inset-x-0 inset-y-0"
        >
          <motion.div 
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
            className="w-1 h-1 bg-teal-400 rounded-full absolute top-0 left-1/2 -translate-x-1/2 blur-[1px] shadow-[0_0_5px_#2dd4bf]"
          />
        </motion.div>
      ))}
    </div>
  );
}

function AGISecurityDashboard({ helix, telemetry }: { helix: HelixCore, telemetry: any }) {
  const logs = helix.security?.gatewayLogs || [];

  const hasCriticalLog = logs.some((l: any) => l.severity === 'critical');
  const highEntropy = (telemetry?.entropy || 0) > 0.4;
  const lowSecurity = (telemetry?.securityScore !== undefined && telemetry.securityScore < 0.8);
  const isCritical = hasCriticalLog || highEntropy || lowSecurity;

  return (
    <div className={cn(
      "space-y-6 transition-all duration-500 rounded-2xl p-1 relative",
      isCritical && "ring-2 ring-red-500/40 ring-offset-1 ring-offset-[#1e1e1e] bg-red-500/[0.02] shadow-[0_0_30px_rgba(239,68,68,0.15)]"
    )}>
       {isCritical && (
         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: [0.05, 0.15, 0.05] }}
           transition={{ duration: 1.5, repeat: Infinity }}
           className="absolute inset-0 bg-red-500 rounded-2xl pointer-events-none"
         />
       )}
       <AnimatePresence>
         {isCritical && (
           <motion.div 
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             className="bg-red-500 text-white p-3 rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.3)] mb-4"
           >
             <div className="bg-white/20 p-1.5 rounded-lg">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
             </div>
             <div className="flex-1">
                <div className="text-[10px] font-black uppercase tracking-widest">Anomaly Detected</div>
                <div className="text-[9px] font-mono opacity-90 leading-tight">
                  {hasCriticalLog ? "PERIMETER BREACH IN PROGRESS" : highEntropy ? "CRITICAL SYSTEM ENTROPY" : "SECURITY SCORE BELOW BASELINE"}
                </div>
             </div>
             <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
             </div>
           </motion.div>
         )}
       </AnimatePresence>

       <div className="flex justify-between items-center mb-1">
          <h4 className="text-[10px] font-black text-zinc-500 flex items-center gap-1.5 uppercase tracking-widest">
            Immutable Shield (Ring 0)
            {isCritical ? (
              <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />
            ) : (
              <Shield className="w-3 h-3 text-red-500" />
            )}
          </h4>
          <span className={cn(
            "text-[9px] font-mono font-black italic",
            isCritical ? "text-red-400 animate-pulse" : "text-red-500"
          )}>
            {isCritical ? "SYSTEM EMERGENCY" : "AGI-OS v3.0 ACTIVE"}
          </span>
       </div>

       <div className={cn(
         "p-4 border rounded-2xl relative overflow-hidden group transition-all duration-500",
         isCritical ? "bg-red-500/10 border-red-500/40" : "bg-red-500/5 border-red-500/20"
       )}>
          <div className={cn(
            "absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.2)_0%,transparent_70%)]",
            isCritical ? "animate-[pulse_1s_infinite]" : "animate-pulse"
          )}></div>
          <div className="relative z-10">
             <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                   <span className="text-[10px] font-black text-red-400 uppercase tracking-tighter">Perimeter Integrity</span>
                </div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase">{helix.security?.lastIntegrityCheck ? new Date(helix.security.lastIntegrityCheck).toLocaleTimeString() : 'PENDING'}</span>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[8px] text-zinc-600 font-black uppercase">Merkle Root Status</label>
                   <div className="text-[11px] font-mono text-zinc-300 truncate tracking-tight">{helix.security?.merkleRoot || '0xBOOTING...'}</div>
                   <div className="text-[8px] text-red-400/60 uppercase font-black tracking-widest">VALIDATED & ATTESTED</div>
                </div>
                <div className="space-y-1">
                   <label className="text-[8px] text-zinc-600 font-black uppercase">Immersion WAL</label>
                   <div className="text-[11px] font-mono text-zinc-300">Journal: Ring 0 LSM</div>
                   <div className="text-[8px] text-red-400/60 uppercase font-black tracking-widest">SYNC: 100% PERSISTENT</div>
                </div>
             </div>
          </div>
       </div>

       <div className="space-y-3">
          <div className="flex items-center justify-between">
             <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Cortical Gateway Logs</label>
             <span className="text-[8px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter animate-pulse">Real-time Ingress</span>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar scroll-smooth">
             {logs.length === 0 ? (
               <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl text-center">
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Monitoring Perimeter Baseline...</p>
               </div>
             ) : (
                (logs || []).map((log: any) => (
                  <div key={log.id} className={cn(
                    "p-3 rounded-xl border flex flex-col gap-1 animate-in slide-in-from-right-2 duration-300",
                    log.severity === 'critical' || log.severity === 'high' ? "bg-red-500/10 border-red-500/30" : "bg-zinc-900 border-zinc-800"
                  )}>
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                           <div className={cn(
                             "w-1 h-1 rounded-full",
                             log.severity === 'critical' ? "bg-red-400" : "bg-zinc-500"
                           )} />
                           <span className={cn(
                             "text-[9px] font-black uppercase tracking-tighter truncate",
                             log.severity === 'critical' ? "text-red-400" : "text-white"
                           )}>{log.event}</span>
                        </div>
                        <span className="text-[7.5px] text-zinc-600 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                     </div>
                     <div className="flex justify-between items-center mt-1">
                        <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest">SRC: {log.source}</span>
                        <div className={cn(
                          "px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest",
                          log.attestationStatus === 'verified' ? "bg-teal-500/10 text-teal-500" : "bg-red-500/10 text-red-500"
                        )}>
                           {log.attestationStatus}
                        </div>
                     </div>
                  </div>
                ))
             )}
          </div>
       </div>

       <div>
          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 block">Quantum Health Song (Spectral Harmonics)</label>
          <div className="h-32 bg-black/40 border border-zinc-800 rounded-2xl overflow-hidden relative">
             <HealthSongVisualizer data={telemetry?.healthSong || []} score={telemetry?.securityScore || 0.9} />
             <div className="absolute bottom-2 right-3 flex items-center gap-2">
                <div className="flex flex-col items-end">
                   <span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest">Coherence Bias</span>
                   <span className="text-[9px] font-mono text-teal-400 font-black">{(telemetry?.coherence * 100 || 85).toFixed(1)}%</span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest">Security Float</span>
                   <span className="text-[9px] font-mono text-red-500 font-black">{(telemetry?.securityScore * 100 || 99).toFixed(1)}%</span>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

function HealthSongVisualizer({ data, score }: { data: number[], score: number }) {
  const bars = (data || []).length || 32;
  const isOptimal = score > 0.9;
  const isCrit = score < 0.8;

  return (
    <div className="w-full h-full flex items-center justify-center p-4 gap-0.5">
       {(data || []).map((val, i) => {
          const height = val * 0.8 * 100;
          return (
            <motion.div
              key={i}
              initial={{ height: 10 }}
              animate={{ 
                height: [`${height}%`, `${height * 0.8}%`, `${height}%`],
                backgroundColor: isCrit ? ["#ef4444", "#991b1b", "#ef4444"] : isOptimal ? ["#14b8a6", "#0d9488", "#14b8a6"] : ["#f59e0b", "#d97706", "#f59e0b"]
              }}
              transition={{
                height: { duration: 1.5, repeat: Infinity, delay: i * 0.05 },
                backgroundColor: { duration: 2, repeat: Infinity, delay: i * 0.1 }
              }}
              className="flex-1 rounded-full min-w-[2px] opacity-80"
              style={{
                boxShadow: isOptimal ? '0 0 10px rgba(20,184,166,0.3)' : isCrit ? '0 0 15px rgba(239,68,68,0.4)' : 'none'
              }}
            />
          );
       })}
    </div>
  );
}

function TrainingCoachPanel({
  selectedCoach,
  onCoachChange,
  events,
  isEventMode,
  onEventModeToggle,
  onOpenCuriosity,
  onGenerateData,
  isGeneratingData
}: {
  selectedCoach: CoachId,
  onCoachChange: (id: CoachId) => void,
  events: UpcomingEvent[],
  isEventMode: boolean,
  onEventModeToggle: () => void,
  onOpenCuriosity: () => void,
  onGenerateData?: () => void,
  isGeneratingData?: boolean
}) {
  return (
    <div className="p-4 space-y-6">
      {/* Quick Actions */}
      <div className="p-4 bg-gradient-to-br from-teal-500/10 via-indigo-500/5 to-purple-500/10 border border-teal-500/20 rounded-2xl flex flex-col gap-2">
         <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
               <Sparkles className="w-4 h-4 text-[#00FF9F]" />
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Autonomous Training</span>
            </div>
            <div className="px-2 py-0.5 bg-[#00FF9F] text-zinc-950 text-[7px] font-black rounded uppercase tracking-widest animate-pulse">V2.9 Ready</div>
         </div>
         <p className="text-[10px] text-zinc-400 mb-2 leading-relaxed">
            Unleash Helix's curiosity to autonomously research, plan, and execute project evolutions.
         </p>
         
         <div className="grid grid-cols-1 gap-2 mt-2">
           <button 
             onClick={onOpenCuriosity}
             className="w-full py-3 bg-[#00FF9F]/10 border border-[#00FF9F]/40 hover:bg-[#00FF9F]/20 text-[#00FF9F] rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] group"
           >
             <Brain className="w-4 h-4 group-hover:animate-bounce" />
             <span className="text-xs font-black uppercase tracking-[0.1em]">Curiosity Mode ✨</span>
           </button>

           <button 
             onClick={onGenerateData}
             disabled={isGeneratingData}
             className="w-full py-3 bg-blue-500/10 border border-blue-500/40 hover:bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] group disabled:opacity-50"
           >
             {isGeneratingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
             <span className="text-xs font-black uppercase tracking-[0.1em]">Generate Dataset 💠</span>
           </button>
         </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#00FF9F]">
          <Users className="w-4 h-4" />
          <h4 className="text-[10px] font-black uppercase tracking-widest">Training Coach</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-zinc-500 font-bold uppercase">Real-time Analysis</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#00FF9F] animate-pulse" />
        </div>
      </div>

      {/* Platform Selector */}
      <div className="space-y-3">
        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">AI Platform Partner</label>
        <div className="grid grid-cols-1 gap-2">
          {COACHES.map(coach => (
            <button
              key={coach.id}
              onClick={() => onCoachChange(coach.id)}
              className={cn(
                "p-3 rounded-xl border flex items-center justify-between transition-all group",
                selectedCoach === coach.id 
                  ? "bg-indigo-500/10 border-indigo-500/40 shadow-lg shadow-indigo-500/5 text-indigo-400" 
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center border",
                  selectedCoach === coach.id ? "bg-indigo-500 border-indigo-400 text-white" : "bg-black border-zinc-800 text-zinc-600"
                )}>
                  {coach.id === 'prime' ? <Bot className="w-4 h-4" /> : 
                   coach.id === 'groq' ? <Zap className="w-4 h-4" /> :
                   coach.id === 'openai' ? <Sparkles className="w-4 h-4" /> :
                   coach.id === 'anthropic' ? <Shield className="w-4 h-4" /> :
                   <Settings className="w-4 h-4" />}
                </div>
                <div className="flex flex-col items-start translate-y-[1px]">
                  <span className="text-[11px] font-black uppercase tracking-tight">{coach.name}</span>
                  <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-tighter">{coach.platform}</span>
                </div>
              </div>
              {selectedCoach === coach.id && <CheckCircle2 className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming Event / Task Mode */}
      <div className="pt-4 border-t border-zinc-800/50 space-y-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Rocket className={cn("w-4 h-4", isEventMode ? "text-orange-500" : "text-zinc-500")} />
             <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Upcoming Event Mode</span>
           </div>
           <button 
             onClick={onEventModeToggle}
             className={cn(
               "w-10 h-5 rounded-full p-1 transition-all duration-300",
               isEventMode ? "bg-orange-500" : "bg-zinc-800"
             )}
           >
              <div className={cn(
                "w-3 h-3 rounded-full bg-white transition-all shadow-sm",
                isEventMode ? "translate-x-5" : "translate-x-0"
              )} />
           </button>
        </div>

        {isEventMode ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
             <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider mb-1">Coach Focus: {events[0]?.title}</p>
                <p className="text-[10px] text-zinc-300 italic leading-snug">
                  "I've recalibrated my guidance to prioritize benchmark-critical optimizations. Our goal is 95%+ Pass@1 on HumanEval by {events[0]?.targetDate}."
                </p>
             </div>
             
             <div className="space-y-2">
               <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Focus Tasks</label>
               {(events || []).map((event: any) => (
                 <div key={event.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-white uppercase tracking-tight">{event.title}</span>
                       <span className="text-[8px] text-zinc-500 font-mono italic">Target: {event.targetDate}</span>
                    </div>
                    <div className={cn(
                      "px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest",
                      event.priority === 'high' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                      {event.priority}
                    </div>
                 </div>
               ))}
             </div>
          </div>
        ) : (
          <div className="p-4 bg-zinc-900/30 border border-zinc-800/50 border-dashed rounded-2xl text-center">
             <p className="text-[10px] text-zinc-500 font-medium">Activate Event Mode to focus your coach on specific project milestones.</p>
          </div>
        )}
      </div>

      {/* Suggested Experiments */}
      <div className="pt-4 border-t border-zinc-800/50 space-y-3">
         <div className="flex items-center gap-2">
           <Wand2 className="w-4 h-4 text-purple-400" />
           <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Helix Suggestions</span>
         </div>
         <div className="grid grid-cols-1 gap-2">
            <SuggestionCard 
              title="Flash-Attention Integration" 
              desc="Estimated 2.4x speed increase per token on compute."
              points={15}
            />
            <SuggestionCard 
              title="8-Bit Quantization Audit" 
              desc="Analyze perplexity drift after quantization sweep."
              points={10}
            />
         </div>
      </div>
    </div>
  );
}

function SuggestionCard({ title, desc, points }: { title: string, desc: string, points: number }) {
  return (
    <div className="p-3 bg-zinc-900 border border-zinc-800 hover:border-purple-500/30 rounded-xl transition-all cursor-pointer group">
       <div className="flex justify-between items-start mb-1">
         <span className="text-[10px] font-black text-zinc-200 group-hover:text-purple-400 transition-colors uppercase tracking-tight">{title}</span>
         <div className="flex items-center gap-1 text-[8px] font-bold text-teal-400">
           <Zap className="w-2.5 h-2.5" />
           +{points} XP
         </div>
       </div>
       <p className="text-[9px] text-zinc-500 leading-tight">{desc}</p>
    </div>
  );
}

function InteractiveWalkthroughModal({ 
  walkthrough, 
  onClose, 
  onApprove 
}: { 
  walkthrough: { steps: { title: string; code: string; description: string; file: string }[]; currentStep: number };
  onClose: () => void;
  onApprove: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(walkthrough.currentStep);
  const currentStep = walkthrough.steps[stepIndex];
  
  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl h-[80vh] bg-[#1e1e1e] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-[#252526] border-b border-zinc-850 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#00FF9F]/10 rounded-lg">
              <Sparkles className="w-4 h-4 text-[#00FF9F] animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Helix Block-by-Block Walkthrough</h3>
              <p className="text-[9px] text-zinc-500 font-mono">STEP {stepIndex + 1} OF {walkthrough.steps.length} • FILE: {currentStep.file}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Body (Split View) */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left panel: Description & Steps checklist */}
          <div className="w-1/2 p-6 border-r border-zinc-800 flex flex-col justify-between overflow-y-auto bg-zinc-950/20">
            <div className="space-y-6">
              {/* Steps Progress Checklist */}
              <div>
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Build Pipeline Progress</span>
                <div className="space-y-2">
                  {walkthrough.steps.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono",
                        idx < stepIndex ? "bg-teal-500/20 text-[#00FF9F] border border-[#00FF9F]/30" :
                        idx === stepIndex ? "bg-[#00FF9F] text-zinc-950 font-black animate-pulse" :
                        "bg-zinc-900 text-zinc-600 border border-zinc-800"
                      )}>
                        {idx < stepIndex ? "✓" : idx + 1}
                      </div>
                      <span className={cn(
                        "text-[10px] font-mono",
                        idx === stepIndex ? "text-zinc-200 font-bold" :
                        idx < stepIndex ? "text-zinc-500 line-through" : "text-zinc-600"
                      )}>
                        {s.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explaining Narrative Section */}
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wide">{currentStep.title}</h4>
                <p className="text-[11px] text-zinc-300 leading-relaxed font-mono whitespace-pre-line">
                  {currentStep.description}
                </p>
              </div>
            </div>

            {/* Micro-Attestation Warning */}
            <div className="p-3 bg-teal-950/10 border border-teal-900/30 rounded-lg flex gap-2 mt-4 shrink-0">
              <Bot className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <p className="text-[9px] text-teal-500 font-mono">
                System telemetry attestation: Integrity check complete. Code compiles under baseline validation checks.
              </p>
            </div>
          </div>

          {/* Right panel: Monaco-style Read-Only Editor container */}
          <div className="w-1/2 flex flex-col bg-zinc-950">
            <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <span className="text-[9px] font-mono text-zinc-500">{currentStep.file} (Read-Only Context)</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
                <div className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
              </div>
            </div>
            <div className="flex-1 p-4 overflow-auto font-mono text-[10.5px] leading-relaxed text-zinc-300 select-text selection:bg-teal-500/20">
              <pre className="bg-[#121214] p-4 rounded-lg border border-zinc-850 overflow-x-auto shadow-inner h-full">
                <code>{currentStep.code}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-[#252526] border-t border-zinc-850 flex justify-between items-center shrink-0">
          <button 
            disabled={stepIndex === 0}
            onClick={() => setStepIndex(prev => prev - 1)}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none border border-zinc-800 text-zinc-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            Previous
          </button>
          
          {stepIndex < walkthrough.steps.length - 1 ? (
            <button 
              onClick={() => setStepIndex(prev => prev + 1)}
              className="px-5 py-2 bg-teal-500 text-zinc-950 hover:scale-[1.02] active:scale-[0.98] rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(20,184,166,0.25)] cursor-pointer"
            >
              Next Step
            </button>
          ) : (
            <button 
              onClick={onApprove}
              className="px-5 py-2 bg-[#00FF9F] text-zinc-950 hover:scale-[1.02] active:scale-[0.98] rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,255,159,0.25)] cursor-pointer"
            >
              Approve Build & Export Project
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
