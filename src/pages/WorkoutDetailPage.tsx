/**
 * Detalhe de uma ficha. Mostra todos os exercícios com séries planejadas
 * e oferece o CTA "Iniciar treino" — cria a sessão no backend e navega
 * pra ExecuteWorkoutPage.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  Dumbbell,
  ListChecks,
  Play,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { startSession } from "@/api/sessions";
import type { WorkoutExercise } from "@/api/types";
import { getWorkout } from "@/api/workouts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { validityLabel } from "@/lib/format";

export default function WorkoutDetailPage() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();

  const { data: workout, isLoading, error } = useQuery({
    queryKey: ["workout", workoutId],
    queryFn: () => getWorkout(workoutId!),
    enabled: !!workoutId,
  });

  const startMutation = useMutation({
    mutationFn: () => startSession(workoutId!),
    onSuccess: (session) => {
      navigate(`/sessions/${session.id}`);
    },
  });

  // Agrupa conjugados (mesmo group_id) em blocos consecutivos. O backend
  // garante que itens de um superset têm `order` adjacentes, então um pass
  // linear basta.
  const blocks = workout
    ? groupConjugates(workout.workout_exercises)
    : [];

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground self-start"
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Link>

      {isLoading && (
        <div className="text-muted-foreground">Carregando…</div>
      )}

      {error && (
        <Card className="p-4 text-sm text-destructive">
          Não consegui carregar essa ficha.
        </Card>
      )}

      {workout && (
        <>
          <div className="flex items-start gap-3">
            <div className="size-12 rounded-xl bg-accent flex items-center justify-center text-primary shrink-0">
              <Dumbbell className="size-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {workout.day_label || "—"}
              </div>
              <h1 className="text-2xl font-bold">{workout.name}</h1>
              <div className="text-sm text-muted-foreground">
                {workout.focus || "Sem foco definido"}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <ListChecks className="size-3" />
                  {workout.exercises_count} exercícios
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" />
                  ~{workout.estimated_duration_minutes} min
                </span>
                {validityLabel(workout.valid_from, workout.valid_until) && (
                  <span className="inline-flex items-center gap-1 text-primary font-medium">
                    <CalendarClock className="size-3" />
                    {validityLabel(workout.valid_from, workout.valid_until)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {workout.notes && (
            <Card className="p-3 text-sm bg-accent/30">
              <strong>Observações do personal:</strong>
              <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                {workout.notes}
              </p>
            </Card>
          )}

          <div className="flex flex-col gap-3">
            {blocks.map((block, idx) => {
              const isSuperset = block.length > 1;
              return (
                <Card
                  key={idx}
                  className={
                    "p-4 " +
                    (isSuperset
                      ? "border-l-4 border-l-primary/40"
                      : "")
                  }
                >
                  {isSuperset && (
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-primary mb-2">
                      Conjugado ({block.length}x)
                    </div>
                  )}
                  <div className="flex flex-col gap-3">
                    {block.map((ex, exIdx) => (
                      <ExerciseRow
                        key={ex.id}
                        exercise={ex}
                        badge={
                          isSuperset
                            ? String.fromCharCode(65 + exIdx)
                            : null
                        }
                      />
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="sticky bottom-16 pt-3 pb-3 -mx-4 px-4 bg-background/80 backdrop-blur border-t mt-4">
            <Button
              size="lg"
              className="w-full"
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
            >
              <Play className="size-4" />
              {startMutation.isPending ? "Iniciando…" : "Iniciar treino"}
            </Button>
            {startMutation.error && (
              <p className="text-xs text-destructive mt-2 text-center">
                Não consegui iniciar a sessão. Tenta de novo.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ExerciseRow({
  exercise,
  badge,
}: {
  exercise: WorkoutExercise;
  badge: string | null;
}) {
  // Pra apresentar carga: se há `set_loads` com valores diferentes, mostra
  // "var" + range. Senão mostra um número só.
  const loadText = formatLoad(exercise);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 flex-wrap">
        {badge && (
          <span className="inline-flex items-center justify-center size-5 rounded bg-primary/15 text-primary text-[10px] font-bold">
            {badge}
          </span>
        )}
        <div className="font-medium">{exercise.exercise_detail.name}</div>
        <span className="text-[11px] text-muted-foreground capitalize">
          {exercise.exercise_detail.muscle_group}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        {exercise.sets}×{exercise.reps}
        {loadText && ` · ${loadText}`}
        {exercise.rest_seconds > 0 && ` · ${exercise.rest_seconds}s desc.`}
      </div>
      {exercise.technique_note && (
        <div className="text-xs text-muted-foreground/80 italic">
          “{exercise.technique_note}”
        </div>
      )}
    </div>
  );
}

function groupConjugates(items: WorkoutExercise[]): WorkoutExercise[][] {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const out: WorkoutExercise[][] = [];
  for (const it of sorted) {
    const last = out[out.length - 1];
    if (last && it.group_id && last[0].group_id === it.group_id) {
      last.push(it);
    } else {
      out.push([it]);
    }
  }
  return out;
}

function formatLoad(ex: WorkoutExercise): string | null {
  const loads = (ex.set_loads ?? []).filter((v): v is number => v != null);
  if (loads.length > 0) {
    const unique = Array.from(new Set(loads));
    if (unique.length === 1) return `${unique[0]}kg`;
    const min = Math.min(...unique);
    const max = Math.max(...unique);
    return `${min}–${max}kg`;
  }
  if (ex.load_kg != null) return `${ex.load_kg}kg`;
  return null;
}
