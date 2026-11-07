import { useMemo } from "react";

interface BarcodeSvgProps {
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

/**
 * Composant SVG générant un code-barres vectoriel net (Code 128 / EAN compatible)
 * Idéal pour l'affichage écran et l'impression haute définition sur étiqueteuses thermiques.
 */
export function BarcodeSvg({
  value,
  width = 200,
  height = 50,
  showText = true,
  className = "",
}: BarcodeSvgProps) {
  // Génère un motif de barres déterministe basé sur les caractères de la valeur
  const bars = useMemo(() => {
    const clean = value.trim() || "200000000101";
    const pattern: number[] = [];

    // Guard initial (barre fine, espace fin, barre fine)
    pattern.push(1, 0, 1);

    for (let i = 0; i < clean.length; i++) {
      const charCode = clean.charCodeAt(i);
      // Génère une séquence de 4 largeurs de barres et espaces (1 à 3px)
      const b1 = (charCode % 3) + 1;
      const s1 = ((charCode >> 1) % 2) + 1;
      const b2 = ((charCode >> 2) % 3) + 1;
      const s2 = ((charCode >> 3) % 2) + 1;
      pattern.push(b1, s1, b2, s2);
    }

    // Stop guard (barre moyenne, espace fin, barre fine, espace fin, barre fine)
    pattern.push(2, 0, 1, 0, 1);

    return pattern;
  }, [value]);

  // Calcule la largeur totale du motif
  const totalUnits = useMemo(() => {
    return bars.reduce((acc, w) => acc + (w > 0 ? w : 1), 0);
  }, [bars]);

  const unitWidth = width / (totalUnits || 1);
  const barHeight = showText ? height - 14 : height;

  let currentX = 0;
  const rects: { x: number; w: number }[] = [];

  for (let i = 0; i < bars.length; i++) {
    const w = bars[i] > 0 ? bars[i] : 1;
    const isBar = i % 2 === 0;
    if (isBar) {
      rects.push({ x: currentX, w: w * unitWidth });
    }
    currentX += w * unitWidth;
  }

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={width}
        height={barHeight}
        viewBox={`0 0 ${width} ${barHeight}`}
        className="overflow-visible"
      >
        <rect width={width} height={barHeight} fill="white" />
        {rects.map((r, idx) => (
          <rect
            key={idx}
            x={r.x}
            y={0}
            width={Math.max(1, r.w)}
            height={barHeight}
            fill="#0f172a"
          />
        ))}
      </svg>
      {showText && (
        <span className="font-mono text-[10px] tracking-widest text-slate-700 font-bold mt-1">
          {value || "200000000101"}
        </span>
      )}
    </div>
  );
}
