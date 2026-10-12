/**
 * The table: the board, the move in hand, Mister X's travel log and the
 * pieces with their tickets - the same for a game against the computer and
 * for an online room.
 *
 * @module
 * @remarks
 * It is handed the game **as the viewer may see it**. A detective's screen
 * never gets Mister X's position, so there is nothing here to hide - it simply
 * is not there.
 */
"use client";

import { useState, type ReactElement } from "react";
import { ScotlandYardBoard } from "@/games/scotland-yard/components/scotland-yard-board";
import {
  canDouble,
  detectiveOptions,
  misterXOptions,
  pieceOnTurn,
  playerOnTurn,
} from "@/games/scotland-yard/engine/moves";
import type { Transport } from "@/games/scotland-yard/engine/map";
import {
  REVEAL_MOVES,
  ROUNDS,
  type ScotlandYardGame,
  type ScotlandYardMove,
  type Ticket,
} from "@/games/scotland-yard/engine/state";
import {
  hidingPlaces,
  lastSeen,
  shownPosition,
} from "@/games/scotland-yard/engine/view";
import {
  SCOTLAND_YARD_TEXTS as T,
  TICKET_COLOURS,
  TICKET_NAMES,
} from "@/games/scotland-yard/i18n/texts";

/** The steps the zoom buttons go through. */
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- the zoom steps themselves
const ZOOMS: readonly number[] = [1, 1.5, 2, 3];

/** The land tickets, in the order the boards list them. */
const LAND: readonly ("taxi" | "bus" | "underground")[] = [
  "taxi",
  "bus",
  "underground",
];

/** How many lines the travel log has in each variant. */
const LOG_LINES: Readonly<Record<ScotlandYardGame["variant"], number>> = {
  standard: 24,
  intro: 14,
};

/** One way to get to the chosen station. */
type Choice = { readonly ticket: Ticket | Transport };

/**
 * Renders the table.
 *
 * @param props - the game as the viewer sees it, the players they move, and
 *   where a move goes
 * @returns the table
 */
export function ScotlandYardTable({
  view,
  mine,
  showHiding,
  onMove,
}: {
  /** The game as the viewer may see it. */
  readonly view: ScotlandYardGame;
  /** The players the viewer moves, by index. */
  readonly mine: readonly number[];
  /** Whether to mark every station Mister X can be at. */
  readonly showHiding: boolean;
  readonly onMove: (move: ScotlandYardMove) => void;
}): ReactElement {
  const [zoom, setZoom] = useState(1);
  const [picked, setPicked] = useState<number | null>(null);
  const [double, setDouble] = useState(false);
  const onTurn = playerOnTurn(view);
  const myTurn = onTurn !== null && mine.includes(onTurn);
  const piece = pieceOnTurn(view);
  const asMisterX = myTurn && view.phase === "misterX";
  const asDetective = myTurn && view.phase === "detectives" && piece !== null;

  // What a tap on each station would do, grouped by station.
  const ways = new Map<number, Choice[]>();
  if (asMisterX) {
    for (const option of misterXOptions(view)) {
      ways.set(option.to, [
        ...(ways.get(option.to) ?? []),
        { ticket: option.ticket },
      ]);
    }
  } else if (asDetective) {
    for (const option of detectiveOptions(view, piece)) {
      ways.set(option.to, [
        ...(ways.get(option.to) ?? []),
        { ticket: option.ticket },
      ]);
    }
  }

  const send = (station: number, ticket: Ticket | Transport) => {
    if (asMisterX && ticket !== "ferry") {
      onMove({
        kind: "misterX",
        to: station,
        ticket,
        double: double && canDouble(view),
      });
    } else if (asDetective && ticket !== "black") {
      onMove({ kind: "detective", piece, to: station, ticket });
    }
    setPicked(null);
    setDouble(false);
  };

  const pick = (station: number) => {
    const choices = ways.get(station) ?? [];
    if (choices.length === 1) {
      send(station, choices[0].ticket);
    } else {
      setPicked(station);
    }
  };

  const hiding =
    showHiding && view.hidden && view.phase !== "over"
      ? hidingPlaces(view)
      : [];
  const focus = asDetective
    ? (view.detectives[piece]?.position ?? null)
    : asMisterX
      ? view.misterX.position
      : null;
  const choices = picked === null ? [] : (ways.get(picked) ?? []);

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <StatusLine view={view} mine={mine} />
        {asMisterX && canDouble(view) && (
          <label className="flex cursor-pointer items-center gap-2 self-start rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700">
            <input
              type="checkbox"
              checked={double}
              onChange={(event) => setDouble(event.target.checked)}
              data-testid="sy-double"
              className="h-4 w-4 accent-zinc-900"
            />
            <span className="font-semibold">{T.double}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {T.doubleHint}
            </span>
          </label>
        )}
        {choices.length > 1 && picked !== null && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-2 text-sm dark:border-amber-800 dark:bg-amber-950/40">
            <span className="font-semibold">{T.pickTicket(picked)}</span>
            {choices.map((choice) => (
              <button
                key={choice.ticket}
                type="button"
                onClick={() => send(picked, choice.ticket)}
                data-testid={`sy-ticket-${choice.ticket}`}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <TicketDot ticket={choice.ticket} />
                {TICKET_NAMES[choice.ticket]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="cursor-pointer rounded-lg px-2 py-1 text-xs text-zinc-500 hover:underline"
            >
              {T.cancel}
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() =>
              setZoom(ZOOMS[Math.max(0, ZOOMS.indexOf(zoom) - 1)] ?? 1)
            }
            disabled={zoom === ZOOMS[0]}
            className="cursor-pointer rounded-lg border border-zinc-300 px-2 py-1 disabled:opacity-40 dark:border-zinc-700"
          >
            − {T.zoomOut}
          </button>
          <button
            type="button"
            onClick={() =>
              setZoom(
                ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS.indexOf(zoom) + 1)] ?? 1,
              )
            }
            disabled={zoom === ZOOMS.at(-1)}
            data-testid="sy-zoom-in"
            className="cursor-pointer rounded-lg border border-zinc-300 px-2 py-1 disabled:opacity-40 dark:border-zinc-700"
          >
            + {T.zoomIn}
          </button>
          {myTurn && (
            <span className="text-zinc-500 dark:text-zinc-400">
              {T.pickStation}
            </span>
          )}
          {hiding.length > 0 && (
            <span className="font-semibold text-purple-700 dark:text-purple-300">
              {T.hidingPlaces(hiding.length)}
            </span>
          )}
        </div>
        <ScotlandYardBoard
          view={view}
          targets={
            new Map(
              [...ways].map(([station, choices]) => [
                station,
                choices.map((choice) => choice.ticket),
              ]),
            )
          }
          hiding={hiding}
          zoom={zoom}
          focus={focus}
          onPick={pick}
        />
      </div>
      <aside className="flex w-full flex-col gap-3 lg:w-80">
        <TravelLog view={view} />
        <PieceList view={view} />
      </aside>
    </div>
  );
}

/** Whose move it is, and the round. */
function StatusLine({
  view,
  mine,
}: {
  readonly view: ScotlandYardGame;
  readonly mine: readonly number[];
}): ReactElement {
  const onTurn = playerOnTurn(view);
  const piece = pieceOnTurn(view);
  const player = onTurn === null ? null : view.players[onTurn];
  let line: string;
  if (view.phase === "over") {
    line = T.winner(view.winner ?? "misterX", view.misterX.name);
  } else if (onTurn !== null && mine.includes(onTurn)) {
    line =
      view.phase === "misterX"
        ? view.doubling
          ? T.yourSecondMove
          : T.yourMoveX(view.misterX.name)
        : T.yourMoveDetective(view.detectives[piece ?? 0]?.name ?? "");
  } else if (player?.isBot === true) {
    line = T.computerThinks;
  } else if (view.phase === "misterX") {
    line = T.waitingX(view.misterX.name);
  } else {
    line = T.waitingDetective(
      view.detectives[piece ?? 0]?.name ?? "",
      player?.name ?? "",
    );
  }
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <p className="text-sm font-semibold" data-testid="sy-status">
        {line}
      </p>
      <span
        className="text-xs text-zinc-500 dark:text-zinc-400"
        data-testid="sy-round"
      >
        {T.round(view.round, ROUNDS[view.variant])}
      </span>
    </div>
  );
}

/** Mister X's travel log: one line per move, his station where it may be seen. */
function TravelLog({
  view,
}: {
  readonly view: ScotlandYardGame;
}): ReactElement {
  const seen = lastSeen(view);
  const now = shownPosition(view);
  const lines = Math.max(LOG_LINES[view.variant], view.log.length);
  return (
    <section
      className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800"
      data-testid="sy-log"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">
          {T.log} - {view.misterX.name}
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.black} {view.misterX.black} · {T.doubleTickets}{" "}
          {view.misterX.double}
        </span>
      </div>
      <p className="text-xs text-zinc-600 dark:text-zinc-300">
        {now !== null
          ? T.visibleAt(now)
          : seen === null
            ? T.neverSeen
            : T.lastSeen(seen.station)}
      </p>
      <ol className="grid grid-cols-4 gap-1 text-xs">
        {Array.from({ length: lines }, (unused, index) => {
          const entry = view.log[index];
          const number = index + 1;
          const reveal =
            view.variant === "standard" && REVEAL_MOVES.includes(number);
          return (
            <li
              key={number}
              className={`flex items-center gap-1 rounded-md border px-1 py-0.5 ${
                reveal
                  ? "border-zinc-900 dark:border-zinc-200"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
              title={reveal ? T.logReveal : undefined}
            >
              <span className="w-4 text-right text-[10px] text-zinc-400">
                {number}
              </span>
              {entry === undefined ? (
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
              ) : (
                <>
                  {entry.ticket === null ? (
                    <span className="font-bold">{T.logHidden}</span>
                  ) : (
                    <TicketDot ticket={entry.ticket} />
                  )}
                  <span className="font-mono font-semibold">
                    {entry.station ?? ""}
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** The detectives' pieces, who moves them, where they stand and their tickets. */
function PieceList({
  view,
}: {
  readonly view: ScotlandYardGame;
}): ReactElement {
  const active = pieceOnTurn(view);
  return (
    <section className="flex flex-col gap-1 rounded-2xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
      <ul className="flex flex-col gap-1">
        {view.detectives.map((piece, index) => (
          <li
            key={`${piece.name}-${String(index)}`}
            className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
              index === active
                ? "bg-amber-50 ring-1 ring-amber-300 dark:bg-amber-950/40 dark:ring-amber-800"
                : ""
            }`}
          >
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: piece.colour }}
            >
              {piece.bobby ? "B" : piece.name.slice(0, 1)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-semibold">{piece.name}</span>{" "}
              <span className="text-zinc-500 dark:text-zinc-400">
                ({view.players[piece.controller]?.name ?? ""})
              </span>
            </span>
            <span className="font-mono">{piece.position}</span>
            <span className="flex gap-1">
              {piece.tickets === null ? (
                <span className="text-zinc-400">{T.noTickets}</span>
              ) : (
                LAND.map((transport) => (
                  <span
                    key={transport}
                    className="flex items-center gap-0.5 font-mono"
                  >
                    <TicketDot ticket={transport} />
                    {piece.tickets?.[transport] ?? 0}
                  </span>
                ))
              )}
            </span>
          </li>
        ))}
      </ul>
      {view.variant === "standard" && (
        <p className="flex items-center gap-2 pt-1 text-zinc-500 dark:text-zinc-400">
          {T.supply}:
          {LAND.map((transport) => (
            <span
              key={transport}
              className="flex items-center gap-0.5 font-mono"
            >
              <TicketDot ticket={transport} />
              {view.supply[transport]}
            </span>
          ))}
        </p>
      )}
    </section>
  );
}

/** A small round chip in a ticket's colour. */
function TicketDot({
  ticket,
}: {
  readonly ticket: Ticket | Transport;
}): ReactElement {
  return (
    <span
      aria-label={TICKET_NAMES[ticket]}
      title={TICKET_NAMES[ticket]}
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/20"
      style={{ backgroundColor: TICKET_COLOURS[ticket] }}
    />
  );
}
