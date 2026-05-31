const XP_BASE = 100
const LEVEL_SCALE = 500  // XP per level (simple linear for now)

// XP is independent of solve time by design — Puddle doesn't reward speed.
// Flat base, reduced by hints used and wrong attempts.
export function calcXP(hintsUsed: number, attempts: number): number {
  let xp = XP_BASE
  // Hint penalty
  xp -= hintsUsed * 15
  // Wrong attempt penalty
  xp -= Math.max(0, attempts - 1) * 10
  return Math.max(10, xp)
}

export function totalXpToLevel(totalXp: number): { level: number; xpInLevel: number; xpForLevel: number } {
  const level = Math.floor(totalXp / LEVEL_SCALE) + 1
  const xpInLevel = totalXp % LEVEL_SCALE
  return { level, xpInLevel, xpForLevel: LEVEL_SCALE }
}
