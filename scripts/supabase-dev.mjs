#!/usr/bin/env node
// Montaje de chilena-dev en Supabase (docs/SETUP.md). NUNCA imprime secretos:
// lee .env.local por dentro, escribe solo nombres de variables y tapa cualquier secreto en los errores.
//
//   node scripts/supabase-dev.mjs contrasena    # guarda la contraseña copiada (portapapeles) y lo vacía
//   node scripts/supabase-dev.mjs link          # supabase link con SUPABASE_DB_PASSWORD
//   node scripts/supabase-dev.mjs env           # llaves (publishable/secret) + DATABASE_URL y DIRECT_URL
//   node scripts/supabase-dev.mjs ping          # SELECT 1 por el pooler (6543) y por la sesión (5432)
//   node scripts/supabase-dev.mjs extensiones   # pg_trgm, unaccent, pg_cron, pg_net
//   node scripts/supabase-dev.mjs bucket        # bucket público avatars (1 MB, webp y jpeg)
//   node scripts/supabase-dev.mjs conteos       # conteos de la liga demo
//   node scripts/supabase-dev.mjs sql "select …" # consulta de solo lectura (no consultes tablas con secretos)
//   node scripts/supabase-dev.mjs flag <clave> on|off  # prende o apaga un flag en chilena-dev
//   node scripts/supabase-dev.mjs cron-secret   # genera CRON_SECRET si falta
//   node scripts/supabase-dev.mjs app [url]     # con pnpm dev corriendo: /api/cron/trabajos llega a la base
//   node scripts/supabase-dev.mjs recalcular [url] # guarda cartas, insignias y posts de lo validado
//   node scripts/supabase-dev.mjs cron [url]    # pg_cron llama /api/cron/trabajos cada minuto (o `cron quitar`)
//
// El ref sale de SUPABASE_PROJECT_REF o de supabase/.temp/project-ref (después del link).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { parse } from "dotenv";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const ENV_FILE = ".env.local";
const REF_POR_DEFECTO = "dahcyppahqqpzptmrzdu"; // chilena-dev

// ---------------------------------------------------------------------------
// .env.local sin mostrar valores
// ---------------------------------------------------------------------------
const leerEnv = () => (existsSync(ENV_FILE) ? parse(readFileSync(ENV_FILE)) : {});
let env = leerEnv();

/** Valores que nunca deben salir en pantalla */
const secretos = () =>
  [
    env.SUPABASE_DB_PASSWORD,
    env.SUPABASE_DB_PASSWORD && encodeURIComponent(env.SUPABASE_DB_PASSWORD),
    env.SUPABASE_SERVICE_ROLE_KEY,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    env.DATABASE_URL,
    env.DIRECT_URL,
    env.VAPID_PRIVATE_KEY,
    env.CRON_SECRET,
    ...extraSecretos,
  ].filter((s) => typeof s === "string" && s.length >= 6);
const extraSecretos = [];
const tapar = (texto) => {
  let t = String(texto ?? "");
  for (const s of secretos().sort((a, b) => b.length - a.length)) t = t.split(s).join("***");
  return t.replace(/(postgres(?:ql)?:\/\/[^:@\s]+:)[^@\s]+@/g, "$1***@");
};
const decir = (...partes) => console.log(tapar(partes.join(" ")));
const fallar = (mensaje) => {
  console.error(tapar(`✗ ${mensaje}`));
  process.exit(1);
};

/** Escribe variables en .env.local conservando el resto del archivo. Solo informa nombres. */
function escribirEnv(valores) {
  const lineas = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8").split("\n") : [];
  const informe = [];
  for (const [clave, valor] of Object.entries(valores)) {
    if (valor == null) continue;
    const i = lineas.findIndex((l) => l.startsWith(`${clave}=`));
    const antes = env[clave];
    if (i >= 0) lineas[i] = `${clave}=${valor}`;
    else lineas.push(`${clave}=${valor}`);
    informe.push(`${clave}: ${antes === valor ? "sin cambios" : antes ? "actualizada" : "escrita"}`);
  }
  writeFileSync(ENV_FILE, lineas.join("\n").replace(/\n*$/, "\n"));
  chmodSync(ENV_FILE, 0o600);
  env = leerEnv();
  for (const l of informe) decir(`  · ${l}`);
}

// ---------------------------------------------------------------------------
// Supabase CLI (pnpm dlx, o SUPABASE_CLI con la ruta del binario)
// ---------------------------------------------------------------------------
function cli(args, { capturar = false } = {}) {
  const [cmd, ...base] = process.env.SUPABASE_CLI
    ? [process.env.SUPABASE_CLI]
    : ["npx", "-y", "pnpm@10.28.0", "dlx", "supabase"];
  const r = spawnSync(cmd, [...base, ...args], {
    encoding: "utf8",
    env: { ...process.env, SUPABASE_DB_PASSWORD: env.SUPABASE_DB_PASSWORD ?? "" },
    stdio: ["inherit", "pipe", "pipe"],
    maxBuffer: 10 * 1024 * 1024,
  });
  if (!capturar) {
    if (r.stdout) process.stdout.write(tapar(r.stdout));
    if (r.stderr) process.stderr.write(tapar(r.stderr));
  }
  if (r.status !== 0) {
    // Con `capturar` el stdout puede traer llaves: en un error solo se muestra stderr
    fallar(
      `supabase ${args[0]} terminó con código ${r.status}${capturar ? `: ${(r.stderr ?? "").trim()}` : ""}`,
    );
  }
  return r.stdout;
}

const ref = () => {
  if (process.env.SUPABASE_PROJECT_REF) return process.env.SUPABASE_PROJECT_REF;
  const f = "supabase/.temp/project-ref";
  return existsSync(f) ? readFileSync(f, "utf8").trim() : REF_POR_DEFECTO;
};

const necesito = (...claves) => {
  const faltan = claves.filter((c) => !env[c]);
  if (faltan.length) fallar(`Falta en ${ENV_FILE}: ${faltan.join(", ")}`);
};

async function conPg(url, fn) {
  const cliente = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await cliente.connect();
  try {
    return await fn(cliente);
  } finally {
    await cliente.end();
  }
}

// ---------------------------------------------------------------------------
// Comandos
// ---------------------------------------------------------------------------
const comandos = {
  /** Guarda en .env.local la contraseña que el usuario copió (macOS: pbpaste) y vacía el portapapeles */
  async contrasena() {
    const r = spawnSync("pbpaste", [], { encoding: "utf8" });
    const pw = (r.stdout ?? "").replace(/[\r\n]+$/, "").trim();
    spawnSync("pbcopy", [], { input: "" }); // no la dejamos en el portapapeles
    if (!pw) fallar("El portapapeles está vacío: copia la contraseña en Supabase y vuelve a correrlo.");
    if (/\s/.test(pw) || pw.length < 8 || pw.length > 128)
      fallar("Lo copiado no parece una contraseña (espacios, saltos de línea o largo raro).");
    extraSecretos.push(pw, encodeURIComponent(pw));
    const igual = pw === env.SUPABASE_DB_PASSWORD;
    escribirEnv({ SUPABASE_DB_PASSWORD: pw });
    decir(
      igual
        ? "Es la misma contraseña que ya estaba."
        : `✓ Contraseña nueva guardada (${pw.length} caracteres).`,
    );
  },

  async link() {
    necesito("SUPABASE_DB_PASSWORD");
    decir(`Vinculando el proyecto ${ref()}…`);
    cli(["link", "--project-ref", ref(), "--yes"]);
    decir(existsSync("supabase/.temp/pooler-url") ? "✓ Vinculado (pooler-url guardado)" : "✓ Vinculado");
  },

  async env() {
    necesito("SUPABASE_DB_PASSWORD");
    const r = ref();

    // Pooler: lo guarda `supabase link` (postgresql://postgres.<ref>@<host>:6543/postgres, sin contraseña)
    const archivoPooler = "supabase/.temp/pooler-url";
    if (!existsSync(archivoPooler)) fallar("No existe supabase/.temp/pooler-url: corre primero `link`.");
    const pooler = new URL(readFileSync(archivoPooler, "utf8").trim());
    const usuario = decodeURIComponent(pooler.username);
    const host = pooler.hostname;
    decir(`Pooler: ${host} (usuario ${usuario})`);

    // Llaves: publishable y secret (sin imprimirlas)
    const salida = cli(["projects", "api-keys", `--remote=${r}`, "--reveal", "-o", "json"], {
      capturar: true,
    });
    let llaves;
    try {
      const json = JSON.parse(salida);
      llaves = Array.isArray(json) ? json : (json.keys ?? json.api_keys ?? []);
    } catch {
      fallar("No pude leer la salida de `supabase projects api-keys` como JSON.");
    }
    for (const k of llaves) if (k?.api_key) extraSecretos.push(k.api_key);
    const deTipo = (tipo, legado) =>
      llaves.find((k) => k.type === tipo && k.api_key && !k.api_key.includes("·"))?.api_key ??
      llaves.find((k) => k.name === legado && k.api_key)?.api_key;
    const publishable = deTipo("publishable", "anon");
    const secret = deTipo("secret", "service_role");
    if (!publishable || !secret)
      fallar(`No encontré las llaves (tipos: ${llaves.map((k) => k.type ?? k.name).join(", ")})`);

    const pw = encodeURIComponent(env.SUPABASE_DB_PASSWORD);
    const base = `postgresql://${encodeURIComponent(usuario)}:${pw}@${host}`;
    const urlProyecto = `https://${r}.supabase.co`;
    // La llave publishable va al cliente solo si falta o es de otro proyecto
    const anonActual = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const anonEsDeEste = anonActual && llaves.some((k) => k.api_key === anonActual);

    decir(`Escribiendo ${ENV_FILE} (solo nombres):`);
    escribirEnv({
      NEXT_PUBLIC_SUPABASE_URL: urlProyecto,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anonEsDeEste ? anonActual : publishable,
      SUPABASE_SERVICE_ROLE_KEY: secret,
      DATABASE_URL: `${base}:6543/postgres?pgbouncer=true`,
      DIRECT_URL: `${base}:5432/postgres`,
    });
    decir("✓ Listo");
  },

  async ping() {
    necesito("DATABASE_URL", "DIRECT_URL");
    let fallas = 0;
    for (const [nombre, url] of [
      ["DIRECT_URL (sesión, 5432)", env.DIRECT_URL],
      ["DATABASE_URL (transacciones, 6543)", env.DATABASE_URL.replace(/[?&]pgbouncer=true/, "")],
    ]) {
      try {
        const fila = await conPg(url, (c) =>
          c.query(
            "select 1 as uno, current_database() as base, current_user as usuario, version() as version",
          ),
        );
        const { uno, base, usuario, version } = fila.rows[0];
        decir(
          `✓ ${nombre}: SELECT 1 = ${uno} · base ${base} · usuario ${usuario} · ${version.split(" on ")[0]}`,
        );
      } catch (e) {
        fallas++;
        decir(`✗ ${nombre}: ${e.message}`);
      }
    }
    if (fallas) process.exit(1);
  },

  async extensiones() {
    necesito("DIRECT_URL");
    // docs.supabase.com: guides/cron/install y guides/database/extensions/pg_net.
    // pg_trgm y unaccent van en public porque immutable_unaccent() usa public.unaccent (001_extras.sql).
    const sql = [
      "create extension if not exists pg_trgm",
      "create extension if not exists unaccent",
      "create extension if not exists pg_cron with schema pg_catalog",
      "grant usage on schema cron to postgres",
      "grant all privileges on all tables in schema cron to postgres",
      "create extension if not exists pg_net",
    ];
    await conPg(env.DIRECT_URL, async (c) => {
      for (const s of sql) await c.query(s);
      const { rows } = await c.query(
        `select e.extname, n.nspname as schema, e.extversion
           from pg_extension e join pg_namespace n on n.oid = e.extnamespace
          where e.extname in ('pg_trgm','unaccent','pg_cron','pg_net') order by 1`,
      );
      for (const r of rows) decir(`✓ ${r.extname} ${r.extversion} (schema ${r.schema})`);
      if (rows.length !== 4) fallar("Falta alguna extensión.");
    }).catch((e) => fallar(e.message));
  },

  /** Prende o apaga un flag en feature_flags: `flag auth.demo_login on` */
  async flag() {
    necesito("DIRECT_URL");
    const [clave, valor] = process.argv.slice(3);
    if (!/^[a-z]+\.[a-z_]+$/.test(clave ?? "") || !["on", "off"].includes(valor ?? ""))
      fallar("Uso: node scripts/supabase-dev.mjs flag <clave> on|off");
    await conPg(env.DIRECT_URL, async (c) => {
      const r = await c.query('update feature_flags set enabled = $1, "updatedAt" = now() where key = $2', [
        valor === "on",
        clave,
      ]);
      if (!r.rowCount) fallar(`No existe el flag ${clave} (¿ya corriste pnpm db:seed?).`);
      decir(`✓ ${clave}: ${valor}`);
    }).catch((e) => fallar(e.message));
  },

  /** Una consulta de solo lectura para verificar (imprime filas: no consultes tablas con secretos) */
  async sql() {
    necesito("DIRECT_URL");
    const consulta = process.argv.slice(3).join(" ");
    if (!consulta) fallar('Uso: node scripts/supabase-dev.mjs sql "select …"');
    await conPg(env.DIRECT_URL, async (c) => {
      await c.query("begin read only");
      const { rows } = await c.query(consulta);
      await c.query("rollback");
      console.log(tapar(JSON.stringify(rows, null, 2)));
    }).catch((e) => fallar(e.message));
  },

  /** CRON_SECRET (docs/SETUP.md §3: 32 bytes en hex), solo si falta */
  async "cron-secret"() {
    if (env.CRON_SECRET) return decir("CRON_SECRET ya tenía valor: no lo toqué.");
    const { randomBytes } = await import("node:crypto");
    escribirEnv({ CRON_SECRET: randomBytes(32).toString("hex") });
  },

  /** ¿La app (pnpm dev) llega a la base? Llama /api/cron/trabajos, que lee la cola de trabajos con DATABASE_URL */
  async app() {
    const base = process.argv[3] ?? "http://localhost:3000";
    if (!env.CRON_SECRET)
      fallar(`CRON_SECRET está vacía en ${ENV_FILE} (docs/SETUP.md §3: openssl rand -hex 32).`);
    const sinAuth = await fetch(`${base}/api/cron/trabajos`).catch((e) =>
      fallar(`No responde ${base}: ${e.message}`),
    );
    decir(`Sin secreto: HTTP ${sinAuth.status} (debe ser 401)`);
    const r = await fetch(`${base}/api/cron/trabajos`, {
      method: "POST",
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    });
    const cuerpo = await r.text();
    decir(`Con secreto: HTTP ${r.status} · ${cuerpo.slice(0, 300)}`);
    if (!r.ok) process.exit(1);
  },

  /**
   * Recalcula y guarda todo lo que sale de lo validado (cartas, insignias y auto-posts): /api/cron/recalcular.
   * Después de cargar la semilla: `node scripts/supabase-dev.mjs recalcular [url]` (por defecto, pnpm dev).
   */
  async recalcular() {
    const base = process.argv[3] ?? "http://localhost:3000";
    necesito("CRON_SECRET");
    decir(`Recalculando en ${base} (puede tardar un par de minutos)…`);
    const r = await fetch(`${base}/api/cron/recalcular`, {
      method: "POST",
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    }).catch((e) => fallar(`No responde ${base}: ${e.message}`));
    decir(`HTTP ${r.status} · ${(await r.text()).slice(0, 400)}`);
    if (!r.ok) process.exit(1);
  },

  /**
   * Programa la cola en pg_cron (docs/SETUP.md §4): cada minuto llama /api/cron/trabajos de la app con el
   * CRON_SECRET (queda dentro de cron.job, en la base; no se imprime). `cron [url]` o `cron quitar`.
   */
  async cron() {
    necesito("DIRECT_URL", "CRON_SECRET");
    const arg = process.argv[3] ?? "https://chilena.vercel.app";
    await conPg(env.DIRECT_URL, async (c) => {
      await c.query("select cron.unschedule(jobid) from cron.job where jobname = 'trabajos'");
      if (arg === "quitar") return decir("✓ Quité el job 'trabajos' de pg_cron.");
      const url = `${arg.replace(/\/$/, "")}/api/cron/trabajos`;
      await c.query(
        `select cron.schedule('trabajos', '* * * * *', format($q$select net.http_post(url := %L, headers := jsonb_build_object('Authorization', %L))$q$, $1::text, $2::text))`,
        [url, `Bearer ${env.CRON_SECRET}`],
      );
      const { rows } = await c.query("select jobname, schedule, active from cron.job where jobname = 'trabajos'");
      decir(`✓ pg_cron: ${rows.map((x) => `${x.jobname} ${x.schedule} ${x.active ? "activo" : "inactivo"}`).join(", ")} → ${url}`);
    }).catch((e) => fallar(e.message));
  },

  async bucket() {
    necesito("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    // CLAUDE.md: foto de perfil comprimida en el cliente (512 px, WebP); límite del bucket 1 MB
    const opciones = {
      public: true,
      fileSizeLimit: 1024 * 1024,
      allowedMimeTypes: ["image/webp", "image/jpeg"],
    };
    const existe = await supabase.storage.getBucket("avatars");
    const r = existe.data
      ? await supabase.storage.updateBucket("avatars", opciones)
      : await supabase.storage.createBucket("avatars", opciones);
    if (r.error) fallar(`Storage: ${r.error.message}`);
    const { data, error } = await supabase.storage.getBucket("avatars");
    if (error) fallar(`Storage: ${error.message}`);
    decir(
      `✓ Bucket ${data.id} ${existe.data ? "actualizado" : "creado"}: público=${data.public} · ` +
        `límite=${data.file_size_limit} bytes · tipos=${(data.allowed_mime_types ?? []).join(", ")}`,
    );
  },

  async conteos() {
    necesito("DIRECT_URL");
    await conPg(env.DIRECT_URL, async (c) => {
      const uno = async (sql) => (await c.query(sql)).rows[0];
      const liga = await uno(`select id, nombre from leagues where slug = 'dominical-iztapalapa'`);
      if (!liga) fallar("No está la liga demo.");
      const torneo = await uno(`select id, nombre from tournaments where "leagueId" = '${liga.id}' limit 1`);
      const t = torneo.id;
      const n = async (sql) => Number((await uno(sql)).n);
      decir(`Liga: ${liga.nombre} · ${torneo.nombre}`);
      decir(
        `  · Equipos inscritos: ${await n(`select count(*) n from tournament_teams where "tournamentId" = '${t}'`)}`,
      );
      decir(
        `  · Jugadores registrados: ${await n(`select count(*) n from tournament_rosters where "tournamentId" = '${t}'`)}`,
      );
      decir(
        `  · Partidos validados: ${await n(`select count(*) n from matches where "tournamentId" = '${t}' and status = 'VALIDADO'`)}`,
      );
      decir(
        `  · Partidos programados: ${await n(`select count(*) n from matches where "tournamentId" = '${t}' and status = 'PROGRAMADO'`)}`,
      );
      decir(
        `  · Eventos de cédula: ${await n(`select count(*) n from match_events e join matches m on m.id = e."matchId" where m."tournamentId" = '${t}'`)}`,
      );
      const s = await uno(
        `select count(*) n, count(*) filter (where status = 'ACTIVA') activas from sanctions where "tournamentId" = '${t}'`,
      );
      decir(`  · Sanciones: ${s.n} (${s.activas} activas)`);
      const tabla = (
        await c.query(
          `select st.posicion, tm.nombre, st.pts, st.dg from standings st
             join tournament_teams tt on tt.id = st."tournamentTeamId" join teams tm on tm.id = tt."teamId"
            where st."tournamentId" = '${t}' order by st.posicion`,
        )
      ).rows;
      decir(`  · Tabla (${tabla.length} filas):`);
      for (const f of tabla) decir(`      ${f.posicion}. ${f.nombre} · ${f.pts} pts · DG ${f.dg}`);
    }).catch((e) => fallar(e.message));
  },
};

const nombre = process.argv[2];
if (!comandos[nombre]) {
  console.log(`Uso: node scripts/supabase-dev.mjs <${Object.keys(comandos).join("|")}>`);
  process.exit(nombre ? 1 : 0);
}
await comandos[nombre]().catch((e) => fallar(e?.message ?? e));
