/**
 * The cockpit, laid out the way the board is.
 *
 * @module
 * @remarks
 * Not a list of spaces any more but the panel itself: the attitude indicator and
 * the speed gauge as one round instrument in the middle, the rudder and the
 * radio either side of it, the engines under it, the brake arc under those, and
 * the landing gear and flaps on their own panels down the two edges. The two
 * strips slide in at the top, each showing its window.
 *
 * That matters for more than looks. On the real board the two aerodynamics
 * markers sit **on the same dial as the speed**, so "which band is this sum in"
 * is one glance rather than a subtraction; and the gear and flaps sit at the
 * edges precisely because each of them pushes one of those markers. A row of
 * labelled buttons hides the one relationship the game is about.
 *
 * The panel keeps its own colours in both themes. It is a piece of painted
 * cardboard - a real one does not go dark at dusk, and the page around it
 * carries the theme instead.
 *
 * Placing is still two taps: a die, then a space. The coffee shifts the die by
 * one per cup in between, and the spaces it can reach change as it does.
 */
"use client";

import { useState, type ReactElement } from "react";
import { legalMoves, shifts } from "@/games/sky-team/engine/moves";
import {
  BRAKE_VALUES,
  COPILOT,
  PILOT,
  SPACES,
  type Seat,
  type Space,
} from "@/games/sky-team/engine/spaces";
import {
  ALTITUDES,
  airportAt,
  blueMarker,
  brakeStrength,
  isFinalRound,
  orangeMarker,
  type SkyTeamGame,
  type SkyTeamMove,
} from "@/games/sky-team/engine/state";
import { SKY_TEAM_TEXTS as T } from "@/games/sky-team/i18n/texts";

/** How far the attitude indicator swings either way before the red cross. */
const AXIS_SCALE = 3;

/** Degrees the horizon turns per step of the indicator. */
const AXIS_STEP_DEG = 15;

/** The speeds printed round the gauge. */
const GAUGE_FROM = 2;
const GAUGE_TO = 12;

/**
 * The arc the gauge occupies, in degrees clockwise from straight up.
 *
 * @remarks
 * From the lower left round the **bottom** to the lower right, because that is
 * where it is printed on the board - under the horizon, not over it. Running it
 * across the top would put the numbers where the two red crosses live, and the
 * crosses are the one thing on this dial that must never be misread.
 */
const GAUGE_START = 250;
const GAUGE_END = 110;

/** The board's own colours, which do not follow the page's theme. */
const PANEL = "#7f8c93";
const PANEL_DARK = "#5d686e";
const BLUE = "#1f3f9e";
const ORANGE = "#d4661d";

/** Props of {@link SkyTeamCockpit}. */
export type SkyTeamCockpitProps = {
  readonly game: SkyTeamGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: Seat | null;
  readonly onMove: (move: SkyTeamMove) => void;
};

/**
 * Renders the whole cockpit.
 *
 * @param props - the landing, who is reading it and where moves go
 * @returns the cockpit element
 */
export function SkyTeamCockpit({
  game,
  mySeat,
  onMove,
}: SkyTeamCockpitProps): ReactElement {
  const [die, setDie] = useState<number | null>(null);
  const [shift, setShift] = useState(0);

  const mine =
    mySeat !== null && game.active === mySeat && game.stage === "placing";
  const moves = mySeat === null ? [] : legalMoves(game, mySeat);
  const reachable = new Set(
    moves
      .filter(
        (move) =>
          move.kind === "place" && move.die === die && move.shift === shift,
      )
      .map((move) => (move.kind === "place" ? move.space : "")),
  );

  const place = (id: string) => {
    if (die !== null) {
      onMove({ kind: "place", space: id, die, shift });
      setDie(null);
      setShift(0);
    }
  };

  const slot = (id: string): SlotProps => ({
    space: SPACES.find((each) => each.id === id) as Space,
    value: game.placed[id],
    open: reachable.has(id),
    onPick: () => place(id),
  });

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-3">
      <Strips game={game} />

      <div
        className="flex gap-1 rounded-2xl p-2 shadow-lg"
        style={{ background: PANEL }}
      >
        <SidePanel
          game={game}
          seat={PILOT}
          title={T.gear}
          ids={["gear-0", "gear-1", "gear-2"]}
          slot={slot}
        />

        <div
          className="flex flex-1 flex-col items-center gap-2 rounded-xl p-2"
          style={{ background: PANEL_DARK }}
        >
          <div className="flex w-full items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <Tokens game={game} />
              <Slot {...slot("radio-p")} label={T.radio} icon={"\u{1F3A7}"} />
            </div>
            <Instrument game={game} />
            <div className="flex flex-col gap-1">
              <Slot {...slot("radio-c0")} label={T.radio} icon={"\u{1F3A7}"} />
              <Slot {...slot("radio-c1")} label={T.radio} icon={"\u{1F3A7}"} />
            </div>
          </div>

          <Pair label={T.axis}>
            <Slot {...slot("axis-p")} label={T.axis} icon={"\u{21C4}"} />
            <Slot {...slot("axis-c")} label={T.axis} icon={"\u{21C4}"} />
          </Pair>

          <Pair label={T.engines}>
            <Slot {...slot("engine-p")} label={T.engines} icon={"\u{1F300}"} />
            <Slot {...slot("engine-c")} label={T.engines} icon={"\u{1F300}"} />
          </Pair>

          <BrakeArc game={game} />

          <div className="flex items-center gap-1">
            {["brake-0", "brake-1", "brake-2"].map((id, index) => (
              <div key={id} className="flex items-center gap-1">
                {index > 0 && (
                  <span aria-hidden className="text-xs text-white/70">
                    {"\u{25B8}"}
                  </span>
                )}
                <Switched
                  on={game.brakes[index]}
                  slot={slot(id)}
                  label={String(BRAKE_VALUES[index])}
                />
              </div>
            ))}
          </div>

          <Coffee slot={slot} />
        </div>

        <SidePanel
          game={game}
          seat={COPILOT}
          title={T.flaps}
          ids={["flaps-0", "flaps-1", "flaps-2", "flaps-3"]}
          slot={slot}
        />
      </div>

      {mySeat !== null && (
        <Hand
          game={game}
          seat={mySeat}
          mine={mine}
          die={die}
          shift={shift}
          onDie={(index) => {
            setDie(index === die ? null : index);
            setShift(0);
          }}
          onShift={setShift}
          onReroll={() => onMove({ kind: "reroll" })}
        />
      )}
    </section>
  );
}

/**
 * The two strips that slide in at the top, each with its window.
 *
 * @remarks
 * Three cells of each are shown: the one behind, the window, and what is
 * coming. On the board the rest of the strip is hidden under the panel, and
 * what you can see of the approach - how many aircraft are still between you
 * and the runway - is the whole of the planning.
 */
function Strips({ game }: { readonly game: SkyTeamGame }): ReactElement {
  const airport = airportAt(game);
  return (
    <div className="flex justify-center gap-3">
      <div className="flex flex-col items-center gap-0.5">
        <span className="rounded-t-md bg-lime-600 px-3 py-0.5 text-[10px] font-bold text-white">
          YUL Montreal-Trudeau
        </span>
        {[2, 1, 0].map((ahead) => {
          const at = game.position + ahead;
          return (
            <Window
              key={ahead}
              current={ahead === 0}
              data-testid={ahead === 0 ? "sky-position" : undefined}
            >
              {at > airport ? (
                "\u{00B7}"
              ) : at === airport ? (
                <span className="text-[10px] font-bold">
                  {"\u{1F6EC}"} {T.airport}
                </span>
              ) : game.traffic[at] === 0 ? (
                <span className="text-[10px] opacity-60">{T.clear}</span>
              ) : (
                <span>{"\u{2708}\u{FE0F}".repeat(game.traffic[at])}</span>
              )}
            </Window>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-0.5">
        <span className="rounded-t-md bg-amber-500 px-3 py-0.5 text-[10px] font-bold text-white">
          {T.altitude}
        </span>
        {[2, 1, 0].map((below) => {
          const at = game.altitude + below;
          return (
            <Window key={below} current={below === 0}>
              {at >= ALTITUDES.length ? (
                "\u{00B7}"
              ) : at === ALTITUDES.length - 1 ? (
                <span className="text-[10px] font-bold">
                  {"\u{1F6E9}\u{FE0F}"}
                </span>
              ) : (
                <span className="tabular-nums">{ALTITUDES[at]}</span>
              )}
            </Window>
          );
        })}
      </div>
    </div>
  );
}

/** One cell of a strip; the current one is the lit window. */
function Window({
  current,
  children,
}: {
  readonly current: boolean;
  readonly children: React.ReactNode;
}): ReactElement {
  return (
    <span
      data-testid={current ? "sky-window" : undefined}
      className={`flex h-8 w-32 items-center justify-center rounded-md text-sm font-semibold ${
        current
          ? "bg-sky-900 text-sky-100 ring-2 ring-sky-300"
          : "bg-slate-800/80 text-slate-400"
      }`}
    >
      {children}
    </span>
  );
}

/* eslint-disable @typescript-eslint/no-magic-numbers -- drawing, not arithmetic.
   Everything below is a radius, a coordinate or a stroke width on a 200 by 200
   canvas. Naming each one would put a lookup table between this file and the
   dial it draws, and the dial is the thing being described. */

/**
 * The attitude indicator with the speed gauge round it.
 *
 * @remarks
 * One instrument, because on the board it is one: the horizon turns with the
 * rudder, and the ring of numbers around it carries both aerodynamics markers.
 * A sum of eight is not a number to look up - it is a place on this dial, and
 * whether it sits left of the blue marker, between the two, or past the orange
 * one is the answer.
 */
function Instrument({ game }: { readonly game: SkyTeamGame }): ReactElement {
  const blue = blueMarker(game);
  const orange = orangeMarker(game);
  const speed = game.speed;
  const ticks = Array.from(
    { length: AXIS_SCALE * 2 + 1 },
    (unused, index) => index - AXIS_SCALE,
  );
  const numbers = Array.from(
    { length: GAUGE_TO - GAUGE_FROM + 1 },
    (unused, index) => GAUGE_FROM + index,
  );

  return (
    <svg
      viewBox="0 0 200 200"
      className="h-44 w-44 shrink-0 sm:h-52 sm:w-52"
      data-testid="sky-axis"
      role="img"
      aria-label={`${T.axis} ${game.axis}, ${T.markers(blue, orange)}`}
    >
      {/* The speed gauge: the ring of numbers the two markers sit on. */}
      <circle cx="100" cy="100" r="94" fill="#2b3238" />
      {numbers.map((value, index) => {
        const angle =
          GAUGE_START +
          ((GAUGE_END - GAUGE_START) * index) / (numbers.length - 1);
        const spot = onCircle(angle, 80);
        const lit =
          speed !== null && speed === value
            ? "#ffffff"
            : value === blue
              ? "#5b9bf8"
              : value === orange
                ? "#f0862c"
                : "#cfd6da";
        return (
          <g key={value}>
            {value === blue && <Marker angle={angle} colour="#5b9bf8" />}
            {value === orange && <Marker angle={angle} colour="#f0862c" />}
            <text
              x={spot.x}
              y={spot.y + 3}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill={lit}
            >
              {value}
            </text>
          </g>
        );
      })}

      {/* The bezel of the attitude indicator, with the two red crosses. */}
      <circle cx="100" cy="100" r="62" fill="#1c2226" />
      {ticks.map((tick) => {
        const angle = tick * AXIS_STEP_DEG;
        const spot = onCircle(angle, 55);
        return Math.abs(tick) === AXIS_SCALE ? (
          <text
            key={tick}
            x={spot.x}
            y={spot.y + 4}
            textAnchor="middle"
            fontSize="12"
            fontWeight="900"
            fill="#e2453a"
          >
            {"\u{2715}"}
          </text>
        ) : (
          <circle
            key={tick}
            cx={spot.x}
            cy={spot.y}
            r={tick === 0 ? 3 : 2}
            fill="#e8edf0"
          />
        );
      })}

      {/* The horizon, which turns with the rudder.

          The same way as the pointer, not against it. A real instrument
          counter-rotates its horizon against a fixed aircraft, but the board's
          attitude indicator is a single round token you physically turn - so
          disc and arrow move together. Turning them opposite ways put the two
          halves of one dial in disagreement, and a player reading the horizon
          would have got the tilt backwards. */}
      <g transform={`rotate(${game.axis * AXIS_STEP_DEG} 100 100)`}>
        <clipPath id="sky-horizon">
          <circle cx="100" cy="100" r="46" />
        </clipPath>
        <g clipPath="url(#sky-horizon)">
          <rect x="54" y="54" width="92" height="46" fill="#4aa8dc" />
          <rect x="54" y="100" width="92" height="46" fill="#9a6a34" />
          <rect x="54" y="98" width="92" height="4" fill="#f2f5f7" />
        </g>
      </g>

      {/* The aircraft symbol, which never moves. */}
      <g stroke="#f8fbfd" strokeWidth="3" strokeLinecap="round">
        <path d="M72 100 h18" />
        <path d="M110 100 h18" />
        <path d="M100 100 v-6" />
      </g>
      <circle cx="100" cy="100" r="2.5" fill="#f8fbfd" />

      {/* Where the indicator is standing right now. */}
      <g
        transform={`rotate(${game.axis * AXIS_STEP_DEG} 100 100)`}
        data-testid="sky-axis-pointer"
      >
        <path d="M100 30 l6 10 h-12 Z" fill="#ffd84a" />
      </g>
    </svg>
  );
}

/**
 * One of the two mandatory pairs, named.
 *
 * @remarks
 * The board prints the word beside the pair, and it earns its place: these are
 * the only two spaces that must be filled every round, and the only two whose
 * effect is a comparison between the seats rather than something one of you
 * does alone.
 */
function Pair({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}): ReactElement {
  return (
    <div className="flex w-full items-center justify-center gap-2">
      <span className="w-20 text-right text-[10px] font-bold text-white/80">
        {label}
      </span>
      <span className="flex gap-6">{children}</span>
      <span className="w-20" />
    </div>
  );
}

/**
 * A short coloured bar on the gauge, where an aerodynamics marker stands.
 *
 * @remarks
 * Drawn **outside** the ring of numbers, not across it. The first version ran
 * the bar from radius 68 to 90 and the numbers sit at 80 - so each marker
 * neatly covered the very figure it was pointing at, and the two speeds that
 * decide how far the plane moves were the only two you could not read.
 */
function Marker({
  angle,
  colour,
}: {
  readonly angle: number;
  readonly colour: string;
}): ReactElement {
  const inner = onCircle(angle, 88);
  const outer = onCircle(angle, 97);
  return (
    <line
      x1={inner.x}
      y1={inner.y}
      x2={outer.x}
      y2={outer.y}
      stroke={colour}
      strokeWidth="6"
      strokeLinecap="round"
    />
  );
}

/** A point on a circle round the middle of the dial, measured from straight up. */
function onCircle(angleDeg: number, radius: number): { x: number; y: number } {
  const radians = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: 100 + radius * Math.cos(radians),
    y: 100 + radius * Math.sin(radians),
  };
}

/** The brake track: how fast you may still be going when you touch down. */
function BrakeArc({ game }: { readonly game: SkyTeamGame }): ReactElement {
  const strength = brakeStrength(game);
  return (
    <div
      className="flex items-center gap-1 rounded-full px-3 py-1"
      style={{ background: "#1c2226" }}
      data-testid="sky-brakes"
    >
      <span aria-hidden className="text-[10px] text-white/60">
        {"\u{1F6D1}"}
      </span>
      {BRAKE_SCALE.map((value) => (
        <span
          key={value}
          className={`h-4 w-4 rounded-sm text-center text-[10px] leading-4 font-bold ${
            value <= strength
              ? "bg-red-500 text-white"
              : "bg-zinc-700 text-zinc-300"
          }`}
        >
          {value}
        </span>
      ))}
      <span className="ml-1 text-[10px] font-semibold text-white/80">
        {T.brakeStrength(strength)}
      </span>
    </div>
  );
}

/** The numbers printed along the brake track. */
const BRAKE_SCALE: readonly number[] = [2, 3, 4, 5, 6];

/** The reroll tokens and the coffee cups in the pot. */
function Tokens({ game }: { readonly game: SkyTeamGame }): ReactElement {
  return (
    <div className="flex flex-col gap-0.5 text-[10px] font-semibold text-white/90">
      <span data-testid="sky-rerolls">
        {"\u{1F3B2}"} {game.rerolls}
      </span>
      <span data-testid="sky-coffee">
        {"\u{2615}"} {game.coffee}
      </span>
      {isFinalRound(game) && (
        <span className="rounded bg-amber-400 px-1 text-[9px] text-amber-950">
          {T.finalRound}
        </span>
      )}
    </div>
  );
}

/** One player's own edge panel: the gear, or the flaps. */
function SidePanel({
  game,
  seat,
  title,
  ids,
  slot,
}: {
  readonly game: SkyTeamGame;
  readonly seat: Seat;
  readonly title: string;
  readonly ids: readonly string[];
  readonly slot: (id: string) => SlotProps;
}): ReactElement {
  const on = seat === PILOT ? game.gear : game.flaps;
  return (
    <div
      className="flex w-20 shrink-0 flex-col items-center gap-1 rounded-xl p-1.5 sm:w-24"
      style={{ background: seat === PILOT ? "#243a6b" : "#8a4415" }}
    >
      <span className="text-[9px] font-bold text-white/90">{title}</span>
      <span className="text-[9px] text-white/60">
        {game.players[seat].name}
      </span>
      {ids.map((id, index) => (
        <Switched key={id} on={on[index]} slot={slot(id)} />
      ))}
    </div>
  );
}

/** The concentration row along the bottom, with the pot of cups. */
function Coffee({
  slot,
}: {
  readonly slot: (id: string) => SlotProps;
}): ReactElement {
  return (
    <div
      className="flex w-full items-center justify-center gap-2 rounded-lg px-2 py-1"
      style={{ background: "#1c2226" }}
    >
      <span className="text-[10px] text-white/70">{T.coffee}</span>
      {["coffee-0", "coffee-1", "coffee-2"].map((id) => (
        <Slot key={id} {...slot(id)} icon={"\u{2615}"} both />
      ))}
    </div>
  );
}

/** What one space needs to draw itself. */
type SlotProps = {
  readonly space: Space;
  readonly value: number | null;
  readonly open: boolean;
  readonly onPick: () => void;
};

/**
 * One space, with a die on it or the numbers it wants.
 *
 * @remarks
 * Coloured by whose it is, because on the board that is the first thing you
 * read: blue is the pilot's, orange the co-pilot's, and a space split down the
 * middle is one either of you may use.
 */
function Slot({
  space,
  value,
  open,
  onPick,
  label,
  icon,
  both = false,
}: SlotProps & {
  readonly label?: string;
  readonly icon?: string;
  readonly both?: boolean;
}): ReactElement {
  const wants =
    space.kind === "brake"
      ? String(BRAKE_VALUES[space.slot])
      : (space.values?.join("/") ?? icon ?? "\u{00B7}");
  const seatColour =
    both || space.seat === null
      ? `linear-gradient(90deg, ${BLUE} 50%, ${ORANGE} 50%)`
      : space.seat === PILOT
        ? BLUE
        : ORANGE;
  return (
    <button
      type="button"
      disabled={!open}
      onClick={onPick}
      data-testid={`sky-${space.id}`}
      title={label ?? wants}
      className={`flex h-9 w-9 items-center justify-center rounded-md text-xs leading-none font-bold text-white ${
        open ? "cursor-pointer ring-2 ring-amber-300" : ""
      } ${value !== null ? "ring-2 ring-emerald-300" : ""}`}
      style={{ background: seatColour }}
    >
      {value !== null ? (
        <span className="text-base">{value}</span>
      ) : (
        <span>{wants}</span>
      )}
    </button>
  );
}

/** A space with the little switch under it that shows green when it is out. */
function Switched({
  on,
  slot,
  label,
}: {
  readonly on: boolean;
  readonly slot: SlotProps;
  readonly label?: string;
}): ReactElement {
  return (
    <span className="flex items-center gap-1">
      <Slot {...slot} label={label} />
      <span
        aria-hidden
        title={on ? "\u{2705}" : ""}
        className={`h-3 w-3 shrink-0 rounded-full border ${
          on
            ? "border-emerald-200 bg-emerald-400"
            : "border-zinc-500 bg-zinc-700"
        }`}
      />
    </span>
  );
}

/* eslint-enable @typescript-eslint/no-magic-numbers */

/** Your own dice, and what the coffee could do to them. */
function Hand({
  game,
  seat,
  mine,
  die,
  shift,
  onDie,
  onShift,
  onReroll,
}: {
  readonly game: SkyTeamGame;
  readonly seat: Seat;
  readonly mine: boolean;
  readonly die: number | null;
  readonly shift: number;
  readonly onDie: (index: number) => void;
  readonly onShift: (shift: number) => void;
  readonly onReroll: () => void;
}): ReactElement {
  const dice = game.players[seat].dice;
  const other = game.players[seat === PILOT ? COPILOT : PILOT];
  const room = die === null ? [0] : shifts(game, dice[die]);
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold">{T.yourDice}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.behindScreen}: {other.name} {"\u{00B7}"} {other.dice.length}{" "}
          {T.hidden}
        </p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {dice.map((face, index) => (
          <li key={`${index}-${face}`}>
            <button
              type="button"
              disabled={!mine}
              onClick={() => onDie(index)}
              data-testid={`sky-die-${index}`}
              className={`h-12 w-12 rounded-xl text-xl font-bold text-white tabular-nums ${
                index === die ? "ring-4 ring-amber-400" : ""
              } ${mine ? "cursor-pointer" : "opacity-60"}`}
              style={{ background: seat === PILOT ? BLUE : ORANGE }}
            >
              {face}
            </button>
          </li>
        ))}
      </ul>
      {die !== null && room.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {T.useCoffee}:
          </span>
          {room.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onShift(option)}
              data-testid={`sky-shift-${option}`}
              className={`rounded-lg border px-2 py-1 text-xs font-semibold ${
                option === shift
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50"
                  : "cursor-pointer border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {dice[die] + option}
              {option === 0 ? "" : ` (${Math.abs(option)}\u{2615})`}
            </button>
          ))}
        </div>
      )}
      {mine && game.rerolls > 0 && (
        <button
          type="button"
          onClick={onReroll}
          data-testid="sky-reroll"
          className="cursor-pointer self-start rounded-lg border border-amber-400 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200"
        >
          {T.reroll} ({game.rerolls})
        </button>
      )}
    </div>
  );
}
