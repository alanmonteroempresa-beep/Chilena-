# Chilena — Permisos

> Toda escritura pasa por `can(user, action, ctx)` / `assertCan()` en `src/modules/core/server/authz/`. **Nunca se confía en el cliente.** Los permisos se calculan **por relación** (¿es delegado de *este* equipo?), no por el rol activo. Cada fila de este documento tiene su test.
> ✅ puede · 🔸 condicionado · — no

## 1. Social
| Acción | Visitante | Aficionado | Jugador | Delegado | Árbitro | Liga |
|---|---|---|---|---|---|---|
| Ver contenido público | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Echar 🔥 | 🔸 anónimo | ✅ | ✅ | ✅ | ✅ | ✅ |
| Comentar en la porra | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Publicar como persona | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Publicar como equipo | — | — | — | ✅ (su equipo) | — | — |
| Publicar como liga / editar textos automáticos | — | — | — | — | — | ✅ (su liga) |
| Seguir | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reportar y bloquear | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Moderar (ocultar) | — | — | — | — | — | ✅ (contenido de su liga) |
| Quitarse una etiqueta | — | ✅ (la suya) | ✅ | ✅ | ✅ | ✅ |

## 2. Votaciones y quiniela
| Acción | Quién |
|---|---|
| MVP, golazo, once, atajada | Cualquier cuenta reclamada, 1 voto por votación |
| El Muro | Solo compañeros activos del equipo |
| Respeto (RES) | Solo jugadores del equipo **rival** que estuvieron en la alineación |
| Quiniela | Cualquier cuenta reclamada, hasta 1 min antes del partido (se puede cambiar hasta entonces) |
| Votar por uno mismo | Nunca |
| Activar avisos al celular (`push.subscribe`) · Reportar falla (`bug.report`) | Cualquier cuenta reclamada, para sí misma |

## 3. Equipo
| Acción | Jugador | Capitán | Del. auxiliar | Del. principal | Liga |
|---|---|---|---|---|---|
| Crear equipo | (cualquiera → queda como delegado principal) | | | | |
| Editar equipo, datos de pago, link del grupo | — | — | ✅ | ✅ | — |
| Dar de alta jugadores (sin reclamar) / invitar | — | — | ✅ | ✅ | ✅ |
| Dar de baja a un jugador | — | — | — | ✅ | — |
| Nombrar auxiliares y capitán | — | — | — | ✅ | — |
| Pase de lista: contestar (propio) | ✅ | ✅ | ✅ | ✅ | — |
| Pase de lista: mandar link y recordatorio | — | — | ✅ | ✅ | — |
| Marcar presentes en cancha | — | 🔸¹ | ✅ | ✅ | — |
| Alineación | — | — | ✅ | ✅ | — |
| Revisar, señalar y firmar la cédula (en su celular o en el del árbitro) | — | — | ✅ | ✅ | — |
| "No hay juego" (solicitud) | — | — | ✅ | ✅ | — |
| Crear cuota y confirmar pagos | — | — | ✅ | ✅ | — |
| "Ya pagué" (propio) | ✅ | ✅ | ✅ | ✅ | — |
| Inscribir al equipo en un torneo | — | — | — | ✅ | — |
| Retar a otro equipo / aceptar reta | — | — | ✅ | ✅ | — |
| Evaluar jugadores (privado) | — | — | ✅ | ✅ | — |

¹ Solo si no hay delegado presente.

## 4. Liga y árbitro
| Acción | Gestor | Admin | Dueño | Árbitro |
|---|---|---|---|---|
| Registrar liga | (cualquiera → Dueño) | | | |
| Agregar administradores | — | — | ✅ | — |
| Agregar gestores | — | ✅ | ✅ | — |
| Canchas, torneos, inscripciones | — | ✅ | ✅ | — |
| Rol de juegos y programar jornada | ✅ | ✅ | ✅ | — |
| Asignar árbitro | ✅ | ✅ | ✅ | — |
| Aceptar / "no puedo" | — | — | — | ✅ (propio) |
| Capturar cédula | 🔸² | 🔸² | 🔸² | ✅ (asignado y aceptado) |
| Responder correcciones | — | 🔸⁴ | 🔸⁴ | ✅ (su cédula) |
| Validar resultado | — | ✅ | ✅ | — |
| Corregir resultado ya firmado | — | ✅ (con motivo y bitácora) | ✅ | — |
| Suspender o reprogramar partido | ✅ | ✅ | ✅ | 🔸³ |
| Confirmar "No hay juego" | ✅ | ✅ | ✅ | — |
| Sancionar | — | ✅ | ✅ | — |
| Cobros y pagos a árbitros | — | ✅ | ✅ | — |
| Moderar la porra de la liga | ✅ | ✅ | ✅ | — |
| Cerrar torneo y liguilla | — | ✅ | ✅ | — |

² Solo como captura desde la cédula de papel (`PAPEL_LIGA`).
³ Solo su partido, durante el juego.
⁴ Solo si el árbitro no la contesta en 48 h (POR APROBAR).

## 5. Quién ve qué dato
| Dato | Público | Compañeros de equipo | Delegados del equipo | Liga del torneo |
|---|---|---|---|---|
| Apodo, nombre, foto, posición, carta, insignias, stats | ✅ | ✅ | ✅ | ✅ |
| Alcaldía / zona | ✅ | ✅ | ✅ | ✅ |
| Celular | — | 🔸 (si `showCelularToTeam`) | ✅ | ✅ |
| Contacto de emergencia | — | — | ✅ | ✅ |
| Fecha de nacimiento exacta | — | — | — | ✅ |
| Tallas | — | — | ✅ | — |
| Evaluaciones del delegado | — | — | ✅ (y el propio jugador) | — |
| Datos de pago del equipo | — | ✅ | ✅ | — |
| Datos de pago de la liga | — | — | ✅ | ✅ |
| Cuotas: quién debe | — | — | ✅ (y cada quien la suya) | — |

Las queries públicas usan `publicUserSelect`; nunca `include: { user: true }` hacia un componente público.
