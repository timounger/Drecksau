/**
 * The resource bar across the top: the player with the island in view and
 * the stage of development, the treasury with income, expenses and trend,
 * the people by tier, the key goods (all of them in a drop-down), the mean
 * mood, date, weather, war and research, and the game speed at the right.
 *
 * @module
 */
"use client";

import { useState, type ReactElement } from "react";
import { atWar } from "@/games/imperavis/engine/diplomacy";
import { GOOD_IDS } from "@/games/imperavis/engine/goods";
import { HUMAN } from "@/games/imperavis/engine/players";
import { residentsByTier } from "@/games/imperavis/engine/population";
import { dayNumber, seasonAt, yearNumber } from "@/games/imperavis/engine/time";
import { capacityOf } from "@/games/imperavis/engine/warehouse";
import type { Game, GoodId, WeatherKind } from "@/games/imperavis/engine/types";
import { HUD } from "@/games/imperavis/i18n/hud-texts";
import {
  GOOD_NAMES,
  RESEARCH_NAMES,
  SEASON_NAMES,
  TEXTS as T,
  TIER_NAMES,
  WEATHER_NAMES,
} from "@/games/imperavis/i18n/texts";
import { NORMAL_TOP } from "@/games/imperavis/settings/preferences";
import {
  goodFlows,
  incomeAndExpenses,
  meanSatisfaction,
  topTier,
  type Flow,
} from "./hud-data";
import { Crest, GoodIcon, Icon, type IconName } from "./icons";
import { Bar, goldText, Panel, rateText } from "./ui";

/** Goods always shown in the bar, the first ones also on a phone. */
const TOP_GOODS: readonly GoodId[] = [
  "wood",
  "planks",
  "bricks",
  "tools",
  "fish",
  "stone",
  "bread",
  "clothing",
  "beer",
  "iron",
];

/** Goods shown on a phone. */
const PHONE_GOODS = 5;

/** Goods shown on a mid-sized screen. */
const MID_GOODS = 7;

/** Tiers written out under the head count: the highest ones with people. */
const SHOWN_TIERS = 2;

/** Mood below this shows red, above the next amber, else green. */
const LOW_MOOD = 0.4;
const FAIR_MOOD = 0.65;

/** Percent of a share. */
const PERCENT = 100;

/** Sizes of a good's symbol in the bar and in the drop-down, px. */
const CHIP_ICON = 20;
const WIDE_ICON = 18;

/** Rates smaller than this are not shown under a good. */
const MIN_SHOWN_RATE = 0.05;

/** The symbol of each weather. */
const WEATHER_SYMBOLS: Readonly<Record<WeatherKind, IconName>> = {
  clear: "sun",
  rain: "rain",
  fog: "fog",
  storm: "storm",
};

/** Props of {@link TopBar}. */
type TopBarProps = {
  readonly game: Game;
  /** The island in view. */
  readonly island: number;
  readonly fps: number;
  readonly speed: number;
  readonly speeds: readonly number[];
  readonly onSpeed: (speed: number) => void;
  /** Opens the administration on a page. */
  readonly onOpen: (
    tab: "finance" | "people" | "stock" | "research" | "diplomacy",
  ) => void;
};

/**
 * Renders the resource bar.
 *
 * @param props - the game, the island in view, speed and actions
 * @returns the bar
 */
export function TopBar({
  game,
  island,
  fps,
  speed,
  speeds,
  onSpeed,
  onOpen,
}: TopBarProps): ReactElement {
  const [allGoods, setAllGoods] = useState(false);
  const human = game.players[HUMAN];
  const tiers = residentsByTier(game, null, HUMAN);
  const total = tiers.reduce((sum, value) => sum + value, 0);
  const top = topTier(tiers);
  const { income, expenses } = incomeAndExpenses(game);
  const balance = income - expenses;
  const mood = meanSatisfaction(game);
  const owned = game.islands[island]?.owner === HUMAN;
  const flows = goodFlows(game, owned ? island : null);
  const room = owned ? capacityOf(game, island) : 0;
  const stock = game.islands[island]?.stock;
  const enemies = game.players
    .filter((other) => atWar(game, HUMAN, other.id))
    .map((other) => other.name);
  const research = human.research.current;
  const trend: IconName =
    balance > 0 ? "trendUp" : balance < 0 ? "trendDown" : "trendFlat";
  const goldTip = game.cheat
    ? HUD.goldCheat
    : [
        HUD.treasury,
        `${goldText(human.gold)} Gold`,
        HUD.incomeLine(goldText(income)),
        HUD.expenseLine(goldText(expenses)),
        HUD.balanceLine(`${balance >= 0 ? "+" : ""}${goldText(balance)}`),
      ].join("\n");
  // The highest tiers that have people: they tell how far the city is.
  const shownTiers = tiers
    .map((count, tier) => ({ count, tier }))
    .filter((entry) => entry.count > 0)
    .slice(-SHOWN_TIERS);
  return (
    <div className="pointer-events-none relative">
      <Panel
        className="mt-1 flex min-h-[3.25rem] flex-wrap items-center gap-x-3 gap-y-1 px-2 py-1 md:mt-2 md:min-h-[4.75rem] md:flex-nowrap md:gap-x-4 md:px-3"
        testId="imp-topbar"
      >
        <div
          className="hidden min-w-0 items-center gap-2 lg:flex"
          data-tip={`${human.name}\n${HUD.level}: ${top >= 0 ? TIER_NAMES[top] : HUD.levelNone}`}
        >
          <Crest color={human.color} size={34} />
          <div className="min-w-0 leading-tight">
            <div className="imp-title truncate text-sm">
              {game.world.islands[island]?.name ?? HUD.noIsland}
            </div>
            <div className="imp-muted truncate text-[11px]">
              {human.name} - {top >= 0 ? TIER_NAMES[top] : HUD.levelNone}
            </div>
          </div>
        </div>
        <Divider />
        <button
          type="button"
          className="pointer-events-auto flex cursor-pointer items-center gap-1.5"
          data-tip={goldTip}
          data-testid="imp-gold"
          onClick={() => onOpen("finance")}
        >
          <Icon name="coin" size={26} className="imp-gold" />
          <span className="flex flex-col items-start leading-tight">
            <span className="imp-display text-base font-semibold tabular-nums">
              {game.cheat ? T.endless : goldText(human.gold)}
            </span>
            {!game.cheat && (
              <span className="flex items-center gap-1 text-[11px] tabular-nums">
                <span className="text-[var(--imp-good)]">
                  +{goldText(income)}
                </span>
                <span className="text-[var(--imp-bad)]">
                  -{goldText(expenses)}
                </span>
                <Icon
                  name={trend}
                  size={13}
                  className={
                    balance >= 0
                      ? "text-[var(--imp-good)]"
                      : "text-[var(--imp-bad)]"
                  }
                />
              </span>
            )}
          </span>
        </button>
        <Divider />
        <button
          type="button"
          className="pointer-events-auto flex cursor-pointer items-center gap-1.5"
          data-tip={[
            HUD.population,
            ...tiers.map((count, tier) => `${TIER_NAMES[tier]}: ${count}`),
            HUD.populationTip,
          ].join("\n")}
          data-testid="imp-population"
          onClick={() => onOpen("people")}
        >
          <Icon name="people" size={24} className="imp-gold" />
          <span className="flex flex-col items-start leading-tight">
            <span className="imp-display text-base font-semibold tabular-nums">
              {total}
            </span>
            <span className="imp-muted hidden text-[11px] whitespace-nowrap tabular-nums xl:block">
              {shownTiers.length > 0
                ? shownTiers
                    .map(({ count, tier }) => `${count} ${TIER_NAMES[tier]}`)
                    .join(", ")
                : HUD.levelNone}
            </span>
          </span>
        </button>
        <Divider />
        <div
          className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 md:flex-nowrap"
          data-testid="imp-goods"
        >
          {TOP_GOODS.map((good, index) => (
            <GoodChip
              key={good}
              good={good}
              have={stock?.[good] ?? 0}
              room={room}
              flow={flows[good]}
              cheat={game.cheat}
              shown={owned}
              className={
                index >= MID_GOODS
                  ? "hidden 2xl:flex"
                  : index >= PHONE_GOODS
                    ? "hidden lg:flex"
                    : "flex"
              }
            />
          ))}
          <button
            type="button"
            aria-pressed={allGoods}
            className="imp-btn h-7 px-1.5"
            data-tip={`${HUD.moreGoods}\n${HUD.moreGoodsTip}`}
            aria-label={HUD.moreGoods}
            data-testid="imp-all-goods"
            onClick={(event) => {
              setAllGoods(!allGoods);
              event.currentTarget.blur();
            }}
          >
            <Icon name={allGoods ? "chevronUp" : "chevronDown"} size={16} />
          </button>
        </div>
        <Divider />
        <div
          className="flex items-center gap-1.5"
          data-tip={
            mood === null
              ? `${HUD.satisfaction}\n${HUD.noResidents}`
              : `${HUD.satisfaction}\n${HUD.satisfactionTip(Math.round(mood * PERCENT))}`
          }
          data-testid="imp-mood"
        >
          <Icon
            name="mood"
            size={22}
            className={
              mood === null
                ? "imp-muted"
                : mood < LOW_MOOD
                  ? "text-[var(--imp-bad)]"
                  : mood < FAIR_MOOD
                    ? "text-[var(--imp-warn)]"
                    : "text-[var(--imp-good)]"
            }
          />
          <span className="flex w-12 flex-col gap-0.5 leading-tight">
            <span className="text-sm tabular-nums">
              {mood === null ? "-" : `${Math.round(mood * PERCENT)} %`}
            </span>
            <Bar
              value={mood ?? 0}
              color={
                (mood ?? 0) < LOW_MOOD
                  ? "bg-[var(--imp-bad)]"
                  : (mood ?? 0) < FAIR_MOOD
                    ? "bg-[var(--imp-warn)]"
                    : "bg-[var(--imp-good)]"
              }
            />
          </span>
        </div>
        <Divider />
        <div className="imp-muted flex items-center gap-2 text-[11px] leading-tight">
          <span className="hidden flex-col xl:flex" data-tip={HUD.dateTip}>
            <span>{T.day(dayNumber(game.time), yearNumber(game.time))}</span>
            <span>{SEASON_NAMES[seasonAt(game.time)]}</span>
          </span>
          <span
            data-tip={`${WEATHER_NAMES[game.weather]}\n${HUD.weatherTip}`}
            data-testid="imp-weather"
          >
            <Icon name={WEATHER_SYMBOLS[game.weather]} size={20} />
          </span>
          {research !== null && (
            <button
              type="button"
              className="pointer-events-auto hidden cursor-pointer md:inline"
              data-tip={HUD.researchTip(RESEARCH_NAMES[research])}
              onClick={() => onOpen("research")}
            >
              <Icon name="flask" size={20} />
            </button>
          )}
          {enemies.length > 0 && (
            <button
              type="button"
              className="imp-pulse pointer-events-auto cursor-pointer text-[var(--imp-bad)]"
              data-tip={`${HUD.warTip}\n${T.atWarWith(enemies.join(", "))}`}
              data-testid="imp-war"
              onClick={() => onOpen("diplomacy")}
            >
              <Icon name="swords" size={20} />
            </button>
          )}
          <span
            className="imp-faint hidden tabular-nums xl:inline"
            data-tip={HUD.fpsTip}
            data-testid="imp-fps"
          >
            {fps} {T.fps}
          </span>
        </div>
        <div
          className="ml-auto flex items-center gap-1"
          role="group"
          aria-label={HUD.speedTitle}
        >
          {[0, ...speeds].map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={speed === value}
              data-tip={HUD.speedTip(value, value > NORMAL_TOP)}
              aria-label={HUD.speedTip(value, value > NORMAL_TOP)}
              data-testid={`imp-speed-${value}`}
              className={`imp-btn h-7 min-w-7 px-1 text-xs font-semibold md:h-8 md:min-w-8 ${
                value > NORMAL_TOP ? "text-pink-300" : ""
              }`}
              onClick={(event) => {
                onSpeed(value);
                event.currentTarget.blur();
              }}
            >
              {value === 0 ? <Icon name="pause" size={14} /> : `${value}x`}
            </button>
          ))}
        </div>
      </Panel>
      {allGoods && (
        <Panel
          className="imp-open absolute top-full right-0 left-0 z-30 mt-1 p-2 md:left-auto md:w-[40rem]"
          testId="imp-goods-all"
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="imp-title text-sm">
              {HUD.moreGoods}
              {owned ? ` - ${game.world.islands[island].name}` : ""}
            </span>
            <span className="imp-muted text-xs">
              {T.capacity}: {room}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3">
            {GOOD_IDS.map((good) => (
              <GoodChip
                key={good}
                good={good}
                have={stock?.[good] ?? 0}
                room={room}
                flow={flows[good]}
                cheat={game.cheat}
                shown={owned}
                wide
                className="flex"
              />
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

/** A thin brass line between two groups of the bar. */
function Divider(): ReactElement {
  return (
    <span className="hidden h-9 w-px self-center bg-gradient-to-b from-transparent via-[var(--imp-brass)] to-transparent md:block" />
  );
}

/** One good with its stock, and its flow in the tooltip. */
function GoodChip({
  good,
  have,
  room,
  flow,
  cheat,
  shown,
  wide = false,
  className,
}: {
  readonly good: GoodId;
  readonly have: number;
  readonly room: number;
  readonly flow: Flow;
  readonly cheat: boolean;
  readonly shown: boolean;
  readonly wide?: boolean;
  readonly className: string;
}): ReactElement {
  const net = flow.made - flow.used;
  const full = room > 0 && have >= room;
  const tip = [
    GOOD_NAMES[good],
    HUD.stockLine(Math.floor(have), room),
    HUD.madeLine(rateText(flow.made)),
    HUD.usedLine(rateText(flow.used)),
    HUD.netLine(`${net >= 0 ? "+" : ""}${rateText(net)}`),
  ].join("\n");
  return (
    <span
      className={`${className} items-center gap-1 tabular-nums`}
      data-tip={tip}
      data-testid={`imp-good-${good}`}
    >
      <GoodIcon good={good} size={wide ? WIDE_ICON : CHIP_ICON} />
      <span className="flex flex-col leading-tight">
        <span
          className={`text-[13px] ${full ? "text-[var(--imp-warn)]" : ""} ${
            have < 1 && shown ? "imp-faint" : ""
          }`}
        >
          {cheat ? T.endless : shown ? Math.floor(have) : "-"}
          {wide && (
            <span className="imp-muted ml-1 text-[11px]">
              {GOOD_NAMES[good]}
            </span>
          )}
        </span>
        {shown && !cheat && Math.abs(net) >= MIN_SHOWN_RATE && (
          <span
            className={`text-[10px] ${net >= 0 ? "text-[var(--imp-good)]" : "text-[var(--imp-bad)]"}`}
          >
            {net >= 0 ? "+" : ""}
            {rateText(net)}
          </span>
        )}
      </span>
    </span>
  );
}
