/**
 * Cohort data layer. The stub leaderboard shipped with v0 was removed in
 * Session 10a — real cohort comparison unlocks once we have enough users
 * to avoid showing fake rank data. See Perplexity brief: "hide entirely
 * until there is enough real data."
 *
 * The types stay here so Session 11+ can wire a real backend (Supabase
 * aggregate query or similar) behind the same shape and the CohortView
 * can re-light without a rewrite.
 */

export type CohortMember = {
  name: string;
  xp: number;
  streak: number;
  crown?: boolean;
};

export type RankedCohortMember = CohortMember & {
  rank: number;
  isUser?: boolean;
};

/**
 * Returns null until real cohort data is wired. Previously this inserted the
 * current user into a hardcoded leaderboard — that's gone. Callers should
 * render an empty-state when null.
 */
export function computeCohort(_userXp: number, _userStreak: number): RankedCohortMember[] | null {
  return null;
}
