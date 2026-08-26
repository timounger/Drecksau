/**
 * The middle of the board: the dice, and the one thing to do next.
 *
 * @module
 * @remarks
 * Everything that **has** to happen goes here, in the middle of the board where
 * a table would put the dice and the card that was just turned over. Everything
 * that merely **may** happen - building, mortgaging, haggling - lives in the
 * panel beside it. A player who does not know what to do next should be able to
 * find out by looking at the middle of the board, and never have to hunt.
 *
 * The order the checks run in is the order the rules interrupt each other: a
 * card lying face up beats a trade on the table, which beats an auction, which
 * beats a debt, which beats whose turn it is. It is the same order the referee
 * uses, and it is written once in each place rather than shared, because the
 * referee's version decides what is legal and this one only decides what is
 * drawn.
 */
"use client";

import { useState, type ReactElement } from "react";
import { fieldAt } from "@/games/monopoly/engine/board";
import { cardAt } from "@/games/monopoly/engine/cards";
import { canStillPay, nextBid, shortfall } from "@/games/monopoly/engine/moves";
import {
  BAIL,
  JAIL_TURNS,
  OPENING_BID,
  estateAt,
  freeTokens,
  type MonopolyGame,
  type MonopolyMove,
} from "@/games/monopoly/engine/state";
import { TOKENS } from "@/games/monopoly/engine/tokens";
import { MONOPOLY_TEXTS as T } from "@/games/monopoly/i18n/texts";
import { TradeSummary } from "./monopoly-trade";

/**
 * What the bid box starts at, over the standing bid.
 *
 * @remarks
 * The rulebook's own raise is one euro, which is right at a table and unusable
 * on a screen - nobody taps two hundred times. So bidding here is a **number you
 * type**, and it opens ten over whatever the last bid was, because that is the
 * raise somebody actually means when they raise. One euro is still there as a
 * shortcut beside it, for the times when you mean exactly that.
 */
const RAISE_STEP = 10;

/** Props of {@link MonopolyCentre}. */
export type MonopolyCentreProps = {
  readonly game: MonopolyGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  readonly onMove: (move: MonopolyMove) => void;
};

/**
 * Renders the middle of the board.
 *
 * @param props - the game, who is reading it and where moves go
 * @returns the element that goes inside the ring
 */
export function MonopolyCentre({
  game,
  mySeat,
  onMove,
}: MonopolyCentreProps): ReactElement {
  return (
    <div className="flex w-full flex-col items-center gap-2 text-center">
      <Dice game={game} />
      <Prompt game={game} mySeat={mySeat} onMove={onMove} />
    </div>
  );
}

/** The two dice as they lie. */
function Dice({ game }: { readonly game: MonopolyGame }): ReactElement | null {
  return game.dice.length === 0 ? null : (
    <span className="flex items-center gap-1.5" data-testid="mo-dice">
      {game.dice.map((die, at) => (
        <span
          key={at}
          aria-hidden
          className="inline-flex h-7 w-7 items-center justify-center rounded border-2 border-black/60 bg-white text-sm font-black tabular-nums text-black"
        >
          {die}
        </span>
      ))}
    </span>
  );
}

/** Whatever the game is waiting for. */
function Prompt({
  game,
  mySeat,
  onMove,
}: {
  readonly game: MonopolyGame;
  readonly mySeat: number | null;
  readonly onMove: (move: MonopolyMove) => void;
}): ReactElement {
  const mine = mySeat !== null;
  let body: ReactElement;
  if (game.phase === "gameOver") {
    body = <Line text={T.overNow} />;
  } else if (game.phase === "tokens") {
    body = <TokenPicker game={game} mySeat={mySeat} onMove={onMove} />;
  } else if (game.drawn !== null) {
    body = <CardFace game={game} mySeat={mySeat} onMove={onMove} />;
  } else if (game.offer !== null && game.offer.to === mySeat) {
    body = <OfferToMe game={game} offer={game.offer} onMove={onMove} />;
  } else if (game.offer !== null) {
    body = <Line text={T.tradeWaiting(game.players[game.offer.to].name)} />;
  } else if (game.auction !== null) {
    body = <Bidding game={game} mySeat={mySeat} onMove={onMove} />;
  } else if (game.debt !== null) {
    body = <Owing game={game} mySeat={mySeat} onMove={onMove} />;
  } else if (!mine || mySeat !== game.active) {
    body = <Line text={T.waitingFor(game.players[game.active].name)} />;
  } else {
    body = <OnTurn game={game} seat={mySeat} onMove={onMove} />;
  }
  return body;
}

/**
 * Taking a playing piece, before anything else happens.
 *
 * @remarks
 * "Jeder Spieler nimmt sich eine Spielfigur und stellt sie auf LOS." All eight
 * are shown, the taken ones with the name of whoever took them, so the choice
 * is made looking at the same row everybody else is looking at. Big enough to
 * see, because a piece you cannot make out is a piece you will not find on the
 * board later either.
 */
function TokenPicker({
  game,
  mySeat,
  onMove,
}: {
  readonly game: MonopolyGame;
  readonly mySeat: number | null;
  readonly onMove: (move: MonopolyMove) => void;
}): ReactElement {
  const free = freeTokens(game);
  const mine = mySeat !== null && game.active === mySeat;
  const takenBy = (token: number) =>
    game.players.findIndex((player) => player.token === token);

  return (
    <div className="flex flex-col items-center gap-2" data-testid="mo-tokens">
      <span className="text-[11px] font-bold">
        {mine ? T.pickToken : T.waitingTokens(game.players[game.active].name)}
      </span>
      <span className="flex w-full flex-wrap justify-center gap-1">
        {TOKENS.map((token, at) => {
          const who = takenBy(at);
          const open = mine && free.includes(at);
          return (
            <button
              key={token.name}
              type="button"
              disabled={!open}
              data-testid={`mo-token-${at}`}
              onClick={() => onMove({ kind: "pickToken", token: at })}
              title={token.name}
              className={`flex w-[52px] flex-col items-center gap-0.5 rounded-lg border-2 px-0.5 py-1 ${
                who >= 0
                  ? "border-black/20 opacity-45"
                  : open
                    ? "cursor-pointer border-black bg-white/80 hover:bg-white"
                    : "border-black/20"
              }`}
            >
              <span
                aria-hidden
                className="flex h-7 w-7 items-center justify-center rounded-full text-[16px] ring-1 ring-black/30"
                style={{ background: token.colour }}
              >
                {token.emoji}
              </span>
              <span className="text-[8px] leading-tight font-semibold">
                {token.name}
              </span>
              <span className="h-[9px] text-[8px] leading-tight opacity-70">
                {who >= 0 ? game.players[who].name : ""}
              </span>
            </button>
          );
        })}
      </span>
    </div>
  );
}

/** The card that was just turned over. */
function CardFace({
  game,
  mySeat,
  onMove,
}: {
  readonly game: MonopolyGame;
  readonly mySeat: number | null;
  readonly onMove: (move: MonopolyMove) => void;
}): ReactElement {
  const drawn = game.drawn;
  const card = drawn === null ? null : cardAt(drawn.card);
  return (
    <div
      data-testid="mo-card"
      className="flex max-w-[90%] flex-col items-center gap-1.5 rounded-lg border-2 border-black/50 bg-white/90 px-2 py-2"
    >
      <span className="text-[10px] font-bold tracking-wide uppercase">
        {T.cardTitle(card?.deck ?? "ereignis")}
      </span>
      <span className="text-[11px] leading-snug">{card?.text}</span>
      {drawn !== null && drawn.who === mySeat ? (
        <Button
          label={T.takeCard}
          onClick={() => onMove({ kind: "takeCard" })}
          testId="mo-take"
          strong
        />
      ) : (
        <span className="text-[10px] opacity-70">
          {T.waitingFor(game.players[drawn?.who ?? 0].name)}
        </span>
      )}
    </div>
  );
}

/** The bidding. */
function Bidding({
  game,
  mySeat,
  onMove,
}: {
  readonly game: MonopolyGame;
  readonly mySeat: number | null;
  readonly onMove: (move: MonopolyMove) => void;
}): ReactElement {
  const running = game.auction;
  const least = nextBid(game);
  const mine = running !== null && running.turn === mySeat;
  const cash = mySeat === null ? 0 : game.players[mySeat].cash;
  const canBid = mine && least <= cash;
  // Ten over the standing bid, but never under what the rules allow and never
  // over what is in hand.
  const opening = Math.min(
    cash,
    Math.max(least, (running?.bid ?? 0) + RAISE_STEP),
  );

  return (
    <div
      className="flex flex-col items-center gap-1.5"
      data-testid="mo-auction"
    >
      <span className="text-[11px] font-bold">
        {T.auctionOf(fieldAt(running?.at ?? 0).name)}
      </span>
      <span className="text-[11px]">
        {running !== null && running.leader >= 0
          ? T.highest(running.bid, game.players[running.leader].name)
          : T.noBidYet(OPENING_BID)}
      </span>
      {mine ? (
        <span className="flex flex-col items-center gap-1">
          {canBid && (
            // Keyed on the standing bid, so every raise gives back a fresh box
            // opening ten over the new one. Without the key a number typed
            // three bids ago would still be sitting there.
            <BidBox
              key={running?.bid ?? 0}
              opening={opening}
              least={least}
              cash={cash}
              onBid={(amount) => onMove({ kind: "bid", amount })}
            />
          )}
          <span className="flex flex-wrap justify-center gap-1">
            {/* Always there while you may bid, rather than only when it differs
                from what is in the box. It used to come and go with whatever
                had been typed, which moved "Aussteigen" along the row - and the
                one button nobody wants to hit by accident is that one. */}
            {canBid && (
              <Button
                label={T.bidLeast(least)}
                onClick={() => onMove({ kind: "bid", amount: least })}
                testId="mo-bid-least"
              />
            )}
            <Button
              label={T.passBid}
              onClick={() => onMove({ kind: "pass" })}
              testId="mo-pass"
            />
          </span>
        </span>
      ) : (
        <span className="text-[10px] opacity-70">
          {T.waitingFor(game.players[running?.turn ?? 0].name)}
        </span>
      )}
    </div>
  );
}

/**
 * The box you type a bid into.
 *
 * @remarks
 * It holds **what you typed**, as text, and not a number the render has already
 * corrected. That sounds like a detail and was the whole bug: clamping the value
 * on every keystroke meant the field could not be emptied - a cleared box reads
 * as zero, zero is under the minimum, and the minimum was written straight back
 * into it. Typing 150 over a standing bid of 90 was impossible too, because the
 * "1" became 91 before the "5" arrived.
 *
 * So nothing is corrected while you type. The **button** is what knows the
 * rules: it stays dark until the number in the box is one the referee would
 * take, and says which number it would send. That is also the honest split -
 * a field that silently rewrites what you typed cannot be trusted, and a button
 * that refuses to light up explains itself.
 *
 * It starts at ten over the standing bid because that is the raise somebody
 * means when they raise. The rulebook's own step is one euro, which is right at
 * a table and unusable on a screen - and it is still there, as the button
 * beside this one.
 */
function BidBox({
  opening,
  least,
  cash,
  onBid,
}: {
  /** What the box starts at: ten over the standing bid. */
  readonly opening: number;
  /** The smallest bid the referee would take. */
  readonly least: number;
  /** What the bidder actually holds. */
  readonly cash: number;
  readonly onBid: (amount: number) => void;
}): ReactElement {
  const [text, setText] = useState(String(opening));
  const wanted = Number(text);
  const usable =
    text.trim() !== "" &&
    Number.isInteger(wanted) &&
    wanted >= least &&
    wanted <= cash;

  return (
    <span className="flex items-center gap-1">
      <input
        type="number"
        min={least}
        max={cash}
        step={RAISE_STEP}
        value={text}
        aria-label={T.yourBid}
        data-testid="mo-bid-amount"
        onChange={(event) => setText(event.target.value)}
        className="w-24 rounded border border-black/50 bg-white px-1 py-0.5 text-right text-[11px] tabular-nums text-black"
      />
      <Button
        label={T.bidOf(usable ? wanted : least)}
        onClick={() => onBid(usable ? wanted : least)}
        testId="mo-bid"
        strong
        off={!usable}
      />
    </span>
  );
}

/** Somebody owes more than they hold. */
function Owing({
  game,
  mySeat,
  onMove,
}: {
  readonly game: MonopolyGame;
  readonly mySeat: number | null;
  readonly onMove: (move: MonopolyMove) => void;
}): ReactElement {
  const owing = game.debt;
  const mine = owing !== null && owing.who === mySeat;
  const missing = shortfall(game);
  const hopeless = !canStillPay(game);
  return (
    <div className="flex flex-col items-center gap-1.5" data-testid="mo-debt">
      {mine && owing !== null ? (
        <>
          <span className="text-[11px] font-bold">
            {T.owes(owing.amount, owing.reason)}
          </span>
          <span className="text-[11px]">
            {missing > 0 ? T.short(missing) : ""}
          </span>
          {hopeless && (
            <span className="text-[10px] text-red-800">{T.hopeless}</span>
          )}
          <span className="flex flex-wrap justify-center gap-1">
            {missing === 0 && (
              <Button
                label={T.settle(owing.amount)}
                onClick={() => onMove({ kind: "settle" })}
                testId="mo-settle"
                strong
              />
            )}
            <Button
              label={T.resign}
              onClick={() => onMove({ kind: "resign" })}
              testId="mo-resign"
            />
          </span>
        </>
      ) : (
        <span className="text-[11px]">
          {T.owesOther(game.players[owing?.who ?? 0].name, owing?.amount ?? 0)}
        </span>
      )}
    </div>
  );
}

/** The ordinary run of your own turn. */
function OnTurn({
  game,
  seat,
  onMove,
}: {
  readonly game: MonopolyGame;
  readonly seat: number;
  readonly onMove: (move: MonopolyMove) => void;
}): ReactElement {
  const player = game.players[seat];
  const at = player.at;
  let body: ReactElement;
  switch (game.phase) {
    case "jail":
      body = (
        <span className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-bold">
            {T.phaseJail} {"\u{00B7}"}{" "}
            {T.jailTurn((player.jailTurns ?? 0) + 1, JAIL_TURNS)}
          </span>
          <span className="flex flex-wrap justify-center gap-1">
            {player.pardons.length > 0 && (
              <Button
                label={T.usePardon}
                onClick={() => onMove({ kind: "usePardon" })}
                testId="mo-pardon"
                strong
              />
            )}
            {player.cash >= BAIL && (
              <Button
                label={T.payBail(BAIL)}
                onClick={() => onMove({ kind: "payBail" })}
                testId="mo-bail"
              />
            )}
            <Button
              label={T.tryDouble}
              onClick={() => onMove({ kind: "roll" })}
              testId="mo-roll"
            />
          </span>
        </span>
      );
      break;
    case "roll":
      body = (
        <Button
          label={T.roll}
          onClick={() => onMove({ kind: "roll" })}
          testId="mo-roll"
          strong
        />
      );
      break;
    case "decide":
      body = (
        <span className="flex flex-col items-center gap-1.5">
          <span className="flex flex-wrap justify-center gap-1">
            {player.cash >= (fieldAt(at).price ?? 0) && (
              <Button
                label={T.buy(fieldAt(at).name, fieldAt(at).price ?? 0)}
                onClick={() => onMove({ kind: "buy" })}
                testId="mo-buy"
                strong
              />
            )}
            <Button
              label={T.decline}
              onClick={() => onMove({ kind: "decline" })}
              testId="mo-decline"
            />
          </span>
          <span className="text-[10px] opacity-70">{T.buyHint}</span>
        </span>
      );
      break;
    case "manage":
      body = (
        <span className="flex flex-col items-center gap-1.5">
          <span className="text-[11px]">
            {fieldAt(at).name}
            {estateAt(game, at).owner === seat ? " (dir)" : ""}
          </span>
          {game.doubles > 0 && (
            <span className="text-[10px] font-semibold">{T.doublesAgain}</span>
          )}
          <Button
            label={T.endTurn}
            onClick={() => onMove({ kind: "endTurn" })}
            testId="mo-end"
            strong
          />
        </span>
      );
      break;
    default:
      body = <Line text={T.yourTurn} />;
  }
  return body;
}

/** A plain line of text. */
function Line({ text }: { readonly text: string }): ReactElement {
  return <span className="text-[11px] font-semibold">{text}</span>;
}

/**
 * A trade waiting for **your** answer.
 *
 * @remarks
 * In the middle of the board, and by this module's own rule: everything that
 * has to happen before the game can go on belongs here, where a table would put
 * the dice and the card just turned over. A trade on the table stops the game
 * exactly the way an auction or a debt does - the offerer is sitting there
 * waiting - so it is not something to notice out of the corner of your eye in a
 * panel beside the board.
 *
 * The panel keeps the same two buttons. It is where you *build* an offer, so it
 * is also where somebody who was already looking at it will answer one.
 */
function OfferToMe({
  game,
  offer,
  onMove,
}: {
  readonly game: MonopolyGame;
  readonly offer: NonNullable<MonopolyGame["offer"]>;
  readonly onMove: (move: MonopolyMove) => void;
}): ReactElement {
  return (
    <span
      data-testid="mo-centre-offer"
      className="flex flex-col items-center gap-1 rounded-lg border border-amber-500 bg-amber-50/90 px-2 py-1.5 text-[11px] text-black"
    >
      <span className="font-semibold">
        {T.tradeOpen(game.players[offer.from].name)}
      </span>
      <TradeSummary give={offer.give} want={offer.want} cash={offer.cash} />
      <span className="flex gap-1">
        <Button
          label={T.tradeAccept}
          onClick={() => onMove({ kind: "accept" })}
          testId="mo-centre-accept"
          strong
        />
        <Button
          label={T.tradeReject}
          onClick={() => onMove({ kind: "reject" })}
          testId="mo-centre-reject"
        />
      </span>
    </span>
  );
}

/** One button in the middle of the board. */
function Button({
  label,
  onClick,
  testId,
  strong,
  off,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly testId: string;
  readonly strong?: boolean;
  /** Greyed out and unclickable - for a move the rules would refuse. */
  readonly off?: boolean;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={off === true}
      data-testid={testId}
      className={`rounded border px-2 py-1 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
        off === true ? "" : "cursor-pointer"
      } ${
        strong === true
          ? "border-black bg-black text-white"
          : "border-black/50 bg-white/80 text-black hover:bg-white"
      }`}
    >
      {label}
    </button>
  );
}
