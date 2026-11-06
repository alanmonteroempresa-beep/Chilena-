// API pública de servidor del módulo `partidos` (no la importes desde componentes cliente).
export {
  cedulaPorFirmar,
  cedulasPorRevisar,
  estadisticasDelJugador,
  goleoDelTorneo,
  historialDePlantillas,
  jornadaQueViene,
  partidosDeLaJornada,
  partidoCompleto,
  partidosDelArbitro,
  proximoPartidoDelEquipo,
  sancionesActivas,
  tarjetasParaAcumulado,
  ultimoResultadoDelEquipo,
} from "./server/queries";
export { InicioArbitro } from "./components/inicio-arbitro";
export { PaginaPartido } from "./components/pagina-partido";
