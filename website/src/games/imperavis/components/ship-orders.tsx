/**
 * The orders of ships and land units in the object window: for a trade ship
 * moving, loading, unloading and its trade route; for a war ship moving,
 * attacking, patrolling, escorting and fleets; for land units their kinds,
 * formation, holding, falling back and patrols. Every button sends one of
 * the engine's commands.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import { CHASE_RANGE, hostile } from "@/games/imperavis/engine/combat";
import { fleetOfShip } from "@/games/imperavis/engine/fleets";
import { HUMAN, ownerOf } from "@/games/imperavis/engine/players";
import { SHIP } from "@/games/imperavis/engine/ships-data";
import { UNIT_KINDS } from "@/games/imperavis/engine/units-data";
import type {
  Command,
  Formation,
  Game,
  RouteStop,
  Ship,
} from "@/games/imperavis/engine/types";
import {
  BUILDING_NAMES,
  SHIP_NAMES,
  TEXTS as T,
} from "@/games/imperavis/i18n/texts";
import {
  FORMATION_NAMES,
  FORMATION_TIPS,
  MIL,
  UNIT_NAMES,
} from "@/games/imperavis/i18n/military-texts";
import type { Tool } from "@/games/imperavis/render/view";
import { UnitArt } from "./unit-art";
import { Btn, Fact, Section } from "./ui";

/** Targets offered in the attack list at most. */
const MOST_TARGETS = 4;

/** Own ships offered for an escort at most. */
const MOST_CHARGES = 5;

/** Units a new route moves per stop. */
const ROUTE_AMOUNT = 20;

/** The formations, in the order of their buttons. */
const FORMATIONS: readonly Formation[] = ["line", "block", "loose"];

/**
 * What a ship is doing, in words.
 *
 * @param game - the game
 * @param ship - the ship
 * @returns the task
 */
export function shipTask(game: Game, ship: Ship): string {
  const order = ship.order;
  let text: string = MIL.taskNames[order.type];
  if (order.type === "attack") {
    const name = order.building
      ? BUILDING_NAMES[
          game.buildings.find((b) => b.id === order.target)?.kind ?? "kontor"
        ]
      : (game.ships.find((s) => s.id === order.target)?.name ?? "");
    text = MIL.attackTarget(name);
  } else if (order.type === "escort") {
    text = MIL.escortTarget(
      game.ships.find((s) => s.id === order.ship)?.name ?? "",
    );
  } else if (order.type === "route") {
    text = `${text}: ${game.routes.find((r) => r.id === order.route)?.name ?? ""}`;
  }
  return text;
}

/**
 * The commands of an own ship: by its role, trade or war.
 *
 * @param props - game, ship and the ways to command and to pick a tool
 * @returns the block of buttons
 */
export function ShipOrders({
  game,
  ship,
  onCommand,
  onTool,
}: {
  readonly game: Game;
  readonly ship: Ship;
  readonly onCommand: (command: Command) => boolean;
  readonly onTool: (tool: Tool) => void;
}): ReactElement {
  const def = SHIP[ship.kind];
  const fleet = fleetOfShip(game, ship);
  return (
    <div className="flex flex-col gap-2 text-xs" data-testid="imp-ship-orders">
      <Fact label={MIL.task}>
        <span data-testid="imp-ship-task">{shipTask(game, ship)}</span>
      </Fact>
      <Fact label={MIL.fleet}>{fleet?.name ?? MIL.noFleet}</Fact>
      <div className="flex flex-wrap gap-1">
        <Btn
          small
          icon="ship"
          tip={MIL.moveTip}
          onClick={() => onTool({ type: "sail", ship: ship.id })}
          testId="imp-order-move"
        >
          {MIL.move}
        </Btn>
        {ship.order.type !== "idle" && (
          <Btn
            small
            icon="stop"
            onClick={() =>
              onCommand({
                type: "moveShip",
                ship: ship.id,
                x: Math.floor(ship.x),
                y: Math.floor(ship.y),
              })
            }
            testId="imp-order-stop"
          >
            {MIL.stop}
          </Btn>
        )}
      </div>
      {def.role === "war" ? (
        <WarOrders
          game={game}
          ship={ship}
          onCommand={onCommand}
          onTool={onTool}
        />
      ) : (
        <TradeOrders game={game} ship={ship} onCommand={onCommand} />
      )}
      {fleet !== null ? (
        <Btn
          small
          onClick={() => onCommand({ type: "fleetDisband", fleet: fleet.id })}
          testId="imp-fleet-disband"
        >
          {MIL.fleetDisband}
        </Btn>
      ) : (
        <Btn
          small
          icon="anchor"
          tip={MIL.fleetTip}
          onClick={() =>
            onCommand({
              type: "fleetCreate",
              name: MIL.fleetName(nextFleetNumber(game)),
              ships: nearbyOwnShips(game, ship).map((s) => s.id),
            })
          }
          testId="imp-fleet-create"
        >
          {MIL.fleetNew}
        </Btn>
      )}
    </div>
  );
}

/**
 * The commands of several selected units: fleets for the ships, kinds,
 * formation, holding, falling back and patrols for the land units.
 *
 * @param props - game, the units and the ways to command and to pick a tool
 * @returns the block of buttons
 */
export function UnitOrders({
  game,
  ships,
  soldiers,
  onCommand,
  onTool,
}: {
  readonly game: Game;
  readonly ships: readonly number[];
  readonly soldiers: readonly number[];
  readonly onCommand: (command: Command) => boolean;
  readonly onTool: (tool: Tool) => void;
}): ReactElement {
  const troops = game.soldiers.filter(
    (s) => s.owner === HUMAN && soldiers.includes(s.id),
  );
  const own = game.ships.filter(
    (s) => s.owner === HUMAN && ships.includes(s.id),
  );
  const formation = troops[0]?.formation ?? "line";
  const ids = troops.map((s) => s.id);
  return (
    <div className="flex flex-col gap-2 text-xs" data-testid="imp-unit-orders">
      {own.length > 1 && (
        <Btn
          small
          icon="anchor"
          tip={MIL.fleetTip}
          onClick={() =>
            onCommand({
              type: "fleetCreate",
              name: MIL.fleetName(nextFleetNumber(game)),
              ships: own.map((s) => s.id),
            })
          }
          testId="imp-fleet-create"
        >
          {MIL.fleetNew}
        </Btn>
      )}
      {troops.length > 0 && (
        <>
          <Section>{MIL.byKind}</Section>
          <ul className="flex flex-wrap gap-2" data-testid="imp-unit-kinds">
            {UNIT_KINDS.filter((kind) =>
              troops.some((s) => s.kind === kind),
            ).map((kind) => (
              <li
                key={kind}
                className="flex items-center gap-1"
                data-tip={UNIT_NAMES[kind]}
              >
                <UnitArt kind={kind} size={22} />
                {troops.filter((s) => s.kind === kind).length}
              </li>
            ))}
          </ul>
          <Fact label={MIL.task}>{MIL.orderNames[troops[0].order.type]}</Fact>
          <Section>{MIL.formation}</Section>
          <div className="flex flex-wrap gap-1">
            {FORMATIONS.map((value) => (
              <Btn
                key={value}
                small
                active={value === formation}
                tip={FORMATION_TIPS[value]}
                onClick={() =>
                  onCommand({
                    type: "formation",
                    soldiers: ids,
                    formation: value,
                  })
                }
                testId={`imp-formation-${value}`}
              >
                {FORMATION_NAMES[value]}
              </Btn>
            ))}
          </div>
          <Section>{MIL.commands}</Section>
          <div className="flex flex-wrap gap-1">
            <Btn
              small
              icon="tower"
              tip={MIL.holdTip}
              active={troops.every((s) => s.order.type === "hold")}
              onClick={() => onCommand({ type: "unitHold", soldiers: ids })}
              testId="imp-unit-hold"
            >
              {MIL.hold}
            </Btn>
            <Btn
              small
              icon="chevronLeft"
              tip={MIL.retreatTip}
              onClick={() => onCommand({ type: "unitRetreat", soldiers: ids })}
              testId="imp-unit-retreat"
            >
              {MIL.retreat}
            </Btn>
            <Btn
              small
              icon="map"
              tip={MIL.patrolUnitsTip}
              onClick={() =>
                onTool({ type: "patrol", ships: [], soldiers: ids })
              }
              testId="imp-unit-patrol"
            >
              {MIL.patrolUnits}
            </Btn>
          </div>
          <p className="imp-muted">{MIL.attackUnitsTip}</p>
        </>
      )}
    </div>
  );
}

/** Attack, patrol and escort of a war ship. */
function WarOrders({
  game,
  ship,
  onCommand,
  onTool,
}: {
  readonly game: Game;
  readonly ship: Ship;
  readonly onCommand: (command: Command) => boolean;
  readonly onTool: (tool: Tool) => void;
}): ReactElement {
  const targets = nearbyTargets(game, ship);
  const charges = game.ships
    .filter((other) => other.owner === HUMAN && other.id !== ship.id)
    .sort(
      (a, b) =>
        Math.hypot(a.x - ship.x, a.y - ship.y) -
        Math.hypot(b.x - ship.x, b.y - ship.y),
    )
    .slice(0, MOST_CHARGES);
  return (
    <>
      <Section>{MIL.attack}</Section>
      {targets.length === 0 ? (
        <p className="imp-muted">{MIL.noTargets}</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {targets.map((target) => (
            <Btn
              key={`${target.building ? "b" : "s"}${target.id}`}
              small
              danger
              icon="cannon"
              tip={MIL.attackTip}
              onClick={() =>
                onCommand({
                  type: "shipAttack",
                  ship: ship.id,
                  target: target.id,
                  building: target.building,
                })
              }
              testId={`imp-attack-${target.building ? "b" : "s"}${target.id}`}
            >
              {MIL.attackNearest(target.name)}
            </Btn>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        <Btn
          small
          icon="map"
          tip={MIL.patrolTip}
          onClick={() =>
            onTool({ type: "patrol", ships: [ship.id], soldiers: [] })
          }
          testId="imp-order-patrol"
        >
          {MIL.patrol}
        </Btn>
      </div>
      <Section>{MIL.escort}</Section>
      <div className="flex flex-wrap gap-1">
        {charges.map((other) => (
          <Btn
            key={other.id}
            small
            icon="anchor"
            tip={MIL.escortTip}
            active={
              ship.order.type === "escort" && ship.order.ship === other.id
            }
            onClick={() =>
              onCommand({ type: "shipEscort", ship: ship.id, escort: other.id })
            }
            testId={`imp-escort-${other.id}`}
          >
            {other.name} ({SHIP_NAMES[other.kind]})
          </Btn>
        ))}
      </div>
    </>
  );
}

/** Loading, unloading and the trade route of a cargo ship. */
function TradeOrders({
  game,
  ship,
  onCommand,
}: {
  readonly game: Game;
  readonly ship: Ship;
  readonly onCommand: (command: Command) => boolean;
}): ReactElement {
  const route =
    ship.order.type === "route"
      ? game.routes.find(
          (r) => r.id === (ship.order as { route: number }).route,
        )
      : undefined;
  const owned = game.islands.filter((island) => island.owner === HUMAN);
  const kontor = game.buildings.find((b) => b.id === ship.docked);
  const create = () => {
    // From the kontor it lies at (else the first island) to the next one.
    const first = kontor?.island ?? owned[0]?.id ?? -1;
    const second = owned.find((island) => island.id !== first)?.id ?? -1;
    const stops: RouteStop[] = [first, second].map((island, index) => ({
      island,
      actions: [
        {
          good: "planks",
          mode: index === 0 ? "load" : "unload",
          amount: ROUTE_AMOUNT,
          limit: index === 0 ? 0 : ROUTE_AMOUNT * 2,
          priority: 1,
        },
      ],
    }));
    const routes = game.routes.filter((r) => r.owner === HUMAN);
    if (
      onCommand({
        type: "routeCreate",
        name: T.routeName(routes.length + 1),
        stops,
      })
    ) {
      const made = game.routes[game.routes.length - 1];
      onCommand({ type: "assign", ship: ship.id, route: made.id });
    }
  };
  return (
    <>
      <p className="imp-muted">
        {kontor !== undefined ? MIL.loadHint : MIL.dockHint}
      </p>
      <div className="flex flex-wrap gap-1">
        <Btn
          small
          icon="map"
          tip={MIL.routeNewTip}
          disabled={owned.length < 2}
          onClick={create}
          testId="imp-route-create"
        >
          {MIL.routeNew}
        </Btn>
        {route !== undefined && (
          <Btn
            small
            icon={route.active ? "stop" : "play"}
            onClick={() =>
              onCommand({
                type: "routeUpdate",
                route: route.id,
                stops: route.stops,
                active: !route.active,
              })
            }
            testId="imp-route-toggle"
          >
            {route.active ? MIL.routeStop : MIL.routeStart}
          </Btn>
        )}
      </div>
    </>
  );
}

/** Enemy ships and buildings near a ship, nearest first. */
function nearbyTargets(
  game: Game,
  ship: Ship,
): { id: number; building: boolean; name: string }[] {
  const found: { id: number; building: boolean; name: string; d: number }[] =
    [];
  for (const other of game.ships) {
    const d = Math.hypot(other.x - ship.x, other.y - ship.y);
    if (d <= CHASE_RANGE * 2 && hostile(game, HUMAN, other.owner)) {
      found.push({
        id: other.id,
        building: false,
        name: other.name !== "" ? other.name : SHIP_NAMES[other.kind],
        d,
      });
    }
  }
  for (const building of game.buildings) {
    const d = Math.hypot(
      building.x + building.w / 2 - ship.x,
      building.y + building.h / 2 - ship.y,
    );
    if (d <= CHASE_RANGE * 2 && hostile(game, HUMAN, ownerOf(game, building))) {
      found.push({
        id: building.id,
        building: true,
        name: BUILDING_NAMES[building.kind],
        d,
      });
    }
  }
  return found.sort((a, b) => a.d - b.d).slice(0, MOST_TARGETS);
}

/** This ship and the human's ships close to it, for a new fleet. */
function nearbyOwnShips(game: Game, ship: Ship): Ship[] {
  return game.ships.filter(
    (other) =>
      other.owner === HUMAN &&
      Math.hypot(other.x - ship.x, other.y - ship.y) <= CHASE_RANGE,
  );
}

/** The number of the next fleet's name. */
function nextFleetNumber(game: Game): number {
  return game.fleets.filter((fleet) => fleet.owner === HUMAN).length + 1;
}
