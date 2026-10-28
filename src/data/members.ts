import memberMeta from "./member-meta.json";

export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  bio: string; // adaptada de su publicacion de campana en Instagram (Bios/descripciones.md)
  hit?: string; // zona de clic mas chica que la foto (CSS inset): lo demas deja pasar el clic a quien esta atras
};

// Orden de la escena, de atras hacia adelante: los 6 vocales, Byte (la mascota, en el hueco del medio),
// luego secretario y tesorero, y al frente presidenta y vicepresidenta. Las filas se definen en LAYOUTS (components/MembersScene.tsx).
// Fotos: public/members/<id>-sm.webp (escena) y <id>-lg.webp (detalle), generadas con tools/prepare_assets.py
export const members: Member[] = [
  {
    id: "nathalia-escobar", firstName: "Nathalia", lastName: "Escobar", role: "Vocal de Gestión",
    bio: "Estoy en primer año y me gustan la matemática, la lógica y la organización, pero también el arte y la música. Desde Gestión quiero organizar actividades que nos acerquen y muestren el talento que hay en compu, siempre de forma organizada, puntual y transparente.",
  },
  {
    id: "fabian", firstName: "Fabian", lastName: "Morales", role: "Vocal de Comunidad",
    bio: "Estoy en cuarto año y desde pequeño me han encantado los videojuegos y la tecnología, y eso me trajo a esta carrera. Quiero compartir esa pasión con toda la comunidad UVG, convivir con ustedes y animarlos a sacar todo su potencial.",
  },
  {
    id: "nathalia-caceres", firstName: "Nathalia", lastName: "Cáceres", role: "Vocal de Comunicación",
    bio: "Me encanta involucrarme en las actividades y soy del team sí a todo. Creo que comunicar las cosas de forma clara y bonita es clave en cualquier área, y mi trabajo es que cada actividad y anuncio les llegue a todos de manera clara.",
  },
  {
    id: "natalia-roches", firstName: "Natalia", lastName: "Roches", role: "Vocal de Desarrollo e Innovación",
    bio: "Desde que entré a la U me interesa cómo la computación se aplica a todas las ramas de la vida; también me encanta pintar, dibujar, la naturaleza y la psicología. Quiero ayudar a que quienes estudian Computación vean que la carrera puede expandirse a cualquier campo que deseen.",
  },
  {
    id: "daniel", firstName: "Daniel", lastName: "Chet", role: "Vocal de Identidad y Competencia",
    bio: "Todos me dicen Chet. Estoy en cuarto año, he sido auxiliar en varios cursos y me apasiona la ciberseguridad: he competido en CTFs y hackathons. Quiero que más estudiantes se animen a competir, acompañarlos en la preparación y llevar juntos el nombre de la UVG a más lugares.",
  },
  {
    id: "sebastian", firstName: "Sebastián", lastName: "Túnchez", role: "Vocal Académico",
    bio: "Me apasiona la tecnología, en especial la ciencia de datos y la inteligencia artificial, y disfruto experimentar con ideas para resolver problemas reales. Quiero que SinergIA sea un espacio para colaborar, intercambiar conocimientos y llevar nuestras ideas a la práctica.",
  },
  {
    // adaptada de las publicaciones de presentacion (SinergIA 2025) y de regreso (2026)
    // la foto es ancha por las aletas y tapaba el clic de los vocales de al lado: solo hocico y cuerpo
    id: "byte", firstName: "Byte", lastName: "", role: "Mascota oficial", hit: "0 33% 25% 33%",
    bio: "Nací en 2025 con la planilla SinergIA y este año estoy de regreso. Represento la energía, la curiosidad y la determinación de los estudiantes de Computación y TI de la UVG, y acompaño cada iniciativa, proyecto y actividad. Les recuerdo que la innovación no solo está en la tecnología, sino también en las personas y en las ideas que nos atrevemos a hacer realidad.",
  },
  {
    id: "raul", firstName: "Raúl", lastName: "Godínez", role: "Secretario",
    bio: "Voy en segundo año de Computación, formo parte del equipo del Laboratorio Aeroespacial y fuera de la carrera disfruto los videojuegos y la lectura. Quiero crear más oportunidades para que estudiantes de todos los años nos conozcamos y trabajemos juntos, con actividades que también sumen horas de beca y de extensión.",
  },
  {
    id: "javier", firstName: "Javier", lastName: "Linares", role: "Tesorero",
    bio: "Estudio cuarto año de Ingeniería en Ciencias de la Computación y Tecnologías de la Información, y siempre busco optimizar y encontrar nuevas formas de resolver problemas. Desde la tesorería me comprometo a administrar los recursos con transparencia y responsabilidad, porque creo en el trabajo bien hecho y en la mejora continua.",
  },
  {
    id: "cindy", firstName: "Cindy", lastName: "Gualim", role: "Presidenta",
    bio: "Quiero que sigamos haciendo ruido como estudiantes de tecnología de la UVG, llevando nuestras ideas más allá de las aulas con conexiones, competencias y nuevas oportunidades. Creo en un espacio hecho por estudiantes y para estudiantes, donde liderar signifique escuchar, conectar y crear oportunidades para todos.",
  },
  {
    id: "sarah", firstName: "Sarah", lastName: "Estrada", role: "Vicepresidenta",
    bio: "Soy estudiante de tercer año y me apasiona crear cosas nuevas a través de la computación; también me gustan la música, los videojuegos y aprender cosas nuevas. Mi meta es impulsar la mayor cantidad posible de proyectos que contribuyan a la formación personal, académica y profesional de los estudiantes de Compu.",
  },
];

// Byte no tiene apellido: sin espacios sobrantes en etiquetas y textos
export const fullName = (m: Member) => [m.firstName, m.lastName].filter(Boolean).join(" ");

export const img =(id: string, size: "sm" | "lg") => `/members/${id}-${size}.webp`;

// Datos medidos por tools/prepare_assets.py: alto relativo del recorte y si la foto viene cortada a los lados
export const meta = memberMeta as Record<string, { h: number; cutL: boolean; cutR: boolean }>;

// Mascara de fundido: siempre abajo, y a los lados solo si la foto de Canva corto brazos u hombros.
// Va en un contenedor (no en la imagen con filtro) para que tambien desvanezca el rim light.
// `pad` = margen del contenedor alrededor de la imagen: deja espacio al brillo para que la mascara
// no lo recorte en el borde de la foto (eso se veia como un cuadro).
export function fadeMask(id: string, bottomFrom: number, bottomTo: number, pad = "0px") {
  const { cutL, cutR } = meta[id];
  const l = cutL ? `transparent ${pad}, black calc(${pad} + 14%)` : "black, black";
  const r = cutR ? `black calc(100% - ${pad} - 14%), transparent calc(100% - ${pad})` : "black";
  const mask = `linear-gradient(to bottom, black ${bottomFrom}%, transparent calc(${bottomTo}% - ${pad})), linear-gradient(to right, ${l}, ${r})`;
  return { maskImage: mask, WebkitMaskImage: mask, maskComposite: "intersect", WebkitMaskComposite: "source-in" } as const;
}
