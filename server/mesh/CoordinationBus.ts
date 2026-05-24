export class CoordinationBus {
  static listeners: Array<(event: any) => void> = [];

  static subscribe(callback: (event: any) => void) {
    this.listeners.push(callback);
  }

  static publish(event: any) {
    this.listeners.forEach(cb => cb(event));
  }
}
