/**
 * Endpoints de execução de treino.
 *
 *   POST  /api/sessions/                       — começar sessão
 *   GET   /api/sessions/:id/                   — buscar com set_logs aninhados
 *   PATCH /api/sessions/:id/                   — finalizar / abandonar
 *   PATCH /api/set-logs/:id/                   — marcar uma série
 *
 * Permission IsSessionOwner: aluno só mexe nas próprias sessões — perfeito
 * pra esse SPA.
 */

import { api } from "./client";
import type {
  CreateSessionRequest,
  ExerciseSetLog,
  UpdateSessionRequest,
  UpdateSetLogRequest,
  WorkoutSession,
} from "./types";

export interface SessionDetail extends WorkoutSession {
  set_logs: ExerciseSetLog[];
}

export async function startSession(workoutId: string): Promise<SessionDetail> {
  const body: CreateSessionRequest = { workout: workoutId };
  const r = await api.post<SessionDetail>("/api/sessions/", body);
  return r.data;
}

export async function getSession(id: string): Promise<SessionDetail> {
  const r = await api.get<SessionDetail>(`/api/sessions/${id}/`);
  return r.data;
}

export async function updateSession(
  id: string,
  body: UpdateSessionRequest,
): Promise<SessionDetail> {
  const r = await api.patch<SessionDetail>(`/api/sessions/${id}/`, body);
  return r.data;
}

export async function updateSetLog(
  id: string,
  body: UpdateSetLogRequest,
): Promise<ExerciseSetLog> {
  const r = await api.patch<ExerciseSetLog>(`/api/set-logs/${id}/`, body);
  return r.data;
}
