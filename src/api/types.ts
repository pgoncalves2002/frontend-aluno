/**
 * Tipos espelhando os DTOs do backend Django (accounts/serializers.py +
 * workouts/serializers.py + training_sessions/serializers.py). Versão
 * "aluno-only" — sem tipos exclusivos do trainer (Student CRUD, presets etc).
 *
 * Mantenha em sincronia com o backend.
 */

// ---------- Auth ----------
export type Role = "student" | "trainer" | "admin";

export interface User {
  id: number;
  username: string;
  email: string | null;
  /** Telefone usado pra wa.me. Pode ser vazio em users antigos. */
  phone: string;
  display_name: string | null;
  role: Role;
  birth_date: string | null;
  uses_internal_payment: boolean;
  is_trainer: boolean;
  is_student: boolean;
}

export interface LoginRequest {
  /** Aceita username ou email — backend resolve. */
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RefreshResponse {
  access: string;
  refresh?: string;
}

// ---------- Catálogo (read-only pro aluno) ----------
export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  default_technique_note: string;
  demo_gif: string | null;
  is_public: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

// ---------- Ficha + exercícios da ficha ----------
export interface WorkoutListItem {
  id: string;
  student: number;
  trainer: number | null;
  name: string;
  focus: string;
  day_label: string;
  notes: string;
  is_archived: boolean;
  exercises_count: number;
  estimated_duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout: string;
  exercise: string;
  exercise_detail: Exercise;
  order: number;
  /** Mesmo group_id em N itens = superset/conjugado. null = solo. */
  group_id: string | null;
  sets: number;
  reps: string;
  load_kg: number | null;
  /** Carga por série — length=sets, ou vazio (= usa load_kg). */
  set_loads: (number | null)[];
  rest_seconds: number;
  technique_note: string;
}

export interface WorkoutDetail extends WorkoutListItem {
  workout_exercises: WorkoutExercise[];
}

// ---------- Sessão (execução de treino) ----------
export type SessionStatus = "in_progress" | "completed" | "abandoned";

export interface WorkoutSession {
  id: string;
  workout: string;
  student: number;
  started_at: string;
  finished_at: string | null;
  elapsed_seconds: number;
  status: SessionStatus;
}

export interface ExerciseSetLog {
  id: string;
  session: string;
  workout_exercise: string;
  set_number: number;
  load_kg: string | number;
  reps_done: number;
  is_completed: boolean;
  completed_at: string | null;
}

export interface CreateSessionRequest {
  workout: string;
}

export interface UpdateSessionRequest {
  status?: SessionStatus;
  finished_at?: string;
  elapsed_seconds?: number;
}

export interface UpdateSetLogRequest {
  load_kg?: number;
  reps_done?: number;
  is_completed?: boolean;
}
