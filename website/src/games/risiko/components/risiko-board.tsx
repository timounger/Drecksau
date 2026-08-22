/**
 * The map plus the one bar that knows what this phase wants.
 *
 * @module
 * @remarks
 * A Risk turn is four different jobs - place, attack, follow up, move - and
 * each of them wants a different pair of taps. Rather than four screens, there
 * is one map and one bar underneath it that says what the map is currently
 * asking for.
 *
 * **What can be tapped is computed from the referee, never guessed.** The
 * pickable territories in each phase come out of `legalAttacks` and
 * `fortifyTargets`, so the map and the rules cannot drift apart - and a
 * territory that cannot legally be attacked is not merely refused, it does not
 * light up.
 *
 * The two-tap pattern is the game's own: **from, then to**. Risk is about
 * borders, and a border needs both ends named. Between the taps the map shows
 * exactly which places are on the other end, which is the question a player is
 * actually asking when their finger is hovering over Kamtschatka.
 */
"use client";

import { useState, type ReactElement } from "react";
import { RisikoMap } from "@/games/risiko/components/risiko-map";
import { starsIn, unitsForCards } from "@/games/risiko/engine/cards";
import { neighboursOf, territoryOf } from "@/games/risiko/engine/map";
import { fortifyTargets, legalAttacks } from "@/games/risiko/engine/moves";
import {
  MAX_ATTACKERS,
  heldBy,
  type RisikoGame,
  type RisikoMove,
} from "@/games/risiko/engine/state";
import { RISIKO_TEXTS as T } from "@/games/risiko/i18n/texts";

/** How many units the quick button puts down at once. */
const HANDFUL = 5;

/** Props of {@link RisikoBoard}. */
export type RisikoBoardProps = {
  readonly game: RisikoGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  readonly onMove: (move: RisikoMove) => void;
};

/**
 * Renders the map and the controls for whatever the turn is doing.
 *
 * @param props - the game, who is reading it and where moves go
 * @returns the board element
 */
export function RisikoBoard({
  game,
  mySeat,
  onMove,
}: RisikoBoardProps): ReactElement {
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const mine =
    mySeat !== null && game.active === mySeat && game.phase !== "gameOver";
  const seat = mySeat ?? -1;

  const clear = () => {
    setFrom(null);
    setTo(null);
  };

  const open = mine ? sourcesFor(game, seat, from) : [];
  const targets = mine && from !== null ? aimsFor(game, seat, from) : [];

  const pick = (id: string) => {
    switch (game.phase) {
      case "claim":
        onMove({ kind: "claim", to: id });
        break;
      case "deploy":
        onMove({ kind: "place", to: id, count: 1 });
        break;
      case "neutral":
        setFrom(id);
        onMove({ kind: "boost", to: id, count: 1 });
        break;
      case "reinforce":
        setFrom(id);
        onMove({ kind: "place", to: id, count: 1 });
        break;
      case "attack":
      case "fortify":
        if (from === null) {
          setFrom(id);
        } else {
          setTo(id);
        }
        break;
      default:
        break;
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <RisikoMap
        game={game}
        from={to ?? from}
        open={
          from === null ||
          game.phase === "reinforce" ||
          game.phase === "neutral"
            ? open
            : targets
        }
        targets={targets}
        onPick={pick}
      />
      {mine && (
        <div
          data-testid="rk-bar"
          className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <ActionBar
            game={game}
            seat={seat}
            from={from}
            to={to}
            onMove={(move) => {
              clear();
              onMove(move);
            }}
            onPlace={(count) => {
              if (from !== null) {
                onMove(
                  game.phase === "neutral"
                    ? { kind: "boost", to: from, count }
                    : { kind: "place", to: from, count },
                );
              }
            }}
            onCancel={clear}
          />
        </div>
      )}
    </section>
  );
}

/** The bar under the map: whatever this phase is asking for. */
function ActionBar({
  game,
  seat,
  from,
  to,
  onMove,
  onPlace,
  onCancel,
}: {
  readonly game: RisikoGame;
  readonly seat: number;
  readonly from: string | null;
  readonly to: string | null;
  readonly onMove: (move: RisikoMove) => void;
  readonly onPlace: (count: number) => void;
  readonly onCancel: () => void;
}): ReactElement {
  let body: ReactElement;
  if (game.advance !== null) {
    body = (
      <CountBar
        label={T.hintAdvance}
        min={0}
        max={game.advance.max}
        start={game.advance.max}
        confirm={(count) => T.advanceCount(count)}
        onConfirm={(count) => onMove({ kind: "advance", count })}
        testId="rk-advance"
      />
    );
  } else if (game.phase === "reinforce" || game.phase === "neutral") {
    body = (
      <PlaceBar
        game={game}
        from={from}
        onPlace={onPlace}
        hint={game.phase === "neutral" ? T.hintNeutral : T.hintReinforce}
      />
    );
  } else if (game.phase === "attack") {
    body = (
      <AttackBar
        game={game}
        seat={seat}
        from={from}
        to={to}
        onMove={onMove}
        onCancel={onCancel}
      />
    );
  } else if (game.phase === "fortify") {
    body = (
      <FortifyBar
        game={game}
        from={from}
        to={to}
        onMove={onMove}
        onCancel={onCancel}
      />
    );
  } else if (game.phase === "claim") {
    body = <Hint text={T.hintClaim} />;
  } else if (game.phase === "deploy") {
    body = <Hint text={T.hintDeploy} />;
  } else {
    body = <Hint text={T.nothingToDo} />;
  }
  return body;
}

/** Placing units: tap puts one down, the buttons put more. */
function PlaceBar({
  game,
  from,
  onPlace,
  hint,
}: {
  readonly game: RisikoGame;
  readonly from: string | null;
  readonly onPlace: (count: number) => void;
  readonly hint: string;
}): ReactElement {
  const where = from === null ? null : territoryOf(from);
  const left = game.toPlace;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold" data-testid="rk-left">
        {T.left(left)}
      </span>
      {where === null ? (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
      ) : (
        <>
          <span className="text-sm">{where.name}</span>
          {[1, Math.min(HANDFUL, left)]
            .filter((count, at, all) => count > 0 && all.indexOf(count) === at)
            .map((count) => (
              <Button
                key={count}
                label={T.place(count)}
                onClick={() => onPlace(count)}
                testId={`rk-place-${count}`}
              />
            ))}
          {left > 1 && (
            <Button
              label={T.placeAll}
              onClick={() => onPlace(left)}
              testId="rk-place-all"
              strong
            />
          )}
        </>
      )}
    </div>
  );
}

/** Attacking: from, then to, then how many. */
function AttackBar({
  game,
  seat,
  from,
  to,
  onMove,
  onCancel,
}: {
  readonly game: RisikoGame;
  readonly seat: number;
  readonly from: string | null;
  readonly to: string | null;
  readonly onMove: (move: RisikoMove) => void;
  readonly onCancel: () => void;
}): ReactElement {
  const most =
    from === null || to === null
      ? 0
      : Math.min(MAX_ATTACKERS, game.units[from] - 1);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {from === null && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.hintAttackFrom}
        </span>
      )}
      {from !== null && to === null && (
        <>
          <span className="text-sm font-semibold">
            {T.hintAttackTo(territoryOf(from)?.name ?? from)}
          </span>
          <Button label={T.cancel} onClick={onCancel} testId="rk-cancel" />
        </>
      )}
      {from !== null && to !== null && (
        <>
          <span className="text-sm font-semibold">
            {territoryOf(from)?.name} {"\u{2192}"} {territoryOf(to)?.name}
          </span>
          {Array.from({ length: most }, (unused, at) => at + 1).map((count) => (
            <Button
              key={count}
              label={T.attackWith(count)}
              strong={count === most}
              onClick={() => onMove({ kind: "attack", from, to, units: count })}
              testId={`rk-attack-${count}`}
            />
          ))}
          <Button label={T.cancel} onClick={onCancel} testId="rk-cancel" />
        </>
      )}
      <span className="grow" />
      <Button
        label={T.doneAttacking}
        onClick={() => onMove({ kind: "done" })}
        testId="rk-done"
        strong={legalAttacks(game, seat).length === 0}
      />
    </div>
  );
}

/** The one move of the turn. */
function FortifyBar({
  game,
  from,
  to,
  onMove,
  onCancel,
}: {
  readonly game: RisikoGame;
  readonly from: string | null;
  readonly to: string | null;
  readonly onMove: (move: RisikoMove) => void;
  readonly onCancel: () => void;
}): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {from === null && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.hintFortifyFrom}
        </span>
      )}
      {from !== null && to === null && (
        <>
          <span className="text-sm font-semibold">
            {T.hintFortifyTo(territoryOf(from)?.name ?? from)}
          </span>
          <Button label={T.cancel} onClick={onCancel} testId="rk-cancel" />
        </>
      )}
      {from !== null && to !== null && (
        <CountBar
          label={`${territoryOf(from)?.name} \u{2192} ${territoryOf(to)?.name}`}
          min={1}
          max={game.units[from] - 1}
          start={game.units[from] - 1}
          confirm={(count) => T.moveCount(count)}
          onConfirm={(count) => onMove({ kind: "fortify", from, to, count })}
          testId="rk-move"
        />
      )}
      <span className="grow" />
      <Button
        label={T.skipMove}
        onClick={() => onMove({ kind: "endTurn" })}
        testId="rk-end"
        strong
      />
    </div>
  );
}

/**
 * A number to choose and a button to commit it.
 *
 * @remarks
 * A slider rather than a row of buttons, because both places that need one -
 * following up a conquest and the one move of the turn - can be asking for
 * anything from zero to thirty, and thirty buttons is not a choice, it is a
 * wall.
 */
function CountBar({
  label,
  min,
  max,
  start,
  confirm,
  onConfirm,
  testId,
}: {
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly start: number;
  readonly confirm: (count: number) => string;
  readonly onConfirm: (count: number) => void;
  readonly testId: string;
}): ReactElement {
  const [count, setCount] = useState(start);
  const held = Math.min(Math.max(count, min), max);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold">{label}</span>
      {max > min && (
        <input
          type="range"
          min={min}
          max={max}
          value={held}
          aria-label={label}
          onChange={(event) => setCount(Number(event.target.value))}
          className="w-40 cursor-pointer"
          data-testid={`${testId}-slider`}
        />
      )}
      <Button
        label={confirm(held)}
        onClick={() => onConfirm(held)}
        testId={testId}
        strong
      />
      {min === 0 && (
        <Button
          label={T.advanceNone}
          onClick={() => onConfirm(0)}
          testId={`${testId}-none`}
        />
      )}
    </div>
  );
}

/** A line of guidance when there is nothing to press. */
function Hint({ text }: { readonly text: string }): ReactElement {
  return (
    <span className="text-xs text-zinc-500 dark:text-zinc-400">{text}</span>
  );
}

/** One button of the bar. */
function Button({
  label,
  onClick,
  testId,
  strong,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly testId: string;
  readonly strong?: boolean;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-semibold ${
        strong === true
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
          : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Which territories may be tapped first in this phase.
 *
 * @remarks
 * Straight out of the referee wherever there is a referee function for it, so
 * the lit-up territories and the legal moves are the same list rather than two
 * lists that agree today.
 */
function sourcesFor(
  game: RisikoGame,
  seat: number,
  from: string | null,
): readonly string[] {
  let open: readonly string[];
  switch (game.phase) {
    case "claim":
      open = Object.keys(game.owner).filter((id) => game.owner[id] === -1);
      break;
    case "deploy":
    case "reinforce":
      open = heldBy(game, seat);
      break;
    case "neutral":
      open = game.players
        .map((player, at) =>
          player.isNeutral &&
          player.alive &&
          (game.boosting === null || game.boosting === at)
            ? at
            : -1,
        )
        .filter((at) => at >= 0)
        .flatMap((at) => heldBy(game, at));
      break;
    case "attack":
      open = [...new Set(legalAttacks(game, seat).map((each) => each.from))];
      break;
    case "fortify":
      open = heldBy(game, seat).filter(
        (id) => game.units[id] > 1 && fortifyTargets(game, seat, id).length > 0,
      );
      break;
    default:
      open = [];
  }
  return from === null ? open : open;
}

/** Which territories may be tapped second, once a source is picked. */
function aimsFor(
  game: RisikoGame,
  seat: number,
  from: string,
): readonly string[] {
  let aims: readonly string[] = [];
  if (game.phase === "attack") {
    aims = neighboursOf(from).filter(
      (id) => game.owner[id] !== seat && game.owner[id] >= 0,
    );
  } else if (game.phase === "fortify") {
    aims = fortifyTargets(game, seat, from);
  }
  return aims;
}

/** What one hand of cards would buy, for the cards panel. */
export function tradeValue(cards: readonly string[]): {
  readonly stars: number;
  readonly units: number;
} {
  return { stars: starsIn(cards), units: unitsForCards(cards) };
}
