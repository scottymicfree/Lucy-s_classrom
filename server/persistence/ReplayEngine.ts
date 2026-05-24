import { HistoricalTrajectories } from "./HistoricalTrajectories";

export class ReplayEngine {
  static getReplayFrames(pipelineId: string) {
    // Basic conceptual fetch
    return HistoricalTrajectories.history.filter(r => r.pipelineId === pipelineId);
  }
}
