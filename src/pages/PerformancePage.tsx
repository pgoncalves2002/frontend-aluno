import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getMyMetrics,
  type MetricsRange,
  type RecentSessionStatus as SessionStatus,
} from "@/api/metrics";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";

const RANGES: { value: MetricsRange; label: string }[] = [
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "365d", label: "1 ano" },
  { value: "all", label: "Tudo" },
];

export default function PerformancePage() {
  const [range, setRange] = useState<MetricsRange>("30d");

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-metrics", range],
    queryFn: () => getMyMetrics(range),
    staleTime: 30_000,
  });

  // Default do dropdown de exercício: primeiro da lista (mais frequente).
  // Mantém o ID em state pra usuário trocar — recalc do gráfico fica memoizado.
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const progressionList = data?.exercise_progression ?? [];
  const activeExerciseId =
    selectedExercise ??
    (progressionList.length > 0 ? progressionList[0].exercise_id : null);
  const activeExercise = useMemo(
    () => progressionList.find((p) => p.exercise_id === activeExerciseId),
    [progressionList, activeExerciseId],
  );

  if (error) {
    return (
      <Card className="p-6 text-sm text-destructive">
        Não consegui carregar as métricas. Tenta de novo daqui a pouco.
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Seletor de janela */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Período:</span>
        {RANGES.map((r) => (
          <Chip
            key={r.value}
            selected={range === r.value}
            onClick={() => setRange(r.value)}
          >
            {r.label}
          </Chip>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI
          icon={<Activity className="size-4" />}
          label="Treinos"
          value={data?.summary.total_sessions ?? null}
          loading={isLoading}
          tone="info"
          hint={
            data
              ? `${data.summary.completed_sessions} concluídos · ${data.summary.abandoned_sessions} abandonados`
              : undefined
          }
        />
        <KPI
          icon={<CheckCircle2 className="size-4" />}
          label="Taxa de conclusão"
          value={
            data?.summary.completion_rate != null
              ? Math.round(data.summary.completion_rate * 100)
              : null
          }
          suffix="%"
          loading={isLoading}
          tone={
            data?.summary.completion_rate != null &&
            data.summary.completion_rate < 0.7
              ? "warn"
              : "success"
          }
          hint="completados / (completados + abandonados)"
        />
        <KPI
          icon={<Flame className="size-4" />}
          label="Streak atual"
          value={data?.summary.current_streak_days ?? null}
          suffix=" dias"
          loading={isLoading}
          tone="info"
          hint={
            data
              ? `melhor sequência: ${data.summary.longest_streak_days}d`
              : undefined
          }
        />
        <KPI
          icon={<Clock className="size-4" />}
          label="Duração média"
          value={data?.summary.avg_session_duration_minutes ?? null}
          suffix=" min"
          loading={isLoading}
          tone="info"
          hint="entre início e fim do treino"
        />
      </div>

      {/* Frequência + Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Activity className="size-4 text-primary" />
            Frequência semanal
          </div>
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.weekly_frequency ?? []}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--muted-foreground) / 0.2)"
                />
                <XAxis
                  dataKey="week_start"
                  tickFormatter={fmtWeek}
                  fontSize={11}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  fontSize={11}
                  allowDecimals={false}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  content={<ChartTooltip valueLabel="treinos" />}
                  cursor={{ fill: "hsl(var(--accent) / 0.4)" }}
                />
                <Bar
                  dataKey="sessions"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold mb-3">
            <TrendingUp className="size-4 text-primary" />
            Volume semanal (kg)
          </div>
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.weekly_volume ?? []}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--muted-foreground) / 0.2)"
                />
                <XAxis
                  dataKey="week_start"
                  tickFormatter={fmtWeek}
                  fontSize={11}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  fontSize={11}
                  tickFormatter={fmtKg}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  content={<ChartTooltip valueLabel="kg" />}
                  cursor={{ fill: "hsl(var(--accent) / 0.4)" }}
                />
                <Bar
                  dataKey="volume_kg"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Evolução de carga por exercício */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Dumbbell className="size-4 text-primary" />
            Evolução de carga
          </div>
          {progressionList.length > 0 && (
            <select
              value={activeExerciseId ?? ""}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="text-xs border rounded-md px-2 py-1 bg-background max-w-[60%]"
            >
              {progressionList.map((p) => (
                <option key={p.exercise_id} value={p.exercise_id}>
                  {p.exercise_name}
                </option>
              ))}
            </select>
          )}
        </div>
        {isLoading ? (
          <ChartSkeleton />
        ) : !activeExercise || activeExercise.history.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            Sem dados de carga registrada nessa janela.
          </div>
        ) : (
          <>
            <div className="text-xs text-muted-foreground mb-2">
              Carga máxima: <strong>{activeExercise.max_load_kg} kg</strong> ·{" "}
              {activeExercise.muscle_group}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={activeExercise.history}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--muted-foreground) / 0.2)"
                />
                <XAxis
                  dataKey="week_start"
                  tickFormatter={fmtWeek}
                  fontSize={11}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  fontSize={11}
                  tickFormatter={fmtKg}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  content={<ChartTooltip valueLabel="kg" />}
                  cursor={{ stroke: "hsl(var(--muted-foreground) / 0.3)" }}
                />
                <Line
                  type="monotone"
                  dataKey="max_load_kg"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </Card>

      {/* Top PRs + Recent sessions, lado a lado em desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Award className="size-4 text-primary" />
            Top 5 cargas máximas
          </div>
          {isLoading ? (
            <SkeletonRows />
          ) : data && data.top_prs.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {data.top_prs.map((pr) => (
                <li
                  key={pr.exercise_id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {pr.exercise_name}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {pr.muscle_group}
                    </div>
                  </div>
                  <div className="font-mono font-semibold text-primary shrink-0">
                    {pr.max_load_kg} kg
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              Ainda não há cargas registradas.
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Activity className="size-4 text-primary" />
            Últimas sessões
          </div>
          {isLoading ? (
            <SkeletonRows />
          ) : data && data.recent_sessions.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {data.recent_sessions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 text-sm border-b last:border-b-0 pb-2 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {s.workout_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {fmtDate(s.started_at)} · {s.sets_completed}/
                      {s.sets_total} séries ·{" "}
                      {s.elapsed_minutes > 0 ? `${s.elapsed_minutes} min` : "—"}
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              Sem sessões registradas nesse período.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// Subcomponentes
// ============================================================================

function KPI({
  icon,
  label,
  value,
  suffix,
  loading,
  tone,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  suffix?: string;
  loading: boolean;
  tone: "info" | "success" | "warn";
  hint?: string;
}) {
  const toneClass = {
    info: "text-primary",
    success: "text-emerald-600 dark:text-emerald-400",
    warn: "text-amber-600 dark:text-amber-400",
  }[tone];

  return (
    <Card className="p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className={toneClass}>{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        {loading && value == null ? (
          <span className="text-2xl font-bold text-muted-foreground/40">—</span>
        ) : (
          <span className={`text-2xl font-bold ${toneClass}`}>
            {value ?? "—"}
            {value != null ? suffix : ""}
          </span>
        )}
      </div>
      {hint && (
        <div className="text-[10px] text-muted-foreground/70 leading-tight">
          {hint}
        </div>
      )}
    </Card>
  );
}

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

function ChartSkeleton() {
  return (
    <div className="h-[200px] bg-muted/30 rounded-md animate-pulse flex items-center justify-center text-xs text-muted-foreground">
      Carregando…
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-10 bg-muted/30 rounded-md animate-pulse" />
      ))}
    </div>
  );
}

// Tooltip custom — usa as cores do design system (recharts default não conhece
// nossas vars CSS).
function ChartTooltip({
  active,
  payload,
  label,
  valueLabel,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: Record<string, unknown> }>;
  label?: string;
  valueLabel: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const v = payload[0].value;
  return (
    <div className="rounded-md border bg-popover text-popover-foreground shadow-md px-3 py-2 text-xs">
      <div className="text-muted-foreground">{label && fmtWeek(label)}</div>
      <div className="font-mono font-semibold">
        {valueLabel === "kg" ? `${fmtKg(v)} kg` : `${v} ${valueLabel}`}
      </div>
    </div>
  );
}

// ============================================================================
// Formatters
// ============================================================================

function fmtWeek(iso: string): string {
  // YYYY-MM-DD → "DD/MM"
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function fmtKg(v: number | string): string {
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return Math.round(n).toString();
}

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
