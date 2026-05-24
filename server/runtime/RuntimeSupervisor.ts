import { ThreadLifecycle } from "./ThreadLifecycle";

export class RuntimeSupervisor {
  static activeWorkers = new Set<string>();

  static monitor(workerId: string) {
    this.activeWorkers.add(workerId);
  }

  static terminate(workerId: string) {
    this.activeWorkers.delete(workerId);
    ThreadLifecycle.transition(workerId, "TERMINATED");
  }

  static getSystemHealth() {
    return {
      activeThreads: this.activeWorkers.size,
      status: "Healthy"
    };
  }
}
