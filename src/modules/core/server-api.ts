// API pública de servidor del módulo `core` (separada para no arrastrar "server-only" a componentes cliente).
export { isEnabled } from "./server/flags";
export { getCurrentUser, requireUser } from "./server/auth";
export { perfilesDeJugadores, perfilPublico, personasPorId } from "./server/perfil";
// Entrar (pantalla 01) y sesión
export { confirmarEntrada, asegurarUsuario } from "./server/entrada";
export { PantallaEntrar } from "./components/entrar/pantalla-entrar";
export { PantallaProvisional } from "./components/sesion/pantalla-provisional";
// Cascarón de la app con sesión (header, selector de rol y barra), inicio sin equipo o liga y "Próximamente"
export { CascaronApp } from "./components/app/cascaron-app";
export { CascaronVisitante } from "./components/app/cascaron-visitante";
export { InicioVacio, TarjetaCompletarPerfil } from "./components/app/inicio-vacio";
export { Proximamente } from "./components/app/proximamente";
export { necesitaCompletarPerfil } from "./server/services/sesion";
