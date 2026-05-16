/**
 * Execução de treino — aluno marca séries, ajusta carga/reps, e ao fim
 * a sessão fecha como `completed`. Versão web "mobile-first" do mesmo
 * fluxo do app iOS.
 *
 * Estado vive parcialmente no servidor (set_logs persistentes) e
 * parcialmente local (timer de descanso, slot atual). PATCH a cada
 * conclusão de série mantém o backend sincronizado.
 *
 * Decisões:
 *   - Mostra UM exercício por vez (foco). Navegação anterior/próximo.
 *   - Timer de descanso é cliente-side; ao zerar, vibra (se browser permitir)
 *     e marca visualmente. Não precisa pedir pra continuar.
 *   - Set logs vêm pré-criados pelo backend ao iniciar a sessão; nós só
 *     editamos via PATCH.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Minus,
  Pause,
  Play,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getSession,
  type SessionDetail,
  updateSession,
  updateSetLog,
} from "@/api/sessions";
import type { ExerciseSetLog, WorkoutExercise } from "@/api/types";
import { getWorkout } from "@/api/workouts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function ExecuteWorkoutPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => getSession(sessionId!),
    enabled: !!sessionId,
  });

  // Buscamos o WorkoutDetail pra ter os exercícios na ordem + parâmetros
  // (sets planejados, reps, group_id, rest). O set_logs ficam na session.
  const { data: workout } = useQuery({
    queryKey: ["workout", session?.workout],
    queryFn: () => getWorkout(session!.workout),
    enabled: !!session?.workout,
  });

  // Index do exercício atual em foco (entre os WorkoutExercise da ficha).
  const [currentIdx, setCurrentIdx] = useState(0);

  // Timer de descanso: contagem regressiva client-side. Quando zera, deixa
  // visível mas não interrompe a UI (aluno pode prosseguir antes se quiser).
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [restIsRunning, setRestIsRunning] = useState(false);
  const restIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!restIsRunning) return;
    restIntervalRef.current = window.setInterval(() => {
      setRestSecondsLeft((s) => {
        if (s <= 1) {
          setRestIsRunning(false);
          // Haptic feedback se disponível
          if ("vibrate" in navigator) navigator.vibrate(200);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (restIntervalRef.current) window.clearInterval(restIntervalRef.current);
    };
  }, [restIsRunning]);

  function startRest(seconds: number) {
    if (seconds <= 0) return;
    setRestSecondsLeft(seconds);
    setRestIsRunning(true);
  }

  // Mutations: atualizar set log e fechar sessão.
  const setLogMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateSetLog>[1] }) =>
      updateSetLog(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["session", sessionId] });
    },
  });

  const finishMutation = useMutation({
    mutationFn: (status: "completed" | "abandoned") =>
      updateSession(sessionId!, {
        status,
        finished_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["session", sessionId] });
      qc.invalidateQueries({ queryKey: ["my-workouts"] });
      navigate("/historico", { replace: true });
    },
  });

  // Ordenação + agrupamento de exercícios
  const exercises = useMemo(
    () =>
      workout
        ? [...workout.workout_exercises].sort((a, b) => a.order - b.order)
        : [],
    [workout],
  );
  const currentEx = exercises[currentIdx];

  // Set logs do exercício atual
  const setsOfCurrent = useMemo(() => {
    if (!session || !currentEx) return [];
    return session.set_logs
      .filter((l) => l.workout_exercise === currentEx.id)
      .sort((a, b) => a.set_number - b.set_number);
  }, [session, currentEx]);

  if (isLoading || !session) {
    return <div className="text-muted-foreground">Carregando sessão…</div>;
  }

  if (session.status !== "in_progress") {
    // Sessão já fechada — não dá pra continuar. Manda pra histórico.
    return (
      <Card className="p-4 flex flex-col gap-3 items-center text-center">
        <CheckCircle2 className="size-10 text-emerald-500" />
        <div>
          Sessão já está como <strong>{session.status}</strong>.
        </div>
        <Button onClick={() => navigate("/historico")}>Ver histórico</Button>
      </Card>
    );
  }

  if (!currentEx) {
    return <div className="text-muted-foreground">Carregando exercícios…</div>;
  }

  const allSetsCompleted = setsOfCurrent.every((s) => s.is_completed);
  const isLastExercise = currentIdx === exercises.length - 1;

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (
              confirm(
                "Sair sem finalizar? A sessão fica em andamento — você pode retomar depois.",
              )
            ) {
              navigate("/");
            }
          }}
        >
          <ArrowLeft className="size-4" />
          Sair
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (
              confirm("Marcar a sessão como ABANDONADA? Não dá pra desfazer.")
            ) {
              finishMutation.mutate("abandoned");
            }
          }}
          disabled={finishMutation.isPending}
          className="text-destructive hover:text-destructive"
        >
          <AlertTriangle className="size-4" />
          Abandonar
        </Button>
      </div>

      <Card className="p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
          Exercício {currentIdx + 1} de {exercises.length}
        </div>
        <h2 className="text-xl font-bold">{currentEx.exercise_detail.name}</h2>
        <div className="text-sm text-muted-foreground capitalize">
          {currentEx.exercise_detail.muscle_group} · {currentEx.sets}×
          {currentEx.reps}
          {currentEx.rest_seconds > 0 &&
            ` · descanso ${currentEx.rest_seconds}s`}
        </div>
        {currentEx.technique_note && (
          <div className="text-xs text-muted-foreground/80 italic mt-2">
            “{currentEx.technique_note}”
          </div>
        )}
      </Card>

      {/* Timer de descanso */}
      <Card
        className={
          "p-4 flex items-center justify-between " +
          (restIsRunning
            ? "border-amber-500/40 bg-amber-500/5"
            : "")
        }
      >
        <div className="flex items-center gap-3">
          <Clock className="size-5 text-amber-500" />
          <div>
            <div className="text-2xl font-mono font-bold tabular-nums">
              {formatTime(restSecondsLeft)}
            </div>
            <div className="text-xs text-muted-foreground">
              {restIsRunning ? "Descansando…" : "Timer parado"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {restIsRunning ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRestIsRunning(false)}
            >
              <Pause className="size-4" />
              Parar
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => startRest(currentEx.rest_seconds || 60)}
            >
              <Play className="size-4" />
              Iniciar ({currentEx.rest_seconds || 60}s)
            </Button>
          )}
        </div>
      </Card>

      {/* Séries do exercício atual */}
      <div className="flex flex-col gap-2">
        {setsOfCurrent.map((log) => (
          <SetRow
            key={log.id}
            log={log}
            workoutExercise={currentEx}
            onToggle={(completed) => {
              setLogMutation.mutate({
                id: log.id,
                body: { is_completed: completed },
              });
              // Quando completa, dispara o descanso automaticamente.
              if (completed && currentEx.rest_seconds > 0) {
                startRest(currentEx.rest_seconds);
              }
            }}
            onEdit={(payload) => {
              setLogMutation.mutate({ id: log.id, body: payload });
            }}
          />
        ))}
      </div>

      {/* Navegação inferior */}
      <div className="fixed bottom-16 inset-x-0 z-20 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-3xl flex items-center gap-2 px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          {isLastExercise && allSetsCompleted ? (
            <Button
              className="flex-1"
              onClick={() => finishMutation.mutate("completed")}
              disabled={finishMutation.isPending}
            >
              <Flag className="size-4" />
              {finishMutation.isPending ? "Finalizando…" : "Finalizar treino"}
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={() =>
                setCurrentIdx((i) => Math.min(exercises.length - 1, i + 1))
              }
              disabled={currentIdx === exercises.length - 1}
            >
              Próximo exercício
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Subcomponentes
// ============================================================================

function SetRow({
  log,
  workoutExercise,
  onToggle,
  onEdit,
}: {
  log: ExerciseSetLog;
  workoutExercise: WorkoutExercise;
  onToggle: (completed: boolean) => void;
  onEdit: (payload: { load_kg?: number; reps_done?: number }) => void;
}) {
  // Pega valor numérico — backend devolve DecimalField como string.
  const initialLoad = Number(log.load_kg) || 0;
  const initialReps = log.reps_done || 0;

  // Local state pra debounce de digitação. Commit no blur.
  const [load, setLoad] = useState(initialLoad);
  const [reps, setReps] = useState(initialReps);

  useEffect(() => {
    setLoad(initialLoad);
    setReps(initialReps);
  }, [initialLoad, initialReps]);

  return (
    <Card
      className={
        "p-3 flex items-center gap-3 " +
        (log.is_completed ? "bg-emerald-500/5 border-emerald-500/30" : "")
      }
    >
      <div className="font-mono font-bold w-6 text-center text-muted-foreground">
        {log.set_number}
      </div>

      <div className="flex-1 grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] uppercase text-muted-foreground">
            Carga (kg)
          </label>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="size-7 p-0"
              onClick={() => {
                const next = Math.max(0, load - 2.5);
                setLoad(next);
                onEdit({ load_kg: next });
              }}
            >
              <Minus className="size-3" />
            </Button>
            <Input
              type="number"
              step="0.5"
              value={load}
              onChange={(e) => setLoad(Number(e.target.value) || 0)}
              onBlur={() => onEdit({ load_kg: load })}
              className="h-7 text-center font-mono"
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="size-7 p-0"
              onClick={() => {
                const next = load + 2.5;
                setLoad(next);
                onEdit({ load_kg: next });
              }}
            >
              <Plus className="size-3" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] uppercase text-muted-foreground">
            Reps ({workoutExercise.reps})
          </label>
          <Input
            type="number"
            value={reps}
            onChange={(e) => setReps(Number(e.target.value) || 0)}
            onBlur={() => onEdit({ reps_done: reps })}
            className="h-7 text-center font-mono"
          />
        </div>
      </div>

      <Button
        variant={log.is_completed ? "default" : "outline"}
        size="sm"
        onClick={() => onToggle(!log.is_completed)}
        aria-label={log.is_completed ? "Desmarcar" : "Marcar como concluída"}
        className={
          log.is_completed
            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
            : ""
        }
      >
        <Check className="size-4" />
      </Button>
    </Card>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Helper export to avoid unused warning if the import shifts later.
export type { SessionDetail };
