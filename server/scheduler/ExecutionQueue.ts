export class ExecutionQueue {
  static queue: any[] = [];
  
  static enqueue(task: any) {
    this.queue.push(task);
    // Sort by priority -> critical first, high, medium, low
    const priorityMap: any = { critical: 4, high: 3, medium: 2, normal: 1, low: 0 };
    this.queue.sort((a, b) => (priorityMap[b.priority || 'normal'] || 0) - (priorityMap[a.priority || 'normal'] || 0));
  }

  static dequeue() {
    return this.queue.shift();
  }

  static getSize() {
    return this.queue.length;
  }
}
