export class NodeActivationEngine {
  static activate(nodeId: string, payload: any) {
    return {
      type: "node_activation",
      nodeId,
      timestamp: Date.now(),
      payloadSize: JSON.stringify(payload).length
    };
  }
}
