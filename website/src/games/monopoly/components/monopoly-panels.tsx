/**
 * Beside the board: who is where, and what you can do with what you own.
 *
 * @module
 * @remarks
 * Two panels, and the split is the same one the middle of the board makes:
 * the **standings** are what you look at to decide, and the **deeds** are what
 * you act on. Neither is ever urgent - the game never waits for either - which
 * is exactly why they are here and not in the middle.
 *
 * Every button in the deeds panel asks the referee whether it is legal
 * (`canBuild`, `canSell`, `canMortgage`), so a house that cannot go up does not
 * offer to. Monopoly's building rules are the ones people get wrong at a real
 * table - evenly across the group, nothing on a group with a mortgage in it -
 * and a button that simply is not there explains the rule better than a message
 * saying no would.
 */
"use client";

import type { ReactElement } from "react";
import { fieldAt, groupOf } from "@/games/monopoly/engine/board";
import {
  canBuild,
  canMortgage,
  canSell,
  redemptionOf,
  rentOn,
} from "@/games/monopoly/engine/moves";
import {
  HOTEL,
  MAX_HOUSES,
  TYPICAL_ROLL,
  sellBackOf,
  estateAt,
  holdsGroup,
  ownedBy,
  tokenFor,
  worthOf,
  type MonopolyGame,
  type MonopolyMove,
} from "@/games/monopoly/engine/state";
import { MONOPOLY_TEXTS as T } from "@/games/monopoly/i18n/texts";

/** Props of {@link MonopolyPlayers}. */
export type MonopolyPlayersProps = {
  readonly game: MonopolyGame;
  readonly mySeat: number | null;
};

/**
 * Renders who is playing, where they stand and what they are worth.
 *
 * @param props - the game and who is reading it
 * @returns the standings element
 */
export function MonopolyPlayers({
  game,
  mySeat,
}: MonopolyPlayersProps): ReactElement {
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 className="text-sm font-semibold">{T.players}</h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.bankStock(game.houses, game.hotels)}
        </span>
      </div>
      <ul className="flex flex-col gap-1">
        {game.players.map((player, seat) => {
          const token = tokenFor(game, seat);
          return (
            <li
              key={seat}
              data-testid={`mo-player-${seat}`}
              className={`flex flex-wrap items-center gap-2 rounded-lg px-2 py-1 text-sm ${
                seat === game.active && game.phase !== "gameOver"
                  ? "bg-zinc-100 dark:bg-zinc-800"
                  : ""
              }`}
            >
              <span
                aria-hidden
                title={token.name}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] ${
                  seat === mySeat
                    ? "ring-2 ring-black dark:ring-white"
                    : "ring-1 ring-black/30"
                }`}
                style={{ background: token.colour }}
              >
                {token.emoji}
              </span>
              <span
                className={`font-semibold ${player.bankrupt ? "line-through opacity-50" : ""}`}
              >
                {player.name}
                {seat === mySeat && player.name !== "Du" ? " (du)" : ""}
              </span>
              {player.bankrupt && (
                <span className="text-xs text-zinc-500">{T.outOfGame}</span>
              )}
              {!player.bankrupt && player.jailTurns !== null && (
                <span className="text-xs text-amber-700 dark:text-amber-300">
                  {T.inJail}
                </span>
              )}
              {player.pardons.length > 0 && (
                <span className="text-xs text-emerald-700 dark:text-emerald-300">
                  {T.pardons(player.pardons.length)}
                </span>
              )}
              <span className="ml-auto font-semibold whitespace-nowrap tabular-nums">
                {T.cash(player.cash)}
              </span>
              <span className="w-full text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                {T.worth(worthOf(game, seat))} {"\u{00B7}"}{" "}
                {fieldAt(player.at).name}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Props of {@link MonopolyEstate}. */
export type MonopolyEstateProps = {
  readonly game: MonopolyGame;
  readonly mySeat: number;
  readonly onMove: (move: MonopolyMove) => void;
};

/**
 * Renders what you own and what you may do with it.
 *
 * @param props - the game, your seat and where moves go
 * @returns the deeds element
 */
export function MonopolyEstate({
  game,
  mySeat,
  onMove,
}: MonopolyEstateProps): ReactElement {
  const mine = ownedBy(game, mySeat);
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold">{T.yourStreets}</h2>
      {mine.length === 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.noStreets}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {mine.map((at) => (
            <Deed
              key={at}
              game={game}
              mySeat={mySeat}
              at={at}
              onMove={onMove}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/** One title deed, with whatever may be done to it. */
function Deed({
  game,
  mySeat,
  at,
  onMove,
}: {
  readonly game: MonopolyGame;
  readonly mySeat: number;
  readonly at: number;
  readonly onMove: (move: MonopolyMove) => void;
}): ReactElement {
  const field = fieldAt(at);
  const estate = estateAt(game, at);
  const group = field.group === undefined ? null : groupOf(field.group);
  const whole =
    field.group !== undefined && holdsGroup(game, mySeat, field.group);
  const back = sellBackOf(at);
  const hotelNext = estate.houses === MAX_HOUSES;

  return (
    <li
      data-testid={`mo-deed-${at}`}
      className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-1.5 dark:border-zinc-800"
    >
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {group !== null && (
          <span
            aria-hidden
            className="h-3 w-3 shrink-0 rounded-sm border border-black/30"
            style={{ background: group.colour }}
          />
        )}
        <span className="font-semibold">{field.name}</span>
        {estate.mortgaged && (
          <span className="rounded bg-zinc-700 px-1 text-[10px] text-white">
            {T.mortgaged}
          </span>
        )}
        {estate.houses > 0 && (
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300">
            {estate.houses === HOTEL ? T.hotel : T.houses(estate.houses)}
          </span>
        )}
        {whole && estate.houses === 0 && !estate.mortgaged && (
          <span className="text-[10px] text-amber-700 dark:text-amber-300">
            {T.wholeGroup}
          </span>
        )}
        <span className="ml-auto tabular-nums text-zinc-500 dark:text-zinc-400">
          {T.rentNow(rentOn(game, at, TYPICAL_ROLL))}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {canBuild(game, mySeat, at) && (
          <Small
            label={
              hotelNext
                ? T.buildHotel(field.name, field.houseCost ?? 0)
                : T.build(field.name, field.houseCost ?? 0)
            }
            onClick={() => onMove({ kind: "build", at })}
            testId={`mo-build-${at}`}
            tone="build"
          />
        )}
        {canSell(game, mySeat, at) && (
          <Small
            label={
              estate.houses === HOTEL
                ? T.sellHotel(field.name, back)
                : T.sellHouse(field.name, back)
            }
            onClick={() => onMove({ kind: "sell", at })}
            testId={`mo-sell-${at}`}
            tone="tear"
          />
        )}
        {canMortgage(game, mySeat, at) && (
          <Small
            label={T.mortgage(field.name, field.mortgage ?? 0)}
            onClick={() => onMove({ kind: "mortgage", at })}
            testId={`mo-mortgage-${at}`}
          />
        )}
        {estate.mortgaged && game.players[mySeat].cash >= redemptionOf(at) && (
          <Small
            label={T.redeem(field.name, redemptionOf(at))}
            onClick={() => onMove({ kind: "redeem", at })}
            testId={`mo-redeem-${at}`}
          />
        )}
      </div>
    </li>
  );
}

/** One small action button. */
/** What a small button does to the board, in colour. */
type Tone = "plain" | "build" | "tear";

/**
 * The three looks of a small button.
 *
 * @remarks
 * Building and tearing down sit side by side in the same list, they read almost
 * alike - "Haus auf Badstraße" against "Haus auf Badstraße verkaufen" - and
 * during a building round the eye goes for the button, not the sentence. So the
 * two get the colours everything else uses for the same idea: green adds,
 * red takes away. Everything else stays quiet, because a button that shouts is
 * only useful while the others do not.
 *
 * Hypothek and Auslösen stay plain on purpose: they move money, not houses, and
 * a third and fourth colour would take the difference away again.
 */
const TONES: Record<Tone, string> = {
  plain:
    "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800",
  build:
    "border-emerald-700 bg-emerald-600 font-semibold text-white hover:bg-emerald-700",
  tear: "border-rose-700 bg-rose-600 font-semibold text-white hover:bg-rose-700",
};

function Small({
  label,
  onClick,
  testId,
  tone = "plain",
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly testId: string;
  readonly tone?: Tone;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`cursor-pointer rounded border px-1.5 py-0.5 text-[11px] ${TONES[tone]}`}
    >
      {label}
    </button>
  );
}
