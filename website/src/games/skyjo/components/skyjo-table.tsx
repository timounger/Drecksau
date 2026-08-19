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

import { useState, type ReactElement, type ReactNode } from "react";
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
  /**
   * Seats the computer plays because the player left, by seat index.
   *
   * @remarks
   * Only online: in the game against the computer every opponent is one
   * anyway, and labelling them all would say nothing.
   */
  readonly botSeats?: readonly number[];
  /**
   * The turn clock, shown beside whose turn it is.
   *
   * @remarks
   * Passed in rather than built here, because only an online table has one:
   * offline nobody is waiting on anybody.
   */
  readonly clock?: ReactNode;
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
  botSeats = [],
  clock,
}: SkyjoTableProps): ReactElement {
  const [pending, setPending] = useState<Pending>("none");
  // A half-made choice must not outlive the turn it was made in: online the
  // computer may play a seat that dithers, and the stale "picked" would
  // otherwise make the next tap take a card nobody asked for. Adjusting state
  // during render is React's own answer to "reset when a prop changes".
  const [seenTurn, setSeenTurn] = useState(game.turn);
  if (seenTurn !== game.turn) {
    setSeenTurn(game.turn);
    setPending("none");
  }
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

  /**
   * Touching the draw pile turns a card over onto the discard pile.
   *
   * @remarks
   * One thing, once a turn. It goes dead the moment a card is out, because a
   * second tap there would have nothing left to do: whether you then take that
   * card or leave it is decided by what you touch next, not by tapping the pile
   * it came from again.
   */
  const tapDeck = () => {
    if (myTurn && game.phase === "turn" && game.drawn === null) {
      play({ kind: "draw" });
    }
  };

  /**
   * Touching the discard pile takes its top card into your hand.
   *
   * @remarks
   * Always takes, never puts back. Tapping the card you want reads as "I'll
   * have that one" and nothing else, whether it was just drawn or had been
   * lying there - so tapping twice must not quietly undo the first tap. To
   * leave a drawn card, tap the draw pile.
   */
  const tapDiscard = () => {
    const something = holding || topOf(game.discard) !== null;
    if (myTurn && game.phase === "turn" && something) {
      setPending("picked");
    }
  };

  const others = game.players
    .map((player, index) => ({ player, index }))
    .filter((entry) => entry.index !== mySeat);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-center gap-4">
        {others.map((entry) => (
          <OpponentLayout
            key={entry.index}
            player={entry.player}
            onTurn={game.turn === entry.index && game.phase !== "gameOver"}
            endedRound={game.endedBy === entry.index}
            isBot={botSeats.includes(entry.index)}
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
          isBot={botSeats.includes(mySeat)}
          isSelectable={selectable}
          onSelect={selectSlot}
        />
      )}

      <TurnBanner game={game} mySeat={mySeat} pending={pending} clock={clock} />
    </div>
  );
}

/**
 * Says whose turn it is and what to do next.
 *
 * @remarks
 * Sits **below** the own hand, and deliberately so. Its text is a sentence
 * whose length changes with every phase, so above the table it would wrap to a
 * second line now and then and shove everything under it down a notch - your
 * own cards would never sit still. As the last thing on the table it can grow
 * and shrink without moving a single card.
 */
function TurnBanner({
  game,
  mySeat,
  pending,
  clock,
}: {
  readonly game: SkyjoGame;
  readonly mySeat: number | null;
  readonly pending: Pending;
  readonly clock?: ReactNode;
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
      {clock !== undefined && <span className="ml-2">{clock}</span>}
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
    ? " rounded-xl ring-4 ring-emerald-500 ring-offset-2 drop-shadow-lg dark:ring-offset-zinc-950"
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
      <span
        className={`h-4 text-xs tabular-nums ${
          highlighted
            ? "font-semibold text-emerald-600 dark:text-emerald-400"
            : "text-zinc-400"
        }`}
      >
        {highlighted ? T.inHand : (note ?? "")}
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
  isBot,
}: {
  readonly player: Player;
  readonly onTurn: boolean;
  readonly endedRound: boolean;
  readonly isSelectable: (index: number) => boolean;
  readonly onSelect: (index: number) => void;
  readonly isBot: boolean;
}): ReactElement {
  return (
    <section
      data-testid="skyjo-own-layout"
      className={`mx-auto flex flex-col items-center gap-2 rounded-2xl border-2 p-3 ${
        onTurn ? "border-indigo-500" : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <PlayerLine player={player} endedRound={endedRound} isBot={isBot} />
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
  isBot,
}: {
  readonly player: Player;
  readonly onTurn: boolean;
  readonly endedRound: boolean;
  readonly isBot: boolean;
}): ReactElement {
  return (
    <section
      data-testid={`skyjo-layout-${player.name}`}
      className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 ${
        onTurn ? "border-indigo-500" : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <PlayerLine player={player} endedRound={endedRound} isBot={isBot} />
      <Grid player={player} size="small" />
    </section>
  );
}

/** A player's name and points. */
function PlayerLine({
  player,
  endedRound,
  isBot,
}: {
  readonly player: Player;
  readonly endedRound: boolean;
  readonly isBot: boolean;
}): ReactElement {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-semibold">{player.name}</span>
      {isBot && <ComputerBadge />}
      {endedRound && <span aria-label={T.lastRound}>🏁</span>}
      <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
        {player.total} {T.points}
      </span>
    </div>
  );
}

/** A pill marking a seat the computer took over after the player left. */
function ComputerBadge(): ReactElement {
  return (
    <span
      data-testid="skyjo-bot-badge"
      className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
    >
      🤖 {T.computerBadge}
    </span>
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
