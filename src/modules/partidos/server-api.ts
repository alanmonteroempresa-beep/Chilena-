// API pública de servidor del módulo `partidos` (no la importes desde componentes cliente).
export {
  cedulaPorFirmar,
  cedulasPorRevisar,
  estadisticasDelJugador,
  estadisticasVigentes,
  goleoDelTorneo,
  historialDePlantillas,
  jornadaCompleta,
  jornadaQueViene,
  partidosDeLaJornada,
  partidoCompleto,
  partidoDelDia,
  partidoValidadoParaFeed,
  partidosValidadosVigentes,
  partidosValidadosConGoles,
  partidosDelArbitro,
  proximoPartidoDelEquipo,
  sancionesActivas,
  tarjetasParaAcumulado,
  ultimaJornadaValidada,
  ultimoResultadoDelEquipo,
} from "./server/queries";
export { InicioArbitro } from "./components/inicio-arbitro";
export { PaginaPartido } from "./components/pagina-partido";
export { registerListeners } from "./server/listeners";
// La cédula: árbitro (56a, 56b), delegado (19)
export { arbitroDelPartido, cedulaDelPartido, correccionesParaElArbitro } from "./server/queries";
export { vistaDeLaCedula, type VistaDeLaCedula } from "./server/cedula";
export { proveerInscritos, type Inscrito } from "./server/puertos";
export { CedulaArbitro } from "./components/cedula/cedula-arbitro";
export { CedulaEnviada } from "./components/cedula/cedula-enviada";
export { RevisarCedula } from "./components/cedula/revisar-cedula";
export { RevisarCedulas } from "./components/liga/revisar-cedulas";
// Lo que sale de lo validado (sanciones, estadísticas, tabla)
export { alertasDeAmarillas, partidosParaTabla, recalcularEstadisticas, recalcularSancionesDelTorneo, sancionesDelPartido } from "./server/recalcular";
export { datosParaRecalcular } from "./server/queries";
export { reiniciarPartidoDePrueba } from "./server/prueba";
