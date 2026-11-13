/**
 * The shipyard's window: what is on the slip and how far, the queue of paid
 * orders with cancelling, and a tile for every ship - trade and war on their
 * own tabs - with its picture, values, cost (red where short), unlock and
 * the order button, greyed out with the reason when it cannot be built.
 *
 * @module
 */
"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import { HUMAN } from "@/games/imperavis/engine/players";
import {
  launchSpot,
  shipLocked,
  shipRefund,
  yardLabour,
  yardOrders,
} from "@/games/imperavis/engine/ships";
import {
  BUILDABLE_SHIPS,
  SHIP,
  YARD_ORDERS,
} from "@/games/imperavis/engine/ships-data";
import { hasAmounts } from "@/games/imperavis/engine/placement";
import type {
  Amounts,
  Building,
  Command,
  Game,
  GoodId,
  ShipKind,
  ShipRole,
} from "@/games/imperavis/engine/types";
import {
  GOOD_NAMES,
  REFUSAL_TEXTS,
  RESEARCH_NAMES,
  SHIP_NAMES,
  TIER_NAMES,
} from "@/games/imperavis/i18n/texts";
import {
  MIL,
  ROLE_NAMES,
  SHIP_INFO,
} from "@/games/imperavis/i18n/military-texts";
import { ShipArt } from "./unit-art";
import {
  Bar,
  Btn,
  CostLine,
  Fact,
  goldText,
  percent,
  Section,
  Tabs,
  IconBtn,
} from "./ui";

/** Percent of a share. */
const PERCENT = 100;

/** Guards a division by no workers. */
const TINY = 1e-6;

/** The roles a yard builds, as its tabs. */
const ROLES: readonly Exclude<ShipRole, "other">[] = ["trade", "war"];

/**
 * Renders the shipyard's window.
 *
 * @param props - the game, the yard and the way to give commands
 * @returns the window's body
 */
export function YardPanel({
  game,
  building,
  onCommand,
}: {
  readonly game: Game;
  readonly building: Building;
  readonly onCommand: (command: Command) => boolean;
}): ReactElement {
  const [role, setRole] = useState<Exclude<ShipRole, "other">>("trade");
  const yard = building.yard as NonNullable<Building["yard"]>;
  const labour = yardLabour(game, building);
  const orders = yardOrders(building);
  return (
    <div
      className="grid grid-cols-1 gap-3 lg:grid-cols-[15rem_1fr]"
      data-testid="imp-yard"
    >
      <div className="flex flex-col gap-2 lg:sticky lg:top-0 lg:self-start">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span data-testid="imp-yard-orders">
            {MIL.orders(orders, YARD_ORDERS)}
          </span>
          <Fact label={MIL.workers} tone={labour < 1 ? "warn" : "good"}>
            {percent(labour)}
          </Fact>
        </div>
        {labour <= 0 && (
          <p
            className="text-xs text-[var(--imp-warn)]"
            data-testid="imp-yard-noworkers"
          >
            {MIL.noWorkers}
          </p>
        )}
        <Section>{MIL.slip}</Section>
        {yard.building === null ? (
          <p className="imp-muted text-xs">{MIL.queueEmpty}</p>
        ) : (
          <Slip
            game={game}
            building={building}
            labour={labour}
            onCommand={onCommand}
          />
        )}
        {yard.queue.length > 0 && (
          <>
            <Section>{MIL.queue}</Section>
            <ol
              className="flex flex-col gap-1 text-xs"
              data-testid="imp-yard-queue"
            >
              {yard.queue.map((kind, k) => (
                <li
                  key={`${kind}-${k}`}
                  className="imp-card flex items-center gap-2"
                  data-testid={`imp-yard-queue-${k + 1}`}
                >
                  <ShipArt kind={kind} size={36} />
                  <span className="min-w-0 flex-1">
                    {k + 1}. {SHIP_NAMES[kind]}
                  </span>
                  <CancelButton
                    building={building}
                    index={k + 1}
                    onCommand={onCommand}
                  />
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <Tabs
          tabs={ROLES.map((id) => ({ id, label: ROLE_NAMES[id] }))}
          value={role}
          onChange={setRole}
          testPrefix="imp-yard-tab"
        />
        <ul className="grid grid-cols-1 gap-2">
          {BUILDABLE_SHIPS.filter((kind) => SHIP[kind].role === role).map(
            (kind) => (
              <ShipTile
                key={kind}
                game={game}
                building={building}
                kind={kind}
                onCommand={onCommand}
              />
            ),
          )}
        </ul>
      </div>
    </div>
  );
}

/**
 * What of a cost a store lacks (gold is left out).
 *
 * @param stock - the goods at hand
 * @param cost - the price
 * @returns the missing goods and amounts
 */
export function shortOf(
  stock: Amounts,
  cost: Amounts & { gold?: number },
): Amounts {
  const missing: Amounts = {};
  for (const [good, amount] of Object.entries(cost) as [
    GoodId | "gold",
    number,
  ][]) {
    const lack = good === "gold" ? 0 : amount - Math.floor(stock[good] ?? 0);
    if (good !== "gold" && lack > 0) {
      missing[good] = lack;
    }
  }
  return missing;
}

/**
 * Gold and goods in words.
 *
 * @param amounts - the amounts
 * @returns e.g. "300 Gold, 12 Bretter"
 */
export function amountWords(amounts: Amounts & { gold?: number }): string {
  return (Object.entries(amounts) as [GoodId | "gold", number][])
    .filter(([, amount]) => amount > 0)
    .map(([good, amount]) =>
      good === "gold"
        ? `${goldText(amount)} Gold`
        : `${amount} ${GOOD_NAMES[good]}`,
    )
    .join(", ");
}

/** The ship on the slip: its picture, progress and the way to cancel it. */
function Slip({
  game,
  building,
  labour,
  onCommand,
}: {
  readonly game: Game;
  readonly building: Building;
  readonly labour: number;
  readonly onCommand: (command: Command) => boolean;
}): ReactElement {
  const yard = building.yard as NonNullable<Building["yard"]>;
  const kind = yard.building as ShipKind;
  const seconds = SHIP[kind].buildSeconds;
  const share = yard.progress / seconds;
  const left = Math.ceil((seconds - yard.progress) / Math.max(TINY, labour));
  const waiting = share >= 1 && launchSpot(game, building) < 0;
  return (
    <div
      className="imp-card flex flex-col gap-1 text-xs"
      data-testid="imp-yard-slip"
    >
      <div className="flex items-center gap-2">
        <ShipArt kind={kind} size={48} />
        <b className="min-w-0 flex-1">{SHIP_NAMES[kind]}</b>
        <CancelButton building={building} index={0} onCommand={onCommand} />
      </div>
      <Bar value={share} color="bg-[var(--imp-warn)]" />
      <span data-testid="imp-yard-progress">
        {waiting
          ? MIL.waiting
          : building.paused
            ? MIL.paused
            : labour > 0
              ? MIL.progress(Math.floor(share * PERCENT), left)
              : `${Math.floor(share * PERCENT)} % - ${MIL.noWorkersShort}`}
      </span>
    </div>
  );
}

/** Cancels one order, with what comes back in its tooltip. */
function CancelButton({
  building,
  index,
  onCommand,
}: {
  readonly building: Building;
  readonly index: number;
  readonly onCommand: (command: Command) => boolean;
}): ReactElement {
  const back = shipRefund(building, index);
  return (
    <IconBtn
      danger
      icon="close"
      size={22}
      tip={
        back === null
          ? MIL.cancel
          : `${MIL.cancel} - ${MIL.refund(amountWords(back))}`
      }
      onClick={() =>
        onCommand({ type: "cancelShip", yard: building.id, index })
      }
      testId={`imp-yard-cancel-${index}`}
    />
  );
}

/** One ship to order: picture, values, cost, unlock and the button. */
function ShipTile({
  game,
  building,
  kind,
  onCommand,
}: {
  readonly game: Game;
  readonly building: Building;
  readonly kind: ShipKind;
  readonly onCommand: (command: Command) => boolean;
}): ReactElement {
  const def = SHIP[kind];
  const player = game.players[HUMAN];
  const stock = game.islands[building.island].stock;
  const lock = shipLocked(game, player, kind);
  const missing = shortOf(stock, def.cost);
  const reason =
    lock !== null
      ? REFUSAL_TEXTS[lock]
      : yardOrders(building) >= YARD_ORDERS
        ? REFUSAL_TEXTS.busy
        : player.gold < def.cost.gold
          ? REFUSAL_TEXTS.gold
          : !hasAmounts(stock, def.cost)
            ? REFUSAL_TEXTS.materials
            : null;
  const guns = def.guns;
  return (
    <li
      className={`imp-card flex flex-col gap-1 text-xs ${reason !== null ? "opacity-60" : ""}`}
      data-testid={`imp-yard-ship-${kind}`}
      data-buildable={reason === null ? "yes" : "no"}
    >
      <div className="flex items-start gap-2">
        <ShipArt kind={kind} size={64} />
        <div className="min-w-0 flex-1">
          <b className="text-sm">{SHIP_NAMES[kind]}</b>
          <p className="imp-muted leading-snug">{SHIP_INFO[kind]}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <Stat label={MIL.stats.speed}>{MIL.perSecond(def.speed)}</Stat>
        <Stat label={MIL.stats.hold}>
          {MIL.holdValue(def.slots, def.slotSize)}
        </Stat>
        <Stat label={MIL.stats.hp}>{def.hp}</Stat>
        <Stat label={MIL.stats.armour}>
          {MIL.percent(Math.round(def.armour * PERCENT))}
        </Stat>
        <Stat label={MIL.stats.guns}>
          {guns === null ? MIL.noGuns : def.cannons}
        </Stat>
        {guns !== null && (
          <>
            <Stat label={MIL.stats.damage}>{guns.damage}</Stat>
            <Stat label={MIL.stats.range}>{guns.range}</Stat>
            <Stat label={MIL.stats.reload}>{MIL.seconds(guns.reload)}</Stat>
          </>
        )}
        <Stat label={MIL.stats.troops}>{def.troops}</Stat>
        <Stat label={MIL.stats.crew}>{def.crew}</Stat>
        <Stat label={MIL.stats.upkeep}>{def.upkeep}/Min</Stat>
        <Stat label={MIL.buildTime}>{MIL.seconds(def.buildSeconds)}</Stat>
      </dl>
      <Fact label={MIL.cost}>
        <CostLine cost={def.cost} stock={stock} gold={player.gold} />
      </Fact>
      <Fact label={MIL.unlock} tone={lock !== null ? "bad" : undefined}>
        {[
          MIL.unlockTier(TIER_NAMES[def.tier]),
          ...(def.research === null
            ? []
            : [MIL.unlockResearch(RESEARCH_NAMES[def.research])]),
        ].join(", ")}
      </Fact>
      {Object.keys(missing).length > 0 && (
        <p
          className="text-[var(--imp-bad)]"
          data-testid={`imp-yard-missing-${kind}`}
        >
          {MIL.missing}: {amountWords(missing)}
        </p>
      )}
      <Btn
        small
        icon="ship"
        disabled={reason !== null}
        tip={reason ?? MIL.order}
        onClick={() =>
          onCommand({ type: "buildShip", yard: building.id, kind })
        }
        testId={`imp-build-ship-${kind}`}
      >
        {MIL.order}
      </Btn>
      {reason !== null && <span className="imp-muted">{reason}</span>}
    </li>
  );
}

/** One value of a ship. */
function Stat({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="flex justify-between gap-1">
      <dt className="imp-muted">{label}</dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  );
}
