import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState } from "react";
import { Wave } from "./Wave";

const SEEN_KEY = "sinergia-intro-seen";

// Intro de carga: Byte en pixel art y el logo sobre tinta; luego las olas de marca se van hacia arriba
// y descubren la escena. Una vez por pestana, para no repetirla en cada recarga.
export function Intro() {
  const [show] = useState(() => {
    try {
      return !sessionStorage.getItem(SEEN_KEY);
    } catch {
      return true;
    }
  });
  const [done, setDone] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!show) return;
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* sin almacenamiento: se vuelve a ver al recargar */
      }
      const q = gsap.utils.selector(root);
      const tl = gsap.timeline({ onComplete: () => setDone(true) });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        tl.from(q(".intro-content"), { opacity: 0, duration: 0.3 }).to(root.current, { opacity: 0, duration: 0.3 }, "+=0.7");
        return;
      }

      // pasos (steps) en lo de Byte y la barra: movimiento "por cuadros", como el pixel art
      tl.from(q(".byte"), { yPercent: 35, opacity: 0, duration: 0.5, ease: "steps(5)" })
        .to(q(".byte"), { y: -6, duration: 0.25, ease: "steps(1)", repeat: 3, yoyo: true })
        .from(q(".logo"), { y: 16, opacity: 0, duration: 0.45, ease: "power2.out" }, 0.35)
        .fromTo(q(".bar"), { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "steps(8)" }, 0.35)
        .to(q(".intro-content"), { y: -24, opacity: 0, duration: 0.3, ease: "power2.in" }, "+=0.1")
        // la de adelante (tinta) se va primero y descubre las de marca, que la siguen
        .to(q(".wave"), { yPercent: -100, skewY: -6, duration: 0.85, stagger: { each: 0.1, from: "end" }, ease: "power3.inOut" }, "-=0.1");
    },
    { scope: root },
  );

  if (!show || done) return null;

  return (
    <div ref={root} className="fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      <Wave color="#81c2d4" edge="bottom" />
      <Wave color="#502090" edge="bottom" />
      <Wave color="#0a4078" edge="bottom" />
      <Wave color="#070b16" edge="bottom" />
      <div className="intro-content absolute inset-0 flex flex-col items-center justify-center gap-6 px-6">
        <img src="/brand/byte.webp" alt="" className="byte w-40 sm:w-64" style={{ imageRendering: "pixelated" }} />
        <img src="/brand/logo.webp" alt="" className="logo w-56 sm:w-80" />
        <div className="h-2 w-48 bg-frost/10 sm:w-60">
          <div className="bar h-full origin-left bg-sky" />
        </div>
      </div>
    </div>
  );
}
