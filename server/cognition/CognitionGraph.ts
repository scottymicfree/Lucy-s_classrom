import { Graph } from "graphlib";

export class CognitionGraph {
  public graph = new Graph();

  constructor() {
    this.graph.setGraph("cognition_mesh");
  }

  addObjective(id: string, objective: string) {
    this.graph.setNode(id, { type: "objective", data: objective });
  }

  addWorker(id: string, specialization: string) {
    this.graph.setNode(id, { type: "worker", specialization });
  }

  addMemory(id: string, context: string) {
    this.graph.setNode(id, { type: "memory", context });
  }

  connect(source: string, target: string, edgeType: string) {
    this.graph.setEdge(source, target, { type: edgeType });
  }

  serialize() {
    return {
      nodes: this.graph.nodes().map(v => ({ id: v, ...this.graph.node(v) })),
      edges: this.graph.edges().map(e => ({ source: e.v, target: e.w, ...this.graph.edge(e) }))
    };
  }
}
