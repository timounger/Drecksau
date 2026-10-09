/**
 * The board, built after the printed one.
 *
 * @module
 * @remarks
 * The DOG board is laid out like Mensch ärgere dich nicht: the track is a
 * **star**, one arm per colour. An arm goes out to the edge of the board, runs
 * across its tip and comes back in, and between two arms the track dips towards
 * the middle. Down the inside of each arm run that colour's four home fields,
 * hanging from the tip; its kennel sits outside the loop beside the tip, and
 * the four corners of the board carry the DOG badge.
 *
 * That is the whole of the geometry here, and it is built from three points per
 * colour: the tip's near corner - which is the start field - the tip's far
 * corner, and the valley halfway to the next colour. The fields are then spread
 * along that outline by **arc length**, so that counting five fields is the
 * same job along a straight as it is round a bend, and because every colour's
 * stretch is the same length the first field of each lands exactly on its own
 * tip.
 *
 * The printed board is square and has four colours on the front and six on the
 * back. Here the same star is drawn for two to six: at four it is the cross of
 * the front side, at six the snowflake of the back.
 *
 * The colours keep their own hues in both themes. A board is a printed thing;
 * the page around it carries the theme.
 */
"use client";

import type { ReactElement, ReactNode } from "react";
import {
  HOME_DEPTH,
  piecesPerSeat,
  ringSize,
  startField,
  type Piece,
} from "@/games/dog/engine/board";
import type { DogGame } from "@/games/dog/engine/state";
import { useSeatColours } from "@/games/dog/components/seat-colours";

/* eslint-disable @typescript-eslint/no-magic-numbers -- from here on the
   numbers are the drawing: how far an arm reaches, how deep the valley between
   two of them goes, where a badge sits. They are shapes, not arithmetic. */

/** How big the picture is, in its own units. */
const SIZE = 480;

/** The middle of it. */
const MID = SIZE / 2;

/** How far out the tip of an arm reaches. */
const ARM_OUT = 182;

/** How far in the valley between two arms dips. */
const ARM_IN = 104;

/** How wide the tip of an arm is, as a share of one colour's slice. */
const TIP_WIDE = 0.28;

/** How big a field is. */
const FIELD = 8.4;

/** How far apart two fields of a home are. */
const HOME_GAP = 23;

/** How far outside the loop the kennel sits. */
const KENNEL_OUT = 15;

/** How far apart two kennel spots are, as an angle. */
const KENNEL_STEP = 0.115;

/** How finely the loop is measured before it is cut into fields. */
const SAMPLES = 1200;

/** The wood the board is printed on. */
const FRAME = "#0c0f14";

/** And the blue of the board itself. */
const BOARD = "#2b5fc0";

/** An empty field of the track. */
const EMPTY = "#f8fafc";

/** The line round every field, and the thread between them. */
const INK = "#111827";

/** A point in the picture. */
type Spot = { readonly x: number; readonly y: number };

/** A field the picked piece could go to. */
export type Target = {
  /** The piece as it would stand there. */
  readonly piece: Piece;
  /** What that move is called, for screen readers. */
  readonly label: string;
};

/** What the board shows and what it lets the player do. */
export type DogBoardProps = {
  readonly game: DogGame;
  /** Which seat is the player, so their own colour can be marked. */
  readonly mySeat: number;
  /** The pieces that can be picked right now. */
  readonly pickable: readonly number[];
  /** The piece the player has already picked, if any. */
  readonly picked: number | null;
  /** Called when a piece is clicked. */
  readonly onPick: (piece: number) => void;
  /**
   * The fields the picked piece could go to, when there is more than one - the
   * piece as it would stand there, and what that move is called.
   */
  readonly targets?: readonly Target[];
  /** Called when one of them is clicked, with its place in the list. */
  readonly onTarget?: (index: number) => void;
  /**
   * Called when the pointer comes onto a piece that can be picked, and with
   * null when it leaves it again.
   */
  readonly onHover?: (piece: number | null) => void;
  /**
   * The piece under the pointer as it would stand after its move - or after
   * each of them, when it has several. Drawn faintly, as a preview.
   */
  readonly ghosts?: readonly Piece[];
  /**
   * What to do next, shown in the middle of the board - or nothing. Shown only
   * where the board has room for it, see {@link middleOf}.
   */
  readonly actions?: ReactNode;
  /** And the player's cards, in a row just below the middle. */
  readonly hand?: ReactNode;
  /** Something laid over the whole board for a moment - the opening. */
  readonly overlay?: ReactNode;
};

/**
 * Draws the board.
 *
 * @param props - the game, and what may be clicked on it
 * @returns the board
 */
export function DogBoard({
  game,
  mySeat,
  pickable,
  picked,
  onPick,
  targets = [],
  onTarget,
  onHover,
  ghosts = [],
  actions,
  hand,
  overlay,
}: DogBoardProps): ReactElement {
  const palette = useSeatColours();
  const seats = game.seats;
  const middle = middleOf(seats, game.players[mySeat]?.hand.length ?? 0);
  const open = new Set(pickable);
  const loop = fieldSpots(seats);
  const ring = ringSize(seats);
  return (
    <div className="overflow-x-auto rounded-2xl">
      <div className="relative min-w-[320px]">
        <svg
          viewBox={`0 0 ${String(SIZE)} ${String(SIZE)}`}
          className="block h-auto w-full select-none"
          role="img"
          aria-label={`Spielbrett mit ${String(ring)} Feldern, ${String(seats)} Zielen und ${String(seats)} Zwingern`}
          data-testid="dog-board"
        >
          <defs>
            {/* Licht von links oben auf jedem Spielkegel, in einer Tönung,
                die deutlich dunkler ist als die Farbe der Felder - so hebt sich
                eine Figur auf ihrem eigenen Start- oder Zielfeld ab. Ein
                Verlauf für den Körper, einer für den runden Kopf. */}
            {palette.slice(0, seats).map((colour, seat) => {
              const deep = shade(colour.solid, -PAWN.deeper);
              const night = shade(colour.solid, -PAWN.dark);
              return (
                <g key={colour.name}>
                  <linearGradient id={`dog-pawn-${String(seat)}`} x1="0" x2="1">
                    <stop offset="0" stopColor={shade(deep, PAWN.light)} />
                    <stop offset="0.38" stopColor={deep} />
                    <stop offset="1" stopColor={night} />
                  </linearGradient>
                  <radialGradient
                    id={`dog-pawn-head-${String(seat)}`}
                    cx="0.35"
                    cy="0.3"
                    r="0.8"
                  >
                    <stop offset="0" stopColor={shade(deep, PAWN.shine)} />
                    <stop offset="0.45" stopColor={deep} />
                    <stop offset="1" stopColor={night} />
                  </radialGradient>
                </g>
              );
            })}
            <filter id="dog-speckle">
              {/* The printed board is mottled rather than flat. */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.9"
                numOctaves={3}
                result="noise"
              />
              <feColorMatrix in="noise" type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.22" intercept="0" />
              </feComponentTransfer>
            </filter>
          </defs>
          <rect width={SIZE} height={SIZE} rx={10} fill={FRAME} />
          <rect
            x={8}
            y={8}
            width={SIZE - 16}
            height={SIZE - 16}
            rx={4}
            fill={BOARD}
          />
          <rect
            x={8}
            y={8}
            width={SIZE - 16}
            height={SIZE - 16}
            rx={4}
            filter="url(#dog-speckle)"
            opacity={0.5}
          />
          <Badges />
          <Thread points={loop} closed />
          {Array.from({ length: seats }, (unused, seat) => (
            <Quarter
              key={seat}
              seat={seat}
              seats={seats}
              name={game.players[seat]?.name ?? palette[seat]?.name ?? "?"}
              mine={seat === mySeat}
            />
          ))}
          {loop.map((at, field) => {
            const owner =
              field % (ring / seats) === 0 ? field / (ring / seats) : null;
            const colour = owner === null ? undefined : palette[owner];
            return (
              <circle
                key={field}
                cx={at.x}
                cy={at.y}
                r={FIELD}
                fill={colour?.solid ?? EMPTY}
                stroke={INK}
                strokeWidth={1.4}
              />
            );
          })}
          {/* Von hinten nach vorn: Wer weiter unten steht, steht vor dem, der
              weiter oben steht - sonst ragt ein Kopf durch einen Fuß. */}
          {[...game.pieces]
            .sort((a, b) => spotOf(a, seats).y - spotOf(b, seats).y)
            .map((piece) => (
              <PieceDot
                key={piece.id}
                piece={piece}
                seats={seats}
                mine={piece.seat === mySeat}
                open={open.has(piece.id)}
                picked={picked === piece.id}
                onPick={onPick}
                onHover={onHover}
              />
            ))}
          {/* **So stünde die Figur danach**: Solange der Zeiger auf einer
              wählbaren Figur liegt, steht sie blass dort, wo ihr Zug sie
              hinbringt. Für den Zeiger durchlässig, sonst verlöre die Figur
              darunter ihn. */}
          {ghosts.map((ghost) => {
            const at = spotOf(ghost, seats);
            return (
              <g
                key={`ghost-${String(ghost.id)}-${JSON.stringify(ghost.spot)}`}
                opacity={GHOST}
                pointerEvents="none"
                data-testid="dog-ghost"
              >
                <Pawn
                  x={at.x}
                  y={at.y}
                  seat={ghost.seat}
                  mine={ghost.seat === mySeat}
                />
              </g>
            );
          })}
          {/* **Wohin die gewählte Figur gehen kann**, wenn es mehr als ein
              Feld ist: Die Felder leuchten, und ein Klick darauf spielt den
              Zug. Über den Figuren, damit auch ein besetztes Feld - wer dort
              steht, wird geschlagen oder getauscht - den Klick bekommt. */}
          {/* Erst die Klickflächen über den Feldern - so hoch, wie eine Figur
              darauf ragt -, dann alle Felder obenauf: Liegen zwei Ziele
              nebeneinander, gehört jedes Feld sich selbst und nicht der
              Fläche über dem Nachbarn. */}
          {targets.map((target, index) => {
            const at = spotOf(target.piece, seats);
            return (
              <rect
                key={`reach-${String(target.piece.id)}-${JSON.stringify(target.piece.spot)}`}
                x={at.x - FIELD - 3}
                y={at.y - TARGET_REACH}
                width={(FIELD + 3) * 2}
                height={TARGET_REACH}
                fill="transparent"
                aria-hidden="true"
                onClick={() => onTarget?.(index)}
                style={{ cursor: "pointer" }}
              />
            );
          })}
          {targets.map((target, index) => (
            <TargetMark
              key={`${String(target.piece.id)}-${JSON.stringify(target.piece.spot)}`}
              at={spotOf(target.piece, seats)}
              label={target.label}
              index={index}
              onTarget={onTarget}
            />
          ))}
        </svg>
        {/* **Was zu tun ist, steht in der Mitte** des Bretts - und
          die eigenen Karten liegen gleich darunter in einer Reihe. Beide Felder
          sind genau so groß, wie dort zwischen Zielfeldern und Weg Platz ist,
          und alles darin misst sich an ihrer Breite (cqw): Es wächst mit dem
          Brett. */}
        {actions !== undefined && middle !== null && (
          <div
            data-testid="dog-hub"
            className="game-measured absolute flex items-center justify-center overflow-y-auto rounded-[8%] bg-white/90 text-zinc-900 shadow-lg select-none"
            style={boxStyle(middle.panel)}
          >
            {actions}
          </div>
        )}
        {hand !== undefined && middle !== null && (
          <div
            data-testid="dog-strip"
            className="game-measured absolute flex items-center justify-center select-none"
            style={boxStyle(middle.strip)}
          >
            {hand}
          </div>
        )}
        {overlay}
      </div>
    </div>
  );
}

/** Wie deutlich die Vorschau einer Figur zu sehen ist. */
const GHOST = 0.6;

/** Wie weit die Klickfläche eines Zielfelds über das Feld hinaufreicht - so
 * hoch, wie eine Figur darauf ragt. */
const TARGET_REACH = 22;

/** Ein Feld, auf das die gewählte Figur gehen kann. */
function TargetMark({
  at,
  label,
  index,
  onTarget,
}: {
  readonly at: Spot;
  readonly label: string;
  readonly index: number;
  readonly onTarget: ((index: number) => void) | undefined;
}): ReactElement {
  return (
    <g
      role="button"
      aria-label={label}
      data-testid={`dog-target-${String(index)}`}
      onClick={() => onTarget?.(index)}
      style={{ cursor: "pointer" }}
    >
      <circle
        cx={at.x}
        cy={at.y}
        r={FIELD + 3}
        fill="#fbbf24"
        fillOpacity={0.25}
        stroke="#fbbf24"
        strokeWidth={2.5}
        className="animate-pulse"
      />
    </g>
  );
}

/** A length in the picture as a share of its width, for CSS. */
function share(units: number): string {
  return `${String((units / SIZE) * 100)}%`;
}

/** A rectangle in the picture, in its own units. */
export type Box = {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
};

/** Where the two things in the middle go: what to do, and the cards. */
export type Middle = {
  /** What to do next: the top of the free square, down to just past centre. */
  readonly panel: Box;
  /** The cards: a row just below the centre, as wide as there is room. */
  readonly strip: Box;
};

/** A box as CSS, in shares of the picture. */
function boxStyle(box: Box): {
  left: string;
  top: string;
  width: string;
  height: string;
} {
  return {
    left: share(box.x),
    top: share(box.y),
    width: share(box.w),
    height: share(box.h),
  };
}

/**
 * Where the panel and the row of cards go in the middle of the board, if
 * there is room.
 *
 * @param seats - how many sit at the table
 * @param cards - how many cards lie in the row
 * @returns the two boxes, or null at a table without a free middle
 * @remarks
 * The panel is the upper part of the free square ({@link hubOf}). **The row
 * of cards is as big as it can be**: every height of row is tried at every
 * place a little below the centre, each as wide as it gets without touching a
 * single field of the track or of a home, and the one with the biggest cards
 * wins - a card is as wide as three quarters of the row's height, or as wide
 * as its share of the row, whichever is less. The row is then cut to exactly
 * those cards, so they fill it.
 *
 * Worked out once per table and hand size, and remembered: it is a search,
 * and the board asks every frame.
 */
export function middleOf(seats: number, cards: number): Middle | null {
  const key = `${String(seats)}/${String(cards)}`;
  const known = middles.get(key);
  let middle: Middle | null;
  if (known === undefined) {
    middle = searched(seats, Math.max(1, cards));
    middles.set(key, middle);
  } else {
    middle = known;
  }
  return middle;
}

/**
 * Wie eine Karte in der Reihe geschnitten ist (so breit wie drei Viertel ihrer
 * Höhe) und wie weit zwei auseinanderliegen (als Teil einer Kartenbreite) -
 * für die Reihe, die genau auf diese Maße zugeschnitten ist.
 */
export const CARD_CUT = { shape: 0.75, gap: 0.12 } as const;

/** What {@link middleOf} has already worked out. */
const middles = new Map<string, Middle | null>();

/** The search behind {@link middleOf}. */
function searched(seats: number, cards: number): Middle | null {
  const hub = hubOf(seats);
  let middle: Middle | null = null;
  if (hub !== null) {
    const panel = {
      x: MID - hub,
      y: MID - hub,
      w: hub * 2,
      h: hub * STRIP.panel,
    };
    const fields = [...fieldSpots(seats), ...homeFields(seats)];
    // Fallback: the bottom of the free square, which always fits.
    const inside = hub * (2 - STRIP.panel - STRIP.highest);
    let best = {
      y: MID + hub * STRIP.highest,
      size: Math.min(cardOf(hub * 2, cards), inside * STRIP.shape),
    };
    for (let top = STRIP.highest; top <= STRIP.lowest; top += STRIP.down) {
      const y = MID + hub * top;
      for (
        let high = STRIP.tallest;
        high >= STRIP.shortest;
        high -= STRIP.down
      ) {
        const h = hub * high;
        let w = hub * STRIP.widest;
        while (w > 0 && !clear({ x: MID - w / 2, y, w, h }, fields)) {
          w -= STRIP.step;
        }
        const size = Math.min(cardOf(w, cards), h * STRIP.shape);
        if (w > 0 && size > best.size) {
          best = { y, size };
        }
      }
    }
    // Cut to exactly the cards and their gaps, centred.
    const w = best.size * cards + (cards - 1) * best.size * STRIP.gap;
    middle = {
      panel,
      strip: { x: MID - w / 2, y: best.y, w, h: best.size / STRIP.shape },
    };
  }
  return middle;
}

/** How wide a card is when this many share a row this wide, gaps included. */
function cardOf(width: number, cards: number): number {
  return width / (cards + (cards - 1) * STRIP.gap);
}

/**
 * The proportions of the middle.
 *
 * @remarks
 * In shares of half the free square: the panel runs from the top of the
 * square to `panel` below it, just past the centre; a row may start anywhere
 * from `highest` to `lowest` below the centre, be from `shortest` to
 * `tallest` tall (in steps of `down`) and up to `widest` wide, narrowed in
 * steps of `step` picture units. A card is `shape` as wide as it is tall, and
 * the gap between two is `gap` of a card's width.
 */
const STRIP = {
  panel: 1.1,
  highest: 0.15,
  lowest: 1,
  down: 0.05,
  tallest: 1.6,
  shortest: 0.3,
  widest: 3.6,
  step: 2,
  shape: CARD_CUT.shape,
  gap: CARD_CUT.gap,
} as const;

/** Every field of every home, wherever it lies. */
function homeFields(seats: number): readonly Spot[] {
  const spots: Spot[] = [];
  for (let seat = 0; seat < seats; seat += 1) {
    for (let slot = 0; slot < HOME_DEPTH; slot += 1) {
      spots.push(homeSpot(seat, seats, slot));
    }
  }
  return spots;
}

/** Whether a box keeps clear of every field, with a margin. */
function clear(box: Box, fields: readonly Spot[]): boolean {
  const reach = FIELD + HUB_MARGIN;
  return fields.every(
    (at) =>
      at.x < box.x - reach ||
      at.x > box.x + box.w + reach ||
      at.y < box.y - reach ||
      at.y > box.y + box.h + reach,
  );
}

/** How far the free middle keeps clear of the homes and the track. */
const HUB_MARGIN = 4;

/** The smallest middle that is still worth putting cards into. */
const HUB_LEAST = 36;

/**
 * How big the free square in the middle of the board is, if there is one.
 *
 * @param seats - how many sit at the table
 * @returns half its side, in picture units, or null when there is no room
 * @remarks
 * The square must keep clear of two things: the innermost field of every home,
 * which points at the middle along its arm, and the track where it dips in
 * between two arms. Along an arm the edge of a square lies further out the
 * more slanted the arm is, so each arm is measured in its own direction. At a
 * table of two the homes run almost into the middle, and there is no square.
 */
export function hubOf(seats: number): number | null {
  const slice = (Math.PI * 2) / seats;
  const inner =
    ARM_OUT * Math.cos(slice * TIP_WIDE) -
    HOME_GAP * HOME_DEPTH -
    FIELD -
    HUB_MARGIN;
  let half = (ARM_IN - FIELD - HUB_MARGIN) / Math.SQRT2;
  for (let seat = 0; seat < seats; seat += 1) {
    const angle = armAngle(seat, seats);
    const along = Math.max(
      Math.abs(Math.cos(angle)),
      Math.abs(Math.sin(angle)),
    );
    half = Math.min(half, inner * along);
  }
  return half >= HUB_LEAST ? half : null;
}

/** The DOG badge in each of the four corners of the printed board. */
function Badges(): ReactElement {
  const corners: readonly { x: number; y: number; turn: number }[] = [
    { x: 52, y: 46, turn: -45 },
    { x: SIZE - 52, y: 46, turn: 45 },
    { x: SIZE - 52, y: SIZE - 46, turn: -45 },
    { x: 52, y: SIZE - 46, turn: 45 },
  ];
  return (
    <g>
      {corners.map((corner) => (
        <g
          key={`${String(corner.x)}-${String(corner.y)}`}
          transform={`translate(${String(corner.x)} ${String(corner.y)}) rotate(${String(corner.turn)})`}
        >
          <rect
            x={-34}
            y={-11}
            width={68}
            height={22}
            rx={11}
            fill="#c81f28"
            stroke="#f8fafc"
            strokeWidth={2}
          />
          <text
            x={0}
            y={1}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={14}
            fontWeight={800}
            letterSpacing={2}
            fill="#f8fafc"
          >
            DOG
          </text>
        </g>
      ))}
    </g>
  );
}

/** The thin thread the printed board draws between two fields. */
function Thread({
  points,
  closed = false,
}: {
  readonly points: readonly Spot[];
  readonly closed?: boolean;
}): ReactElement {
  const path = points
    .map(
      (at, index) =>
        `${index === 0 ? "M" : "L"}${at.x.toFixed(1)},${at.y.toFixed(1)}`,
    )
    .join(" ");
  return (
    <path
      d={closed ? `${path} Z` : path}
      fill="none"
      stroke="#e2e8f0"
      strokeWidth={2.5}
      strokeLinecap="round"
      opacity={0.75}
    />
  );
}

/** One colour's arm: its home, its kennel and its name. */
function Quarter({
  seat,
  seats,
  name,
  mine,
}: {
  readonly seat: number;
  readonly seats: number;
  readonly name: string;
  readonly mine: boolean;
}): ReactElement {
  const palette = useSeatColours();
  const colour = palette[seat];
  const homes = Array.from({ length: HOME_DEPTH }, (unused, slot) =>
    homeSpot(seat, seats, slot),
  );
  const kennels = Array.from({ length: piecesPerSeat(seats) }, (unused, at) =>
    kennelSpot(seat, seats, at),
  );
  const label = labelSpot(seat, seats);
  const first = fieldSpots(seats)[startField(seat)] ?? { x: MID, y: MID };
  return (
    <g>
      <Thread points={[first, ...homes]} />
      <Thread points={[first, ...kennels]} />
      {homes.map((at, slot) => (
        <circle
          key={`home-${String(slot)}`}
          cx={at.x}
          cy={at.y}
          r={FIELD}
          fill={colour?.solid ?? EMPTY}
          stroke={INK}
          strokeWidth={1.4}
          opacity={0.85}
        />
      ))}
      {kennels.map((at, index) => (
        <circle
          key={`kennel-${String(index)}`}
          cx={at.x}
          cy={at.y}
          r={FIELD}
          fill={colour?.solid ?? EMPTY}
          stroke={INK}
          strokeWidth={1.4}
          opacity={0.85}
        />
      ))}
      <text
        x={label.x}
        y={label.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontWeight={mine ? 800 : 600}
        fill="#f8fafc"
        stroke={FRAME}
        strokeWidth={2.5}
        paintOrder="stroke"
      >
        {name}
      </text>
    </g>
  );
}

/** One piece, wherever it is standing. */
function PieceDot({
  piece,
  seats,
  mine,
  open,
  picked,
  onPick,
  onHover,
}: {
  readonly piece: Piece;
  readonly seats: number;
  readonly mine: boolean;
  readonly open: boolean;
  readonly picked: boolean;
  readonly onPick: (piece: number) => void;
  readonly onHover: ((piece: number | null) => void) | undefined;
}): ReactElement {
  const at = spotOf(piece, seats);
  return (
    <g
      onClick={open ? () => onPick(piece.id) : undefined}
      onMouseEnter={open ? () => onHover?.(piece.id) : undefined}
      onMouseLeave={open ? () => onHover?.(null) : undefined}
      style={{ cursor: open ? "pointer" : "default" }}
      data-testid={`dog-piece-${String(piece.id)}`}
    >
      {/* Der Schatten auf dem Feld - so steht die Figur darauf. */}
      <ellipse
        cx={at.x + PAWN.drift}
        cy={at.y + PAWN.foot}
        rx={PAWN.base + 1}
        ry={PAWN.flat + 0.6}
        fill="#000000"
        opacity={0.35}
      />
      {(open || picked) && (
        <ellipse
          cx={at.x}
          cy={at.y + PAWN.foot}
          rx={PAWN.base + 5}
          ry={PAWN.flat + 3}
          fill="none"
          stroke={picked ? "#fbbf24" : "#f8fafc"}
          strokeWidth={2.5}
          opacity={picked ? 1 : 0.9}
        />
      )}
      <Pawn x={at.x} y={at.y} seat={piece.seat} mine={mine} />
    </g>
  );
}

/**
 * Die Maße eines Spielkegels, in Bildpunkten des Bretts.
 *
 * @remarks
 * Gedrechselt wie eine Figur aus Holz, schräg von oben gesehen: ein Fuß mit
 * sichtbarer Kante und einer zweiten Stufe darauf, eine schlanke Taille, ein
 * doppelter Kragen und ein runder Kopf. Der Fuß steht auf der Mitte des Feldes
 * (`foot` darunter), der Kopf ragt darüber hinaus - wie eine echte Figur über
 * ihr Feld.
 *
 * Die Farben: `deeper` macht die Figur dunkler als ihr Feld, `light` und
 * `shine` hellen die Lichtseite und den Kopf auf, `dark` ist die
 * Schattenseite.
 */
const PAWN = {
  foot: 3,
  base: 7.4,
  flat: 3,
  edge: 1.4,
  step: 1.7,
  stepWide: 5.2,
  stepFlat: 2.1,
  hip: 4.4,
  waist: 1.7,
  neck: -9.6,
  neckWide: 2,
  collar: 3.9,
  collarFlat: 1.35,
  ring: 2.7,
  ringUp: 1.2,
  ringFlat: 0.9,
  head: 4.4,
  headUp: 5,
  drift: 1.2,
  deeper: 0.3,
  light: 0.4,
  shine: 0.55,
  dark: 0.68,
} as const;

/** Ein Spielkegel, mit dem Fuß auf diesem Punkt. */
function Pawn({
  x,
  y,
  seat,
  mine,
}: {
  readonly x: number;
  readonly y: number;
  readonly seat: number;
  readonly mine: boolean;
}): ReactElement {
  const palette = useSeatColours();
  const colour = palette[seat];
  const solid = colour?.solid ?? "#94a3b8";
  const body = `url(#dog-pawn-${String(seat)})`;
  const head = `url(#dog-pawn-head-${String(seat)})`;
  // Der Rand in der dunklen Tönung der eigenen Farbe statt in Schwarz; die
  // eigenen Figuren tragen einen feinen hellen Rand.
  const line = mine ? "#f8fafc" : (colour?.ink ?? INK);
  const width = mine ? 1.1 : 0.8;
  const footY = y + PAWN.foot;
  const stepY = footY - PAWN.step;
  const neckY = y + PAWN.neck;
  const headY = neckY - PAWN.headUp;
  const left = `M ${String(x - PAWN.hip)} ${String(stepY)} C ${String(x - PAWN.waist)} ${String(stepY - 3)}, ${String(x - PAWN.waist)} ${String(neckY + 3)}, ${String(x - PAWN.neckWide)} ${String(neckY)}`;
  const right = `${String(x + PAWN.neckWide)} ${String(neckY)} C ${String(x + PAWN.waist)} ${String(neckY + 3)}, ${String(x + PAWN.waist)} ${String(stepY - 3)}, ${String(x + PAWN.hip)} ${String(stepY)}`;
  return (
    <g>
      {/* Der Fuß: die Kante unten, dunkel, und die Fläche obendrauf. */}
      <ellipse
        cx={x}
        cy={footY + PAWN.edge}
        rx={PAWN.base}
        ry={PAWN.flat}
        fill={shade(solid, -PAWN.dark)}
        stroke={line}
        strokeWidth={width}
      />
      <ellipse
        cx={x}
        cy={footY}
        rx={PAWN.base}
        ry={PAWN.flat}
        fill={body}
        stroke={line}
        strokeWidth={width}
      />
      {/* Die zweite Stufe des Fußes. */}
      <ellipse
        cx={x}
        cy={stepY}
        rx={PAWN.stepWide}
        ry={PAWN.stepFlat}
        fill={body}
        stroke={line}
        strokeWidth={width}
      />
      {/* Der Körper: schlank nach oben. Die Fläche ohne Rand, der Rand nur an
          den beiden Seiten - sonst liefe ein Strich quer über den Fuß. */}
      <path d={`${left} L ${right} Z`} fill={body} />
      <path d={left} fill="none" stroke={line} strokeWidth={width} />
      <path d={`M ${right}`} fill="none" stroke={line} strokeWidth={width} />
      {/* Ein schmaler Glanz auf der Lichtseite des Körpers. */}
      <path
        d={`M ${String(x - PAWN.hip + 1.6)} ${String(stepY - 1)} C ${String(x - PAWN.waist + 0.3)} ${String(stepY - 3.5)}, ${String(x - PAWN.waist + 0.3)} ${String(neckY + 3)}, ${String(x - PAWN.neckWide + 0.7)} ${String(neckY + 1)}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth={0.9}
        strokeLinecap="round"
        opacity={0.35}
      />
      {/* Der doppelte Kragen unter dem Kopf. */}
      <ellipse
        cx={x}
        cy={neckY}
        rx={PAWN.collar}
        ry={PAWN.collarFlat}
        fill={body}
        stroke={line}
        strokeWidth={width}
      />
      <ellipse
        cx={x}
        cy={neckY - PAWN.ringUp}
        rx={PAWN.ring}
        ry={PAWN.ringFlat}
        fill={body}
        stroke={line}
        strokeWidth={width}
      />
      {/* Und der Kopf: rund, mit Glanzpunkt. */}
      <circle
        cx={x}
        cy={headY}
        r={PAWN.head}
        fill={head}
        stroke={line}
        strokeWidth={width}
      />
      <ellipse
        cx={x - 1.4}
        cy={headY - 1.6}
        rx={1.4}
        ry={1}
        fill="#ffffff"
        opacity={0.6}
      />
    </g>
  );
}

/**
 * Eine Farbe heller oder dunkler gemischt.
 *
 * @param hex - die Farbe als `#rrggbb`
 * @param amount - wie weit: positiv zu Weiß hin, negativ zu Schwarz hin, bis eins
 * @returns die gemischte Farbe als `#rrggbb`
 */
function shade(hex: string, amount: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const target = amount >= 0 ? 255 : 0;
  const share = Math.abs(amount);
  const mix = (channel: number) =>
    Math.round(channel + (target - channel) * share)
      .toString(16)
      .padStart(2, "0");
  return `#${mix((value >> 16) & 255)}${mix((value >> 8) & 255)}${mix(value & 255)}`;
}

/** Where a piece stands, in the picture. */
function spotOf(piece: Piece, seats: number): Spot {
  const each = piecesPerSeat(seats);
  let at = kennelSpot(piece.seat, seats, piece.id % each);
  if (piece.spot.zone === "ring") {
    at = fieldSpots(seats)[piece.spot.field] ?? at;
  } else if (piece.spot.zone === "home") {
    at = homeSpot(piece.seat, seats, piece.spot.slot);
  }
  return at;
}

/* ------------------------------------------------------------- the star */

/** Every loop worked out so far, by how many sit at the table. */
const loops = new Map<number, readonly Spot[]>();

/**
 * Where every field of the loop lies.
 *
 * @param seats - how many sit at the table
 * @returns one point per field, the first of each colour on its own tip
 */
function fieldSpots(seats: number): readonly Spot[] {
  const had = loops.get(seats);
  let spots = had;
  if (spots === undefined) {
    spots = cutUp(outline(seats), ringSize(seats));
    loops.set(seats, spots);
  }
  return spots;
}

/**
 * The outline of the track: out along one side of an arm, across its tip, back
 * in, through the valley, and on to the next arm.
 *
 * @param seats - how many sit at the table
 * @returns points along the star, starting on the first colour's start field
 */
function outline(seats: number): readonly Spot[] {
  const slice = (Math.PI * 2) / seats;
  const tip = slice * TIP_WIDE;
  const corners: Spot[] = [];
  for (let seat = 0; seat < seats; seat += 1) {
    const axis = armAngle(seat, seats);
    corners.push(polar(axis - tip, ARM_OUT));
    corners.push(polar(axis + tip, ARM_OUT));
    corners.push(polar(axis + slice / 2, ARM_IN));
  }
  // Rounded only at the turns themselves: every run is cut into three first,
  // so the curve that rounds a corner has no room to bow the straight bits.
  const points = smooth(subdivide(corners));
  // **Begun right on the first start corner**: the rounded curve starts a bit
  // along the tip, and the start field would then lie one field past the
  // corner - with a white field between it and the kennel beside the corner.
  const corner = polar(armAngle(0, seats) - tip, ARM_OUT);
  let nearest = 0;
  points.forEach((point, at) => {
    const best = points[nearest] ?? point;
    if (
      Math.hypot(point.x - corner.x, point.y - corner.y) <
      Math.hypot(best.x - corner.x, best.y - corner.y)
    ) {
      nearest = at;
    }
  });
  return [...points.slice(nearest), ...points.slice(0, nearest)];
}

/** Cuts every run of a closed polygon into three, so bends stay local. */
function subdivide(corners: readonly Spot[]): readonly Spot[] {
  const out: Spot[] = [];
  for (let at = 0; at < corners.length; at += 1) {
    const here = corners[at] ?? { x: MID, y: MID };
    const next = corners[(at + 1) % corners.length] ?? here;
    out.push(here);
    for (const part of [1 / 3, 2 / 3]) {
      out.push({
        x: here.x + (next.x - here.x) * part,
        y: here.y + (next.y - here.y) * part,
      });
    }
  }
  return out;
}

/** Walks a closed polygon, rounding off every corner. */
function smooth(corners: readonly Spot[]): readonly Spot[] {
  const points: Spot[] = [];
  const each = Math.max(4, Math.round(SAMPLES / corners.length));
  for (let at = 0; at < corners.length; at += 1) {
    const here = corners[at] ?? { x: MID, y: MID };
    const next = corners[(at + 1) % corners.length] ?? here;
    const after = corners[(at + 2) % corners.length] ?? next;
    // A quadratic through the middle of each run, with the corner as its
    // control point: the line leaves one side of a bend and arrives at the
    // other without a crease.
    const from = middle(here, next);
    const to = middle(next, after);
    for (let step = 0; step < each; step += 1) {
      const part = step / each;
      points.push(bend(from, next, to, part));
    }
  }
  return points;
}

/** The middle of two points. */
function middle(one: Spot, other: Spot): Spot {
  return { x: (one.x + other.x) / 2, y: (one.y + other.y) / 2 };
}

/** A point along a quadratic curve. */
function bend(from: Spot, through: Spot, to: Spot, part: number): Spot {
  const rest = 1 - part;
  return {
    x: rest * rest * from.x + 2 * rest * part * through.x + part * part * to.x,
    y: rest * rest * from.y + 2 * rest * part * through.y + part * part * to.y,
  };
}

/** Cuts a closed outline into so many evenly spaced points. */
function cutUp(points: readonly Spot[], many: number): readonly Spot[] {
  const steps: number[] = [0];
  for (let at = 1; at <= points.length; at += 1) {
    const here = points[at % points.length] ?? { x: 0, y: 0 };
    const before = points[at - 1] ?? here;
    steps.push(
      (steps[at - 1] ?? 0) + Math.hypot(here.x - before.x, here.y - before.y),
    );
  }
  const total = steps[steps.length - 1] ?? 1;
  const spots: Spot[] = [];
  let cursor = 0;
  for (let field = 0; field < many; field += 1) {
    const want = (field / many) * total;
    while (cursor < steps.length - 2 && (steps[cursor + 1] ?? 0) < want) {
      cursor += 1;
    }
    const from = steps[cursor] ?? 0;
    const to = steps[cursor + 1] ?? from + 1;
    const part = to === from ? 0 : (want - from) / (to - from);
    const here = points[cursor] ?? { x: MID, y: MID };
    const next = points[(cursor + 1) % points.length] ?? here;
    spots.push({
      x: here.x + (next.x - here.x) * part,
      y: here.y + (next.y - here.y) * part,
    });
  }
  return spots;
}

/**
 * Which way a colour's arm points.
 *
 * @param seat - the colour in question
 * @param seats - how many sit at the table
 * @returns the angle of the arm, measured the way SVG measures them
 * @remarks
 * At the middle of an edge rather than at a corner, because on the printed
 * board the corners belong to the DOG badges. The first colour gets the bottom,
 * where the player sits, and the rest follow clockwise - which is also the way
 * the pieces walk.
 */
function armAngle(seat: number, seats: number): number {
  return (seat / seats) * Math.PI * 2 + Math.PI / 2;
}

/** A point at an angle and a distance from the middle. */
function polar(angle: number, reach: number): Spot {
  return {
    x: MID + Math.cos(angle) * reach,
    y: MID + Math.sin(angle) * reach,
  };
}

/**
 * Where a field of a home lies: down the inside of the arm, from its tip.
 *
 * @param seat - whose home
 * @param seats - how many sit at the table
 * @param slot - which field of it
 * @returns the point in the picture
 */
function homeSpot(seat: number, seats: number, slot: number): Spot {
  // Measured from where the tip actually runs, not from the corners it spans:
  // the row across a tip is a chord, so its middle lies nearer the centre than
  // ARM_OUT - and a home that started from ARM_OUT sat on top of it.
  const slice = (Math.PI * 2) / seats;
  const chord = ARM_OUT * Math.cos(slice * TIP_WIDE);
  return polar(armAngle(seat, seats), chord - HOME_GAP * (slot + 1));
}

/**
 * Where one spot of a kennel lies: outside the loop, beside the tip.
 *
 * @param seat - whose kennel
 * @param seats - how many sit at the table
 * @param at - which of its spots
 * @returns the point in the picture
 * @remarks
 * Walking away from the tip round the outside, which is how the printed board
 * lays them out: a row of four beside the start field, pointing at the corner.
 */
function kennelSpot(seat: number, seats: number, at: number): Spot {
  const slice = (Math.PI * 2) / seats;
  const start = armAngle(seat, seats) - slice * TIP_WIDE;
  return polar(start - KENNEL_STEP * (at + 1), ARM_OUT + KENNEL_OUT);
}

/** Where a colour is named: past the far end of its kennel. */
function labelSpot(seat: number, seats: number): Spot {
  const slice = (Math.PI * 2) / seats;
  const start = armAngle(seat, seats) - slice * TIP_WIDE;
  return polar(start + KENNEL_STEP * 1.1, ARM_OUT + KENNEL_OUT + 6);
}

/* eslint-enable @typescript-eslint/no-magic-numbers */
