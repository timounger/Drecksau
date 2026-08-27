/**
 * *Die Flüsse von Catan*: the gold, what it buys, and the two tiles.
 *
 * @module
 * @remarks
 * One panel, because gold answers one question a player asks every turn: what
 * can I do with it right now. So the buttons say the price and are off when
 * they cannot be pressed - `2 Gold` on a purchase, the seat's own trading rate
 * on a sale, which a harbour makes cheaper exactly as it does anything else.
 *
 * The two tiles are shown here rather than on the scoreboard because they are
 * made of gold: the *Reichster Cataner* is worth a point, the *Armer Cataner*
 * costs two, and both move the moment somebody's pile changes. Seeing them
 * beside the pile is seeing why they moved.
 */
"use client";

import type { ReactElement } from "react";
import { Button } from "@/games/catan/components/catan-actions";
import {
  BUYS_PER_TURN,
  GOLD_PER_BUY,
  rivers,
} from "@/games/catan/engine/fluesse";
import { tradeRate } from "@/games/catan/engine/moves";
import { CATAN_TEXTS as T, SORT_NAMES } from "@/games/catan/i18n/texts";
import {
  RESOURCES,
  type CatanGame,
  type CatanMove,
} from "@/games/catan/engine/state";

/**
 * The gold panel.
 *
 * @param props - the game, the seat looking, and how to move
 * @returns the panel, or null outside the scenario
 */
export function CatanGold({
  game,
  mySeat,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement | null {
  const player = game.players[mySeat];
  const buying =
    game.phase === "trade" &&
    game.goldBuys < BUYS_PER_TURN &&
    player.gold >= GOLD_PER_BUY;
  return !rivers(game) ? null : (
    <section
      className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
      data-testid="ct-gold"
    >
      <h2 className="text-sm font-semibold">{T.goldTitle(player.gold)}</h2>
      <div className="flex flex-wrap gap-1.5">
        {game.richest === mySeat && (
          <span
            className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-900 dark:text-amber-100"
            data-testid="ct-gold-richest"
          >
            {T.richestTile}
          </span>
        )}
        {game.poorest.includes(mySeat) && (
          <span
            className="rounded-lg bg-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100"
            data-testid="ct-gold-poorest"
          >
            {T.poorestTile}
          </span>
        )}
      </div>
      {player.gold === 0 ? (
        <p className="text-xs opacity-60">{T.goldNone}</p>
      ) : (
        <p className="text-xs opacity-60">
          {T.goldBuysLeft(BUYS_PER_TURN - game.goldBuys)}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {RESOURCES.map((sort) => (
          <Button
            key={`buy-${sort}`}
            label={T.goldBuy(SORT_NAMES[sort], GOLD_PER_BUY)}
            testId={`ct-gold-buy-${sort}`}
            off={!buying}
            onClick={() => onMove({ kind: "goldBuy", sort })}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {RESOURCES.map((sort) => {
          const rate = tradeRate(game, mySeat, sort);
          return (
            <Button
              key={`sell-${sort}`}
              label={T.goldSell(SORT_NAMES[sort], rate)}
              testId={`ct-gold-sell-${sort}`}
              off={game.phase !== "trade" || player.hand[sort] < rate}
              onClick={() => onMove({ kind: "goldSell", sort })}
            />
          );
        })}
      </div>
      <p className="text-xs opacity-60">{T.bridgeHint}</p>
      <p className="text-xs opacity-60">{T.bridgeBuild(player.bridgesLeft)}</p>
    </section>
  );
}
