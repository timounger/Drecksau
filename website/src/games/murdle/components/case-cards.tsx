/**
 * The printed parts of a case: the cards of the suspects, weapons, places and
 * motives, the clues, the statements and the exhibits.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import type {
  Case,
  ExhibitId,
  Location,
  Suspect,
  Weapon,
} from "@/games/murdle/engine/types";
import {
  DETECTIVE_KIT,
  EXHIBIT_NAMES,
  EYE_NAMES,
  HAIR_NAMES,
  MURDLE_TEXTS as T,
  SIGNS,
  WEIGHT_NAMES,
  capitalised,
  heightText,
} from "@/games/murdle/i18n/texts";

/** The look of a card. */
const CARD =
  "flex h-full gap-3 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900";

/** The look of a section heading. */
const HEADING =
  "text-xs font-semibold tracking-widest text-zinc-500 uppercase dark:text-zinc-400";

/** The line of attributes under a name. */
const ATTRIBUTES =
  "text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400";

/**
 * The cards of a case, category by category.
 *
 * @param props - the case
 * @returns the cards
 */
export function CaseCards({ kase }: { readonly kase: Case }): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2" data-testid="murdle-suspects">
        <h3 className={HEADING}>{T.suspects}</h3>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {kase.suspects.map((one) => (
            <li key={one.id}>
              <SuspectCard suspect={one} />
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-2" data-testid="murdle-weapons">
        <h3 className={HEADING}>{T.weapons}</h3>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
          {kase.weapons.map((one) => (
            <li key={one.id}>
              <WeaponCard weapon={one} />
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-2" data-testid="murdle-locations">
        <h3 className={HEADING}>{T.locations}</h3>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
          {kase.locations.map((one) => (
            <li key={one.id}>
              <LocationCard location={one} />
            </li>
          ))}
        </ul>
      </section>
      {kase.motives !== undefined && (
        <section className="flex flex-col gap-2" data-testid="murdle-motives">
          <h3 className={HEADING}>{T.motives}</h3>
          <ul className="grid grid-cols-2 gap-2">
            {kase.motives.map((one) => (
              <li
                key={one.id}
                className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="text-xl" aria-hidden="true">
                  {one.icon}
                </span>
                {capitalised(one.name)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/**
 * The clues and evidence, the body last and in bold, then the statements.
 *
 * @param props - the case
 * @returns the lists
 */
export function CaseClues({ kase }: { readonly kase: Case }): ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <section
        className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
        data-testid="murdle-clues"
      >
        <h3 className={HEADING}>{T.clues}</h3>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm">
          {kase.clues.map((clue) => (
            <li key={clue.text}>{clue.text}</li>
          ))}
          {kase.body !== undefined && (
            <li className="font-bold">{kase.body.text}</li>
          )}
        </ul>
      </section>
      {kase.statements !== undefined && (
        <section
          className="flex flex-col gap-2 rounded-2xl border border-violet-200 bg-violet-50 p-3 dark:border-violet-900 dark:bg-violet-950/40"
          data-testid="murdle-statements"
        >
          <h3 className={HEADING}>{T.statements}</h3>
          <p className="text-xs font-semibold text-violet-800 dark:text-violet-300">
            {T.statementsNote}
          </p>
          <ul className="flex flex-col gap-1.5 text-sm">
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
      {(kase.exhibits ?? []).length > 0 && (
        <section className="flex flex-col gap-2" data-testid="murdle-exhibits">
          <h3 className={HEADING}>{T.exhibits}</h3>
          {(kase.exhibits ?? []).map((exhibit) => (
            <Exhibit key={exhibit} id={exhibit} />
          ))}
        </section>
      )}
    </div>
  );
}

/**
 * What a suspect's card says under the description.
 *
 * @param suspect - the suspect
 * @returns height, hand, eyes, hair and - when the case has it - the sign
 */
export function suspectAttributes(suspect: Suspect): readonly string[] {
  const sign = suspect.sign === undefined ? null : SIGNS[suspect.sign];
  return [
    heightText(suspect.heightCm),
    suspect.hand === "left" ? T.handLeft : T.handRight,
    EYE_NAMES[suspect.eyes],
    HAIR_NAMES[suspect.hair],
    ...(sign === null ? [] : [`${sign.symbol} ${sign.name}`]),
  ];
}

/**
 * What a weapon's card says under its name.
 *
 * @param weapon - the weapon
 * @returns its weight and, when known, what it is made of
 */
export function weaponAttributes(weapon: Weapon): readonly string[] {
  return [
    WEIGHT_NAMES[weapon.weight],
    ...(weapon.material === undefined ? [] : [`aus ${weapon.material}`]),
  ];
}

/** One suspect's card. */
function SuspectCard({ suspect }: { readonly suspect: Suspect }): ReactElement {
  const attributes = suspectAttributes(suspect);
  return (
    <div className={CARD} data-testid={`murdle-suspect-${suspect.id}`}>
      <span
        className="flex w-20 shrink-0 flex-col items-center gap-1 text-center break-words hyphens-auto"
        lang="de"
      >
        <span className="text-3xl" aria-hidden="true">
          {suspect.icon}
        </span>
        <span className="text-xs font-bold tracking-wide uppercase">
          {suspect.name}
        </span>
      </span>
      <span className="flex flex-col gap-1.5">
        <span className="text-sm text-zinc-700 dark:text-zinc-200">
          {suspect.description}
        </span>
        <span className={ATTRIBUTES}>{attributes.join(" • ")}</span>
      </span>
    </div>
  );
}

/** One weapon's card. */
function WeaponCard({ weapon }: { readonly weapon: Weapon }): ReactElement {
  const attributes = weaponAttributes(weapon);
  return (
    <div
      className={`${CARD} flex-col items-center bg-zinc-50 text-center dark:bg-zinc-900`}
    >
      <span className="text-3xl" aria-hidden="true">
        {weapon.icon}
      </span>
      <span className="text-xs font-bold tracking-wide uppercase">
        {weapon.name}
      </span>
      <span className={ATTRIBUTES}>{attributes.join(" • ")}</span>
      <span className="text-xs text-zinc-600 dark:text-zinc-300">
        {weapon.description}
      </span>
    </div>
  );
}

/** One place's card. */
function LocationCard({
  location,
}: {
  readonly location: Location;
}): ReactElement {
  return (
    <div className={`${CARD} flex-col items-center text-center`}>
      <span className="text-3xl" aria-hidden="true">
        {location.icon}
      </span>
      <span className="text-xs font-bold tracking-wide uppercase">
        {location.name}
      </span>
      <span className={ATTRIBUTES}>
        {location.indoors ? T.indoors : T.outdoors}
      </span>
      <span className="text-xs text-zinc-600 dark:text-zinc-300">
        {location.description}
      </span>
    </div>
  );
}

/** One exhibit, folded away until opened. */
function Exhibit({ id }: { readonly id: ExhibitId }): ReactElement {
  return (
    <details
      open
      className="rounded-2xl border-2 border-zinc-800 bg-white p-3 text-sm dark:border-zinc-300 dark:bg-zinc-900"
      data-testid={`murdle-exhibit-${id}`}
    >
      <summary className="cursor-pointer font-mono font-bold">
        {EXHIBIT_NAMES[id]}
      </summary>
      {id === "detectiveKit" ? (
        <ul className="mt-2 flex flex-col gap-2">
          {DETECTIVE_KIT.map((item) => (
            <li key={item.name} className="flex gap-2">
              <span className="text-xl" aria-hidden="true">
                {item.icon}
              </span>
              <span>
                <strong className="font-mono">{item.name}</strong> {item.text}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <table className="mt-2 w-full text-left text-xs">
          <thead>
            <tr className="bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900">
              <th className="px-2 py-1">Zeichen</th>
              <th className="px-2 py-1">Element</th>
              <th className="px-2 py-1">Zeitraum</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(SIGNS).map(([key, sign]) => (
              <tr
                key={key}
                className="border-t border-zinc-200 dark:border-zinc-700"
              >
                <td className="px-2 py-0.5 font-semibold">
                  {`${sign.symbol} ${sign.name}`}
                </td>
                <td className="px-2 py-0.5">{sign.element}</td>
                <td className="px-2 py-0.5">{sign.dates}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </details>
  );
}
