import gsap from "gsap";

// Personalidad "Premium" (skill motion-design): sin rebote, una curva firma, entrada mas larga que la salida.
export const EASE = "power2.inOut"; // ~ cubic-bezier(0.4, 0, 0.2, 1)
export const ZOOM = 1.12;
export const EXIT_SPEED = 1.8; // el regreso es la misma linea de tiempo al reves: ~0.9 s
// Duracion total de la apertura: ~1.8 s (camara 0.45 + persona y ola ~1 + tarjeta, nombre y ovalo)

type Rect = { left: number; top: number; width: number; height: number };

export type RevealParts = {
  scene: HTMLElement; // contenedor "camara"
  others: Element[]; // resto de integrantes
  person: HTMLElement; // la silueta elegida dentro de la escena
  clone: HTMLElement; // la persona en el detalle (position: fixed en su lugar final)
  cloneImg: HTMLElement;
  displace: SVGFEDisplacementMapElement; // filtro "descifrado"
  backdrop: HTMLElement;
  card: HTMLElement;
  ring: SVGPathElement; // ovalo a mano alrededor del cargo, como en la campana
  back: HTMLElement;
  liquid: Element[]; // olas (components/Wave) que cubren la pantalla, de atras hacia adelante
  glow: HTMLElement;
  letter: HTMLElement; // inicial gigante detras de la persona
  lines: Element[]; // lineas del nombre que suben desde su mascara
  fromLeft: boolean; // lado donde queda la persona
  reduce: boolean;
};

const center = (r: Rect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

export function buildReveal(p: RevealParts) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: EASE } });
  const cardFrom = { opacity: 0, x: p.fromLeft ? 40 : -40 };

  if (p.reduce) {
    // Movimiento reducido: solo fundidos cortos, sin camara ni desplazamiento
    tl.set(p.displace, { attr: { scale: 0 } })
      .set(p.ring, { strokeDashoffset: 0 })
      .set(p.liquid, { yPercent: 0 })
      .set(p.glow, { opacity: 1 })
      .fromTo(p.backdrop, { opacity: 0 }, { opacity: 1, duration: 0.2 })
      .fromTo(p.clone, { opacity: 0 }, { opacity: 1, duration: 0.2 }, "<")
      .fromTo(p.card, { opacity: 0 }, { opacity: 1, duration: 0.2 })
      .fromTo(p.back, { opacity: 0 }, { opacity: 1, duration: 0.15 }, "<");
    return tl;
  }

  const sceneBox = p.scene.getBoundingClientRect();
  const from = p.person.getBoundingClientRect();
  const to = p.clone.getBoundingClientRect();
  const c = center(from);

  // 1) Camara: acercamiento centrado en la persona, asi su centro no se mueve y el traspaso al clon es exacto
  gsap.set(p.scene, { transformOrigin: `${c.x - sceneBox.left}px ${c.y - sceneBox.top}px` });
  const zoomed = { width: from.width * ZOOM, height: from.height * ZOOM };
  const t = center(to);

  tl.to(p.scene, { scale: ZOOM, duration: 0.45 })
    // solo opacidad: un blur animado sobre 9 siluetas con brillo trababa el traspaso, y la ola las tapa enseguida
    .to(p.others, { opacity: 0.12, duration: 0.45 }, "<")
    .fromTo(p.backdrop, { opacity: 0 }, { opacity: 0.6, duration: 0.45 }, "<")
    // 2) Traspaso: el clon aparece exactamente sobre la silueta ampliada
    .set(p.person, { opacity: 0 })
    .set(p.clone, { opacity: 1 }, "<")
    .addLabel("handoff", "<");

  // Ola liquida detras del clon (celeste, violeta, tinta); el sesgo que se endereza la hace sentir liquida.
  // Solo transform: antes se redibujaba la forma en cada cuadro y la persona se trababa.
  tl.fromTo(
    p.liquid,
    { yPercent: 100, skewY: 7 },
    { yPercent: 0, skewY: 0, duration: 0.8, stagger: 0.12, ease: "power3.inOut" },
    "handoff",
  )
    .fromTo(p.glow, { opacity: 0 }, { opacity: 1, duration: 0.4 }, "handoff+=0.7")
    // inicial gigante: nace como barra delgada y se abre hacia arriba y abajo
    .fromTo(
      p.letter,
      { clipPath: "inset(49% 0% 49% 0%)", scale: 1.15, opacity: 0 },
      { clipPath: "inset(0% 0% 0% 0%)", scale: 1, opacity: 1, duration: 0.6, ease: "power3.inOut" },
      "handoff+=0.65",
    )
    // 3) La persona se acomoda a un lado y se "descifra" (capa primaria)
    .fromTo(
      p.clone,
      { x: c.x - t.x, y: c.y - t.y, scale: zoomed.height / to.height },
      { x: 0, y: 0, scale: 1, duration: 0.6 },
      "handoff",
    )
    .fromTo(
      p.cloneImg,
      { filter: "brightness(0.05) saturate(0.2)" },
      { filter: "brightness(1) saturate(1)", duration: 0.55, ease: "power1.out" },
      "<0.05",
    )
    .fromTo(p.displace, { attr: { scale: 60 } }, { attr: { scale: 0 }, duration: 0.6, ease: "power2.out" }, "<")
    // ya descifrada: quitar el filtro SVG, que el navegador recalcula en la CPU en cada repintado
    .set(p.clone, { filter: "none" })
    // 4) Tarjeta desde el lado contrario y boton de regreso
    .fromTo(p.card, cardFrom, { opacity: 1, x: 0, duration: 0.32, ease: "power2.out" }, "handoff+=0.8")
    // el nombre sube linea por linea desde su mascara
    .fromTo(p.lines, { yPercent: 105 }, { yPercent: 0, duration: 0.45, stagger: 0.08, ease: "power3.out" }, "<0.05")
    // capa secundaria: el ovalo se dibuja como trazo de marcador
    .fromTo(p.ring, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, ease: "power1.inOut" }, "<0.15")
    .fromTo(p.back, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }, "<0.1");

  return tl;
}
