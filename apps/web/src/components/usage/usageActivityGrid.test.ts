import { describe, expect, it } from "vite-plus/test";

import { buildActivityGrid } from "./usageActivityGrid";

const days = (from: string, count: number) =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date(`${from}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });

describe("buildActivityGrid", () => {
  it("starts weeks on Monday so a Sunday window start sits at the bottom of the first column", () => {
    // 2026-11-01 is a Sunday.
    const grid = buildActivityGrid(days("2026-11-01", 8), new Map());
    expect(grid.cells.slice(0, 3).map(({ week, weekday }) => [week, weekday])).toEqual([
      [0, 6],
      [1, 0],
      [1, 1],
    ]);
    expect(grid.weeks).toBe(2);
  });

  it("ranks active days so one spike does not wash the others out", () => {
    const window = days("2026-11-02", 5);
    const values = new Map([
      [window[0]!, 10],
      [window[1]!, 20],
      [window[2]!, 30],
      [window[3]!, 1_000_000],
    ]);
    const grid = buildActivityGrid(window, values);
    expect(grid.cells.map((cell) => cell.level)).toEqual([1, 2, 3, 4, 0]);
    expect(grid.activeDays).toBe(4);
  });

  it("labels a month at the week holding its first day and drops a cramped partial lead month", () => {
    const grid = buildActivityGrid(days("2026-08-28", 70), new Map());
    expect(grid.months.map((month) => month.label)).toEqual(["Sep", "Oct", "Nov"]);
    expect(grid.months[0]!.week).toBe(1);
  });
});
