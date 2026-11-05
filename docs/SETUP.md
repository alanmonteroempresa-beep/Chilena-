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
   - **Google:** crea credenciales OAuth en Google Cloud Console y pega Client ID y Secret.
   - **Email:** activa el link mágico.
   - *El correo de Supabase gratis manda muy pocos correos por hora.* Para la beta conecta **Resend** (plan gratis) en Authentication → SMTP.
3. **Authentication → URL Configuration:** Site URL = tu URL de Vercel; agrega `http://localhost:3000` en Redirect URLs.
4. **Storage:** crea el bucket público `avatars` (límite de 1 MB por archivo, solo `image/webp` e `image/jpeg`).
5. **Project Settings → Database:** copia la cadena del **pooler** (puerto 6543) → `DATABASE_URL` y la **directa** (puerto 5432) → `DIRECT_URL`.
6. **Project Settings → API:** copia la URL, la `anon key` y la `service_role key`.

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
