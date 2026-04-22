/**
 * Stub cohort data used for the beta leaderboard until we have real users to
 * compare against. Per Perplexity brief, this is slated to be hidden in a later
 * session — leave it in place for Session 0 to match v0 verbatim.
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

export const COHORT_BASE: CohortMember[] = [
  { name: "Maya P.", xp: 18420, streak: 41, crown: true },
  { name: "Jamie L.", xp: 16980, streak: 38 },
  { name: "Tom R.", xp: 14250, streak: 29 },
  { name: "Ciaran W.", xp: 11840, streak: 19 },
  { name: "Priya A.", xp: 10500, streak: 15 },
  { name: "Noah F.", xp: 9820, streak: 12 },
];

/** Insert the current user into the cohort and rank by XP, highest first. */
export function computeCohort(userXp: number, userStreak: number): RankedCohortMember[] {
  const all: Array<CohortMember & { isUser?: boolean }> = [
    ...COHORT_BASE.map((p) => ({ ...p })),
    { name: "You", xp: userXp, streak: userStreak, isUser: true },
  ];
  all.sort((a, b) => b.xp - a.xp);
  return all.map((p, i) => ({ ...p, rank: i + 1 }));
}
