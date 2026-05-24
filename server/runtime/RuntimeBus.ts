import { EventEmitter } from "events";
import { RuntimeEvent } from "./RuntimeEvents.ts";

class RuntimeBusEmitter extends EventEmitter {
  emit(eventName: string | symbol, ...args: any[]): boolean {
    const result = super.emit(eventName, ...args);
    // Emit a special catch-all event for WebSocket Gateway to broadcast
    if (eventName !== '*') {
      super.emit('*', eventName, ...args);
    }
    return result;
  }
}

export const RuntimeBus = new RuntimeBusEmitter();
