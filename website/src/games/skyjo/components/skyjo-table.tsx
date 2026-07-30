/**
 * The Skyjo table: every layout, the two piles and the controls for a turn.
 *
 * @module
 * @remarks
 * Presentational: it holds only the half-finished move (which pile the player
 * reached for), and reports finished moves through {@link SkyjoTableProps.onMove}.
 * The same component serves the game against the computer and the online game.
 */
"use client";

import { useState, type ReactElement } from "react";
import { GRID_COLUMNS } from "@/games/skyjo/engine/cards";
import {
  topOf,
  type Player,
  type SkyjoGame,
  type SkyjoMove,
} from "@/games/skyjo/engine/state";
import { SKYJO_TEXTS as T } from "@/games/skyjo/i18n/texts";
import { LooseCard, SkyjoCard } from "./skyjo-card";

/** What the player has half-decided, while picking the card to act on. */
type Pending = "none" | "fromDiscard" | "swapDrawn" | "throwDrawn";

/** Props of {@link SkyjoTable}. */
export type SkyjoTableProps = {
  /** The game as this client may see it. */
  readonly game: SkyjoGame;
  /** Which seat is mine, or null when only watching. */
  readonly mySeat: number | null;
  readonly onMove: (move: SkyjoMove) => void;
  /** Blocks input, e.g. while a computer opponent is thinking. */
  readonly busy?: boolean;
};

/**
 * Renders the whole table.
 *
 * @param props - the game, my seat and where to send moves
 * @returns the table element
 */
export function SkyjoTable({
  game,
  mySeat,
  onMove,
  busy = false,
}: SkyjoTableProps): ReactElement {
  const [pending, setPending] = useState<Pending>("none");
  const myTurn =
    mySeat !== null &&
    game.turn === mySeat &&
    !busy &&
    game.phase !== "gameOver";

  const play = (move: SkyjoMove) => {
    setPending("none");
    onMove(move);
  };

  // Which of my own cards may be clicked right now.
  const selectable = (index: number): boolean => {
    let ok = false;
    if (myTurn && mySeat !== null) {
      const slot = game.players[mySeat].grid[index];
      if (game.phase === "flip") {
        ok = slot.state === "down";
      } else if (pending === "fromDiscard" || pending === "swapDrawn") {
        ok = slot.state !== "gone";
      } else if (pending === "throwDrawn") {
        ok = slot.state === "down";
      }
    }
    return ok;
  };

  const selectSlot = (index: number) => {
    if (game.phase === "flip") {
      play({ kind: "flip", index });
    } else if (pending === "fromDiscard") {
      play({ kind: "takeDiscard", index });
    } else if (pending === "swapDrawn") {
      play({ kind: "swapDrawn", index });
    } else if (pending === "throwDrawn") {
      play({ kind: "discardDrawn", index });
    }
  };

  const others = game.players
    .map((player, index) => ({ player, index }))
    .filter((entry) => entry.index !== mySeat);

  return (
    <div className="flex flex-col gap-4">
      <TurnBanner game={game} mySeat={mySeat} pending={pending} />

      <div className="flex flex-wrap items-start justify-center gap-4">
        {others.map((entry) => (
          <OpponentLayout
            key={entry.index}
            player={entry.player}
            onTurn={game.turn === entry.index && game.phase !== "gameOver"}
            endedRound={game.endedBy === entry.index}
          />
        ))}
      </div>

      <Piles
        game={game}
        active={myTurn}
        pending={pending}
        onTakeDiscard={() => setPending("fromDiscard")}
        onDraw={() => play({ kind: "draw" })}
        onSwapDrawn={() => setPending("swapDrawn")}
        onThrowDrawn={() => setPending("throwDrawn")}
        onCancel={() => setPending("none")}
      />

      {mySeat !== null && (
        <OwnLayout
          player={game.players[mySeat]}
          onTurn={myTurn}
          endedRound={game.endedBy === mySeat}
          isSelectable={selectable}
          onSelect={selectSlot}
        />
      )}
    </div>
  );
}

/** Says whose turn it is and what to do next. */
function TurnBanner({
  game,
  mySeat,
  pending,
}: {
  readonly game: SkyjoGame;
  readonly mySeat: number | null;
  readonly pending: Pending;
}): ReactElement {
  const mine = mySeat !== null && game.turn === mySeat;
  let text: string;
  if (game.phase === "gameOver") {
    text = T.gameOverTitle;
  } else if (game.phase === "roundOver") {
    text = T.roundOverTitle;
  } else if (!mine) {
    text = T.waitingFor(game.players[game.turn].name);
  } else if (game.phase === "flip") {
    text = T.openingHint;
  } else if (pending !== "none") {
    text = pending === "throwDrawn" ? T.flipHint : T.placeHint;
  } else if (game.drawn !== null) {
    text = T.drawnHint;
  } else {
    text = T.chooseSource;
  }

  return (
    <p
      data-testid="skyjo-banner"
      className={`rounded-xl px-3 py-2 text-center text-sm font-medium ${
        mine && game.phase !== "gameOver"
          ? "bg-indigo-600 text-white"
          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
      }`}
    >
      {text}
      {game.endedBy !== null && game.phase === "turn" && (
        <span className="ml-2 font-semibold">{T.lastRound}</span>
      )}
    </p>
  );
}

/** The draw pile, the discard pile and the card in hand. */
function Piles({
  game,
  active,
  pending,
  onTakeDiscard,
  onDraw,
  onSwapDrawn,
  onThrowDrawn,
  onCancel,
}: {
  readonly game: SkyjoGame;
  readonly active: boolean;
  readonly pending: Pending;
  readonly onTakeDiscard: () => void;
  readonly onDraw: () => void;
  readonly onSwapDrawn: () => void;
  readonly onThrowDrawn: () => void;
  readonly onCancel: () => void;
}): ReactElement {
  const canChoose = active && game.phase === "turn" && game.drawn === null;
  const holding = active && game.phase === "turn" && game.drawn !== null;
  const hasDown = game.players[game.turn]?.grid.some(
    (slot) => slot.state === "down",
  );

  return (
    <section className="flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.deck}
        </span>
        <SkyjoCard slot={{ state: "down", value: 0 }} size="large" />
        <span className="text-xs tabular-nums text-zinc-400">
          {game.deck.length}
        </span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.discard}
        </span>
        <LooseCard value={topOf(game.discard)} />
      </div>

      {game.drawn !== null && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-300">
            {T.drawn}
          </span>
          <LooseCard value={game.drawn} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        {canChoose && pending === "none" && (
          <>
            <Action
              onClick={onTakeDiscard}
              disabled={topOf(game.discard) === null}
            >
              {T.takeDiscard}
            </Action>
            <Action onClick={onDraw} primary>
              {T.drawCard}
            </Action>
          </>
        )}
        {holding && pending === "none" && (
          <>
            <Action onClick={onSwapDrawn} primary>
              {T.swapDrawn}
            </Action>
            <Action onClick={onThrowDrawn} disabled={hasDown !== true}>
              {T.throwAway}
            </Action>
          </>
        )}
        {pending !== "none" && <Action onClick={onCancel}>{T.cancel}</Action>}
      </div>
    </section>
  );
}

/** A button in the pile area. */
function Action({
  onClick,
  disabled = false,
  primary = false,
  children,
}: {
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly primary?: boolean;
  readonly children: string;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
        primary
          ? "bg-indigo-600 text-white hover:bg-indigo-700"
          : "border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

/** My own layout, the only one whose cards can be clicked. */
function OwnLayout({
  player,
  onTurn,
  endedRound,
  isSelectable,
  onSelect,
}: {
  readonly player: Player;
  readonly onTurn: boolean;
  readonly endedRound: boolean;
  readonly isSelectable: (index: number) => boolean;
  readonly onSelect: (index: number) => void;
}): ReactElement {
  return (
    <section
      data-testid="skyjo-own-layout"
      className={`mx-auto flex flex-col items-center gap-2 rounded-2xl border-2 p-3 ${
        onTurn ? "border-indigo-500" : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <PlayerLine player={player} endedRound={endedRound} />
      <Grid
        player={player}
        size="large"
        isSelectable={isSelectable}
        onSelect={onSelect}
      />
    </section>
  );
}

/** Another player's layout, shown smaller and never clickable. */
function OpponentLayout({
  player,
  onTurn,
  endedRound,
}: {
  readonly player: Player;
  readonly onTurn: boolean;
  readonly endedRound: boolean;
}): ReactElement {
  return (
    <section
      data-testid={`skyjo-layout-${player.name}`}
      className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 ${
        onTurn ? "border-indigo-500" : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <PlayerLine player={player} endedRound={endedRound} />
      <Grid player={player} size="small" />
    </section>
  );
}

/** A player's name and points. */
function PlayerLine({
  player,
  endedRound,
}: {
  readonly player: Player;
  readonly endedRound: boolean;
}): ReactElement {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-semibold">{player.name}</span>
      {endedRound && <span aria-label={T.lastRound}>🏁</span>}
      <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
        {player.total} {T.points}
      </span>
    </div>
  );
}

/** The three-by-four layout itself. */
function Grid({
  player,
  size,
  isSelectable,
  onSelect,
}: {
  readonly player: Player;
  readonly size: "small" | "large";
  readonly isSelectable?: (index: number) => boolean;
  readonly onSelect?: (index: number) => void;
}): ReactElement {
  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))` }}
    >
      {player.grid.map((slot, index) => (
        <SkyjoCard
          key={index}
          slot={slot}
          size={size}
          selectable={isSelectable?.(index) ?? false}
          onSelect={() => onSelect?.(index)}
        />
      ))}
    </div>
  );
}
