---
description: Implementa una pantalla del diseño (01–56) respetando docs/diseno
argument-hint: "<número de pantalla, ej. 25>"
---
Implementa la pantalla $ARGUMENTS.

1. Busca la pantalla en `docs/DISENO.md` §6 (ruta y módulo) y sus imágenes en `docs/diseno/` (celular y escritorio; si hay HTML en `docs/diseno/html/`, úsalo para medidas).
2. Lee el `CLAUDE.md` del módulo y la sección del PRD correspondiente.
3. Reutiliza componentes de `src/shared/ui` y de la marca (botón lima, chip de marcador, carta). Usa los tokens de `globals.css` (`bg-surface`, `text-role`, `.titular-momento`, `.etiqueta`), nunca colores sueltos.
4. Textos en español de México **tal cual** vienen en el diseño.
5. Datos reales vía `server/queries.ts` del módulo (con `select` explícito); si aún no existen, usa la semilla demo.
6. Verifica a 390 px en **oscuro y claro**, áreas táctiles ≥ 44 px, y que funcione con un rol distinto (acento del rol).
7. Pide al agente `revisor-ui` que compare contra el diseño antes de terminar.
