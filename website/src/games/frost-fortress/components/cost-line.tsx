/**
 * A price as a row of small resource amounts - red where the stock is short.
 *
 * @module
 */
import type { ReactElement } from "react";
import { RESOURCE_IDS } from "@/games/frost-fortress/engine/economy";
import type { Cost, Resources } from "@/games/frost-fortress/engine/types";
import {
  RESOURCE_ICONS,
  RESOURCE_NAMES,
} from "@/games/frost-fortress/i18n/texts";

/**
 * Renders a price.
 *
 * @param props - the price and, to mark what is short, the stock
 * @returns the row
 */
export function CostLine({
  cost,
  stock,
}: {
  readonly cost: Cost;
  readonly stock?: Resources;
}): ReactElement {
  const parts = RESOURCE_IDS.filter((id) => (cost[id] ?? 0) > 0);
  return (
    <span className="inline-flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] tabular-nums">
      {parts.map((id) => {
        const amount = Math.ceil(cost[id] ?? 0);
        const short = stock !== undefined && stock[id] < amount;
        return (
          <span
            key={id}
            title={RESOURCE_NAMES[id]}
            className={short ? "text-red-400" : "text-slate-200"}
          >
            {RESOURCE_ICONS[id]} {amount}
          </span>
        );
      })}
    </span>
  );
}
