# Módulo `equipos`

**Carril:** 🟣 Operación

Equipos, miembros, invitación (link/QR), dar de alta perfiles sin reclamar, pase de lista (link sin cuenta), cuotas ("Ya pagué / Confirmar") y vitrina.

| | |
|---|---|
| **Tablas (dueño)** | teams, team_members, team_dues, team_due_payments, attendance_links, match_attendances |
| **Pantallas** | 01b Invitación · 04 Gestión · 20 Pase de lista · 22b Vitrina · 31/54 Cuotas · 36 Perfil de equipo · 51 Crear equipo · 52 Agregar jugadores |
| **Emite** | team.member_joined, attendance.responded |
| **Escucha** | tournament.finished (vitrina) |

## Reglas clave
- Día de partido (`server/actions.ts`): contestar VOY / NO VOY en la app (cada quien por sí mismo) o desde el link de WhatsApp `/p/[token]` (sin cuenta, eligiendo su nombre); el delegado abre el pase de lista (un link por partido y equipo, avisa a la plantilla la primera vez) y manda la alineación. Se puede hasta que el árbitro mande la cédula. Reglas en `server/reglas.ts` (PERMISOS §3).
- Alineación (`server/alineacion.ts` + `revisarAlineacion` de partidos): rojo no entra (otro equipo, suspendido, no registrado), ámbar avisa (cuota, a una amarilla). El servidor valida.
- Inicio del delegado (04): `server/inicio.ts` + `components/inicio-delegado.tsx`. La plantilla "primero los que necesitan atención", el pase de lista y las cuotas salen de `server/services/plantilla.ts` (puro).
- El pase de lista por link no pide cuenta: el jugador elige su nombre.
- La app no mueve dinero; solo control de pagos.
- Datos de pago del equipo solo los ven sus miembros.

## Estructura
- `index.ts`: **API pública**. Lo único que otros módulos pueden importar (`@/modules/equipos`).
- `server/actions.ts`: Server Actions (Zod → `assertCan()` → servicio → `emit()` → `revalidateTag`).
- `server/services/`: lógica de negocio pura, testeable sin Next.
- `server/queries.ts`: lecturas con `select` explícito.
- `server/listeners.ts`: `registerListeners()` (eventos que escucha).
- `components/`: UI del módulo. `schemas.ts`: Zod. `tests/`: Vitest.

Antes de programar aquí, lee `docs/MODULOS.md` y las secciones del PRD de estas pantallas.
