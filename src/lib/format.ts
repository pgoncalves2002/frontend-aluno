/** "60 kg", "22.5 kg", "—". Espelha o `loadDisplay` do iOS/Android. */
export function formatLoad(load: number | null | undefined): string {
  if (load == null) return "—";
  const isInt = load % 1 === 0;
  return isInt ? `${load} kg` : `${load.toFixed(1)} kg`;
}

/** "30s", "1min", "1min30s", "2min". */
export function formatRest(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}min` : `${m}min${s.toString().padStart(2, "0")}s`;
}

/**
 * Texto curto da validade pra UI do aluno. Retorna `null` se a ficha
 * não tem janela (default = sem limite — não polui o card; ausência
 * de label JÁ comunica que vale pra sempre).
 *
 * Casos cobertos:
 *   - Só validUntil: "Até 18/05/26"  (caso comum)
 *   - Só validFrom:  "A partir de 01/06/26"
 *   - Ambos:         "Até 18/05/26"  (foca no fim; pro aluno o que
 *                     importa é o prazo final)
 *
 * Parseia "yyyy-MM-dd" sem usar Date (que aplica fuso e pode shiftar
 * o dia) — split + reformat puro.
 */
export function validityLabel(
  validFrom: string | null,
  validUntil: string | null,
): string | null {
  function reformat(iso: string): string | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return null;
    return `${m[3]}/${m[2]}/${m[1].slice(2)}`;
  }
  if (validUntil) {
    const d = reformat(validUntil);
    if (d) return `Até ${d}`;
  }
  if (validFrom) {
    const d = reformat(validFrom);
    if (d) return `A partir de ${d}`;
  }
  return null;
}

/** Próximo nome de ficha sugerido — Treino A, B, C... */
export function suggestNextWorkoutName(existingNames: string[]): string {
  const existing = new Set(
    existingNames
      .map((n) => n.match(/^Treino\s+([A-Z])$/i)?.[1]?.toUpperCase())
      .filter((x): x is string => Boolean(x)),
  );
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i);
    if (!existing.has(letter)) return `Treino ${letter}`;
  }
  return `Treino ${existingNames.length + 1}`;
}
