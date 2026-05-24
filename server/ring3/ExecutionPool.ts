import express from "express";
import { WorkerSpawner } from "./WorkerSpawner.ts";
import { WasmRuntime } from "./WasmRuntime.ts";
import { MemoryScrubber } from "./MemoryScrubber.ts";
import { registry } from "./WorkerRegistry.ts";

export const ring3Router = express.Router();

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
  } catch (err: any) {
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
  const workers = registry.getAll().map(w => ({
    id: w.id,
    specialization: w.specialization,
    state: w.state,
    executionCount: w.executionCount,
    lastObjective: w.lastObjective,
  }));
  res.json({ success: true, workers, total: workers.length });
});
