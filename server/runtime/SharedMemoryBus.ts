export class SharedMemoryBus {
  static memory = new SharedArrayBuffer(1024 * 1024); // 1MB
  static view = new Uint32Array(this.memory);

  static set(index: number, value: number) {
    Atomics.store(this.view, index, value);
  }

  static get(index: number) {
    return Atomics.load(this.view, index);
  }
}
