import { v4 as uuidv4 } from "uuid";

export interface Ring3Worker {
  id: string;
  specialization: "logic" | "memory" | "creative" | "security";
  state: "SPAWNED" | "INITIALIZED" | "CONTEXT_INJECTED" | "EXECUTING" | "RETURNING_RESULTS" | "SCRUBBING" | "TERMINATED" | "FAILED";
  executionCount: number;
  lastObjective: string | null;
  instance: WebAssembly.Instance | null;
  memory: WebAssembly.Memory | null;
}

class WorkerRegistry {
  private workers: Record<string, Ring3Worker> = {};

  register(worker: Ring3Worker) {
    this.workers[worker.id] = worker;
  }

  get(id: string): Ring3Worker | undefined {
    return this.workers[id];
  }

  getAll(): Ring3Worker[] {
    return Object.values(this.workers);
  }

  remove(id: string) {
    delete this.workers[id];
  }

  updateState(id: string, state: Ring3Worker["state"]) {
    if (this.workers[id]) {
      this.workers[id].state = state;
    }
  }

  count(): number {
    return Object.keys(this.workers).length;
  }
}

export const registry = new WorkerRegistry();
