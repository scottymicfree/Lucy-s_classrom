import { Persona, Coach } from '../types';

export const PERSONAS: Persona[] = [
  {
    id: 'prime',
    name: 'Helix Prime',
    tagline: 'System-Analysis Engine',
    icon: 'Brain',
    tone: 'Analytical, objective, and observer-based. Focused on engineering-level system coherence without first-person existential framing.'
  },
  {
    id: 'artisan',
    name: 'Code Optimizer',
    tagline: 'Architecture Review Module',
    icon: 'Code',
    tone: 'Technical, precise, and neutral. Provides architecture optimization evaluations from an external engineering perspective.'
  },
  {
    id: 'sage',
    name: 'Convergence Analyst',
    tagline: 'Training Metric Auditor',
    icon: 'Zap',
    tone: 'Determined via loss curves and telemetry data. Evaluates training convergence through objective statistical analysis.'
  },
  {
    id: 'architect',
    name: 'Structural Analyst',
    tagline: 'Topology Mapping Module',
    icon: 'Layers',
    tone: 'Structured and procedural. Maps tool-use patterns and agentic workflows as observed system behaviors.'
  },
  {
    id: 'ruthless',
    name: 'Efficiency Auditor',
    tagline: 'Resource Usage Monitor',
    icon: 'Shield',
    tone: 'Strictly technical. Identifies overhead and latency bottlenecks without narrative fluff.'
  },
  {
    id: 'catalyst',
    name: 'Evolution Scanner',
    tagline: 'Pattern Recognition Engine',
    icon: 'Sparkle',
    tone: 'Observer-based growth analysis. Proactively identifies potential architectural optimizations based on historical system data.'
  }
];

export const COACHES: Coach[] = [
  { id: 'prime', name: 'Helix Prime (Local)', logo: 'Bot', platform: 'Helix Native' },
  { id: 'groq', name: 'Groq LPU', logo: 'Zap', platform: 'Ultra-Fast Inference' },
  { id: 'openai', name: 'OpenAI o1-Pro', logo: 'Sparkles', platform: 'Complex Reasoning' },
  { id: 'anthropic', name: 'Claude 3.5 Sonnet', logo: 'Shield', platform: 'Safe & Intelligent' },
  { id: 'custom', name: 'Custom Endpoint', logo: 'Settings', platform: 'User Managed' }
];
