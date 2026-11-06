import { ForbiddenError } from "./errors";

/**
 * Permisos (docs/PERMISOS.md). Se calculan POR RELACIÓN (¿es delegado de ESTE equipo?),
 * nunca por el rol activo. Cada fila de PERMISOS.md debe tener su regla y su test.
 *
 * Fase 1: implementar las reglas en ./rules/*.ts y registrarlas en `rules` abajo.
 */
export type Action =
  | "post.create"
  | "post.react"
  | "user.follow"
  | "content.report"
  | "post.createAsTeam"
  | "post.createAsLeague"
  | "comment.create"
  | "content.moderate"
  | "team.edit"
  | "team.addPlayer"
  | "team.removeMember"
  | "team.register"
  | "attendance.sendLink"
  | "lineup.submit"
  | "match.reportLiveScore"
  | "match.requestSuspension"
  | "match.suspend"
  | "report.capture"
  | "report.sign"
  | "report.requestCorrection"
  | "report.respondCorrection"
  | "match.validate"
  | "tournament.manage"
  | "sanction.create"
  | "money.confirmPayment"
  | "poll.vote"
  | "respect.vote";

export type AuthzContext = {
  teamId?: string;
  leagueId?: string;
  matchId?: string;
  tournamentId?: string;
  targetUserId?: string;
};

type Rule = (userId: string, ctx: AuthzContext) => Promise<boolean>;

/** Reglas registradas. Lo que no tiene regla, se NIEGA. */
const rules: Partial<Record<Action, Rule>> = {};

export function registerRule(action: Action, rule: Rule) {
  rules[action] = rule;
}

export async function can(userId: string | null, action: Action, ctx: AuthzContext = {}): Promise<boolean> {
  if (!userId) return false;
  const rule = rules[action];
  if (!rule) return false;
  return rule(userId, ctx);
}

export async function assertCan(userId: string | null, action: Action, ctx: AuthzContext = {}) {
  if (!(await can(userId, action, ctx))) throw new ForbiddenError();
}
