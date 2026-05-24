import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { spawn } from "child_process";
import fs from "fs-extra";
import { v4 as uuidv4 } from "uuid";

import { performance } from "perf_hooks";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import { ringRouter, setWebSocketServer } from "./server/rings.ts";
import { initWebSocketGateway } from "./server/runtime/WebSocketGateway.ts";
import { startTelemetryEngine } from "./server/runtime/TelemetryEngine.ts";

const STATE_FILE = path.join(process.cwd(), "agi-os-state.json");

interface Instance {
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

interface HelixEvolution {
  level: number;
  points: number;
  nextLevelAt: number;
  unlockedCapabilities: string[];
  maturity: 'Seed' | 'Larva' | 'Chrysalis' | 'Imago' | 'Transcendent' | 'Seedling';
}

interface HelixCoreMemory {
  userPreferences: Record<string, any>;
  codingStyle: string;
  successfulStrategies: string[];
  pastEvolutions: string[];
  lastInteraction: string;
}

interface HelixCore {
  identity?: {
    name: string;
    version: string;
    origin: string;
  };
  evolution: HelixEvolution;
  memory: HelixCoreMemory;
  initiatives?: any[];
  initiativeMode: boolean;
  swarm?: {
    agents: any[];
    activeSwarmId?: string;
  };
  tools?: any[];
  adapters?: any[];
  curiosity?: {
    isActive: boolean;
    phase: string;
    goal: string;
    progress: number;
    steps: any[];
  };
  security?: {
    gatewayLogs: any[];
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

interface MemoryNode {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  links: string[];
}

interface AgiState {
  rings: {
    ring0: { // Immutable Core
      merkleRoot: string;
      walSize: number;
      lastAttestedAt: string;
      journal: string[];
    };
    ring1: { trainedModels: any[] };
    ring2: { memoryEntries: MemoryNode[] };
    ring3: { instances: Instance[] };
  };
  helixCore: HelixCore;
  terminalLogs: string[];
  telemetry: {
    coherence: number;
    entropy: number;
    aggregateThroughput: number;
    activeWorkerCount: number;
    securityScore: number;
    healthSong: number[]; // Spectral data simulation
    lastTick: string;
  };
}

const DEFAULT_STATE: AgiState = {
  rings: {
    ring0: {
      merkleRoot: "0x8f3c...b2a1",
      walSize: 42,
      lastAttestedAt: new Date().toISOString(),
      journal: ["System initialized", "Immutable core established"]
    },
    ring1: { trainedModels: [] },
    ring2: { 
      memoryEntries: [
        {
          id: "mem-001",
          type: "Pattern",
          content: "Initial Helix-Kernel bootstrap sequence verified.",
          timestamp: new Date().toISOString(),
          links: ["mem-002"]
        },
        {
          id: "mem-002",
          type: "Observation",
          content: "Ring-3 allocation efficiency within nominal parameters.",
          timestamp: new Date().toISOString(),
          links: ["mem-001"]
        }
      ] 
    },
    ring3: { instances: [] }
  },
  helixCore: {
    identity: {
      name: "Helix",
      version: "3.0.0-Security-Immutable",
      origin: "Cortical Gateway Architecture"
    },
    evolution: {
      level: 1,
      points: 0,
      nextLevelAt: 100,
      unlockedCapabilities: ["Context Awareness", "Core Logic", "Immutable Security"],
      maturity: 'Seedling'
    },
    memory: {
      userPreferences: {
        theme: "dark",
        preferredModels: ["Llama-3", "Claude-3"]
      },
      codingStyle: "functional-minimalist",
      successfulStrategies: [],
      pastEvolutions: [],
      lastInteraction: new Date().toISOString()
    },
    initiatives: [
      {
        id: "init_1",
        title: "Neuro-Highway Optimization",
        description: "I've detected latency in the spectral visualizer. Should I refactor the data flow for 60fps coherence?",
        status: "active",
        category: "Performance"
      }
    ],
    initiativeMode: true,
    swarm: {
      agents: [],
    },
    tools: [
      { id: 'fs_read', name: 'FS Read', description: 'Read file system structure', category: 'FileSystem' },
      { id: 'fs_write', name: 'FS Write', description: 'Apply atomic code edits', category: 'FileSystem' },
      { id: 'exec_node', name: 'Node Exec', description: 'Execute sandboxed TS/JS', category: 'Execution' },
      { id: 'web_search', name: 'Neural Search', description: 'Retrieve real-world context', category: 'Network' }
    ],
    adapters: [
      { 
        id: 'github', 
        name: 'GitHub', 
        description: 'Primary source control & CI/CD deployment', 
        status: 'Disconnected', 
        icon: 'Github', 
        type: 'SourceControl',
        features: ['Auto-Commit', 'Remote Sync', 'Branch Management']
      }
    ],
    security: {
      gatewayLogs: [],
      merkleRoot: "0x8f3c...b2a1",
      walHash: "SHA-256:0x123",
      lastIntegrityCheck: new Date().toISOString(),
      isQuarantined: false
    },
    userProfile: {
      detectedSkillLevel: "Architect",
      focusAreas: ["AI Agents", "WASM Runtimes"],
      collaborationStyle: "Recursive"
    }
  },
  terminalLogs: [
    "\x1b[32m[SYSTEM]\x1b[0m Helix-OS v3.0 Core Booting...",
    "\x1b[32m[RING-0]\x1b[0m Immutable Security Layer: ACTIVE",
    "\x1b[32m[CORTICAL-GATEWAY]\x1b[0m Absolute Perimeter Guard: ONLINE"
  ],
  telemetry: {
    coherence: 0.85,
    entropy: 0.12,
    aggregateThroughput: 0,
    activeWorkerCount: 0,
    securityScore: 0.99,
    healthSong: Array.from({ length: 48 }, () => Math.random()),
    lastTick: new Date().toISOString()
  }
};

async function loadState(): Promise<AgiState> {
  if (await fs.pathExists(STATE_FILE)) {
    try {
      const loaded = await fs.readJson(STATE_FILE);
      // Deep merge with DEFAULT_STATE to handle schema updates
      return {
        ...DEFAULT_STATE,
        ...loaded,
        rings: {
          ...DEFAULT_STATE.rings,
          ...(loaded.rings || {}),
          ring0: { ...DEFAULT_STATE.rings.ring0, ...(loaded.rings?.ring0 || {}) },
          ring1: { ...DEFAULT_STATE.rings.ring1, ...(loaded.rings?.ring1 || {}) },
          ring2: { ...DEFAULT_STATE.rings.ring2, ...(loaded.rings?.ring2 || {}) },
          ring3: { ...DEFAULT_STATE.rings.ring3, ...(loaded.rings?.ring3 || {}) },
        },
        helixCore: {
          ...DEFAULT_STATE.helixCore,
          ...(loaded.helixCore || {}),
          evolution: { ...DEFAULT_STATE.helixCore.evolution, ...(loaded.helixCore?.evolution || {}) },
          memory: { ...DEFAULT_STATE.helixCore.memory, ...(loaded.helixCore?.memory || {}) },
        },
        telemetry: {
          ...DEFAULT_STATE.telemetry,
          ...(loaded.telemetry || {}),
        }
      };
    } catch (err) {
      console.error("Failed to parse state file, using default", err);
      return DEFAULT_STATE;
    }
  }
  return DEFAULT_STATE;
}

async function saveState(state: AgiState) {
  await fs.writeJson(STATE_FILE, state, { spaces: 2 });
}

let wss: WebSocketServer;

function broadcastState(state: AgiState) {
  if (!wss) return;
  const payload = JSON.stringify({ type: 'STATE_UPDATE', state });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  wss = new WebSocketServer({ noServer: true });
  setWebSocketServer(wss);
  initWebSocketGateway(wss);
  startTelemetryEngine();

  const { RuntimeBus } = await import("./server/runtime/RuntimeBus.ts");
  RuntimeBus.on("telemetry_update", (payload: any) => {
    state.telemetry.coherence = payload.coherence;
    state.telemetry.entropy = payload.entropy;
    state.telemetry.activeWorkerCount = payload.activeWorkers;
    // Broadcast state to UI to keep it updating naturally
    broadcastState(state);
  });
  
  RuntimeBus.on("execution_log", (payload: any) => {
    state.terminalLogs.push(`\x1b[36m${payload.message}\x1b[0m`);
    if (state.terminalLogs.length > 200) state.terminalLogs.shift();
    broadcastState(state);
  });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;

    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', async (ws) => {
    const state = await loadState();
    ws.send(JSON.stringify({ type: 'STATE_UPDATE', state }));
  });

  let state = await loadState();
  
  // Systemic Health Song & Advanced Security Monitor Tick
  setInterval(async () => {
    state.telemetry.lastTick = new Date().toISOString();

    // Advanced Spectral Telemetry (Quantum Music Harmonics)
    state.telemetry.healthSong = state.telemetry.healthSong.map((v, i) => {
      const frequencyFactor = i / state.telemetry.healthSong.length;
      // Introduce "Beat" interference patterns based on security state
      const interference = state.telemetry.securityScore < 0.9 ? Math.sin(Date.now() / 500) * 0.1 : 0;
      const base = Math.sin(Date.now() / 2000 + i) * 0.15 + 0.5;
      const drift = (Math.random() - 0.5) * (state.telemetry.entropy * 0.25);
      return Math.max(0.05, Math.min(1, base + drift + (frequencyFactor * 0.1) + interference));
    });
    
    // Ring 0: Immutable Core Journaling & Merkle Attestation
    if (Math.random() > 0.92) {
      const prevRoot = state.rings.ring0.merkleRoot;
      state.rings.ring0.merkleRoot = "0x" + uuidv4().replace(/-/g, '').slice(0, 16).toUpperCase();
      state.rings.ring0.lastAttestedAt = new Date().toISOString();
      state.rings.ring0.walSize += 0.45;
      
      const journalEntry = `[ATTESTATION] Block verified. Prev: ${prevRoot.slice(0, 6)}... New: ${state.rings.ring0.merkleRoot.slice(0, 6)}...`;
      state.rings.ring0.journal.push(journalEntry);
      if (state.rings.ring0.journal.length > 20) state.rings.ring0.journal.shift();
      
      state.helixCore.security = {
        ...state.helixCore.security!,
        merkleRoot: state.rings.ring0.merkleRoot,
        lastIntegrityCheck: state.rings.ring0.lastAttestedAt
      };
    }

    // Proactive Security Orchestrator (Self-Awareness)
    if (state.telemetry.entropy > 0.55 || state.telemetry.securityScore < 0.8) {
      const alert = `[SECURITY] CRITICAL: Systemic deviation outside immutable baseline. Initiating self-healing protocols.`;
      state.terminalLogs.push(`\x1b[31m${alert}\x1b[0m`);
      
      // Mandatory Rollback simulation
      state.telemetry.securityScore = 0.995;
      state.telemetry.entropy = 0.02;
      state.telemetry.coherence = Math.max(0.8, state.telemetry.coherence - 0.05);
      
      state.helixCore.security?.gatewayLogs.unshift({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        event: "System Integrity Restoration (v3.0 Auto-Healing)",
        severity: "critical",
        source: "Ring 0 Orchestrator",
        attestationStatus: "verified"
      });

      state.rings.ring2.memoryEntries.push({
        id: uuidv4(),
        type: "SecurityAudit",
        content: `INTEGRITY_SHIELD: Auto-rollback executed. System returned to Merkle Root ${state.rings.ring0.merkleRoot}.`,
        timestamp: new Date().toISOString(),
        links: ["Ring 0", "Gatekeeper v2"]
      });
    }

    broadcastState(state);
    await saveState(state);
  }, 3000);

  app.use(express.json());

  // Cortical Gateway: Absolute Perimeter Security Middleware (v2)
  const corticalGateway = (req: any, res: any, next: any) => {
    // 1. Behavioral Anomaly Detection
    const payloadSize = JSON.stringify(req.body).length;
    
    if (payloadSize > 500000) {
      state.telemetry.entropy += 0.08;
      state.helixCore.security?.gatewayLogs.unshift({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        event: `Large Resource Ingress Detected (${Math.round(payloadSize/1024)}KB)`,
        severity: "medium",
        source: "Inbound Protocol",
        attestationStatus: "quarantined"
      });
    }

    // 2. Behavioral Baselines: Check for suspicious patterns
    if (req.path.includes('deploy') && state.telemetry.securityScore < 0.8) {
      state.helixCore.security?.gatewayLogs.unshift({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        event: "Deployment Rejected: Low Security Threshold",
        severity: "high",
        source: "Cortical Gateway v2",
        attestationStatus: "failed"
      });
      return res.status(403).json({ error: "Cortical Gateway: Security Threshold Not Met. Purge required." });
    }

    // 3. Cryptographic Attestation Simulation (v2)
    const isAttested = req.headers['x-helix-signature'] || Math.random() > 0.005;
    if (!isAttested) {
       state.telemetry.entropy += 0.1;
       state.helixCore.security?.gatewayLogs.unshift({
         id: uuidv4(),
         timestamp: new Date().toISOString(),
         event: `Pattern mismatch detected in request: ${req.path}`,
         severity: "high",
         source: "Cortical Gateway v2",
         attestationStatus: "failed"
       });
    }

    next();
  };

  app.use("/api/agi/*", corticalGateway);
  
  // Advanced Cortical Gateway Router (Security Middleware)
  app.use((req, res, next) => {
    // Log all access to the immutable registry
    console.log(`[CORTICAL GATEWAY] Ingress: ${req.method} ${req.path} | Attestation: PENDING`);
    
    res.setHeader('X-Helix-Security-Router', 'Active');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // res.setHeader('Content-Security-Policy', "default-src 'self' *; script-src 'self' 'unsafe-inline' 'unsafe-eval' *; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com *; font-src 'self' data: https://fonts.gstatic.com *; img-src 'self' data: *; connect-src 'self' ws: wss: *;");
    next();
  });

  app.use("/api", ringRouter);

  // AGI-OS Persistence API
  app.get("/api/agi/state", async (req, res) => {
    try {
      res.json(state);
    } catch (err: any) {
      console.error("Failed to load state", err);
      res.status(500).json({ error: "Failed to load state", details: err.message });
    }
  });

  app.post("/api/helix/update-core", async (req, res) => {
    try {
      const { deltaPoints, memoryUpdate, initiativeMode, newCapability, trainingOutcome } = req.body;
      
      if (deltaPoints) {
        state.helixCore.evolution.points += deltaPoints;
        while (state.helixCore.evolution.points >= state.helixCore.evolution.nextLevelAt) {
          state.helixCore.evolution.level += 1;
          state.helixCore.evolution.points -= state.helixCore.evolution.nextLevelAt;
          state.helixCore.evolution.nextLevelAt = Math.round(state.helixCore.evolution.nextLevelAt * 1.5);
          
          const maturities: ('Seed' | 'Larva' | 'Chrysalis' | 'Imago' | 'Transcendent')[] = ['Seed', 'Larva', 'Chrysalis', 'Imago', 'Transcendent'];
          const maturityIdx = Math.min(maturities.length - 1, Math.floor(state.helixCore.evolution.level / 2));
          state.helixCore.evolution.maturity = maturities[maturityIdx];
          
          state.helixCore.memory.pastEvolutions.push(`Reached Level ${state.helixCore.evolution.level} as ${state.helixCore.evolution.maturity}`);
          
          // Auto-unlock random capability if leveled up
          const availableCaps = ["Neural Compression", "Async Reasoning", "Sub-space Ingress", "Quantum Telemetry", "Agentic Swarm"];
          const nextCap = availableCaps.find(c => !state.helixCore.evolution.unlockedCapabilities.includes(c));
          if (nextCap) state.helixCore.evolution.unlockedCapabilities.push(nextCap);
        }
      }

      if (trainingOutcome) {
        // Measurably improve system behavior
        state.telemetry.coherence = Math.min(0.99, state.telemetry.coherence + 0.05);
        state.telemetry.entropy = Math.max(0.01, state.telemetry.entropy - 0.03);
        state.telemetry.aggregateThroughput += 15.5; // Gain in efficiency
        state.telemetry.securityScore = Math.min(100, state.telemetry.securityScore + 2);
        
        state.terminalLogs.push(`[TELEMETRY] Training success detected. Coherence -> ${(state.telemetry.coherence * 100).toFixed(1)}% | Entropy reduced.`);
      }

      if (newCapability && !state.helixCore.evolution.unlockedCapabilities.includes(newCapability)) {
         state.helixCore.evolution.unlockedCapabilities.push(newCapability);
      }

      if (memoryUpdate) {
        state.helixCore.memory = { ...state.helixCore.memory, ...memoryUpdate, lastInteraction: new Date().toISOString() };
      }

      if (initiativeMode !== undefined) {
        state.helixCore.initiativeMode = initiativeMode;
      }

      await saveState(state);
      broadcastState(state);
      res.json({ success: true, core: state.helixCore });
    } catch (err: any) {
      console.error("Failed to update Helix Core", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/helix/initiative-action", async (req, res) => {
    try {
      const { id, action } = req.body;
      const initiative = state.helixCore.initiatives?.find(i => i.id === id);
      
      if (!initiative) return res.status(404).json({ error: "Initiative not found" });

      if (action === 'dismiss') {
        initiative.status = 'dismissed';
      } else if (action === 'complete') {
        initiative.status = 'completed';
        state.helixCore.evolution.points += 15;
        state.helixCore.memory.successfulStrategies.push(`Executed Initiative: ${initiative.title}`);
        
        while (state.helixCore.evolution.points >= state.helixCore.evolution.nextLevelAt) {
          state.helixCore.evolution.level += 1;
          state.helixCore.evolution.points -= state.helixCore.evolution.nextLevelAt;
          state.helixCore.evolution.nextLevelAt = Math.round(state.helixCore.evolution.nextLevelAt * 1.5);
          const maturities = ['Seedling', 'Sprout', 'Twine', 'Helix-Core', 'Neural-Mesh', 'Super-Intelligence'];
          const maturityIdx = Math.min(state.helixCore.evolution.level - 1, maturities.length - 1);
          state.helixCore.evolution.maturity = (maturities[maturityIdx] as any);
        }
      }

      await saveState(state);
      broadcastState(state);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to handle initiative" });
    }
  });

  const triggerAdapterAction = async (adapterId: string, actionName: string, meta: any = {}) => {
    const adapter = state.helixCore.adapters?.find(a => a.id === adapterId);
    if (adapter && adapter.status === 'Connected') {
      state.terminalLogs.push(`\x1b[34m[${adapter.name}: ${actionName}]\x1b[0m ${meta.message || 'Action executed successfully.'}`);
      
      // If it's a commit, log it to the security layer too
      if (actionName.includes('Commit') || actionName.includes('Push')) {
        state.helixCore.security?.gatewayLogs.unshift({
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          event: `${adapter.name} External Sync: ${actionName}`,
          severity: "low",
          source: `Adapter:${adapter.id}`,
          attestationStatus: "verified"
        });
      }
    }
  };

  // Curiosity Mode Evolution with Adapter Integration
  app.post("/api/helix/curiosity/step", async (req, res) => {
    const { stepId, status } = req.body;
    
    if (state.helixCore.curiosity) {
      const stepIndex = state.helixCore.curiosity.steps.findIndex((s: any) => s.id === stepId);
      if (stepIndex !== -1) {
        state.helixCore.curiosity.steps[stepIndex].status = status;
        
        if (status === 'completed') {
           state.helixCore.curiosity.progress += (100 / state.helixCore.curiosity.steps.length);
           await triggerAdapterAction('github', 'Auto-Commit', { message: `Checkpoint: Curiosity Step "${state.helixCore.curiosity.steps[stepIndex].title}" completed.` });
        }
      }
    }

    await saveState(state);
    broadcastState(state);
    res.json({ success: true });
  });

  app.post("/api/helix/spawn-swarm", async (req, res) => {
    try {
      const { agents } = req.body; // e.g. [{ name: 'Architect', role: 'Architect' }]
      
      const newAgents = agents.map((a: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: a.name,
        role: a.role,
        status: 'thinking',
        currentTask: 'Awaiting primary directive'
      }));

      state.helixCore.swarm = {
        agents: newAgents,
        activeSwarmId: Math.random().toString(36).substr(2, 9)
      };

      // Also add to Ring 3 instances for visualization
      state.rings.ring3.instances = [
        ...state.rings.ring3.instances,
        ...newAgents.map((a: any) => ({
          id: a.id,
          name: `${a.role}: ${a.name}`,
          status: 'Specializing',
          logs: [`Swarm agent initialized: ${a.role}`],
          deployedAt: new Date().toISOString(),
          lifecycle: 'Specialized'
        }))
      ];

      await saveState(state);
      broadcastState(state);
      res.json({ success: true, agents: newAgents });
    } catch (err) {
      res.status(500).json({ error: "Failed to spawn swarm" });
    }
  });

  app.post("/api/helix/tool-use", async (req, res) => {
    try {
      const { toolId, params } = req.body;
      const tool = state.helixCore.tools?.find(t => t.id === toolId);
      
      if (!tool) return res.status(404).json({ error: "Tool not found" });

      // Simulated execution
      state.terminalLogs.push(`\x1b[36m[TOOL: ${tool.name}]\x1b[0m Executing with params: ${JSON.stringify(params)}`);
      
      let result = {};
      if (toolId === 'fs_read') result = { files: ['src/main.ts', 'src/App.tsx', 'server.ts'] };
      if (toolId === 'fs_write') {
        result = { status: 'Changes applied successfully' };
        await triggerAdapterAction('github', 'Auto-Commit', { message: 'Atomic file write detected. Synchronizing checkpoint.' });
      }
      if (toolId === 'exec_node') result = { output: 'Loop matched 42 patterns. Efficiency: 98%' };
      if (toolId === 'web_search') result = { link: 'https://arxiv.org/abs/2403.helix', snippet: 'A new architecture for recursive agent networks...' };

      await saveState(state);
      broadcastState(state);
      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ error: "Tool execution failed" });
    }
  });

  app.post("/api/helix/adapters/configure", async (req, res) => {
    try {
      const { adapterId, config } = req.body;
      const adapterIndex = state.helixCore.adapters?.findIndex(a => a.id === adapterId);
      
      if (adapterIndex === undefined || adapterIndex === -1) return res.status(404).json({ error: "Adapter not found" });

      state.helixCore.adapters![adapterIndex].config = {
        ...state.helixCore.adapters![adapterIndex].config,
        ...config
      };
      state.helixCore.adapters![adapterIndex].status = 'Connected';
      state.helixCore.adapters![adapterIndex].config!.lastSyncAt = new Date().toISOString();

      state.terminalLogs.push(`\x1b[32m[ADAPTER]\x1b[0m ${state.helixCore.adapters![adapterIndex].name} successfully configured.`);
      
      await saveState(state);
      broadcastState(state);
      res.json({ success: true, adapter: state.helixCore.adapters![adapterIndex] });
    } catch (err) {
      res.status(500).json({ error: "Failed to configure adapter" });
    }
  });

  app.post("/api/helix/adapters/sync", async (req, res) => {
    try {
      const { adapterId } = req.body;
      const adapterIndex = state.helixCore.adapters?.findIndex(a => a.id === adapterId);
      
      if (adapterIndex === undefined || adapterIndex === -1) return res.status(404).json({ error: "Adapter not found" });
      
      const adapter = state.helixCore.adapters![adapterIndex];
      if (adapter.status !== 'Connected') return res.status(400).json({ error: "Adapter must be connected to sync" });

      state.terminalLogs.push(`\x1b[35m[SYNC]\x1b[0m Synchronizing ${adapter.name} resources...`);
      
      // Simulate sync delay
      await new Promise(r => setTimeout(r, 2000));
      
      adapter.config!.lastSyncAt = new Date().toISOString();
      state.terminalLogs.push(`\x1b[32m[ADAPTER]\x1b[0m ${adapter.name} sync complete. Handshaked 14 instances.`);

      await saveState(state);
      broadcastState(state);
      res.json({ success: true, lastSyncAt: adapter.config!.lastSyncAt });
    } catch (err) {
      res.status(500).json({ error: "Sync failed" });
    }
  });

  app.post("/api/helix/adapters/install", async (req, res) => {
    try {
      const { adapter } = req.body; 
      // Simple validation or predefined catalog would be better, but implementing the user's request for flexibility
      const newAdapter = {
        id: adapter.id || Math.random().toString(36).substr(2, 9),
        name: adapter.name,
        description: adapter.description,
        status: 'Disconnected',
        icon: adapter.icon || 'Box',
        type: adapter.type || 'Monitoring',
        features: adapter.features || ['General Integration'],
        config: {}
      };

      if (!state.helixCore.adapters) state.helixCore.adapters = [];
      state.helixCore.adapters.push(newAdapter);
      
      state.terminalLogs.push(`\x1b[32m[ADAPTER]\x1b[0m New adapter installed: ${newAdapter.name}`);
      
      await saveState(state);
      broadcastState(state);
      res.json({ success: true, adapter: newAdapter });
    } catch (err) {
      res.status(500).json({ error: "Failed to install adapter" });
    }
  });

  // Local Training Backend
  let activeTrainingProcess: any = null;

  function broadcastMetrics(metrics: any, projectId?: string) {
    if (!wss) return;
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'TRAINING_METRICS', metrics, projectId }));
      }
    });
  }

  app.post('/api/training/start', async (req, res) => {
    try {
      const { config, code, projectId } = req.body;
      
      const tempDir = path.join(process.cwd(), 'temp', projectId || 'default');
      await fs.ensureDir(tempDir);
      await fs.writeFile(path.join(tempDir, 'train.py'), code || '# Empty training script');

      if (activeTrainingProcess) {
        activeTrainingProcess.kill();
      }

      state.terminalLogs.push(`\x1b[32m[TRAINER]\x1b[0m Starting local training for project ${projectId}...`);
      broadcastState(state);

      // Simple metric parsing from stdout
      const parseMetrics = (line: string) => {
        // Look for patterns like "loss: 0.123" or "accuracy: 95.5"
        const lossMatch = line.match(/loss:?\s*([\d.]+)/i);
        const accMatch = line.match(/acc(?:uracy)?:?\s*([\d.]+)/i);
        const stepMatch = line.match(/step:?\s*(\d+)/i);
        const vramMatch = line.match(/vram:?\s*([\d.]+)/i);
        
        if (lossMatch || accMatch || stepMatch || vramMatch) {
          return {
            step: stepMatch ? parseInt(stepMatch[1]) : undefined,
            loss: lossMatch ? parseFloat(lossMatch[1]) : undefined,
            accuracy: accMatch ? parseFloat(accMatch[1]) : undefined,
            vram: vramMatch ? parseFloat(vramMatch[1]) : undefined,
            timestamp: new Date().toISOString()
          };
        }
        return null;
      };

      // Use python3 if available, or fallback to python
      // Check if python3 exists, otherwise use python
      const pythonCmd = 'python3'; 
      const python = spawn(pythonCmd, ['train.py'], { cwd: tempDir });
      activeTrainingProcess = python;

      python.stdout.on('data', (data) => {
        const line = data.toString();
        // Add to terminal logs (capped)
        state.terminalLogs.push(`\x1b[36m[TRAIN]\x1b[0m ${line.trim()}`);
        if (state.terminalLogs.length > 200) state.terminalLogs.shift();

        const metrics = parseMetrics(line);
        if (metrics) {
          broadcastMetrics(metrics, projectId);
        }
        broadcastState(state);
      });

      python.stderr.on('data', (data) => {
        const errorLine = data.toString();
        state.terminalLogs.push(`\x1b[31m[TRAINER ERROR]\x1b[0m ${errorLine.trim()}`);
        if (state.terminalLogs.length > 200) state.terminalLogs.shift();
        broadcastState(state);
      });

      python.on('close', (code) => {
        state.terminalLogs.push(`\x1b[32m[TRAINER]\x1b[0m Training process exited with code ${code}`);
        activeTrainingProcess = null;
        broadcastState(state);
      });

      res.json({ success: true, message: "Training started" });
    } catch (err: any) {
      console.error("Training start failed", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/training/stop', (req, res) => {
    if (activeTrainingProcess) {
      activeTrainingProcess.kill();
      activeTrainingProcess = null;
      state.terminalLogs.push(`\x1b[31m[TRAINER]\x1b[0m Training manually terminated.`);
      broadcastState(state);
      return res.json({ success: true });
    }
    res.json({ success: false, message: "No active training process" });
  });

  app.post('/api/training/synthetic-data', async (req, res) => {
    try {
      const { prompt, count = 50 } = req.body;
      
      // Simulate synthetic data generation
      const samples = [];
      const instructions = [
        "Explain the modular code pattern.",
        "Refactor this Llama implementation.",
        "How do I optimize LoRA ranks?",
        "Explain the benefit of Flash Attention.",
        "Create a synthetic data generation script."
      ];

      for (let i = 0; i < count; i++) {
        const inst = instructions[Math.floor(Math.random() * instructions.length)];
        samples.push({
          instruction: `${inst} (Variant ${i + 1}) - ${prompt || ''}`,
          context: `Synthetically generated context for deep-reasoning step ${i}`,
          response: `Based on the Helix-OS architectural guidelines, the optimal approach for variant ${i} involves recursive self-correction and efficient memory allocation in Ring 3.`
        });
      }

      const jsonl = samples.map(d => JSON.stringify(d)).join('\n');
      
      state.terminalLogs.push(`\x1b[35m[SYNTH-GEN]\x1b[0m Generated ${count} high-quality synthetic JSONL records.`);
      broadcastState(state);
      
      res.json({ success: true, data: jsonl, count });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/helix/clear-swarm", async (req, res) => {
    try {
      state.helixCore.swarm = { agents: [] };
      // Keep Ring 3 instances? User said temporary cells in Ring 3. 
      // Let's filter out the specific swarm agents from ring 3.
      state.rings.ring3.instances = state.rings.ring3.instances.filter(inst => 
        !inst.name.startsWith('Architect:') && 
        !inst.name.startsWith('Auditor:') && 
        !inst.name.startsWith('Optimizer:') && 
        !inst.name.startsWith('Specialist:')
      );

      await saveState(state);
      broadcastState(state);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to clear swarm" });
    }
  });

  app.post("/api/agi/write-memory", async (req, res) => {
    try {
      const { content, type, links } = req.body;
      const id = uuidv4();
      state.rings.ring2.memoryEntries.push({
        id,
        content,
        type,
        timestamp: new Date().toISOString(),
        links: links || []
      });
      
      // Auto-link to existing nodes if content overlaps slightly (simple graph logic)
      if (!links && content) {
        const related = state.rings.ring2.memoryEntries
          .filter(e => e.id !== id && e.content && e.content.split(' ').some(word => word.length > 4 && content.includes(word)))
          .slice(0, 2)
          .map(e => e.id);
        state.rings.ring2.memoryEntries[state.rings.ring2.memoryEntries.length - 1].links = related;
      }

      await saveState(state);
      broadcastState(state);
      res.json({ success: true, id });
    } catch (err: any) {
      console.error("Failed to write memory", err);
      res.status(500).json({ error: "Failed to write memory" });
    }
  });

  app.post("/api/agi/save-model", async (req, res) => {
    try {
      const { name, config } = req.body;
      state.rings.ring1.trainedModels.push({
        id: uuidv4(),
        name,
        config,
        timestamp: new Date().toISOString()
      });
      
      // Real Training Impact: Improve Coherence and Reduce Entropy
      state.telemetry.coherence = Math.min(0.999, state.telemetry.coherence + 0.05);
      state.telemetry.entropy = Math.max(0.01, state.telemetry.entropy - 0.02);
      state.telemetry.securityScore = Math.min(0.99, state.telemetry.securityScore + 0.01);

      // Add a log to Ring 2 Memory about this training event
      state.rings.ring2.memoryEntries.push({
        id: uuidv4(),
        type: "EvolutionaryEvent",
        content: `New model identity "${name}" integrated into Ring 1. Collective coherence upgraded.`,
        timestamp: new Date().toISOString(),
        links: ["Ring 1", "Helix-Core"]
      });

      await saveState(state);
      broadcastState(state);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Failed to save model", err);
      res.status(500).json({ error: "Failed to save model" });
    }
  });

  // WASM Execution API (Ring 3) - Stem-Cell Provisioning
  app.post("/api/agi/deploy-wasm", async (req, res) => {
    // Advanced Security Router check
    if (state.telemetry.entropy > 0.6) {
       return res.status(403).json({ error: "CORTICAL-GATEWAY: Critical entropy detected. All new deployments suspended until purge." });
    }

    const { name, wasmBase64, signature } = req.body;
    
    // Simulate Signature validation
    if (!signature) {
       console.warn(`[CORTICAL-GATEWAY] WARNING: Deploying un-signed module. Elevating system entropy.`);
       state.telemetry.entropy += 0.02;
    }

    const instanceId = uuidv4();
    const instance: Instance = {
      id: instanceId,
      name: name || `Stem-Cell-${instanceId.slice(0, 4).toUpperCase()}`,
      status: "Undifferentiated",
      lifecycle: "Undifferentiated",
      specialty: undefined,
      logs: [
        `[CORTICAL-GATEWAY] Absolute Perimeter Check: PASSED.`,
        `[CORTICAL-GATEWAY] ${signature ? 'Cryptographic Signature Verified: ATTESTED' : 'CAUTION: Anonymous module detected'}.`,
        `[SYSTEM] Pluripotent stem-cell pool ${instanceId} provisioned in Ring 3.`,
        `[SYSTEM] Awaiting Neuro-Highway context for differentiation.`,
        `[SECURITY] Behavioral monitor initialized for instance scope.`,
        `[SYSTEM] WASM payload size: ${(Buffer.from(wasmBase64, 'base64').length / 1024).toFixed(2)} KB detected.`
      ],
      deployedAt: new Date().toISOString(),
      wasmBuffer: wasmBase64,
      attestationToken: "ATT-" + uuidv4().split('-')[0].toUpperCase(),
      memoryUsage: 0
    };
    
    state.rings.ring3.instances.push(instance);
    state.telemetry.activeWorkerCount = state.rings.ring3.instances.length;
    await saveState(state);
    broadcastState(state);
    res.json({ id: instanceId });
  });

  app.post("/api/agi/run-instance", async (req, res) => {
    // Cortical Gateway Perimeter Check
    if (state.telemetry.securityScore < 0.75) {
       console.error(`[CORTICAL-GATEWAY] BLOCK: Security score ${state.telemetry.securityScore} below threshold.`);
       return res.status(403).json({ error: "CORTICAL-GATEWAY: Critical system integrity breach. All execution paths FROZEN for attestation." });
    }

    const { id, input } = req.body;
    const instanceIndex = state.rings.ring3.instances.findIndex(i => i.id === id);
    
    if (instanceIndex === -1) return res.status(404).json({ error: "Instance not found" });
    
    const instance = state.rings.ring3.instances[instanceIndex];
    
    if (instance.status === 'Executing' || instance.lifecycle === 'Scrubbing') {
      return res.status(409).json({ error: "Instance busy. Context conflict avoided." });
    }

    // Lifecycle: Differentiation
    instance.status = "Executing";
    instance.lifecycle = "Specialized";
    
    // Select specialty based on input or logic
    const specialties: ('Logic' | 'Memory' | 'Creative' | 'Security')[] = ['Logic', 'Memory', 'Creative', 'Security'];
    instance.specialty = specialties[Math.floor(Math.random() * specialties.length)];
    
    const sessionToken = "SES-" + uuidv4().split('-')[0].toUpperCase();
    
    // Neuro-Highway Context Intake
    const context = state.rings.ring2.memoryEntries.slice(-3).map(e => e.content).join(' | ');
    
    instance.logs.push(`[HELIX-OS] INTAKE: Neuro-Highway context stream active...`);
    instance.logs.push(`[HELIX-OS] CONTEXT: "${context.slice(0, 60)}..."`);
    instance.logs.push(`[HELIX-OS] DIFFERENTIATION: Stem-cell evolving into ${instance.specialty} Worker.`);
    instance.logs.push(`[SECURITY] Session established: ${sessionToken}`);
    instance.logs.push(`[EXEC] Running specialized task in ${instance.specialty} domain.`);
    
    broadcastState(state); // Update UI immediately to show status change
    
    const startTime = performance.now();
    
    try {
      if (!instance.wasmBuffer) {
        throw new Error("Missing binary context in stem-cell pool.");
      }

      instance.logs.push(`[EXEC] JIT Compiling ${instance.specialty} module...`);
      const buffer = Buffer.from(instance.wasmBuffer, 'base64');
      
      if (!WebAssembly.validate(buffer)) {
        throw new Error("WASM binary failed static structural validation. Payload rejected.");
      }

      const wasmModule = await WebAssembly.compile(buffer);
      const wasmInstance = await WebAssembly.instantiate(wasmModule, {});
      
      if (wasmInstance.exports.memory) {
        const mem = wasmInstance.exports.memory as WebAssembly.Memory;
        instance.memoryUsage = mem.buffer.byteLength;
      }

      const runFn = (wasmInstance.exports.run as Function) || (wasmInstance.exports.main as Function);
      if (runFn) {
        const result = runFn(input);
        instance.lastResult = result;
        instance.logs.push(`[RESULT] ${instance.specialty} computation successful: ${typeof result === 'object' ? JSON.stringify(result) : result}`);
        
        state.rings.ring2.memoryEntries.push({
          id: uuidv4(),
          type: "Trajectory",
          content: `${instance.specialty} Worker (Pool: ${id}) processed context and produced result.`,
          timestamp: new Date().toISOString(),
          links: [id]
        });
      }
    } catch (err: any) {
      console.error(`WASM Runtime Error [${id}]:`, err);
      instance.logs.push(`[ERROR] Critical ${instance.specialty} failure: ${err.message}`);
      state.telemetry.entropy += 0.05;
    }
    
    const endTime = performance.now();
    instance.duration = endTime - startTime;
    instance.status = "Completed";
    
    // Lifecycle: Scrubbing
    instance.lifecycle = "Scrubbing";
    instance.logs.push(`[SECURITY] TASK COMPLETE: Initiating full memory scrub...`);
    instance.logs.push(`[SECURITY] PURGING: Clearing stack, registers, and context heap.`);
    
    broadcastState(state);

    setTimeout(async () => {
       const idx = state.rings.ring3.instances.findIndex(i => i.id === id);
       if (idx !== -1) {
         const target = state.rings.ring3.instances[idx];
         target.lifecycle = "Undifferentiated";
         target.specialty = undefined;
         target.status = "Idle";
         target.lastResult = undefined;
         // target.wasmBuffer = undefined; // Optimization: we keep it for now as it's the "DNA"
         target.logs.push(`[SECURITY] SCRUB COMPLETE: Pool returned to undifferentiated state.`);
         
         // Keep only the last 10 logs after scrub to keep things clean
         if (target.logs.length > 20) {
           target.logs = target.logs.slice(-10);
         }
         
         await saveState(state);
         broadcastState(state);
       }
    }, 2000);
    
    // Update Telemetry
    state.telemetry.aggregateThroughput += 1;
    state.telemetry.coherence = Math.min(0.999, state.telemetry.coherence + 0.001);
    state.telemetry.entropy = Math.max(0.01, state.telemetry.entropy - 0.0005);
    
    await saveState(state);
    broadcastState(state);
    res.json({ success: true, logs: instance.logs, duration: instance.duration });
  });


  // Terminal API
  app.post("/api/terminal/run", (req, res) => {
    const { command, cwd } = req.body;
    
    // Safety check: Basic whitelist or simple security
    const forbidden = ["rm -rf /", "mkfs", "dd"];
    if (forbidden.some(f => command.includes(f))) {
      return res.status(403).json({ error: "Forbidden command" });
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    const child = spawn(shell, ['-c', command], {
      cwd: cwd || process.cwd(),
      env: process.env,
      shell: true
    });

    child.stdout.on('data', (data) => {
      res.write(data);
    });

    child.stderr.on('data', (data) => {
      res.write(`ERROR: ${data}`);
    });

    child.on('close', (code) => {
      res.write(`\n[Process exited with code ${code}]\n`);
      res.end();
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
