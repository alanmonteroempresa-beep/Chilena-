---
description: Revisa los cambios actuales contra las reglas de Chilena antes del PR
---
1. Corre `pnpm lint && pnpm typecheck && pnpm test` y reporta lo que falle.
2. Pide al agente `revisor-reglas` que revise `git diff main...HEAD` (o `git diff` si no hay rama).
3. Si hubo cambios de UI, pide al agente `revisor-ui` que los compare con `docs/diseno/`.
4. Dame un resumen corto: qué está bien, qué hay que corregir (con archivo y línea) y si el ROADMAP/PRD quedó actualizado.
