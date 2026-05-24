export class WorkerBalancer {
  static maxWorkers = 24;

  static canSpawn(currentActive: number, required: number = 1): boolean {
    return (currentActive + required) <= this.maxWorkers;
  }

  static getLoadPressure(currentActive: number): number {
    return currentActive / this.maxWorkers;
  }
}
