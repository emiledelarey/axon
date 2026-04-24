import type { Card } from "./api-types";
import type { ExamAttempt, ExamQuestion } from "./state";

/**
 * Build an ordered list of exam questions from a deck. We take the first N
 * cards in current deck order — rotation strategy is Session 7+ scope.
 */
export function buildExamQuestions(cards: Card[], count: number): ExamQuestion[] {
  const take = Math.min(Math.max(count, 1), cards.length);
  return cards.slice(0, take).map((card) => ({
    cardId: card.id,
    studentAnswer: "",
    correct: null,
    timeMs: 0,
    flagged: false,
  }));
}

/** Fraction 0..1 of questions marked correct. null while still ungraded. */
export function scoreOf(attempt: ExamAttempt): number | null {
  if (attempt.questions.length === 0) return null;
  const graded = attempt.questions.filter((q) => q.correct !== null);
  if (graded.length === 0) return null;
  const right = graded.filter((q) => q.correct === true).length;
  return right / attempt.questions.length;
}

/**
 * Top-N concepts the student got wrong in this attempt, sorted by miss order
 * (stable — first-missed first). Used in the results view to point at what to
 * rebuild next.
 */
export function missedConcepts(
  attempt: ExamAttempt,
  cards: Card[],
  limit = 5,
): Array<{ cardId: string; concept: string }> {
  const byId = new Map(cards.map((c) => [c.id, c]));
  const out: Array<{ cardId: string; concept: string }> = [];
  for (const q of attempt.questions) {
    if (q.correct === false) {
      const card = byId.get(q.cardId);
      if (card) out.push({ cardId: q.cardId, concept: card.concept });
      if (out.length >= limit) break;
    }
  }
  return out;
}

/** Mean time per answered question, in milliseconds. Null if nothing timed. */
export function meanTimePerQuestion(attempt: ExamAttempt): number | null {
  const timed = attempt.questions.filter((q) => q.timeMs > 0);
  if (timed.length === 0) return null;
  return timed.reduce((sum, q) => sum + q.timeMs, 0) / timed.length;
}

/** Format milliseconds as "m:ss" for timers + durations. */
export function formatMs(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
