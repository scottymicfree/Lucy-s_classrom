import { ThreadLifecycle } from "./ThreadLifecycle";

export class ExecutionWatchdog {
  static MAX_RUNTIME = 10000;
  static executions = new Map<string, number>();
  static listeners: Array<(event: any) => void> = [];

  static onEvent(callback: (event: any) => void) {
    this.listeners.push(callback);
  }

  static startWatch(workerId: string) {
    this.executions.set(workerId, Date.now());
  }

  static stopWatch(workerId: string) {
    this.executions.delete(workerId);
  }

  static check() {
    const now = Date.now();
    for (const [workerId, startTime] of this.executions.entries()) {
      if (now - startTime > this.MAX_RUNTIME) {
        this.listeners.forEach(cb => cb({ type: "watchdog_intervention", workerId, reason: "timeout" }));
        ThreadLifecycle.transition(workerId, "TERMINATED");
        this.executions.delete(workerId);
      }
    }
  }
}

setInterval(() => ExecutionWatchdog.check(), 1000);
