/**
 * Haggling: one offer at a time, on the table for everybody to see.
 *
 * @module
 * @remarks
 * The rulebook gives trading a section of its own and no procedure at all -
 * "die Beträge bzw. Werte vereinbaren die beteiligten Spieler selbst". At a
 * table that is a conversation; over a network it has to be a **shape**, and
 * this is the smallest one that can express what the rules allow: some of my
 * deeds, some of yours, and money in either direction.
 *
 * One offer at a time and it lies face up. Private offers would need a private
 * channel per pair and would let two players quietly gang up on a third in a way
 * a table cannot - at a real table everybody hears the offer.
 *
 * A street whose colour group has buildings on it does not appear: the rulebook
 * makes you sell them first, and a deed that cannot be traded should not be
 * offerable.
 */
"use client";

import { useState, type ReactElement } from "react";
import { fieldAt, fieldsIn, groupOf } from "@/games/monopoly/engine/board";
import {
  estateAt,
  ownedBy,
  stillIn,
  type MonopolyGame,
  type MonopolyMove,
} from "@/games/monopoly/engine/state";
import { MONOPOLY_TEXTS as T } from "@/games/monopoly/i18n/texts";

/** Props of {@link MonopolyTrade}. */
export type MonopolyTradeProps = {
  readonly game: MonopolyGame;
  readonly mySeat: number;
  readonly onMove: (move: MonopolyMove) => void;
};

/**
 * Renders the trading panel.
 *
 * @param props - the game, your seat and where moves go
 * @returns the panel, or null while there is nobody to trade with
 */
export function MonopolyTrade({
  game,
  mySeat,
  onMove,
}: MonopolyTradeProps): ReactElement | null {
  const others = stillIn(game).filter((seat) => seat !== mySeat);
  const [partner, setPartner] = useState<number | null>(null);
  const [give, setGive] = useState<readonly number[]>([]);
  const [want, setWant] = useState<readonly number[]>([]);
  const [cash, setCash] = useState(0);
  const open = game.offer;

  const clear = () => {
    setGive([]);
    setWant([]);
    setCash(0);
  };
  const toggle = (
    list: readonly number[],
    set: (next: readonly number[]) => void,
    at: number,
  ) => {
    set(list.includes(at) ? list.filter((each) => each !== at) : [...list, at]);
  };

  const to = partner ?? others[0] ?? -1;
  const mine = tradableOf(game, mySeat);
  const theirs = to >= 0 ? tradableOf(game, to) : [];
  const something = give.length + want.length > 0 || cash !== 0;

  return others.length === 0 ? null : (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold">{T.tradeTitle}</h2>

      {open !== null && open.to === mySeat && (
        <div
          data-testid="mo-offer-in"
          className="flex flex-col gap-1.5 rounded-lg border border-amber-500 bg-amber-50 p-2 text-xs dark:bg-amber-950/40"
        >
          <span className="font-semibold">
            {T.tradeOpen(game.players[open.from].name)}
          </span>
          <Summary give={open.give} want={open.want} cash={open.cash} />
          <span className="flex gap-1">
            <Small
              label={T.tradeAccept}
              onClick={() => onMove({ kind: "accept" })}
              testId="mo-accept"
            />
            <Small
              label={T.tradeReject}
              onClick={() => onMove({ kind: "reject" })}
              testId="mo-reject"
            />
          </span>
        </div>
      )}

      {open !== null && open.from === mySeat && (
        <div className="flex flex-col gap-1.5 text-xs">
          <span>{T.tradeWaiting(game.players[open.to].name)}</span>
          <Small
            label={T.tradeWithdraw}
            onClick={() => onMove({ kind: "reject" })}
            testId="mo-withdraw"
          />
        </div>
      )}

      {open === null && (
        <div className="flex flex-col gap-2 text-xs">
          <label className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold">{T.tradeWith}</span>
            <select
              value={to}
              data-testid="mo-partner"
              onChange={(event) => {
                setPartner(Number(event.target.value));
                clear();
              }}
              className="rounded border border-zinc-300 bg-white px-1 py-0.5 dark:border-zinc-700 dark:bg-zinc-800"
            >
              {others.map((seat) => (
                <option key={seat} value={seat}>
                  {game.players[seat].name}
                </option>
              ))}
            </select>
          </label>

          <Picker
            title={T.tradeGive}
            fields={mine}
            chosen={give}
            onToggle={(at) => toggle(give, setGive, at)}
            testId="give"
          />
          <Picker
            title={T.tradeWant}
            fields={theirs}
            chosen={want}
            onToggle={(at) => toggle(want, setWant, at)}
            testId="want"
          />

          <label className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold">{T.tradeCash}</span>
            <input
              type="number"
              step={10}
              value={cash}
              data-testid="mo-cash"
              onChange={(event) =>
                setCash(Math.trunc(Number(event.target.value)))
              }
              className="w-24 rounded border border-zinc-300 bg-white px-1 py-0.5 tabular-nums dark:border-zinc-700 dark:bg-zinc-800"
            />
            <span className="text-zinc-500 dark:text-zinc-400">€</span>
          </label>

          <span className="flex flex-wrap items-center gap-1.5">
            <Small
              label={T.tradeSend}
              onClick={() => {
                onMove({ kind: "offer", to, give, want, cash });
                clear();
              }}
              testId="mo-send"
              off={!something || to < 0}
            />
            {!something && (
              <span className="text-zinc-500 dark:text-zinc-400">
                {T.tradeNothing}
              </span>
            )}
          </span>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {T.tradeHint}
          </span>
        </div>
      )}
    </section>
  );
}

/** The deeds one seat could actually put into a trade. */
function tradableOf(game: MonopolyGame, seat: number): readonly number[] {
  return ownedBy(game, seat).filter((at) => {
    const inside = fieldsIn((fieldAt(at).group ?? "") as never);
    return inside.every((each) => estateAt(game, each).houses === 0);
  });
}

/** A row of deeds to tick. */
function Picker({
  title,
  fields,
  chosen,
  onToggle,
  testId,
}: {
  readonly title: string;
  readonly fields: readonly number[];
  readonly chosen: readonly number[];
  readonly onToggle: (at: number) => void;
  readonly testId: string;
}): ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-semibold">{title}</span>
      <div className="flex flex-wrap gap-1">
        {fields.length === 0 && (
          <span className="text-zinc-500 dark:text-zinc-400">
            {T.noStreets}
          </span>
        )}
        {fields.map((at) => {
          const group = fieldAt(at).group;
          const colour = group === undefined ? null : groupOf(group)?.colour;
          const on = chosen.includes(at);
          return (
            <button
              key={at}
              type="button"
              data-testid={`mo-${testId}-${at}`}
              onClick={() => onToggle(at)}
              className={`flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] ${
                on
                  ? "border-amber-500 bg-amber-100 dark:bg-amber-950/50"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {colour !== null && colour !== undefined && (
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-sm border border-black/30"
                  style={{ background: colour }}
                />
              )}
              {fieldAt(at).name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** What an offer on the table actually says. */
function Summary({
  give,
  want,
  cash,
}: {
  readonly give: readonly number[];
  readonly want: readonly number[];
  readonly cash: number;
}): ReactElement {
  const names = (fields: readonly number[]) =>
    fields.length === 0 ? "-" : fields.map((at) => fieldAt(at).name).join(", ");
  return (
    <span className="flex flex-col gap-0.5">
      <span>
        {T.tradeGive}: {names(want)}
        {cash < 0 ? ` + ${-cash} €` : ""}
      </span>
      <span>
        {T.tradeWant}: {names(give)}
        {cash > 0 ? ` + ${cash} €` : ""}
      </span>
    </span>
  );
}

/** One small button. */
function Small({
  label,
  onClick,
  testId,
  off,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly testId: string;
  readonly off?: boolean;
}): ReactElement {
  return (
    <button
      type="button"
      disabled={off === true}
      onClick={onClick}
      data-testid={testId}
      className="cursor-pointer rounded border border-zinc-300 px-2 py-0.5 text-[11px] font-semibold hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {label}
    </button>
  );
}
