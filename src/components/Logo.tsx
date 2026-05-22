/**
 * Logo da marca FichaGym — 3 barras (Ignite + Slate).
 *
 * Aponta pros SVGs em `public/`. Duas variantes:
 *   - `mark`        — só o símbolo (3 barras dentro do quadrado Graphite).
 *   - `horizontal`  — símbolo + wordmark "FichaGym".
 *
 * O SVG `logo-mark-dark.svg` tem fundo escuro embutido; o `logo-horizontal.svg`
 * usa wordmark escuro (pra fundo claro). Pra fundo escuro, usamos
 * `logo-horizontal-dark.svg`. Pra simplificar, deixamos um `theme="auto"`
 * que usa <picture> + media query.
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
  // Horizontal: escolhe SVG conforme prefers-color-scheme via <picture>.
  // Tailwind class `dark:` controla via container; usar <picture> garante
  // que mesmo sem dark class no html, o sistema do device é respeitado.
  return (
    <picture className={className}>
      <source
        srcSet="/logo-horizontal-dark.svg"
        media="(prefers-color-scheme: dark)"
      />
      <img
        src="/logo-horizontal.svg"
        alt={alt}
        height={height ?? 32}
        style={{ height: (height ?? 32) + "px", width: "auto" }}
      />
    </picture>
  );
}
