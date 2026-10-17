/**
 * The table: the song, the move in hand, the active player's timeline and
 * everybody's cards and tokens - the same for a game against the computer and
 * for an online room.
 *
 * @module
 */
"use client";

import { useEffect, useState, type ReactElement } from "react";
import { SongPlayer } from "@/games/hitster/components/song-player";
import {
  SongCard,
  Timeline,
  type GapMark,
} from "@/games/hitster/components/timeline";
import {
  freeSlots,
  historyOf,
  playerOnTurn,
} from "@/games/hitster/engine/rules";
import { SONGS } from "@/games/hitster/engine/songs";
import {
  BUY_COST,
  type HistoryEntry,
  type HitsterGame,
  type HitsterMove,
} from "@/games/hitster/engine/state";
import { HITSTER_TEXTS as T } from "@/games/hitster/i18n/texts";

/** The look of a main and a quiet button. */
const MAIN =
  "cursor-pointer rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-40";
const QUIET =
  "cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800";

/**
 * Renders the table.
 *
 * @param props - the game, the viewer's seat (null for somebody watching) and
 *   where a move goes
 * @returns the table
 */
export function HitsterTable({
  game,
  mine,
  onMove,
}: {
  readonly game: HitsterGame;
  readonly mine: number | null;
  readonly onMove: (move: HitsterMove) => void;
}): ReactElement {
  const [slot, setSlot] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const onTurn = playerOnTurn(game);
  const myTurn = mine !== null && onTurn === mine;
  const active = game.players[game.active];
  const me = mine === null ? undefined : game.players[mine];

  // A new turn or phase clears what was being picked.
  /* eslint-disable react-hooks/set-state-in-effect -- reset per turn */
  useEffect(() => {
    setSlot(null);
    setTitle("");
    setArtist("");
  }, [game.turns, game.phase]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const placing = myTurn && game.phase === "place";
  const challenging = myTurn && game.phase === "challenge";
  const pickable = placing
    ? Array.from({ length: (active?.timeline.length ?? 0) + 1 }, (u, at) => at)
    : challenging
      ? freeSlots(game)
      : [];
  const marks: GapMark[] = [
    ...(game.slot === null
      ? []
      : [
          {
            slot: game.slot,
            label: active?.name ?? "",
            tone: "placed" as const,
          },
        ]),
    ...game.challenges.map((one) => ({
      slot: one.slot,
      label: game.players[one.player]?.name ?? "",
      tone: "challenge" as const,
    })),
    ...(slot === null
      ? []
      : [
          {
            slot,
            label: "?",
            tone: placing ? ("placed" as const) : ("challenge" as const),
          },
        ]),
  ];

  return (
    <div className="flex flex-col gap-4">
      <Status game={game} mine={mine} />
      <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        {game.phase !== "over" ? (
          <SongPlayer
            video={SONGS[game.song]?.video ?? ""}
            turn={game.turns}
            onBroken={placing ? () => onMove({ kind: "broken" }) : null}
          />
        ) : (
          <div />
        )}
        <div className="flex flex-col gap-3">
          {placing && (
            <section className="flex flex-col gap-2 rounded-2xl border border-fuchsia-200 bg-fuchsia-50/60 p-3 dark:border-fuchsia-900 dark:bg-fuchsia-950/30">
              <p className="text-sm font-semibold">{T.pickSlot}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {T.nameHint}
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={T.title_}
                  data-testid="hit-title"
                  className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
                <input
                  value={artist}
                  onChange={(event) => setArtist(event.target.value)}
                  placeholder={T.artist}
                  data-testid="hit-artist"
                  className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={slot === null}
                  data-testid="hit-confirm"
                  onClick={() =>
                    slot !== null &&
                    onMove({ kind: "place", slot, title, artist })
                  }
                  className={MAIN}
                >
                  {T.confirm}
                </button>
                <button
                  type="button"
                  disabled={(me?.tokens ?? 0) < 1}
                  onClick={() => onMove({ kind: "skip" })}
                  className={QUIET}
                >
                  {T.skip}
                </button>
                <button
                  type="button"
                  disabled={(me?.tokens ?? 0) < BUY_COST}
                  onClick={() => onMove({ kind: "buy" })}
                  className={QUIET}
                >
                  {T.buy}
                </button>
              </div>
            </section>
          )}
          {challenging && (
            <section className="flex flex-col gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-sm font-semibold">
                {T.challengeAsk(active?.name ?? "")}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={slot === null}
                  data-testid="hit-hitster"
                  onClick={() =>
                    slot !== null && onMove({ kind: "challenge", slot })
                  }
                  className="cursor-pointer rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-amber-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {T.hitster}
                </button>
                <button
                  type="button"
                  data-testid="hit-pass"
                  onClick={() => onMove({ kind: "pass" })}
                  className={QUIET}
                >
                  {T.pass}
                </button>
              </div>
            </section>
          )}
          {(game.phase === "reveal" || game.phase === "over") &&
            game.outcome !== null && (
              <Reveal
                game={game}
                mine={mine}
                canGoOn={myTurn && game.phase === "reveal"}
                onNext={() => onMove({ kind: "next" })}
              />
            )}
          <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
            <h2 className="text-sm font-semibold">
              {game.active === mine
                ? T.yourTimeline
                : T.turnOf(active?.name ?? "")}{" "}
              · {T.cards(active?.timeline.length ?? 0, game.target)} ·{" "}
              {T.tokens(active?.tokens ?? 0)}
            </h2>
            <Timeline
              songs={active?.timeline ?? []}
              pickable={pickable}
              onPick={setSlot}
              marks={
                game.phase === "reveal" || game.phase === "over" ? [] : marks
              }
            />
          </section>
        </div>
      </div>
      <section className="grid gap-2 sm:grid-cols-2">
        {game.players.map((player, index) =>
          index === game.active ? null : (
            <div
              key={`${player.name}-${String(index)}`}
              className={`flex flex-col gap-1 rounded-xl border p-2 ${
                index === mine
                  ? "border-fuchsia-300 dark:border-fuchsia-800"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <span className="text-xs font-semibold">
                {player.name} · {T.cards(player.timeline.length, game.target)} ·{" "}
                {T.tokens(player.tokens)}
              </span>
              <Timeline
                songs={player.timeline}
                pickable={[]}
                onPick={() => undefined}
                marks={[]}
                compact
              />
            </div>
          ),
        )}
      </section>
      <History game={game} />
    </div>
  );
}

/** Whose move it is and what the table waits for. */
function Status({
  game,
  mine,
}: {
  readonly game: HitsterGame;
  readonly mine: number | null;
}): ReactElement {
  const onTurn = playerOnTurn(game);
  const who = onTurn === null ? undefined : game.players[onTurn];
  const active = game.players[game.active]?.name ?? "";
  let line: string;
  if (game.phase === "over") {
    line = T.winner(game.players[game.winner ?? 0]?.name ?? "");
  } else if (onTurn === mine && game.phase === "place") {
    line = T.yourTurn;
  } else if (who?.isBot === true) {
    line = T.computerThinks(who.name);
  } else if (game.phase === "challenge") {
    line = T.challengeWait(who?.name ?? "");
  } else if (game.phase === "reveal") {
    line = game.active === mine ? T.yourNext : T.waitNext(active);
  } else {
    line = T.theirTurn(active);
  }
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <p className="text-sm font-semibold" data-testid="hit-status">
        {line}
      </p>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {T.songNo(game.turns)}
      </span>
    </div>
  );
}

/** The card turned over: the song, and what came of it. */
function Reveal({
  game,
  mine,
  canGoOn,
  onNext,
}: {
  readonly game: HitsterGame;
  readonly mine: number | null;
  readonly canGoOn: boolean;
  readonly onNext: () => void;
}): ReactElement | null {
  const outcome = game.outcome;
  const name = (index: number | null) =>
    index === null ? "" : (game.players[index]?.name ?? "");
  const me = outcome !== null && outcome.player === mine;
  return outcome === null ? null : (
    <section
      data-testid="hit-reveal"
      className={`flex items-center gap-3 rounded-2xl border p-3 ${
        outcome.right
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
          : "border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30"
      }`}
    >
      <SongCard song={outcome.song} />
      <div className="flex flex-1 flex-col gap-1 text-sm">
        <p className="font-semibold">
          {outcome.right
            ? me
              ? T.yourRight
              : T.right(name(outcome.player))
            : me
              ? T.yourWrong
              : T.wrong(name(outcome.player))}
        </p>
        {outcome.stolenBy !== null && <p>{T.stolen(name(outcome.stolenBy))}</p>}
        {outcome.named && (
          <p>
            {me ? T.yourNamed : T.named(name(outcome.player))}{" "}
            {outcome.earned ? T.earned : ""}
          </p>
        )}
        {outcome.challenges.length > 0 && (
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            {outcome.challenges
              .map((one) => T.challengedBy(name(one.player)))
              .join(" · ")}
          </p>
        )}
      </div>
      {canGoOn && (
        <button
          type="button"
          data-testid="hit-next"
          onClick={onNext}
          className={MAIN}
        >
          {T.next}
        </button>
      )}
    </section>
  );
}

/** Everything that happened so far, the newest first. */
function History({ game }: { readonly game: HitsterGame }): ReactElement {
  const lines = historyOf(game);
  const name = (index: number) => game.players[index]?.name ?? "";
  return (
    <section
      data-testid="hit-history"
      className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800"
    >
      <h2 className="text-sm font-semibold">{T.history}</h2>
      {lines.length === 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.historyEmpty}
        </p>
      ) : (
        <ol className="flex max-h-72 flex-col gap-1 overflow-y-auto text-xs">
          {lines
            .map((line, index) => ({ line, number: index + 1 }))
            .toReversed()
            .map(({ line, number }) => (
              <li
                key={number}
                className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-t border-zinc-100 pt-1 first:border-t-0 first:pt-0 dark:border-zinc-800"
              >
                <span className="w-6 text-right text-zinc-400">{number}</span>
                <HistoryLine line={line} name={name} />
              </li>
            ))}
        </ol>
      )}
    </section>
  );
}

/** One line of the history. */
function HistoryLine({
  line,
  name,
}: {
  readonly line: HistoryEntry;
  readonly name: (index: number) => string;
}): ReactElement {
  let shown: ReactElement;
  switch (line.kind) {
    case "placed": {
      const { outcome } = line;
      const song = SONGS[outcome.song];
      shown = (
        <>
          <span className="font-semibold">{name(outcome.player)}</span>
          <span>
            {song === undefined
              ? ""
              : `${song.artist} - ${song.title} (${String(song.year)})`}
          </span>
          <span
            className={
              outcome.right
                ? "font-semibold text-emerald-700 dark:text-emerald-300"
                : "font-semibold text-rose-700 dark:text-rose-300"
            }
          >
            {outcome.right ? T.historyRight : T.historyWrong}
          </span>
          {outcome.stolenBy !== null && (
            <span className="text-amber-700 dark:text-amber-300">
              {T.historyStolen(name(outcome.stolenBy))}
            </span>
          )}
          {outcome.named && (
            <span className="text-fuchsia-700 dark:text-fuchsia-300">
              {T.historyNamed}
            </span>
          )}
        </>
      );
      break;
    }
    case "skipped":
      shown = (
        <span className="text-zinc-500 dark:text-zinc-400">
          {T.historySkipped(name(line.player), line.paid)}
        </span>
      );
      break;
    default: {
      const song = SONGS[line.song];
      shown = (
        <span className="text-zinc-500 dark:text-zinc-400">
          {T.historyBought(name(line.player))}
          {song === undefined
            ? ""
            : `: ${song.artist} - ${song.title} (${String(song.year)})`}
        </span>
      );
    }
  }
  return shown;
}
