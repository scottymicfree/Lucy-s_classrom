export function routeObjective(objective: string): string {
  const objLower = objective.toLowerCase();
  if (objLower.includes("security") || objLower.includes("auth") || objLower.includes("scrub") || objLower.includes("protect")) return "Security";
  if (objLower.includes("memory") || objLower.includes("remember") || objLower.includes("recall") || objLower.includes("context")) return "Memory";
  if (objLower.includes("creative") || objLower.includes("draw") || objLower.includes("write") || objLower.includes("design")) return "Creative";
  return "Logic";
}
