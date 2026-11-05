// Logger mínimo (sin console.log suelto en el código). Sentry se conecta en la Fase 0.
type Level = "debug" | "info" | "warn" | "error";

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  if (level === "debug" && process.env.NODE_ENV === "production") return;
  const line = { level, message, ...meta, at: new Date().toISOString() };
  const out = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  out(JSON.stringify(line));
}

export const logger = {
  debug: (m: string, meta?: Record<string, unknown>) => log("debug", m, meta),
  info: (m: string, meta?: Record<string, unknown>) => log("info", m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => log("warn", m, meta),
  error: (m: string, meta?: Record<string, unknown>) => log("error", m, meta),
};
