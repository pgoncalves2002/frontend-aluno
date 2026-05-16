import { Dumbbell, KeyRound, LogOut, UserCircle2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";

/**
 * Header desktop/tablet do SPA do aluno. Em mobile o BottomNav cuida do
 * principal — esse header serve como atalho pra account/senha/logout.
 */
export default function Header() {
  const { user, logout } = useAuthStore();
  const displayName = user?.display_name || user?.username || "";
  const [changePwOpen, setChangePwOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-3xl flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="size-8 rounded-lg bg-accent flex items-center justify-center">
            <Dumbbell className="size-4 text-primary" />
          </div>
          <span>FichaGym</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/me" className="hidden sm:inline" title="Minha conta">
            <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {displayName}
            </span>
          </Link>
          <Link to="/me" aria-label="Minha conta" title="Minha conta">
            <Button variant="ghost" size="sm">
              <UserCircle2 className="size-4" />
              <span className="hidden sm:inline">Conta</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setChangePwOpen(true)}
            aria-label="Alterar senha"
            title="Alterar senha"
          >
            <KeyRound className="size-4" />
            <span className="hidden sm:inline">Senha</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
      <ChangePasswordDialog open={changePwOpen} onOpenChange={setChangePwOpen} />
    </header>
  );
}
