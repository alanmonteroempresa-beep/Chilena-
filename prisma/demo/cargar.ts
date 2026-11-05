// Carga la liga demo (SEED_DEMO=1). Solo para chilena-dev: la semilla de producción carga flags e
// insignias y nada más (docs/SETUP.md §4).
//
// Seguridad:
//  - Borra SOLO filas con los IDs fijos de la demo (UUID v5 de prisma/demo/azar.ts): ninguna fila real
//    puede tener esos IDs. Nada se borra por slug o username.
//  - Se niega a correr en producción y en una base que ya tiene otras ligas (¿es beta?), salvo
//    SEED_DEMO_FORZAR=1.
//  - Si un username o slug de la demo ya lo usa alguien más, se detiene y lo dice.
//  - Los perfiles demo que alguien ya reclamó (authId) se conservan: nunca se duplica la persona.
import type { PrismaClient } from "../../src/generated/prisma/client";
import { armarLigaDemo, type PlanDemo } from "./plan";

type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export class SemillaDemoError extends Error {}

function idsDe(plan: PlanDemo) {
  const ids = (filas: { id?: string }[]) => filas.map((f) => f.id!).filter(Boolean);
  const usuarios = ids(plan.users);
  const partidos = ids(plan.matches);
  const equipos = ids(plan.teams);
  const jornadas = ids(plan.rounds);
  const todos = [
    ...usuarios,
    ...partidos,
    ...equipos,
    ...jornadas,
    plan.league.id!,
    plan.venue.id!,
    plan.tournament.id!,
    ...ids(plan.fields),
    ...ids(plan.teamMembers),
    ...ids(plan.tournamentTeams),
    ...ids(plan.tournamentRosters),
    ...ids(plan.lineups),
    ...ids(plan.matchEvents),
    ...ids(plan.matchReports),
    ...ids(plan.sanctions),
    ...ids(plan.leagueCharges),
    ...ids(plan.refereePayments),
    ...ids(plan.teamDues),
  ];
  return { usuarios, partidos, equipos, jornadas, todos };
}

async function revisarAntesDeBorrar(tx: Tx, plan: PlanDemo, ids: ReturnType<typeof idsDe>, forzar: boolean) {
  // ¿Es la base de beta? Una base con ligas reales no debe recibir la demo.
  const otrasLigas = await tx.league.count({ where: { id: { not: plan.league.id! } } });
  if (otrasLigas > 0 && !forzar) {
    throw new SemillaDemoError(
      `Esta base ya tiene ${otrasLigas} liga(s) que no son la demo. Si de verdad es chilena-dev, ` +
        "corre con SEED_DEMO_FORZAR=1. En beta la demo no va.",
    );
  }

  // Choques de nombres únicos con filas que NO son de la demo
  const choques = [
    ...(
      await tx.user.findMany({
        where: { username: { in: plan.claves.usernames }, id: { notIn: ids.usuarios } },
        select: { username: true },
      })
    ).map((u) => `usuario "${u.username}"`),
    ...(
      await tx.team.findMany({
        where: { slug: { in: plan.claves.equipoSlugs }, id: { notIn: ids.equipos } },
        select: { slug: true },
      })
    ).map((t) => `equipo "${t.slug}"`),
    ...(
      await tx.league.findMany({
        where: {
          OR: [{ slug: plan.league.slug }, { codigoAcceso: plan.league.codigoAcceso }],
          id: { not: plan.league.id! },
        },
        select: { slug: true },
      })
    ).map((l) => `liga "${l.slug}"`),
    ...(
      await tx.venue.findMany({
        where: { slug: plan.venue.slug, id: { not: plan.venue.id! } },
        select: { slug: true },
      })
    ).map((v) => `sede "${v.slug}"`),
  ];
  if (choques.length) {
    throw new SemillaDemoError(
      `La demo choca con datos que no son suyos: ${choques.join(", ")}. Renómbralos o usa otra base.`,
    );
  }

  // Retas de equipos demo contra equipos de verdad: borrar un equipo las arrastraría en cascada
  const partidosAjenos = await tx.match.count({
    where: {
      OR: [{ homeTeamId: { in: ids.equipos } }, { awayTeamId: { in: ids.equipos } }],
      id: { notIn: ids.partidos },
    },
  });
  const retas = await tx.challenge.count({
    where: { OR: [{ fromTeamId: { in: ids.equipos } }, { toTeamId: { in: ids.equipos } }] },
  });
  if ((partidosAjenos > 0 || retas > 0) && !forzar) {
    throw new SemillaDemoError(
      `Hay ${partidosAjenos} partido(s) y ${retas} reta(s) de equipos demo fuera de la demo; ` +
        "se borrarían con ellos. Revísalos o corre con SEED_DEMO_FORZAR=1.",
    );
  }
}

/** Borra la corrida anterior de la demo, solo por sus IDs fijos */
async function borrarDemo(tx: Tx, plan: PlanDemo, ids: ReturnType<typeof idsDe>, reclamados: Set<string>) {
  const sinReclamar = ids.usuarios.filter((id) => !reclamados.has(id));

  // Lo que la app generó encima de la demo (auto-posts, bitácora, jobs y avisos)
  await tx.post.deleteMany({
    where: {
      OR: [
        { matchId: { in: ids.partidos } },
        { teamId: { in: ids.equipos } },
        { roundId: { in: ids.jornadas } },
        { leagueId: plan.league.id! },
        { tournamentId: plan.tournament.id! },
        { authorId: { in: sinReclamar } },
        { subjectUserId: { in: sinReclamar } },
      ],
    },
  });
  await tx.auditLog.deleteMany({ where: { entityId: { in: ids.todos } } });
  const patrones = ids.todos.map((id) => `%${id}%`);
  await tx.$executeRaw`DELETE FROM jobs WHERE "dedupeKey" LIKE ANY (${patrones}) OR payload::text LIKE ANY (${patrones})`;
  await tx.$executeRaw`DELETE FROM notifications WHERE href LIKE ANY (${patrones}) OR data::text LIKE ANY (${patrones})`;

  // La liga arrastra torneo, jornadas, partidos, cédulas, tabla, sanciones, cobros y pagos
  await tx.league.deleteMany({ where: { id: plan.league.id! } });
  await tx.match.deleteMany({ where: { id: { in: ids.partidos } } });
  await tx.team.deleteMany({ where: { id: { in: ids.equipos } } });
  await tx.venue.deleteMany({ where: { id: plan.venue.id! } });

  // Perfiles reclamados: se quedan; solo se reponen los roles de la demo
  const rolesReclamados = plan.userRoles.filter((r) => reclamados.has(r.userId));
  if (rolesReclamados.length) {
    await tx.userRole.deleteMany({
      where: { OR: rolesReclamados.map((r) => ({ userId: r.userId, role: r.role })) },
    });
  }
  await tx.user.deleteMany({ where: { id: { in: sinReclamar } } });
}

export async function cargarLigaDemo(db: PrismaClient, opciones: { hoy?: Date; forzar?: boolean } = {}) {
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    throw new SemillaDemoError("La liga demo no se carga en producción.");
  }
  const plan = armarLigaDemo({ hoy: opciones.hoy });
  const ids = idsDe(plan);

  const reclamados = await db.$transaction(
    async (tx) => {
      await revisarAntesDeBorrar(tx, plan, ids, opciones.forzar ?? false);
      const reclamados = new Set(
        (
          await tx.user.findMany({
            where: { id: { in: ids.usuarios }, authId: { not: null } },
            select: { id: true },
          })
        ).map((u) => u.id),
      );
      await borrarDemo(tx, plan, ids, reclamados);
      const nuevo = <T extends { id?: string; userId?: string }>(filas: T[]) =>
        filas.filter((f) => !reclamados.has((f.userId ?? f.id)!));

      // Personas (los delegados primero: dan de alta a los demás)
      const usuarios = nuevo(plan.users);
      await tx.user.createMany({ data: usuarios.filter((u) => !u.createdById) });
      await tx.user.createMany({ data: usuarios.filter((u) => u.createdById) });
      await tx.userRole.createMany({ data: plan.userRoles, skipDuplicates: true });
      await tx.playerProfile.createMany({ data: nuevo(plan.playerProfiles) });
      await tx.refereeProfile.createMany({ data: nuevo(plan.refereeProfiles) });
      // A los reclamados se les respeta su perfil; solo se actualiza lo que sale de partidos validados
      for (const p of plan.playerProfiles.filter((x) => reclamados.has(x.userId))) {
        const { partidos, goles, asistencias, amarillas, rojas } = p;
        await tx.playerProfile.upsert({
          where: { userId: p.userId },
          create: p,
          update: { partidos, goles, asistencias, amarillas, rojas },
        });
      }
      for (const r of plan.refereeProfiles.filter((x) => reclamados.has(x.userId))) {
        await tx.refereeProfile.upsert({
          where: { userId: r.userId },
          create: r,
          update: { partidosPitados: r.partidosPitados },
        });
      }

      // Liga, sede y árbitros
      await tx.league.create({ data: plan.league });
      await tx.leagueAdmin.createMany({ data: plan.leagueAdmins });
      await tx.venue.create({ data: plan.venue });
      await tx.field.createMany({ data: plan.fields });
      await tx.leagueVenue.createMany({ data: plan.leagueVenues });
      await tx.leagueReferee.createMany({ data: plan.leagueReferees });

      // Equipos
      await tx.team.createMany({ data: plan.teams });
      await tx.teamMember.createMany({ data: plan.teamMembers });

      // Torneo
      await tx.tournament.create({ data: plan.tournament });
      await tx.tournamentTeam.createMany({ data: plan.tournamentTeams });
      await tx.tournamentRoster.createMany({ data: plan.tournamentRosters });
      await tx.tournamentReferee.createMany({ data: plan.tournamentReferees });
      await tx.round.createMany({ data: plan.rounds });

      // Partidos, alineaciones, eventos y cédulas
      await tx.match.createMany({ data: plan.matches });
      await tx.lineup.createMany({ data: plan.lineups });
      await tx.lineupPlayer.createMany({ data: plan.lineupPlayers });
      await tx.matchEvent.createMany({ data: plan.matchEvents });
      await tx.matchReport.createMany({ data: plan.matchReports });
      await tx.liveScoreUpdate.createMany({ data: plan.liveScoreUpdates });

      // Lo que sale de validar: sanciones, tabla, estadísticas y bitácora
      await tx.sanction.createMany({ data: plan.sanctions });
      await tx.standingRow.createMany({ data: plan.standings });
      await tx.playerTournamentStat.createMany({ data: plan.playerTournamentStats });
      await tx.auditLog.createMany({ data: plan.auditLogs });

      // Dinero (solo control)
      await tx.leagueCharge.createMany({ data: plan.leagueCharges });
      await tx.refereePayment.createMany({ data: plan.refereePayments });
      await tx.teamDue.createMany({ data: plan.teamDues });
      await tx.teamDuePayment.createMany({ data: plan.teamDuePayments });

      // Pase de lista de la J16 y seguidores
      await tx.attendanceLink.createMany({ data: plan.attendanceLinks });
      await tx.matchAttendance.createMany({ data: plan.matchAttendances });
      await tx.teamFollow.createMany({ data: plan.teamFollows, skipDuplicates: true });
      await tx.userFollow.createMany({ data: plan.userFollows, skipDuplicates: true });
      await tx.leagueFollow.createMany({ data: plan.leagueFollows, skipDuplicates: true });

      // Contadores denormalizados de las personas de la demo, a partir de los follows reales
      await tx.$executeRaw`
        UPDATE users u SET
          "followersCount" = (SELECT count(*) FROM user_follows f WHERE f."followedId" = u.id),
          "followingCount" = (SELECT count(*) FROM user_follows f WHERE f."followerId" = u.id)
        WHERE u.id = ANY (${ids.usuarios}::uuid[])`;
      return reclamados;
    },
    { timeout: 120_000, maxWait: 20_000 },
  );

  return { plan, reclamados: reclamados.size };
}
