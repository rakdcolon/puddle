export type Genre = 'logic' | 'quant' | 'pattern' | 'lateral' | 'wordplay' | 'deduction'
export type InputType = 'freetext' | 'numeric' | 'choice'
export type SolveStatus = 'solved' | 'revealed'
export type SubmissionStatus = 'pending' | 'accepted' | 'rejected'
export type HintPacing = 'instant' | '5s-pause'

export interface NumericConfig { min: number; max: number }
export interface ChoiceConfig { options: string[] }

export interface SolutionStep {
  body: string
}

export interface Puzzle {
  id: string
  issue_no: number
  vol: number
  date_active: string  // 'YYYY-MM-DD'
  title: string
  genre: Genre
  difficulty: number   // 1–5
  prompt: string[]
  answer: string       // lowercased
  answer_display: string
  hints: string[]
  solution_lede: string
  solution_steps: SolutionStep[]
  input_type: InputType
  input_config: NumericConfig | ChoiceConfig | null
}

// Client-safe puzzle (answer stripped)
export type PublicPuzzle = Omit<Puzzle, 'answer' | 'solution_lede' | 'solution_steps'>

export interface Solve {
  user_id: string
  puzzle_id: string
  status: SolveStatus
  elapsed_seconds: number | null
  hints_used: number
  attempts: number
  solved_at: string
}

export interface User {
  id: string
  google_sub: string | null
  discord_sub: string | null
  display_name: string
  email: string
  created_at: string
}

export type AuthProvider = 'google' | 'discord'

// A normalized identity from any OAuth provider, used to find-or-create and
// merge the canonical `users` row.
export interface AuthIdentity {
  provider: AuthProvider
  sub: string
  email: string
  emailVerified: boolean
  displayName: string
}

export interface UserSettings {
  user_id: string
  sound: boolean
  show_streak: boolean
  hint_pacing: HintPacing
  display_name: string | null
}

export interface PuzzleStats {
  total_solved: number
  best_time_seconds: number | null
  avg_time_seconds: number | null
}

export interface CalendarEntry {
  date: string  // 'YYYY-MM-DD'
  state: 'solved' | 'solved-with-hint' | 'gave-up' | null
}

export interface RecentSolve {
  date: string
  title: string
  issue_no: number
  elapsed_seconds: number | null
  hints_used: number
  status: SolveStatus
}

export interface GenreBreakdown {
  genre: Genre
  solved: number
}

export interface UserProfile {
  user: User
  settings: UserSettings
  stats: {
    total_solved: number
    total_attempted: number
    win_pct: number
    avg_time_seconds: number | null
    current_streak: number
    xp: number
    level: number
    xp_in_level: number
    xp_for_level: number
  }
  calendar: CalendarEntry[]
  recent: RecentSolve[]
  by_genre: GenreBreakdown[]
}
