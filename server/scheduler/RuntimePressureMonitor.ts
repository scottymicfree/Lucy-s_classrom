export class RuntimePressureMonitor {
  static listeners: Array<(event: any) => void> = [];

  static onEvent(callback: (event: any) => void) {
    this.listeners.push(callback);
  }

  static getPressure() {
    // Computed based on thread usage in a real system
    return 0.4;
  }

  static broadcast() {
    const pressure = this.getPressure();
    this.listeners.forEach(cb => cb({
      type: "runtime_pressure",
      threadLoad: pressure,
      queueLatency: Math.floor(Math.random() * 20) + 10
    }));
  }
  
  static start() {
    setInterval(() => this.broadcast(), 2000);
  }
}
