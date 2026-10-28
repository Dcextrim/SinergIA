import { useState, useSyncExternalStore } from "react";
import { fadeMask, img, members, meta, type Member } from "../data/members";

type Props = {
  sceneRef: React.RefObject<HTMLDivElement | null>;
  unlocked: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const PAD = "1rem";

const preload = (id: string) => {
  new Image().src = img(id, "lg");
};

function MemberButton({ m, state, onSelect }: { m: Member; state: string; onSelect: (id: string) => void }) {
  const [broken, setBroken] = useState(false);
  const name = `${m.firstName} ${m.lastName}`;
  return (
    <button
      type="button"
      data-member={m.id}
      data-state={state}
      aria-label={`Abrir perfil de ${name}, ${m.role}`}
      onClick={() => onSelect(m.id)}
      onPointerEnter={() => preload(m.id)}
      onFocus={() => preload(m.id)}
      // El boton es PAD mas grande que la foto por cada lado (margen negativo compensa) para que el brillo
      // quepa dentro de la mascara. La presidenta va al frente de su fila; hover/foco sube dentro de su fila.
      style={{
        height: `calc(${meta[m.id].h * 100}% + 2 * ${PAD})`,
        padding: PAD,
        margin: `-${PAD} calc(-1.2% - ${PAD}) 0`,
        zIndex: m.role === "Presidenta" ? 2 : undefined,
        ...fadeMask(m.id, 68, 97, PAD),
      }}
      className="member relative shrink-0 cursor-pointer"
    >
      {broken ? (
        <span className="pointer-events-auto flex h-full w-24 items-end justify-center pb-6 font-display text-sm text-frost/60">{name}</span>
      ) : (
        // solo la foto recibe clics, no el margen del boton
        <img
          className="member-img pointer-events-auto h-full w-auto select-none"
          src={img(m.id, "sm")}
          alt=""
          draggable={false}
          onError={() => setBroken(true)}
        />
      )}
    </button>
  );
}

// Filas de la escena: [cuantas personas, top %, alto %, separacion %], en el orden de `members`.
// Piramide: vocales al fondo, secretario y tesorero abiertos a los lados (separacion) para que se les
// vea la cara detras de presidenta y vicepresidenta, que van al frente.
const LAYOUTS = {
  desktop: { aspect: "16 / 9", rows: [[6, 0, 55, 0], [2, 20, 60, 20], [2, 38, 62, 0]] },
  mobile: { aspect: "1 / 1.25", rows: [[3, 0, 32, 0], [3, 16, 34, 0], [2, 34, 36, 28], [2, 54, 46, 0]] },
} as const;

const mobileQuery = window.matchMedia("(max-width: 639px)");
const subscribe = (cb: () => void) => {
  mobileQuery.addEventListener("change", cb);
  return () => mobileQuery.removeEventListener("change", cb);
};

export function MembersScene({ sceneRef, unlocked, selectedId, onSelect }: Props) {
  const isMobile = useSyncExternalStore(subscribe, () => mobileQuery.matches);
  const layout = LAYOUTS[isMobile ? "mobile" : "desktop"];
  const stateOf = (id: string) => (id === selectedId ? "selected" : unlocked.has(id) ? "unlocked" : "locked");

  let start = 0;
  const rows = layout.rows.map(([count, top, height, gap], i) => {
    const slice = members.slice(start, (start += count));
    return (
      // Cada fila es su propia capa (isolate + z por orden): nadie de atras pasa delante de la fila de adelante.
      // La fila no recibe clics (solo las fotos), si no tapa a la fila de atras.
      <div
        key={start}
        className="pointer-events-none absolute inset-x-0 isolate flex items-start justify-center"
        style={{ top: `${top}%`, height: `${height}%`, columnGap: `${gap}%`, zIndex: i + 1 }}
      >
        {slice.map((m) => (
          <MemberButton key={m.id} m={m} state={stateOf(m.id)} onSelect={onSelect} />
        ))}
      </div>
    );
  });

  return (
    <div className="-mx-2 sm:mx-0">
      <div ref={sceneRef} className="relative mx-auto max-w-6xl will-change-transform" style={{ aspectRatio: layout.aspect }}>
        {/* recorte: la deriva escala la luz y sin esto ensancha la pagina en celular */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="ambient absolute inset-0" />
        </div>
        {rows}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[14%] bg-gradient-to-t from-ink to-transparent"
          aria-hidden
        />
      </div>
    </div>
  );
}
