# Chilena — Montaje gratis (Supabase + Vercel + GitHub)

> Todo con planes gratuitos. Hazlo una vez; el que sea dueño del schema corre las migraciones.

## 1. GitHub
1. Crea el repo privado `chilena` y sube esta carpeta (`CLAUDE.md`, `docs/`, `prisma/`, `.env.example`, `.gitignore`).
2. Agrega a tu hermano como colaborador.
3. Settings → Branches → protege `main`: PR obligatorio, 1 aprobación y checks de CI.

## 2. Supabase (plan Free: 2 proyectos)
Crea **dos proyectos** en la región más cercana (por ejemplo `us-east-1`):
- `chilena-dev`: pruebas de los dos devs. Se puede borrar y re-sembrar.
- `chilena-beta`: el que usará la gente de la beta.

En cada uno:
1. **Database → Extensions:** activa `pg_trgm`, `unaccent`, `pg_cron` y `pg_net`.
2. **Authentication → Providers:**
   - **Google:** crea credenciales OAuth en Google Cloud Console y pega Client ID y Secret. En Google Cloud, el **Authorized redirect URI** es `https://<ref>.supabase.co/auth/v1/callback` y los **orígenes** `https://chilena.vercel.app` y `http://localhost:3000`. Al terminar se prende el flag `auth.google` (tabla `feature_flags`).
   - **Email:** activa el link mágico.
   - *El correo de Supabase gratis manda muy pocos correos por hora y solo a los miembros de la organización de Supabase.* Para la beta conecta **Resend** (plan gratis) en Authentication → SMTP. Con SMTP propio ya se pueden editar las plantillas: en **Magic link** y **Confirm sign up** cambia el link a `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`. Así el link funciona aunque se abra en otro navegador (`/auth/confirm` acepta `token_hash` y `code`).
3. **Authentication → URL Configuration:** Site URL = tu URL de Vercel; agrega `http://localhost:3000` en Redirect URLs.
4. **Storage:** crea el bucket público `avatars` (límite de 1 MB por archivo, solo `image/webp` e `image/jpeg`).
5. **Project Settings → Database:** copia la cadena del **pooler** (puerto 6543) → `DATABASE_URL` y la **directa** (puerto 5432) → `DIRECT_URL`.
6. **Project Settings → API:** copia la URL, la `anon key` y la `service_role key`.

**Con el CLI en lugar del dashboard** (así se montó `chilena-dev`): `scripts/supabase-dev.mjs` hace los pasos 1, 4, 5 y 6 sin mostrar secretos. Carga `.env.local` por dentro, solo imprime nombres de variables y tapa cualquier secreto en los errores. Necesita `SUPABASE_DB_PASSWORD` en `.env.local` y una sesión del CLI (`pnpm dlx supabase login`).
```bash
node scripts/supabase-dev.mjs contrasena    # opcional: guarda la contraseña copiada al portapapeles y lo vacía
SUPABASE_PROJECT_REF=<ref> node scripts/supabase-dev.mjs link
node scripts/supabase-dev.mjs env           # llaves publishable/secret, DATABASE_URL (6543) y DIRECT_URL (5432)
node scripts/supabase-dev.mjs ping          # SELECT 1 por las dos
node scripts/supabase-dev.mjs extensiones
node scripts/supabase-dev.mjs cron-secret   # solo si falta
# … migraciones (§4) y semilla …
node scripts/supabase-dev.mjs bucket
node scripts/supabase-dev.mjs conteos
node scripts/supabase-dev.mjs app           # con pnpm dev corriendo
```
- `DIRECT_URL` usa el pooler en **modo sesión** (puerto 5432 del mismo host del pooler), no `db.<ref>.supabase.co`: esa conexión directa solo tiene IPv6.
- `pg_cron` va en `pg_catalog` y `pg_net` crea su schema `net` (docs de Supabase). `pg_trgm` y `unaccent` van en `public` porque `immutable_unaccent()` usa `public.unaccent`.
- Si la contraseña falla con `password authentication failed`, resetéala en Settings → Database y confirma el diálogo; el reseteo tarda unos segundos en aplicarse.

**Cuentas de prueba (beta interna, solo `chilena-dev`):** con el flag `auth.demo_login` prendido (`node scripts/supabase-dev.mjs flag auth.demo_login on`), la pantalla Entrar muestra "Entrar con cuenta de prueba".
```bash
npx tsx scripts/cuentas-de-prueba.ts           # crea las que falten y las liga a la semilla demo
npx tsx scripts/cuentas-de-prueba.ts --rotar   # contraseñas nuevas para todas
```
- Las contraseñas solo se guardan en `CUENTAS-DE-PRUEBA.md`, en la raíz. Está en `.gitignore`: **nunca se sube**; compártelo por fuera de GitHub.
- Solo entran cuentas `@prueba.chilena` que traen la marca `app_metadata.cuenta_de_prueba`, que solo pone la API de administración. Nadie puede registrarse con contraseña.
- Si vuelves a correr `pnpm db:seed:demo`, los perfiles ligados se conservan (son perfiles reclamados).

> El plan Free **pausa el proyecto tras ~7 días sin actividad**. Si pasa, se reactiva con un clic en el dashboard. Para la beta con uso semanal no debería pasar.

## 3. Variables y llaves
```bash
cp .env.example .env.local        # y llénalo con chilena-dev
npx web-push generate-vapid-keys  # llaves de push
openssl rand -hex 32              # CRON_SECRET
```

## 4. Base de datos
```bash
pnpm prisma migrate dev --name init
pnpm prisma migrate dev --create-only --name extras   # pega prisma/sql/001_extras.sql en el migration.sql
pnpm prisma migrate dev
pnpm prisma db seed
```
Liga demo (solo `chilena-dev`): `pnpm db:seed:demo`. Borra la demo anterior y la vuelve a crear con IDs fijos, así las URLs no cambian. Las fechas se calculan desde hoy (la J16 cae el próximo domingo). Con `SEED_HOY=2026-10-12 pnpm db:seed:demo` salen las fechas exactas del deck (J15 el domingo 11 de octubre). Guardias: solo borra filas con los IDs de la demo; no corre en producción; se detiene si la base ya tiene otras ligas (si es chilena-dev, `SEED_DEMO_FORZAR=1`) o si un username o slug de la demo ya lo usa alguien más. Los perfiles demo que alguien reclamó se conservan.
Para `chilena-beta`: `pnpm prisma migrate deploy` con las URLs de ese proyecto. La semilla de producción carga **solo** flags e insignias, no la liga demo.

### Jobs con pg_cron (en el SQL editor de cada proyecto)
```sql
select cron.schedule('trabajos', '* * * * *', $$
  select net.http_post(url := 'https://TU-APP.vercel.app/api/cron/trabajos',
    headers := jsonb_build_object('Authorization', 'Bearer TU_CRON_SECRET'));
$$);
select cron.schedule('recordatorios', '*/15 * * * *', $$
  select net.http_post(url := 'https://TU-APP.vercel.app/api/cron/recordatorios',
    headers := jsonb_build_object('Authorization', 'Bearer TU_CRON_SECRET'));
$$);
select cron.schedule('votaciones', '*/15 * * * *', $$
  select net.http_post(url := 'https://TU-APP.vercel.app/api/cron/votaciones',
    headers := jsonb_build_object('Authorization', 'Bearer TU_CRON_SECRET'));
$$);
```

## 5. Vercel (plan Hobby)
1. New Project → importa el repo de GitHub.
2. Agrega las variables de `.env.example`: en **Production** las de `chilena-beta`, en **Preview** las de `chilena-dev`.
3. Cada PR genera su URL de vista previa; `main` se publica en `chilena-xxxx.vercel.app`.

**Así quedó `chilena` (con el CLI, sin mostrar secretos):**
- Proyecto `alan-montero/chilena`, conectado al repo, rama de producción `main`, URL **https://chilena.vercel.app**.
- Variables con `scripts/vercel-env.mjs` (lee `.env.local` por dentro y manda cada valor por stdin):
  ```bash
  node scripts/vercel-env.mjs vapid https://chilena.vercel.app   # llaves VAPID si faltan + VAPID_SUBJECT
  node scripts/vercel-env.mjs subir                              # Production y Preview
  node scripts/vercel-env.mjs app-url https://chilena.vercel.app # NEXT_PUBLIC_APP_URL solo en Production
  node scripts/vercel-env.mjs nombres                            # qué hay en Vercel (solo nombres)
  ```
- Por ahora Production y Preview usan `chilena-dev`; cuando exista `chilena-beta`, Production se cambia a ese proyecto.
- Las vistas previas piden sesión de Vercel (protección estándar); `chilena.vercel.app` es pública.
- Supabase → Authentication → URL Configuration: Site URL `https://chilena.vercel.app`; Redirect URLs `https://chilena.vercel.app/**`, `http://localhost:3000/**` y `https://*-alan-montero.vercel.app/**` (vistas previas).
4. Crons diarios en `vercel.json`:
```json
{ "crons": [
  { "path": "/api/cron/lunes",    "schedule": "0 12 * * 1" },
  { "path": "/api/cron/nocturno", "schedule": "0 9 * * *" }
] }
```
(Horas en UTC: 12:00 UTC = 06:00 en CDMX y 09:00 UTC = 03:00 en CDMX. En Hobby la hora exacta puede variar dentro de esa hora.)

> Vercel Hobby es para proyectos personales y no comerciales. Para una beta gratuita de prueba está bien; al lanzar la versión oficial con cobros se pasa a Pro.

## 6. Monitoreo (gratis)
- **Sentry:** proyecto Next.js → `SENTRY_DSN`.
- **PostHog:** proyecto → `NEXT_PUBLIC_POSTHOG_KEY`.

## 7. Diseños
Exporta las pantallas de Claude Design a `docs/diseno/` (ver `docs/DISENO.md` §7) **antes de la Fase 0**, y el logo a `public/brand/` (`logo.svg`, `logo-blanco.svg`, `icono-512.png`).

## 8. Cada dev en su Mac
```bash
git clone git@github.com:TU_USUARIO/chilena.git && cd chilena
cp .env.example .env.local   # llaves de chilena-dev
pnpm install && pnpm dev
claude                       # Claude Code en la raíz del repo: lee CLAUDE.md solo
```
