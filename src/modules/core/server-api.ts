// API pública de servidor del módulo `core` (separada para no arrastrar "server-only" a componentes cliente).
export { isEnabled } from "./server/flags";
export { getCurrentUser, requireUser } from "./server/auth";
// Entrar (pantalla 01) y sesión
export { confirmarEntrada, asegurarUsuario } from "./server/entrada";
export { PantallaEntrar } from "./components/entrar/pantalla-entrar";
export { PantallaProvisional } from "./components/sesion/pantalla-provisional";
// Cascarón de la app con sesión (header, selector de rol y barra) y pantallas provisionales del recorrido
export { CascaronApp } from "./components/app/cascaron-app";
export { InicioProvisional } from "./components/app/inicio-provisional";
export { Proximamente } from "./components/app/proximamente";
export { necesitaCompletarPerfil } from "./server/services/sesion";
