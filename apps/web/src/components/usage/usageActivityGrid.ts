export type ActivityLevel = 0 | 1 | 2 | 3 | 4;

export interface ActivityCell {
  readonly day: string;
  readonly value: number;
  readonly level: ActivityLevel;
  /** Week column, counted from the week that holds the first day. */
  readonly week: number;
  /** 0 is Monday. */
  readonly weekday: number;
}

export interface ActivityGrid {
  readonly cells: readonly ActivityCell[];
  readonly weeks: number;
  readonly months: readonly { readonly week: number; readonly label: string }[];
  readonly activeDays: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function weekdayOf(day: string): number {
  return (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;
}

/**
 * Lays days out Monday-first in week columns and ranks active days into four levels. Ranks,
 * not magnitudes, so one heavy day does not flatten the rest of the window into level 1.
 */
export function buildActivityGrid(
  days: readonly string[],
  values: ReadonlyMap<string, number>,
): ActivityGrid {
  const first = days[0];
  if (first === undefined) return { cells: [], weeks: 0, months: [], activeDays: 0 };

  const offset = weekdayOf(first);
  const active = days
    .map((day) => values.get(day) ?? 0)
    .filter((value) => value > 0)
    .toSorted((a, b) => a - b);
  const levelOf = (value: number): ActivityLevel => {
    if (value <= 0) return 0;
    // Ties share the highest rank, so equal days share a level.
    let rank = 0;
    while (rank < active.length && (active[rank] ?? 0) <= value) rank += 1;
    return Math.max(1, Math.ceil((4 * rank) / active.length)) as ActivityLevel;
  };

  const cells = days.map((day, index) => {
    const value = values.get(day) ?? 0;
    return {
      day,
      value,
      level: levelOf(value),
      week: Math.floor((index + offset) / 7),
      weekday: (index + offset) % 7,
    };
  });
  const weeks = (cells.at(-1)?.week ?? 0) + 1;

  const months: { week: number; label: string }[] = [];
  for (const cell of cells) {
    const [, month, dayOfMonth] = cell.day.split("-").map(Number);
    if (month === undefined || (cell !== cells[0] && dayOfMonth !== 1)) continue;
    months.push({ week: cell.week, label: MONTHS[month - 1] ?? "" });
  }
  // A partial first month whose label would collide with the next one is dropped.
  if (months.length > 1 && (months[1]?.week ?? 0) - (months[0]?.week ?? 0) < 2) months.shift();

  return { cells, weeks, months, activeDays: active.length };
}
