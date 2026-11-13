/**
 * The island overview on the left: name and coat of arms, people, balance,
 * buildings and storage, then ground, fertility, deposits, production,
 * supply and harbour - with a switch between the player's islands, a way
 * to the camera and to the overview of every island. It folds away.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import { HUMAN, playerById } from "@/games/imperavis/engine/players";
import type { Game } from "@/games/imperavis/engine/types";
import { HUD } from "@/games/imperavis/i18n/hud-texts";
import { GOOD_NAMES, TEXTS as T } from "@/games/imperavis/i18n/texts";
import { CROPS, islandSummary } from "./hud-data";
import { Crest, GoodIcon, Icon, type IconName } from "./icons";
import { Bar, Btn, Fact, goldText, IconBtn, Panel, percent } from "./ui";

/** Percent of a share. */
const PERCENT = 100;

/** Supply at or above this shows green, below the next one red. */
const GOOD_SUPPLY = 0.75;
const POOR_SUPPLY = 0.4;

/** Props of {@link IslandPanel}. */
type IslandPanelProps = {
  readonly game: Game;
  readonly island: number;
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly onIsland: (island: number) => void;
  readonly onFocus: (x: number, y: number) => void;
  readonly onAll: () => void;
};

/**
 * Renders the island overview, or its folded tab.
 *
 * @param props - the game, the island in view and the actions
 * @returns the panel
 */
export function IslandPanel({
  game,
  island,
  open,
  onToggle,
  onIsland,
  onFocus,
  onAll,
}: IslandPanelProps): ReactElement {
  const info = game.world.islands[island];
  const state = game.islands[island];
  const owner = playerById(game, state.owner);
  const owned = game.islands.filter((item) => item.owner === HUMAN);
  return open ? (
    <Panel
      className="imp-open-side flex max-h-full w-full flex-col md:w-[19rem]"
      testId="imp-island-panel"
    >
      <header className="flex items-start gap-2 px-3 pt-2.5">
        <Crest color={owner?.color ?? null} size={44} variant={island} />
        <div className="min-w-0 flex-1">
          <p className="imp-muted text-[10px] tracking-widest uppercase">
            {HUD.islandOverview}
          </p>
          <h2
            className="imp-title truncate text-lg"
            data-testid="imp-island-name"
          >
            {info.name}
          </h2>
          <p className="imp-muted truncate text-xs">
            {owner === null
              ? HUD.free
              : owner.human
                ? HUD.yours
                : `${HUD.owner}: ${owner.name}`}{" "}
            - {T.sizeNames[info.size]}
          </p>
        </div>
        <IconBtn
          icon="chevronLeft"
          tip={HUD.collapse}
          onClick={onToggle}
          testId="imp-toggle-island"
          size={26}
        />
      </header>
      <div className="imp-rule mx-3 my-1.5" />
      <div className="imp-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        <IslandFacts game={game} island={island} />
        {owned.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {owned.map((item) => (
              <Btn
                key={item.id}
                small
                active={item.id === island}
                tip={HUD.chooseIsland}
                onClick={() => onIsland(item.id)}
              >
                {game.world.islands[item.id].name}
              </Btn>
            ))}
          </div>
        )}
        <div className="mt-2 grid grid-cols-2 gap-1">
          <Btn
            small
            icon="eye"
            tip={HUD.goToIsland}
            onClick={() => onFocus(info.cx, info.cy)}
            testId="imp-island-focus"
          >
            {T.goTo}
          </Btn>
          <Btn
            small
            icon="globe"
            tip={HUD.allIslandsTip}
            onClick={onAll}
            testId="imp-all-islands"
          >
            {HUD.allIslands}
          </Btn>
        </div>
      </div>
    </Panel>
  ) : (
    <button
      type="button"
      className="imp-panel pointer-events-auto flex cursor-pointer flex-col items-center gap-1 px-1.5 py-2"
      data-tip={`${info.name}\n${HUD.expand}`}
      aria-label={HUD.expand}
      data-testid="imp-toggle-island"
      onClick={(event) => {
        onToggle();
        event.currentTarget.blur();
      }}
    >
      <Crest color={owner?.color ?? null} size={26} variant={island} />
      <Icon name="chevronRight" size={16} className="imp-gold" />
    </button>
  );
}

/** The key numbers and facts of an island. */
function IslandFacts({
  game,
  island,
}: {
  readonly game: Game;
  readonly island: number;
}): ReactElement {
  const info = game.world.islands[island];
  const summary = islandSummary(game, island);
  const crops = CROPS.filter((crop) => info.fertile[crop]);
  const deposits = (["stone", "clay", "ore"] as const).filter(
    (kind) => info.deposits[kind] > 0,
  );
  const supply = summary.supply;
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-1.5">
        <KeyNumber
          icon="people"
          label={HUD.residents}
          value={String(summary.residents)}
          testId="imp-island-residents"
        />
        <KeyNumber
          icon="coins"
          label={HUD.islandBalance}
          tip={HUD.islandBalanceTip}
          value={`${summary.balance >= 0 ? "+" : ""}${goldText(summary.balance)}`}
          tone={summary.balance >= 0 ? "good" : "bad"}
        />
        <KeyNumber
          icon="house"
          label={HUD.buildings}
          value={String(summary.buildings)}
        />
        <KeyNumber
          icon="crate"
          label={HUD.storage}
          tip={HUD.storageTip}
          value={String(summary.storage)}
        />
      </div>
      <div>
        <Fact label={HUD.buildArea} tip={HUD.buildAreaTip}>
          {HUD.tiles(summary.freeTiles)}
        </Fact>
        <Fact label={HUD.fertility}>
          {crops.length === 0 ? (
            T.none
          ) : (
            <span className="inline-flex gap-1">
              {crops.map((crop) => (
                <span key={crop} data-tip={GOOD_NAMES[crop]}>
                  <GoodIcon good={crop} size={16} />
                </span>
              ))}
            </span>
          )}
        </Fact>
        <Fact label={HUD.deposits}>
          {deposits.length === 0
            ? T.none
            : deposits
                .map((kind) => `${T.depositNames[kind]} ${info.deposits[kind]}`)
                .join(", ")}
        </Fact>
        <Fact label={HUD.capacity} tip={HUD.capacityTip}>
          {HUD.capacityValue(
            summary.producers,
            Math.round(summary.efficiency * PERCENT),
          )}
        </Fact>
        <Fact
          label={HUD.supply}
          tip={HUD.supplyTip}
          tone={
            supply === null
              ? undefined
              : supply >= GOOD_SUPPLY
                ? "good"
                : supply < POOR_SUPPLY
                  ? "bad"
                  : "warn"
          }
        >
          {supply === null ? HUD.supplyNone : percent(supply)}
        </Fact>
        {supply !== null && (
          <Bar
            value={supply}
            color={
              supply >= GOOD_SUPPLY
                ? "bg-[var(--imp-good)]"
                : supply < POOR_SUPPLY
                  ? "bg-[var(--imp-bad)]"
                  : "bg-[var(--imp-warn)]"
            }
          />
        )}
        <Fact label={HUD.harbour}>
          {summary.kontor === null
            ? HUD.noKontor
            : HUD.harbourValue(
                summary.kontor.level,
                summary.docked,
                summary.yard,
              )}
        </Fact>
      </div>
    </div>
  );
}

/** One of the four key numbers at the top. */
function KeyNumber({
  icon,
  label,
  value,
  tip,
  tone,
  testId,
}: {
  readonly icon: IconName;
  readonly label: string;
  readonly value: string;
  readonly tip?: string;
  readonly tone?: "good" | "bad";
  readonly testId?: string;
}): ReactElement {
  return (
    <div
      className="imp-inset flex items-center gap-2 px-2 py-1.5"
      data-tip={tip === undefined ? label : `${label}\n${tip}`}
    >
      <Icon name={icon} size={18} className="imp-gold" />
      <div className="min-w-0 leading-tight">
        <div
          className={`imp-display text-sm font-semibold tabular-nums ${
            tone === "good"
              ? "text-[var(--imp-good)]"
              : tone === "bad"
                ? "text-[var(--imp-bad)]"
                : ""
          }`}
          data-testid={testId}
        >
          {value}
        </div>
        <div className="imp-muted truncate text-[10px]">{label}</div>
      </div>
    </div>
  );
}
