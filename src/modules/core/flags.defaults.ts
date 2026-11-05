// Interruptores de la beta (docs/MODULOS.md §4). La semilla los carga en `feature_flags`;
// si la base no responde, se usan estos valores.
export const FLAG_DEFAULTS = {
  "media.avatar": { enabled: true, descripcion: "Foto de perfil" },
  "media.posts": { enabled: false, descripcion: "Fotos y videos en publicaciones" },
  "media.goal_video": { enabled: false, descripcion: "Video ligado al gol" },
  "auth.whatsapp_otp": { enabled: false, descripcion: "Entrar con código por WhatsApp" },
  "auth.google": { enabled: false, descripcion: "Entrar con Google (falta configurar Google Cloud)" },
  "ai.texts": { enabled: false, descripcion: "Crónica y titulares con IA (off = plantillas)" },
  "pro.futbol": { enabled: false, descripcion: "Sección Fútbol Pro" },
  "social.quiniela": { enabled: true, descripcion: "Quiniela" },
  "social.votaciones": { enabled: true, descripcion: "Votaciones" },
  "comunidad.bolsa": { enabled: true, descripcion: "Bolsa del llano" },
  "comunidad.retas": { enabled: true, descripcion: "Retas entre equipos" },
  "dinero.cuotas": { enabled: true, descripcion: "Cuotas del equipo (Ya pagué / Confirmar)" },
  "dinero.cobros_liga": { enabled: true, descripcion: "Cobros de la liga" },
  "beta.bug_button": { enabled: true, descripcion: "Botón Reportar falla" },
  "push.enabled": { enabled: true, descripcion: "Push web de prueba" },
} as const satisfies Record<string, { enabled: boolean; descripcion: string }>;

export type FlagKey = keyof typeof FLAG_DEFAULTS;
