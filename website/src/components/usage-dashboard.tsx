/**
 * The developer's dashboard: who opens what, and how long they stay.
 *
 * @module
 * @remarks
 * **Not linked from anywhere**, and that is the whole of its secrecy: it
 * appears on the start page when the address carries `?stats`. Worth being
 * plain about - the numbers themselves are in the same database the games use
 * and are readable by anyone who looks, so this hides the *page*, not the
 * data. What is in there is a count per game and day and nothing else, so
 * there is nothing in it to protect.
 *
 * **What it shows, and why those three.** Opens say what people come looking
 * for; starts say what they then actually played - the gap between the two is
 * the interesting number, because a game with many opens and few starts has a
 * card that promises something the game does not keep; and play time says
 * whether it held them. See ../online/usage.
 */
"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from "react";
import { GAMES } from "@/games/registry";
import { formatDuration } from "@/i18n/format";
import { USAGE_TEXTS as T } from "@/i18n/collection-texts";
import {
  NO_USAGE,
  SITE_KEY,
  byDay,
  lastDay,
  loadUsage,
  sumAll,
  sumDays,
  windowDays,
  type ByGame,
  type Usage,
} from "@/online/usage";

/**
 * The clock, as a thing to subscribe to.
 *
 * @returns the moment the page was first painted
 * @remarks
 * It never changes and never fires: a dashboard is a photograph, and a chart
 * whose last bar slid along while one read it would be a chart nobody can
 * point at. Rounded to the day for the same reason the shelf's clock is - what
 * is handed out has to compare equal to what was handed out before.
 */
const NOW = (): number => new Date().setUTCHours(0, 0, 0, 0);

/** And what the server knows of the time, which is nothing. */
const NEVER_YET = (): number => 0;

/** How one subscribes to a clock that does not tick: one does not. */
const NEVER_CHANGES = () => () => undefined;

/** How far back the two windows look. */
const WEEK = 7;

/** And the longer one, which is also the width of the chart. */
const MONTH = 30;

/**
 * Renders the dashboard.
 *
 * @returns the panel above the shelves
 */
export function UsageDashboard(): ReactElement {
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [failed, setFailed] = useState(false);
  // **Nothing is fetched until it is opened.** Folded shut this is one line of
  // text; reading three nodes out of the database for a line nobody has looked
  // at would be three round trips on every visit to the start page - and the
  // start page is the one page that has to be quick. The effect therefore
  // waits for the fold, and runs once: after the first answer there is either
  // a `usage` or a `failed`, and both stop it.
  useEffect(() => {
    if (!open || usage !== null || failed) {
      return undefined;
    }
    let dropped = false;
    loadUsage()
      .then((all) => {
        if (!dropped) {
          setUsage(all);
        }
      })
      .catch(() => {
        if (!dropped) {
          setFailed(true);
        }
      });
    return () => {
      dropped = true;
    };
  }, [open, usage, failed]);

  const all = usage ?? NO_USAGE;
  // **The clock is outside React**, and reading it in the middle of a render
  // is a value that changes under the renderer's feet. What this needs of it
  // is the day, which is the same for every render of one afternoon.
  const now = useSyncExternalStore(NEVER_CHANGES, NOW, NEVER_YET);
  const today = windowDays(now, 1);
  const week = windowDays(now, WEEK);
  const month = windowDays(now, MONTH);
  const chart = byDay(all.visits, now, MONTH);
  const peak = chart.reduce((most, one) => Math.max(most, one.count), 0);

  return (
    // **Folded shut.** Somebody who opens the start page with `?stats` on it
    // usually wants to see the games and to know in passing that the numbers
    // are there - not a board that pushes the collection off the screen. One
    // click, and it is there; and only then is anything fetched.
    <details
      data-testid="usage-dashboard"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="rounded-2xl border border-zinc-300 bg-white/70 p-4 dark:border-zinc-700 dark:bg-zinc-900/50"
    >
      {/* **The triangle is the affordance**, not a word: a line of text saying
          "aufklappen" is a label for something every browser already draws.
          The native marker is turned off and this one drawn instead, because
          the native one cannot be moved into a row with the heading and the
          status - and it turns rather than swapping, so the eye follows it. */}
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-150 ${
              open ? "rotate-90" : ""
            }`}
          >
            <path
              d="M7 4l6 6-6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-lg font-bold">{T.title}</span>
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {!open
            ? ""
            : usage === null && !failed
              ? T.loading
              : failed
                ? T.failed
                : T.window(MONTH)}
        </span>
      </summary>

      <div className="mt-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile
            label={T.visits}
            value={num(sumAll(all.visits))}
            note={T.recent(
              num(sumAll(all.visits, week)),
              num(sumAll(all.visits, month)),
            )}
          />
          <Tile
            label={T.starts}
            value={num(sumAll(all.starts))}
            note={T.recent(
              num(sumAll(all.starts, week)),
              num(sumAll(all.starts, month)),
            )}
          />
          <Tile
            label={T.playTime}
            value={formatDuration(sumAll(all.played))}
            note={T.week(formatDuration(sumAll(all.played, week)))}
          />
          <Tile
            label={T.todayLabel}
            value={num(sumAll(all.visits, today))}
            note={T.perDay(
              (sumAll(all.visits, month) / MONTH).toFixed(1).replace(".", ","),
            )}
          />
        </div>

        {/* **Thirty bars, and the tallest one sets the scale.** A chart with a
          fixed ceiling is a chart that is flat for a year and then clipped;
          what one wants to see here is the shape of the last month, not its
          absolute height, which the numbers above already give. */}
        <div>
          <div className="flex h-24 items-end gap-[2px]">
            {chart.map((one) => (
              <div
                key={one.day}
                title={`${one.day}: ${num(one.count)}`}
                className="flex-1 rounded-t bg-indigo-500/80 dark:bg-indigo-400/80"
                style={{
                  height: `${String(
                    peak === 0
                      ? 0
                      : Math.max(MIN_BAR, (one.count / peak) * FULL),
                  )}%`,
                }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
            <span>{chart[0]?.day ?? ""}</span>
            <span>{T.peak(num(peak))}</span>
            <span>{chart.at(-1)?.day ?? ""}</span>
          </div>
        </div>

        <Devices days={all.devices} month={month} />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="py-1 pr-2 font-medium">{T.game}</th>
                <Head>{T.colVisits}</Head>
                <Head>{T.colWeek}</Head>
                <Head>{T.colMonth}</Head>
                <Head>{T.colStarts}</Head>
                <Head>{T.colTime}</Head>
                <Head>{T.colLast}</Head>
              </tr>
            </thead>
            <tbody>
              {rowsOf(all, week, month).map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-zinc-200 dark:border-zinc-800"
                >
                  <td className="py-1 pr-2 font-medium">{row.name}</td>
                  <Cell>{num(row.visits)}</Cell>
                  <Cell>{num(row.week)}</Cell>
                  <Cell>{num(row.month)}</Cell>
                  <Cell>{num(row.starts)}</Cell>
                  <Cell>{formatDuration(row.played)}</Cell>
                  <Cell>{row.last ?? T.never}</Cell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {T.note}
        </p>
      </div>
    </details>
  );
}

/**
 * What people come with: one bar per sort of machine.
 *
 * @param days - the device node, keyed by platform rather than by game
 * @param month - the day keys of the last thirty days
 * @returns the block, or nothing while nothing has been counted
 * @remarks
 * **Bars rather than a pie.** What one wants off this is "is anybody on a
 * phone?", and that is a comparison of lengths - which is the one thing a
 * circle is bad at. Two numbers per row: the whole history and the last
 * thirty days, because a site that was all desktop last year and is half
 * phones this month is a site that needs work in a particular place.
 */
function Devices({
  days,
  month,
}: {
  readonly days: ByGame;
  readonly month: readonly string[];
}): ReactElement | null {
  const rows = Object.keys(days)
    .map((key) => ({
      key,
      name: T.deviceNames[key] ?? key,
      total: sumDays(days[key]),
      month: sumDays(days[key], month),
    }))
    .filter((row) => row.total > 0)
    .sort((one, two) => two.total - one.total);
  const all = rows.reduce((sum, row) => sum + row.total, 0);
  if (all === 0) {
    return null;
  }
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold">{T.devices}</p>
      {rows.map((row) => (
        <div key={row.key} className="flex items-center gap-2 text-xs">
          <span className="w-28 shrink-0 text-zinc-600 dark:text-zinc-400">
            {row.name}
          </span>
          <span className="h-2 flex-1 rounded bg-zinc-200 dark:bg-zinc-800">
            <span
              className="block h-2 rounded bg-emerald-500/80 dark:bg-emerald-400/80"
              style={{ width: `${String((row.total / all) * FULL)}%` }}
            />
          </span>
          <span className="w-24 shrink-0 text-right tabular-nums">
            {num(row.total)} · {num(row.month)} in 30 T
          </span>
        </div>
      ))}
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
        {T.deviceNote}
      </p>
    </div>
  );
}

/** One line of the table: everything known about one game. */
type Row = {
  readonly id: string;
  readonly name: string;
  readonly visits: number;
  readonly week: number;
  readonly month: number;
  readonly starts: number;
  readonly played: number;
  readonly last: string | null;
};

/**
 * One line per game and one for the start page, busiest first.
 *
 * @param all - everything the database holds
 * @param week - the day keys of the last week
 * @param month - and of the last month
 * @returns the rows, sorted by the last month and then by the total
 * @remarks
 * **Sorted by the month, not by the total.** A total is a history of the site
 * and changes by a hair; the last thirty days are what one opens a dashboard
 * to see. Games nobody has opened at all are kept rather than hidden: a nought
 * beside a name is the most useful line on the page.
 */
function rowsOf(
  all: Usage,
  week: readonly string[],
  month: readonly string[],
): readonly Row[] {
  const rows = GAMES.map((game) => ({
    id: game.id,
    name: game.name,
    visits: sumDays(all.visits[game.id]),
    week: sumDays(all.visits[game.id], week),
    month: sumDays(all.visits[game.id], month),
    starts: sumDays(all.starts[game.id]),
    played: sumDays(all.played[game.id]),
    last: lastDay(all.visits[game.id]) ?? lastDay(all.starts[game.id]),
  }));
  const site: Row = {
    id: SITE_KEY,
    name: T.startPage,
    visits: sumDays(all.visits[SITE_KEY]),
    week: sumDays(all.visits[SITE_KEY], week),
    month: sumDays(all.visits[SITE_KEY], month),
    starts: 0,
    played: 0,
    last: lastDay(all.visits[SITE_KEY]),
  };
  return [
    site,
    ...rows.sort(
      (one, two) =>
        two.month - one.month ||
        two.visits - one.visits ||
        // And where nothing has been opened yet, by the time played: that
        // number has a history behind it and puts something readable on the
        // page from the first day the counter runs.
        two.played - one.played,
    ),
  ];
}

/** One big number with a label over it and a small line under it. */
function Tile({
  label,
  value,
  note,
}: {
  readonly label: string;
  readonly value: string;
  readonly note: string;
}): ReactElement {
  return (
    <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{note}</p>
    </div>
  );
}

/** A column heading, right aligned like the numbers under it. */
function Head({ children }: { readonly children: string }): ReactElement {
  return <th className="py-1 pl-2 text-right font-medium">{children}</th>;
}

/** One number in the table. */
function Cell({ children }: { readonly children: string }): ReactElement {
  return <td className="py-1 pl-2 text-right tabular-nums">{children}</td>;
}

/** How tall the tallest bar is, as a percentage of the chart. */
const FULL = 100;

/** And how tall a day with anything at all in it is, so it can be seen. */
const MIN_BAR = 2;

/** A count, with the thousands separated the way this country does it. */
function num(count: number): string {
  return count.toLocaleString("de-DE");
}
