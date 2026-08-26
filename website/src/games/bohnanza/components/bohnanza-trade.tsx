/**
 * The trading panel: making a proposal, and answering one.
 *
 * @module
 * @remarks
 * At a table this is a conversation, and a conversation does not port to a
 * screen. What does port is the shape underneath it: **I put these cards down,
 * and I would like one of those in return.** So a proposal here names the exact
 * cards it gives - you are holding them, you can show them - and only the
 * *sorts* it wants, because the other hand is one you cannot see. That
 * asymmetry is not a simplification; it is the table's own, and it is why the
 * rulebook's example reads "Möchte jemand die Sojabohne? Am liebsten hätte ich
 * dafür eine Rote Bohne."
 *
 * Two smaller decisions follow from the same place. Only one proposal lies on
 * the table at a time, because several at once is everybody talking over each
 * other. And the seat that says yes chooses **which** of its matching cards it
 * hands over - identical beans are not identical in a hand where the order is
 * fixed, and giving away the front one is a different move from giving away the
 * back one.
 */
"use client";

import { useState, type ReactElement } from "react";
import { interestIn } from "@/games/bohnanza/engine/ai";
import {
  BEANS,
  isFaceDown,
  type Bean,
  type Card,
} from "@/games/bohnanza/engine/beans";
import {
  OFFER_LIMIT,
  tradeable,
  type BohnanzaGame,
  type BohnanzaMove,
} from "@/games/bohnanza/engine/state";
import { BZ_TEXTS as T } from "@/games/bohnanza/i18n/texts";
import { BeanCard } from "./bean-card";

/** Props of {@link BohnanzaTrade}. */
export type BohnanzaTradeProps = {
  readonly game: BohnanzaGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  readonly onMove: (move: BohnanzaMove) => void;
};

/**
 * Renders the trading panel.
 *
 * @param props - the game and who is reading it
 * @returns the panel, or null outside the trading phase
 */
export function BohnanzaTrade({
  game,
  mySeat,
  onMove,
}: BohnanzaTradeProps): ReactElement | null {
  let body: ReactElement | null = null;
  if (mySeat === null || game.phase !== "trade") {
    body = null;
  } else if (game.offer !== null) {
    body = (
      <OpenOffer
        key={`${game.turn}-${game.offers}`}
        game={game}
        mySeat={mySeat}
        onMove={onMove}
      />
    );
  } else if (game.offers >= OFFER_LIMIT) {
    body = (
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{T.offerLimit}</p>
    );
  } else {
    // Everybody gets a builder, not only the active player: the rule is that
    // every trade has the active player on one side of it, not that only they
    // may speak first. At a table it is usually the others who call out.
    body = (
      <Builder
        key={`${game.turn}-${game.offers}`}
        game={game}
        mySeat={mySeat}
        onMove={onMove}
      />
    );
  }

  return body === null ? null : (
    <section
      data-testid="bohnanza-trade"
      className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20"
    >
      <h2 className="text-sm font-semibold">{T.tradeTitle}</h2>
      {body}
    </section>
  );
}

/** The proposal lying on the table, from whichever side you are on. */
function OpenOffer({
  game,
  mySeat,
  onMove,
}: {
  readonly game: BohnanzaGame;
  readonly mySeat: number;
  readonly onMove: (move: BohnanzaMove) => void;
}): ReactElement {
  const offer = game.offer;

  return offer === null ? (
    <span />
  ) : (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium">
        {T.offerOpen(
          game.players[offer.from].name,
          game.players[offer.to].name,
        )}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-zinc-500 dark:text-zinc-400">{T.offerGives}</span>
        {offer.give.map((card) => (
          <BeanCard
            key={card.id}
            bean={card.bean}
            size="sm"
            faceDown={isFaceDown(card)}
          />
        ))}
        <span className="text-zinc-500 dark:text-zinc-400">
          {offer.want.length === 0 ? T.offerIsGift : T.offerWants}
        </span>
        {offer.want.map((bean, at) => (
          <BeanCard key={`${bean}-${at}`} bean={bean} size="sm" muted />
        ))}
      </div>
      {offer.to === mySeat && (
        <Answer game={game} mySeat={mySeat} onMove={onMove} />
      )}
      {offer.from === mySeat && (
        <button
          type="button"
          onClick={() => onMove({ kind: "withdraw" })}
          className="cursor-pointer self-start rounded-lg border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {T.offerWithdraw}
        </button>
      )}
      {offer.to !== mySeat && offer.from !== mySeat && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.offerWaiting(game.players[offer.to].name)}
        </p>
      )}
    </div>
  );
}

/**
 * Saying yes or no, and picking which cards go.
 *
 * @remarks
 * The pre-selection is the earliest matching card of each sort - the one the
 * next turn is about to force you to plant, and so usually the one you meant.
 * It is only a suggestion; anything else that adds up to what was asked for is
 * just as legal, and that choice is the whole reason this is a picker rather
 * than a single button.
 */
function Answer({
  game,
  mySeat,
  onMove,
}: {
  readonly game: BohnanzaGame;
  readonly mySeat: number;
  readonly onMove: (move: BohnanzaMove) => void;
}): ReactElement {
  const want = game.offer?.want ?? [];
  const pool = tradeable(game, mySeat).filter((card) =>
    want.includes(card.bean),
  );
  const [picked, setPicked] = useState<readonly string[]>(() =>
    suggest(pool, want),
  );
  const chosen = pool.filter((card) => picked.includes(card.id));
  const ready = matches(chosen, want);
  const possible = suggest(pool, want).length === want.length;

  return (
    <div className="flex flex-col gap-2">
      {want.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {T.offerChoose(chosen.length, want.length)}
          </span>
          {pool.map((card) => (
            <button
              key={card.id}
              type="button"
              aria-pressed={picked.includes(card.id)}
              onClick={() =>
                setPicked((old) =>
                  old.includes(card.id)
                    ? old.filter((id) => id !== card.id)
                    : [...old, card.id],
                )
              }
              className={`cursor-pointer rounded-lg ${
                picked.includes(card.id)
                  ? "ring-2 ring-emerald-500"
                  : "opacity-60"
              }`}
            >
              <BeanCard
                bean={card.bean}
                size="sm"
                faceDown={isFaceDown(card)}
              />
            </button>
          ))}
        </div>
      )}
      {!possible && (
        <p className="text-xs text-red-700 dark:text-red-300">
          {T.offerImpossible}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="bohnanza-accept"
          disabled={!ready}
          onClick={() => onMove({ kind: "answer", yes: true, cards: picked })}
          className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {T.offerAccept}
        </button>
        <button
          type="button"
          onClick={() => onMove({ kind: "answer", yes: false })}
          className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {T.offerDecline}
        </button>
      </div>
    </div>
  );
}

/** Building a proposal of your own. */
function Builder({
  game,
  mySeat,
  onMove,
}: {
  readonly game: BohnanzaGame;
  readonly mySeat: number;
  readonly onMove: (move: BohnanzaMove) => void;
}): ReactElement {
  const pool = tradeable(game, mySeat);
  // "Nur du als aktive Person darfst mit anderen handeln": everybody else has
  // exactly one possible partner, and it is never a choice worth offering.
  const partners = game.players
    .map((unused, seat) => seat)
    .filter((seat) =>
      mySeat === game.active ? seat !== mySeat : seat === game.active,
    );
  const [to, setTo] = useState(partners[0] ?? 0);
  const [give, setGive] = useState<readonly string[]>([]);
  const [want, setWant] = useState<readonly Bean[]>([]);

  return (
    <div className="flex flex-col gap-3">
      {mySeat !== game.active && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {T.tradeRuleHint}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">{T.offerGive}</span>
        {pool.length === 0 ? (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {T.handEmpty}
          </span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {pool.map((card) => (
              <button
                key={card.id}
                type="button"
                aria-pressed={give.includes(card.id)}
                onClick={() =>
                  setGive((old) =>
                    old.includes(card.id)
                      ? old.filter((id) => id !== card.id)
                      : [...old, card.id],
                  )
                }
                className={`cursor-pointer rounded-lg ${
                  give.includes(card.id)
                    ? "ring-2 ring-emerald-500"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <BeanCard
                  bean={card.bean}
                  size="sm"
                  faceDown={isFaceDown(card)}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">{T.offerWant}</span>
        <div className="flex flex-wrap gap-1.5">
          {BEANS.map((bean) => (
            <button
              key={bean}
              type="button"
              onClick={() => setWant((old) => [...old, bean])}
              className="cursor-pointer rounded-lg opacity-70 hover:opacity-100"
            >
              <BeanCard bean={bean} size="sm" />
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {want.length === 0 ? (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {T.offerGift}
            </span>
          ) : (
            want.map((bean, at) => (
              <button
                key={`${bean}-${at}`}
                type="button"
                aria-label={`${bean} entfernen`}
                onClick={() =>
                  setWant((old) => old.filter((unused, index) => index !== at))
                }
                className="cursor-pointer rounded-lg ring-2 ring-amber-500"
              >
                <BeanCard bean={bean} size="sm" />
              </button>
            ))
          )}
        </div>
      </div>

      {partners.length > 1 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium">{T.offerTo}</span>
          <div className="flex flex-wrap gap-1.5">
            {partners.map((seat) => (
              <button
                key={seat}
                type="button"
                aria-pressed={seat === to}
                onClick={() => setTo(seat)}
                className={`cursor-pointer rounded-lg border px-2 py-1 text-xs ${
                  seat === to
                    ? "border-emerald-500 bg-emerald-100 font-semibold text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100"
                    : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                }`}
              >
                {game.players[seat].name}
                <Hint game={game} seat={seat} give={give} pool={pool} />
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        data-testid="bohnanza-offer"
        disabled={give.length === 0 || partners.length === 0}
        onClick={() => onMove({ kind: "offer", to, give, want })}
        className="cursor-pointer self-start rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {give.length === 0 ? T.offerPick : T.offerSend}
      </button>
    </div>
  );
}

/**
 * What the fields say about whether this seat wants what you are offering.
 *
 * @remarks
 * Public information, read off face-up fields, and the whole of the reading a
 * player does before choosing who to ask. Making somebody count two rows of
 * beans by eye to get at it would be hiding the game rather than preserving it.
 */
function Hint({
  game,
  seat,
  give,
  pool,
}: {
  readonly game: BohnanzaGame;
  readonly seat: number;
  readonly give: readonly string[];
  readonly pool: readonly Card[];
}): ReactElement | null {
  const first = pool.find((card) => give.includes(card.id));
  const hint =
    first === undefined ? null : interestIn(game.players[seat], first.bean);
  return hint === null ? null : (
    <span className="ml-1 font-normal opacity-70">{T.interest(hint)}</span>
  );
}

/** The earliest card of each wanted sort - the suggestion a "yes" starts from. */
function suggest(
  pool: readonly Card[],
  want: readonly Bean[],
): readonly string[] {
  const left = [...pool];
  const picked: string[] = [];
  for (const bean of want) {
    const at = left.findIndex((card) => card.bean === bean);
    if (at >= 0) {
      picked.push(left[at].id);
      left.splice(at, 1);
    }
  }
  return picked;
}

/** Whether these cards are exactly the sorts that were asked for. */
function matches(cards: readonly Card[], want: readonly Bean[]): boolean {
  const given = cards.map((card) => card.bean).sort();
  const asked = [...want].sort();
  return (
    given.length === asked.length &&
    asked.every((bean, at) => bean === given[at])
  );
}
