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
