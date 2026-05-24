export class GraphMemory {
  static nodeStates = new Map<string, any>();

  static saveNodeState(nodeId: string, state: any) {
    this.nodeStates.set(nodeId, state);
  }

  static getNodeState(nodeId: string) {
    return this.nodeStates.get(nodeId);
  }
}
