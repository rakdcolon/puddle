import type { Puzzle } from '@/types'
export const puzzle: Puzzle = {
  id: '10000000-0000-4000-8000-000000000001', issue_no: 1, vol: 20,
  date_active: '2020-01-01', title: 'The Test Pond', genre: 'logic', difficulty: 1,
  prompt: ['Two frogs join three frogs. How many frogs are there?'],
  answer: '5', answer_display: '5 frogs', hints: ['Count the first pair.', 'Add three.', 'Two plus three.'],
  solution_lede: 'Combine the groups.', solution_steps: [{ body: '2 + 3 = 5.' }],
  input_type: 'freetext', input_config: null,
}
export const { answer: _answer, solution_lede: _lede, solution_steps: _steps, ...publicPuzzle } = puzzle
