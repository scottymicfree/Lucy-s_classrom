import { SharedMemoryBus } from "../runtime/SharedMemoryBus";

export class SemanticPropagationEngine {
  static listeners: Array<(event: any) => void> = [];

  static onEvent(callback: (event: any) => void) {
    this.listeners.push(callback);
  }

  static propagate(signal: string) {
    SharedMemoryBus.set(0, 1);
    this.listeners.forEach(cb => cb({ type: "semantic_propagation", signal }));
  }
}
