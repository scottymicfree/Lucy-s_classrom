export class HistoricalTrajectories {
  static history: any[] = [];

  static append(record: any) {
    this.history.push(record);
  }

  static findRelated(objective: string) {
    return this.history.filter(h => h.objective && h.objective.includes(objective));
  }
}
