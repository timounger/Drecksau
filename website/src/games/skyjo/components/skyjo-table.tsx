/**
 * The Skyjo table: every layout, the two piles and the controls for a turn.
 *
 * @module
 * @remarks
 * Presentational: it holds only the half-finished move (which pile the player
 * reached for), and reports finished moves through {@link SkyjoTableProps.onMove}.
 * The same component serves the game against the computer and the online game.
 *
 * A turn is played by touching the table, not by pressing buttons:
 *
 * - **Tap the draw pile** to turn a card over. It simply lands on the discard
 *   pile - there is nothing to tell it apart from a card already lying there.
 * - **Tap the discard pile** to pick its top card up, then tap one of your own
 *   cards to put it there.
 * - Not interested in the card you drew? **Tap one of your own face-down
 *   cards** straight away to turn it over instead and leave the drawn card
 *   lying.
 *
 * The pile therefore behaves the same whether the card on it was just drawn or
 * had been lying there all along, which is the whole point: a drawn card is not
 * held in the hand, it goes on the pile.
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

/**
/**
 * Whether the top card of the discard pile has been picked up.
 *
 * @remarks
 * One state covers both cases: it makes no difference to the player whether
 * that card was just drawn or had been lying there. Which move it turns into is
 * decided by `game.drawn`, which every client can see anyway.
 */
type Pending = "none" | "picked";

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

  const holding = game.phase === "turn" && game.drawn !== null;

  const picked = pending === "picked";

  // Which of my own cards may be touched right now.
  const selectable = (index: number): boolean => {
    let ok = false;
    if (myTurn && mySeat !== null) {
      const slot = game.players[mySeat].grid[index];
      if (game.phase === "flip") {
        ok = slot.state === "down";
      } else if (picked) {
        // A card in hand can go anywhere that is still in play.
        ok = slot.state !== "gone";
      } else if (holding) {
        // Nothing picked up, but a card was drawn: turning one of my own over
        // is the way to leave that card lying.
        ok = slot.state === "down";
      }
    }
    return ok;
  };

  const selectSlot = (index: number) => {
    if (game.phase === "flip") {
      play({ kind: "flip", index });
    } else if (picked) {
      // The picked-up card goes into the layout - it makes no difference
      // whether it was drawn a moment ago or had been lying there.
      play(
        holding ? { kind: "swapDrawn", index } : { kind: "takeDiscard", index },
      );
    } else if (holding) {
      play({ kind: "discardDrawn", index });
    }
  };

  /** Touching the draw pile turns a card over onto the discard pile. */
  const tapDeck = () => {
    if (myTurn && game.phase === "turn" && game.drawn === null) {
      play({ kind: "draw" });
    }
  };

  /**
   * Touching the discard pile picks its top card up, or puts it back.
   *
   * @remarks
   * The same either way, whether that card was just drawn or had been lying
   * there - which is exactly how it works on a real table.
   */
  const tapDiscard = () => {
    const something = holding || topOf(game.discard) !== null;
    if (myTurn && game.phase === "turn" && something) {
      setPending(picked ? "none" : "picked");
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
        onTapDeck={tapDeck}
        onTapDiscard={tapDiscard}
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
  } else if (pending === "picked") {
    text = T.placeHint;
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

/**
 * The two piles - the only controls a turn needs.
 *
 * @remarks
 * A drawn card is drawn lying **on** the discard pile, covering it, which is
 * where it physically ends up if the player leaves it there. What it covers is
 * still shown as a thin edge behind it, so the pile does not look empty.
 */
function Piles({
  game,
  active,
  pending,
  onTapDeck,
  onTapDiscard,
}: {
  readonly game: SkyjoGame;
  readonly active: boolean;
  readonly pending: Pending;
  readonly onTapDeck: () => void;
  readonly onTapDiscard: () => void;
}): ReactElement {
  const playable = active && game.phase === "turn";
  const drawing = playable && game.drawn === null;
  // What lies on top of the discard pile right now. A drawn card is simply the
  // new top - nothing marks it out, because on a real table nothing would.
  const onTop = game.drawn ?? topOf(game.discard);

  return (
    <section className="flex flex-wrap items-start justify-center gap-8 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <Pile
        label={T.deck}
        note={String(game.deck.length)}
        clickable={drawing}
        onClick={onTapDeck}
      >
        <SkyjoCard slot={{ state: "down", value: 0 }} size="large" />
      </Pile>

      <Pile
        label={T.discard}
        clickable={playable && onTop !== null}
        highlighted={pending === "picked"}
        onClick={onTapDiscard}
      >
        <LooseCard value={onTop} />
      </Pile>
    </section>
  );
}

/** One pile: a label, the card on top and an optional note underneath. */
function Pile({
  label,
  note,
  clickable,
  highlighted = false,
  onClick,
  children,
}: {
  readonly label: string;
  readonly note?: string;
  readonly clickable: boolean;
  readonly highlighted?: boolean;
  readonly onClick: () => void;
  readonly children: ReactElement;
}): ReactElement {
  const ring = highlighted
    ? " rounded-xl ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-zinc-950"
    : "";
  const hint = clickable
    ? " cursor-pointer hover:scale-105 hover:brightness-105"
    : " cursor-default";

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      <button
        type="button"
        aria-label={label}
        disabled={!clickable}
        onClick={onClick}
        className={`transition${hint}${ring} disabled:pointer-events-none`}
      >
        {children}
      </button>
      <span className="h-4 text-xs tabular-nums text-zinc-400">
        {note ?? ""}
      </span>
    </div>
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
