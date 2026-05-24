export class ConsensusEngine {
  static resolve(outputs: any[]) {
    if (!outputs || outputs.length === 0) return null;
    
    // Sort by confidence or successScore, resolve conflicts
    const sorted = [...outputs].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    
    const primary = sorted[0];
    const coherenceScore = (primary.confidence || 0.5) * (sorted.length > 1 ? 1.1 : 1.0);

    return {
      workerId: primary.workerId,
      confidence: primary.confidence,
      coherenceScore: Math.min(coherenceScore, 1.0),
      result: primary.result
    };
  }
}
