import { registry } from "./WorkerRegistry.ts";
import { ExecutionLifecycle } from "./ExecutionLifecycle.ts";
import { MemoryScrubber } from "./MemoryScrubber.ts";
import { RuntimeBus } from "../runtime/RuntimeBus.ts";

export class WasmRuntime {
  static async execute(workerId: string, wasmBase64: string, inputParams: any[] = []) {
    const worker = registry.get(workerId);
    if (!worker) throw new Error("Worker not found");

    try {
      ExecutionLifecycle.transition(workerId, "INITIALIZED");
      
      const buffer = Buffer.from(wasmBase64, 'base64');
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
        worker.memory = instance.exports.memory as WebAssembly.Memory;
      }

      ExecutionLifecycle.transition(workerId, "CONTEXT_INJECTED");
      ExecutionLifecycle.transition(workerId, "EXECUTING");

      // Attempt to find a run function
      let result = null;
      const runFn = (instance.exports.run as Function) || (instance.exports.main as Function) || (instance.exports.add as Function);
      
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
    } catch (err: any) {
      ExecutionLifecycle.transition(workerId, "FAILED");
      MemoryScrubber.emergencyScrub(workerId);
      throw err;
    }
  }
}
