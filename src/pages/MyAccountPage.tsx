/**
 * Página "Minha conta" — aluno edita os próprios dados (email, telefone,
 * nome de exibição, data de nascimento). Backed by GET/PATCH /api/auth/me/.
 *
 * Senha tem fluxo separado (ChangePasswordDialog no Header).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Mail, Phone, Save, UserCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMe, updateMe } from "@/api/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default function MyAccountPage() {
  const qc = useQueryClient();
  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [savedRecently, setSavedRecently] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (me) {
      setDisplayName(me.display_name ?? "");
      setEmail(me.email ?? "");
      setPhone(me.phone ?? "");
      setBirthDate(me.birth_date ?? "");
    }
  }, [me]);

  const mutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (data) => {
      qc.setQueryData(["me"], data);
      setSavedRecently(true);
      setError(null);
      setTimeout(() => setSavedRecently(false), 2500);
    },
    onError: (err: unknown) => {
      setError(extractValidationError(err));
    },
  });

  function save() {
    setError(null);
    mutation.mutate({
      display_name: displayName,
      email: email || undefined,
      phone: phone || undefined,
      birth_date: birthDate || null,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground self-start"
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Link>

      <div className="flex items-center gap-3">
        <div className="size-12 rounded-full bg-accent flex items-center justify-center text-primary">
          <UserCircle2 className="size-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Minha conta</h1>
          <p className="text-sm text-muted-foreground">
            Email e telefone aparecem pro seu personal.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="text-muted-foreground">Carregando…</div>
      )}

      {me && (
        <Card className="p-5 flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="me-username">Nome de usuário</Label>
            <Input
              id="me-username"
              value={me.username}
              disabled
              className="bg-muted/40"
            />
            <p className="text-[11px] text-muted-foreground">
              Identidade do login — não pode ser alterada.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="me-displayname">Nome de exibição</Label>
            <Input
              id="me-displayname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Como você quer aparecer pro personal"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="me-email" className="inline-flex items-center gap-1.5">
              <Mail className="size-3.5" />
              E-mail
            </Label>
            <Input
              id="me-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoCapitalize="off"
              autoComplete="email"
            />
            <p className="text-[11px] text-muted-foreground">
              Você pode fazer login pelo e-mail (além do usuário).
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="me-phone" className="inline-flex items-center gap-1.5">
              <Phone className="size-3.5" />
              Telefone (WhatsApp)
            </Label>
            <Input
              id="me-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+55 11 91234-5678"
              autoComplete="tel"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="me-birthdate">Data de nascimento</Label>
            <Input
              id="me-birthdate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive whitespace-pre-line">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={save} disabled={mutation.isPending}>
              <Save className="size-4" />
              {mutation.isPending ? "Salvando…" : "Salvar"}
            </Button>
            {savedRecently && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                <CheckCircle2 className="size-4" />
                Salvo
              </span>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function extractValidationError(err: unknown): string {
  if (typeof err === "object" && err && "response" in err) {
    const data = (err as { response?: { data?: Record<string, unknown> } }).response
      ?.data;
    if (data && typeof data === "object") {
      const messages: string[] = [];
      for (const [k, v] of Object.entries(data)) {
        if (Array.isArray(v))
          messages.push(`${k}: ${(v as string[]).join(", ")}`);
        else messages.push(`${k}: ${String(v)}`);
      }
      if (messages.length) return messages.join("\n");
    }
  }
  return "Não consegui salvar. Tenta de novo.";
}
