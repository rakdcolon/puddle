const XP_BASE = 100
const LEVEL_SCALE = 500  // XP per level (simple linear for now)

export function calcXP(elapsed: number, hintsUsed: number, attempts: number): number {
  let xp = XP_BASE
  // Speed bonus: under 2 min
  if (elapsed < 120) xp += 50
  else if (elapsed < 300) xp += 25
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
