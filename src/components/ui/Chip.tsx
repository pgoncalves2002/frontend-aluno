import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

/**
 * Botão pílula/chip — usado nos pickers (grupo muscular, reps, descanso, dia
 * da semana). Estado `selected` muda visual pra ativo.
 */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      {...props}
    />
  ),
);
Chip.displayName = "Chip";
