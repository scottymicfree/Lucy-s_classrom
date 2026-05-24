import { z } from "zod";

export type RuntimeEvent =
  | "coherence_update"
  | "entropy_update"
  | "worker_spawned"
  | "worker_terminated"
  | "trajectory_stored"
  | "trajectory_retrieved"
  | "execution_started"
  | "execution_complete"
  | "execution_failed"
  | "security_scrub"
  | "ring_state_update"
  | "telemetry_update"
  | "runtime_warning"
  | "runtime_error"
  | "execution_log"
  | "runtime_status"
  | "worker_update"
  | "runtime_health";

export const eventPayloadSchema = z.object({
  type: z.string(),
}).passthrough();
