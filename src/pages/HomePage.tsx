/**
 * Home — lista de fichas ativas do aluno logado. Tap em uma ficha leva
 * pra tela de detalhe (onde também rola o botão "Iniciar treino").
 */

import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronRight, Clock, Dumbbell, ListChecks } from "lucide-react";
import { Link } from "react-router-dom";
import { listMyWorkouts } from "@/api/workouts";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/stores/authStore";

export default function HomePage() {
  const { user } = useAuthStore();
  const greetingName = user?.display_name || user?.username || "";

  const { data: workouts, isLoading, error } = useQuery({
    queryKey: ["my-workouts"],
    queryFn: listMyWorkouts,
  });

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
