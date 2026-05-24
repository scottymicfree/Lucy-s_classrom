export const SandboxProfiles = {
  MEMORY_WORKER: ["fs.read", "ring2.access"],
  LOGIC_WORKER: ["compute", "memory.share"],
  SECURITY_WORKER: ["audit", "fs.read", "fs.write_temp"]
};
