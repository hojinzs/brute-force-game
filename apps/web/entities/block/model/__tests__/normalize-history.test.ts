import { normalizeBlockHistoryEntry } from "../normalize-history";

describe("normalizeBlockHistoryEntry", () => {
  it("maps API camelCase fields into frontend snake_case fields", () => {
    const result = normalizeBlockHistoryEntry({
      id: 42,
      status: "SOLVED",
      seedHint: "hint",
      accumulatedPoints: 9001,
      winner: { id: "u1", nickname: "Alice" },
      solvedAt: "2026-02-04T00:00:00.000Z",
      attemptCount: 123,
      solvedAnswer: "p@ssw0rd",
    });

    expect(result).toEqual({
      block_id: 42,
      status: "solved",
      seed_hint: "hint",
      created_at: "2026-02-04T00:00:00.000Z",
      solved_at: "2026-02-04T00:00:00.000Z",
      winner_id: "u1",
      accumulated_points: 9001,
      solved_attempt_id: null,
      winner_nickname: "Alice",
      solved_answer: "p@ssw0rd",
      total_attempts: 123,
      unique_participants: 0,
    });
  });
});
