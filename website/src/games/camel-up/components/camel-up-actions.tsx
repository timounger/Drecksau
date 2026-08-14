/**
 * The panel that asks the player for their one action.
 *
 * @module
 * @remarks
 * Four actions, and three of them need something chosen afterwards, so the
 * panel works in two steps: pick what you want to do, then pick what to do it
 * with. What has nothing to aim at is not offered in the first step - a camel
 * whose cards are all gone is not a choice, it is a dead button.
 */
"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import {
  CAMELS,
  CAMEL_INK,
  CAMEL_LABELS,
  TRACK_SPACES,
  canPlaceTile,
  type Camel,
  type CamelUpGame,
  type CamelUpMove,
  type TileKind,
} from "@/games/camel-up/engine/state";
import { CAMEL_TEXTS as T } from "@/games/camel-up/i18n/texts";

/** Props of {@link CamelUpPanel}. */
export type CamelUpPanelProps = {
  readonly game: CamelUpGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  readonly onMove: (move: CamelUpMove) => void;
  /** True while somebody else is being waited for. */
  readonly busy?: boolean;
};

/** What the panel is asking for at the moment. */
type Step =
  | { readonly at: "action" }
  | { readonly at: "legBet" }
  | { readonly at: "raceCamel" }
  | { readonly at: "raceSide"; readonly camel: Camel }
  | { readonly at: "tileSpace" }
  | { readonly at: "tileKind"; readonly space: number };

/** The step a fresh panel starts from. */
const START: Step = { at: "action" };

/**
 * Renders whatever the player has to answer right now.
 *
 * @param props - the race, who is reading and where a move goes
 * @returns the panel element
 */
export function CamelUpPanel({
  game,
  mySeat,
  onMove,
  busy = false,
}: CamelUpPanelProps): ReactElement {
  const mine = mySeat !== null && game.turn === mySeat && !busy;
  const waiting = game.players[game.turn]?.name ?? "";

  let body: ReactElement;
  if (game.phase === "gameOver") {
    body = <p className="text-sm">{T.gameOverTitle}</p>;
  } else if (!mine) {
    body = (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {T.waitingFor(waiting)}
      </p>
    );
  } else if (game.phase === "legOver") {
    body = <LegOver game={game} onMove={onMove} />;
  } else {
    body = <Actions game={game} seat={game.turn} onMove={onMove} />;
  }

  return (
    <section
      data-testid="camel-panel"
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {T.leg(game.leg)} · {T.diceLeft(game.dice.length)}
      </p>
      {body}
    </section>
  );
}

/** The payouts of the leg that just ended, and the way on. */
function LegOver({
  game,
  onMove,
}: {
  readonly game: CamelUpGame;
  readonly onMove: (move: CamelUpMove) => void;
}): ReactElement {
  const result = game.lastLeg;
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">
        {T.legOverTitle(result?.leg ?? game.leg)}
      </h2>
      {result !== null && (
        <>
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <Chip camel={result.first} />
            {T.legFirst(CAMEL_LABELS[result.first])}
            <Chip camel={result.second} />
            {T.legSecond(CAMEL_LABELS[result.second])}
          </p>
          <ul className="flex flex-wrap gap-2 text-sm">
            {game.players.map((player, seat) => (
              <li
                key={player.name + seat}
                className="rounded-lg bg-zinc-100 px-2 py-1 dark:bg-zinc-800"
              >
                {player.name}{" "}
                <span
                  className={
                    result.gained[seat] >= 0
                      ? "font-semibold text-emerald-700 dark:text-emerald-300"
                      : "font-semibold text-red-700 dark:text-red-300"
                  }
                >
                  {result.gained[seat] >= 0 ? "+" : ""}
                  {result.gained[seat]}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <Primary onClick={() => onMove({ kind: "nextLeg" })}>{T.nextLeg}</Primary>
    </div>
  );
}

/** The four actions, and whatever the chosen one still needs. */
function Actions({
  game,
  seat,
  onMove,
}: {
  readonly game: CamelUpGame;
  readonly seat: number;
  readonly onMove: (move: CamelUpMove) => void;
}): ReactElement {
  const [step, setStep] = useState<Step>(START);
  const play = (move: CamelUpMove) => {
    setStep(START);
    onMove(move);
  };
  const spaces = openSpaces(game, seat);
  const camelsOnOffer = CAMELS.filter(
    (camel) => game.legBets[camel].length > 0,
  );
  const mine = game.players[seat].raceCards;

  let body: ReactElement;
  switch (step.at) {
    case "action":
      body = (
        <div className="grid gap-2 sm:grid-cols-2">
          <Action
            testId="camel-action-roll"
            title={T.actionRoll}
            hint={T.actionRollHint}
            onPick={() => play({ kind: "roll" })}
          />
          {camelsOnOffer.length > 0 && (
            <Action
              testId="camel-action-legBet"
              title={T.actionLegBet}
              hint={T.actionLegBetHint}
              onPick={() => setStep({ at: "legBet" })}
            />
          )}
          {mine.length > 0 && (
            <Action
              testId="camel-action-raceBet"
              title={T.actionRaceBet}
              hint={T.actionRaceBetHint}
              onPick={() => setStep({ at: "raceCamel" })}
            />
          )}
          {spaces.length > 0 && (
            <Action
              testId="camel-action-tile"
              title={T.actionTile}
              hint={T.actionTileHint}
              onPick={() => setStep({ at: "tileSpace" })}
            />
          )}
        </div>
      );
      break;
    case "legBet":
      body = (
        <Choices
          label={T.chooseCamel}
          options={camelsOnOffer.map((camel) => ({
            key: camel,
            camel,
            title: CAMEL_LABELS[camel],
            hint: T.nextPayout(game.legBets[camel][0]),
            onPick: () => play({ kind: "legBet", camel }),
          }))}
        />
      );
      break;
    case "raceCamel":
      body = (
        <Choices
          label={T.chooseCamel}
          options={mine.map((camel) => ({
            key: camel,
            camel,
            title: CAMEL_LABELS[camel],
            hint: "",
            onPick: () => setStep({ at: "raceSide", camel }),
          }))}
        />
      );
      break;
    case "raceSide": {
      const chosen = step.camel;
      body = (
        <Choices
          label={T.chooseSide}
          options={[
            {
              key: "winner",
              title: T.sideWinner,
              hint: T.winnerPile(game.winnerBets.length),
              onPick: () =>
                play({ kind: "raceBet", camel: chosen, side: "winner" }),
            },
            {
              key: "loser",
              title: T.sideLoser,
              hint: T.loserPile(game.loserBets.length),
              onPick: () =>
                play({ kind: "raceBet", camel: chosen, side: "loser" }),
            },
          ]}
        />
      );
      break;
    }
    case "tileSpace":
      body = (
        <Choices
          label={T.chooseSpace}
          options={spaces.map((space) => ({
            key: String(space),
            title: String(space + 1),
            hint: "",
            onPick: () => setStep({ at: "tileKind", space }),
          }))}
        />
      );
      break;
    case "tileKind": {
      const where = step.space;
      body = (
        <Choices
          label={T.chooseTile}
          options={(["oasis", "mirage"] as const).map((tile: TileKind) => ({
            key: tile,
            title: tile === "oasis" ? T.tileOasis : T.tileMirage,
            hint: "",
            onPick: () => play({ kind: "tile", space: where, tile }),
          }))}
        />
      );
      break;
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">{T.chooseAction}</h2>
      {body}
      {step.at !== "action" && (
        <Secondary onClick={() => setStep(START)}>{T.cancel}</Secondary>
      )}
    </div>
  );
}

/** The spaces a desert tile may go on right now. */
function openSpaces(game: CamelUpGame, seat: number): readonly number[] {
  const open: number[] = [];
  for (let space = 0; space < TRACK_SPACES; space++) {
    if (canPlaceTile(game, seat, space)) {
      open.push(space);
    }
  }
  return open;
}

/** One of the four actions. */
function Action({
  testId,
  title,
  hint,
  onPick,
}: {
  readonly testId: string;
  readonly title: string;
  readonly hint: string;
  readonly onPick: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onPick}
      className="cursor-pointer rounded-xl border border-zinc-300 p-2.5 text-left hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      <span className="block text-sm font-semibold">{title}</span>
      <span className="block text-xs text-zinc-500 dark:text-zinc-400">
        {hint}
      </span>
    </button>
  );
}

/** One thing to pick in the second step. */
type Choice = {
  readonly key: string;
  readonly title: string;
  readonly hint: string;
  readonly camel?: Camel;
  readonly onPick: () => void;
};

/** A row of things to pick one of. */
function Choices({
  label,
  options,
}: {
  readonly label: string;
  readonly options: readonly Choice[];
}): ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            data-testid={`camel-pick-${option.key}`}
            onClick={option.onPick}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-300 px-3 py-2 text-left hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {option.camel !== undefined && <Chip camel={option.camel} />}
            <span>
              <span className="block text-sm font-semibold">
                {option.title}
              </span>
              {option.hint !== "" && (
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                  {option.hint}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** A camel in its own colour. */
function Chip({ camel }: { readonly camel: Camel }): ReactElement {
  return (
    <span
      aria-hidden
      className="h-4 w-4 shrink-0 rounded ring-1 ring-zinc-300"
      style={{ backgroundColor: CAMEL_INK[camel] }}
    />
  );
}

/** The button that carries the panel's main action. */
function Primary({
  children,
  onClick,
}: {
  readonly children: ReactNode;
  readonly onClick: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      data-testid="camel-next-leg"
      onClick={onClick}
      className="cursor-pointer self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
    >
      {children}
    </button>
  );
}

/** The quieter of two buttons. */
function Secondary({
  children,
  onClick,
}: {
  readonly children: ReactNode;
  readonly onClick: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer self-start rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {children}
    </button>
  );
}
