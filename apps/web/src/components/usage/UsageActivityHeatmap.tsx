import type { DailyTotals } from "@t3tools/shared/usageMerge";
import { formatCount, formatDayShort, formatTokens, formatUsd } from "@t3tools/shared/usageFormat";
import { useState } from "react";

import { cn } from "~/lib/utils";
import { buildActivityGrid, type ActivityCell } from "./usageActivityGrid";

/** Ink share per level; level 0 is the empty well. */
const LEVEL_MIX = [0, 20, 38, 58, 84] as const;
const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""] as const;
const WEEKDAY_INITIALS = [
  { key: "mon", label: "M" },
  { key: "tue", label: "T" },
  { key: "wed", label: "W" },
  { key: "thu", label: "T" },
  { key: "fri", label: "F" },
  { key: "sat", label: "S" },
  { key: "sun", label: "S" },
] as const;
/** Up to this many weeks the grid reads as a calendar, one row per week. */
const CALENDAR_MAX_WEEKS = 6;

export function UsageActivityHeatmap({
  days,
  daily,
  metric,
}: {
  readonly days: readonly string[];
  readonly daily: readonly DailyTotals[];
  readonly metric: "tokens" | "cost";
}) {
  const [hovered, setHovered] = useState<ActivityCell | null>(null);
  const values = new Map(
    daily.map((entry) => [entry.day, metric === "tokens" ? entry.totalTokens : entry.costUsd]),
  );
  const grid = buildActivityGrid(days, values);
  if (grid.cells.length === 0) return null;

  const format = metric === "tokens" ? formatTokens : formatUsd;
  const calendar = grid.weeks <= CALENDAR_MAX_WEEKS;
  const columns = calendar ? 7 : grid.weeks;
  const lastDay = grid.cells.at(-1)?.day;

  return (
    <div data-usage-card="activity" className="flex min-w-0 flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-foreground">Activity</h3>
        <span className="truncate text-xs text-muted-foreground tabular-nums">
          {hovered
            ? `${formatDayShort(hovered.day)} · ${hovered.value > 0 ? format(hovered.value) : "No activity"}`
            : `${formatCount(grid.activeDays)} of ${formatCount(grid.cells.length)} days active`}
        </span>
      </div>
      <div
        role="img"
        aria-label={`Daily ${metric === "tokens" ? "tokens" : "cost"} heatmap: ${grid.activeDays} of ${grid.cells.length} days active`}
        className="grid w-full gap-1 text-3xs text-muted-foreground"
        style={{
          gridTemplateColumns: `auto repeat(${columns}, minmax(0, 1fr))`,
          maxWidth: `calc(2rem + ${columns} * 1.75rem)`,
        }}
        onMouseLeave={() => setHovered(null)}
      >
        {calendar
          ? WEEKDAY_INITIALS.map((initial, weekday) => (
              <span
                key={initial.key}
                aria-hidden
                className="text-center leading-4"
                style={{ gridColumn: weekday + 2, gridRow: 1 }}
              >
                {initial.label}
              </span>
            ))
          : grid.months.map((month) => (
              <span
                key={`${month.week}:${month.label}`}
                aria-hidden
                className="leading-4 whitespace-nowrap"
                style={{ gridColumn: month.week + 2, gridRow: 1 }}
              >
                {month.label}
              </span>
            ))}
        {calendar
          ? null
          : WEEKDAY_LABELS.map((label, weekday) =>
              label ? (
                <span
                  key={label}
                  aria-hidden
                  className="flex items-center pe-1.5 leading-none"
                  style={{ gridColumn: 1, gridRow: weekday + 2 }}
                >
                  {label}
                </span>
              ) : null,
            )}
        {grid.cells.map((cell) => (
          <span
            key={cell.day}
            data-usage-activity-cell=""
            data-level={cell.level}
            data-today={cell.day === lastDay ? "" : undefined}
            onMouseEnter={() => setHovered(cell)}
            className={cn(
              "aspect-square min-w-0 rounded-sm",
              cell.day === lastDay &&
                "ring-1 ring-foreground/50 ring-offset-1 ring-offset-background",
            )}
            style={{
              gridColumn: (calendar ? cell.weekday : cell.week) + 2,
              gridRow: (calendar ? cell.week : cell.weekday) + 2,
              backgroundColor: `color-mix(in oklab, var(--usage-activity-ink, var(--color-foreground)) ${LEVEL_MIX[cell.level]}%, var(--usage-activity-empty, var(--color-muted)))`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
