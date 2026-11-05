// Carga la liga demo (SEED_DEMO=1). Borra la demo anterior y la vuelve a crear en una transacción.
// Solo para chilena-dev: la semilla de producción carga flags e insignias y nada más (docs/SETUP.md §4).
import type { PrismaClient } from "../../src/generated/prisma/client";
import { armarLigaDemo, type PlanDemo } from "./plan";

/** Borra lo que creó una corrida anterior (identificado por slugs y usernames de la demo) */
async function borrarDemo(tx: Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0], plan: PlanDemo) {
  const { ligaSlug, sedeSlug, equipoSlugs, usernames } = plan.claves;
  const equipos = await tx.team.findMany({ where: { slug: { in: equipoSlugs } }, select: { id: true } });
  const equipoIds = equipos.map((e) => e.id);
  const usuarios = await tx.user.findMany({ where: { username: { in: usernames } }, select: { id: true } });
  const usuarioIds = usuarios.map((u) => u.id);

  // La liga arrastra torneos, partidos, cédulas, tabla, cobros y pagos (onDelete: Cascade)
  await tx.league.deleteMany({ where: { slug: ligaSlug } });
  // Partidos sueltos de los equipos demo (retas) antes de borrar equipos
  await tx.match.deleteMany({
    where: { OR: [{ homeTeamId: { in: equipoIds } }, { awayTeamId: { in: equipoIds } }] },
  });
  await tx.team.deleteMany({ where: { id: { in: equipoIds } } });
  await tx.venue.deleteMany({ where: { slug: sedeSlug } });
  // Quita referencias sin cascada hacia los usuarios demo antes de borrarlos
  await tx.matchEvent.deleteMany({ where: { createdById: { in: usuarioIds } } });
  await tx.user.updateMany({ where: { createdById: { in: usuarioIds } }, data: { createdById: null } });
  await tx.user.deleteMany({ where: { id: { in: usuarioIds } } });
}

export async function cargarLigaDemo(db: PrismaClient, opciones: { hoy?: Date } = {}) {
  const plan = armarLigaDemo({ hoy: opciones.hoy });

  await db.$transaction(
    async (tx) => {
      await borrarDemo(tx, plan);

      // Personas (los delegados primero: dan de alta a los demás)
      const delegados = plan.users.filter((u) => !u.createdById);
      await tx.user.createMany({ data: delegados });
      await tx.user.createMany({ data: plan.users.filter((u) => u.createdById) });
      await tx.userRole.createMany({ data: plan.userRoles });
      await tx.playerProfile.createMany({ data: plan.playerProfiles });
      await tx.refereeProfile.createMany({ data: plan.refereeProfiles });

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

      // Lo que sale de validar: sanciones, tabla y estadísticas
      await tx.sanction.createMany({ data: plan.sanctions });
      await tx.standingRow.createMany({ data: plan.standings });
      await tx.playerTournamentStat.createMany({ data: plan.playerTournamentStats });

      // Dinero (solo control)
      await tx.leagueCharge.createMany({ data: plan.leagueCharges });
      await tx.refereePayment.createMany({ data: plan.refereePayments });
      await tx.teamDue.createMany({ data: plan.teamDues });
      await tx.teamDuePayment.createMany({ data: plan.teamDuePayments });

      // Pase de lista de la J16 y seguidores
      await tx.attendanceLink.createMany({ data: plan.attendanceLinks });
      await tx.matchAttendance.createMany({ data: plan.matchAttendances });
      await tx.teamFollow.createMany({ data: plan.teamFollows });
      await tx.userFollow.createMany({ data: plan.userFollows });
      await tx.leagueFollow.createMany({ data: plan.leagueFollows });
    },
    { timeout: 120_000, maxWait: 20_000 },
  );

  return plan;
}
