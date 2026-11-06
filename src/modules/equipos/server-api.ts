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
