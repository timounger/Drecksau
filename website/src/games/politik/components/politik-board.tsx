/**
 * The table: the parliament and one card per party.
 *
 * @module
 * @remarks
 * The seating chart is the whole point of the board game, so it is the first
 * thing on screen. A majority is a thing you should be able to **see** - which
 * is why the seats are drawn as a hemicycle in party blocks and not as a row of
 * numbers, and why the majority line is drawn across it.
 */
"use client";

import { useMemo, type ReactElement, type ReactNode } from "react";
import {
  ABILITY_LABELS,
  ABILITIES,
  THEME_ICONS,
  THEME_LABELS,
  candidateById,
  officeCard,
  promiseById,
  scandalById,
} from "@/games/politik/engine/cards";
import {
  MAJORITY_SEATS,
  PARTY_INK,
  campaignStrength,
  diceCount,
  scandalPenalty,
  type Player,
  type PolitikGame,
} from "@/games/politik/engine/state";
import { POLITIK_TEXTS as T } from "@/games/politik/i18n/texts";

/** Props of {@link PolitikBoard}. */
export type PolitikBoardProps = {
  readonly game: PolitikGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  /** Seats the computer took over after their player left. */
  readonly botSeats?: readonly number[];
};

/** Rows of seats in the hemicycle - four reads well at any table size. */
const ROWS = 4;

/** Drawing box of the chart, in its own coordinates. */
const CHART_WIDTH = 200;
const CHART_HEIGHT = 108;

/** Inner and outer radius of the seat rows. */
const INNER_RADIUS = 42;
const ROW_GAP = 17;

/** Radius of one seat dot. */
const SEAT_RADIUS = 4.2;

/** Where the arc is centred inside the box. */
const CENTER_X = 100;
const CENTER_Y = 104;

/** Puts a seat in the middle of its slice rather than on the slice's edge. */
const SLICE_CENTER = 0.5;

/**
 * Steps per unit the seat coordinates are snapped to.
 *
 * @remarks
 * Not for tidiness: `Math.sin` and `Math.cos` are allowed to differ in their
 * last bits between JavaScript engines, and this chart is drawn once on the
 * server during the export and again in the browser. Without rounding, the two
 * differ in the sixteenth decimal, React sees attributes that do not match and
 * throws away the whole prerendered tree.
 */
const COORDINATE_STEPS = 100;

/**
 * Renders the parliament and every party.
 *
 * @param props - the game and who is reading it
 * @returns the board element
 */
export function PolitikBoard({
  game,
  mySeat,
  botSeats = [],
}: PolitikBoardProps): ReactElement {
  return (
    <section className="flex flex-col gap-4">
      <Parliament game={game} />
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {game.players.map((player, seat) => (
          <li key={player.name + seat}>
            <PartyCard
              player={player}
              game={game}
              seat={seat}
              isMe={seat === mySeat}
              isBotSeat={botSeats.includes(seat)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The seating chart, in party blocks from left to right. */
function Parliament({ game }: { readonly game: PolitikGame }): ReactElement {
  const seats = useMemo(() => hemicycle(game), [game]);
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label={`Parlament, Mehrheit ab ${MAJORITY_SEATS} Sitzen`}
        className="mx-auto block w-full max-w-xl"
      >
        {seats.map((spot, index) => (
          <circle
            key={index}
            cx={spot.x}
            cy={spot.y}
            r={SEAT_RADIUS}
            fill={PARTY_INK[spot.color] ?? "#a1a1aa"}
          />
        ))}
      </svg>
      <p className="mt-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
        {T.majorityHint(MAJORITY_SEATS)}
      </p>
    </div>
  );
}

/** One party: who they are, what they hold and how they stand. */
function PartyCard({
  player,
  game,
  seat,
  isMe,
  isBotSeat,
}: {
  readonly player: Player;
  readonly game: PolitikGame;
  readonly seat: number;
  readonly isMe: boolean;
  readonly isBotSeat: boolean;
}): ReactElement {
  const candidate =
    player.candidateId === null ? null : candidateById(player.candidateId);
  const onTurn = game.turn === seat && game.phase !== "gameOver";
  return (
    <article
      data-testid={`party-${seat}`}
      className={`flex h-full flex-col gap-2 rounded-2xl border p-3 text-sm ${
        onTurn
          ? "border-indigo-400 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/30"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <header className="flex items-center gap-2">
        <span
          aria-hidden
          className="h-4 w-4 shrink-0 rounded-full"
          style={{ backgroundColor: PARTY_INK[player.color] }}
        />
        <span className="min-w-0 flex-1 truncate font-semibold">
          {player.name}
          {isMe && ` (${T.youShort})`}
        </span>
        {(player.isBot || isBotSeat) && <Chip>{T.botTookOver}</Chip>}
      </header>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Stat value={player.seats} label={T.seats} />
        <Stat value={player.points} label={T.pointsShort} />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {player.themes.map((theme) => THEME_ICONS[theme]).join(" ")}{" "}
          {player.themes.map((theme) => THEME_LABELS[theme]).join(", ")}
        </span>
      </div>

      {player.offices.length > 0 && (
        <p className="flex flex-wrap gap-1">
          {player.offices.map((office) => (
            <Chip key={office} tone="gold">
              {officeCard(office).title}
            </Chip>
          ))}
        </p>
      )}

      {candidate === null ? (
        <p className="text-xs text-red-600 dark:text-red-400">
          {T.noCandidate}
        </p>
      ) : (
        <div className="flex flex-col gap-1 rounded-xl bg-zinc-50 p-2 dark:bg-zinc-800/60">
          <p className="flex items-baseline justify-between gap-2">
            <span className="min-w-0 truncate font-medium">
              {candidate.name}
            </span>
            <span className="shrink-0 tabular-nums">
              {campaignStrength(player)} WKP
              {diceCount(player, game.theme) > 1 && " ··"}
            </span>
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {ABILITIES.map(
              (ability) =>
                `${ABILITY_LABELS[ability]} ${candidate.abilities[ability]}`,
            ).join(" · ")}
          </p>
          {(player.bonus > 0 ||
            player.malus > 0 ||
            scandalPenalty(player) > 0) && (
            <p className="flex flex-wrap gap-1 text-xs">
              {player.bonus > 0 && <Chip tone="good">+{player.bonus}</Chip>}
              {player.malus > 0 && <Chip tone="bad">-{player.malus}</Chip>}
              {scandalPenalty(player) > 0 && (
                <Chip tone="bad">-{scandalPenalty(player)} Skandale</Chip>
              )}
            </p>
          )}
        </div>
      )}

      <ul className="flex flex-wrap gap-1 text-xs">
        {player.scandals.map((held, index) => {
          const card = scandalById(held.cardId);
          return (
            <li key={index}>
              {held.revealed && card !== null ? (
                <Chip tone="bad">
                  {card.title} (-{card.penalty})
                </Chip>
              ) : (
                <Chip>
                  {isMe && card !== null
                    ? `${card.title} (${T.scandalHidden})`
                    : `? ${T.scandalHidden}`}
                </Chip>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-auto flex flex-wrap gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          {T.promises}: {player.promises.length}
        </span>
        <span>·</span>
        <span>
          {T.oppositionCards}: {player.opposition.length}
        </span>
      </p>

      {isMe && player.promises.length > 0 && (
        <ul className="flex flex-wrap gap-1 text-xs">
          {player.promises.map((id) => {
            const card = promiseById(id);
            return card === null ? null : (
              <li key={id}>
                <Chip>
                  {THEME_ICONS[card.theme]} {card.title} ({card.points})
                </Chip>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}

/** One number with its label under it. */
function Stat({
  value,
  label,
}: {
  readonly value: number;
  readonly label: string;
}): ReactElement {
  return (
    <span className="flex items-baseline gap-1">
      <span className="text-lg font-bold tabular-nums">{value}</span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
    </span>
  );
}

/** A small pill. */
function Chip({
  children,
  tone = "plain",
}: {
  readonly children: ReactNode;
  readonly tone?: "plain" | "good" | "bad" | "gold";
}): ReactElement {
  const tones = {
    plain: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
    good: "bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100",
    bad: "bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100",
    gold: "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** One drawn seat: where it sits and which party it belongs to. */
type Spot = {
  readonly x: number;
  readonly y: number;
  readonly color: string;
};

/**
 * Lays every seat of the parliament out on a hemicycle.
 *
 * @remarks
 * The seats are placed row by row, the outer rows holding proportionally more,
 * and then coloured in one contiguous block per party going round the arc -
 * the way a real seating chart is drawn. Two parties are therefore never
 * interleaved, and a coalition is a wedge you can take in at a glance.
 */
function hemicycle(game: PolitikGame): readonly Spot[] {
  const total = game.players.reduce((sum, player) => sum + player.seats, 0);
  const spots: { angle: number; x: number; y: number }[] = [];
  if (total > 0) {
    const radii = Array.from(
      { length: ROWS },
      (unused, row) => INNER_RADIUS + ROW_GAP * row,
    );
    const spread = radii.reduce((sum, radius) => sum + radius, 0);
    let placed = 0;
    radii.forEach((radius, row) => {
      const count =
        row === ROWS - 1
          ? Math.max(0, total - placed)
          : Math.max(1, Math.round((total * radius) / spread));
      for (let index = 0; index < count; index++) {
        const angle = (Math.PI * (index + SLICE_CENTER)) / count;
        spots.push({
          angle,
          x: rounded(CENTER_X - radius * Math.cos(angle)),
          y: rounded(CENTER_Y - radius * Math.sin(angle)),
        });
      }
      placed += count;
    });
  }
  // Left of the chamber first, so the party blocks run round the arc in seat
  // order. A small angle is the left-hand end, because the seat is placed at
  // `CENTER_X - radius * cos(angle)`.
  spots.sort((left, right) => left.angle - right.angle);

  const colors: string[] = [];
  for (const player of game.players) {
    for (let index = 0; index < player.seats; index++) {
      colors.push(player.color);
    }
  }
  return spots.map((spot, index) => ({
    x: spot.x,
    y: spot.y,
    color: colors[index] ?? "",
  }));
}

/** Snaps a coordinate to a value both engines agree on - see the constant. */
function rounded(value: number): number {
  return Math.round(value * COORDINATE_STEPS) / COORDINATE_STEPS;
}
