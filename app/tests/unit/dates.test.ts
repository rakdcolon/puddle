import { expect, test, vi } from 'vitest'
import { getTodayNY, nyDateDaysAgo, streakLength, formatDate, formatElapsed, secondsUntilMidnightNY } from '@/lib/utils/dates'
test.each([
  ['2026-03-08T04:30:00Z','2026-03-07'], ['2026-03-08T07:30:00Z','2026-03-08'],
  ['2026-11-01T05:30:00Z','2026-11-01'], ['2026-11-01T06:30:00Z','2026-11-01'],
])('New York date at %s', (now,date) => { vi.useFakeTimers();vi.setSystemTime(new Date(now));expect(getTodayNY()).toBe(date) })
test('streak survives unsolved today and DST, but breaks on a missing day', () => {
  vi.useFakeTimers();vi.setSystemTime(new Date('2026-03-09T15:00:00Z'))
  expect(nyDateDaysAgo(1)).toBe('2026-03-08')
  const solved = new Set(['2026-03-08','2026-03-07','2026-03-05'])
  expect(streakLength(solved,true)).toBe(2)
  expect(streakLength(solved,false)).toBe(2)
  solved.add('2026-03-09');expect(streakLength(solved,true)).toBe(3)
})
test('display formatting handles null and sub-minute times', () => {
  expect(formatDate('2026-01-01')).toBe('January 1')
  expect(formatElapsed(null)).toBe('—');expect(formatElapsed(9)).toBe('0:09');expect(formatElapsed(125)).toBe('2:05')
})
test('countdown at 23:59:30 New York', () => {
  vi.useFakeTimers();vi.setSystemTime(new Date('2026-01-02T04:59:30Z'))
  expect(secondsUntilMidnightNY()).toBe(30)
})
