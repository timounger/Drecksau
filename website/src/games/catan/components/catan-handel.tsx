/**
 * *Händler & Barbaren*: the wagon, its tableau and the cards.
 *
 * @module
 * @remarks
 * One panel for the three things this scenario asks a player to keep track of
 * and the board cannot show: what the wagon is carrying and where it has to go,
 * how far the Wagen-Tableau has been built up, and which cards are in hand.
 *
 * Everything that happens **somewhere** - driving, and putting a barbarian
 * down - happens on the board. What is left here is what has no place on it.
 */
"use client";

import type { ReactElement } from "react";
import { Button } from "@/games/catan/components/catan-actions";
import {
  DRIVE_OFF,
  HAUL_CARD_NAMES,
  HAUL_CARD_TEXTS,
  HAUL_POINT_CARDS,
  MOVE_POINTS,
  REWARD_GOLD,
  TARGET_NAMES,
  WARE_GOES,
  WARE_NAMES,
  hauling,
  stepPrice,
} from "@/games/catan/engine/handel";
import { CATAN_TEXTS as T, SORT_NAMES } from "@/games/catan/i18n/texts";
import {
  RESOURCES,
  covers,
  type CatanGame,
  type CatanMove,
} from "@/games/catan/engine/state";

/**
 * The wagon panel.
 *
 * @param props - the game, the seat looking, and how to move
 * @returns the panel, or null outside the scenario
 */
export function CatanHaul({
  game,
  mySeat,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement | null {
  const player = game.players[mySeat];
  const price = stepPrice(game, mySeat);
  const step = player.level;
  return !hauling(game) ? null : (
    <section
      className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900"
      data-testid="ct-haul"
    >
      <h2 className="text-sm font-semibold">{T.haulTitle}</h2>
      <span>{T.haulGold(player.gold)}</span>
      <span data-testid="ct-haul-load">
        {player.ware === null
          ? T.haulEmpty
          : T.haulLoad(
              WARE_NAMES[player.ware],
              TARGET_NAMES[WARE_GOES[player.ware]],
            )}
      </span>
      <span>{T.haulDelivered(player.delivered)}</span>
      {game.phase === "driving" && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold" data-testid="ct-haul-moves">
            {T.haulMoves(player.moves)}
          </span>
          <Button
            label={T.haulBoost}
            testId="ct-haul-boost"
            off={player.boosted || player.hand.getreide === 0}
            onClick={() => onMove({ kind: "boost" })}
          />
        </div>
      )}
      <div className="flex flex-col gap-0.5 rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
        <span className="font-semibold">
          {T.haulStep(step + 1, MOVE_POINTS.length)}
        </span>
        <span>{T.haulTableau(MOVE_POINTS[step], REWARD_GOLD[step])}</span>
        <span>
          {DRIVE_OFF[step].length === 0
            ? T.haulNoFight
            : T.haulFight(DRIVE_OFF[step].join(", "))}
        </span>
        {price !== null && (
          <Button
            label={T.haulUpgrade(
              RESOURCES.filter((sort) => price[sort] > 0)
                .map((sort) => `${price[sort]} ${SORT_NAMES[sort]}`)
                .join(", "),
            )}
            testId="ct-haul-upgrade"
            off={game.phase !== "trade" || !covers(player.hand, price)}
            onClick={() => onMove({ kind: "tableau" })}
          />
        )}
      </div>
      <HaulCards game={game} mySeat={mySeat} onMove={onMove} />
    </section>
  );
}

/**
 * The cards in hand.
 *
 * @remarks
 * The three victory-point cards are shown but never playable - "decke diese
 * Karte erst auf, wenn du mit ihr die zum Sieg erforderliche Anzahl Siegpunkte
 * besitzt" - so they carry their own line rather than a dead button.
 */
function HaulCards({
  game,
  mySeat,
  onMove,
}: {
  readonly game: CatanGame;
  readonly mySeat: number;
  readonly onMove: (move: CatanMove) => void;
}): ReactElement {
  const held = game.players[mySeat].haul;
  return (
    <div className="flex flex-col gap-1">
      <span className="font-semibold">{T.haulCards(held.length)}</span>
      {held.length === 0 ? (
        <span className="opacity-60">{T.haulNoCards}</span>
      ) : (
        held.map((card, index) =>
          HAUL_POINT_CARDS.includes(card) ? (
            <span key={`${card}-${index}`} className="opacity-80">
              {HAUL_CARD_NAMES[card]}
            </span>
          ) : (
            <Button
              key={`${card}-${index}`}
              label={`${HAUL_CARD_NAMES[card]} - ${HAUL_CARD_TEXTS[card]}`}
              testId={`ct-haul-card-${card}`}
              off={game.phase !== "trade" || game.playedDev}
              onClick={() => onMove({ kind: "haulCard", card })}
            />
          ),
        )
      )}
    </div>
  );
}
