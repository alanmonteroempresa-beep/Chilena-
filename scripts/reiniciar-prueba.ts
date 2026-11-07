// Regresa el partido de prueba (J16 · Dep. Portales vs Tigres del Llano) a "sin jugar", como si nunca se
// hubiera jugado: cédula, correcciones, eventos, alineaciones, sanciones que salieron de él, estadísticas,
// tabla, posts y cartas. Llama /api/cron/reiniciar-prueba de la app con el CRON_SECRET de .env.local
// (se lee por dentro y nunca se imprime). Lo usan los E2E de la cédula al terminar.
//   npx tsx scripts/reiniciar-prueba.ts                                  # contra pnpm dev (localhost:3000)
//   npx tsx scripts/reiniciar-prueba.ts https://chilena.vercel.app --todo # producción; --todo: pase de lista en blanco y hoy a las 20:00
//   npx tsx scripts/reiniciar-prueba.ts https://chilena.vercel.app --todo --hora 17:00   # otra hora (si ya pasó, mañana)
//   npx tsx scripts/reiniciar-prueba.ts https://chilena.vercel.app --todo --fecha 2026-11-08 --hora 12:00   # otro día
import { existsSync, readFileSync } from "node:fs";
import { parse } from "dotenv";

const env = existsSync(".env.local") ? parse(readFileSync(".env.local")) : {};
const base = (process.argv.slice(2).find((a) => a.startsWith("http")) ?? "http://localhost:3000").replace(/\/$/, "");
const todo = process.argv.includes("--todo");
const iHora = process.argv.indexOf("--hora");
const hora = iHora > 0 ? process.argv[iHora + 1] : undefined;
const iFecha = process.argv.indexOf("--fecha");
const fecha = iFecha > 0 ? process.argv[iFecha + 1] : undefined;

async function main() {
  if (!env.CRON_SECRET) {
    console.log("Sin CRON_SECRET en .env.local: no hay con qué llamar a la app.");
    return;
  }
  const q = new URLSearchParams(todo ? { todo: "1", ...(hora ? { hora } : {}), ...(fecha ? { fecha } : {}) } : {});
  const r = await fetch(`${base}/api/cron/reiniciar-prueba${q.size ? `?${q}` : ""}`, {
    method: "POST",
    headers: { authorization: `Bearer ${env.CRON_SECRET}` },
  });
  const cuerpo = (await r.json().catch(() => null)) as { ok?: boolean; result?: { cuando?: string | null; estaba?: string }; error?: string } | null;
  if (!r.ok || !cuerpo?.ok) throw new Error(`HTTP ${r.status}: ${cuerpo?.error ?? "sin respuesta"}`);
  const cuando = cuerpo.result?.cuando;
  console.log(`✓ J16 Portales vs Tigres otra vez sin jugar (estaba ${cuerpo.result?.estaba})${cuando ? ` · se juega el ${cuando}, pase de lista en blanco` : ""}`);
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
