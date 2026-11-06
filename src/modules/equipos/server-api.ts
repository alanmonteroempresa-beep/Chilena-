// API pública de servidor del módulo `equipos` (no la importes desde componentes cliente).
export {
  contextosEnEquipos,
  cuotaVigente,
  equipoDeCadaQuien,
  equipoPorSlug,
  equiposMasSeguidos,
  equiposQueSigue,
  plantillaDelEquipo,
  respuestasDelPaseDeLista,
} from "./server/queries";
export { contextosDeRolEnEquipos } from "./server/contextos";
export { InicioDelegado } from "./components/inicio-delegado";
export { registerListeners } from "./server/listeners";
export { delegadosDe, esDelegadoDe } from "./server/queries";
export { PaginaPaseDeLista } from "./components/dia-de-partido/pase-de-lista";
export { PaginaAlineacion } from "./components/dia-de-partido/alineacion";
export { PaginaLink } from "./components/dia-de-partido/link-publico";
