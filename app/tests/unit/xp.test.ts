import { expect, test } from 'vitest'
import { calcXP, totalXpToLevel } from '@/lib/utils/xp'
test.each([[0,1,100],[1,1,85],[2,3,50],[3,99,10],[0,0,100]])('XP for %i hints and %i attempts is %i', (h,a,xp) => expect(calcXP(h,a)).toBe(xp))
test.each([[0,1,0],[499,1,499],[500,2,0],[1250,3,250]])('level boundary at %i XP', (xp,level,progress) => {
  expect(totalXpToLevel(xp)).toEqual({level,xpInLevel:progress,xpForLevel:500})
})
