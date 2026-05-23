/**
 * Logo da marca FichaGym — 3 barras (Ignite + Slate).
 *
 * Aponta pros SVGs em `public/`. Duas variantes:
 *   - `mark`        — só o símbolo (3 barras dentro do quadrado Graphite).
 *   - `horizontal`  — símbolo + wordmark "FichaGym".
 *
 * Pra escolher light/dark, **usamos Tailwind classes** (`dark:hidden` /
 * `hidden dark:block`) em vez de `<picture media=prefers-color-scheme>` —
 * o `<picture>` olhava o tema do SISTEMA OPERACIONAL, não do app, então
 * mesmo num app em light mode com o macOS em dark, ele carregava o SVG
 * `-dark` (que tem "Ficha" em branco) e a parte preta sumia no fundo
 * branco. Tailwind respeita o tema real da SPA.
 */
type Variant = "mark" | "horizontal";

interface LogoProps {
  variant?: Variant;
  className?: string;
  /** Altura em px (mantém aspect ratio). Default por variante. */
  height?: number;
  /** Texto alternativo. Default "FichaGym". */
  alt?: string;
}

export function Logo({
  variant = "horizontal",
  className,
  height,
  alt = "FichaGym",
}: LogoProps) {
  if (variant === "mark") {
    // O `mark-dark` tem o tile Graphite escuro com barras Ignite —
    // funciona OK em fundo claro (alto contraste). Sem variante light
    // por enquanto.
    return (
      <img
        src="/logo-mark-dark.svg"
        alt={alt}
        height={height ?? 64}
        style={{ height: (height ?? 64) + "px", width: "auto" }}
        className={className}
      />
    );
  }

  const h = height ?? 32;
  const baseStyle = { height: h + "px", width: "auto" };

  return (
    <>
      {/* light mode: "Ficha" em Ink, "Gym" em Ignite */}
      <img
        src="/logo-horizontal.svg"
        alt={alt}
        height={h}
        style={baseStyle}
        className={"block dark:hidden " + (className ?? "")}
      />
      {/* dark mode: "Ficha" em branco, "Gym" em Ignite */}
      <img
        src="/logo-horizontal-dark.svg"
        alt={alt}
        height={h}
        style={baseStyle}
        className={"hidden dark:block " + (className ?? "")}
        aria-hidden="true"
      />
    </>
  );
}
