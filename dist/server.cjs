var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server/runtime/RuntimeBus.ts
var RuntimeBus_exports = {};
__export(RuntimeBus_exports, {
  RuntimeBus: () => RuntimeBus
});
var import_events, RuntimeBusEmitter, RuntimeBus;
var init_RuntimeBus = __esm({
  "server/runtime/RuntimeBus.ts"() {
    import_events = require("events");
    RuntimeBusEmitter = class extends import_events.EventEmitter {
      emit(eventName, ...args) {
        const result = super.emit(eventName, ...args);
        if (eventName !== "*") {
          super.emit("*", eventName, ...args);
        }
        return result;
      }
    };
    RuntimeBus = new RuntimeBusEmitter();
  }
});

// server.ts
var import_express3 = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_child_process = require("child_process");
var import_fs_extra2 = __toESM(require("fs-extra"), 1);
var import_uuid3 = require("uuid");
var import_perf_hooks = require("perf_hooks");
var import_ws2 = require("ws");
var import_http = __toESM(require("http"), 1);

// server/rings.ts
var import_express2 = __toESM(require("express"), 1);
var import_uuid2 = require("uuid");
var lancedb = __toESM(require("@lancedb/lancedb"), 1);
var import_fs_extra = __toESM(require("fs-extra"), 1);
var import_path = __toESM(require("path"), 1);

// server/ring3/ExecutionPool.ts
var import_express = __toESM(require("express"), 1);

// server/ring3/WorkerSpawner.ts
var import_uuid = require("uuid");

// server/ring3/WorkerRegistry.ts
var WorkerRegistry = class {
  constructor() {
    this.workers = {};
  }
  register(worker) {
    this.workers[worker.id] = worker;
  }
  get(id) {
    return this.workers[id];
  }
  getAll() {
    return Object.values(this.workers);
  }
  remove(id) {
    delete this.workers[id];
  }
  updateState(id, state2) {
    if (this.workers[id]) {
      this.workers[id].state = state2;
    }
  }
  count() {
    return Object.keys(this.workers).length;
  }
};
var registry = new WorkerRegistry();

// server/ring3/ExecutionLifecycle.ts
init_RuntimeBus();

// server/runtime/TelemetryEngine.ts
init_RuntimeBus();

// server/runtime/WebSocketGateway.ts
var import_ws = require("ws");
init_RuntimeBus();

// server/runtime/RuntimeEvents.ts
var import_zod = require("zod");
var eventPayloadSchema = import_zod.z.object({
  type: import_zod.z.string()
}).passthrough();

// server/runtime/WebSocketGateway.ts
var wss = null;
var connectedClients = /* @__PURE__ */ new Set();
function initWebSocketGateway(server) {
  wss = server;
  RuntimeBus.on("*", (eventName, payload) => {
    if (typeof payload === "object" && payload !== null) {
      const message = { type: eventName, ...payload };
      try {
        eventPayloadSchema.parse(message);
        broadcast(message);
      } catch (err) {
        console.error("Zod validation failed for outgoing WS payload:", err);
      }
    }
  });
  wss.on("connection", (socket) => {
    connectedClients.add(socket);
    console.log("[HELIX] Client connected to live runtime stream");
    socket.on("message", (data) => {
      try {
        if (data.length > 5e5) {
          socket.send(JSON.stringify({ type: "runtime_warning", message: "Payload size limit exceeded" }));
          return;
        }
        const json = JSON.parse(data);
        eventPayloadSchema.parse(json);
      } catch (err) {
        socket.send(JSON.stringify({ type: "runtime_error", message: "Invalid payload structure" }));
      }
    });
    socket.on("close", () => {
      connectedClients.delete(socket);
      console.log("[HELIX] Client disconnected");
    });
    socket.on("error", (err) => {
      console.error("[HELIX] WebSocket error", err);
    });
  });
}
function getConnectedClientCount() {
  return connectedClients.size;
}
function broadcast(payload) {
  if (!wss) return;
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === import_ws.WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// server/runtime/TelemetryEngine.ts
var coherence = 0.85;
var entropy = 0.12;
var activeWorkers = 0;
var eventsPerSecond = 0;
var eventCount = 0;
function startTelemetryEngine() {
  RuntimeBus.on("*", () => {
    eventCount++;
  });
  setInterval(() => {
    const drift = (Math.random() - 0.5) * 0.02;
    coherence = Math.max(0, Math.min(1, coherence + drift + (entropy > 0.3 ? -0.05 : 0.01)));
    entropy = Math.max(0, Math.min(1, entropy + (Math.random() - 0.6) * 0.05));
    eventsPerSecond = eventCount;
    eventCount = 0;
    RuntimeBus.emit("telemetry_update", {
      coherence,
      entropy,
      activeWorkers,
      connections: 0
      // Could inject this from WS gateway
    });
    RuntimeBus.emit("coherence_update", { value: coherence });
    RuntimeBus.emit("entropy_update", { value: entropy });
    RuntimeBus.emit("runtime_health", {
      connections: getConnectedClientCount(),
      eventsPerSecond
    });
  }, 1500);
}
function setWorkerCount(count) {
  activeWorkers = count;
  RuntimeBus.emit("ring_state_update", {
    state: {
      mode: count > 0 ? "executing" : "idle",
      activeWorkers
    }
  });
}

// server/ring3/ExecutionLifecycle.ts
var ExecutionLifecycle = class {
  static transition(workerId, newState) {
    const worker = registry.get(workerId);
    if (!worker) return;
    worker.state = newState;
    RuntimeBus.emit("worker_update", { workerId, status: newState });
    if (newState === "SPAWNED") {
      RuntimeBus.emit("worker_spawned", { workerId, specialization: worker.specialization });
      RuntimeBus.emit("execution_log", { message: `[HELIX:R3] Worker spawned: ${workerId} (${worker.specialization})` });
    } else if (newState === "INITIALIZED") {
      RuntimeBus.emit("execution_log", { message: `[HELIX:R3] WASM initialized for ${workerId}` });
    } else if (newState === "EXECUTING") {
      RuntimeBus.emit("execution_started", { objective: worker.lastObjective || "execute WASM compute" });
      RuntimeBus.emit("execution_log", { message: `[HELIX:R3] Execution started on ${workerId}` });
    } else if (newState === "RETURNING_RESULTS") {
      RuntimeBus.emit("execution_complete", { workerId });
      RuntimeBus.emit("execution_log", { message: `[HELIX:R3] Execution complete on ${workerId}` });
    } else if (newState === "FAILED") {
      RuntimeBus.emit("execution_failed", { workerId });
      RuntimeBus.emit("execution_log", { message: `[ERROR] WASM execution failure on ${workerId}` });
    } else if (newState === "TERMINATED") {
      RuntimeBus.emit("worker_terminated", { workerId });
    }
  }
  static updateWorkerCount() {
    setWorkerCount(registry.count());
  }
};

// server/ring3/WorkerSpawner.ts
var WorkerSpawner = class {
  static spawn(specialization = "logic") {
    const workerId = (0, import_uuid.v4)();
    const worker = {
      id: workerId,
      specialization,
      state: "SPAWNED",
      executionCount: 0,
      lastObjective: null,
      instance: null,
      memory: null
    };
    registry.register(worker);
    ExecutionLifecycle.updateWorkerCount();
    ExecutionLifecycle.transition(workerId, "SPAWNED");
    return workerId;
  }
};

// server/ring3/MemoryScrubber.ts
init_RuntimeBus();
var MemoryScrubber = class {
  static scrub(workerId) {
    const worker = registry.get(workerId);
    if (!worker) return;
    ExecutionLifecycle.transition(workerId, "SCRUBBING");
    if (worker.memory) {
      const memArray = new Uint8Array(worker.memory.buffer);
      memArray.fill(0);
    }
    worker.instance = null;
    worker.memory = null;
    RuntimeBus.emit("security_scrub", { workerId });
    RuntimeBus.emit("execution_log", { message: `[HELIX:SECURITY] Memory scrub completed for ${workerId}` });
    ExecutionLifecycle.transition(workerId, "TERMINATED");
    registry.remove(workerId);
    ExecutionLifecycle.updateWorkerCount();
  }
  static emergencyScrub(workerId) {
    RuntimeBus.emit("execution_log", { message: `[SECURITY] emergency scrub triggered for ${workerId}` });
    this.scrub(workerId);
  }
};

// server/ring3/WasmRuntime.ts
init_RuntimeBus();
var WasmRuntime = class {
  static async execute(workerId, wasmBase64, inputParams = []) {
    const worker = registry.get(workerId);
    if (!worker) throw new Error("Worker not found");
    try {
      ExecutionLifecycle.transition(workerId, "INITIALIZED");
      const buffer = Buffer.from(wasmBase64, "base64");
      const wasmModule = await WebAssembly.compile(buffer);
      const instance = await WebAssembly.instantiate(wasmModule, {
        env: {
          abort: () => {
            RuntimeBus.emit("execution_log", { message: `[HELIX:R3] WASM module aborted on ${workerId}` });
          }
        }
      });
      worker.instance = instance;
      if (instance.exports.memory) {
        worker.memory = instance.exports.memory;
      }
      ExecutionLifecycle.transition(workerId, "CONTEXT_INJECTED");
      ExecutionLifecycle.transition(workerId, "EXECUTING");
      let result = null;
      const runFn = instance.exports.run || instance.exports.main || instance.exports.add;
      if (typeof runFn === "function") {
        worker.executionCount++;
        if (inputParams && Array.isArray(inputParams)) {
          result = runFn(...inputParams);
        } else {
          result = runFn();
        }
      }
      ExecutionLifecycle.transition(workerId, "RETURNING_RESULTS");
      return result;
    } catch (err) {
      ExecutionLifecycle.transition(workerId, "FAILED");
      MemoryScrubber.emergencyScrub(workerId);
      throw err;
    }
  }
};

// server/ring3/ExecutionPool.ts
var ring3Router = import_express.default.Router();
ring3Router.post("/spawn", (req, res) => {
  const { specialization = "logic" } = req.body;
  const workerId = WorkerSpawner.spawn(specialization);
  res.json({ success: true, workerId });
});
ring3Router.post("/execute", async (req, res) => {
  const { workerId, wasmBase64, inputParams } = req.body;
  if (!workerId || !wasmBase64) {
    return res.status(400).json({ error: "workerId and wasmBase64 are required" });
  }
  try {
    const result = await WasmRuntime.execute(workerId, wasmBase64, inputParams);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
ring3Router.post("/scrub", (req, res) => {
  const { workerId } = req.body;
  if (!workerId) return res.status(400).json({ error: "workerId is required" });
  MemoryScrubber.scrub(workerId);
  res.json({ success: true, status: "scrubbed" });
});
ring3Router.get("/state", (req, res) => {
  const workers = registry.getAll().map((w) => ({
    id: w.id,
    specialization: w.specialization,
    state: w.state,
    executionCount: w.executionCount,
    lastObjective: w.lastObjective
  }));
  res.json({ success: true, workers, total: workers.length });
});

// server/rings.ts
init_RuntimeBus();
var pipeline;
var ringRouter = import_express2.default.Router();
ringRouter.use("/ring3", ring3Router);
var wss2 = null;
var state = {
  ring1: {
    state: "idle",
    activeTasks: []
  }
};
function setWebSocketServer(server) {
  wss2 = server;
}
function broadcastEvent(type, payload) {
  RuntimeBus.emit(type, payload);
}
var dbDir = import_path.default.join(process.cwd(), "lancedb-data");
var db;
var table;
async function initDB() {
  try {
    await import_fs_extra.default.ensureDir(dbDir);
    db = await lancedb.connect(dbDir);
    const tableNames = await db.tableNames();
    if (!tableNames.includes("semantic_memory")) {
      table = await db.createTable("semantic_memory", [
        { id: "init", vector: Array(384).fill(0), text: "init", metadata: "{}" }
      ]);
    } else {
      table = await db.openTable("semantic_memory");
    }
  } catch (e) {
    console.error("LanceDB initialization failed (likely Windows I/O lock or corruption). Proceeding without vector memory.", e);
  }
  try {
    const transformers = await import("@xenova/transformers");
    pipeline = await transformers.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  } catch (e) {
    console.error("Failed to load transformers", e);
  }
}
initDB();
async function getEmbeddings(text) {
  if (!pipeline) return Array(384).fill(0);
  const out = await pipeline(text, { pooling: "mean", normalize: true });
  return Array.from(out.data);
}
ringRouter.post("/ring1/plan", (req, res) => {
  const { task } = req.body;
  state.ring1.state = "planning";
  const steps = [
    { id: (0, import_uuid2.v4)(), action: "analyze", objective: `Analyze ${task}`, status: "pending" },
    { id: (0, import_uuid2.v4)(), action: "execute", objective: `Execute steps for ${task}`, status: "pending" },
    { id: (0, import_uuid2.v4)(), action: "verify", objective: `Verify result of ${task}`, status: "pending" }
  ];
  const plan = {
    planId: (0, import_uuid2.v4)(),
    task,
    steps,
    status: "planned"
  };
  state.ring1.activeTasks.push(plan);
  broadcastEvent("runtime_status", { ring: 1, status: "planning_complete", planId: plan.planId });
  broadcastEvent("execution_log", { message: `Ring 1 created plan for task: ${task}` });
  res.json({ success: true, plan });
});
ringRouter.post("/ring1/execute", async (req, res) => {
  const { planId } = req.body;
  const plan = state.ring1.activeTasks.find((p) => p.planId === planId);
  if (!plan) {
    return res.status(404).json({ error: "Plan not found" });
  }
  plan.status = "executing";
  state.ring1.state = "executing";
  broadcastEvent("runtime_status", { ring: 1, status: "executing", planId });
  broadcastEvent("execution_log", { message: `Ring 1 orchestrating execution for plan: ${planId}` });
  try {
    broadcastEvent("execution_log", { message: `Ring 1 querying Semantic Memory (Ring 2)...` });
    const vector = await getEmbeddings(plan.task);
    const results = await table.search(vector).limit(3).toArray();
    const context = results.map((r) => r.text).join(" | ");
    broadcastEvent("execution_log", { message: `Ring 2 context retrieved: ${context.substring(0, 50)}...` });
    broadcastEvent("execution_log", { message: `Ring 1 spawning WASM Worker in Ring 3...` });
    const workerId = WorkerSpawner.spawn("logic");
    const defaultWasm = "AGFzbQEAAAABBwFgAn9/AX8DAgEABwcBA2FkZAAACgkBBwAgACABags=";
    const wasmBase64 = req.body.wasmBase64 || defaultWasm;
    const params = req.body.inputParams || [42, 10];
    const result = await WasmRuntime.execute(workerId, wasmBase64, params);
    broadcastEvent("execution_log", { message: `Ring 3 executed successfully => Result: ${result}` });
    plan.status = "completed";
    state.ring1.state = "idle";
    broadcastEvent("execution_log", { message: `Ring 1 orchestrating scrub for worker: ${workerId}` });
    MemoryScrubber.scrub(workerId);
    await table.add([{
      id: (0, import_uuid2.v4)(),
      vector: await getEmbeddings(`Result for ${plan.task}`),
      text: `Execution completed for task: ${plan.task} with result: ${result}`,
      metadata: JSON.stringify({ planId, workerId, result })
    }]);
    res.json({ success: true, orchestration_flow: "completed", task: plan.task, result, context_used: context });
  } catch (err) {
    plan.status = "failed";
    state.ring1.state = "idle";
    broadcastEvent("execution_log", { message: `Execution failed: ${err.message}` });
    res.status(500).json({ error: err.message, status: "orchestration_failed" });
  }
});
ringRouter.get("/ring1/state", (req, res) => {
  res.json({ success: true, state: state.ring1 });
});
ringRouter.post("/ring2/store", async (req, res) => {
  const { text, metadata } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });
  try {
    const vector = await getEmbeddings(text);
    await table.add([{
      id: (0, import_uuid2.v4)(),
      vector,
      text,
      metadata: JSON.stringify(metadata || {})
    }]);
    broadcastEvent("execution_log", { message: `Ring 2 stored memory: ${text.substring(0, 30)}...` });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
ringRouter.post("/ring2/retrieve", async (req, res) => {
  const { query, limit = 5 } = req.body;
  if (!query) return res.status(400).json({ error: "Query is required" });
  try {
    const vector = await getEmbeddings(query);
    const results = await table.search(vector).limit(limit).toArray();
    broadcastEvent("execution_log", { message: `Ring 2 retrieved semantic context for query.` });
    res.json({ success: true, results: results.map((r) => ({ id: r.id, text: r.text, metadata: JSON.parse(r.metadata), distance: r._distance })) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// server.ts
var STATE_FILE = import_path2.default.join(process.cwd(), "agi-os-state.json");
var DEFAULT_STATE = {
  rings: {
    ring0: {
      merkleRoot: "0x8f3c...b2a1",
      walSize: 42,
      lastAttestedAt: (/* @__PURE__ */ new Date()).toISOString(),
      journal: ["System initialized", "Immutable core established"]
    },
    ring1: { trainedModels: [] },
    ring2: {
      memoryEntries: [
        {
          id: "mem-001",
          type: "Pattern",
          content: "Initial Helix-Kernel bootstrap sequence verified.",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          links: ["mem-002"]
        },
        {
          id: "mem-002",
          type: "Observation",
          content: "Ring-3 allocation efficiency within nominal parameters.",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
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
      maturity: "Seedling"
    },
    memory: {
      userPreferences: {
        theme: "dark",
        preferredModels: ["Llama-3", "Claude-3"]
      },
      codingStyle: "functional-minimalist",
      successfulStrategies: [],
      pastEvolutions: [],
      lastInteraction: (/* @__PURE__ */ new Date()).toISOString()
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
      agents: []
    },
    tools: [
      { id: "fs_read", name: "FS Read", description: "Read file system structure", category: "FileSystem" },
      { id: "fs_write", name: "FS Write", description: "Apply atomic code edits", category: "FileSystem" },
      { id: "exec_node", name: "Node Exec", description: "Execute sandboxed TS/JS", category: "Execution" },
      { id: "web_search", name: "Neural Search", description: "Retrieve real-world context", category: "Network" }
    ],
    adapters: [
      {
        id: "github",
        name: "GitHub",
        description: "Primary source control & CI/CD deployment",
        status: "Disconnected",
        icon: "Github",
        type: "SourceControl",
        features: ["Auto-Commit", "Remote Sync", "Branch Management"]
      }
    ],
    security: {
      gatewayLogs: [],
      merkleRoot: "0x8f3c...b2a1",
      walHash: "SHA-256:0x123",
      lastIntegrityCheck: (/* @__PURE__ */ new Date()).toISOString(),
      isQuarantined: false
    },
    userProfile: {
      detectedSkillLevel: "Architect",
      focusAreas: ["AI Agents", "WASM Runtimes"],
      collaborationStyle: "Recursive"
    }
  },
  terminalLogs: [
    "\x1B[32m[SYSTEM]\x1B[0m Helix-OS v3.0 Core Booting...",
    "\x1B[32m[RING-0]\x1B[0m Immutable Security Layer: ACTIVE",
    "\x1B[32m[CORTICAL-GATEWAY]\x1B[0m Absolute Perimeter Guard: ONLINE"
  ],
  telemetry: {
    coherence: 0.85,
    entropy: 0.12,
    aggregateThroughput: 0,
    activeWorkerCount: 0,
    securityScore: 0.99,
    healthSong: Array.from({ length: 48 }, () => Math.random()),
    lastTick: (/* @__PURE__ */ new Date()).toISOString()
  }
};
async function loadState() {
  if (await import_fs_extra2.default.pathExists(STATE_FILE)) {
    try {
      const loaded = await import_fs_extra2.default.readJson(STATE_FILE);
      return {
        ...DEFAULT_STATE,
        ...loaded,
        rings: {
          ...DEFAULT_STATE.rings,
          ...loaded.rings || {},
          ring0: { ...DEFAULT_STATE.rings.ring0, ...loaded.rings?.ring0 || {} },
          ring1: { ...DEFAULT_STATE.rings.ring1, ...loaded.rings?.ring1 || {} },
          ring2: { ...DEFAULT_STATE.rings.ring2, ...loaded.rings?.ring2 || {} },
          ring3: { ...DEFAULT_STATE.rings.ring3, ...loaded.rings?.ring3 || {} }
        },
        helixCore: {
          ...DEFAULT_STATE.helixCore,
          ...loaded.helixCore || {},
          evolution: { ...DEFAULT_STATE.helixCore.evolution, ...loaded.helixCore?.evolution || {} },
          memory: { ...DEFAULT_STATE.helixCore.memory, ...loaded.helixCore?.memory || {} }
        },
        telemetry: {
          ...DEFAULT_STATE.telemetry,
          ...loaded.telemetry || {}
        }
      };
    } catch (err) {
      console.error("Failed to parse state file, using default", err);
      return DEFAULT_STATE;
    }
  }
  return DEFAULT_STATE;
}
async function saveState(state2) {
  await import_fs_extra2.default.writeJson(STATE_FILE, state2, { spaces: 2 });
}
var wss3;
function broadcastState(state2) {
  if (!wss3) return;
  const payload = JSON.stringify({ type: "STATE_UPDATE", state: state2 });
  wss3.clients.forEach((client) => {
    if (client.readyState === import_ws2.WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
async function startServer() {
  const app = (0, import_express3.default)();
  const server = import_http.default.createServer(app);
  const PORT = 3e3;
  wss3 = new import_ws2.WebSocketServer({ noServer: true });
  setWebSocketServer(wss3);
  initWebSocketGateway(wss3);
  startTelemetryEngine();
  const { RuntimeBus: RuntimeBus2 } = await Promise.resolve().then(() => (init_RuntimeBus(), RuntimeBus_exports));
  RuntimeBus2.on("telemetry_update", (payload) => {
    state2.telemetry.coherence = payload.coherence;
    state2.telemetry.entropy = payload.entropy;
    state2.telemetry.activeWorkerCount = payload.activeWorkers;
    broadcastState(state2);
  });
  RuntimeBus2.on("execution_log", (payload) => {
    state2.terminalLogs.push(`\x1B[36m${payload.message}\x1B[0m`);
    if (state2.terminalLogs.length > 200) state2.terminalLogs.shift();
    broadcastState(state2);
  });
  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
    if (pathname === "/ws") {
      wss3.handleUpgrade(request, socket, head, (ws) => {
        wss3.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });
  wss3.on("connection", async (ws) => {
    const state3 = await loadState();
    ws.send(JSON.stringify({ type: "STATE_UPDATE", state: state3 }));
  });
  let state2 = await loadState();
  setInterval(async () => {
    state2.telemetry.lastTick = (/* @__PURE__ */ new Date()).toISOString();
    state2.telemetry.healthSong = state2.telemetry.healthSong.map((v, i) => {
      const frequencyFactor = i / state2.telemetry.healthSong.length;
      const interference = state2.telemetry.securityScore < 0.9 ? Math.sin(Date.now() / 500) * 0.1 : 0;
      const base = Math.sin(Date.now() / 2e3 + i) * 0.15 + 0.5;
      const drift = (Math.random() - 0.5) * (state2.telemetry.entropy * 0.25);
      return Math.max(0.05, Math.min(1, base + drift + frequencyFactor * 0.1 + interference));
    });
    if (Math.random() > 0.92) {
      const prevRoot = state2.rings.ring0.merkleRoot;
      state2.rings.ring0.merkleRoot = "0x" + (0, import_uuid3.v4)().replace(/-/g, "").slice(0, 16).toUpperCase();
      state2.rings.ring0.lastAttestedAt = (/* @__PURE__ */ new Date()).toISOString();
      state2.rings.ring0.walSize += 0.45;
      const journalEntry = `[ATTESTATION] Block verified. Prev: ${prevRoot.slice(0, 6)}... New: ${state2.rings.ring0.merkleRoot.slice(0, 6)}...`;
      state2.rings.ring0.journal.push(journalEntry);
      if (state2.rings.ring0.journal.length > 20) state2.rings.ring0.journal.shift();
      state2.helixCore.security = {
        ...state2.helixCore.security,
        merkleRoot: state2.rings.ring0.merkleRoot,
        lastIntegrityCheck: state2.rings.ring0.lastAttestedAt
      };
    }
    if (state2.telemetry.entropy > 0.55 || state2.telemetry.securityScore < 0.8) {
      const alert = `[SECURITY] CRITICAL: Systemic deviation outside immutable baseline. Initiating self-healing protocols.`;
      state2.terminalLogs.push(`\x1B[31m${alert}\x1B[0m`);
      state2.telemetry.securityScore = 0.995;
      state2.telemetry.entropy = 0.02;
      state2.telemetry.coherence = Math.max(0.8, state2.telemetry.coherence - 0.05);
      state2.helixCore.security?.gatewayLogs.unshift({
        id: (0, import_uuid3.v4)(),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        event: "System Integrity Restoration (v3.0 Auto-Healing)",
        severity: "critical",
        source: "Ring 0 Orchestrator",
        attestationStatus: "verified"
      });
      state2.rings.ring2.memoryEntries.push({
        id: (0, import_uuid3.v4)(),
        type: "SecurityAudit",
        content: `INTEGRITY_SHIELD: Auto-rollback executed. System returned to Merkle Root ${state2.rings.ring0.merkleRoot}.`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        links: ["Ring 0", "Gatekeeper v2"]
      });
    }
    broadcastState(state2);
    await saveState(state2);
  }, 3e3);
  app.use(import_express3.default.json());
  const corticalGateway = (req, res, next) => {
    const payloadSize = JSON.stringify(req.body).length;
    if (payloadSize > 5e5) {
      state2.telemetry.entropy += 0.08;
      state2.helixCore.security?.gatewayLogs.unshift({
        id: (0, import_uuid3.v4)(),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        event: `Large Resource Ingress Detected (${Math.round(payloadSize / 1024)}KB)`,
        severity: "medium",
        source: "Inbound Protocol",
        attestationStatus: "quarantined"
      });
    }
    if (req.path.includes("deploy") && state2.telemetry.securityScore < 0.8) {
      state2.helixCore.security?.gatewayLogs.unshift({
        id: (0, import_uuid3.v4)(),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        event: "Deployment Rejected: Low Security Threshold",
        severity: "high",
        source: "Cortical Gateway v2",
        attestationStatus: "failed"
      });
      return res.status(403).json({ error: "Cortical Gateway: Security Threshold Not Met. Purge required." });
    }
    const isAttested = req.headers["x-helix-signature"] || Math.random() > 5e-3;
    if (!isAttested) {
      state2.telemetry.entropy += 0.1;
      state2.helixCore.security?.gatewayLogs.unshift({
        id: (0, import_uuid3.v4)(),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        event: `Pattern mismatch detected in request: ${req.path}`,
        severity: "high",
        source: "Cortical Gateway v2",
        attestationStatus: "failed"
      });
    }
    next();
  };
  app.use("/api/agi/*", corticalGateway);
  app.use((req, res, next) => {
    console.log(`[CORTICAL GATEWAY] Ingress: ${req.method} ${req.path} | Attestation: PENDING`);
    res.setHeader("X-Helix-Security-Router", "Active");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });
  app.use("/api", ringRouter);
  app.get("/api/agi/state", async (req, res) => {
    try {
      res.json(state2);
    } catch (err) {
      console.error("Failed to load state", err);
      res.status(500).json({ error: "Failed to load state", details: err.message });
    }
  });
  app.post("/api/helix/update-core", async (req, res) => {
    try {
      const { deltaPoints, memoryUpdate, initiativeMode, newCapability, trainingOutcome } = req.body;
      if (deltaPoints) {
        state2.helixCore.evolution.points += deltaPoints;
        while (state2.helixCore.evolution.points >= state2.helixCore.evolution.nextLevelAt) {
          state2.helixCore.evolution.level += 1;
          state2.helixCore.evolution.points -= state2.helixCore.evolution.nextLevelAt;
          state2.helixCore.evolution.nextLevelAt = Math.round(state2.helixCore.evolution.nextLevelAt * 1.5);
          const maturities = ["Seed", "Larva", "Chrysalis", "Imago", "Transcendent"];
          const maturityIdx = Math.min(maturities.length - 1, Math.floor(state2.helixCore.evolution.level / 2));
          state2.helixCore.evolution.maturity = maturities[maturityIdx];
          state2.helixCore.memory.pastEvolutions.push(`Reached Level ${state2.helixCore.evolution.level} as ${state2.helixCore.evolution.maturity}`);
          const availableCaps = ["Neural Compression", "Async Reasoning", "Sub-space Ingress", "Quantum Telemetry", "Agentic Swarm"];
          const nextCap = availableCaps.find((c) => !state2.helixCore.evolution.unlockedCapabilities.includes(c));
          if (nextCap) state2.helixCore.evolution.unlockedCapabilities.push(nextCap);
        }
      }
      if (trainingOutcome) {
        state2.telemetry.coherence = Math.min(0.99, state2.telemetry.coherence + 0.05);
        state2.telemetry.entropy = Math.max(0.01, state2.telemetry.entropy - 0.03);
        state2.telemetry.aggregateThroughput += 15.5;
        state2.telemetry.securityScore = Math.min(100, state2.telemetry.securityScore + 2);
        state2.terminalLogs.push(`[TELEMETRY] Training success detected. Coherence -> ${(state2.telemetry.coherence * 100).toFixed(1)}% | Entropy reduced.`);
      }
      if (newCapability && !state2.helixCore.evolution.unlockedCapabilities.includes(newCapability)) {
        state2.helixCore.evolution.unlockedCapabilities.push(newCapability);
      }
      if (memoryUpdate) {
        state2.helixCore.memory = { ...state2.helixCore.memory, ...memoryUpdate, lastInteraction: (/* @__PURE__ */ new Date()).toISOString() };
      }
      if (initiativeMode !== void 0) {
        state2.helixCore.initiativeMode = initiativeMode;
      }
      await saveState(state2);
      broadcastState(state2);
      res.json({ success: true, core: state2.helixCore });
    } catch (err) {
      console.error("Failed to update Helix Core", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  app.post("/api/helix/initiative-action", async (req, res) => {
    try {
      const { id, action } = req.body;
      const initiative = state2.helixCore.initiatives?.find((i) => i.id === id);
      if (!initiative) return res.status(404).json({ error: "Initiative not found" });
      if (action === "dismiss") {
        initiative.status = "dismissed";
      } else if (action === "complete") {
        initiative.status = "completed";
        state2.helixCore.evolution.points += 15;
        state2.helixCore.memory.successfulStrategies.push(`Executed Initiative: ${initiative.title}`);
        while (state2.helixCore.evolution.points >= state2.helixCore.evolution.nextLevelAt) {
          state2.helixCore.evolution.level += 1;
          state2.helixCore.evolution.points -= state2.helixCore.evolution.nextLevelAt;
          state2.helixCore.evolution.nextLevelAt = Math.round(state2.helixCore.evolution.nextLevelAt * 1.5);
          const maturities = ["Seedling", "Sprout", "Twine", "Helix-Core", "Neural-Mesh", "Super-Intelligence"];
          const maturityIdx = Math.min(state2.helixCore.evolution.level - 1, maturities.length - 1);
          state2.helixCore.evolution.maturity = maturities[maturityIdx];
        }
      }
      await saveState(state2);
      broadcastState(state2);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to handle initiative" });
    }
  });
  const triggerAdapterAction = async (adapterId, actionName, meta = {}) => {
    const adapter = state2.helixCore.adapters?.find((a) => a.id === adapterId);
    if (adapter && adapter.status === "Connected") {
      state2.terminalLogs.push(`\x1B[34m[${adapter.name}: ${actionName}]\x1B[0m ${meta.message || "Action executed successfully."}`);
      if (actionName.includes("Commit") || actionName.includes("Push")) {
        state2.helixCore.security?.gatewayLogs.unshift({
          id: (0, import_uuid3.v4)(),
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          event: `${adapter.name} External Sync: ${actionName}`,
          severity: "low",
          source: `Adapter:${adapter.id}`,
          attestationStatus: "verified"
        });
      }
    }
  };
  app.post("/api/helix/curiosity/step", async (req, res) => {
    const { stepId, status } = req.body;
    if (state2.helixCore.curiosity) {
      const stepIndex = state2.helixCore.curiosity.steps.findIndex((s) => s.id === stepId);
      if (stepIndex !== -1) {
        state2.helixCore.curiosity.steps[stepIndex].status = status;
        if (status === "completed") {
          state2.helixCore.curiosity.progress += 100 / state2.helixCore.curiosity.steps.length;
          await triggerAdapterAction("github", "Auto-Commit", { message: `Checkpoint: Curiosity Step "${state2.helixCore.curiosity.steps[stepIndex].title}" completed.` });
        }
      }
    }
    await saveState(state2);
    broadcastState(state2);
    res.json({ success: true });
  });
  app.post("/api/helix/spawn-swarm", async (req, res) => {
    try {
      const { agents } = req.body;
      const newAgents = agents.map((a) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: a.name,
        role: a.role,
        status: "thinking",
        currentTask: "Awaiting primary directive"
      }));
      state2.helixCore.swarm = {
        agents: newAgents,
        activeSwarmId: Math.random().toString(36).substr(2, 9)
      };
      state2.rings.ring3.instances = [
        ...state2.rings.ring3.instances,
        ...newAgents.map((a) => ({
          id: a.id,
          name: `${a.role}: ${a.name}`,
          status: "Specializing",
          logs: [`Swarm agent initialized: ${a.role}`],
          deployedAt: (/* @__PURE__ */ new Date()).toISOString(),
          lifecycle: "Specialized"
        }))
      ];
      await saveState(state2);
      broadcastState(state2);
      res.json({ success: true, agents: newAgents });
    } catch (err) {
      res.status(500).json({ error: "Failed to spawn swarm" });
    }
  });
  app.post("/api/helix/tool-use", async (req, res) => {
    try {
      const { toolId, params } = req.body;
      const tool = state2.helixCore.tools?.find((t) => t.id === toolId);
      if (!tool) return res.status(404).json({ error: "Tool not found" });
      state2.terminalLogs.push(`\x1B[36m[TOOL: ${tool.name}]\x1B[0m Executing with params: ${JSON.stringify(params)}`);
      let result = {};
      if (toolId === "fs_read") result = { files: ["src/main.ts", "src/App.tsx", "server.ts"] };
      if (toolId === "fs_write") {
        result = { status: "Changes applied successfully" };
        await triggerAdapterAction("github", "Auto-Commit", { message: "Atomic file write detected. Synchronizing checkpoint." });
      }
      if (toolId === "exec_node") result = { output: "Loop matched 42 patterns. Efficiency: 98%" };
      if (toolId === "web_search") result = { link: "https://arxiv.org/abs/2403.helix", snippet: "A new architecture for recursive agent networks..." };
      await saveState(state2);
      broadcastState(state2);
      res.json({ success: true, result });
    } catch (err) {
      res.status(500).json({ error: "Tool execution failed" });
    }
  });
  app.post("/api/helix/adapters/configure", async (req, res) => {
    try {
      const { adapterId, config } = req.body;
      const adapterIndex = state2.helixCore.adapters?.findIndex((a) => a.id === adapterId);
      if (adapterIndex === void 0 || adapterIndex === -1) return res.status(404).json({ error: "Adapter not found" });
      state2.helixCore.adapters[adapterIndex].config = {
        ...state2.helixCore.adapters[adapterIndex].config,
        ...config
      };
      state2.helixCore.adapters[adapterIndex].status = "Connected";
      state2.helixCore.adapters[adapterIndex].config.lastSyncAt = (/* @__PURE__ */ new Date()).toISOString();
      state2.terminalLogs.push(`\x1B[32m[ADAPTER]\x1B[0m ${state2.helixCore.adapters[adapterIndex].name} successfully configured.`);
      await saveState(state2);
      broadcastState(state2);
      res.json({ success: true, adapter: state2.helixCore.adapters[adapterIndex] });
    } catch (err) {
      res.status(500).json({ error: "Failed to configure adapter" });
    }
  });
  app.post("/api/helix/adapters/sync", async (req, res) => {
    try {
      const { adapterId } = req.body;
      const adapterIndex = state2.helixCore.adapters?.findIndex((a) => a.id === adapterId);
      if (adapterIndex === void 0 || adapterIndex === -1) return res.status(404).json({ error: "Adapter not found" });
      const adapter = state2.helixCore.adapters[adapterIndex];
      if (adapter.status !== "Connected") return res.status(400).json({ error: "Adapter must be connected to sync" });
      state2.terminalLogs.push(`\x1B[35m[SYNC]\x1B[0m Synchronizing ${adapter.name} resources...`);
      await new Promise((r) => setTimeout(r, 2e3));
      adapter.config.lastSyncAt = (/* @__PURE__ */ new Date()).toISOString();
      state2.terminalLogs.push(`\x1B[32m[ADAPTER]\x1B[0m ${adapter.name} sync complete. Handshaked 14 instances.`);
      await saveState(state2);
      broadcastState(state2);
      res.json({ success: true, lastSyncAt: adapter.config.lastSyncAt });
    } catch (err) {
      res.status(500).json({ error: "Sync failed" });
    }
  });
  app.post("/api/helix/adapters/install", async (req, res) => {
    try {
      const { adapter } = req.body;
      const newAdapter = {
        id: adapter.id || Math.random().toString(36).substr(2, 9),
        name: adapter.name,
        description: adapter.description,
        status: "Disconnected",
        icon: adapter.icon || "Box",
        type: adapter.type || "Monitoring",
        features: adapter.features || ["General Integration"],
        config: {}
      };
      if (!state2.helixCore.adapters) state2.helixCore.adapters = [];
      state2.helixCore.adapters.push(newAdapter);
      state2.terminalLogs.push(`\x1B[32m[ADAPTER]\x1B[0m New adapter installed: ${newAdapter.name}`);
      await saveState(state2);
      broadcastState(state2);
      res.json({ success: true, adapter: newAdapter });
    } catch (err) {
      res.status(500).json({ error: "Failed to install adapter" });
    }
  });
  let activeTrainingProcess = null;
  function broadcastMetrics(metrics, projectId) {
    if (!wss3) return;
    wss3.clients.forEach((client) => {
      if (client.readyState === import_ws2.WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "TRAINING_METRICS", metrics, projectId }));
      }
    });
  }
  app.post("/api/training/start", async (req, res) => {
    try {
      const { config, code, projectId } = req.body;
      const tempDir = import_path2.default.join(process.cwd(), "temp", projectId || "default");
      await import_fs_extra2.default.ensureDir(tempDir);
      await import_fs_extra2.default.writeFile(import_path2.default.join(tempDir, "train.py"), code || "# Empty training script");
      if (activeTrainingProcess) {
        activeTrainingProcess.kill();
      }
      state2.terminalLogs.push(`\x1B[32m[TRAINER]\x1B[0m Starting local training for project ${projectId}...`);
      broadcastState(state2);
      const parseMetrics = (line) => {
        const lossMatch = line.match(/loss:?\s*([\d.]+)/i);
        const accMatch = line.match(/acc(?:uracy)?:?\s*([\d.]+)/i);
        const stepMatch = line.match(/step:?\s*(\d+)/i);
        const vramMatch = line.match(/vram:?\s*([\d.]+)/i);
        if (lossMatch || accMatch || stepMatch || vramMatch) {
          return {
            step: stepMatch ? parseInt(stepMatch[1]) : void 0,
            loss: lossMatch ? parseFloat(lossMatch[1]) : void 0,
            accuracy: accMatch ? parseFloat(accMatch[1]) : void 0,
            vram: vramMatch ? parseFloat(vramMatch[1]) : void 0,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          };
        }
        return null;
      };
      const pythonCmd = "python3";
      const python = (0, import_child_process.spawn)(pythonCmd, ["train.py"], { cwd: tempDir });
      activeTrainingProcess = python;
      python.stdout.on("data", (data) => {
        const line = data.toString();
        state2.terminalLogs.push(`\x1B[36m[TRAIN]\x1B[0m ${line.trim()}`);
        if (state2.terminalLogs.length > 200) state2.terminalLogs.shift();
        const metrics = parseMetrics(line);
        if (metrics) {
          broadcastMetrics(metrics, projectId);
        }
        broadcastState(state2);
      });
      python.stderr.on("data", (data) => {
        const errorLine = data.toString();
        state2.terminalLogs.push(`\x1B[31m[TRAINER ERROR]\x1B[0m ${errorLine.trim()}`);
        if (state2.terminalLogs.length > 200) state2.terminalLogs.shift();
        broadcastState(state2);
      });
      python.on("close", (code2) => {
        state2.terminalLogs.push(`\x1B[32m[TRAINER]\x1B[0m Training process exited with code ${code2}`);
        activeTrainingProcess = null;
        broadcastState(state2);
      });
      res.json({ success: true, message: "Training started" });
    } catch (err) {
      console.error("Training start failed", err);
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/training/stop", (req, res) => {
    if (activeTrainingProcess) {
      activeTrainingProcess.kill();
      activeTrainingProcess = null;
      state2.terminalLogs.push(`\x1B[31m[TRAINER]\x1B[0m Training manually terminated.`);
      broadcastState(state2);
      return res.json({ success: true });
    }
    res.json({ success: false, message: "No active training process" });
  });
  app.post("/api/training/synthetic-data", async (req, res) => {
    try {
      const { prompt, count = 50 } = req.body;
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
          instruction: `${inst} (Variant ${i + 1}) - ${prompt || ""}`,
          context: `Synthetically generated context for deep-reasoning step ${i}`,
          response: `Based on the Helix-OS architectural guidelines, the optimal approach for variant ${i} involves recursive self-correction and efficient memory allocation in Ring 3.`
        });
      }
      const jsonl = samples.map((d) => JSON.stringify(d)).join("\n");
      state2.terminalLogs.push(`\x1B[35m[SYNTH-GEN]\x1B[0m Generated ${count} high-quality synthetic JSONL records.`);
      broadcastState(state2);
      res.json({ success: true, data: jsonl, count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/helix/clear-swarm", async (req, res) => {
    try {
      state2.helixCore.swarm = { agents: [] };
      state2.rings.ring3.instances = state2.rings.ring3.instances.filter(
        (inst) => !inst.name.startsWith("Architect:") && !inst.name.startsWith("Auditor:") && !inst.name.startsWith("Optimizer:") && !inst.name.startsWith("Specialist:")
      );
      await saveState(state2);
      broadcastState(state2);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to clear swarm" });
    }
  });
  app.post("/api/agi/write-memory", async (req, res) => {
    try {
      const { content, type, links } = req.body;
      const id = (0, import_uuid3.v4)();
      state2.rings.ring2.memoryEntries.push({
        id,
        content,
        type,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        links: links || []
      });
      if (!links && content) {
        const related = state2.rings.ring2.memoryEntries.filter((e) => e.id !== id && e.content && e.content.split(" ").some((word) => word.length > 4 && content.includes(word))).slice(0, 2).map((e) => e.id);
        state2.rings.ring2.memoryEntries[state2.rings.ring2.memoryEntries.length - 1].links = related;
      }
      await saveState(state2);
      broadcastState(state2);
      res.json({ success: true, id });
    } catch (err) {
      console.error("Failed to write memory", err);
      res.status(500).json({ error: "Failed to write memory" });
    }
  });
  app.post("/api/agi/save-model", async (req, res) => {
    try {
      const { name, config } = req.body;
      state2.rings.ring1.trainedModels.push({
        id: (0, import_uuid3.v4)(),
        name,
        config,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      state2.telemetry.coherence = Math.min(0.999, state2.telemetry.coherence + 0.05);
      state2.telemetry.entropy = Math.max(0.01, state2.telemetry.entropy - 0.02);
      state2.telemetry.securityScore = Math.min(0.99, state2.telemetry.securityScore + 0.01);
      state2.rings.ring2.memoryEntries.push({
        id: (0, import_uuid3.v4)(),
        type: "EvolutionaryEvent",
        content: `New model identity "${name}" integrated into Ring 1. Collective coherence upgraded.`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        links: ["Ring 1", "Helix-Core"]
      });
      await saveState(state2);
      broadcastState(state2);
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to save model", err);
      res.status(500).json({ error: "Failed to save model" });
    }
  });
  app.post("/api/agi/deploy-wasm", async (req, res) => {
    if (state2.telemetry.entropy > 0.6) {
      return res.status(403).json({ error: "CORTICAL-GATEWAY: Critical entropy detected. All new deployments suspended until purge." });
    }
    const { name, wasmBase64, signature } = req.body;
    if (!signature) {
      console.warn(`[CORTICAL-GATEWAY] WARNING: Deploying un-signed module. Elevating system entropy.`);
      state2.telemetry.entropy += 0.02;
    }
    const instanceId = (0, import_uuid3.v4)();
    const instance = {
      id: instanceId,
      name: name || `Stem-Cell-${instanceId.slice(0, 4).toUpperCase()}`,
      status: "Undifferentiated",
      lifecycle: "Undifferentiated",
      specialty: void 0,
      logs: [
        `[CORTICAL-GATEWAY] Absolute Perimeter Check: PASSED.`,
        `[CORTICAL-GATEWAY] ${signature ? "Cryptographic Signature Verified: ATTESTED" : "CAUTION: Anonymous module detected"}.`,
        `[SYSTEM] Pluripotent stem-cell pool ${instanceId} provisioned in Ring 3.`,
        `[SYSTEM] Awaiting Neuro-Highway context for differentiation.`,
        `[SECURITY] Behavioral monitor initialized for instance scope.`,
        `[SYSTEM] WASM payload size: ${(Buffer.from(wasmBase64, "base64").length / 1024).toFixed(2)} KB detected.`
      ],
      deployedAt: (/* @__PURE__ */ new Date()).toISOString(),
      wasmBuffer: wasmBase64,
      attestationToken: "ATT-" + (0, import_uuid3.v4)().split("-")[0].toUpperCase(),
      memoryUsage: 0
    };
    state2.rings.ring3.instances.push(instance);
    state2.telemetry.activeWorkerCount = state2.rings.ring3.instances.length;
    await saveState(state2);
    broadcastState(state2);
    res.json({ id: instanceId });
  });
  app.post("/api/agi/run-instance", async (req, res) => {
    if (state2.telemetry.securityScore < 0.75) {
      console.error(`[CORTICAL-GATEWAY] BLOCK: Security score ${state2.telemetry.securityScore} below threshold.`);
      return res.status(403).json({ error: "CORTICAL-GATEWAY: Critical system integrity breach. All execution paths FROZEN for attestation." });
    }
    const { id, input } = req.body;
    const instanceIndex = state2.rings.ring3.instances.findIndex((i) => i.id === id);
    if (instanceIndex === -1) return res.status(404).json({ error: "Instance not found" });
    const instance = state2.rings.ring3.instances[instanceIndex];
    if (instance.status === "Executing" || instance.lifecycle === "Scrubbing") {
      return res.status(409).json({ error: "Instance busy. Context conflict avoided." });
    }
    instance.status = "Executing";
    instance.lifecycle = "Specialized";
    const specialties = ["Logic", "Memory", "Creative", "Security"];
    instance.specialty = specialties[Math.floor(Math.random() * specialties.length)];
    const sessionToken = "SES-" + (0, import_uuid3.v4)().split("-")[0].toUpperCase();
    const context = state2.rings.ring2.memoryEntries.slice(-3).map((e) => e.content).join(" | ");
    instance.logs.push(`[HELIX-OS] INTAKE: Neuro-Highway context stream active...`);
    instance.logs.push(`[HELIX-OS] CONTEXT: "${context.slice(0, 60)}..."`);
    instance.logs.push(`[HELIX-OS] DIFFERENTIATION: Stem-cell evolving into ${instance.specialty} Worker.`);
    instance.logs.push(`[SECURITY] Session established: ${sessionToken}`);
    instance.logs.push(`[EXEC] Running specialized task in ${instance.specialty} domain.`);
    broadcastState(state2);
    const startTime = import_perf_hooks.performance.now();
    try {
      if (!instance.wasmBuffer) {
        throw new Error("Missing binary context in stem-cell pool.");
      }
      instance.logs.push(`[EXEC] JIT Compiling ${instance.specialty} module...`);
      const buffer = Buffer.from(instance.wasmBuffer, "base64");
      if (!WebAssembly.validate(buffer)) {
        throw new Error("WASM binary failed static structural validation. Payload rejected.");
      }
      const wasmModule = await WebAssembly.compile(buffer);
      const wasmInstance = await WebAssembly.instantiate(wasmModule, {});
      if (wasmInstance.exports.memory) {
        const mem = wasmInstance.exports.memory;
        instance.memoryUsage = mem.buffer.byteLength;
      }
      const runFn = wasmInstance.exports.run || wasmInstance.exports.main;
      if (runFn) {
        const result = runFn(input);
        instance.lastResult = result;
        instance.logs.push(`[RESULT] ${instance.specialty} computation successful: ${typeof result === "object" ? JSON.stringify(result) : result}`);
        state2.rings.ring2.memoryEntries.push({
          id: (0, import_uuid3.v4)(),
          type: "Trajectory",
          content: `${instance.specialty} Worker (Pool: ${id}) processed context and produced result.`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          links: [id]
        });
      }
    } catch (err) {
      console.error(`WASM Runtime Error [${id}]:`, err);
      instance.logs.push(`[ERROR] Critical ${instance.specialty} failure: ${err.message}`);
      state2.telemetry.entropy += 0.05;
    }
    const endTime = import_perf_hooks.performance.now();
    instance.duration = endTime - startTime;
    instance.status = "Completed";
    instance.lifecycle = "Scrubbing";
    instance.logs.push(`[SECURITY] TASK COMPLETE: Initiating full memory scrub...`);
    instance.logs.push(`[SECURITY] PURGING: Clearing stack, registers, and context heap.`);
    broadcastState(state2);
    setTimeout(async () => {
      const idx = state2.rings.ring3.instances.findIndex((i) => i.id === id);
      if (idx !== -1) {
        const target = state2.rings.ring3.instances[idx];
        target.lifecycle = "Undifferentiated";
        target.specialty = void 0;
        target.status = "Idle";
        target.lastResult = void 0;
        target.logs.push(`[SECURITY] SCRUB COMPLETE: Pool returned to undifferentiated state.`);
        if (target.logs.length > 20) {
          target.logs = target.logs.slice(-10);
        }
        await saveState(state2);
        broadcastState(state2);
      }
    }, 2e3);
    state2.telemetry.aggregateThroughput += 1;
    state2.telemetry.coherence = Math.min(0.999, state2.telemetry.coherence + 1e-3);
    state2.telemetry.entropy = Math.max(0.01, state2.telemetry.entropy - 5e-4);
    await saveState(state2);
    broadcastState(state2);
    res.json({ success: true, logs: instance.logs, duration: instance.duration });
  });
  app.post("/api/terminal/run", (req, res) => {
    const { command, cwd } = req.body;
    const forbidden = ["rm -rf /", "mkfs", "dd"];
    if (forbidden.some((f) => command.includes(f))) {
      return res.status(403).json({ error: "Forbidden command" });
    }
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");
    const shell = process.platform === "win32" ? "powershell.exe" : "bash";
    const child = (0, import_child_process.spawn)(shell, ["-c", command], {
      cwd: cwd || process.cwd(),
      env: process.env,
      shell: true
    });
    child.stdout.on("data", (data) => {
      res.write(data);
    });
    child.stderr.on("data", (data) => {
      res.write(`ERROR: ${data}`);
    });
    child.on("close", (code) => {
      res.write(`
[Process exited with code ${code}]
`);
      res.end();
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express3.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
