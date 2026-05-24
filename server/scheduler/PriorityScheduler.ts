import { ExecutionQueue } from "./ExecutionQueue";
import { ResourceAllocator } from "./ResourceAllocator";

export class PriorityScheduler {
  static listeners: Array<(event: any) => void> = [];

  static onEvent(callback: (event: any) => void) {
    this.listeners.push(callback);
  }

  static broadcast() {
    this.listeners.forEach(cb => cb({
      type: "scheduler_update",
      activeWorkers: ResourceAllocator.activeWorkersCount,
      queuedObjectives: ExecutionQueue.getSize()
    }));
  }

  static schedule(objectiveType: string, payload: any, priority: string = "normal") {
    ExecutionQueue.enqueue({ objectiveType, payload, priority });
    this.broadcast();
    this.processQueue();
  }

  static processQueue() {
    // If we have resources, pop and process (in a real system, this triggers execution hooks)
    while (ExecutionQueue.getSize() > 0 && ResourceAllocator.allocate(1)) {
      const task = ExecutionQueue.dequeue();
      // Handle task...
    }
    this.broadcast();
  }
}
