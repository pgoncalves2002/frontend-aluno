/**
 * Endpoints de fichas (read-only pro aluno).
 *
 * O aluno só precisa LER suas fichas; edição é exclusiva do trainer (SPA
 * coach). O backend já filtra por `student=request.user` no queryset do
 * WorkoutViewSet pra alunos.
 */

import { api } from "./client";
import type { WorkoutDetail, WorkoutListItem } from "./types";

export async function listMyWorkouts(): Promise<WorkoutListItem[]> {
  // Aluno bate em /api/workouts/ e o backend retorna só as fichas ativas
  // do próprio aluno (filtragem por role no ViewSet).
  const r = await api.get<WorkoutListItem[]>("/api/workouts/", {
    params: { archived: "false" },
  });
  return r.data;
}

export async function getWorkout(id: string): Promise<WorkoutDetail> {
  const r = await api.get<WorkoutDetail>(`/api/workouts/${id}/`);
  return r.data;
}
