import "server-only";
import { db } from "@/shared/lib/db";
import { logger } from "@/shared/lib/logger";
import { FLAG_DEFAULTS, type FlagKey } from "../flags.defaults";

const TTL_MS = 60_000;
let cache: { at: number; values: Map<string, boolean> } | null = null;

/**
 * ¿Está prendida esta función? Lee `feature_flags` con caché de 60 s.
 * El TTL se mide con `performance.now()`: con `cacheComponents`, Next no deja leer la hora al prerenderizar.
 */
export async function isEnabled(key: FlagKey): Promise<boolean> {
  if (!cache || performance.now() - cache.at > TTL_MS) {
    try {
      const rows = await db.featureFlag.findMany({ select: { key: true, enabled: true } });
      cache = { at: performance.now(), values: new Map(rows.map((r) => [r.key, r.enabled])) };
    } catch (error) {
      logger.warn("feature_flags no disponible, uso valores por defecto", { error: String(error) });
      return FLAG_DEFAULTS[key].enabled;
    }
  }
  return cache.values.get(key) ?? FLAG_DEFAULTS[key].enabled;
}
