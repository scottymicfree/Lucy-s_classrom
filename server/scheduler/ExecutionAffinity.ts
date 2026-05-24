export class ExecutionAffinity {
  static getAffinity(taskType: string) {
    return taskType === "memory" ? "high_cache_locality" : "standard";
  }
}
