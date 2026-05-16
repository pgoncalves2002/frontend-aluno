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
