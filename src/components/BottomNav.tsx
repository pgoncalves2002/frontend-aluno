import { BarChart3, History, ListChecks, User } from "lucide-react";
import { NavLink } from "react-router-dom";

/**
 * Barra de navegação inferior — o caminho principal do aluno no app.
 *
 * 4 destinos: Treinos / Desempenho / Histórico / Personal. Espelha a
 * organização das abas no app iOS pra dar consistência entre web e mobile.
 *
 * Fixa no rodapé em mobile; em desktop também aparece (consistência) mas
 * fica menos crítica porque o Header já tem atalho pra conta/senha/logout.
 */
export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur"
      aria-label="Navegação principal"
    >
      <div className="mx-auto max-w-3xl grid grid-cols-4 px-2 py-1.5">
        <Item to="/" icon={<ListChecks className="size-5" />} label="Treinos" end />
        <Item to="/desempenho" icon={<BarChart3 className="size-5" />} label="Desempenho" />
        <Item to="/historico" icon={<History className="size-5" />} label="Histórico" />
        <Item to="/personal" icon={<User className="size-5" />} label="Personal" />
      </div>
    </nav>
  );
}

function Item({
  to,
  icon,
  label,
  end,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        "flex flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors " +
        (isActive
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground")
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
