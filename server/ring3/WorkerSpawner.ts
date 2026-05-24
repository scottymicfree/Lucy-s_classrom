import { v4 as uuidv4 } from "uuid";
import { Ring3Worker, registry } from "./WorkerRegistry.ts";
import { ExecutionLifecycle } from "./ExecutionLifecycle.ts";

export class WorkerSpawner {
  static spawn(specialization: Ring3Worker["specialization"] = "logic"): string {
    const workerId = uuidv4();
    
    const worker: Ring3Worker = {
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
}
