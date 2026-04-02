// ─── Users ────────────────────────────────────────────────────────────────────

export type UserRole = 'physio' | 'patient'

export interface User {
  id: string
  role: UserRole
  full_name: string
  email: string
  physio_id: string | null  // set on patient records; links to their physio
  created_at: string
}

// ─── Exercises ────────────────────────────────────────────────────────────────

export interface Exercise {
  id: string
  created_by: string | null  // null = pre-built library exercise
  name: string
  description: string
  instructions: string[]    // ordered steps shown one at a time
  image_url: string | null
  video_url: string | null
  created_at: string
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export interface Plan {
  id: string
  physio_id: string
  patient_id: string
  title: string
  notes: string | null
  is_active: boolean
  start_date: string        // ISO date string
  end_date: string | null
  created_at: string
}

// ─── Plan Exercises ───────────────────────────────────────────────────────────

export interface PlanExercise {
  id: string
  plan_id: string
  exercise_id: string
  sets: number
  reps: number
  hold_seconds: number | null   // for isometric holds
  rest_seconds: number | null
  order_index: number           // controls display order in session
  notes: string | null          // physio's per-exercise note for this patient
}

// Joined type used when displaying a plan to the patient
export interface PlanExerciseWithDetails extends PlanExercise {
  exercise: Exercise
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export interface Session {
  id: string
  plan_id: string
  patient_id: string
  started_at: string
  completed_at: string | null   // null if session was abandoned
}

// ─── Session Exercise Logs ────────────────────────────────────────────────────

export interface SessionExerciseLog {
  id: string
  session_id: string
  plan_exercise_id: string
  sets_completed: number
  difficulty_rating: number | null  // 1–5, optional patient feedback
  notes: string | null
}

// ─── Composite types ──────────────────────────────────────────────────────────

// Full session with all exercise logs joined
export interface SessionWithLogs extends Session {
  logs: SessionExerciseLog[]
}

// Patient as seen by their physio
export interface PatientSummary extends User {
  active_plan: Plan | null
  last_session_at: string | null
  sessions_this_week: number
}
