/**
 * The administration: one window with a tab for each overview - finances,
 * population, production with its bottlenecks, warehouses, every island,
 * ships, the military, trade routes, the free trader, diplomacy, missions
 * and research.
 *
 * @module
 */
"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  buildingUpkeep,
  lineBalance,
  shipUpkeep,
} from "@/games/imperavis/engine/economy";
import { GOOD, GOOD_IDS } from "@/games/imperavis/engine/goods";
import {
  residentsByTier,
  TAX_LEVELS,
  workersNeeded,
} from "@/games/imperavis/engine/population";
import { SHIP } from "@/games/imperavis/engine/ships-data";
import { HUMAN, playerById } from "@/games/imperavis/engine/players";
import { TIERS } from "@/games/imperavis/engine/tiers";
import { buyPrice, sellPrice } from "@/games/imperavis/engine/trader";
import { capacityOf } from "@/games/imperavis/engine/warehouse";
import type {
  Command,
  Game,
  GoodId,
  LedgerLine,
  ProducerStatus,
  RouteAction,
  RouteStop,
  TaxLevel,
  TradeRoute,
} from "@/games/imperavis/engine/types";
import {
  GOOD_CATEGORY_NAMES,
  GOOD_NAMES,
  SHIP_NAMES,
  STATUS_TEXTS,
  TEXTS as T,
  TIER_NAMES,
} from "@/games/imperavis/i18n/texts";
import { fleetOfShip } from "@/games/imperavis/engine/fleets";
import type { Units } from "@/games/imperavis/hooks/orders";
import { MIL } from "@/games/imperavis/i18n/military-texts";
import type { Pick } from "@/games/imperavis/render/view";
import { Diplomacy } from "./diplomacy-view";
import { Military } from "./military-view";
import { shipTask } from "./ship-orders";
import { ShipArt } from "./unit-art";
import { Missions } from "./missions-view";
import { Research } from "./research-view";
import { HUD } from "@/games/imperavis/i18n/hud-texts";
import {
  islandEconomy,
  islandProducts,
  productionRows,
  type EconomyState,
} from "./hud-data";
import { Crest, GoodIcon, Icon, type IconName } from "./icons";
import { drawIsland } from "./minimap";
import { Bar, Btn, goldText, percent, rateText, Tabs, Window } from "./ui";

/** The overviews there are. */
export type Overview =
  | "finance"
  | "people"
  | "production"
  | "stock"
  | "islands"
  | "ships"
  | "military"
  | "routes"
  | "trade"
  | "diplomacy"
  | "missions"
  | "research";

/** Their titles. */
export const OVERVIEW_TITLES: Readonly<Record<Overview, string>> = {
  finance: T.finance,
  people: T.people,
  production: HUD.productionTab,
  stock: T.warehouses,
  islands: T.islands,
  ships: T.ships,
  military: MIL.military,
  routes: T.routes,
  trade: T.trade,
  diplomacy: T.diplomacy,
  missions: T.missions,
  research: T.research,
};

/** The tabs in order, with their symbols. */
const TABS: readonly { readonly id: Overview; readonly icon: IconName }[] = [
  { id: "finance", icon: "coins" },
  { id: "people", icon: "people" },
  { id: "production", icon: "factory" },
  { id: "stock", icon: "crate" },
  { id: "islands", icon: "globe" },
  { id: "ships", icon: "ship" },
  { id: "military", icon: "swords" },
  { id: "routes", icon: "map" },
  { id: "trade", icon: "coin" },
  { id: "diplomacy", icon: "handshake" },
  { id: "missions", icon: "scroll" },
  { id: "research", icon: "flask" },
];

/** Width and height of an island's miniature, px. */
const MINI = 64;

/** Production rows shown for one good at most in the miniature list. */
const SHOWN_PRODUCTS = 4;

/** Width and height of the gold chart. */
const CHART_W = 280;
const CHART_H = 60;

/** Supply below this shows amber. */
const SHORT_SUPPLY = 0.5;

/** Units a new route action moves. */
const DEFAULT_AMOUNT = 20;

/** Props of {@link AdminWindow} and of each of its pages. */
export type OverviewProps = {
  readonly game: Game;
  readonly which: Overview;
  readonly onWhich: (which: Overview) => void;
  /** Open offers and missions, for the badges of the tabs. */
  readonly badges: Partial<Record<Overview, number>>;
  /** The island in view. */
  readonly island: number;
  readonly onIsland: (island: number) => void;
  readonly onCommand: (command: Command) => boolean;
  readonly onFocus: (x: number, y: number) => void;
  readonly onClose: () => void;
  /** The control groups, for the military overview. */
  readonly groups?: () => ReadonlyMap<number, Units>;
  /** Picks units on the map. */
  readonly onSelect?: (pick: Pick) => void;
};

/**
 * Renders the administration window on one of its tabs.
 *
 * @param props - game, the tab and actions
 * @returns the window
 */
export function AdminWindow(props: OverviewProps): ReactElement {
  const { which, onWhich, onClose, badges } = props;
  const body: Record<Overview, () => ReactElement> = {
    finance: () => <Finance {...props} />,
    people: () => <People {...props} />,
    production: () => <Production {...props} />,
    stock: () => <Stock {...props} />,
    islands: () => <Islands {...props} />,
    ships: () => <Ships {...props} />,
    military: () => (
      <Military
        game={props.game}
        groups={props.groups ?? (() => new Map())}
        onFocus={props.onFocus}
        onSelect={props.onSelect ?? (() => undefined)}
      />
    ),
    routes: () => <Routes {...props} />,
    trade: () => <Trade {...props} />,
    diplomacy: () => <Diplomacy {...props} />,
    missions: () => <Missions {...props} />,
    research: () => <Research {...props} />,
  };
  return (
    <Window
      title={HUD.adminTitle}
      icon="scroll"
      subtitle={OVERVIEW_TITLES[which]}
      onClose={onClose}
      testId="imp-admin"
      closeTestId="imp-overview-close"
      className="h-full w-full"
    >
      <div className="sticky top-0 z-10 -mx-3 bg-[rgb(36_28_22/0.97)] px-3 pt-1 pb-2">
        <Tabs
          tabs={TABS.map((tab) => ({
            id: tab.id,
            icon: tab.icon,
            label: OVERVIEW_TITLES[tab.id],
            badge: badges[tab.id],
          }))}
          value={which}
          onChange={onWhich}
          testPrefix="imp-open"
        />
      </div>
      <div data-testid={`imp-overview-${which}`}>{body[which]()}</div>
    </Window>
  );
}

/** Islands the player owns. */
function ownedIslands(game: Game): number[] {
  return game.islands
    .filter((island) => island.owner === HUMAN)
    .map((island) => island.id);
}

/** A row picking one of the player's islands. */
function IslandPicker({
  game,
  island,
  onIsland,
}: OverviewProps): ReactElement | null {
  const owned = ownedIslands(game);
  return owned.length > 1 ? (
    <div className="mb-2 flex flex-wrap gap-1">
      {owned.map((id) => (
        <Btn key={id} small active={id === island} onClick={() => onIsland(id)}>
          {game.world.islands[id].name}
        </Btn>
      ))}
    </div>
  ) : null;
}

/** Income and expenses. */
function Finance({ game, onCommand }: OverviewProps): ReactElement {
  const human = game.players[HUMAN];
  const ledger = human.ledger;
  const rows: [keyof LedgerLine, string, boolean][] = [
    ["taxes", T.taxes, true],
    ["sales", T.sales, true],
    ["rewards", T.rewards, true],
    ["upkeepBuildings", T.upkeepBuildings, false],
    ["upkeepShips", T.upkeepShips, false],
    ["purchases", T.purchases, false],
    ["construction", T.construction, false],
    ["payments", T.payments, false],
  ];
  const history = [...ledger.history, Math.round(human.gold)];
  const low = Math.min(...history, 0);
  const high = Math.max(...history, 1);
  const points = history
    .map(
      (value, index) =>
        `${(index / Math.max(1, history.length - 1)) * CHART_W},${CHART_H - ((value - low) / (high - low)) * CHART_H}`,
    )
    .join(" ");
  return (
    <div className="flex flex-col gap-3 text-sm" data-testid="imp-finance">
      <table className="w-full tabular-nums">
        <thead>
          <tr className="text-left text-xs imp-muted">
            <th />
            <th className="text-right">{T.lastMinute}</th>
            <th className="text-right">{T.thisMinute}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([key, label, income]) => (
            <tr key={key}>
              <td>{label}</td>
              <td
                className={`text-right ${income ? "text-[var(--imp-good)]" : "text-[var(--imp-bad)]"}`}
              >
                {income ? "+" : "-"}
                {goldText(ledger.last[key])}
              </td>
              <td className="text-right imp-muted">
                {goldText(ledger.current[key])}
              </td>
            </tr>
          ))}
          <tr className="border-t border-[var(--imp-brass-lo)] font-semibold">
            <td>{T.balance}</td>
            <td className="text-right" data-testid="imp-balance">
              {goldText(lineBalance(ledger.last))}
            </td>
            <td className="text-right imp-muted">
              {goldText(lineBalance(ledger.current))}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="text-xs imp-muted">
        {T.upkeepBuildings}: {goldText(buildingUpkeep(game, HUMAN))}
        {T.perMinute} - {T.upkeepShips}: {goldText(shipUpkeep(game, HUMAN))}
        {T.perMinute}
      </p>
      <div>
        <p className="mb-1 text-xs imp-muted">{T.history}</p>
        <svg
          width={CHART_W}
          height={CHART_H}
          className="overflow-visible"
          role="img"
          aria-label={T.history}
        >
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="text-[var(--imp-gold)]"
          />
        </svg>
      </div>
      <div>
        <p className="mb-1 imp-title text-[0.8rem]">{T.taxLevel}</p>
        <div className="flex flex-wrap gap-1">
          {([0, 1, 2] as TaxLevel[]).map((level) => (
            <Btn
              key={level}
              small
              active={human.taxLevel === level}
              onClick={() => onCommand({ type: "tax", level })}
              testId={`imp-tax-${level}`}
            >
              {T.taxNames[level]} ({percent(TAX_LEVELS[level].factor)})
            </Btn>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Tiers, houses, supply and workers. */
function People(props: OverviewProps): ReactElement {
  const { game, island } = props;
  const all = residentsByTier(game, null, HUMAN);
  const here = residentsByTier(game, island);
  const need = workersNeeded(game, island);
  const human = game.players[HUMAN];
  const open = (index: number) =>
    TIERS[index].research === null ||
    human.research.done.includes(TIERS[index].research);
  const houses = TIERS.map(
    (tier) =>
      game.buildings.filter(
        (b) =>
          b.house?.tier === tier.index &&
          game.islands[b.island].owner === HUMAN,
      ).length,
  );
  const supply = game.islands[island]?.supply;
  const wanted = new Set<GoodId>(
    TIERS.filter((tier) => open(tier.index)).flatMap((tier) =>
      tier.goods.map((want) => want.good),
    ),
  );
  return (
    <div className="flex flex-col gap-3 text-sm" data-testid="imp-people">
      <IslandPicker {...props} />
      <table className="w-full tabular-nums">
        <thead>
          <tr className="text-left text-xs imp-muted">
            <th>{T.tierRow}</th>
            <th className="text-right">{T.houses}</th>
            <th className="text-right">{T.population}</th>
            <th className="text-right">{T.workplaces}</th>
          </tr>
        </thead>
        <tbody>
          {TIERS.map((tier) => (
            <tr
              key={tier.index}
              className={open(tier.index) ? "" : "imp-faint"}
            >
              <td>{TIER_NAMES[tier.index]}</td>
              <td className="text-right">{houses[tier.index]}</td>
              <td className="text-right">{all[tier.index]}</td>
              <td className="text-right">
                {need[tier.index] > 0
                  ? `${Math.min(need[tier.index], here[tier.index])}/${need[tier.index]}`
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <p className="mb-1 imp-title text-[0.8rem]">
          {T.supply} - {game.world.islands[island]?.name}
        </p>
        <ul className="flex flex-col gap-1 text-xs">
          {[...wanted].map((good) => (
            <li
              key={good}
              className="grid grid-cols-[8rem_1fr_3rem] items-center gap-2"
            >
              <span>
                <span className="inline-flex items-center gap-1">
                  <GoodIcon good={good} size={14} />
                  {GOOD_NAMES[good]}
                </span>
              </span>
              <Bar
                value={supply?.[good] ?? 0}
                color={
                  (supply?.[good] ?? 0) < SHORT_SUPPLY
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }
              />
              <span className="text-right">{percent(supply?.[good] ?? 0)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** One island's goods. */
function Stock(props: OverviewProps): ReactElement {
  const { game, island } = props;
  const stock = game.islands[island]?.stock;
  const capacity = capacityOf(game, island);
  return (
    <div className="flex flex-col gap-2 text-sm" data-testid="imp-stock">
      <IslandPicker {...props} />
      <p className="text-xs imp-muted">
        {game.world.islands[island]?.name}: {T.capacity} {capacity}
      </p>
      <ul className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
        {GOOD_IDS.map((good) => (
          <li
            key={good}
            className="grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-2"
            title={GOOD_CATEGORY_NAMES[GOOD[good].category]}
          >
            <span>
              <span className="inline-flex items-center gap-1">
                <GoodIcon good={good} size={14} />
                {GOOD_NAMES[good]}
              </span>
            </span>
            <Bar
              value={capacity > 0 ? (stock?.[good] ?? 0) / capacity : 0}
              color={
                (stock?.[good] ?? 0) >= capacity && capacity > 0
                  ? "bg-red-500"
                  : "bg-sky-500"
              }
            />
            <span
              className="text-right tabular-nums"
              data-testid={`imp-stock-${good}`}
            >
              {Math.floor(stock?.[good] ?? 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Every island of the world: picture, owner, people, state and goods. */
function Islands({ game, onFocus, onIsland }: OverviewProps): ReactElement {
  return (
    <ul
      className="grid grid-cols-1 gap-2 text-sm xl:grid-cols-2"
      data-testid="imp-islands"
    >
      {game.world.islands.map((info) => {
        const owner = game.islands[info.id].owner;
        const holder = playerById(game, owner);
        const people = residentsByTier(game, info.id).reduce(
          (sum, value) => sum + value,
          0,
        );
        const deposits = (["stone", "clay", "ore"] as const)
          .filter((kind) => info.deposits[kind] > 0)
          .map((kind) => T.depositNames[kind]);
        const crops = [
          info.fertile.grain ? GOOD_NAMES.grain : null,
          info.fertile.grapes ? GOOD_NAMES.grapes : null,
          info.fertile.tobacco ? GOOD_NAMES.tobacco : null,
        ].filter((name) => name !== null);
        const economy = islandEconomy(game, info.id);
        const products = islandProducts(game, info.id).slice(0, SHOWN_PRODUCTS);
        return (
          <li key={info.id}>
            <button
              type="button"
              className="imp-tile w-full"
              data-tip={`${info.name}\n${HUD.goToIsland}`}
              data-testid={`imp-island-${info.id}`}
              onClick={(event) => {
                onFocus(info.cx, info.cy);
                onIsland(info.id);
                event.currentTarget.blur();
              }}
            >
              <div className="flex items-start gap-2">
                <IslandMiniature game={game} island={info.id} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Crest
                      color={holder?.color ?? null}
                      size={18}
                      variant={info.id}
                    />
                    <span className="imp-display truncate font-semibold">
                      {info.name}
                    </span>
                    {info.id === game.world.startIsland && (
                      <Icon name="star" size={12} className="imp-gold" />
                    )}
                  </div>
                  <p className="imp-muted text-xs">
                    {HUD.economy}: {ECONOMY_NAMES[economy]}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs">
                    <span className="imp-muted">{HUD.production}:</span>
                    {products.length === 0
                      ? HUD.noProduction
                      : products.map((item) => (
                          <span
                            key={item.good}
                            className="inline-flex items-center gap-0.5 tabular-nums"
                            data-tip={GOOD_NAMES[item.good]}
                          >
                            <GoodIcon good={item.good} size={13} />
                            {rateText(item.rate)}
                          </span>
                        ))}
                  </p>
                </div>
              </div>
              <p className="imp-muted text-xs">
                {holder !== null
                  ? `${holder.human ? T.owned : holder.name} - ${people} ${T.population}`
                  : T.free}{" "}
                - {T.area} {info.area} ({T.sizeNames[info.size]}), {T.forest}{" "}
                {info.forest}, {T.coast} {info.coast}
              </p>
              <p className="text-xs">
                {T.fertility}: {crops.length > 0 ? crops.join(", ") : T.none} -{" "}
                {T.deposits}:{" "}
                {deposits.length > 0 ? deposits.join(", ") : T.none}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Words for the state of an island's economy. */
const ECONOMY_NAMES: Readonly<Record<EconomyState, string>> = {
  good: HUD.economyGood,
  mixed: HUD.economyMixed,
  poor: HUD.economyPoor,
  none: HUD.economyNone,
};

/** A small picture of an island: its land, and its owner's colour. */
function IslandMiniature({
  game,
  island,
}: {
  readonly game: Game;
  readonly island: number;
}): ReactElement {
  const ref = useRef<HTMLCanvasElement>(null);
  const owner = game.islands[island].owner;
  const color = playerById(game, owner)?.color ?? null;
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (canvas !== null && context !== null && context !== undefined) {
      drawIsland(context, game, island, color, MINI);
    }
  }, [game, island, color]);
  return (
    <canvas
      ref={ref}
      width={MINI}
      height={MINI}
      className="imp-inset h-16 w-16 shrink-0"
      aria-hidden="true"
    />
  );
}

/** Production per good: made, used, producers and why some stand still. */
function Production(props: OverviewProps): ReactElement {
  const { game } = props;
  const [scope, setScope] = useState<number | null>(null);
  const rows = productionRows(game, scope);
  const owned = ownedIslands(game);
  const stalled = rows.filter((row) => Object.keys(row.stalls).length > 0);
  const slow = rows.filter((row) => row.overLand > 0 || row.cutOff > 0);
  return (
    <div className="flex flex-col gap-3 text-sm" data-testid="imp-production">
      <p className="imp-muted text-xs">{HUD.productionHint}</p>
      {owned.length > 1 && (
        <div className="flex flex-wrap gap-1">
          <Btn small active={scope === null} onClick={() => setScope(null)}>
            {HUD.allIslandsOption}
          </Btn>
          {owned.map((id) => (
            <Btn
              key={id}
              small
              active={scope === id}
              onClick={() => setScope(id)}
            >
              {game.world.islands[id].name}
            </Btn>
          ))}
        </div>
      )}
      {rows.length === 0 ? (
        <p className="imp-muted">{HUD.noPlants}</p>
      ) : (
        <table className="w-full text-xs tabular-nums">
          <thead>
            <tr className="imp-muted text-left">
              <th>{HUD.good}</th>
              <th className="text-right">{HUD.plants}</th>
              <th className="text-right">{HUD.made}</th>
              <th className="text-right">{HUD.used}</th>
              <th className="text-right">{HUD.net}</th>
              <th className="hidden pl-2 text-left sm:table-cell">
                {HUD.bottleneck}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const net = row.made - row.used;
              const stalls = Object.entries(row.stalls) as [
                ProducerStatus,
                number,
              ][];
              return (
                <tr
                  key={row.good}
                  className="border-t border-[rgb(176_141_87/0.15)]"
                  data-testid={`imp-production-${row.good}`}
                >
                  <td className="py-1">
                    <span className="inline-flex items-center gap-1">
                      <GoodIcon good={row.good} size={14} />
                      {GOOD_NAMES[row.good]}
                    </span>
                  </td>
                  <td className="text-right">{row.plants}</td>
                  <td className="text-right text-[var(--imp-good)]">
                    {rateText(row.made)}
                  </td>
                  <td className="text-right text-[var(--imp-bad)]">
                    {rateText(row.used)}
                  </td>
                  <td
                    className={`text-right font-semibold ${net < 0 ? "text-[var(--imp-bad)]" : ""}`}
                  >
                    {net >= 0 ? "+" : ""}
                    {rateText(net)}
                  </td>
                  <td className="hidden pl-2 text-[var(--imp-warn)] sm:table-cell">
                    {stalls
                      .map(
                        ([status, count]) =>
                          `${count}x ${STATUS_TEXTS[status]}`,
                      )
                      .join(", ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <div>
        <p className="imp-title mb-1 text-[0.8rem]">{HUD.bottlenecks}</p>
        {stalled.length === 0 ? (
          <p className="imp-muted text-xs">{HUD.noBottlenecks}</p>
        ) : (
          <ul className="flex flex-col gap-1 text-xs">
            {stalled.map((row) => (
              <li key={row.good} className="flex items-center gap-1.5">
                <Icon
                  name="warning"
                  size={14}
                  className="text-[var(--imp-warn)]"
                />
                <GoodIcon good={row.good} size={14} />
                <span>
                  {GOOD_NAMES[row.good]}:{" "}
                  {HUD.stalled(
                    Object.values(row.stalls).reduce(
                      (sum, count) => sum + (count ?? 0),
                      0,
                    ),
                    row.plants,
                  )}{" "}
                  -{" "}
                  {(Object.entries(row.stalls) as [ProducerStatus, number][])
                    .map(([status]) => STATUS_TEXTS[status])
                    .join(", ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div data-testid="imp-transport-bottlenecks">
        <p className="imp-title mb-1 text-[0.8rem]">
          {HUD.transportBottlenecks}
        </p>
        {slow.length === 0 ? (
          <p className="imp-muted text-xs">{HUD.noTransportBottlenecks}</p>
        ) : (
          <ul className="flex flex-col gap-1 text-xs">
            {slow.map((row) => (
              <li key={row.good} className="flex items-center gap-1.5">
                <Icon
                  name="road"
                  size={14}
                  className={
                    row.cutOff > 0
                      ? "text-[var(--imp-bad)]"
                      : "text-[var(--imp-warn)]"
                  }
                />
                <GoodIcon good={row.good} size={14} />
                <span>
                  {GOOD_NAMES[row.good]}:{" "}
                  {HUD.transportLine(row.overLand, row.cutOff, row.waiting)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** The player's ships: kind, state, task, fleet, hold and where they are. */
function Ships({ game, onFocus, onSelect }: OverviewProps): ReactElement {
  const ships = game.ships.filter((ship) => ship.owner === HUMAN);
  return ships.length === 0 ? (
    <p className="text-sm imp-muted">{T.noShips}</p>
  ) : (
    <ul className="flex flex-col gap-2 text-sm" data-testid="imp-ships">
      {ships.map((ship) => {
        const used = Object.values(ship.cargo).reduce(
          (sum, amount) => sum + (amount ?? 0),
          0,
        );
        const route =
          ship.order.type === "route"
            ? game.routes.find(
                (r) => r.id === (ship.order as { route: number }).route,
              )
            : undefined;
        return (
          <li
            key={ship.id}
            className="flex items-center justify-between gap-2 imp-card"
            data-testid={`imp-ship-row-${ship.id}`}
            data-tip={HUD.shipTip(
              ship.name,
              SHIP_NAMES[ship.kind],
              cargoWords(ship.cargo) || T.emptyCargo,
              route?.name ?? HUD.routeNone,
            )}
          >
            <ShipArt kind={ship.kind} size={44} />
            <span className="min-w-0 flex-1">
              <span className="font-semibold">{ship.name}</span> (
              {SHIP_NAMES[ship.kind]}) - {T.cargo} {used}/
              {SHIP[ship.kind].slots * SHIP[ship.kind].slotSize}
              {route !== undefined ? ` - ${route.name}` : ""}
              <span className="imp-muted block text-xs">
                {MIL.stats.hp} {Math.round(ship.hp)}/{SHIP[ship.kind].hp} -{" "}
                {MIL.perSecond(SHIP[ship.kind].speed)} - {shipTask(game, ship)}
                {fleetOfShip(game, ship) !== null
                  ? ` - ${fleetOfShip(game, ship)?.name ?? ""}`
                  : ""}{" "}
                - {MIL.position} {Math.floor(ship.x)}, {Math.floor(ship.y)}
              </span>
            </span>
            <Btn
              small
              onClick={() => {
                onSelect?.({ type: "ship", id: ship.id });
                onFocus(ship.x, ship.y);
              }}
            >
              {T.goTo}
            </Btn>
          </li>
        );
      })}
    </ul>
  );
}

/** What a hold carries, in words. */
function cargoWords(cargo: Partial<Record<GoodId, number>>): string {
  return (Object.entries(cargo) as [GoodId, number][])
    .filter(([, amount]) => amount >= 1)
    .map(([good, amount]) => `${Math.floor(amount)} ${GOOD_NAMES[good]}`)
    .join(", ");
}

/** Trade routes and their editor. */
function Routes({ game, onCommand }: OverviewProps): ReactElement {
  const owned = ownedIslands(game);
  const ships = game.ships.filter((ship) => ship.owner === HUMAN);
  const routes = game.routes.filter((route) => route.owner === HUMAN);
  const create = () => {
    const stops: RouteStop[] = owned.slice(0, 2).map((island, index) => ({
      island,
      actions: [
        {
          good: "planks",
          mode: index === 0 ? "load" : "unload",
          amount: DEFAULT_AMOUNT,
          limit: index === 0 ? 0 : DEFAULT_AMOUNT * 2,
          priority: 1,
        },
      ],
    }));
    onCommand({
      type: "routeCreate",
      name: T.routeName(routes.length + 1),
      stops,
    });
  };
  return (
    <div className="flex flex-col gap-3 text-sm" data-testid="imp-routes">
      {owned.length < 2 ? (
        <p className="imp-muted">{T.needTwoKontors}</p>
      ) : null}
      {routes.length === 0 && <p className="imp-muted">{T.noRoutes}</p>}
      {routes.map((route) => (
        <RouteEditor
          key={route.id}
          game={game}
          route={route}
          owned={owned}
          ships={ships.map((ship) => ({
            id: ship.id,
            name: ship.name,
            on: ship.order.type === "route" && ship.order.route === route.id,
          }))}
          onCommand={onCommand}
        />
      ))}
      <Btn disabled={owned.length < 2} onClick={create} testId="imp-route-new">
        {T.newRoute}
      </Btn>
    </div>
  );
}

/** One route's stops and actions. */
function RouteEditor({
  game,
  route,
  owned,
  ships,
  onCommand,
}: {
  readonly game: Game;
  readonly route: TradeRoute;
  readonly owned: readonly number[];
  readonly ships: readonly { id: number; name: string; on: boolean }[];
  readonly onCommand: (command: Command) => boolean;
}): ReactElement {
  const update = (stops: RouteStop[], active = route.active) =>
    onCommand({ type: "routeUpdate", route: route.id, stops, active });
  const stops = route.stops.map((stop) => ({
    island: stop.island,
    actions: stop.actions.map((action) => ({ ...action })),
  }));
  const setAction = (
    stopIndex: number,
    actionIndex: number,
    change: Partial<RouteAction>,
  ) => {
    stops[stopIndex].actions[actionIndex] = {
      ...stops[stopIndex].actions[actionIndex],
      ...change,
    };
    update(stops);
  };
  const input = "imp-input w-14";
  return (
    <div className="imp-card" data-testid={`imp-route-${route.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{route.name}</span>
        <span
          className={`text-xs ${route.blocked !== null ? "text-[var(--imp-bad)]" : "text-[var(--imp-good)]"}`}
          data-testid="imp-route-state"
        >
          {route.blocked !== null ? T.blockedNames[route.blocked] : T.routeOk} -{" "}
          {T.trips(route.trips)}
        </span>
      </div>
      <ol className="mt-2 flex flex-col gap-2">
        {stops.map((stop, stopIndex) => (
          <li key={stopIndex} className="imp-inset p-2">
            <div className="flex flex-wrap items-center gap-2">
              <span>
                {T.stop} {stopIndex + 1}:
              </span>
              <select
                value={stop.island}
                onChange={(event) => {
                  stops[stopIndex].island = Number(event.target.value);
                  update(stops);
                }}
                className="imp-input"
              >
                {owned.map((id) => (
                  <option key={id} value={id}>
                    {game.world.islands[id].name}
                  </option>
                ))}
              </select>
              {stops.length > 2 && (
                <Btn
                  small
                  onClick={() =>
                    update(stops.filter((_, index) => index !== stopIndex))
                  }
                >
                  {T.removeStop}
                </Btn>
              )}
            </div>
            <ul className="mt-1 flex flex-col gap-1 text-xs">
              {stop.actions.map((action, actionIndex) => (
                <li
                  key={actionIndex}
                  className="flex flex-wrap items-center gap-1"
                >
                  <select
                    value={action.good}
                    onChange={(event) =>
                      setAction(stopIndex, actionIndex, {
                        good: event.target.value as GoodId,
                      })
                    }
                    className="imp-input"
                  >
                    {GOOD_IDS.map((good) => (
                      <option key={good} value={good}>
                        {GOOD_NAMES[good]}
                      </option>
                    ))}
                  </select>
                  <Btn
                    small
                    onClick={() =>
                      setAction(stopIndex, actionIndex, {
                        mode: action.mode === "load" ? "unload" : "load",
                      })
                    }
                  >
                    {action.mode === "load" ? T.loadMode : T.unloadMode}
                  </Btn>
                  <label>
                    {T.amount}{" "}
                    <input
                      type="number"
                      min={0}
                      value={action.amount}
                      onChange={(event) =>
                        setAction(stopIndex, actionIndex, {
                          amount: Math.max(0, Number(event.target.value)),
                        })
                      }
                      className={input}
                    />
                  </label>
                  <label>
                    {action.mode === "load" ? T.limitLoad : T.limitUnload}{" "}
                    <input
                      type="number"
                      min={0}
                      value={action.limit}
                      onChange={(event) =>
                        setAction(stopIndex, actionIndex, {
                          limit: Math.max(0, Number(event.target.value)),
                        })
                      }
                      className={input}
                    />
                  </label>
                  <label>
                    {T.priority}{" "}
                    <select
                      value={action.priority}
                      onChange={(event) =>
                        setAction(stopIndex, actionIndex, {
                          priority: Number(event.target.value),
                        })
                      }
                      className="imp-input"
                      data-testid="imp-route-priority"
                    >
                      {T.priorityNames.map((name, value) => (
                        <option key={name} value={value}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Btn
                    small
                    onClick={() =>
                      update(
                        stops.map((s, i) =>
                          i === stopIndex
                            ? {
                                ...s,
                                actions: s.actions.filter(
                                  (_, k) => k !== actionIndex,
                                ),
                              }
                            : s,
                        ),
                      )
                    }
                  >
                    x
                  </Btn>
                </li>
              ))}
            </ul>
            <Btn
              small
              onClick={() => {
                stops[stopIndex].actions.push({
                  good: "planks",
                  mode: "load",
                  amount: DEFAULT_AMOUNT,
                  limit: 0,
                  priority: 1,
                });
                update(stops);
              }}
            >
              {T.addAction}
            </Btn>
          </li>
        ))}
      </ol>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Btn
          small
          onClick={() => update([...stops, { island: owned[0], actions: [] }])}
        >
          {T.addStop}
        </Btn>
        <Btn
          small
          active={route.active}
          onClick={() => update(stops, !route.active)}
        >
          {T.active}: {route.active ? T.on : T.off}
        </Btn>
        <select
          data-testid="imp-route-assign"
          value=""
          onChange={(event) => {
            if (event.target.value !== "") {
              onCommand({
                type: "assign",
                ship: Number(event.target.value),
                route: route.id,
              });
            }
          }}
          className="imp-input text-xs"
        >
          <option value="">{T.assignShip}</option>
          {ships.map((ship) => (
            <option key={ship.id} value={ship.id}>
              {ship.name}
              {ship.on ? " \u{2713}" : ""}
            </option>
          ))}
        </select>
        <Btn
          small
          onClick={() => onCommand({ type: "routeDelete", route: route.id })}
        >
          {T.deleteRoute}
        </Btn>
      </div>
    </div>
  );
}

/** The free trader's prices and the player's orders. */
function Trade(props: OverviewProps): ReactElement {
  const { game, island, onCommand } = props;
  const state = game.islands[island];
  const trader = game.trader;
  const last = trader.lastDeal;
  const setOrder = (
    good: GoodId,
    field: "sellAbove" | "buyBelow",
    value: number | null,
  ) => {
    const current = state.orders[good] ?? { sellAbove: null, buyBelow: null };
    const next = { ...current, [field]: value };
    onCommand({
      type: "order",
      island,
      good,
      order: next.sellAbove === null && next.buyBelow === null ? null : next,
    });
  };
  const input = "imp-input w-14";
  return (
    <div className="flex flex-col gap-2 text-sm" data-testid="imp-trade">
      <IslandPicker {...props} />
      <p className="text-xs imp-muted">
        {T.traderHint}{" "}
        {game.traderShip >= 0
          ? T.traderHere
          : T.traderNext(Math.max(0, Math.round(trader.nextVisit)))}{" "}
        {last !== null
          ? T.traderLast(
              game.world.islands[last.island].name,
              last.sold,
              last.bought,
            )
          : ""}
      </p>
      {state === undefined || state.owner !== HUMAN ? null : (
        <table className="w-full text-xs tabular-nums">
          <thead>
            <tr className="text-left imp-muted">
              <th />
              <th className="text-right">{T.stock}</th>
              <th className="text-right">{T.traderBuys}</th>
              <th className="text-right">{T.traderSells}</th>
              <th className="text-right">{T.sellAbove}</th>
              <th className="text-right">{T.buyBelow}</th>
            </tr>
          </thead>
          <tbody>
            {GOOD_IDS.map((good) => {
              const order = state.orders[good];
              return (
                <tr key={good}>
                  <td>
                    <span className="inline-flex items-center gap-1">
                      <GoodIcon good={good} size={14} />
                      {GOOD_NAMES[good]}
                    </span>
                  </td>
                  <td className="text-right">
                    {Math.floor(state.stock[good])}
                  </td>
                  <td className="text-right">
                    {sellPrice(game, good).toFixed(1)}
                  </td>
                  <td className="text-right">
                    {buyPrice(game, good).toFixed(1)}
                  </td>
                  <td className="text-right">
                    <input
                      type="number"
                      min={0}
                      placeholder={T.off}
                      data-testid={`imp-sell-${good}`}
                      value={order?.sellAbove ?? ""}
                      onChange={(event) =>
                        setOrder(
                          good,
                          "sellAbove",
                          event.target.value === ""
                            ? null
                            : Math.max(0, Number(event.target.value)),
                        )
                      }
                      className={input}
                    />
                  </td>
                  <td className="text-right">
                    <input
                      type="number"
                      min={0}
                      placeholder={T.off}
                      data-testid={`imp-buy-${good}`}
                      value={order?.buyBelow ?? ""}
                      onChange={(event) =>
                        setOrder(
                          good,
                          "buyBelow",
                          event.target.value === ""
                            ? null
                            : Math.max(0, Number(event.target.value)),
                        )
                      }
                      className={input}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
