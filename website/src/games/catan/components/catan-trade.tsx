/**
 * Trading: with the supply, with a harbour, and with the other players.
 *
 * @module
 * @remarks
 * The rulebook's three kinds of trade are two different things on a screen.
 *
 * Trading with the supply is a **price**, and the price depends on where you
 * have built - four alike, three at a generic harbour, two at the right one. So
 * the give side shows the rate on every sort rather than making the player work
 * out which harbour they own; the rate *is* the interesting part.
 *
 * Trading with the other players is a **conversation**, and a conversation does
 * not fit down a wire. What fits is one offer at a time: you say what you would
 * give and what you want, everybody answers yes or no, and you pick which yes
 * to take. Nobody can accept on your behalf and nobody trades behind your back,
 * which is the one thing the rulebook is firm about - "die anderen Personen am
 * Tisch dürfen in deinem Zug nur mit dir tauschen".
 */
"use client";

import { useState, type ReactElement } from "react";
import { Button, CardPicker } from "@/games/catan/components/catan-actions";
import { tradeRate } from "@/games/catan/engine/moves";
import { COLOUR_INK } from "@/games/catan/engine/setup";
import {
  NO_CARDS,
  OFFER_LIMIT,
  RESOURCES,
  actingSeat,
  covers,
  handSize,
  type CatanGame,
  type CatanMove,
  type Hand,
  type Resource,
} from "@/games/catan/engine/state";
import { CATAN_TEXTS as T, SORT_NAMES } from "@/games/catan/i18n/texts";

/** The most of one sort an offer may name, so the pickers stay short. */
const OFFER_MAX = 4;

/** What the supply charges without a harbour, for the button before a pick. */
const PLAIN_RATE = 4;

/** A hand spelled out, or "nichts". */
function spell(hand: Hand): string {
  const parts = RESOURCES.filter((sort) => hand[sort] > 0).map(
    (sort) => `${hand[sort]} ${SORT_NAMES[sort]}`,
  );
  return parts.length === 0 ? "nichts" : parts.join(", ");
}

/** A small chip that can be picked. */
function Chip({
  label,
  on,
  off,
  onClick,
  testId,
}: {
  readonly label: string;
  readonly on: boolean;
  readonly off: boolean;
  readonly onClick: () => void;
  readonly testId: string;
}): ReactElement {
  const look = on
    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
    : "border-zinc-300 dark:border-zinc-700";
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={off}
      onClick={onClick}
      className={`cursor-pointer rounded-lg border px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-30 ${look}`}
    >
      {label}
    </button>
  );
}

/** Trading with the supply and the harbours. */
function BankTrade({
  game,
  mySeat,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement {
  const hand = game.players[mySeat].hand;
  const [give, setGive] = useState<Resource | null>(null);
  const [want, setWant] = useState<Resource | null>(null);
  const rate = give === null ? 0 : tradeRate(game, mySeat, give);
  const ready =
    give !== null && want !== null && give !== want && hand[give] >= rate;

  return (
    <div className="flex flex-col gap-1.5" data-testid="ct-bank">
      <span className="text-xs font-semibold opacity-70">{T.bankGive}</span>
      <div className="flex flex-wrap gap-1.5">
        {RESOURCES.map((sort) => (
          <Chip
            key={sort}
            label={`${SORT_NAMES[sort]} ${T.bankRate(tradeRate(game, mySeat, sort))}`}
            on={give === sort}
            off={hand[sort] < tradeRate(game, mySeat, sort)}
            testId={`ct-bank-give-${sort}`}
            onClick={() => setGive(sort)}
          />
        ))}
      </div>
      <span className="text-xs font-semibold opacity-70">{T.bankWant}</span>
      <div className="flex flex-wrap gap-1.5">
        {RESOURCES.map((sort) => (
          <Chip
            key={sort}
            label={SORT_NAMES[sort]}
            on={want === sort}
            off={give === sort}
            testId={`ct-bank-want-${sort}`}
            onClick={() => setWant(sort)}
          />
        ))}
      </div>
      <span>
        <Button
          label={T.bankDo(rate === 0 ? PLAIN_RATE : rate)}
          off={!ready}
          testId="ct-bank-do"
          onClick={() => {
            if (give !== null && want !== null) {
              onMove({ kind: "bank", give, want });
              setGive(null);
              setWant(null);
            }
          }}
        />
      </span>
    </div>
  );
}

/** Making an offer to the table. */
function MakeOffer({
  game,
  mySeat,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement {
  const hand = game.players[mySeat].hand;
  const [give, setGive] = useState<Hand>(NO_CARDS);
  const [want, setWant] = useState<Hand>(NO_CARDS);
  const room = RESOURCES.reduce(
    (limit, sort) => ({ ...limit, [sort]: give[sort] > 0 ? 0 : OFFER_MAX }),
    NO_CARDS,
  );
  const spent = RESOURCES.reduce(
    (limit, sort) => ({ ...limit, [sort]: want[sort] > 0 ? 0 : hand[sort] }),
    NO_CARDS,
  );
  const ready = handSize(give) > 0 && handSize(want) > 0 && covers(hand, give);
  const full = game.offers >= OFFER_LIMIT;

  return (
    <div className="flex flex-col gap-1.5" data-testid="ct-offer-make">
      <span className="text-xs font-semibold opacity-70">{T.offerGive}</span>
      <CardPicker
        hand={give}
        limit={spent}
        onChange={setGive}
        testId="ct-offer-give"
      />
      <span className="text-xs font-semibold opacity-70">{T.offerWant}</span>
      <CardPicker
        hand={want}
        limit={room}
        onChange={setWant}
        testId="ct-offer-want"
      />
      {full ? (
        <span className="text-xs opacity-70">{T.offerLimit}</span>
      ) : (
        <span>
          <Button
            label={T.offerSend}
            off={!ready}
            testId="ct-offer-send"
            onClick={() => {
              onMove({ kind: "offer", give, want });
              setGive(NO_CARDS);
              setWant(NO_CARDS);
            }}
          />
        </span>
      )}
    </div>
  );
}

/** An offer that is on the table, from whichever side you are on. */
function OpenOffer({
  game,
  mySeat,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement | null {
  const offer = game.offer;
  let body: ReactElement | null = null;
  if (offer !== null) {
    const mine = offer.from === mySeat;
    const asked = offer.answers[mySeat] === null && !mine;
    const open = offer.answers.some((answer) => answer === null);
    const takers = offer.answers.reduce<number[]>(
      (list, answer, seat) => (answer === true ? [...list, seat] : list),
      [],
    );
    const thinking = offer.answers.findIndex((answer) => answer === null);
    body = (
      <div className="flex flex-col gap-1.5" data-testid="ct-offer-open">
        <span className="text-sm font-semibold">
          {T.offerOpen(game.players[offer.from].name)}
        </span>
        <span className="text-xs">
          {mine
            ? T.offerFor(spell(offer.give), spell(offer.want))
            : T.offerFor(spell(offer.want), spell(offer.give))}
        </span>
        {asked && (
          <span className="flex gap-1.5">
            <Button
              label={T.offerYes}
              strong
              off={!covers(game.players[mySeat].hand, offer.want)}
              testId="ct-offer-yes"
              onClick={() => onMove({ kind: "answer", yes: true })}
            />
            <Button
              label={T.offerNo}
              testId="ct-offer-no"
              onClick={() => onMove({ kind: "answer", yes: false })}
            />
          </span>
        )}
        {mine && open && thinking >= 0 && (
          <span className="text-xs opacity-70">
            {T.offerWaiting(game.players[thinking].name)}
          </span>
        )}
        {mine && !open && (
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs opacity-70">
              {takers.length === 0 ? T.offerNobody : T.offerTakers}
            </span>
            {takers.map((seat) => (
              <Button
                key={seat}
                label={T.offerDeal(game.players[seat].name)}
                strong
                testId={`ct-offer-deal-${seat}`}
                onClick={() => onMove({ kind: "deal", seat })}
              />
            ))}
            <Button
              label={T.offerWithdraw}
              testId="ct-offer-withdraw"
              onClick={() => onMove({ kind: "withdraw" })}
            />
          </span>
        )}
        {!mine && !asked && (
          <span className="flex items-center gap-1.5 text-xs opacity-70">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full border border-black/30"
              style={{
                backgroundColor: COLOUR_INK[game.players[offer.from].colour],
              }}
            />
            {offer.answers[mySeat] === true ? T.offerYes : T.offerNo}
          </span>
        )}
      </div>
    );
  }
  return body;
}

/**
 * The trading panel.
 *
 * @param props - the game, which seat is looking, and where moves go
 * @returns the panel, or nothing while there is nothing to trade
 */
export function CatanTrade({
  game,
  mySeat,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement | null {
  const trading = game.phase === "trade" && actingSeat(game) === mySeat;
  // Stein 2 trades with the supply only, so the offer half of the panel is not
  // theirs to use - the referee would refuse it anyway.
  const mayOffer = game.stone === 1;
  const answering = game.offer !== null;
  let panel: ReactElement | null = null;
  if (trading || answering) {
    panel = (
      <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">
          {answering ? T.offer : T.bank}
        </h2>
        {answering ? (
          <OpenOffer game={game} mySeat={mySeat} onMove={onMove} />
        ) : (
          <>
            <BankTrade game={game} mySeat={mySeat} onMove={onMove} />
            {mayOffer && (
              <div className="border-t border-zinc-200 pt-2 dark:border-zinc-800">
                <h3 className="pb-1 text-sm font-semibold">{T.offer}</h3>
                <MakeOffer game={game} mySeat={mySeat} onMove={onMove} />
              </div>
            )}
          </>
        )}
      </section>
    );
  }
  return panel;
}
