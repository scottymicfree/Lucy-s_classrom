import { WebSocketServer, WebSocket } from "ws";
import { RuntimeBus } from "./RuntimeBus.ts";
import { eventPayloadSchema } from "./RuntimeEvents.ts";
import { z } from "zod";

let wss: WebSocketServer | null = null;
const connectedClients = new Set<WebSocket>();

export function initWebSocketGateway(server: WebSocketServer) {
  wss = server;
  
  RuntimeBus.on('*', (eventName: string, payload: any) => {
    // Only broadcast objects. Combine eventName into the payload if it's an object
    if (typeof payload === "object" && payload !== null) {
      const message = { type: eventName, ...payload };
      
      // Basic z validation on outgress to ensure we aren't sending garbage
      try {
        eventPayloadSchema.parse(message);
        broadcast(message);
      } catch (err) {
        console.error("Zod validation failed for outgoing WS payload:", err);
      }
    }
  });

  // Handle incoming connections if needed
  wss.on('connection', (socket: WebSocket) => {
    connectedClients.add(socket);
    console.log("[HELIX] Client connected to live runtime stream");

    // Optional incoming message validation
    socket.on('message', (data: string) => {
      // Not strictly required for Phase 3, but protects from malicious payload
      try {
        if (data.length > 500000) {
          socket.send(JSON.stringify({ type: "runtime_warning", message: "Payload size limit exceeded" }));
          return;
        }
        const json = JSON.parse(data);
        eventPayloadSchema.parse(json);
      } catch (err) {
         // Invalid payload
         socket.send(JSON.stringify({ type: "runtime_error", message: "Invalid payload structure" }));
      }
    });

    socket.on('close', () => {
      connectedClients.delete(socket);
      console.log("[HELIX] Client disconnected");
    });
    
    socket.on('error', (err) => {
      console.error("[HELIX] WebSocket error", err);
    });
  });
}

export function getConnectedClientCount() {
  return connectedClients.size;
}

function broadcast(payload: any) {
  if (!wss) return;
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
