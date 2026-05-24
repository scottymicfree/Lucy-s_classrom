import { v4 as uuidv4 } from "uuid";
import { routeObjective } from "./ObjectiveRouter";
import { aggregateResult } from "./ResultAggregator";
import { storeTrajectory } from "./TrajectoryReinforcement";
import { ExecutionPool } from "../ring3/ExecutionPool";

type PipelineStageEvent = {
  type: string;
  stage?: string;
  workerId?: string;
  specialization?: string;
  pipelineId?: string;
  result?: any;
  details?: any;
};

export class HelixPipeline {
  static listeners: Array<(event: PipelineStageEvent) => void> = [];

  static onEvent(callback: (event: PipelineStageEvent) => void) {
    this.listeners.push(callback);
  }

  private static broadcast(event: PipelineStageEvent) {
    this.listeners.forEach(cb => cb(event));
  }

  static async submitObjective(objective: string) {
    const pipelineId = "PID-" + uuidv4().substring(0, 6).toUpperCase();
    
    try {
      this.broadcast({ type: "pipeline_stage", stage: "OBJECTIVE_RECEIVED", pipelineId, details: { objective } });

      // 1. Plan
      this.broadcast({ type: "pipeline_stage", stage: "PLAN_GENERATED", pipelineId });
      const specialization = routeObjective(objective);

      // 2. Semantic Context
      this.broadcast({ type: "pipeline_stage", stage: "SEMANTIC_CONTEXT_RETRIEVED", pipelineId });
      let semanticContext = [];
      try {
        const ring2Res = await fetch("http://0.0.0.0:3000/api/ring2/retrieve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: objective, limit: 3 })
        });
        if (ring2Res.ok) {
           const data = await ring2Res.json();
           semanticContext = data.results || [];
        }
      } catch (err) {
         console.warn("[HELIX:R2] Could not retrieve semantic context during pipeline execution");
      }

      // 3. Allocate Worker
      this.broadcast({ type: "pipeline_stage", stage: "WORKERS_ALLOCATED", pipelineId, specialization });
      const worker = await ExecutionPool.spawn(specialization);
      this.broadcast({ type: "worker_specialized", workerId: worker.workerId, specialization });

      // 4. Execution
      this.broadcast({ type: "pipeline_stage", stage: "EXECUTION_STARTED", pipelineId, workerId: worker.workerId });
      const startTime = Date.now();
      const payload = { objective, semanticContext, specialization };
      
      const execResult = await ExecutionPool.execute(worker.workerId, payload);
      const executionTimeMs = Date.now() - startTime;

      // 5. Aggregate Results
      this.broadcast({ type: "pipeline_stage", stage: "RESULTS_AGGREGATED", pipelineId, workerId: worker.workerId });
      const aggregated = aggregateResult(worker.workerId, execResult.result, executionTimeMs);

      // 6. Reinforce Trajectory
      if (aggregated.successScore > 0.8) {
         this.broadcast({ type: "trajectory_reinforced", pipelineId, workerId: worker.workerId });
         await storeTrajectory({
            objective,
            result: aggregated.result,
            successScore: aggregated.successScore,
            executionTime: aggregated.executionTimeMs,
            specialization
         });
      }

      // 7. Scrub Memory
      this.broadcast({ type: "pipeline_stage", stage: "MEMORY_SCRUBBED", pipelineId, workerId: worker.workerId });
      ExecutionPool.scrub(worker.workerId, execResult.ref);

      this.broadcast({ type: "pipeline_stage", stage: "PIPELINE_COMPLETE", pipelineId, result: aggregated });
      return aggregated;
    } catch (err: any) {
      this.broadcast({ type: "pipeline_failure", stage: "PIPELINE_ERROR", pipelineId, details: err.message });
      throw err;
    }
  }
}
