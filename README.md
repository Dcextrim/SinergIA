# SinergIA UVG

Sitio de SinergIA, la asociación de estudiantes de Computación de la UVG. Se publica en [sinergiia.blog](https://sinergiia.blog).

## Ramas: una por junta

Cada junta trabaja en su propia rama y la une a `main` cuando su versión está lista, así queda el legado de cada año.

- `main`: lo que está publicado.
- `SinergIA-2026`, `SinergIA-2027`…: la rama de cada junta. Se crea desde `main`, se trabaja en ella y al final se hace merge a `main`.

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm run build    # compila a dist/
```

Hecho con Vite, React, TypeScript, Tailwind y GSAP.

## Fotos

Las fotos de `public/members/` y `public/brand/` se generan a partir de las piezas de campaña (SVG de Canva, que no van en el repo):

```bash
python -X utf8 tools/prepare_assets.py ../Imagenes public
```

Los miembros aceptaron que sus fotos y bios se publiquen.
