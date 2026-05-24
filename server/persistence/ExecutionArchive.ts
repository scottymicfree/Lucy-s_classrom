import { HistoricalTrajectories } from "./HistoricalTrajectories";

export class ExecutionArchive {
  static persist(record: {
    objective: string,
    workers: string[],
    context: any,
    outputs: any,
    executionTime: number,
    coherence: number,
    timestamp: number
  }) {
    HistoricalTrajectories.append(record);
    return true;
  }

  static getArchive() {
    return HistoricalTrajectories.history;
  }
}
