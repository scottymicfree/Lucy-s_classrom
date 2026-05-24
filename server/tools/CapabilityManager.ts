export class CapabilityManager {
  static capabilities = new Map<string, string[]>();

  static assign(workerId: string, permissions: string[]) {
    this.capabilities.set(workerId, permissions);
  }

  static can(workerId: string, cap: string) {
    return (this.capabilities.get(workerId) || []).includes(cap);
  }
}
