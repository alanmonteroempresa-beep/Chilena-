---
description: Toma la siguiente tarea pendiente del ROADMAP en tu carril (operacion o social)
argument-hint: "[operacion|social]"
---
Carril: $ARGUMENTS (si viene vacío, pregúntame si soy 🟣 Operación o 🔵 Social).

1. Lee `docs/ROADMAP.md` y encuentra la **primera casilla sin marcar** de la fase actual de mi carril (Fase 0 y Fase 1 son de los dos).
2. Lee el `CLAUDE.md` del módulo que toca (`src/modules/<modulo>/CLAUDE.md`), las secciones del PRD que cita la fase y las pantallas de `docs/diseno/` (mapa en `docs/DISENO.md` §6).
3. Dime en 5–8 líneas: qué vas a hacer, qué archivos tocas y qué tests agregas. Espera mi OK.
4. Implementa en una rama `feat/<modulo>-<cosa>`.
5. Corre `pnpm lint && pnpm typecheck && pnpm test`. Si hay UI, revísala a 390 px en oscuro y claro.
6. Marca la casilla en el ROADMAP y haz commit en español. No hagas push sin preguntarme.
