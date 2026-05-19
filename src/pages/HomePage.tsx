/**
 * Home — lista de fichas ativas do aluno logado. Tap em uma ficha leva
 * pra tela de detalhe (onde também rola o botão "Iniciar treino").
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  CalendarOff,
  ChevronRight,
  Clock,
  Dumbbell,
  ListChecks,
} from "lucide-react";
import { Link } from "react-router-dom";
import { listMyWorkouts } from "@/api/workouts";
import type { WorkoutListItem } from "@/api/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";

/**
 * Hoje em "yyyy-MM-dd" no fuso local do device — alinhado com `date.today()`
 * do backend Django. Strings ISO no formato zero-padded são comparáveis
 * lexicograficamente (`"2026-05-18" < "2026-12-01"` em string == em data).
 */
function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Decida se a ficha está dentro da janela de validade HOJE.
 *
 * Espelha `Workout.is_visible_to_student(today)` do backend. O servidor já
 * filtra fichas fora da janela pro aluno (em /api/workouts/ e /api/sync/),
 * mas TanStack Query cacheia o response em memória — se o aluno manter a
 * aba aberta passando da meia-noite, uma ficha `active` pode virar
 * `expired` sem refetch. Filtramos no cliente também, e mostramos um
 * aviso "atualize" pra cobrir esse gap.
 */
function isVisibleToday(w: WorkoutListItem, today = todayISO()): boolean {
  if (w.valid_from && today < w.valid_from) return false;
  if (w.valid_until && today > w.valid_until) return false;
  return true;
}

export default function HomePage() {
  const { user } = useAuthStore();
  const greetingName = user?.display_name || user?.username || "";

  const {
    data: allWorkouts,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["my-workouts"],
    queryFn: listMyWorkouts,
  });

  // Memoizado pra não recalcular hoje a cada render (o valor de `today`
  // muda só de 24h em 24h em uso normal). Recalcular na mount já cobre o
  // caso "aba aberta na virada do dia" porque o user vai navegar de novo.
  const { workouts, hiddenByValidityCount } = useMemo(() => {
    if (!allWorkouts) return { workouts: [] as WorkoutListItem[], hiddenByValidityCount: 0 };
    const today = todayISO();
    const visible = allWorkouts.filter((w) => isVisibleToday(w, today));
    return {
      workouts: visible,
      hiddenByValidityCount: allWorkouts.length - visible.length,
    };
  }, [allWorkouts]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">
          Bom treino{greetingName ? `, ${greetingName.split(" ")[0]}!` : "!"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {workouts && workouts.length > 0
            ? `Você tem ${workouts.length} ficha${
                workouts.length > 1 ? "s" : ""
              } ativa${workouts.length > 1 ? "s" : ""}.`
            : "Suas fichas vão aparecer aqui."}
        </p>
      </div>

      {hiddenByValidityCount > 0 && (
        <Card className="p-3 flex items-center gap-3 border-amber-500/40 bg-amber-500/5">
          <CalendarOff className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1 text-sm">
            <div className="font-medium">
              {hiddenByValidityCount} ficha
              {hiddenByValidityCount > 1 ? "s" : ""} fora do período
            </div>
            <div className="text-xs text-muted-foreground">
              Atualize pra ver o catálogo mais recente.
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Atualizando…" : "Atualizar"}
          </Button>
        </Card>
      )}

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 bg-muted/30 rounded-md animate-pulse"
            />
          ))}
        </div>
      )}

      {error && (
        <Card className="p-4 text-sm text-destructive">
          Não consegui carregar suas fichas. Tenta puxar pra atualizar daqui
          a pouco.
        </Card>
      )}

      {workouts && workouts.length === 0 && (
        <Card className="flex flex-col items-center py-12 text-center">
          <ListChecks className="size-10 text-muted-foreground mb-3" />
          <h3 className="font-semibold">Sem fichas ainda</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Quando seu personal montar a primeira ficha, ela aparece aqui.
          </p>
        </Card>
      )}

      {workouts && workouts.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {workouts.map((w) => (
            <Link key={w.id} to={`/workouts/${w.id}`}>
              <Card className="p-4 hover:bg-accent/40 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-lg bg-accent flex items-center justify-center text-primary shrink-0">
                    <Dumbbell className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      <Calendar className="size-3" />
                      {w.day_label || "—"}
                    </div>
                    <div className="font-semibold truncate">{w.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {w.focus || "Sem foco definido"}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                      <span className="inline-flex items-center gap-1">
                        <ListChecks className="size-3" />
                        {w.exercises_count} exercícios
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        ~{w.estimated_duration_minutes} min
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground mt-2 shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
