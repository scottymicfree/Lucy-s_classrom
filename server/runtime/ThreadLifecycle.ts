import { v4 as uuidv4 } from "uuid";

export type ThreadState = "CREATED" | "INITIALIZED" | "ACTIVE" | "IDLE" | "RECYCLED" | "TERMINATED";

export class ThreadLifecycle {
  static states = new Map<string, ThreadState>();
  static listeners: Array<(event: any) => void> = [];

  static onEvent(callback: (event: any) => void) {
    this.listeners.push(callback);
  }

  static transition(threadId: string, state: ThreadState) {
    this.states.set(threadId, state);
    this.listeners.forEach(cb => cb({ type: "thread_lifecycle", threadId, state }));
  }

  static getState(threadId: string) {
    return this.states.get(threadId);
  }
}
