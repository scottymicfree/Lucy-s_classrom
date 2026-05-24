import { ThreadLifecycle } from "./ThreadLifecycle";
import { SharedMemoryBus } from "./SharedMemoryBus";

export class WorkerThreadBridge {
  static dispatch(threadId: string, payload: any) {
    ThreadLifecycle.transition(threadId, "ACTIVE");
    return new Promise((resolve) => {
      setTimeout(() => {
        ThreadLifecycle.transition(threadId, "IDLE");
        resolve({ success: true, result: 42, threadId });
      }, 500);
    });
  }
}
