import { ExecutionQueue } from "./ExecutionQueue";
import { WorkerBalancer } from "./WorkerBalancer";

export class ResourceAllocator {
  static activeWorkersCount = 0;

  static allocate(required: number = 1) {
    if (WorkerBalancer.canSpawn(this.activeWorkersCount, required)) {
      this.activeWorkersCount += required;
      return true;
    }
    return false;
  }

  static deallocate(released: number = 1) {
    this.activeWorkersCount = Math.max(0, this.activeWorkersCount - released);
  }
}
