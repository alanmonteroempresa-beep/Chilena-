// Cuentas de prueba de Chilena (flag `auth.demo_login`). Solo chilena-dev. NUNCA imprime contraseñas:
// las guarda en CUENTAS-DE-PRUEBA.md (en .gitignore). Carga .env.local por dentro.
//
//   npx tsx scripts/cuentas-de-prueba.ts           # crea las que falten (y conserva las contraseñas del archivo)
//   npx tsx scripts/cuentas-de-prueba.ts --rotar   # contraseñas nuevas para todas
//
// Cada cuenta queda confirmada, con `app_metadata.cuenta_de_prueba = true` (solo la API de administración la
// puede poner; sin ella no se entra por "Entrar con cuenta de prueba") y ligada a su persona de Chilena.
import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { parse } from "dotenv";
import { PrismaClient, type RoleType } from "../src/generated/prisma/client";

const ARCHIVO = "CUENTAS-DE-PRUEBA.md";
const DOMINIO = "prueba.chilena";
const TODOS: RoleType[] = ["AFICIONADO", "JUGADOR", "DELEGADO", "ARBITRO", "LIGA"];

type Cuenta = {
  clave: string;
  entraComo: string;
  /** username de la persona de la semilla demo a la que se liga */
  perfil?: string;
  /** o una persona nueva, para las cuentas del equipo */
  nueva?: { nombre: string; apellidos: string; sobrenombre: string };
  roles: RoleType[];
};

const CUENTAS: Cuenta[] = [
  {
    clave: "alan",
    entraComo: "Alan · todos los roles",
    nueva: { nombre: "Alan", apellidos: "Montero", sobrenombre: "Alan" },
    roles: TODOS,
  },
  {
    clave: "hermano1",
    entraComo: "Hermano 1 · todos los roles",
    nueva: { nombre: "Hermano", apellidos: "Uno", sobrenombre: "Hermano 1" },
    roles: TODOS,
  },
  {
    clave: "hermano2",
    entraComo: "Hermano 2 · todos los roles",
    nueva: { nombre: "Hermano", apellidos: "Dos", sobrenombre: "Hermano 2" },
    roles: TODOS,
  },
  { clave: "jugador", entraComo: "El Chícharo · jugador de Dep. Portales", perfil: "el-chicharo", roles: [] },
  { clave: "delegado", entraComo: "Memo Salas · delegado de Dep. Portales", perfil: "memo-salas", roles: [] },
  { clave: "arbitro", entraComo: "J. Mendoza · árbitro", perfil: "jorge-mendoza", roles: [] },
  { clave: "liga", entraComo: "Don Toño · Liga Dominical Iztapalapa", perfil: "don-tono", roles: [] },
  { clave: "aficionada", entraComo: "Doña Lupe · aficionada", perfil: "dona-lupe", roles: [] },
];

function fallar(m: string): never {
  console.error(`✗ ${m}`);
  process.exit(1);
}

const env = existsSync(".env.local") ? parse(readFileSync(".env.local")) : {};
const REF_DEV = existsSync("supabase/.temp/project-ref")
  ? readFileSync("supabase/.temp/project-ref", "utf8").trim()
  : null;
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.DIRECT_URL)
  fallar("Falta configurar .env.local");
if (!REF_DEV || !env.NEXT_PUBLIC_SUPABASE_URL.includes(REF_DEV))
  fallar("Solo corre contra el proyecto vinculado (chilena-dev).");

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DIRECT_URL }) });
const rotar = process.argv.includes("--rotar");

/** Contraseñas que ya estaban en el archivo (para no cambiárselas a nadie sin --rotar) */
function contrasenasGuardadas(): Map<string, string> {
  const m = new Map<string, string>();
  if (!existsSync(ARCHIVO)) return m;
  for (const linea of readFileSync(ARCHIVO, "utf8").split("\n")) {
    const r = linea.match(/^\| [^|]+ \| (\S+@prueba\.chilena) \| `([^`]+)` \|/);
    if (r) m.set(r[1], r[2]);
  }
  return m;
}

const nuevaContrasena = () => randomBytes(18).toString("base64url"); // 24 caracteres, ~144 bits

async function usuariosDeAuth() {
  const porCorreo = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) fallar(`No pude listar las cuentas: ${error.message}`);
    for (const u of data.users) if (u.email) porCorreo.set(u.email.toLowerCase(), u.id);
    if (data.users.length < 1000) return porCorreo;
  }
}

async function main() {
  const guardadas = contrasenasGuardadas();
  const existentes = await usuariosDeAuth();
  const filas: { cuenta: Cuenta; email: string; password: string }[] = [];

  for (const cuenta of CUENTAS) {
    const email = `${cuenta.clave}@${DOMINIO}`;
    const password = (!rotar && guardadas.get(email)) || nuevaContrasena();
    const atributos = { password, email_confirm: true, app_metadata: { cuenta_de_prueba: true } };

    let authId = existentes.get(email);
    if (authId) {
      const { error } = await admin.auth.admin.updateUserById(authId, atributos);
      if (error) fallar(`${cuenta.clave}: ${error.message}`);
    } else {
      const { data, error } = await admin.auth.admin.createUser({ email, ...atributos });
      if (error || !data.user) fallar(`${cuenta.clave}: ${error?.message ?? "sin usuario"}`);
      authId = data.user.id;
    }

    // Una persona por cuenta: si ya hay otra persona ligada a esta cuenta (p. ej. entró antes de ligarla), se avisa
    const ligada = await db.user.findUnique({ where: { authId }, select: { id: true, username: true } });

    let userId: string;
    if (cuenta.perfil) {
      const persona = await db.user.findUnique({
        where: { username: cuenta.perfil },
        select: { id: true, authId: true },
      });
      if (!persona) fallar(`${cuenta.clave}: no existe @${cuenta.perfil}. Corre primero pnpm db:seed:demo.`);
      if (persona.authId && persona.authId !== authId)
        fallar(`${cuenta.clave}: @${cuenta.perfil} ya está ligado a otra cuenta.`);
      if (ligada && ligada.id !== persona.id)
        fallar(`${cuenta.clave}: esta cuenta ya tiene a @${ligada.username}; bórralo antes.`);
      const correoLibre = !(await db.user.findFirst({
        where: { email, NOT: { id: persona.id } },
        select: { id: true },
      }));
      await db.user.update({
        where: { id: persona.id },
        data: { authId, claimedAt: new Date(), ...(correoLibre ? { email } : {}) },
      });
      userId = persona.id;
    } else {
      const datos = { ...cuenta.nueva!, email, claimedAt: new Date() };
      if (ligada) {
        await db.user.update({ where: { id: ligada.id }, data: datos });
        userId = ligada.id;
      } else {
        const tomado = await db.user.findUnique({ where: { username: cuenta.clave }, select: { id: true } });
        const creado = await db.user.create({
          data: {
            ...datos,
            authId,
            username: tomado ? `${cuenta.clave}-prueba` : cuenta.clave,
            activeRole: "JUGADOR",
          },
          select: { id: true },
        });
        userId = creado.id;
      }
    }
    if (cuenta.roles.length) {
      await db.userRole.createMany({
        data: cuenta.roles.map((role) => ({ userId, role })),
        skipDuplicates: true,
      });
    }
    filas.push({ cuenta, email, password });
    console.log(`✓ ${cuenta.clave.padEnd(10)} → ${cuenta.entraComo}`);
  }

  const contenido = [
    "# Cuentas de prueba de Chilena",
    "",
    "> **No se sube a GitHub** (está en `.gitignore`). Solo para probar `chilena-dev`: https://chilena.vercel.app y http://localhost:3000.",
    "> Las crea `npx tsx scripts/cuentas-de-prueba.ts` (con `--rotar` cambian todas las contraseñas).",
    "",
    "Entra en **/entrar → Entrar con cuenta de prueba**. No hay registro con contraseña: solo estas cuentas.",
    "",
    "| Cuenta | Correo | Contraseña | Entra como |",
    "|---|---|---|---|",
    ...filas.map((f) => `| ${f.cuenta.clave} | ${f.email} | \`${f.password}\` | ${f.cuenta.entraComo} |`),
    "",
    `Actualizado: ${new Date().toISOString()}`,
    "",
  ].join("\n");
  writeFileSync(ARCHIVO, contenido);
  chmodSync(ARCHIVO, 0o600);
  console.log(`\nContraseñas en ${ARCHIVO} (${rotar ? "todas nuevas" : "se conservan las que ya estaban"}).`);
}

main()
  .catch((e) => fallar(e instanceof Error ? e.message : String(e)))
  .finally(() => db.$disconnect());
