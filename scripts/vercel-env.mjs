#!/usr/bin/env node
// Variables de Vercel (docs/SETUP.md §5). NUNCA imprime secretos: lee .env.local por dentro,
// manda cada valor a `vercel env add` por stdin y solo informa nombres.
//
//   node scripts/vercel-env.mjs vapid [subject]   # llaves VAPID (web-push) si faltan; VAPID_SUBJECT si falta
//   node scripts/vercel-env.mjs subir [NOMBRE…]   # sube a Production y Preview (todas o solo las nombradas)
//   node scripts/vercel-env.mjs app-url <url>      # NEXT_PUBLIC_APP_URL solo en Production
//   node scripts/vercel-env.mjs nombres            # qué variables tiene el proyecto en Vercel
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { parse } from "dotenv";

const ENV_FILE = ".env.local";
const VERCEL = ["npx", "-y", "vercel@65.11.0"];

/** Lo que se sube y cómo. Las NEXT_PUBLIC_* son públicas por diseño; las demás quedan como secreto. */
const VARIABLES = {
  NEXT_PUBLIC_SUPABASE_URL: "config",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "config", // llave publishable
  SUPABASE_SERVICE_ROLE_KEY: "secret",
  DATABASE_URL: "secret",
  DIRECT_URL: "secret",
  APP_TIMEZONE: "config",
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: "config",
  VAPID_PRIVATE_KEY: "secret",
  VAPID_SUBJECT: "config",
  CRON_SECRET: "secret",
  SENTRY_DSN: "secret",
  NEXT_PUBLIC_POSTHOG_KEY: "config",
  NEXT_PUBLIC_POSTHOG_HOST: "config",
};
// No se suben: SUPABASE_DB_PASSWORD (solo arma las URLs en local), VERCEL_* (los maneja Vercel),
// NEXT_PUBLIC_APP_URL (en local es localhost; en Production va con `app-url`).

const leerEnv = () => (existsSync(ENV_FILE) ? parse(readFileSync(ENV_FILE)) : {});
let env = leerEnv();
const extra = [];
const tapar = (texto) => {
  let t = String(texto ?? "");
  const secretos = [...Object.values(env), ...extra].filter((s) => typeof s === "string" && s.length >= 8);
  for (const s of secretos.sort((a, b) => b.length - a.length)) t = t.split(s).join("***");
  return t.replace(/(postgres(?:ql)?:\/\/[^:@\s]+:)[^@\s]+@/g, "$1***@");
};
const decir = (...p) => console.log(tapar(p.join(" ")));
const fallar = (m) => {
  console.error(tapar(`✗ ${m}`));
  process.exit(1);
};

function escribirEnv(valores) {
  const lineas = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8").split("\n") : [];
  for (const [clave, valor] of Object.entries(valores)) {
    const i = lineas.findIndex((l) => l.startsWith(`${clave}=`));
    const estado = env[clave] ? "actualizada" : "escrita";
    if (i >= 0) lineas[i] = `${clave}=${valor}`;
    else lineas.push(`${clave}=${valor}`);
    decir(`  · ${clave}: ${estado}`);
  }
  writeFileSync(ENV_FILE, lineas.join("\n").replace(/\n*$/, "\n"));
  chmodSync(ENV_FILE, 0o600);
  env = leerEnv();
}

function vercel(args, entrada) {
  const r = spawnSync(VERCEL[0], [...VERCEL.slice(1), ...args], {
    encoding: "utf8",
    input: entrada,
    stdio: ["pipe", "pipe", "pipe"],
  });
  return { ok: r.status === 0, salida: tapar(`${r.stdout ?? ""}${r.stderr ?? ""}`) };
}

function agregar(nombre, valor, entornos, tipo) {
  const r = vercel(
    [
      "env",
      "add",
      nombre,
      "--environment",
      entornos,
      "--yes",
      "--force",
      tipo === "secret" ? "--sensitive" : "--no-sensitive",
    ],
    valor,
  );
  if (!r.ok) fallar(`${nombre}: ${r.salida.trim().split("\n").slice(-3).join(" · ")}`);
  decir(`  ✓ ${nombre} → ${entornos} (${tipo === "secret" ? "secreto" : "config"})`);
}

const comandos = {
  async vapid() {
    const subject = process.argv[3];
    if (env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
      decir("Las llaves VAPID ya tenían valor: no las toqué.");
    } else {
      const r = spawnSync("npx", ["-y", "web-push", "generate-vapid-keys", "--json"], { encoding: "utf8" });
      if (r.status !== 0) fallar("web-push generate-vapid-keys falló.");
      let llaves;
      try {
        llaves = JSON.parse(r.stdout);
      } catch {
        fallar("No pude leer la salida de web-push como JSON.");
      }
      extra.push(llaves.privateKey, llaves.publicKey);
      escribirEnv({ NEXT_PUBLIC_VAPID_PUBLIC_KEY: llaves.publicKey, VAPID_PRIVATE_KEY: llaves.privateKey });
    }
    if (subject) {
      if (!/^(mailto:|https:\/\/)/.test(subject)) fallar("VAPID_SUBJECT debe empezar con mailto: o https://");
      escribirEnv({ VAPID_SUBJECT: subject });
    }
  },

  async subir() {
    const pedidas = process.argv.slice(3);
    const nombres = pedidas.length ? pedidas : Object.keys(VARIABLES);
    decir(`Subiendo a Production y Preview (${nombres.length}):`);
    for (const nombre of nombres) {
      const tipo = VARIABLES[nombre];
      if (!tipo) fallar(`${nombre} no está en la lista de variables que se suben.`);
      const valor = env[nombre];
      if (!valor) {
        decir(`  · ${nombre}: vacía en ${ENV_FILE}, no la subo`);
        continue;
      }
      agregar(nombre, valor, "production,preview", tipo);
    }
  },

  async "app-url"() {
    const url = process.argv[3];
    if (!/^https:\/\/[a-z0-9.-]+$/.test(url ?? "")) fallar("Uso: app-url https://chilena.vercel.app");
    agregar("NEXT_PUBLIC_APP_URL", url, "production", "config");
  },

  /** Variables de .env.local que siguen con el valor de ejemplo de .env.example (solo nombres) */
  async ejemplos() {
    const ejemplo = existsSync(".env.example") ? parse(readFileSync(".env.example")) : {};
    const iguales = Object.keys(ejemplo).filter((k) => ejemplo[k] && env[k] === ejemplo[k]);
    decir(
      iguales.length
        ? `Con el valor de ejemplo: ${iguales.join(", ")}`
        : "Ninguna tiene el valor de ejemplo.",
    );
  },

  async nombres() {
    const r = vercel(["env", "ls"]);
    if (!r.ok) fallar(r.salida);
    // `env ls` no muestra valores de secretos; igual pasa por tapar()
    console.log(
      r.salida
        .split("\n")
        .filter((l) => /^\s+[A-Z_]+\s/.test(l))
        .join("\n"),
    );
  },
};

const nombre = process.argv[2];
if (!comandos[nombre]) {
  console.log(`Uso: node scripts/vercel-env.mjs <${Object.keys(comandos).join("|")}>`);
  process.exit(nombre ? 1 : 0);
}
await comandos[nombre]().catch((e) => fallar(e?.message ?? e));
