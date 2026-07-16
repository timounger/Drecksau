/**
 * German formatting of durations and dates for the statistics.
 *
 * @module
 */

/** Milliseconds per second. */
const MS_PER_SECOND = 1000;

/** Seconds per minute, and minutes per hour. */
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

/** Two digit padding for the minutes and seconds part. */
const PAD_LENGTH = 2;

/** Turns a share into percent. */
const PERCENT_FACTOR = 100;

/**
 * Formats a duration as a short, readable German string.
 *
 * @param durationMs - the duration in milliseconds
 * @returns e.g. `"42 s"`, `"3:07 min"` or `"1 h 12 min"`
 * @example
 * ```ts
 * formatDuration(195_000); // "3:15 min"
 * ```
 */
export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / MS_PER_SECOND));
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  const totalMinutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  let text: string;

  if (hours > 0) {
    text = `${hours} h ${minutes} min`;
  } else if (totalMinutes > 0) {
    text = `${minutes}:${String(seconds).padStart(PAD_LENGTH, "0")} min`;
  } else {
    text = `${seconds} s`;
  }

  return text;
}

/**
 * Formats a share as a percentage.
 *
 * @param share - a value between 0 and 1
 * @returns e.g. `"67 %"`
 */
export function formatPercent(share: number): string {
  return `${Math.round(share * PERCENT_FACTOR)} %`;
}

/**
 * Formats a point in time as a German date with time.
 *
 * @param epochMs - milliseconds since the epoch
 * @returns e.g. `"16.07.2026, 01:23"`
 */
export function formatDateTime(epochMs: number): string {
  return new Date(epochMs).toLocaleString("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
