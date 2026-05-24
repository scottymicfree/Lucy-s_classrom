import { registry } from "./WorkerRegistry.ts";
import { ExecutionLifecycle } from "./ExecutionLifecycle.ts";
import { RuntimeBus } from "../runtime/RuntimeBus.ts";

export class MemoryScrubber {
  static scrub(workerId: string) {
    const worker = registry.get(workerId);
    if (!worker) return;

    ExecutionLifecycle.transition(workerId, "SCRUBBING");

    if (worker.memory) {
      // Zero out the WebAssembly memory buffer
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

  static emergencyScrub(workerId: string) {
    RuntimeBus.emit("execution_log", { message: `[SECURITY] emergency scrub triggered for ${workerId}` });
    this.scrub(workerId);
  }
}
