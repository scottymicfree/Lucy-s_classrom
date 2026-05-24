import { CognitionGraph } from "./CognitionGraph";
import { NodeActivationEngine } from "./NodeActivationEngine";

export class EventRouter {
  static graph = new CognitionGraph();
  static listeners: Array<(event: any) => void> = [];

  static onEvent(callback: (event: any) => void) {
    this.listeners.push(callback);
  }

  static dispatch(eventType: string, data: any) {
    // Basic event bridging into the graph runtime
    if (eventType === "objective_started") {
      this.graph.addObjective(data.id, data.objective);
    } else if (eventType === "worker_spawned") {
      this.graph.addWorker(data.workerId, data.specialization);
      if (data.objectiveId) {
         this.graph.connect(data.objectiveId, data.workerId, "assigns");
      }
    }
    
    // Fire node activation
    if (data.id || data.workerId) {
      const act = NodeActivationEngine.activate(data.id || data.workerId, data);
      this.listeners.forEach(cb => cb(act));
    }

    this.listeners.forEach(cb => cb({ type: "graph_updated", graph: this.graph.serialize() }));
  }
}
