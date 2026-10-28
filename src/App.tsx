import { useEffect, useRef, useState } from "react";
import { Intro } from "./components/Intro";
import { DetailWarmup, MemberDetail } from "./components/MemberDetail";
import { MembersScene } from "./components/MembersScene";
import { fullName, members } from "./data/members";

const STORAGE_KEY = "sinergia-unlocked-members";

function loadUnlocked(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(loadUnlocked);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...unlocked]));
    } catch {
      /* sin almacenamiento (modo privado): el progreso solo dura esta vista */
    }
  }, [unlocked]);

  const select = (id: string) => {
    if (isTransitioning || selectedId) return;
    // desde la lista de abajo: traer la escena a la vista para que la camara arranque donde esta la persona
    sceneRef.current?.scrollIntoView({ block: "center" });
    setIsTransitioning(true);
    setSelectedId(id);
  };

  const closed = () => {
    const id = selectedId!;
    setUnlocked((prev) => new Set(prev).add(id));
    setSelectedId(null);
    setIsTransitioning(false);
    // devolver el foco a la persona en la escena
    requestAnimationFrame(() => sceneRef.current?.querySelector<HTMLElement>(`[data-member="${id}"]`)?.focus());
  };

  const selected = members.find((m) => m.id === selectedId);
  const index = members.findIndex((m) => m.id === selectedId);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-8">
      <Intro />
      <DetailWarmup />
      <header className="flex flex-col items-center pt-10 text-center sm:pt-14">
        <img src="/brand/logo.webp" alt="" className="h-14 w-auto sm:h-16" />
        <h1 className="mt-5 font-display text-7xl leading-none tracking-wide sm:text-8xl">SinergIA</h1>
        <p className="mt-2 font-hand text-4xl text-sky">Conoce a los miembros</p>
      </header>

      <section aria-label="Escena de miembros" className="mt-8">
        <MembersScene sceneRef={sceneRef} unlocked={unlocked} selectedId={selectedId} onSelect={select} />

        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="flex gap-1.5" aria-hidden>
            {members.map((m) => (
              <span key={m.id} className={`h-1.5 w-5 rounded-full ${unlocked.has(m.id) ? "bg-amber" : "bg-frost/15"}`} />
            ))}
          </div>
          <p className="text-sm text-frost/70" aria-live="polite">
            <span className="font-semibold text-amber">{unlocked.size}</span> / {members.length} desbloqueados
          </p>
          <p className="text-sm text-frost/50">Toca una silueta para descubrir quién es.</p>
        </div>
      </section>


      <section className="mt-24 grid gap-6 md:grid-cols-2">
        <article className="rounded-3xl bg-night p-8 ring-1 ring-frost/10 md:p-10">
          <h2 className="font-display text-5xl uppercase text-sky">Misión</h2>
          <p className="mt-4 text-lg leading-relaxed text-frost/85">
            Representar a los estudiantes con compromiso, innovación y responsabilidad, gestionando oportunidades que
            fortalezcan su formación integral dentro y fuera de la U.
          </p>
        </article>
        <article className="rounded-3xl bg-night p-8 ring-1 ring-frost/10 md:p-10">
          <h2 className="font-display text-5xl uppercase text-sky">Visión</h2>
          <p className="mt-4 text-lg leading-relaxed text-frost/85">
            Ser una asociación reconocida por su liderazgo, impacto positivo y aporte al crecimiento profesional de los
            estudiantes de compu, construir una comunidad estudiantil sólida, proactiva y tecnológicamente actualizada
            que deje huella.
          </p>
        </article>
      </section>

      <section className="mt-24" aria-labelledby="lista">
        <h2 id="lista" className="font-display text-4xl uppercase">La junta</h2>
        <ul className="mt-6 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-4 border-b border-frost/10 py-4">
              <div>
                <p className="font-medium">
                  {fullName(m)}
                </p>
                <p className="text-sm text-frost/60">{m.role}</p>
              </div>
              <button
                type="button"
                onClick={() => select(m.id)}
                aria-label={`Ver perfil de ${fullName(m)}`}
                className="min-h-11 shrink-0 rounded-full border border-sky/40 px-4 text-sm text-sky hover:border-sky hover:bg-sky/10"
              >
                Ver perfil
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selected && (
        <MemberDetail
          key={selected.id}
          member={selected}
          sceneRef={sceneRef}
          side={index % 2 === 0 ? "left" : "right"}
          onOpened={() => setIsTransitioning(false)}
          onClosed={closed}
        />
      )}
    </main>
  );
}
