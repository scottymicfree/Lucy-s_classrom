import { CoordinationBus } from "./CoordinationBus";
import { SemanticExchange } from "./SemanticExchange";
import { ConsensusEngine } from "./ConsensusEngine";

export class WorkerMesh {
  static activeLinks = new Map<string, string[]>();

  static linkWorkers(workerA: string, workerB: string) {
    const listA = this.activeLinks.get(workerA) || [];
    if (!listA.includes(workerB)) listA.push(workerB);
    this.activeLinks.set(workerA, listA);
    
    CoordinationBus.publish({ type: "mesh_link", source: workerA, target: workerB });
  }

  static exchangeContext(sourceId: string, targetId: string, payload: any) {
    const evt = SemanticExchange.routePayload(sourceId, targetId, payload);
    CoordinationBus.publish(evt);
    return evt;
  }

  static runConsensus(workerOutputs: any[]) {
    const result = ConsensusEngine.resolve(workerOutputs);
    if (result) {
       CoordinationBus.publish({ type: "consensus_reached", workerId: result.workerId, coherence: result.coherenceScore });
    }
    return result;
  }
}
