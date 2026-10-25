/**
 * A case as a printed page: title, story, the empty map, what may be stood
 * on, the case's own rules, every suspect with their clue and a line for the
 * answer - to print, or to save as a PDF from the browser's print dialog.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import { NoteLines, PrintHeader, PrintSheet } from "@/components/print-sheet";
import { LEVELS } from "@/games/murdoku/engine/levels";
import { EMPTY_BOARD } from "@/games/murdoku/engine/board";
import { sizeOf } from "@/games/murdoku/engine/rules";
import type { Level, Suspect } from "@/games/murdoku/engine/types";
import { CaseMap, mapAspect } from "@/games/murdoku/components/case-map";
import { Emphasised, Legend } from "@/games/murdoku/components/murdoku-game";
import {
  MURDOKU_TEXTS as T,
  TRAIT_NAMES,
  categoryText,
  clueText,
  titleOf,
} from "@/games/murdoku/i18n/texts";

/** The most room the map may take beside the side column - a small case. */
const SMALL_MAP = { width: 112, height: 125 } as const;

/** The most room the map may take on a page of its own - a big case. */
const LARGE_MAP = { width: 186, height: 172 } as const;

/** From this many rows or columns a case is big: the suspects go on page two. */
const LARGE_SIDE = 12;

/** More suspects than this make a case big as well. */
const LARGE_CAST = 9;

/** More suspects than this get four cards to the row instead of three. */
const WIDE_CAST = 16;

/** How many lines there are for notes. */
const NOTE_LINES = 3;

/**
 * The printed page of one case. Opens the print dialog once it is drawn.
 *
 * @param props - the case's id
 * @returns the page, or nothing for an unknown case
 */
export function CasePrintSheet({
  id,
}: {
  readonly id: string;
}): ReactElement | null {
  const level = LEVELS.find((one) => one.id === id);
  return level === undefined ? null : (
    <PrintSheet testId="murdoku-print-sheet">
      <Sheet level={level} />
    </PrintSheet>
  );
}

/** The content of the sheet. */
function Sheet({ level }: { readonly level: Level }): ReactElement {
  const { rows, cols } = sizeOf(level);
  const large =
    Math.max(rows, cols) >= LARGE_SIDE || level.suspects.length > LARGE_CAST;
  const box = large ? LARGE_MAP : SMALL_MAP;
  const mapWidth = Math.min(box.width, box.height * mapAspect(level));
  const label = categoryText(level);
  return (
    <>
      <PrintHeader
        game={T.title}
        label={label}
        title={titleOf(level)}
        story={level.story}
      />

      {large ? (
        <section className="flex flex-col items-center gap-3">
          <div style={{ width: `${String(mapWidth)}mm` }}>
            <CaseMap level={level} board={EMPTY_BOARD} />
          </div>
          <div className="w-full">
            <Legend level={level} />
          </div>
          <CaseRules level={level} />
        </section>
      ) : (
        <section className="flex items-start gap-4">
          <div className="shrink-0" style={{ width: `${String(mapWidth)}mm` }}>
            <CaseMap level={level} board={EMPTY_BOARD} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Legend level={level} stacked />
            <CaseRules level={level} />
          </div>
        </section>
      )}

      <section
        className={`flex flex-col gap-2 ${large ? "break-before-page" : ""}`}
      >
        <h2 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
          {T.suspects}
        </h2>
        <ul
          className={`grid gap-2 ${
            level.suspects.length > WIDE_CAST ? "grid-cols-4" : "grid-cols-3"
          }`}
        >
          {level.suspects.map((suspect) => (
            <li key={suspect.id} className="break-inside-avoid">
              <PrintedSuspect level={level} suspect={suspect} />
            </li>
          ))}
        </ul>
      </section>

      <Answer level={level} />
    </>
  );
}

/** The case's own rules with the magnifier, and the detective's post-its. */
function CaseRules({ level }: { readonly level: Level }): ReactElement {
  const rules = level.rules ?? [];
  const lines = rules.filter((rule) => rule.note !== true);
  const notes = rules.filter((rule) => rule.note === true);
  return (
    <>
      {lines.length > 0 && (
        <ul className="flex w-full break-inside-avoid flex-col gap-1 rounded-xl border border-sky-300 bg-sky-50 p-2 text-xs text-sky-950">
          {lines.map((rule) => (
            <li key={rule.text} className="flex gap-1.5">
              <span aria-hidden="true">{"\u{1F50E}"}</span>
              <span>
                <Emphasised level={level} text={rule.text} />
              </span>
            </li>
          ))}
        </ul>
      )}
      {notes.map((rule) => (
        <p
          key={rule.text}
          className="w-full break-inside-avoid border-l-4 border-yellow-400 bg-yellow-100 p-2 text-xs text-yellow-950"
        >
          <span aria-hidden="true">{"\u{1F4CC} "}</span>
          {rule.text}
        </p>
      ))}
    </>
  );
}

/** A suspect on paper: face, letter, name, traits and the clue. */
function PrintedSuspect({
  level,
  suspect,
}: {
  readonly level: Level;
  readonly suspect: Suspect;
}): ReactElement {
  const victim = suspect.clue.victim === true;
  const treasure = level.treasure === suspect.id;
  return (
    <div
      className={`flex h-full gap-2 rounded-lg border p-1.5 ${
        victim
          ? "border-rose-400"
          : treasure
            ? "border-amber-400"
            : "border-zinc-300"
      }`}
    >
      <span className="relative h-10 w-10 shrink-0">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-2xl"
          style={{ backgroundColor: `${suspect.colour}33` }}
          aria-hidden="true"
        >
          {suspect.face}
        </span>
        <span
          className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[10px] font-extrabold text-white"
          style={{ backgroundColor: suspect.colour }}
        >
          {suspect.id}
        </span>
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex flex-wrap items-baseline gap-x-1.5 text-xs font-bold">
          {suspect.name}
          {victim && (
            <span className="text-[9px] tracking-wide text-rose-700 uppercase">
              {T.victim}
            </span>
          )}
          {treasure && (
            <span className="text-[9px] tracking-wide text-amber-700 uppercase">
              {T.treasure}
            </span>
          )}
        </span>
        {(suspect.traits ?? []).length > 0 && (
          <span className="text-[9px] text-zinc-600">
            {(suspect.traits ?? [])
              .map((trait) => TRAIT_NAMES[trait] ?? trait)
              .join(", ")}
          </span>
        )}
        <span className="text-[10.5px] leading-snug text-zinc-800">
          <Emphasised level={level} text={clueText(level, suspect)} />
        </span>
      </span>
    </div>
  );
}

/** Where the answer is written down, and a few lines for notes. */
function Answer({ level }: { readonly level: Level }): ReactElement {
  return (
    <section className="flex break-inside-avoid flex-col gap-2 rounded-xl border-2 border-zinc-900 p-3 text-sm">
      {level.treasure === undefined ? (
        <p className="flex items-end gap-2 font-bold">
          <span className="shrink-0">{T.printAnswer(level.culprit.name)}</span>
          <span className="h-5 flex-1 border-b border-zinc-900" />
        </p>
      ) : (
        <p className="font-bold">{T.printTreasure}</p>
      )}
      <span className="text-xs font-semibold text-zinc-500">
        {T.printNotes}
      </span>
      <NoteLines count={NOTE_LINES} />
    </section>
  );
}
