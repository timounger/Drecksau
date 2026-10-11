/**
 * What Murdoku shows on its statistics page beside the collection's own
 * numbers: how many cases are solved, how long they took, case by case.
 *
 * @module
 */
"use client";

import { useEffect, useState, type ReactElement } from "react";
import { inOrder, LEVELS, SERIES_ORDER } from "@/games/murdoku/engine/levels";
import type { Level } from "@/games/murdoku/engine/types";
import { clockText } from "@/games/murdoku/components/murdoku-game";
import {
  loadMurdokuRecords,
  type CaseRecord,
} from "@/games/murdoku/hooks/use-murdoku";
import {
  DIFFICULTY_NAMES,
  MURDOKU_TEXTS,
  SERIES_NAMES,
  titleOf,
} from "@/games/murdoku/i18n/texts";

/** The words of the table. */
const L = {
  title: "Fälle",
  solved: (done: number, all: number) =>
    `${String(done)} von ${String(all)} gelöst`,
  total: (time: string) => `Lösezeit insgesamt: ${time}`,
  caseName: "Fall",
  difficulty: "Schwierigkeit",
  group: (done: number, all: number) =>
    `${String(done)} von ${String(all)} gelöst`,
  best: "Bestzeit",
  last: "Zuletzt",
  solves: "Gelöst",
  sum: "Zeit gesamt",
  notYet: "-",
  times: (count: number) => (count === 1 ? "1-mal" : `${String(count)}-mal`),
} as const;

/**
 * The cases in groups as the list shows them: each book in its order, then
 * the cases from no book.
 *
 * @returns the groups that have cases, each with its name
 */
function groups(): readonly {
  readonly key: string;
  readonly name: string;
  readonly levels: readonly Level[];
}[] {
  return [
    ...SERIES_ORDER.map((series) => ({
      key: series,
      name: SERIES_NAMES[series],
      levels: LEVELS.filter((level) => level.series?.book === series),
    })),
    {
      key: "none",
      name: MURDOKU_TEXTS.noSeries,
      levels: LEVELS.filter((level) => level.series === undefined),
    },
  ]
    .filter((group) => group.levels.length > 0)
    .map((group) => ({ ...group, levels: group.levels.toSorted(inOrder) }));
}

/**
 * The cases, each with its times.
 *
 * @returns the table
 */
export function MurdokuStats(): ReactElement {
  const [read, setRead] = useState<{
    readonly solved: readonly string[];
    readonly records: Readonly<Record<string, CaseRecord>>;
  }>({ solved: [], records: {} });

  // Read once in the browser - the page the server sent knows nothing of it.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setRead(loadMurdokuRecords());
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const total = Object.values(read.records).reduce(
    (sum, one) => sum + one.totalMs,
    0,
  );

  return (
    <section
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      data-testid="murdoku-stats"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">{L.title}</h2>
        <span className="text-sm text-zinc-600 dark:text-zinc-300">
          {`${L.solved(read.solved.length, LEVELS.length)} - ${L.total(clockText(total))}`}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="py-1 pr-3 font-semibold">{L.caseName}</th>
              <th className="py-1 pr-3 font-semibold">{L.difficulty}</th>
              <th className="py-1 pr-3 font-semibold">{L.solves}</th>
              <th className="py-1 pr-3 font-semibold">{L.best}</th>
              <th className="py-1 pr-3 font-semibold">{L.last}</th>
              <th className="py-1 font-semibold">{L.sum}</th>
            </tr>
          </thead>
          {groups().map((group) => (
            <tbody
              key={group.key}
              data-testid={`murdoku-stats-group-${group.key}`}
            >
              <tr>
                <th
                  colSpan={6}
                  className="pt-4 pb-1 text-sm font-bold text-zinc-800 dark:text-zinc-100"
                >
                  {group.name}{" "}
                  <span className="font-normal text-zinc-500 dark:text-zinc-400">
                    {`(${L.group(
                      group.levels.filter((level) =>
                        read.solved.includes(level.id),
                      ).length,
                      group.levels.length,
                    )})`}
                  </span>
                </th>
              </tr>
              {group.levels.map((level) => {
                const record = read.records[level.id];
                return (
                  <tr
                    key={level.id}
                    className="border-t border-zinc-100 dark:border-zinc-800"
                    data-testid={`murdoku-stats-${level.id}`}
                  >
                    <td className="py-1.5 pr-3 font-medium">
                      {read.solved.includes(level.id)
                        ? `✓ ${titleOf(level)}`
                        : titleOf(level)}
                    </td>
                    <td className="py-1.5 pr-3">
                      {level.difficulty === undefined
                        ? L.notYet
                        : DIFFICULTY_NAMES[level.difficulty]}
                    </td>
                    <td className="py-1.5 pr-3">
                      {record === undefined ? L.notYet : L.times(record.solves)}
                    </td>
                    <td className="py-1.5 pr-3 font-mono tabular-nums">
                      {record === undefined
                        ? L.notYet
                        : clockText(record.bestMs)}
                    </td>
                    <td className="py-1.5 pr-3 font-mono tabular-nums">
                      {record === undefined
                        ? L.notYet
                        : clockText(record.lastMs)}
                    </td>
                    <td className="py-1.5 font-mono tabular-nums">
                      {record === undefined
                        ? L.notYet
                        : clockText(record.totalMs)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}
