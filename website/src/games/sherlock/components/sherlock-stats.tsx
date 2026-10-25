/**
 * What the Sherlock Holmes puzzle collection shows on its statistics page
 * beside the collection's own numbers: puzzles solved and solutions looked
 * at, part by part of the book.
 *
 * @module
 */
"use client";

import { useEffect, useState, type ReactElement } from "react";
import { PART_ORDER, PUZZLES } from "@/games/sherlock/engine/puzzles";
import type { Puzzle } from "@/games/sherlock/engine/types";
import { PartBadge } from "@/games/sherlock/components/puzzle-filter";
import { clockText } from "@/games/sherlock/components/sherlock-game";
import {
  loadSherlockProgress,
  type SherlockProgress,
} from "@/games/sherlock/hooks/use-sherlock";

/** The words of the table. */
const L = {
  title: "Rätsel",
  solvedOf: (done: number, all: number) =>
    `${String(done)} von ${String(all)} gelöst`,
  part: "Teil",
  solved: "Gelöst",
  revealed: "Lösung angesehen",
  time: "Zeit",
  total: "Gesamt",
} as const;

/** A hundred, for the width of the bar in percent. */
const PERCENT = 100;

/** Nothing read yet. */
const NOTHING: SherlockProgress = { solved: [], revealed: [], played: {} };

/** One line of the table: a part, or all of them. */
type Line = {
  readonly key: string;
  readonly label: ReactElement | string;
  readonly puzzles: readonly Puzzle[];
};

/**
 * The parts of the book, each with how much of it is solved.
 *
 * @returns the table
 */
export function SherlockStats(): ReactElement {
  const [read, setRead] = useState<SherlockProgress>(NOTHING);

  // Read once in the browser - the page the server sent knows nothing of it.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setRead(loadSherlockProgress());
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const lines: readonly Line[] = [
    ...PART_ORDER.map((part) => ({
      key: part,
      label: <PartBadge part={part} />,
      puzzles: PUZZLES.filter((one) => one.part === part),
    })),
    { key: "total", label: L.total, puzzles: PUZZLES },
  ];
  const count = (list: readonly string[], puzzles: readonly Puzzle[]) =>
    puzzles.filter((one) => list.includes(one.id)).length;
  const time = (puzzles: readonly Puzzle[]) =>
    puzzles.reduce((sum, one) => sum + (read.played[one.id] ?? 0), 0);

  return (
    <section
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      data-testid="sherlock-stats"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">{L.title}</h2>
        <span className="text-sm text-zinc-600 dark:text-zinc-300">
          {L.solvedOf(count(read.solved, PUZZLES), PUZZLES.length)}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="py-1 pr-3 font-semibold">{L.part}</th>
              <th className="py-1 pr-3 font-semibold">{L.solved}</th>
              <th className="py-1 pr-3 font-semibold">{L.revealed}</th>
              <th className="py-1 font-semibold">{L.time}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const done = count(read.solved, line.puzzles);
              const all = line.puzzles.length;
              return (
                <tr
                  key={line.key}
                  data-testid={`sherlock-stats-${line.key}`}
                  className={`border-t border-zinc-100 dark:border-zinc-800 ${
                    line.key === "total" ? "font-bold" : ""
                  }`}
                >
                  <td className="py-2 pr-3">{line.label}</td>
                  <td className="py-2 pr-3">
                    <span className="flex items-center gap-2">
                      <span className="whitespace-nowrap tabular-nums">{`${String(done)} / ${String(all)}`}</span>
                      <span
                        aria-hidden="true"
                        className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-zinc-200 sm:block dark:bg-zinc-800"
                      >
                        <span
                          className="block h-full bg-emerald-500"
                          style={{
                            width: `${String(all === 0 ? 0 : (done / all) * PERCENT)}%`,
                          }}
                        />
                      </span>
                    </span>
                  </td>
                  <td className="py-2 pr-3 tabular-nums">
                    {String(count(read.revealed, line.puzzles))}
                  </td>
                  <td className="py-2 font-mono tabular-nums">
                    {clockText(time(line.puzzles))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
