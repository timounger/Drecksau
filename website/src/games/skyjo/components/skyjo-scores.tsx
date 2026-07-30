/**
 * The result panel between rounds and at the end of a game.
 *
 * @module
 */
import type { ReactElement } from "react";
import { standings } from "@/games/skyjo/engine/scoring";
import { layoutValue, type SkyjoGame } from "@/games/skyjo/engine/state";
import { SKYJO_TEXTS as T } from "@/games/skyjo/i18n/texts";

/** Props of {@link SkyjoScores}. */
export type SkyjoScoresProps = {
  readonly game: SkyjoGame;
  /** Called to deal the next round, or null when this client may not. */
  readonly onNext: (() => void) | null;
  /** Called to start a fresh game once this one is over, or null. */
  readonly onNewGame: (() => void) | null;
};

/**
 * Renders the standings after a round or a game.
 *
 * @param props - the finished game and what may be started from here
 * @returns the panel element
 */
export function SkyjoScores({
  game,
  onNext,
  onNewGame,
}: SkyjoScoresProps): ReactElement {
  const over = game.phase === "gameOver";
  const order = standings(game);
  const best = game.players[order[0]].total;
  const winners = order.filter((seat) => game.players[seat].total === best);

  return (
    <section
      data-testid="skyjo-scores"
      className="flex flex-col gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20"
    >
      <h2 className="text-center text-lg font-bold">
        {over
          ? T.gameOverTitle
          : `${T.roundOverTitle} - ${T.round(game.round)}`}
      </h2>

      {over && (
        <p className="text-center text-sm font-semibold text-indigo-700 dark:text-indigo-300">
          {winners.length > 1
            ? T.winnerTie
            : T.winner(game.players[winners[0]].name)}
        </p>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-zinc-500 dark:text-zinc-400">
            <th className="text-left font-medium">&nbsp;</th>
            <th className="text-right font-medium">{T.roundPoints}</th>
            <th className="text-right font-medium">{T.points}</th>
          </tr>
        </thead>
        <tbody>
          {order.map((seat) => {
            const player = game.players[seat];
            // The round score differs from the layout when it was doubled.
            const doubled = player.roundScore !== layoutValue(player);
            return (
              <tr
                key={seat}
                className={game.endedBy === seat ? "font-semibold" : undefined}
              >
                <td className="py-0.5">
                  {player.name}
                  {game.endedBy === seat && <span className="ml-1">🏁</span>}
                </td>
                <td className="py-0.5 text-right tabular-nums">
                  {player.roundScore}
                  {doubled && (
                    <span className="ml-1 text-xs text-red-600 dark:text-red-400">
                      {T.doubled}
                    </span>
                  )}
                </td>
                <td className="py-0.5 text-right font-semibold tabular-nums">
                  {player.total}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-center gap-2">
        {!over && onNext !== null && (
          <button
            type="button"
            onClick={onNext}
            className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {T.nextRound}
          </button>
        )}
        {over && onNewGame !== null && (
          <button
            type="button"
            onClick={onNewGame}
            className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {T.newGame}
          </button>
        )}
        {onNext === null && onNewGame === null && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {T.waitHost}
          </p>
        )}
      </div>
    </section>
  );
}
