export function aggregateResult(workerId: string, result: any, durationMs: number) {
  // A real implementation would parse the complex WASM execution result
  const successScore = result !== null ? 0.92 : 0.15;
  const coherenceImpact = successScore * 0.25;

  return {
    workerId,
    result,
    executionTimeMs: durationMs,
    successScore,
    coherenceImpact
  };
}
