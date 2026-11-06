// API pública de servidor del módulo `ligas` (no la importes desde componentes cliente).
export {
  cargosDelEquipo,
  cargosDelTorneo,
  contextosEnLigas,
  pagosAlArbitro,
  tablaDelTorneo,
  torneoVigenteDeLaLiga,
  torneoVigenteDelEquipo,
} from "./server/queries";
export { contextosDeRolEnLigas } from "./server/contextos";
export { InicioLiga } from "./components/inicio-liga";
