import { AlertTriangle, Lock, User as UserIcon } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { login } from "@/api/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const { isLoggedIn, didLogin, user } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Se já tá logado E é student, manda pra Home. Se é trainer/admin tentando
  // entrar pelo SPA do aluno, mostra erro (precisa do SPA coach).
  if (isLoggedIn && user?.is_student) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Preencha usuário e senha.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const resp = await login({ username: username.trim(), password });
      if (!resp.user.is_student) {
        setError(
          "Este app é só pra alunos. Personais usam coach.fichagym.com.",
        );
        return;
      }
      didLogin(resp.access, resp.refresh, resp.user);
    } catch (err: unknown) {
      const detail = extractError(err);
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% -10%, hsl(var(--primary) / 0.18) 0%, hsl(var(--background)) 65%)",
      }}
    >
      <div className="w-full max-w-sm flex flex-col gap-6 relative z-10">
        <div className="flex flex-col items-center gap-4">
          <Logo variant="mark" height={88} className="rounded-2xl shadow-lg" />
          <h1 className="font-display text-3xl font-bold tracking-tight">FichaGym</h1>
          <p className="text-sm text-muted-foreground text-center">
            Entre pra ver seus treinos.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-card p-6 flex flex-col gap-4 shadow-sm"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="username">E-mail ou usuário</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="email@exemplo.com"
                autoComplete="username"
                autoCapitalize="off"
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pl-9"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" size="lg" disabled={isLoading}>
            {isLoading ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function extractError(err: unknown): string {
  if (typeof err !== "object" || err === null) {
    return "Erro inesperado. Tenta de novo.";
  }
  const e = err as {
    code?: string;
    message?: string;
    response?: { status?: number; data?: { detail?: string } };
  };

  if (e.response) {
    const r = e.response;
    if (r.status === 401) return "Usuário ou senha inválidos.";
    if (r.status === 400 && r.data?.detail) return r.data.detail;
    if (r.status && r.status >= 500) {
      return "O servidor está com problema. Tenta de novo em instantes.";
    }
    if (r.data?.detail) return r.data.detail;
  }

  if (e.code === "ECONNABORTED" || /timeout/i.test(e.message ?? "")) {
    return "O servidor demorou demais pra responder. Verifica sua conexão.";
  }
  if (e.code === "ERR_NETWORK") {
    return "Sem conexão com o servidor. Verifica sua internet ou se o serviço está no ar.";
  }

  return e.message?.trim() ? e.message : "Falha de conexão. Tenta de novo.";
}
