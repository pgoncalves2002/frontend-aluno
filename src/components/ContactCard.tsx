import { Mail, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Cartão de contato compartilhado pelo perfil do aluno (na visão do trainer)
 * e pela página "Minha conta" do trainer. Mostra email + telefone com botões
 * de ação: abrir WhatsApp e mailto.
 *
 * Se telefone/email não estiverem preenchidos (usuários antigos), o botão
 * correspondente vira "não informado" — UI nunca quebra.
 */
export default function ContactCard({
  email,
  phone,
  contextLabel,
}: {
  email: string | null;
  phone: string;
  /** Ex.: "do aluno", "do personal" — entra na mensagem inicial do WhatsApp. */
  contextLabel?: string;
}) {
  const waLink = phone ? whatsAppLink(phone, contextLabel) : null;
  const mailLink = email ? `mailto:${email}` : null;

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
        Contato
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ContactRow
          icon={<Mail className="size-4" />}
          label="E-mail"
          value={email || "Não informado"}
        />
        <ContactRow
          icon={<Phone className="size-4" />}
          label="Telefone"
          value={phone || "Não informado"}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Button
              variant="outline"
              size="sm"
              className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 border-emerald-500/30"
            >
              <MessageCircle className="size-4" />
              Abrir WhatsApp
            </Button>
          </a>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <MessageCircle className="size-4" />
            WhatsApp indisponível
          </Button>
        )}
        {mailLink && (
          <a href={mailLink} className="inline-block">
            <Button variant="outline" size="sm">
              <Mail className="size-4" />
              Enviar e-mail
            </Button>
          </a>
        )}
      </div>
    </Card>
  );
}

function ContactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="truncate font-medium">{value}</div>
      </div>
    </div>
  );
}

/**
 * Monta uma URL `https://wa.me/<numero>` com mensagem opcional.
 * - Remove tudo que não é dígito do `phone` (lida com "+55 11 91234-5678").
 * - Se a mensagem `contextLabel` for fornecida, anexa via `?text=Oi…`.
 *
 * Por que `wa.me` e não `whatsapp://`? wa.me funciona universal (web/iOS/
 * Android) e o iOS/Android com WhatsApp instalado já abre o app nativo.
 */
function whatsAppLink(phone: string, contextLabel?: string): string {
  const digits = phone.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  if (!contextLabel) return base;
  const msg = `Oi! Vim aqui pelo FichaGym (${contextLabel}).`;
  return `${base}?text=${encodeURIComponent(msg)}`;
}
