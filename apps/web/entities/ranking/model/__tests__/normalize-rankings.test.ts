import { normalizeRankingsResponse } from "../normalize";

describe("normalizeRankingsResponse", () => {
  it("maps API camelCase fields into frontend snake_case fields", () => {
    const result = normalizeRankingsResponse({
      totalUsers: 2,
      rankings: [
        { id: "u1", rank: 1, nickname: "Alice", totalPoints: "123" },
        { id: "u2", rank: 2, nickname: "Bob", totalPoints: "0" },
      ],
    });

    expect(result.totalUsers).toBe(2);
    expect(result.rankings).toEqual([
      { id: "u1", rank: 1, nickname: "Alice", total_points: 123 },
      { id: "u2", rank: 2, nickname: "Bob", total_points: 0 },
    ]);
  });

  it("returns safe defaults for null/undefined", () => {
    expect(normalizeRankingsResponse(undefined)).toEqual({
      rankings: [],
      totalUsers: 0,
    });
    expect(normalizeRankingsResponse(null)).toEqual({
      rankings: [],
      totalUsers: 0,
    });
  });
});
