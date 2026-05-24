import { RuntimeBus } from "../runtime/RuntimeBus.ts";
import { Ring3Worker, registry } from "./WorkerRegistry.ts";
import { setWorkerCount } from "../runtime/TelemetryEngine.ts";

export class ExecutionLifecycle {
  static transition(workerId: string, newState: Ring3Worker["state"]) {
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
      // Removed from registry after termination
    }
  }

  static updateWorkerCount() {
    setWorkerCount(registry.count());
  }
}
