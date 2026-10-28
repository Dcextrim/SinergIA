import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { buildReveal, EXIT_SPEED } from "../animation/reveal";
import { fadeMask, img, members, type Member } from "../data/members";
import { Wave } from "./Wave";

gsap.registerPlugin(useGSAP);

type Props = {
  member: Member;
  sceneRef: React.RefObject<HTMLDivElement | null>;
  side: "left" | "right";
  onOpened: () => void;
  onClosed: () => void;
};

function DecryptFilter({ id, scale = 0 }: { id: string; scale?: number }) {
  return (
    <svg className="absolute h-0 w-0" aria-hidden>
      {/* sRGB: se ahorra la conversion a RGB lineal en cada cuadro; para ruido no se nota */}
      <filter id={id} colorInterpolationFilters="sRGB">
        {/* ruido horizontal tipo "senal": la persona se descifra cuando scale baja a 0 */}
        <feTurbulence type="fractalNoise" baseFrequency="0.002 0.35" numOctaves="1" seed="7" />
        <feDisplacementMap in="SourceGraphic" scale={scale} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}

// Precalienta en la GPU el filtro, la mascara y la ola del detalle: sin esto la primera apertura
// se trababa ~130 ms en el traspaso (las siguientes no). Casi invisible y se quita sola.
export function DetailWarmup() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setOn(false), 1500);
    return () => clearTimeout(t);
  }, []);
  if (!on) return null;
  const id = members[0].id;
  return (
    <div className="pointer-events-none fixed right-0 bottom-0 h-16 w-16 overflow-hidden opacity-[0.01]" aria-hidden>
      <DecryptFilter id="decrypt-warmup" scale={60} />
      <div className="h-full w-full will-change-transform" style={{ filter: "url(#decrypt-warmup)", ...fadeMask(id, 70, 98) }}>
        <img src={img(id, "sm")} alt="" className="h-full w-full object-contain" />
      </div>
      <Wave color="#502090" edge="top" />
    </div>
  );
}

export function MemberDetail({ member, sceneRef, side, onOpened, onClosed }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const closing = useRef(false);
  const filterId = `decrypt-${member.id}`;

  const person = () => sceneRef.current!.querySelector<HTMLElement>(`[data-member="${member.id}"]`)!;
  const personImg = person().querySelector("img");
  const aspect = personImg && personImg.naturalHeight ? personImg.naturalWidth / personImg.naturalHeight : 0.55;

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const scene = sceneRef.current!;
      const target = person();
      tl.current = buildReveal({
        scene,
        others: [...scene.querySelectorAll(".member")].filter((el) => el !== target),
        // la foto, no el boton: el boton tiene margen extra para el brillo y descuadraria el traspaso
        person: target.querySelector<HTMLElement>(".member-img") ?? target,
        clone: q(".clone")[0],
        cloneImg: q(".clone-img")[0],
        displace: q("feDisplacementMap")[0] as unknown as SVGFEDisplacementMapElement,
        backdrop: q(".backdrop")[0],
        card: q(".card")[0],
        ring: q(".ring")[0] as unknown as SVGPathElement,
        back: q(".back")[0],
        liquid: q(".liquid .wave"),
        glow: q(".glow")[0],
        letter: q(".letter")[0],
        lines: q(".line"),
        fromLeft: side === "left",
        reduce: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
      // foco en Regresar desde el inicio: Escape funciona aunque la apertura no haya terminado
      q<HTMLButtonElement>(".back")[0].focus({ preventScroll: true });
      tl.current.eventCallback("onComplete", onOpened);
      tl.current.eventCallback("onReverseComplete", () => {
        // la timeline revierte todo menos el traspaso: devolver la silueta y limpiar estilos en linea
        gsap.set([scene, ...scene.querySelectorAll(".member, .member-img")], { clearProps: "transform,opacity,filter" });
        onClosed();
      });
      // decodificar la foto grande antes de mover nada: decodificarla a media animacion la trababa
      q<HTMLImageElement>(".clone-img img")[0]
        .decode()
        .catch(() => {})
        .then(() => {
          if (!closing.current) tl.current?.play();
        });
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    },
    { scope: root },
  );

  const close = () => {
    if (closing.current || !tl.current) return;
    closing.current = true;
    // cerrado antes de arrancar (foto aun decodificandose): no hay nada que revertir
    if (tl.current.time() === 0) return onClosed();
    tl.current.timeScale(EXIT_SPEED).reverse();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") close();
    // unico control enfocable del dialogo: el foco no sale de aqui
    if (e.key === "Tab") {
      e.preventDefault();
      root.current?.querySelector<HTMLButtonElement>(".back")?.focus();
    }
  };

  const name = `${member.firstName} ${member.lastName}`;

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-name"
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-50 overflow-x-hidden overflow-y-auto"
    >
      <DecryptFilter id={filterId} />

      <div className="backdrop fixed inset-0 bg-ink opacity-0" onClick={close} aria-hidden />
      {/* ola liquida que entra desde el lado de la tarjeta; deja pasar los clics al fondo */}
      <div
        className="liquid pointer-events-none fixed inset-0 overflow-hidden"
        style={{ transform: side === "left" ? "scaleX(-1)" : undefined }}
        aria-hidden
      >
        <Wave color="#81c2d4" edge="top" />
        <Wave color="#502090" edge="top" />
        <Wave color="#070b16" edge="top" />
      </div>
      <div
        className="glow pointer-events-none fixed inset-0 bg-[radial-gradient(50%_60%_at_30%_55%,rgb(129_194_212/0.22),transparent_70%)] opacity-0"
        aria-hidden
      />

      <div
        className={`relative mx-auto flex min-h-full max-w-6xl flex-col items-center gap-6 px-4 py-6 md:items-center md:justify-center md:gap-[6%] md:px-8 ${
          side === "left" ? "md:flex-row" : "md:flex-row-reverse"
        }`}
      >
        <div className="relative h-[52vh] shrink-0 md:h-[84vh]" style={{ aspectRatio: aspect }}>
          <span
            className="letter pointer-events-none absolute inset-0 flex select-none items-center justify-center font-display text-[52vh] leading-none text-sky/20 md:text-[84vh]"
            aria-hidden
          >
            {member.firstName[0]}
          </span>
          <div
            className="clone absolute inset-0 opacity-0 will-change-transform"
            style={{ filter: `url(#${filterId})`, ...fadeMask(member.id, 70, 98) }}
          >
            <div className="clone-img h-full w-full">
              <img
                src={img(member.id, "lg")}
                alt={`Foto de ${name}`}
                className="h-full w-full object-contain"
                style={{ backgroundImage: `url(${img(member.id, "sm")})`, backgroundSize: "contain" }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className={`back absolute top-0 rounded-full border border-frost/30 bg-ink/70 px-4 py-2.5 text-sm font-medium text-frost opacity-0 backdrop-blur hover:border-rim hover:text-rim ${
              side === "left" ? "left-0" : "right-0"
            }`}
          >
            Regresar
          </button>
        </div>

        <article className="card w-full max-w-md rounded-[28px] bg-sky px-7 py-8 text-ink opacity-0 shadow-[0_30px_80px_-30px_rgb(61_224_255/0.45)] md:w-[38%] md:max-w-none md:px-10 md:py-12">
          <p className="font-hand text-5xl leading-none text-white" aria-hidden>Soy</p>
          {/* en la campana el nombre va en blanco; aqui en marino para que se lea (contraste 5:1 sobre el celeste) */}
          <h2 id="detail-name" className="mt-1 font-display text-6xl uppercase leading-[0.92] text-navy md:text-7xl">
            {[member.firstName, member.lastName].map((part) => (
              <span key={part} className="block overflow-hidden">
                <span className="line block">{part}</span>
              </span>
            ))}
          </h2>
          <div className="relative mt-6 inline-block px-6 py-3">
            <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden>
              <path
                className="ring"
                pathLength={1}
                strokeDasharray="1"
                // vuelta completa con un poco de sobrepaso arriba, como trazo de marcador; sirve para 1 o 2 lineas
                d="M30 8 C 80 0, 180 2, 196 22 C 206 44, 150 58, 96 57 C 40 56, 2 48, 4 28 C 6 12, 40 4, 70 5"
                fill="none"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <span
              className={`relative block text-balance font-hand font-bold leading-tight text-violet ${
                member.role.length > 18 ? "max-w-[15ch] text-2xl" : "text-3xl"
              }`}
            >
              {member.role}
            </span>
          </div>
          <p className="mt-6 text-base leading-relaxed text-ink/85">{member.bio}</p>
          <img src="/brand/logo.webp" alt="SinergIA UVG" className="mt-8 h-12 w-auto" />
        </article>
      </div>
    </div>
  );
}
