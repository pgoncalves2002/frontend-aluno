import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Dumbbell,
  ListChecks,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  getMySessionDetail,
  listMySessions,
  type RecentSessionStatus as SessionStatus,
  type SessionDetailResponse,
  type SessionExerciseDetail,
  type SessionSummary,
} from "@/api/metrics";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";

const PAGE_SIZE = 20;

const STATUS_FILTERS: { value: SessionStatus | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "completed", label: "Concluídas" },
  { value: "abandoned", label: "Abandonadas" },
  { value: "in_progress", label: "Em andamento" },
];

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "all">("all");

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: [
      "my-sessions",
      page,
      statusFilter,
    ],
    queryFn: () =>
      listMySessions({
        page,
        page_size: PAGE_SIZE,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
    staleTime: 30_000,
    placeholderData: (prev) => prev, // mantém a tela enquanto pagina
  });

  // IDs das sessões expandidas. Permitir várias abertas porque o trainer
  // costuma comparar 2-3 sessões lado a lado.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  function toggleExpand(id: string) {
    setExpanded((curr) => {
      const next = new Set(curr);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function changeStatusFilter(v: SessionStatus | "all") {
    setStatusFilter(v);
    setPage(1); // reset paginação ao mudar filtro
    setExpanded(new Set());
  }

  if (error) {
    return (
      <Card className="p-6 text-sm text-destructive">
        Não consegui carregar o histórico. Tenta de novo daqui a pouco.
      </Card>
    );
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Filtro por status */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Filtrar:</span>
        {STATUS_FILTERS.map((opt) => (
          <Chip
            key={opt.value}
            selected={statusFilter === opt.value}
            onClick={() => changeStatusFilter(opt.value)}
          >
            {opt.label}
          </Chip>
        ))}
        {data && (
          <span className="ml-auto text-xs text-muted-foreground">
            {data.count} {data.count === 1 ? "sessão" : "sessões"}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 bg-muted/30 rounded-md animate-pulse"
            />
          ))}
        </div>
      )}

      {data && data.results.length === 0 && (
        <Card className="flex flex-col items-center py-12 text-center">
          <ListChecks className="size-10 text-muted-foreground mb-3" />
          <h3 className="font-semibold">Sem sessões registradas</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Quando o aluno executar treinos, eles aparecem aqui.
          </p>
        </Card>
      )}

      {data && data.results.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.results.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              expanded={expanded.has(s.id)}
              onToggle={() => toggleExpand(s.id)}
            />
          ))}
        </div>
      )}

      {/* Paginação */}
      {data && data.count > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 mt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1 || isFetching}
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              setExpanded(new Set());
            }}
          >
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!data.has_next || isFetching}
            onClick={() => {
              setPage((p) => p + 1);
              setExpanded(new Set());
            }}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Card de uma sessão (resumo + expansão com detail).
// ============================================================================
function SessionCard({
  session,
  expanded,
  onToggle,
}: {
  session: SessionSummary;
  expanded: boolean;
  onToggle: () => void;
}) {
  // Lazy: só busca detail quando o card está expandido.
  const { data: detail, isLoading, error } = useQuery({
    queryKey: ["my-session-detail", session.id],
    queryFn: () => getMySessionDetail(session.id),
    enabled: expanded,
    staleTime: 60_000,
  });

  const startedAt = useMemo(() => fmtDateTime(session.started_at), [session.started_at]);

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-accent/40 transition-colors"
        aria-expanded={expanded}
      >
        <div className="mt-0.5 shrink-0 text-muted-foreground">
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold truncate">{session.workout_name}</div>
            <StatusBadge status={session.status} />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3" />
              {startedAt}
            </span>
            <span className="inline-flex items-center gap-1">
              <ListChecks className="size-3" />
              {session.sets_completed}/{session.sets_total} séries
            </span>
            {session.elapsed_minutes > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" />
                {session.elapsed_minutes < 1
                  ? "<1 min"
                  : `${Math.round(session.elapsed_minutes)} min`}
              </span>
            )}
            {session.workout_focus && (
              <span className="truncate">· {session.workout_focus}</span>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t bg-muted/20 px-4 py-3">
          {isLoading && (
            <div className="text-sm text-muted-foreground">
              Carregando séries…
            </div>
          )}
          {error && (
            <div className="text-sm text-destructive">
              Erro ao carregar detalhes.
            </div>
          )}
          {detail && <ExerciseList detail={detail} />}
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// Lista de exercícios da sessão (com séries por exercício).
// Agrupa visualmente conjugados (mesmo group_id) — etiqueta A·B.
// ============================================================================
function ExerciseList({ detail }: { detail: SessionDetailResponse }) {
  // Agrupa exercícios consecutivos com mesmo group_id em "blocos conjugados".
  // Item sem group_id ou com group_id diferente do anterior abre novo bloco.
  type Block = {
    groupId: string | null;
    items: SessionExerciseDetail[];
  };
  const blocks: Block[] = [];
  for (const ex of detail.exercises) {
    const last = blocks[blocks.length - 1];
    if (last && last.groupId && last.groupId === ex.group_id) {
      last.items.push(ex);
    } else {
      blocks.push({ groupId: ex.group_id, items: [ex] });
    }
  }

  if (detail.exercises.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        A ficha não tinha exercícios cadastrados no momento da execução.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header com volume total da sessão */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="inline-flex items-center gap-1">
          <Dumbbell className="size-3" />
          Volume:{" "}
          <strong className="text-foreground">
            {detail.session.total_volume_kg.toLocaleString("pt-BR")} kg
          </strong>
        </span>
      </div>

      {blocks.map((block, blockIdx) => {
        const isSuperset = block.groupId !== null && block.items.length > 1;
        return (
          <div
            key={blockIdx}
            className={
              isSuperset
                ? "rounded-md border-l-2 border-primary/40 pl-3 flex flex-col gap-3"
                : "flex flex-col gap-3"
            }
          >
            {isSuperset && (
              <div className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                Conjugado ({block.items.length}x)
              </div>
            )}
            {block.items.map((ex, exIdx) => (
              <ExerciseBlock
                key={ex.workout_exercise_id}
                exercise={ex}
                badge={
                  isSuperset
                    ? String.fromCharCode(65 + exIdx) // A, B, C
                    : null
                }
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function ExerciseBlock({
  exercise,
  badge,
}: {
  exercise: SessionExerciseDetail;
  badge: string | null;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        {badge && (
          <span className="inline-flex items-center justify-center size-5 rounded bg-primary/15 text-primary text-[10px] font-bold">
            {badge}
          </span>
        )}
        <div className="font-medium text-sm">{exercise.exercise_name}</div>
        <div className="text-[11px] text-muted-foreground capitalize">
          {exercise.muscle_group} · {exercise.sets_planned}×{exercise.reps_planned}
          {exercise.rest_seconds > 0 && ` · ${exercise.rest_seconds}s desc.`}
        </div>
      </div>

      {exercise.sets.length === 0 ? (
        <div className="text-[11px] text-muted-foreground/80 italic pl-1">
          Sem séries registradas neste exercício.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-[11px] mx-1">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="font-medium py-1 pr-2 w-8">#</th>
                <th className="font-medium py-1 pr-2">Carga</th>
                <th className="font-medium py-1 pr-2">Reps</th>
                <th className="font-medium py-1 pr-2">Concluída</th>
              </tr>
            </thead>
            <tbody>
              {exercise.sets.map((s) => {
                const targetLoad = s.target_load_kg;
                const loadDelta =
                  targetLoad != null ? s.load_kg - targetLoad : 0;
                return (
                  <tr
                    key={s.set_number}
                    className="border-b last:border-b-0"
                  >
                    <td className="py-1 pr-2 font-mono">{s.set_number}</td>
                    <td className="py-1 pr-2 font-mono">
                      <span
                        className={
                          targetLoad != null && loadDelta !== 0
                            ? loadDelta > 0
                              ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                              : "text-amber-600 dark:text-amber-400"
                            : ""
                        }
                      >
                        {s.load_kg} kg
                      </span>
                      {targetLoad != null && targetLoad !== s.load_kg && (
                        <span className="text-muted-foreground/70 ml-1">
                          (alvo {targetLoad})
                        </span>
                      )}
                    </td>
                    <td className="py-1 pr-2 font-mono">
                      {s.reps_done > 0 ? s.reps_done : "—"}
                      <span className="text-muted-foreground/70 ml-1">
                        / {s.target_reps}
                      </span>
                    </td>
                    <td className="py-1 pr-2">
                      {s.is_completed ? (
                        <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <span className="text-muted-foreground/60">○</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Subcomponentes compartilhados
// ============================================================================
function StatusBadge({ status }: { status: SessionStatus }) {
  const config = {
    completed: {
      label: "Concluído",
      icon: <CheckCircle2 className="size-3" />,
      cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    abandoned: {
      label: "Abandonado",
      icon: <AlertTriangle className="size-3" />,
      cls: "bg-destructive/10 text-destructive",
    },
    in_progress: {
      label: "Em andamento",
      icon: <Activity className="size-3" />,
      cls: "bg-primary/10 text-primary",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full text-[10px] font-medium px-1.5 py-0.5 shrink-0 ${config.cls}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

function fmtDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
