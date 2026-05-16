/**
 * Aba "Personal" — aluno vê os dados do trainer dele com botão WhatsApp.
 * Mesma lógica da TrainerProfileView do app iOS.
 */

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Mail, MessageCircle, Phone, User as UserIcon } from "lucide-react";
import { getMyTrainer } from "@/api/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function TrainerProfilePage() {
  const { data: trainer, isLoading, error } = useQuery({
    queryKey: ["my-trainer"],
    queryFn: getMyTrainer,
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        Carregando…
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 flex flex-col items-center text-center gap-3">
        <AlertCircle className="size-10 text-muted-foreground" />
        <h2 className="font-semibold">Sem personal vinculado</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Você ainda não tem um personal trainer associado. Peça pro
          administrador pra vincular um pra você.
        </p>
      </Card>
    );
  }

  if (!trainer) return null;

  const waLink = trainer.phone ? whatsAppLink(trainer.phone) : null;
  const mailLink = trainer.email ? `mailto:${trainer.email}` : null;

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6 flex flex-col items-center gap-4">
        <div className="size-20 rounded-full bg-accent flex items-center justify-center text-primary text-3xl font-bold">
          {(trainer.display_name || trainer.username).slice(0, 1).toUpperCase()}
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold">
            {trainer.display_name || trainer.username}
          </h1>
          <p className="text-sm text-muted-foreground">@{trainer.username}</p>
        </div>
      </Card>

      <Card className="p-4 flex flex-col gap-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Contato
        </div>
        <Row
          icon={<Mail className="size-4 text-primary" />}
          label="E-mail"
          value={trainer.email || "Não informado"}
        />
        <Row
          icon={<Phone className="size-4 text-primary" />}
          label="Telefone"
          value={trainer.phone || "Não informado"}
        />
      </Card>

      <div className="flex flex-col gap-2">
        {waLink ? (
          <a href={waLink} target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <MessageCircle className="size-4" />
              Abrir no WhatsApp
            </Button>
          </a>
        ) : (
          <Button size="lg" disabled className="w-full">
            <MessageCircle className="size-4" />
            WhatsApp indisponível
          </Button>
        )}
        {mailLink && (
          <a href={mailLink}>
            <Button size="lg" variant="outline" className="w-full">
              <Mail className="size-4" />
              Enviar e-mail
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

function whatsAppLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const msg = "Oi! Vim aqui pelo FichaGym.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
}

// Avoid "unused import" warning when no error UI is needed in some routes.
export { UserIcon };
