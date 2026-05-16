/**
 * Endpoints "self" de métricas + histórico do PRÓPRIO aluno.
 *
 *   GET /api/students/me/metrics/?range=30d                    — KPIs + charts
 *   GET /api/students/me/sessions/?page=&page_size=&status=    — histórico paginado
 *   GET /api/students/me/sessions/:id/detail/                  — detalhe de 1 sessão
 *
 * Estes endpoints retornam o MESMO payload das versões do trainer, só com
 * permission IsStudent + scope `student=request.user`.
 */

import { api } from "./client";

// ---------- Métricas ----------
export type MetricsRange = "7d" | "30d" | "90d" | "180d" | "365d" | "all";

export interface MetricsSummary {
  total_sessions: number;
  completed_sessions: number;
  abandoned_sessions: number;
  completion_rate: number | null;
  avg_session_duration_minutes: number;
  total_volume_kg: number;
  current_streak_days: number;
  longest_streak_days: number;
}

export interface WeeklyFrequency {
  week_start: string;
  sessions: number;
}

export interface WeeklyVolume {
  week_start: string;
  volume_kg: number;
}

export interface ExerciseProgression {
  exercise_id: string;
  exercise_name: string;
  muscle_group: string;
  max_load_kg: number;
  history: { week_start: string; max_load_kg: number }[];
}

export interface PersonalRecord {
  exercise_id: string;
  exercise_name: string;
  muscle_group: string;
  max_load_kg: number;
}

export type RecentSessionStatus = "in_progress" | "completed" | "abandoned";

export interface RecentSession {
  id: string;
  workout_id: string;
  workout_name: string;
  workout_focus: string;
  started_at: string;
  finished_at: string | null;
  elapsed_minutes: number;
  status: RecentSessionStatus;
  sets_total: number;
  sets_completed: number;
}

export interface MetricsResponse {
  student: { id: number; username: string; display_name: string };
  range_days: number;
  summary: MetricsSummary;
  weekly_frequency: WeeklyFrequency[];
  weekly_volume: WeeklyVolume[];
  exercise_progression: ExerciseProgression[];
  top_prs: PersonalRecord[];
  recent_sessions: RecentSession[];
}

export async function getMyMetrics(
  range: MetricsRange = "30d",
): Promise<MetricsResponse> {
  const r = await api.get<MetricsResponse>("/api/students/me/metrics/", {
    params: { range },
  });
  return r.data;
}

// ---------- Histórico paginado ----------
export interface SessionSummary {
  id: string;
  workout_id: string;
  workout_name: string;
  workout_focus: string;
  workout_day_label: string;
  started_at: string;
  finished_at: string | null;
  elapsed_minutes: number;
  status: RecentSessionStatus;
  sets_total: number;
  sets_completed: number;
}

export interface SessionListResponse {
  count: number;
  page: number;
  page_size: number;
  has_next: boolean;
  results: SessionSummary[];
}

export interface SessionListParams {
  page?: number;
  page_size?: number;
  status?: RecentSessionStatus;
}

export async function listMySessions(
  params: SessionListParams = {},
): Promise<SessionListResponse> {
  const r = await api.get<SessionListResponse>("/api/students/me/sessions/", {
    params,
  });
  return r.data;
}

// ---------- Detalhe de uma sessão ----------
export interface SetLogDetail {
  set_number: number;
  load_kg: number;
  reps_done: number;
  is_completed: boolean;
  completed_at: string | null;
  target_load_kg: number | null;
  target_reps: string;
}

export interface SessionExerciseDetail {
  workout_exercise_id: string;
  exercise_id: string;
  exercise_name: string;
  muscle_group: string;
  order: number;
  group_id: string | null;
  sets_planned: number;
  reps_planned: string;
  rest_seconds: number;
  technique_note: string;
  sets: SetLogDetail[];
}

export interface SessionDetailResponse {
  session: {
    id: string;
    workout_id: string;
    workout_name: string;
    workout_focus: string;
    workout_day_label: string;
    student_id: number;
    student_display_name: string;
    started_at: string;
    finished_at: string | null;
    elapsed_minutes: number;
    status: RecentSessionStatus;
    sets_total: number;
    sets_completed: number;
    total_volume_kg: number;
  };
  exercises: SessionExerciseDetail[];
}

export async function getMySessionDetail(
  sessionId: string,
): Promise<SessionDetailResponse> {
  const r = await api.get<SessionDetailResponse>(
    `/api/students/me/sessions/${sessionId}/detail/`,
  );
  return r.data;
}
