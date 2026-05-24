export async function storeTrajectory(trajectory: any) {
  try {
    const res = await fetch("http://0.0.0.0:3000/api/ring2/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `Reinforced Trajectory: Objective="${trajectory.objective}" | Result=${JSON.stringify(trajectory.result)} | SuccessScore=${trajectory.successScore}`,
        source: "trajectory_reinforcement"
      })
    });
    return res.ok;
  } catch (err) {
    console.warn("[HELIX:R2] Failed to reinforce trajectory:", err);
    return false;
  }
}
