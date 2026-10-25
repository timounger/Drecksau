/**
 * What Murdle shows on its statistics page beside the collection's own
 * numbers: how many cases are solved, how long they took, part by part of the
 * book.
 *
 * @module
 */
"use client";

import { useEffect, useState, type ReactElement } from "react";
import { CASES, DIFFICULTY_ORDER } from "@/games/murdle/engine/cases";
import { clockText } from "@/games/murdle/components/murdle-game";
import {
  loadMurdleRecords,
  type CaseRecord,
} from "@/games/murdle/hooks/use-murdle";
import { DIFFICULTY_NAMES, titleOf } from "@/games/murdle/i18n/texts";

/** The words of the table. */
const L = {
  title: "Fälle",
  solved: (done: number, all: number) =>
    `${String(done)} von ${String(all)} gelöst`,
  total: (time: string) => `Lösezeit insgesamt: ${time}`,
  caseName: "Fall",
  best: "Bestzeit",
  last: "Zuletzt",
  solves: "Gelöst",
  sum: "Zeit gesamt",
  notYet: "-",
  times: (count: number) => (count === 1 ? "1-mal" : `${String(count)}-mal`),
} as const;

/** How many columns the table has, for the group headings. */
const COLUMNS = 5;

/**
 * The cases, each with its times, grouped by difficulty.
 *
 * @returns the table
 */
export function MurdleStats(): ReactElement {
  const [read, setRead] = useState<{
    readonly solved: readonly string[];
    readonly records: Readonly<Record<string, CaseRecord>>;
  }>({ solved: [], records: {} });

  // Read once in the browser - the page the server sent knows nothing of it.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setRead(loadMurdleRecords());
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const total = Object.values(read.records).reduce(
    (sum, one) => sum + one.totalMs,
    0,
  );
  const groups = DIFFICULTY_ORDER.map((difficulty) => ({
    difficulty,
    cases: CASES.filter((one) => one.difficulty === difficulty),
  })).filter((group) => group.cases.length > 0);

  return (
    <section
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      data-testid="murdle-stats"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">{L.title}</h2>
        <span className="text-sm text-zinc-600 dark:text-zinc-300">
          {`${L.solved(read.solved.length, CASES.length)} - ${L.total(clockText(total))}`}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="py-1 pr-3 font-semibold">{L.caseName}</th>
              <th className="py-1 pr-3 font-semibold">{L.solves}</th>
              <th className="py-1 pr-3 font-semibold">{L.best}</th>
              <th className="py-1 pr-3 font-semibold">{L.last}</th>
              <th className="py-1 font-semibold">{L.sum}</th>
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody
              key={group.difficulty}
              data-testid={`murdle-stats-group-${group.difficulty}`}
            >
              <tr>
                <th
                  colSpan={COLUMNS}
                  className="pt-4 pb-1 text-sm font-bold text-zinc-800 dark:text-zinc-100"
                >
                  {DIFFICULTY_NAMES[group.difficulty]}{" "}
                  <span className="font-normal text-zinc-500 dark:text-zinc-400">
                    {`(${L.solved(
                      group.cases.filter((one) => read.solved.includes(one.id))
                        .length,
                      group.cases.length,
                    )})`}
                  </span>
                </th>
              </tr>
              {group.cases.map((kase) => {
                const record = read.records[kase.id];
                return (
                  <tr
                    key={kase.id}
                    className="border-t border-zinc-100 dark:border-zinc-800"
                    data-testid={`murdle-stats-${kase.id}`}
                  >
                    <td className="py-1.5 pr-3 font-medium">
                      {read.solved.includes(kase.id)
                        ? `✓ ${titleOf(kase)}`
                        : titleOf(kase)}
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
