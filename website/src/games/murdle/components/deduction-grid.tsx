/**
 * The deduction grid of a case, laid out as the book prints it: a staircase
 * of blocks, each square a possible pair.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import {
  blocksOf,
  cellKey,
  itemsOf,
  sideCategories,
  topCategories,
  type Block,
  type Marks,
} from "@/games/murdle/engine/grid";
import type { Case, Category } from "@/games/murdle/engine/types";
import { MURDLE_TEXTS as T } from "@/games/murdle/i18n/texts";

/** The category names along the grid's edges, in capitals as printed. */
const CATEGORY_LABELS: Readonly<Record<Category, string>> = {
  suspects: T.suspects,
  weapons: T.weapons,
  locations: T.locations,
  motives: T.motives,
};

/**
 * The size of one square, by the room the grid has - not the screen: beside
 * the online sidebar a wide screen leaves the grid a narrow column. The
 * steps are where the widest grid (four categories) still fits.
 */
const SQUARE =
  "h-[22px] w-[22px] @[22rem]:h-6 @[22rem]:w-6 @[25rem]:h-7 @[25rem]:w-7 @[28rem]:h-8 @[28rem]:w-8 @[31rem]:h-9 @[31rem]:w-9";

/**
 * The size of one square on paper: fixed, as the printed page has its room
 * whatever the screen.
 */
const PRINT_SQUARE = "h-[8mm] w-[8mm]";

/** The category names along the edges: small on a narrow screen, larger on a wide one. */
const LABEL_TEXT = "text-[9px] @[28rem]:text-[11px]";

/** The icons along the edges, by the room the grid has. */
const ICON_TEXT = "text-base @[28rem]:text-xl";

/** The thick line between two blocks. */
const BLOCK_EDGE = "border-zinc-800 dark:border-zinc-200";

/**
 * The grid.
 *
 * @param props - the case, its marks, what a tap does, and whether taps
 *   count - or, printed, an empty grid of fixed size with nothing to tap
 * @returns the grid
 */
export function DeductionGrid({
  kase,
  marks,
  onTap,
  disabled,
  printed = false,
}: {
  readonly kase: Case;
  readonly marks: Marks;
  readonly onTap?: (block: Block, row: string, col: string) => void;
  readonly disabled: boolean;
  /** On a printed page: fixed squares, no buttons, light colours only. */
  readonly printed?: boolean;
}): ReactElement {
  const square = printed ? PRINT_SQUARE : SQUARE;
  const labelText = printed ? "text-[9px]" : LABEL_TEXT;
  const iconText = printed ? "text-lg" : ICON_TEXT;
  const top = topCategories(kase);
  const side = sideCategories(kase);
  const rows = blocksOf(kase);
  return (
    <div
      className={printed ? "" : "@container overflow-x-auto"}
      data-testid={printed ? "murdle-print-grid" : "murdle-grid"}
    >
      <table className="mx-auto border-collapse text-center select-none">
        <thead>
          <tr>
            <th colSpan={2} aria-hidden="true" />
            {top.map((category) => (
              <th
                key={category}
                colSpan={itemsOf(kase, category).length}
                className={`px-1 pb-1 ${labelText} font-semibold tracking-widest text-zinc-500 uppercase dark:text-zinc-400`}
              >
                {CATEGORY_LABELS[category]}
              </th>
            ))}
          </tr>
          <tr>
            <th colSpan={2} aria-hidden="true" />
            {top.map((category) =>
              itemsOf(kase, category).map((item) => (
                <th
                  key={item.id}
                  scope="col"
                  title={item.name}
                  aria-label={item.name}
                  className={`${square} align-bottom ${iconText} leading-none`}
                >
                  <span aria-hidden="true">{item.icon}</span>
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {side.map((category, at) =>
            itemsOf(kase, category).map((rowItem, index) => (
              <tr key={rowItem.id}>
                {index === 0 && (
                  <th
                    rowSpan={itemsOf(kase, category).length}
                    className={`w-4 pr-0.5 ${labelText} font-semibold tracking-widest text-zinc-500 uppercase dark:text-zinc-400 ${printed ? "" : "@[28rem]:w-5"}`}
                  >
                    <span className="inline-block rotate-180 [writing-mode:vertical-rl]">
                      {CATEGORY_LABELS[category]}
                    </span>
                  </th>
                )}
                <th
                  scope="row"
                  title={rowItem.name}
                  aria-label={rowItem.name}
                  className={`${square} pr-0.5 ${iconText} leading-none`}
                >
                  <span aria-hidden="true">{rowItem.icon}</span>
                </th>
                {rows[at].map((block) =>
                  itemsOf(kase, block.cols).map((colItem, colIndex) => {
                    const mark = marks[cellKey(rowItem.id, colItem.id)];
                    return (
                      <td
                        key={colItem.id}
                        className={`border p-0 ${printed ? "border-zinc-500" : "border-zinc-300 dark:border-zinc-600"} ${
                          colIndex === 0 ? `border-l-2 ${BLOCK_EDGE}` : ""
                        } ${index === 0 ? `border-t-2 ${BLOCK_EDGE}` : ""} ${
                          colIndex === itemsOf(kase, block.cols).length - 1
                            ? `border-r-2 ${BLOCK_EDGE}`
                            : ""
                        } ${
                          index === itemsOf(kase, category).length - 1
                            ? `border-b-2 ${BLOCK_EDGE}`
                            : ""
                        }`}
                      >
                        {printed ? (
                          <span className={`${square} block bg-white`} />
                        ) : (
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() =>
                              onTap?.(block, rowItem.id, colItem.id)
                            }
                            aria-label={`${rowItem.name} / ${colItem.name}`}
                            data-testid={`murdle-cell-${rowItem.id}-${colItem.id}`}
                            data-mark={mark ?? "empty"}
                            className={`${square} flex cursor-pointer items-center justify-center bg-white text-sm font-bold hover:bg-amber-50 disabled:cursor-default @[28rem]:text-lg dark:bg-zinc-900 dark:hover:bg-zinc-800`}
                          >
                            {mark === "x" && (
                              <span className="text-zinc-400 dark:text-zinc-500">
                                {"✕"}
                              </span>
                            )}
                            {mark === "check" && (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {"✓"}
                              </span>
                            )}
                          </button>
                        )}
                      </td>
                    );
                  }),
                )}
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}
