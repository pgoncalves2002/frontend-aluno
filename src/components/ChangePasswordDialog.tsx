import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";
import { changePassword } from "@/api/auth";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/**
 * Modal de troca de senha — auto-serviço pro trainer.
 * O JWT continua válido depois da troca (a senha não está no token), então
 * a sessão atual NÃO é deslogada. UX: feedback de sucesso + fecha o modal.
 */
export default function ChangePasswordDialog({ open, onOpenChange }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setLocalError(null);
    mutation.reset();
  }

  function handleOpenChange(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  const mutation = useMutation({
    mutationFn: () =>
      changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    onSuccess: () => {
      // Pequeno delay pra usuário ver o estado "Trocando..." → "Sucesso"
      setTimeout(() => {
        reset();
        onOpenChange(false);
      }, 800);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (newPassword.length < 8) {
      setLocalError("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError("Confirmação não bate com a nova senha.");
      return;
    }
    mutation.mutate();
  }

  // Extrai mensagem de erro do backend (DRF retorna {"field": ["msg"]} ou
  // {"detail": "msg"}). Pega a primeira mensagem útil pra mostrar.
  const backendError = (() => {
    const err = mutation.error;
    if (!err) return null;
    if (err instanceof AxiosError && err.response?.data) {
      const data = err.response.data as Record<string, unknown>;
      const firstField = Object.values(data)[0];
      if (Array.isArray(firstField) && firstField.length > 0) {
        return String(firstField[0]);
      }
      if (typeof firstField === "string") return firstField;
    }
    return err instanceof Error ? err.message : "Erro inesperado.";
  })();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4" />
            Alterar senha
          </DialogTitle>
          <DialogDescription>
            Você continuará logado nesta sessão depois de trocar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <PasswordField
            id="cp-current"
            label="Senha atual"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggleShow={() => setShowCurrent((v) => !v)}
            autoComplete="current-password"
          />
          <PasswordField
            id="cp-new"
            label="Nova senha"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggleShow={() => setShowNew((v) => !v)}
            autoComplete="new-password"
            helper="Mínimo 8 caracteres."
          />
          <PasswordField
            id="cp-confirm"
            label="Confirme a nova senha"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            onToggleShow={() => setShowConfirm((v) => !v)}
            autoComplete="new-password"
          />

          {(localError || backendError) && (
            <div className="text-sm text-destructive">
              {localError ?? backendError}
            </div>
          )}

          {mutation.isSuccess && (
            <div className="text-sm text-green-600">
              ✓ Senha alterada com sucesso.
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                mutation.isPending ||
                mutation.isSuccess ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              {mutation.isPending ? "Salvando…" : "Salvar nova senha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  autoComplete?: string;
  helper?: string;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  autoComplete,
  helper,
}: FieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="pr-10"
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {helper && (
        <div className="text-xs text-muted-foreground">{helper}</div>
      )}
    </div>
  );
}
