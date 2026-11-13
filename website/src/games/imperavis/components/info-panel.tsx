/**
 * The object window on the right: what is selected, with a picture, name,
 * stage and state on top, tabs that exist only where there is something to
 * show (overview, production, logistics, stock, workers or residents,
 * finances, extensions; for a shipyard its yard, for a barracks its training;
 * for a ship orders, cargo, route and troops), and the actions at the
 * bottom - improve, repair, stop production, move, tear down. A rival's
 * building or ship shows what can be seen of it.
 *
 * @module
 */
"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import {
  levelGold,
  REFUND,
  repairGold,
} from "@/games/imperavis/engine/buildings";
import {
  BUILDING,
  DECOR_BEAUTY,
  DECOR_KINDS,
  INPUT_CAPACITY,
  LEVEL_COST,
  LEVEL_KINDS,
  OUTPUT_CAPACITY,
  WAREHOUSE_KINDS,
} from "@/games/imperavis/engine/buildings-data";
import {
  atOwnYard,
  hostile,
  SHIP_REPAIR_GOLD,
} from "@/games/imperavis/engine/combat";
import { roadAccess } from "@/games/imperavis/engine/derived";
import { upkeepOf } from "@/games/imperavis/engine/economy";
import { CART_SPEED } from "@/games/imperavis/engine/logistics-data";
import { linkKind, transportState } from "@/games/imperavis/engine/logistics";
import { GOOD_IDS } from "@/games/imperavis/engine/goods";
import { HUMAN, PIRATES, playerById } from "@/games/imperavis/engine/players";
import {
  beautyAt,
  centerTile,
  houseTax,
} from "@/games/imperavis/engine/population";
import { speedOf } from "@/games/imperavis/engine/production";
import {
  KONTOR_KIT,
  kontorShortfall,
} from "@/games/imperavis/engine/placement";
import { roomFor } from "@/games/imperavis/engine/ships";
import { SHIP } from "@/games/imperavis/engine/ships-data";
import { TIERS } from "@/games/imperavis/engine/tiers";
import {
  aboard,
  boardingSoldiers,
  shoreIslandOf,
} from "@/games/imperavis/engine/troops";
import { capacityOf } from "@/games/imperavis/engine/warehouse";
import type {
  Amounts,
  Building,
  Command,
  Game,
  GoodId,
  LinkKind,
  Ship,
} from "@/games/imperavis/engine/types";
import { HUD } from "@/games/imperavis/i18n/hud-texts";
import {
  BLOCKED_TEXTS,
  BUILDING_INFO,
  BUILDING_NAMES,
  GOOD_NAMES,
  REFUSAL_TEXTS,
  SHIP_NAMES,
  STATUS_TEXTS,
  TEXTS as T,
  TIER_NAMES,
} from "@/games/imperavis/i18n/texts";
import type { Pick, Tool } from "@/games/imperavis/render/view";
import { TUTORIAL } from "@/games/imperavis/i18n/tutorial-texts";
import { MIL } from "@/games/imperavis/i18n/military-texts";
import { BarracksPanel } from "./barracks-panel";
import { BuildingArt, GoodIcon, Icon } from "./icons";
import { ShipOrders, shipTask, UnitOrders } from "./ship-orders";
import { amountWords, YardPanel } from "./shipyard-panel";
import { settleOffer } from "./tutorial-panel";
import { ShipArt } from "./unit-art";
import {
  Bar,
  Btn,
  CostLine,
  Fact,
  goldText,
  IconBtn,
  percent,
  rateText,
  Section,
  Tabs,
  type TabDef,
} from "./ui";

/** Units moved by one load or unload click. */
const STEP = 10;

/** Satisfaction below this shows red. */
const LOW_MOOD = 0.4;

/** A need met this well counts for rising (as in the engine). */
const MET = 0.75;

/** Percent of a share. */
const PERCENT = 100;

/** Guards a division by a time of zero. */
const TINY = 1e-6;

/** Below this share of hit points the bar turns red. */
const HALF = 0.5;

/** Seconds in a minute. */
const MINUTE = 60;

/** Colour of the traffic light by how carts reach a producer. */
const LINK_TONES: Readonly<Record<LinkKind, string>> = {
  road: "bg-[var(--imp-good)]",
  land: "bg-[var(--imp-warn)]",
  none: "bg-[var(--imp-bad)]",
};

/** Seconds and speeds are shown with this many decimals. */
const DECIMALS = 1;

/** The tabs of the window. */
type Tab =
  | "yard"
  | "drill"
  | "orders"
  | "overview"
  | "production"
  | "logistics"
  | "stock"
  | "workers"
  | "residents"
  | "finance"
  | "extensions"
  | "cargo"
  | "route"
  | "troops";

/** Props of {@link InfoPanel}. */
type InfoPanelProps = {
  readonly game: Game;
  readonly selection: Pick;
  readonly onCommand: (command: Command) => boolean;
  readonly onTool: (tool: Tool) => void;
  readonly onClose: () => void;
  /** Picks one unit out of a group. */
  readonly onSelect: (pick: Pick) => void;
  /** Drawn large in the middle (shipyard, barracks) instead of at the side. */
  readonly wide?: boolean;
};

/**
 * Renders the object window for the selection.
 *
 * @param props - game, selection and actions
 * @returns the window, or null when nothing is selected
 */
export function InfoPanel(props: InfoPanelProps): ReactElement | null {
  const { game, selection } = props;
  let content: ReactElement | null = null;
  if (selection.type === "building") {
    const building = game.buildings.find((b) => b.id === selection.id);
    if (building !== undefined) {
      content = (
        <BuildingWindow
          key={`b${building.id}`}
          {...props}
          building={building}
        />
      );
    }
  } else if (selection.type === "ship") {
    const ship = game.ships.find((s) => s.id === selection.id);
    if (ship !== undefined) {
      content = <ShipWindow key={`s${ship.id}`} {...props} ship={ship} />;
    }
  } else if (
    selection.type === "units" &&
    (game.ships.some((ship) => selection.ships.includes(ship.id)) ||
      game.soldiers.some((soldier) => selection.soldiers.includes(soldier.id)))
  ) {
    content = (
      <UnitsWindow
        game={game}
        ships={selection.ships}
        soldiers={selection.soldiers}
        onSelect={props.onSelect}
        onClose={props.onClose}
        onCommand={props.onCommand}
        onTool={props.onTool}
      />
    );
  }
  return content;
}

/** The window of several selected units: who is in it, and the orders. */
function UnitsWindow({
  game,
  ships,
  soldiers,
  onSelect,
  onClose,
  onCommand,
  onTool,
}: {
  readonly game: Game;
  readonly ships: readonly number[];
  readonly soldiers: readonly number[];
  readonly onSelect: (pick: Pick) => void;
  readonly onClose: () => void;
  readonly onCommand: (command: Command) => boolean;
  readonly onTool: (tool: Tool) => void;
}): ReactElement {
  const fleet = game.ships.filter((ship) => ships.includes(ship.id));
  const troops = game.soldiers.filter((soldier) =>
    soldiers.includes(soldier.id),
  );
  return (
    <ObjectFrame
      art={
        <span className="imp-medal h-14 w-14">
          <Icon
            name={fleet.length > 0 ? "ship" : "swords"}
            size={30}
            className="imp-gold"
          />
        </span>
      }
      title={HUD.unitsTitle}
      subtitle={HUD.unitsLine(fleet.length, troops.length)}
      status={null}
      tabs={[]}
      tab="overview"
      onTab={() => undefined}
      onClose={onClose}
      testId="imp-units"
    >
      <div className="flex flex-col gap-1">
        {fleet.map((ship) => (
          <Btn
            key={ship.id}
            small
            icon={SHIP[ship.kind].guns !== null ? "cannon" : "ship"}
            onClick={() => onSelect({ type: "ship", id: ship.id })}
            className="justify-start"
          >
            {`${ship.name !== "" ? ship.name : SHIP_NAMES[ship.kind]} - ${SHIP_NAMES[ship.kind]}`}
          </Btn>
        ))}
        {troops.length > 0 && <Fact label={HUD.soldier}>{troops.length}</Fact>}
        <UnitOrders
          game={game}
          ships={ships}
          soldiers={soldiers}
          onCommand={onCommand}
          onTool={onTool}
        />
        <p className="imp-muted mt-1 text-xs">{HUD.unitsHint}</p>
      </div>
    </ObjectFrame>
  );
}

/** The frame every object window shares. */
function ObjectFrame({
  art,
  title,
  subtitle,
  status,
  tabs,
  tab,
  onTab,
  onClose,
  actions,
  children,
  testId,
  wide = false,
}: {
  readonly art: ReactNode;
  readonly title: string;
  readonly subtitle: string;
  readonly status: ReactNode;
  readonly tabs: readonly TabDef<Tab>[];
  readonly tab: Tab;
  readonly onTab: (tab: Tab) => void;
  readonly onClose: () => void;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly testId: string;
  readonly wide?: boolean;
}): ReactElement {
  return (
    <section
      className={`imp-panel imp-open-side flex max-h-full min-h-0 w-full flex-col text-sm ${wide ? "" : "md:w-[22rem]"}`}
      data-testid="imp-info"
    >
      <header className="flex items-start gap-3 px-3 pt-3" data-testid={testId}>
        {art}
        <div className="min-w-0 flex-1">
          <h2 className="imp-title text-base leading-tight">{title}</h2>
          <p className="imp-muted truncate text-xs">{subtitle}</p>
          <div className="mt-0.5 text-xs">{status}</div>
        </div>
        <IconBtn
          icon="close"
          tip={HUD.close}
          onClick={onClose}
          testId="imp-info-close"
          size={26}
        />
      </header>
      <div className="mt-2 px-3">
        {tabs.length > 1 && (
          <Tabs tabs={tabs} value={tab} onChange={onTab} testPrefix="imp-tab" />
        )}
      </div>
      <div className="imp-scroll min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {children}
      </div>
      {actions !== undefined && (
        <footer className="flex flex-wrap gap-1 border-t border-[var(--imp-brass-lo)] px-3 py-2">
          {actions}
        </footer>
      )}
    </section>
  );
}

/** A building's window. */
function BuildingWindow({
  game,
  building,
  onCommand,
  onTool,
  onClose,
  wide,
}: InfoPanelProps & { readonly building: Building }): ReactElement {
  const def = BUILDING[building.kind];
  const island = game.world.islands[building.island];
  const owner = playerById(game, game.islands[building.island].owner);
  const own = owner?.id === HUMAN;
  const tabs: TabDef<Tab>[] = [];
  // A shipyard opens on its yard, a barracks on its training.
  if (own && building.yard !== null) {
    tabs.push({ id: "yard", label: MIL.yardTitle });
  }
  if (own && building.drill !== null) {
    tabs.push({ id: "drill", label: MIL.barracksTitle });
  }
  tabs.push({ id: "overview", label: HUD.tabOverview });
  if (own) {
    if (building.prod !== null) {
      tabs.push({ id: "production", label: HUD.tabProduction });
      tabs.push({ id: "logistics", label: HUD.tabLogistics });
    }
    if (WAREHOUSE_KINDS.includes(building.kind)) {
      tabs.push({ id: "stock", label: HUD.tabStock });
    }
    if (building.house !== null) {
      tabs.push({ id: "residents", label: HUD.tabResidents });
    } else if (def.workers !== null) {
      tabs.push({ id: "workers", label: HUD.tabWorkers });
    }
    tabs.push({ id: "finance", label: HUD.tabFinance });
    if (LEVEL_KINDS.includes(building.kind)) {
      tabs.push({ id: "extensions", label: HUD.tabExtensions });
    }
  }
  const [tab, setTab] = useState<Tab>(tabs[0].id);
  const shown = tabs.some((item) => item.id === tab) ? tab : "overview";
  const name =
    building.house !== null
      ? `${BUILDING_NAMES.house} - ${TIER_NAMES[building.house.tier]}`
      : BUILDING_NAMES[building.kind];
  const status = !building.complete ? (
    <span className="text-[var(--imp-warn)]">
      {T.constructing(
        Math.round((building.built / def.buildSeconds) * PERCENT),
      )}
    </span>
  ) : building.fire > 0 ? (
    <span
      className="imp-pulse font-semibold text-[var(--imp-bad)]"
      data-testid="imp-burning"
    >
      {T.burning}
    </span>
  ) : building.prod !== null ? (
    <span
      className={
        building.prod.status === "working"
          ? "text-[var(--imp-good)]"
          : "text-[var(--imp-warn)]"
      }
      data-testid="imp-status"
    >
      {own && <LinkLight game={game} building={building} />}
      {STATUS_TEXTS[building.prod.status]}
    </span>
  ) : (
    <span className="imp-muted">
      {LEVEL_KINDS.includes(building.kind)
        ? T.stageName(building.level)
        : HUD.ready}
    </span>
  );
  const notReady = (
    <p className="imp-muted text-xs">{REFUSAL_TEXTS.notComplete}</p>
  );
  const body: Record<Tab, () => ReactNode> = {
    yard: () =>
      building.complete ? (
        <YardPanel game={game} building={building} onCommand={onCommand} />
      ) : (
        notReady
      ),
    drill: () =>
      building.complete ? (
        <BarracksPanel game={game} building={building} onCommand={onCommand} />
      ) : (
        notReady
      ),
    orders: () => null,
    overview: () =>
      own ? (
        <BuildingOverview game={game} building={building} />
      ) : (
        <ForeignOverview game={game} building={building} />
      ),
    production: () => (
      <ProductionTab game={game} building={building} onCommand={onCommand} />
    ),
    logistics: () => <LogisticsTab game={game} building={building} />,
    stock: () => <StockTab game={game} island={building.island} />,
    workers: () => <WorkersTab game={game} building={building} />,
    residents: () => <HouseTab game={game} building={building} />,
    finance: () => <FinanceTab game={game} building={building} />,
    extensions: () => (
      <ExtensionsTab game={game} building={building} onCommand={onCommand} />
    ),
    cargo: () => null,
    route: () => null,
    troops: () => null,
  };
  const damaged = building.hp < def.hp;
  const canLevel =
    LEVEL_KINDS.includes(building.kind) &&
    building.complete &&
    building.level === 0;
  const levelCost = { gold: levelGold(building.kind), ...LEVEL_COST };
  return (
    <ObjectFrame
      art={<BuildingArt kind={building.kind} size={56} />}
      title={name}
      subtitle={`${T.island} ${island.name}${
        own ? "" : ` - ${T.foreignBuilding(owner?.name ?? "")}`
      }`}
      status={status}
      tabs={tabs}
      tab={shown}
      onTab={setTab}
      onClose={onClose}
      testId={own ? `imp-info-${building.kind}` : "imp-info-foreign"}
      wide={wide}
      actions={
        own ? (
          <>
            {canLevel && (
              <Btn
                small
                icon="arrowUp"
                tip={HUD.upgradeTip(costWords(levelCost))}
                onClick={() => onCommand({ type: "levelUp", id: building.id })}
                testId="imp-level-up"
              >
                {HUD.upgrade}
              </Btn>
            )}
            {damaged && building.complete && (
              <Btn
                small
                icon="wrench"
                tip={HUD.repairTip(repairGold(building))}
                disabled={building.fire > 0}
                onClick={() => onCommand({ type: "repair", id: building.id })}
                testId="imp-repair-building"
              >
                {HUD.repair} ({repairGold(building)})
              </Btn>
            )}
            {(building.prod !== null || building.yard !== null) && (
              <Btn
                small
                icon={building.paused ? "play" : "stop"}
                tip={building.paused ? HUD.start : HUD.stop}
                onClick={() =>
                  onCommand({
                    type: "pause",
                    id: building.id,
                    paused: !building.paused,
                  })
                }
                testId="imp-pause-building"
              >
                {building.paused ? T.resumeBuilding : T.pauseBuilding}
              </Btn>
            )}
            {building.kind !== "kontor" && (
              <Btn
                small
                icon="move"
                tip={HUD.moveTip}
                onClick={() =>
                  onTool({
                    type: "relocate",
                    id: building.id,
                    kind: building.kind,
                    rot: building.rot,
                  })
                }
                testId="imp-move-building"
              >
                {HUD.move}
              </Btn>
            )}
            <Btn
              small
              danger
              icon="hammer"
              tip={HUD.demolishTip}
              onClick={() =>
                onCommand({ type: "demolish", x: building.x, y: building.y })
              }
              testId="imp-demolish-building"
            >
              {HUD.demolish}
            </Btn>
          </>
        ) : undefined
      }
    >
      {body[shown]()}
    </ObjectFrame>
  );
}

/** The first tab of an own building: what it costs and does. */
function BuildingOverview({
  game,
  building,
}: {
  readonly game: Game;
  readonly building: Building;
}): ReactElement {
  const def = BUILDING[building.kind];
  const prod = building.prod;
  const recipe = def.recipe;
  const house = building.house;
  const labour =
    def.workers === null
      ? 1
      : (game.labour[building.island]?.[def.workers.tier] ?? 0);
  const beauty = DECOR_BEAUTY[building.kind];
  return (
    <div className="flex flex-col gap-1">
      <p className="imp-muted text-xs leading-snug">
        {BUILDING_INFO[building.kind]}
      </p>
      <Health hp={building.hp} max={def.hp} />
      {!building.complete && (
        <Bar
          value={building.built / def.buildSeconds}
          color="bg-[var(--imp-warn)]"
        />
      )}
      {game.islands[building.island].plague > 0 && house !== null && (
        <p className="font-semibold text-[var(--imp-bad)]">{T.plague}</p>
      )}
      <Fact label={HUD.buildCost}>
        <CostLine cost={def.cost} />
      </Fact>
      <Fact label={HUD.upkeep}>
        {rateText(upkeepOf(building))}
        {T.perMinute}
      </Fact>
      {prod !== null && recipe !== null && (
        <>
          <Fact label={HUD.output}>
            <span className="inline-flex items-center gap-1">
              <GoodIcon good={recipe.output} size={14} />
              {HUD.perMinute(
                rateText(
                  (prod.efficiency *
                    speedOf(game, building) *
                    MINUTE *
                    recipe.amount) /
                    recipe.seconds,
                ),
              )}
            </span>
          </Fact>
          <Fact label={HUD.utilisation}>{percent(prod.efficiency)}</Fact>
          <Bar value={prod.efficiency} />
        </>
      )}
      {def.workers !== null && (
        <Fact label={HUD.employed}>
          {HUD.workersOf(def.workers.count, TIER_NAMES[def.workers.tier])} (
          {percent(Math.min(1, labour))})
        </Fact>
      )}
      {house !== null && (
        <>
          <Fact label={T.residents}>
            <span data-testid="imp-residents">{house.residents}</span>/
            {TIERS[house.tier].capacity}
          </Fact>
          <Fact
            label={T.satisfaction}
            tone={house.satisfaction < LOW_MOOD ? "bad" : "good"}
          >
            {percent(house.satisfaction)}
          </Fact>
          <Fact label={HUD.supplyStatus}>
            {house.needs.filter((value) => value >= MET).length} /{" "}
            {house.needs.length}
          </Fact>
        </>
      )}
      {beauty !== undefined && (
        <>
          <Fact label={HUD.beauty}>
            {HUD.decorEffect(Math.round(beauty * PERCENT), def.radius)}
          </Fact>
          <Fact label={HUD.tabResidents}>
            {HUD.housesInReach(housesInReach(game, building))}
          </Fact>
        </>
      )}
      {def.guns !== null && (
        <p className="text-xs">
          {T.guns(def.guns.damage, def.guns.range, def.guns.reload)} -{" "}
          {T.armour(Math.round(def.armour * PERCENT))}
        </p>
      )}
      {def.science > 0 && (
        <Fact label={HUD.scholars}>{HUD.scholarsValue(def.science)}</Fact>
      )}
    </div>
  );
}

/** Houses of the same island in a decoration's reach. */
function housesInReach(game: Game, decor: Building): number {
  const grid = game.coverage[decor.kind];
  const n = game.world.n;
  return game.buildings.filter(
    (b) =>
      b.house !== null &&
      b.island === decor.island &&
      grid?.[centerTile(b, n)] === 1,
  ).length;
}

/** Inputs, product, cycle, speed and the switches of a producer. */
function ProductionTab({
  game,
  building,
  onCommand,
}: {
  readonly game: Game;
  readonly building: Building;
  readonly onCommand: (command: Command) => boolean;
}): ReactElement {
  const def = BUILDING[building.kind];
  const recipe = def.recipe;
  const prod = building.prod;
  let content: ReactElement = <></>;
  if (recipe !== null && prod !== null) {
    const speed = speedOf(game, building);
    const cycles = (prod.efficiency * speed * MINUTE) / recipe.seconds;
    content = (
      <div className="flex flex-col gap-1" data-testid="imp-producer">
        <Section>{HUD.inputs}</Section>
        {recipe.inputs.length === 0 && (
          <p className="imp-muted text-xs">{T.none}</p>
        )}
        {recipe.inputs.map((input) => (
          <GoodRow
            key={input.good}
            good={input.good}
            have={prod.input[input.good] ?? 0}
            room={INPUT_CAPACITY}
            rate={cycles * input.amount}
            sign="-"
          />
        ))}
        <Section>{HUD.products}</Section>
        <GoodRow
          good={recipe.output}
          have={prod.output}
          room={OUTPUT_CAPACITY}
          rate={cycles * recipe.amount}
          sign="+"
        />
        <Fact label={HUD.duration}>
          {HUD.perCycle(recipe.amount, recipe.seconds)}
        </Fact>
        <Fact label={HUD.speed}>{percent(speed)}</Fact>
        <Fact label={HUD.storeRoom}>
          {HUD.storeRoomValue(INPUT_CAPACITY, OUTPUT_CAPACITY)}
        </Fact>
        <Fact label={T.status}>{STATUS_TEXTS[prod.status]}</Fact>
        <Fact label={T.produced}>{prod.made}</Fact>
        <div className="mt-2 flex flex-wrap gap-1">
          <Btn
            small
            icon={building.paused ? "play" : "stop"}
            active={!building.paused}
            tip={building.paused ? HUD.start : HUD.stop}
            onClick={() =>
              onCommand({
                type: "pause",
                id: building.id,
                paused: !building.paused,
              })
            }
            testId="imp-production-toggle"
          >
            {building.paused ? HUD.stopped : HUD.active}
          </Btn>
          <Btn
            small
            icon="star"
            active={building.priority}
            tip={HUD.priorityTip}
            onClick={() =>
              onCommand({
                type: "priority",
                id: building.id,
                priority: !building.priority,
              })
            }
            testId="imp-priority"
          >
            {building.priority ? HUD.priorityOn : HUD.priorityOff}
          </Btn>
        </div>
      </div>
    );
  }
  return content;
}

/** The traffic light of a producer: green road, yellow open land, red no way. */
function LinkLight({
  game,
  building,
}: {
  readonly game: Game;
  readonly building: Building;
}): ReactElement {
  const kind = linkKind(game, building);
  return (
    <span
      className={`mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle ring-1 ring-black/40 ${LINK_TONES[kind]}`}
      data-tip={`${HUD.link}: ${HUD.linkNames[kind]}
${HUD.linkTips[kind]}`}
      data-testid="imp-link-light"
      data-link={kind}
      aria-label={`${HUD.link}: ${HUD.linkNames[kind]}`}
    />
  );
}

/**
 * How the goods of a producer travel: its traffic light, what it makes, its
 * own store of inputs and goods, the carts, the way to its store and how
 * fast carts go there.
 */
function LogisticsTab({
  game,
  building,
}: {
  readonly game: Game;
  readonly building: Building;
}): ReactElement {
  const recipe = BUILDING[building.kind].recipe;
  const prod = building.prod;
  const kind = linkKind(game, building);
  const link = game.links.get(building.id);
  const store = game.buildings.find((b) => b.id === link?.warehouse);
  let content: ReactElement = <></>;
  if (recipe !== null && prod !== null) {
    const rate =
      (prod.efficiency * speedOf(game, building) * MINUTE * recipe.amount) /
      recipe.seconds;
    const speed =
      link === undefined ? 0 : link.path.length / Math.max(TINY, link.seconds);
    content = (
      <div className="flex flex-col gap-1" data-testid="imp-logistics">
        <Fact label={HUD.link} tip={HUD.linkTips[kind]} testId="imp-link">
          <LinkLight game={game} building={building} />
          {HUD.linkNames[kind]}
        </Fact>
        <Fact label={HUD.currentOutput}>
          <span className="inline-flex items-center gap-1">
            <GoodIcon good={recipe.output} size={14} />
            {HUD.perMinute(rateText(rate))}
          </span>
        </Fact>
        <Section>{HUD.localStock}</Section>
        {recipe.inputs.map((input) => (
          <Fact key={input.good} label={GOOD_NAMES[input.good]}>
            {Math.floor(prod.input[input.good] ?? 0)}/{INPUT_CAPACITY}
          </Fact>
        ))}
        <Fact label={GOOD_NAMES[recipe.output]}>
          {Math.floor(prod.output)}/{OUTPUT_CAPACITY}
        </Fact>
        <Section>{HUD.transport}</Section>
        <Fact label={T.status} testId="imp-transport">
          {HUD.transportStates[transportState(game, building)]}
        </Fact>
        <Fact
          label={HUD.storeDistance}
          tip={
            store === undefined
              ? undefined
              : HUD.servedBy(BUILDING_NAMES[store.kind])
          }
        >
          {link === undefined
            ? "-"
            : HUD.storeDistanceValue(
                link.path.length,
                Number(link.seconds.toFixed(DECIMALS)),
              )}
        </Fact>
        <Fact label={HUD.cartSpeed}>
          {link === undefined
            ? "-"
            : HUD.cartSpeedValue(
                Number(speed.toFixed(DECIMALS)),
                Math.round((speed / CART_SPEED) * PERCENT),
              )}
        </Fact>
        <Fact label={HUD.roadAccess}>
          {roadAccess(game, building).length > 0 ? HUD.yes : HUD.no}
        </Fact>
      </div>
    );
  }
  return content;
}

/** One good of a producer: stock in the building and the flow. */
function GoodRow({
  good,
  have,
  room,
  rate,
  sign,
}: {
  readonly good: GoodId;
  readonly have: number;
  readonly room: number;
  readonly rate: number;
  readonly sign: "+" | "-";
}): ReactElement {
  return (
    <div className="grid grid-cols-[1fr_4.5rem_3.5rem] items-center gap-2 text-xs">
      <span className="inline-flex items-center gap-1">
        <GoodIcon good={good} size={16} />
        {GOOD_NAMES[good]}
      </span>
      <Bar value={have / room} color="bg-[var(--imp-brass-hi)]" />
      <span className="text-right tabular-nums">
        {Math.floor(have)}/{room}
        <span
          className={`block text-[10px] ${sign === "+" ? "text-[var(--imp-good)]" : "text-[var(--imp-bad)]"}`}
        >
          {sign}
          {rateText(rate)}
          {T.perMinute}
        </span>
      </span>
    </div>
  );
}

/** The goods on an island, for a kontor or a warehouse. */
function StockTab({
  game,
  island,
}: {
  readonly game: Game;
  readonly island: number;
}): ReactElement {
  const stock = game.islands[island].stock;
  const room = capacityOf(game, island);
  return (
    <div>
      <p className="imp-muted mb-1 text-xs">
        {T.capacity}: {room}
      </p>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {GOOD_IDS.filter((good) => stock[good] >= 1).map((good) => (
          <li
            key={good}
            className="flex items-center gap-1"
            data-tip={`${GOOD_NAMES[good]}\n${HUD.stockLine(Math.floor(stock[good]), room)}`}
          >
            <GoodIcon good={good} size={14} />
            <span className="min-w-0 flex-1 truncate">{GOOD_NAMES[good]}</span>
            <span
              className={`tabular-nums ${stock[good] >= room ? "text-[var(--imp-warn)]" : ""}`}
            >
              {game.cheat ? T.endless : Math.floor(stock[good])}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The workers a producer needs and has. */
function WorkersTab({
  game,
  building,
}: {
  readonly game: Game;
  readonly building: Building;
}): ReactElement {
  const def = BUILDING[building.kind];
  const workers = def.workers;
  const share =
    workers === null ? 1 : (game.labour[building.island]?.[workers.tier] ?? 0);
  return workers === null ? (
    <p className="imp-muted text-xs">{HUD.noWorkersNeeded}</p>
  ) : (
    <div className="flex flex-col gap-1">
      <Fact label={T.workers}>
        {HUD.workersOf(workers.count, TIER_NAMES[workers.tier])}
      </Fact>
      <Fact label={HUD.staffed} tone={share < 1 ? "warn" : "good"}>
        {percent(Math.min(1, share))}
      </Fact>
      <Bar value={share} color="bg-[#7fb3d5]" />
      {def.science > 0 && (
        <Fact label={HUD.scholars}>{HUD.scholarsValue(def.science)}</Fact>
      )}
    </div>
  );
}

/** A house's residents, mood and needs. */
function HouseTab({
  game,
  building,
}: {
  readonly game: Game;
  readonly building: Building;
}): ReactElement {
  const house = building.house as NonNullable<Building["house"]>;
  const tier = TIERS[house.tier];
  const names = [
    ...tier.goods.map((want) => ({
      key: want.good,
      name: GOOD_NAMES[want.good],
      good: want.good,
    })),
    ...tier.services.map((service) => ({
      key: service,
      name: BUILDING_NAMES[service],
      good: null,
    })),
  ];
  const beauty = beautyAt(game, centerTile(building, game.world.n));
  return (
    <div className="flex flex-col gap-1" data-testid="imp-house">
      <Fact label={T.residents}>
        {house.residents}/{tier.capacity} {TIER_NAMES[house.tier]}
      </Fact>
      <Fact
        label={T.satisfaction}
        tone={house.satisfaction < LOW_MOOD ? "bad" : "good"}
      >
        {percent(house.satisfaction)}
      </Fact>
      <Bar
        value={house.satisfaction}
        color={
          house.satisfaction < LOW_MOOD
            ? "bg-[var(--imp-bad)]"
            : "bg-[var(--imp-good)]"
        }
      />
      <Fact label={HUD.beauty}>
        {beauty > 0
          ? HUD.beautyValue(Math.round(beauty * PERCENT))
          : HUD.beautyNone}
      </Fact>
      <Section>{T.needs}</Section>
      <ul className="flex flex-col gap-1 text-xs">
        {names.map((need, index) => (
          <li
            key={need.key}
            className="grid grid-cols-[1fr_5rem] items-center gap-2"
          >
            <span className="inline-flex items-center gap-1">
              {need.good !== null ? (
                <GoodIcon good={need.good} size={14} />
              ) : (
                <Icon name="townhall" size={14} className="imp-muted" />
              )}
              {need.name}
            </span>
            <Bar
              value={house.needs[index] ?? 0}
              color={
                (house.needs[index] ?? 0) >= MET
                  ? "bg-[var(--imp-good)]"
                  : "bg-[var(--imp-warn)]"
              }
            />
          </li>
        ))}
      </ul>
      {house.blocked !== "none" && (
        <p className="imp-muted text-xs">{BLOCKED_TEXTS[house.blocked]}</p>
      )}
      {house.tier + 1 < TIERS.length &&
        Object.keys(TIERS[house.tier + 1].upgradeCost).length > 0 && (
          <p className="imp-muted text-xs">
            {TIER_NAMES[house.tier + 1]}:{" "}
            <CostLine
              cost={TIERS[house.tier + 1].upgradeCost}
              stock={game.islands[building.island].stock}
            />
          </p>
        )}
    </div>
  );
}

/** What a building costs and brings. */
function FinanceTab({
  game,
  building,
}: {
  readonly game: Game;
  readonly building: Building;
}): ReactElement {
  const def = BUILDING[building.kind];
  const owner = game.players[HUMAN];
  const back: Amounts = {};
  for (const [good, amount] of Object.entries(def.cost)) {
    if (good !== "gold") {
      back[good as GoodId] = Math.floor((amount as number) * REFUND);
    }
  }
  return (
    <div className="flex flex-col gap-1">
      <Fact label={HUD.upkeepNow}>
        {rateText(upkeepOf(building))}
        {T.perMinute}
      </Fact>
      <Fact label={T.upkeep}>
        {def.upkeep}
        {T.perMinute}
      </Fact>
      {building.paused && (
        <p className="imp-muted text-xs">{HUD.upkeepPaused}</p>
      )}
      {building.house !== null && (
        <Fact label={HUD.taxes} tone="good">
          +{rateText(houseTax(owner, building.house))}
          {T.perMinute}
        </Fact>
      )}
      <Fact label={HUD.buildCost}>
        <CostLine cost={def.cost} />
      </Fact>
      <Fact label={HUD.refund}>
        {Object.keys(back).length > 0 ? <CostLine cost={back} /> : T.none}
      </Fact>
    </div>
  );
}

/** The second stage of a building. */
function ExtensionsTab({
  game,
  building,
  onCommand,
}: {
  readonly game: Game;
  readonly building: Building;
  readonly onCommand: (command: Command) => boolean;
}): ReactElement {
  const stock = game.islands[building.island].stock;
  return (
    <div className="flex flex-col gap-2">
      {LEVEL_KINDS.includes(building.kind) && (
        <div className="text-xs" data-testid="imp-level">
          <Section>{HUD.levelTitle}</Section>
          <p>
            {T.stage}: <b>{T.stageName(building.level)}</b>
          </p>
          {building.level === 0 ? (
            <div className="mt-1 flex flex-col gap-1">
              <CostLine
                cost={{ gold: levelGold(building.kind), ...LEVEL_COST }}
                stock={stock}
                gold={game.players[HUMAN].gold}
              />
              <span className="imp-muted">{T.levelEffect}</span>
              <Btn
                small
                icon="arrowUp"
                disabled={!building.complete}
                onClick={() => onCommand({ type: "levelUp", id: building.id })}
                testId="imp-level-up-tab"
              >
                {T.levelUp}
              </Btn>
            </div>
          ) : (
            <p className="imp-muted">{HUD.levelMax}</p>
          )}
        </div>
      )}
      {!building.complete && (
        <p className="imp-muted text-xs">{REFUSAL_TEXTS.notComplete}</p>
      )}
    </div>
  );
}

/** What can be seen of another player's building. */
function ForeignOverview({
  game,
  building,
}: {
  readonly game: Game;
  readonly building: Building;
}): ReactElement {
  const def = BUILDING[building.kind];
  const owner = playerById(game, game.islands[building.island].owner);
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs">{T.foreignBuilding(owner?.name ?? "")}</p>
      <Health hp={building.hp} max={def.hp} />
      {def.guns !== null && (
        <p className="text-xs">
          {T.guns(def.guns.damage, def.guns.range, def.guns.reload)}
        </p>
      )}
      {DECOR_KINDS.includes(building.kind) && (
        <p className="imp-muted text-xs">{BUILDING_INFO[building.kind]}</p>
      )}
    </div>
  );
}

/** A ship's window: own ships with all tabs, others with what can be seen. */
function ShipWindow({
  game,
  ship,
  onCommand,
  onTool,
  onClose,
}: InfoPanelProps & { readonly ship: Ship }): ReactElement {
  const def = SHIP[ship.kind];
  const own = ship.owner === HUMAN;
  const owner = playerById(game, ship.owner);
  const kontor = game.buildings.find((b) => b.id === ship.docked);
  const tabs: TabDef<Tab>[] = [{ id: "overview", label: HUD.tabOverview }];
  if (own) {
    tabs.push(
      { id: "orders", label: MIL.commands },
      { id: "cargo", label: HUD.tabCargo },
      { id: "route", label: HUD.tabRoute },
    );
    if (def.troops > 0) {
      tabs.push({ id: "troops", label: HUD.tabTroops });
    }
  }
  const [tab, setTab] = useState<Tab>("overview");
  const shown = tabs.some((item) => item.id === tab) ? tab : "overview";
  const state =
    kontor !== undefined
      ? T.docked(game.world.islands[kontor.island].name)
      : ship.stuck
        ? T.stuck
        : T.atSea;
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
  const offer = own ? settleOffer(game, ship) : null;
  const settle = offer?.command ?? null;
  const overview = (
    <div className="flex flex-col gap-1">
      {offer !== null && (
        <div
          className="imp-guide mb-1 flex flex-col gap-1.5 p-2 text-xs"
          data-testid="imp-settle-offer"
        >
          <p className="flex items-center gap-1.5">
            <Icon name="anchor" size={14} className="imp-gold shrink-0" />
            {TUTORIAL.settleOffer(game.world.islands[offer.island].name)}
          </p>
          <Btn
            icon="anchor"
            className="imp-btn-primary w-full"
            disabled={settle === null}
            tip={
              offer.reason ??
              TUTORIAL.settleTip(game.world.islands[offer.island].name)
            }
            onClick={() => {
              if (settle !== null) {
                onCommand(settle);
              }
            }}
            testId="imp-settle"
          >
            {TUTORIAL.settle}
          </Btn>
          {offer.reason !== null && (
            <p className="text-[11px] text-[var(--imp-warn)]">{offer.reason}</p>
          )}
        </div>
      )}
      <div className="flex justify-center">
        <ShipArt kind={ship.kind} size={96} />
      </div>
      <Fact label={HUD.shipType}>{SHIP_NAMES[ship.kind]}</Fact>
      <Fact label={HUD.shipStatus}>{state}</Fact>
      <Fact label={MIL.task}>{shipTask(game, ship)}</Fact>
      <Fact label={MIL.owner}>
        {owner?.name ??
          (ship.owner === PIRATES ? T.pirates : SHIP_NAMES.trader)}
      </Fact>
      <Fact label={MIL.position}>
        {Math.floor(ship.x)}, {Math.floor(ship.y)}
      </Fact>
      <Fact label={MIL.stats.speed}>{MIL.perSecond(def.speed)}</Fact>
      <Health hp={ship.hp} max={def.hp} />
      {own && kontor !== undefined && (
        <KontorKit game={game} ship={ship} onCommand={onCommand} />
      )}
      {own && (
        <>
          <Fact label={HUD.hold}>
            {HUD.holdValue(used, def.slots * def.slotSize)}
          </Fact>
          <Fact label={T.route}>{route?.name ?? HUD.routeNone}</Fact>
          <Fact label={HUD.crew}>{def.crew}</Fact>
          <Fact label={HUD.shipUpkeep}>
            {def.upkeep}
            {T.perMinute}
          </Fact>
        </>
      )}
      {def.guns !== null && (
        <p className="text-xs">
          {T.guns(def.guns.damage, def.guns.range, def.guns.reload)} -{" "}
          {T.armour(Math.round(def.armour * PERCENT))}
          {own && <span className="imp-muted block">{T.warHint}</span>}
        </p>
      )}
      {own && ship.hp < def.hp && (
        <p className="imp-muted text-xs" data-testid="imp-repair">
          {atOwnYard(game, ship)
            ? T.repairingYard(SHIP_REPAIR_GOLD)
            : kontor !== undefined
              ? T.repairing(SHIP_REPAIR_GOLD)
              : T.repairHint}
        </p>
      )}
    </div>
  );
  const body: Partial<Record<Tab, ReactNode>> = {
    overview,
    orders: (
      <ShipOrders
        game={game}
        ship={ship}
        onCommand={onCommand}
        onTool={onTool}
      />
    ),
    cargo: <ShipCargo game={game} ship={ship} onCommand={onCommand} />,
    route: <ShipRoute game={game} ship={ship} onCommand={onCommand} />,
    troops: <ShipTroops game={game} ship={ship} onCommand={onCommand} />,
  };
  return (
    <ObjectFrame
      art={
        <span className="imp-medal h-14 w-14">
          <Icon
            name={def.guns !== null ? "cannon" : "ship"}
            size={30}
            className="imp-gold"
          />
        </span>
      }
      title={ship.name !== "" ? ship.name : SHIP_NAMES[ship.kind]}
      subtitle={`${SHIP_NAMES[ship.kind]}${own ? "" : ` - ${HUD.foreign}`}`}
      status={<span className="imp-muted">{state}</span>}
      tabs={tabs}
      tab={shown}
      onTab={setTab}
      onClose={onClose}
      testId={own ? "imp-ship" : "imp-ship-foreign"}
      actions={
        own ? (
          <Btn
            small
            icon="ship"
            tip={T.hintSail(true)}
            onClick={() => onTool({ type: "sail", ship: ship.id })}
            testId="imp-sail"
          >
            {T.sailTo}
          </Btn>
        ) : undefined
      }
    >
      {body[shown]}
    </ObjectFrame>
  );
}

/**
 * Loading what a kontor on a new island takes, at an own kontor: one click
 * moves what the hold still lacks from the kontor's stores aboard.
 */
function KontorKit({
  game,
  ship,
  onCommand,
}: {
  readonly game: Game;
  readonly ship: Ship;
  readonly onCommand: (command: Command) => boolean;
}): ReactElement {
  const kontor = game.buildings.find((b) => b.id === ship.docked);
  const stock = kontor === undefined ? null : game.islands[kontor.island].stock;
  const missing = kontorShortfall(ship);
  const lacking = Object.keys(missing).length > 0;
  const short =
    stock === null
      ? missing
      : (Object.fromEntries(
          (Object.entries(missing) as [GoodId, number][])
            .filter(([good, amount]) => stock[good] < amount)
            .map(([good, amount]) => [good, amount - Math.floor(stock[good])]),
        ) as Amounts);
  const room = (Object.entries(missing) as [GoodId, number][]).every(
    ([good, amount]) => roomFor(ship, good) >= amount,
  );
  const reason = !lacking
    ? MIL.loadKontorHave
    : Object.keys(short).length > 0
      ? MIL.loadKontorShort(amountWords(short))
      : !room
        ? MIL.loadKontorRoom
        : null;
  return (
    <div
      className="imp-card flex flex-col gap-1 text-xs"
      data-testid="imp-kontor-kit"
    >
      <Btn
        small
        icon="crate"
        disabled={reason !== null}
        tip={MIL.loadKontorTip(amountWords(KONTOR_KIT))}
        onClick={() => {
          for (const [good, amount] of Object.entries(missing) as [
            GoodId,
            number,
          ][]) {
            onCommand({ type: "transfer", ship: ship.id, good, amount });
          }
        }}
        testId="imp-load-kontor"
      >
        {MIL.loadKontor}
      </Btn>
      {reason !== null && (
        <span className={lacking ? "text-[var(--imp-warn)]" : "imp-muted"}>
          {reason}
        </span>
      )}
    </div>
  );
}

/** A ship's hold, and the kontor's goods to load while docked. */
function ShipCargo({
  game,
  ship,
  onCommand,
}: {
  readonly game: Game;
  readonly ship: Ship;
  readonly onCommand: (command: Command) => boolean;
}): ReactElement {
  const kontor = game.buildings.find((b) => b.id === ship.docked);
  const stock = kontor === undefined ? null : game.islands[kontor.island].stock;
  const cargo = Object.entries(ship.cargo).filter(
    ([, amount]) => (amount ?? 0) > 0,
  ) as [GoodId, number][];
  return (
    <div className="flex flex-col gap-2">
      <div>
        <Section>{T.cargo}</Section>
        {cargo.length === 0 ? (
          <p className="imp-muted text-xs">{T.emptyCargo}</p>
        ) : (
          <ul className="flex flex-col gap-1 text-xs" data-testid="imp-cargo">
            {cargo.map(([good, amount]) => (
              <li
                key={good}
                className="flex items-center justify-between gap-2"
              >
                <span className="inline-flex items-center gap-1">
                  <GoodIcon good={good} size={14} />
                  {GOOD_NAMES[good]} {Math.floor(amount)}
                </span>
                {stock !== null && (
                  <Btn
                    small
                    onClick={() =>
                      onCommand({
                        type: "transfer",
                        ship: ship.id,
                        good,
                        amount: -STEP,
                      })
                    }
                  >
                    {T.unloadTen}
                  </Btn>
                )}
              </li>
            ))}
          </ul>
        )}
        {stock !== null && cargo.length > 0 && (
          <Btn
            small
            className="mt-1"
            onClick={() => {
              for (const [good, amount] of cargo) {
                onCommand({
                  type: "transfer",
                  ship: ship.id,
                  good,
                  amount: -amount,
                });
              }
            }}
            testId="imp-unload-all"
          >
            {T.unloadAll}
          </Btn>
        )}
      </div>
      {stock !== null && kontor !== undefined && (
        <div>
          <Section>
            {T.stock} {game.world.islands[kontor.island].name}
          </Section>
          <ul
            className="grid grid-cols-2 gap-1 text-xs"
            data-testid="imp-ship-load"
          >
            {GOOD_IDS.filter((good) => stock[good] >= 1).map((good) => (
              <li
                key={good}
                className="flex items-center justify-between gap-1"
              >
                <span
                  className="inline-flex items-center gap-1"
                  data-tip={GOOD_NAMES[good]}
                >
                  <GoodIcon good={good} size={14} />
                  {Math.floor(stock[good])}
                </span>
                <Btn
                  small
                  disabled={roomFor(ship, good) < 1}
                  onClick={() =>
                    onCommand({
                      type: "transfer",
                      ship: ship.id,
                      good,
                      amount: STEP,
                    })
                  }
                  testId={`imp-load-${good}`}
                >
                  {T.loadTen}
                </Btn>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Which trade route a ship sails. */
function ShipRoute({
  game,
  ship,
  onCommand,
}: {
  readonly game: Game;
  readonly ship: Ship;
  readonly onCommand: (command: Command) => boolean;
}): ReactElement {
  const routeId = ship.order.type === "route" ? ship.order.route : null;
  const route = game.routes.find((r) => r.id === routeId);
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm">
        {T.route}
        <select
          data-testid="imp-ship-route"
          value={routeId === null ? "" : String(routeId)}
          onChange={(event) =>
            onCommand({
              type: "assign",
              ship: ship.id,
              route:
                event.target.value === "" ? null : Number(event.target.value),
            })
          }
          className="imp-input mt-1 w-full py-1"
        >
          <option value="">{T.noRoute}</option>
          {game.routes
            .filter((r) => r.owner === HUMAN)
            .map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
        </select>
      </label>
      {route !== undefined && (
        <ol className="flex flex-col gap-1 text-xs">
          {route.stops.map((stop, index) => (
            <li key={index} className="imp-card">
              <b>
                {T.stop} {index + 1}: {game.world.islands[stop.island].name}
              </b>
              <span className="imp-muted block">
                {stop.actions
                  .map(
                    (action) =>
                      `${GOOD_NAMES[action.good]} ${action.mode === "load" ? T.loadMode : T.unloadMode} ${action.amount}`,
                  )
                  .join(", ") || T.none}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Soldiers aboard a ship: boarding at a kontor and landing elsewhere. */
function ShipTroops({
  game,
  ship,
  onCommand,
}: {
  readonly game: Game;
  readonly ship: Ship;
  readonly onCommand: (command: Command) => boolean;
}): ReactElement {
  const def = SHIP[ship.kind];
  const count = aboard(game, ship);
  // Any coast will do: the ship need not lie at a kontor.
  const shore = shoreIslandOf(game, ship);
  const waiting = boardingSoldiers(game, HUMAN, ship, null).length;
  // Soldiers may be set down on any island; the nearest come first.
  const targets = game.world.islands
    .map((info) => ({
      id: info.id,
      distance: Math.hypot(info.cx - ship.x, info.cy - ship.y),
    }))
    .sort((a, b) => a.distance - b.distance)
    .map((entry) => entry.id);
  const [chosen, setChosen] = useState(targets[0] ?? -1);
  const island = targets.includes(chosen) ? chosen : (targets[0] ?? -1);
  const owner = game.islands[island]?.owner ?? -1;
  const holder = playerById(game, owner);
  const enemy = owner >= 0 && hostile(game, HUMAN, owner);
  const peaceful = owner >= 0 && owner !== HUMAN && !enemy;
  return (
    <div className="flex flex-col gap-1" data-testid="imp-ship-troops">
      <Fact label={T.troops}>
        <span data-testid="imp-troops-aboard">{count}</span>/{def.troops}
      </Fact>
      {shore >= 0 ? (
        <Btn
          small
          icon="people"
          disabled={waiting === 0 || count >= def.troops}
          onClick={() => onCommand({ type: "embark", ship: ship.id })}
          testId="imp-embark"
        >
          {T.embark(Math.min(waiting, def.troops - count))}
        </Btn>
      ) : (
        <p className="imp-muted text-xs" data-testid="imp-embark-hint">
          {T.embarkHint}
        </p>
      )}
      {count > 0 && island >= 0 && (
        <div className="flex flex-col gap-1">
          <select
            value={island}
            onChange={(event) => setChosen(Number(event.target.value))}
            className="imp-input"
            data-testid="imp-land-island"
          >
            {targets.map((id) => {
              const who = playerById(game, game.islands[id].owner);
              return (
                <option key={id} value={id}>
                  {game.world.islands[id].name} -{" "}
                  {who === null ? T.landFree : who.name}
                </option>
              );
            })}
          </select>
          <Btn
            small
            danger={enemy || peaceful}
            onClick={() => onCommand({ type: "land", ship: ship.id, island })}
            testId="imp-land"
          >
            {enemy
              ? T.landAttack(game.world.islands[island].name)
              : T.landHome(game.world.islands[island].name)}
          </Btn>
          {peaceful && holder !== null && (
            <p className="text-xs text-[var(--imp-warn)]">
              {T.landRivalWarning(holder.name)}
            </p>
          )}
        </div>
      )}
      {ship.order.type === "land" && (
        <p className="imp-muted text-xs">
          {T.landing(game.world.islands[ship.order.island].name)}
        </p>
      )}
    </div>
  );
}

/** A bar of hit points. */
function Health({
  hp,
  max,
}: {
  readonly hp: number;
  readonly max: number;
}): ReactElement {
  const share = Math.max(0, hp) / Math.max(1, max);
  return (
    <div className="text-xs" data-testid="imp-hp">
      <Fact label={T.hitPoints} tone={share < HALF ? "bad" : undefined}>
        {Math.round(Math.max(0, hp))} / {max}
      </Fact>
      <Bar
        value={share}
        color={share < HALF ? "bg-[var(--imp-bad)]" : "bg-[var(--imp-good)]"}
      />
    </div>
  );
}

/** A cost as words, for a tooltip. */
function costWords(cost: Amounts & { gold?: number }): string {
  return Object.entries(cost)
    .map(([good, amount]) =>
      good === "gold"
        ? `${goldText(amount as number)} Gold`
        : `${amount as number} ${GOOD_NAMES[good as GoodId]}`,
    )
    .join(", ");
}
