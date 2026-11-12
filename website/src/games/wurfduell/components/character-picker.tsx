/**
 * The selection screen: eight fighter cards with what each throws and their
 * life points; the abilities open on hovering (or on the first tap).
 *
 * @module
 */
"use client";

import type { ReactElement, ReactNode } from "react";
import {
  ABILITIES,
  CHARACTERS,
  ITEMS,
  characterById,
} from "@/games/wurfduell/engine/characters";
import type { CharacterId } from "@/games/wurfduell/engine/types";
import { WURFDUELL_TEXTS as T } from "@/games/wurfduell/i18n/texts";
import { FighterPortrait, ItemIcon } from "./portraits";

/** A whole, for a share as a CSS percentage. */
const PERCENT = 100;

/** The most life points any fighter has, for the length of the mini bars. */
const MOST_HP = Math.max(...CHARACTERS.map((character) => character.maxHp));

/** Props of {@link CharacterPicker}. */
export type CharacterPickerProps = {
  readonly title: string;
  /** The card currently marked. */
  readonly selected: CharacterId;
  readonly onSelect: (id: CharacterId) => void;
  readonly onConfirm: () => void;
  /** Shown beside the title, e.g. the difficulty or the opponent's choice. */
  readonly aside?: ReactNode;
  /** Off while waiting, so a choice cannot be sent twice. */
  readonly disabled?: boolean;
};

/**
 * Renders the fighter cards and the button that takes one.
 *
 * @param props - what is marked and what to do with it
 * @returns the picker
 */
export function CharacterPicker({
  title,
  selected,
  onSelect,
  onConfirm,
  aside = null,
  disabled = false,
}: CharacterPickerProps): ReactElement {
  return (
    <section className="flex flex-col gap-3" data-testid="wd-picker">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {aside}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CHARACTERS.map((character) => {
          const active = character.id === selected;
          return (
            <div key={character.id} className="group relative">
              <button
                type="button"
                data-testid={`wd-pick-${character.id}`}
                aria-pressed={active}
                disabled={disabled}
                onClick={() => onSelect(character.id)}
                onDoubleClick={onConfirm}
                className={`flex h-full w-full cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 p-2 text-center transition disabled:cursor-default ${
                  active
                    ? "border-amber-500 bg-amber-50 shadow-md dark:bg-amber-950/40"
                    : "border-zinc-200 bg-white/70 hover:border-amber-300 dark:border-zinc-800 dark:bg-zinc-900/50"
                }`}
              >
                <FighterPortrait
                  character={character.id}
                  className="h-24 w-20"
                />
                <span className="text-sm font-bold">{character.name}</span>
                <span className="text-xs text-zinc-500 italic dark:text-zinc-400">
                  {character.motto}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium">
                  <ItemIcon item={character.item} className="h-6 w-6" />
                  {ITEMS[character.item].name}
                </span>
                <span className="flex w-full items-center gap-1 px-1 text-[0.7rem] font-semibold tabular-nums">
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <span
                      className="block h-full rounded-full bg-green-500"
                      style={{
                        width: `${(character.maxHp / MOST_HP) * PERCENT}%`,
                      }}
                    />
                  </span>
                  {T.lifePoints(character.maxHp)}
                </span>
                {/* Without a mouse there is no hovering: the first tap
                    chooses the card and opens its details right in it. */}
                {active && (
                  <span
                    data-testid="wd-pick-details-touch"
                    className="hidden text-left [@media(hover:none)]:block"
                  >
                    <Details id={character.id} />
                  </span>
                )}
              </button>
              {/* With a mouse the details open on hovering, as a card
                  floating under the fighter, so the grid never jumps. */}
              <div
                role="tooltip"
                data-testid={`wd-pick-details-${character.id}`}
                className="pointer-events-none absolute top-full left-1/2 z-30 mt-1 hidden w-72 -translate-x-1/2 rounded-2xl border border-amber-300 bg-white p-3 text-left shadow-xl dark:border-amber-800 dark:bg-zinc-900 [@media(hover:hover)]:group-hover:block"
              >
                <Details id={character.id} />
              </div>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        data-testid="wd-pick-confirm"
        disabled={disabled}
        onClick={onConfirm}
        className="cursor-pointer self-center rounded-xl bg-amber-500 px-6 py-3 text-base font-bold text-white shadow hover:bg-amber-600 disabled:cursor-default disabled:opacity-50"
      >
        {T.pickConfirm}
      </button>
    </section>
  );
}

/** What a fighter can do: the quirk and the three abilities. */
function Details({ id }: { readonly id: CharacterId }): ReactElement {
  const character = characterById(id);
  return (
    <span className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-300">
      <span className="font-semibold">{character.quirk}</span>
      <span className="font-semibold text-zinc-800 dark:text-zinc-100">
        {T.abilities}:
      </span>
      {character.abilities.map((ability) => (
        <span key={ability}>
          {ABILITIES[ability].icon} <strong>{ABILITIES[ability].name}</strong>
          {" - "}
          {ABILITIES[ability].description}
        </span>
      ))}
    </span>
  );
}
