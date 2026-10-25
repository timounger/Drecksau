/**
 * A case as a page of the book: title, story, the cards of the suspects,
 * weapons, places and motives, the clues and statements, the exhibits it
 * needs, the empty deduction grid and the lines for the answer - to print, or
 * to save as a PDF from the browser's print dialog.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import { NoteLines, PrintHeader, PrintSheet } from "@/components/print-sheet";
import { caseById } from "@/games/murdle/engine/cases";
import type {
  Case,
  Location,
  Suspect,
  Weapon,
} from "@/games/murdle/engine/types";
import {
  suspectAttributes,
  weaponAttributes,
} from "@/games/murdle/components/case-cards";
import { difficultyLabel } from "@/games/murdle/components/case-filter";
import { DeductionGrid } from "@/games/murdle/components/deduction-grid";
import {
  DETECTIVE_KIT,
  EXHIBIT_NAMES,
  MURDLE_TEXTS as T,
  SERIES_NAMES,
  SIGNS,
  capitalised,
  titleOf,
} from "@/games/murdle/i18n/texts";

/** How many lines there are for notes. */
const NOTE_LINES = 3;

/** The look of a section heading. */
const HEADING = "text-[10px] font-bold tracking-widest text-zinc-500 uppercase";

/** The look of a card. */
const CARD =
  "flex h-full break-inside-avoid flex-col gap-0.5 rounded-lg border border-zinc-300 p-1.5";

/** The line of attributes on a card. */
const ATTRIBUTES =
  "text-[8.5px] font-semibold tracking-wide text-zinc-500 uppercase";

/** Four cards to the row, or three - as many as the case has of each. */
const COLUMNS: Readonly<Record<number, string>> = {
  3: "grid-cols-3",
  4: "grid-cols-4",
};

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
  const kase = caseById(id);
  return kase === null ? null : (
    <PrintSheet testId="murdle-print-sheet">
      <Sheet kase={kase} />
    </PrintSheet>
  );
}

/** The content of the sheet. */
function Sheet({ kase }: { readonly kase: Case }): ReactElement {
  // With motives the grid is twice as wide: it gets a row of its own, with
  // the answer beside it; without, it stands beside the clues.
  const wide = kase.motives !== undefined;
  return (
    <>
      <PrintHeader
        game={T.title}
        label={`${SERIES_NAMES[kase.series]} · ${difficultyLabel(kase.difficulty)}`}
        title={titleOf(kase)}
        story={kase.story}
      />
      <CardRow title={T.suspects} count={kase.suspects.length}>
        {kase.suspects.map((one) => (
          <PrintedSuspect key={one.id} suspect={one} />
        ))}
      </CardRow>
      <CardRow title={T.weapons} count={kase.weapons.length}>
        {kase.weapons.map((one) => (
          <PrintedWeapon key={one.id} weapon={one} />
        ))}
      </CardRow>
      <CardRow title={T.locations} count={kase.locations.length}>
        {kase.locations.map((one) => (
          <PrintedLocation key={one.id} location={one} />
        ))}
      </CardRow>
      {kase.motives !== undefined && (
        <CardRow title={T.motives} count={kase.motives.length}>
          {kase.motives.map((one) => (
            <span
              key={one.id}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-2 py-1 text-xs font-semibold"
            >
              <span className="text-base" aria-hidden="true">
                {one.icon}
              </span>
              {capitalised(one.name)}
            </span>
          ))}
        </CardRow>
      )}
      {wide ? (
        <>
          <Clues kase={kase} />
          <Exhibits kase={kase} />
          <section className="flex break-inside-avoid items-start gap-4">
            <Grid kase={kase} />
            <Answer kase={kase} />
          </section>
        </>
      ) : (
        <section className="flex items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Clues kase={kase} />
            <Exhibits kase={kase} />
          </div>
          <div className="flex shrink-0 flex-col gap-3">
            <Grid kase={kase} />
            <Answer kase={kase} />
          </div>
        </section>
      )}
    </>
  );
}

/** One category's cards, side by side. */
function CardRow({
  title,
  count,
  children,
}: {
  readonly title: string;
  readonly count: number;
  readonly children: readonly ReactElement[];
}): ReactElement {
  return (
    <section className="flex break-inside-avoid flex-col gap-1">
      <h2 className={HEADING}>{title}</h2>
      <div className={`grid gap-1.5 ${COLUMNS[count] ?? "grid-cols-4"}`}>
        {children}
      </div>
    </section>
  );
}

/** A suspect's card on paper. */
function PrintedSuspect({
  suspect,
}: {
  readonly suspect: Suspect;
}): ReactElement {
  return (
    <div className={CARD}>
      <span className="flex items-center gap-1.5">
        <span className="text-2xl leading-none" aria-hidden="true">
          {suspect.icon}
        </span>
        <span className="text-[11px] leading-tight font-bold uppercase">
          {suspect.name}
        </span>
      </span>
      <span className="text-[9.5px] leading-snug text-zinc-700">
        {suspect.description}
      </span>
      <span className={ATTRIBUTES}>
        {suspectAttributes(suspect).join(" • ")}
      </span>
    </div>
  );
}

/** A weapon's card on paper. */
function PrintedWeapon({ weapon }: { readonly weapon: Weapon }): ReactElement {
  return (
    <div className={CARD}>
      <span className="flex items-center gap-1.5">
        <span className="text-xl leading-none" aria-hidden="true">
          {weapon.icon}
        </span>
        <span className="text-[11px] leading-tight font-bold uppercase">
          {weapon.name}
        </span>
      </span>
      <span className={ATTRIBUTES}>{weaponAttributes(weapon).join(" • ")}</span>
      <span className="text-[9.5px] leading-snug text-zinc-700">
        {weapon.description}
      </span>
    </div>
  );
}

/** A place's card on paper. */
function PrintedLocation({
  location,
}: {
  readonly location: Location;
}): ReactElement {
  return (
    <div className={CARD}>
      <span className="flex items-center gap-1.5">
        <span className="text-xl leading-none" aria-hidden="true">
          {location.icon}
        </span>
        <span className="text-[11px] leading-tight font-bold uppercase">
          {location.name}
        </span>
      </span>
      <span className={ATTRIBUTES}>
        {location.indoors ? T.indoors : T.outdoors}
      </span>
      <span className="text-[9.5px] leading-snug text-zinc-700">
        {location.description}
      </span>
    </div>
  );
}

/** The clues with the body last and in bold, the statements and the exhibits. */
function Clues({ kase }: { readonly kase: Case }): ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <section className="flex break-inside-avoid flex-col gap-1">
        <h2 className={HEADING}>{T.clues}</h2>
        <ul className="flex list-disc flex-col gap-1 pl-4 text-xs leading-snug">
          {kase.clues.map((clue) => (
            <li key={clue.text}>{clue.text}</li>
          ))}
          {kase.body !== undefined && (
            <li className="font-bold">{kase.body.text}</li>
          )}
        </ul>
      </section>
      {kase.statements !== undefined && (
        <section className="flex break-inside-avoid flex-col gap-1 rounded-lg border border-violet-300 bg-violet-50 p-2">
          <h2 className={HEADING}>{T.statements}</h2>
          <p className="text-[10px] font-semibold text-violet-800">
            {T.statementsNote}
          </p>
          <ul className="flex flex-col gap-1 text-xs leading-snug">
            {kase.statements.map((statement) => (
              <li key={statement.by}>
                <strong>
                  {kase.suspects.find((one) => one.id === statement.by)?.name}:
                </strong>{" "}
                {statement.text}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/**
 * The exhibits the case needs, set small: the detective kit as a list, the
 * star signs as a table of three columns.
 */
function Exhibits({ kase }: { readonly kase: Case }): ReactElement {
  return (
    <>
      {(kase.exhibits ?? []).map((exhibit) => (
        <section
          key={exhibit}
          className="flex break-inside-avoid flex-col gap-1 rounded-lg border-2 border-zinc-800 p-2"
        >
          <h2 className="font-mono text-xs font-bold">
            {EXHIBIT_NAMES[exhibit]}
          </h2>
          {exhibit === "detectiveKit" ? (
            <ul className="flex flex-col gap-1 text-[10px] leading-snug">
              {DETECTIVE_KIT.map((item) => (
                <li key={item.name} className="flex gap-1.5">
                  <span className="text-sm leading-none" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>
                    <strong className="font-mono">{item.name}</strong>{" "}
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9.5px] leading-snug">
              {Object.entries(SIGNS).map(([key, sign]) => (
                <li key={key} className="flex flex-wrap gap-x-1.5">
                  <strong>{`${sign.symbol} ${sign.name}`}</strong>
                  <span className="text-zinc-600">
                    {`${sign.element} · ${sign.dates}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}

/** The empty deduction grid, as the book prints it. */
function Grid({ kase }: { readonly kase: Case }): ReactElement {
  return (
    <section className="flex shrink-0 break-inside-avoid flex-col gap-1">
      <h2 className={HEADING}>{T.grid}</h2>
      <DeductionGrid kase={kase} marks={{}} disabled printed />
    </section>
  );
}

/** "Wer? Womit? Wo? (Warum?)" with a line each, and lines for notes. */
function Answer({ kase }: { readonly kase: Case }): ReactElement {
  const questions = [
    T.who,
    T.what,
    T.where,
    ...(kase.motives === undefined ? [] : [T.why]),
  ];
  return (
    <section className="flex min-w-0 flex-1 break-inside-avoid flex-col gap-2 rounded-xl border-2 border-zinc-900 p-3 text-sm">
      <h2 className={HEADING}>{T.accusation}</h2>
      {questions.map((question) => (
        <p key={question} className="flex items-end gap-2 font-bold">
          <span className="w-16 shrink-0">{question}</span>
          <span className="h-5 flex-1 border-b border-zinc-900" />
        </p>
      ))}
      <span className="text-xs font-semibold text-zinc-500">
        {T.printNotes}
      </span>
      <NoteLines count={NOTE_LINES} />
    </section>
  );
}
