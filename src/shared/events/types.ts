// Contrato entre módulos (docs/MODULOS.md §2). Si cambias un payload, avisa al otro dev.
export type DomainEvents = {
  "user.claimed": { userId: string };
  "team.member_joined": { teamId: string; userId: string };
  "attendance.responded": { matchId: string; userId: string; status: string };
  "attendance.link_opened": { matchId: string; teamId: string; byUserId: string };
  "match.correction_answered": { matchId: string; correctionId: string; accepted: boolean };
  "match.started": { matchId: string };
  "match.live_score_updated": { matchId: string; home: number; away: number; minute?: number };
  "match.report_submitted": { matchId: string; reportId: string };
  "match.report_signed": { matchId: string; reportId: string; side: "home" | "away" };
  "match.correction_requested": { matchId: string; correctionId: string };
  "match.validated": { matchId: string; tournamentId: string | null; roundId: string | null };
  "round.closed": { roundId: string; tournamentId: string };
  "poll.opened": { pollId: string; type: string; matchId: string | null; closesAt: string };
  "poll.closed": { pollId: string; winnerOptionId: string | null; type: string; matchId: string | null; winnerUserId: string | null };
  "tournament.finished": { tournamentId: string; championTeamId: string | null };
  "post.created": { postId: string };
  "post.reacted": { postId: string; userId: string; type: string };
  "user.followed": { followerId: string; followedUserId?: string; teamId?: string };
  "comment.created": { commentId: string; postId: string | null };
  "badge.awarded": { userId: string; badgeCode: string };
  "card.recalculated": { userId: string; media: number | null; delta: number };
};

export type DomainEventName = keyof DomainEvents;
