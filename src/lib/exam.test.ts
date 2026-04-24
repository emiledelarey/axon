import { describe, expect, it } from "vitest";
import type { Card } from "./api-types";
import { buildExamQuestions, formatMs, meanTimePerQuestion, missedConcepts, scoreOf } from "./exam";
import type { ExamAttempt } from "./state";

function card(id: string, concept: string): Card {
  return {
    id,
    concept,
    front: "Front",
    question: "Q",
    answer: "A",
    working: "W",
    hint: "H",
  };
}

const CARDS: Card[] = [
  card("c1", "Opportunity cost"),
  card("c2", "Elasticity"),
  card("c3", "Marginal revenue"),
  card("c4", "Perfect competition"),
];

function baseAttempt(overrides: Partial<ExamAttempt> = {}): ExamAttempt {
  return {
    id: "exam_1",
    deckId: "deck_1",
    deckLabel: "Fundamentals",
    startedAt: new Date().toISOString(),
    endedAt: null,
    durationMs: null,
    questionCount: 4,
    timeLimitMs: null,
    questions: buildExamQuestions(CARDS, 4),
    score: null,
    ...overrides,
  };
}

describe("buildExamQuestions", () => {
  it("takes the first N cards in order, clamped to deck length", () => {
    const qs = buildExamQuestions(CARDS, 3);
    expect(qs.map((q) => q.cardId)).toEqual(["c1", "c2", "c3"]);
    expect(qs.every((q) => q.correct === null && q.timeMs === 0 && !q.flagged)).toBe(true);
  });

  it("clamps to at least 1 and at most deck length", () => {
    expect(buildExamQuestions(CARDS, 0)).toHaveLength(1);
    expect(buildExamQuestions(CARDS, 99)).toHaveLength(CARDS.length);
  });
});

describe("scoreOf", () => {
  it("returns null when no questions have been graded", () => {
    const a = baseAttempt();
    expect(scoreOf(a)).toBeNull();
  });

  it("is fraction correct of total questions (not of graded)", () => {
    const a = baseAttempt();
    a.questions[0].correct = true;
    a.questions[1].correct = true;
    a.questions[2].correct = false;
    a.questions[3].correct = null;
    expect(scoreOf(a)).toBeCloseTo(0.5, 4);
  });
});

describe("missedConcepts", () => {
  it("returns concepts for questions marked wrong, in ask order", () => {
    const a = baseAttempt();
    a.questions[0].correct = true;
    a.questions[1].correct = false;
    a.questions[2].correct = false;
    a.questions[3].correct = true;
    expect(missedConcepts(a, CARDS)).toEqual([
      { cardId: "c2", concept: "Elasticity" },
      { cardId: "c3", concept: "Marginal revenue" },
    ]);
  });

  it("honours the limit arg", () => {
    const a = baseAttempt();
    a.questions.forEach((q) => (q.correct = false));
    expect(missedConcepts(a, CARDS, 2)).toHaveLength(2);
  });
});

describe("meanTimePerQuestion", () => {
  it("averages only timed questions", () => {
    const a = baseAttempt();
    a.questions[0].timeMs = 1000;
    a.questions[1].timeMs = 3000;
    expect(meanTimePerQuestion(a)).toBe(2000);
  });

  it("returns null when nothing is timed", () => {
    expect(meanTimePerQuestion(baseAttempt())).toBeNull();
  });
});

describe("formatMs", () => {
  it("pads seconds with a leading zero", () => {
    expect(formatMs(65_000)).toBe("1:05");
    expect(formatMs(59_000)).toBe("0:59");
  });
  it("floors to zero for negatives", () => {
    expect(formatMs(-10)).toBe("0:00");
  });
});
