import { ExecutionQueue } from "./ExecutionQueue";
import { RuntimePressureMonitor } from "./RuntimePressureMonitor";
import { RuntimeThreadPool } from "../runtime/RuntimeThreadPool";

export class DistributedScheduler {
  static async processQueue() {
    while (ExecutionQueue.getSize() > 0 && RuntimePressureMonitor.getPressure() < 0.8) {
      const task = ExecutionQueue.dequeue();
      const threadId = await RuntimeThreadPool.allocateThread();
      RuntimeThreadPool.execute(threadId, task);
    }
  }
}
