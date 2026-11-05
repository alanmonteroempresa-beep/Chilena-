#!/usr/bin/env node
// Pruebas de la pantalla 01 sin mandar correos (solo chilena-dev). Carga .env.local por dentro.
// Usa una cuenta de PRUEBA (@example.com: dominio reservado, nadie recibe ahí) y la API de administración.
//
//   node scripts/probar-entrar.mjs link [email] [base] [next]   # imprime el link de entrada (de un solo uso)
//   node scripts/probar-entrar.mjs perfil [email] <nombre> <apodo>
//   node scripts/probar-entrar.mjs ver [email]                  # su User (sin datos privados)
//   node scripts/probar-entrar.mjs borrar [email]               # borra la cuenta de prueba y su User
import { existsSync, readFileSync } from "node:fs";
import { parse } from "dotenv";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const env = existsSync(".env.local") ? parse(readFileSync(".env.local")) : {};
const CORREO_PRUEBA = "prueba-entrar@example.com";
const REF_DEV = existsSync("supabase/.temp/project-ref")
  ? readFileSync("supabase/.temp/project-ref", "utf8").trim()
  : null;

const fallar = (m) => {
  console.error(`✗ ${m}`);
  process.exit(1);
};
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) fallar("Falta configurar .env.local");
if (!REF_DEV || !env.NEXT_PUBLIC_SUPABASE_URL.includes(REF_DEV))
  fallar("Solo corre contra el proyecto vinculado (chilena-dev).");

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const esPrueba = (email) => {
  if (!email.endsWith("@example.com")) fallar("Solo cuentas de prueba @example.com.");
  return email;
};
async function conPg(fn) {
  const c = new pg.Client({ connectionString: env.DIRECT_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}

const [, , comando, ...args] = process.argv;
const comandos = {
  async link() {
    const email = esPrueba(args[0] ?? CORREO_PRUEBA);
    const base = (args[1] ?? "http://localhost:3000").replace(/\/$/, "");
    const next = args[2] ?? "/inicio";
    let r = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (r.error) {
      const creado = await admin.auth.admin.createUser({ email, email_confirm: true });
      if (creado.error) fallar(creado.error.message);
      r = await admin.auth.admin.generateLink({ type: "magiclink", email });
    }
    if (r.error) fallar(r.error.message);
    const url = new URL(`${base}/auth/confirm`);
    url.searchParams.set("next", next);
    url.searchParams.set("token_hash", r.data.properties.hashed_token);
    url.searchParams.set("type", "email");
    console.log(url.toString());
  },
  async perfil() {
    const [emailArg, nombre, apodo] = args.length >= 3 ? args : [CORREO_PRUEBA, ...args];
    const email = esPrueba(emailArg);
    const n = await conPg((c) =>
      c.query("update users set nombre = $1, sobrenombre = $2 where email = $3", [
        nombre ?? "",
        apodo ?? null,
        email,
      ]),
    );
    console.log(`✓ ${n.rowCount} User actualizado`);
  },
  async ver() {
    const email = esPrueba(args[0] ?? CORREO_PRUEBA);
    const { rows } = await conPg((c) =>
      c.query(
        `select u.username, u.nombre, u.sobrenombre, u."activeRole", (u."authId" is not null) as reclamado,
                array(select role::text from user_roles r where r."userId" = u.id) as roles
           from users u where u.email = $1`,
        [email],
      ),
    );
    console.log(JSON.stringify(rows, null, 2));
  },
  async borrar() {
    const email = esPrueba(args[0] ?? CORREO_PRUEBA);
    const n = await conPg((c) => c.query("delete from users where email = $1", [email]));
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const auth = data?.users.find((u) => u.email === email);
    if (auth) await admin.auth.admin.deleteUser(auth.id);
    console.log(`✓ Borrado: ${n.rowCount} User y ${auth ? 1 : 0} cuenta de Auth`);
  },
};
if (!comandos[comando]) {
  console.log(`Uso: node scripts/probar-entrar.mjs <${Object.keys(comandos).join("|")}>`);
  process.exit(comando ? 1 : 0);
}
await comandos[comando]().catch((e) => fallar(e?.message ?? e));
