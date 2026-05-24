import { LucideIcon } from 'lucide-react';

export type ProjectStatus = 'Running' | 'Stopped' | 'Training' | 'Idle' | 'Error' | 'Ready';
export type ConnectionType = 'Local' | 'HuggingFace' | 'Git' | 'Endpoint' | 'Notebook';
export type ProjectCategory = 'Fine-Tuning' | 'Inference' | 'Agent' | 'RAG' | 'Evaluation' | 'Agentic AI';

export type PersonaId = 'prime' | 'artisan' | 'sage' | 'architect' | 'ruthless' | 'catalyst';
export type CoachId = 'prime' | 'groq' | 'openai' | 'anthropic' | 'custom';

export type CuriosityPhase = 'Research' | 'Planning' | 'Implementation' | 'Training' | 'Testing' | 'Walkthrough' | 'Idle';

export interface HelixEvolution {
  level: number;
  points: number;
  nextLevelAt: number;
  unlockedCapabilities: string[];
  maturity: any; // Allow strings like 'Seedling'
}

export interface HelixCoreMemory {
  userPreferences: Record<string, any>;
  codingStyle: string;
  successfulStrategies: string[];
  pastEvolutions: string[];
  lastInteraction: string;
}

export interface HelixInitiative {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'dismissed' | 'completed';
  category: string;
}

export interface SwarmAgent {
  id: string;
  name: string;
  role: 'Architect' | 'Auditor' | 'Optimizer' | 'Specialist';
  status: 'idle' | 'working' | 'thinking';
  currentTask?: string;
}

export interface HelixTool {
  id: string;
  name: string;
  description: string;
  category: 'FileSystem' | 'Execution' | 'Network' | 'Core';
  isActive?: boolean;
}

export interface HelixAdapter {
  id: string;
  name: string;
  description: string;
  status: 'Connected' | 'Disconnected' | 'Error' | 'Rate Limited';
  icon: string;
  type: 'SourceControl' | 'Deployment' | 'Compute' | 'Monitoring' | 'Intelligence';
  config?: {
    apiKey?: string;
    token?: string;
    endpoint?: string;
    lastSyncAt?: string;
    repoName?: string;
  };
  features: string[];
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  attestationStatus: 'verified' | 'failed' | 'quarantined';
}

export interface AGIHealthMetric {
  label: string;
  value: number;
  status: 'optimal' | 'degraded' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

export interface HelixCore {
  identity?: {
    name: string;
    version: string;
    origin: string;
  };
  evolution: HelixEvolution;
  memory: HelixCoreMemory;
  initiatives?: HelixInitiative[];
  initiativeMode: boolean;
  swarm?: {
    agents: SwarmAgent[];
    activeSwarmId?: string;
  };
  tools?: HelixTool[];
  adapters?: HelixAdapter[];
  security?: {
    gatewayLogs: SecurityLog[];
    merkleRoot: string;
    walHash: string;
    lastIntegrityCheck: string;
    isQuarantined: boolean;
  };
  userProfile?: {
    detectedSkillLevel: string;
    focusAreas: string[];
    collaborationStyle: string;
  };
}

export interface CuriosityStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

export interface CuriosityState {
  isActive: boolean;
  phase: CuriosityPhase;
  goal: string;
  progress: number;
  steps: CuriosityStep[];
  plan: string;
  waitingForApproval?: boolean;
}

export interface Persona {
  id: PersonaId;
  name: string;
  tagline: string;
  icon: string;
  tone: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  targetDate: string;
  type: 'benchmark' | 'deployment' | 'audit' | 'presentation';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
}

export interface Coach {
  id: CoachId;
  name: string;
  logo: string;
  platform: string;
}

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isOpen?: boolean;
}

export interface Project {
  id: string;
  name: string;
  category: ProjectCategory;
  template?: string;
  status: ProjectStatus;
  connectionType: ConnectionType;
  model: string;
  thumbnail?: string;
  tokenCount?: string;
  datasetSize?: string;
  lastRun?: string;
  created: string;
  metrics?: {
    accuracy?: number;
    loss?: number;
    throughput?: string;
    vram?: number;
  };
  fileTree?: FileNode[];
  entryPoint?: string;
  entryPoints?: string[];
  env?: string; // 'conda', 'venv', 'docker', 'global'
  persona?: PersonaId;
  coach?: CoachId;
  trainWithHelix?: boolean;
}

export interface Integration {
  id: string;
  name: string;
  icon: any;
  category: string;
  description: string;
  status: 'active' | 'available';
}

export interface GPUStatus {
  id: string;
  name: string;
  utilization: number;
  vramUsed: number;
  vramTotal: number;
  temp: number;
  power: number;
  fanSpeed: number;
  status: 'Active' | 'Idle' | 'Overload' | 'Warning';
  currentProject?: string;
}

export interface Instance {
  id: string;
  name: string;
  status: string;
  logs: string[];
  deployedAt: string;
  duration?: number;
  memoryUsage?: number;
  wasmBuffer?: string;
  lifecycle?: 'Undifferentiated' | 'Specialized' | 'Scrubbing';
  specialty?: 'Logic' | 'Memory' | 'Creative' | 'Security';
  attestationToken?: string;
  lastResult?: any;
}

export interface MemoryNode {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  links: string[];
}

export interface Command {
  id: string;
  name: string;
  icon: any;
  shortcut?: string;
  category: string;
  action: () => void;
  context?: string[]; // Optional priority context
}
