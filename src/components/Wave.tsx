// Panel con borde ondulado, 125% del alto de su contenedor. Se anima solo con transform (yPercent),
// asi el navegador lo mueve en la GPU sin redibujar la pantalla en cada cuadro.
// Solo la orilla (el 20% del panel) es SVG; el resto es un bloque de color, que la GPU pinta casi gratis.
// edge="top": la ola va arriba; entra desde abajo (yPercent 100 -> 0) y en reposo cubre todo.
// edge="bottom": la ola va abajo; sale hacia arriba (yPercent 0 -> -100).
const EDGE = "M0 12 C 15 -6, 30 30, 50 14 C 68 0, 82 28, 100 10 V25 H0 Z";

export function Wave({ color, edge }: { color: string; edge: "top" | "bottom" }) {
  return (
    <div
      className={`wave pointer-events-none absolute inset-x-0 flex h-[125%] will-change-transform ${
        edge === "top" ? "-top-[25%] flex-col" : "top-0 flex-col-reverse"
      }`}
      aria-hidden
    >
      <svg
        className="block h-1/5 w-full shrink-0"
        style={{ transform: edge === "bottom" ? "scaleY(-1)" : undefined }}
        viewBox="0 0 100 25"
        preserveAspectRatio="none"
      >
        <path d={EDGE} fill={color} />
      </svg>
      {/* -1px: sin rendija entre la orilla y el bloque al escalar */}
      <div className="-my-px flex-1" style={{ background: color }} />
    </div>
  );
}
