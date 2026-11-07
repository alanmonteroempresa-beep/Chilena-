// Regresa el partido de prueba (J16 · Dep. Portales vs Tigres del Llano) a "sin jugar", como si nunca se
// hubiera jugado: cédula, correcciones, eventos, alineaciones, sanciones que salieron de él, estadísticas,
// tabla, posts y cartas. Llama /api/cron/reiniciar-prueba de la app con el CRON_SECRET de .env.local
// (se lee por dentro y nunca se imprime). Lo usan los E2E de la cédula al terminar.
//   npx tsx scripts/reiniciar-prueba.ts                                  # contra pnpm dev (localhost:3000)
//   npx tsx scripts/reiniciar-prueba.ts https://chilena.vercel.app --todo # producción; --todo: pase de lista en blanco y hoy a las 20:00
import { existsSync, readFileSync } from "node:fs";
import { parse } from "dotenv";

const env = existsSync(".env.local") ? parse(readFileSync(".env.local")) : {};
const base = (process.argv.slice(2).find((a) => a.startsWith("http")) ?? "http://localhost:3000").replace(/\/$/, "");
const todo = process.argv.includes("--todo");

async function main() {
  if (!env.CRON_SECRET) {
    console.log("Sin CRON_SECRET en .env.local: no hay con qué llamar a la app.");
    return;
  }
  const r = await fetch(`${base}/api/cron/reiniciar-prueba${todo ? "?todo=1" : ""}`, {
    method: "POST",
    headers: { authorization: `Bearer ${env.CRON_SECRET}` },
  });
  const cuerpo = (await r.json().catch(() => null)) as { ok?: boolean; result?: { hoy?: string | null; estaba?: string }; error?: string } | null;
  if (!r.ok || !cuerpo?.ok) throw new Error(`HTTP ${r.status}: ${cuerpo?.error ?? "sin respuesta"}`);
  const hoy = cuerpo.result?.hoy;
  console.log(`✓ J16 Portales vs Tigres otra vez sin jugar (estaba ${cuerpo.result?.estaba})${hoy ? ` · hoy ${hoy} a las 20:00, pase de lista en blanco` : ""}`);
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
