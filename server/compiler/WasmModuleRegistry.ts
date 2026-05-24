import { v4 as uuidv4 } from "uuid";

export const registry = new Map<string, any>();

export function registerModule(specialization: string, wasmBuffer: Buffer, watSource: string) {
  const moduleId = "WASM-" + uuidv4().substring(0, 4).toUpperCase();
  const modInfo = {
    moduleId,
    specialization,
    createdAt: Date.now(),
    executionCount: 0,
    successRate: 1.0,
    buffer: wasmBuffer,
    source: watSource
  };
  registry.set(moduleId, modInfo);
  return modInfo;
}

export function getModule(moduleId: string) { return registry.get(moduleId); }
export function updateModuleStats(moduleId: string, success: boolean) {
  const mod = registry.get(moduleId);
  if (mod) {
    mod.executionCount++;
    // simple moving average for success rate
    mod.successRate = (mod.successRate * (mod.executionCount - 1) + (success ? 1 : 0)) / mod.executionCount;
  }
}
