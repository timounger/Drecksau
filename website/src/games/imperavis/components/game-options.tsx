/**
 * The choice of difficulty, events, disasters and peoples for a new game
 * (the level as a row of buttons, the rest in two folding sections of the
 * main menu), and the read-only summary of a running game's choice for
 * the pause menu.
 *
 * @module
 * @remarks
 * The choice is kept as stored settings (`newGameSetting`), so the next new
 * game starts with the last one; nothing is stored in the game until it
 * starts, where it becomes part of its settings and so of its saves.
 */
"use client";

import { useState, useSyncExternalStore, type ReactElement } from "react";
import {
  DISASTER_KINDS,
  eventOn,
  EVENT_OPTIONS,
  PIRATE_CULTURES,
  raidsOn,
} from "@/games/imperavis/engine/disasters-data";
import {
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  levelOf,
} from "@/games/imperavis/engine/difficulty-data";
import { CULTURE, NATIONS } from "@/games/imperavis/engine/factions-data";
import type {
  CultureId,
  EventOption,
  GameSettings,
} from "@/games/imperavis/engine/types";
import {
  DISASTER_TEXTS as DT,
  EVENT_OPTION_HINTS,
  EVENT_OPTION_NAMES,
} from "@/games/imperavis/i18n/disaster-texts";
import {
  newGameSetting,
  type NewGameChoice,
} from "@/games/imperavis/settings/preferences";
import {
  DIFFICULTY_HINTS,
  DIFFICULTY_NAMES,
  TEXTS as T,
} from "@/games/imperavis/i18n/texts";
import { Icon } from "./icons";
import { Btn } from "./ui";

/** The events that are no disasters, in menu order. */
const PLAIN_EVENTS: readonly EventOption[] = EVENT_OPTIONS.filter(
  (option) => !DISASTER_KINDS.includes(option as never),
);

/** The rows of the peoples section: the four peoples, then the pirates. */
const PEOPLE_ROWS: readonly {
  readonly id: string;
  readonly cultures: readonly CultureId[];
  readonly name: string;
  readonly hint: string;
}[] = [
  ...NATIONS.map((culture) => ({
    id: culture,
    cultures: [culture],
    name: CULTURE[culture].name,
    hint: CULTURE[culture].island,
  })),
  {
    id: "pirates",
    cultures: PIRATE_CULTURES,
    name: DT.pirates,
    hint: DT.piratesHint,
  },
];

/**
 * The stored choice of the last new game, read without breaking hydration.
 *
 * @returns the choice
 */
export function useNewGameChoice(): NewGameChoice {
  return useSyncExternalStore(
    newGameSetting.subscribe,
    newGameSetting.getSnapshot,
    newGameSetting.getServerSnapshot,
  );
}

/** Props of {@link GameOptions}. */
type GameOptionsProps = {
  /** Whether the peaceful game is ticked: it rules out pirate raids. */
  readonly peaceful: boolean;
};

/**
 * The two folding sections of the new-game menu: events and disasters,
 * and the peoples of the world.
 *
 * @param props - whether the game is peaceful
 * @returns the sections
 */
export function GameOptions({ peaceful }: GameOptionsProps): ReactElement {
  const choice = useNewGameChoice();
  const piratesOff = PIRATE_CULTURES.every((c) =>
    choice.culturesOff.includes(c),
  );
  const setEvent = (option: EventOption, on: boolean) =>
    newGameSetting.save({
      ...choice,
      eventsOff: on
        ? choice.eventsOff.filter((o) => o !== option)
        : [...choice.eventsOff.filter((o) => o !== option), option],
    });
  const setPeople = (cultures: readonly CultureId[], on: boolean) =>
    newGameSetting.save({
      ...choice,
      culturesOff: on
        ? choice.culturesOff.filter((c) => !cultures.includes(c))
        : [
            ...choice.culturesOff.filter((c) => !cultures.includes(c)),
            ...cultures,
          ],
    });
  const eventsOn = EVENT_OPTIONS.length - choice.eventsOff.length;
  const peopleOn = PEOPLE_ROWS.filter((row) =>
    row.cultures.some((c) => !choice.culturesOff.includes(c)),
  ).length;
  const blocked = (option: EventOption) =>
    option === "pirateRaids" && (peaceful || piratesOff);
  const row = (option: EventOption) => (
    <CheckRow
      key={option}
      id={`imp-event-${option}`}
      checked={!choice.eventsOff.includes(option) && !blocked(option)}
      disabled={blocked(option)}
      label={EVENT_OPTION_NAMES[option]}
      hint={
        blocked(option)
          ? peaceful
            ? DT.peacefulRaids
            : DT.noPiratesRaids
          : EVENT_OPTION_HINTS[option]
      }
      onChange={(on) => setEvent(option, on)}
    />
  );
  return (
    <>
      <Fold
        id="imp-events"
        title={DT.eventsTitle}
        count={DT.chosen(eventsOn, EVENT_OPTIONS.length)}
      >
        <p className="imp-muted mb-2 text-xs">{DT.eventsHint}</p>
        <div className="mb-2 flex gap-2">
          <Btn
            small
            testId="imp-events-all"
            onClick={() => newGameSetting.save({ ...choice, eventsOff: [] })}
          >
            {DT.all}
          </Btn>
          <Btn
            small
            testId="imp-events-none"
            onClick={() =>
              newGameSetting.save({ ...choice, eventsOff: [...EVENT_OPTIONS] })
            }
          >
            {DT.none}
          </Btn>
        </div>
        <p className="imp-display mb-1 text-xs font-semibold">
          {DT.eventsGroup}
        </p>
        {PLAIN_EVENTS.map(row)}
        <p className="imp-display mt-2 mb-1 text-xs font-semibold">
          {DT.disastersGroup}
        </p>
        {DISASTER_KINDS.map(row)}
      </Fold>
      <Fold
        id="imp-peoples"
        title={DT.peoplesTitle}
        count={DT.chosen(peopleOn, PEOPLE_ROWS.length)}
      >
        <p className="imp-muted mb-2 text-xs">{DT.peoplesHint}</p>
        <div className="mb-2 flex gap-2">
          <Btn
            small
            testId="imp-peoples-all"
            onClick={() => newGameSetting.save({ ...choice, culturesOff: [] })}
          >
            {DT.all}
          </Btn>
          <Btn
            small
            testId="imp-peoples-none"
            onClick={() =>
              newGameSetting.save({
                ...choice,
                culturesOff: PEOPLE_ROWS.flatMap((r) => r.cultures),
              })
            }
          >
            {DT.none}
          </Btn>
        </div>
        {PEOPLE_ROWS.map((people) => (
          <CheckRow
            key={people.id}
            id={`imp-people-${people.id}`}
            checked={people.cultures.some(
              (c) => !choice.culturesOff.includes(c),
            )}
            disabled={false}
            label={people.name}
            hint={people.hint}
            onChange={(on) => setPeople(people.cultures, on)}
          />
        ))}
      </Fold>
    </>
  );
}

/**
 * The settings of a new game with the stored choice of difficulty, events
 * and peoples.
 *
 * @param base - size-independent settings chosen in the menu
 * @param choice - the stored choice
 * @returns the settings to start with
 */
export function withChoice(
  base: GameSettings,
  choice: NewGameChoice,
): GameSettings {
  return {
    ...base,
    difficulty: choice.difficulty ?? DEFAULT_DIFFICULTY,
    eventsOff: [...choice.eventsOff],
    culturesOff: [...choice.culturesOff],
  };
}

/**
 * The choice of the difficulty for a new game: three buttons and a line on
 * what the chosen level does. The choice is stored at once.
 *
 * @returns the row
 */
export function DifficultyChoice(): ReactElement {
  const choice = useNewGameChoice();
  const level = choice.difficulty ?? DEFAULT_DIFFICULTY;
  return (
    <>
      <p className="imp-muted mb-1 text-sm">{T.difficultyTitle}</p>
      <div className="mb-1 flex gap-2">
        {DIFFICULTIES.map((value) => (
          <Btn
            key={value}
            active={level === value}
            onClick={() =>
              newGameSetting.save({ ...choice, difficulty: value })
            }
            testId={`imp-difficulty-${value}`}
          >
            {DIFFICULTY_NAMES[value]}
          </Btn>
        ))}
      </div>
      <p className="imp-muted mb-3 text-xs" data-testid="imp-difficulty-hint">
        {DIFFICULTY_HINTS[level]}
      </p>
    </>
  );
}

/** Props of {@link GameSummary}. */
type GameSummaryProps = {
  readonly settings: GameSettings;
  /** The peoples and bands that really have an island in this world. */
  readonly cultures: readonly CultureId[];
};

/**
 * What a running game was started with: the events on and the peoples
 * there - for the pause menu, nothing to change.
 *
 * @param props - the game's settings and its peoples
 * @returns the summary
 */
export function GameSummary({
  settings,
  cultures,
}: GameSummaryProps): ReactElement {
  const on = EVENT_OPTIONS.filter(
    (option) =>
      eventOn(settings, option) &&
      (option !== "pirateRaids" || raidsOn(settings)),
  );
  const raidsPeaceful = settings.peaceful && eventOn(settings, "pirateRaids");
  return (
    <div
      className="flex flex-col gap-1 text-xs"
      data-testid="imp-pause-summary"
    >
      <p className="imp-display text-sm font-semibold">{DT.pauseTitle}</p>
      <p data-testid="imp-pause-difficulty">
        <span className="imp-muted">{T.difficultyTitle}: </span>
        {DIFFICULTY_NAMES[levelOf(settings)]}
      </p>
      <p>
        <span className="imp-muted">{DT.pauseEvents}: </span>
        {on.length === 0
          ? DT.pauseNone
          : on.map((option) => EVENT_OPTION_NAMES[option]).join(", ")}
      </p>
      {raidsPeaceful && <p className="imp-muted">{DT.pauseRaidsPeaceful}</p>}
      <p>
        <span className="imp-muted">{DT.pausePeoples}: </span>
        {cultures.length === 0
          ? DT.pauseNone
          : cultures.map((culture) => CULTURE[culture].name).join(", ")}
      </p>
    </div>
  );
}

/** Props of {@link Fold}. */
type FoldProps = {
  readonly id: string;
  readonly title: string;
  /** How much is chosen, shown when folded. */
  readonly count: string;
  readonly children: ReactElement | (ReactElement | ReactElement[])[];
};

/** A section that folds open on a tap, closed at first. */
function Fold({ id, title, count, children }: FoldProps): ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3 rounded border border-[color-mix(in_srgb,var(--imp-brass)_45%,transparent)]">
      <button
        type="button"
        data-testid={`${id}-toggle`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-2 py-2 text-left text-sm"
      >
        <span className="imp-display font-semibold">{title}</span>
        <span className="imp-muted flex shrink-0 items-center gap-1 text-xs whitespace-nowrap">
          {count}
          <Icon name={open ? "chevronUp" : "chevronDown"} size={14} />
        </span>
      </button>
      {open && (
        <div id={id} className="px-2 pb-2" data-testid={id}>
          {children}
        </div>
      )}
    </div>
  );
}

/** Props of {@link CheckRow}. */
type CheckRowProps = {
  readonly id: string;
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly label: string;
  readonly hint: string;
  readonly onChange: (on: boolean) => void;
};

/** One tick box with its name and a line of explanation. */
function CheckRow({
  id,
  checked,
  disabled,
  label,
  hint,
  onChange,
}: CheckRowProps): ReactElement {
  return (
    <label
      className={`flex items-start gap-2 py-1 text-sm ${disabled ? "opacity-60" : ""}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        data-testid={id}
        className="mt-1 accent-[#b38c4c]"
      />
      <span>
        {label}
        <span className="imp-muted block text-xs">{hint}</span>
      </span>
    </label>
  );
}
