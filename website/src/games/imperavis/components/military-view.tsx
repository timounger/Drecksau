/**
 * The military overview of the administration: the human's land units by
 * kind and where they stand, the control groups, training and shipyard
 * orders, the war ships and fleets, the upkeep and worth of it all, and
 * the room left in barracks, shipyards and holds.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import { fleetShips } from "@/games/imperavis/engine/fleets";
import { HUMAN } from "@/games/imperavis/engine/players";
import { yardOrders } from "@/games/imperavis/engine/ships";
import { SHIP, YARD_ORDERS } from "@/games/imperavis/engine/ships-data";
import { troopUpkeep } from "@/games/imperavis/engine/troops";
import {
  DRILL_ORDERS,
  UNIT,
  UNIT_KINDS,
} from "@/games/imperavis/engine/units-data";
import type { Game } from "@/games/imperavis/engine/types";
import type { Units } from "@/games/imperavis/hooks/orders";
import { fleetUnits, pickOf } from "@/games/imperavis/hooks/orders";
import { SHIP_NAMES } from "@/games/imperavis/i18n/texts";
import { MIL, UNIT_NAMES } from "@/games/imperavis/i18n/military-texts";
import type { Pick } from "@/games/imperavis/render/view";
import { ShipArt, UnitArt } from "./unit-art";
import { Btn, Fact, goldText, Section } from "./ui";

/**
 * Renders the military overview.
 *
 * @param props - the game, the control groups and the ways to look and pick
 * @returns the page
 */
export function Military({
  game,
  groups,
  onFocus,
  onSelect,
}: {
  readonly game: Game;
  readonly groups: () => ReadonlyMap<number, Units>;
  readonly onFocus: (x: number, y: number) => void;
  readonly onSelect: (pick: Pick) => void;
}): ReactElement {
  const troops = game.soldiers.filter((s) => s.owner === HUMAN);
  const onLand = troops.filter((s) => s.ship < 0);
  const ships = game.ships.filter((s) => s.owner === HUMAN);
  const navy = ships.filter((s) => SHIP[s.kind].role === "war");
  const barracks = game.buildings.filter(
    (b) => b.drill !== null && game.islands[b.island].owner === HUMAN,
  );
  const yards = game.buildings.filter(
    (b) => b.yard !== null && game.islands[b.island].owner === HUMAN,
  );
  const training = barracks.reduce(
    (sum, b) => sum + (b.drill?.queue.length ?? 0),
    0,
  );
  const ordered = yards.reduce((sum, b) => sum + yardOrders(b), 0);
  const upkeep =
    troopUpkeep(game, HUMAN) +
    navy.reduce((sum, s) => sum + SHIP[s.kind].upkeep, 0);
  const worth =
    troops.reduce((sum, s) => sum + UNIT[s.kind].cost.gold, 0) +
    navy.reduce((sum, s) => sum + SHIP[s.kind].cost.gold, 0);
  const room = ships.reduce((sum, s) => sum + SHIP[s.kind].troops, 0);
  const islands = [...new Set(onLand.map((s) => s.island))];
  const fleets = game.fleets.filter((f) => f.owner === HUMAN);
  const keys = [...groups().entries()].filter(
    ([, units]) => units.ships.length + units.soldiers.length > 0,
  );
  return (
    <div className="flex flex-col gap-3 text-sm" data-testid="imp-military">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Fact label={MIL.soldiers}>
          <span data-testid="imp-mil-count">{troops.length}</span>
        </Fact>
        <Fact label={MIL.onLand}>{onLand.length}</Fact>
        <Fact label={MIL.aboard}>{troops.length - onLand.length}</Fact>
        <Fact label={MIL.warShips}>{navy.length}</Fact>
        <Fact label={MIL.totalUpkeep}>{goldText(upkeep)}/Min</Fact>
        <Fact label={MIL.invested} tip={MIL.investedValue(worth)}>
          {goldText(worth)}
        </Fact>
      </div>
      <section>
        <Section>{MIL.byKind}</Section>
        <ul
          className="grid grid-cols-2 gap-1 text-xs sm:grid-cols-3"
          data-testid="imp-mil-kinds"
        >
          {UNIT_KINDS.map((kind) => (
            <li key={kind} className="imp-card flex items-center gap-2">
              <UnitArt kind={kind} size={26} />
              <span className="min-w-0 flex-1 truncate">
                {UNIT_NAMES[kind]}
              </span>
              <b className="tabular-nums">
                {troops.filter((s) => s.kind === kind).length}
              </b>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <Section>{MIL.positions}</Section>
        {islands.length === 0 ? (
          <p className="imp-muted text-xs">{MIL.none}</p>
        ) : (
          <ul className="flex flex-col gap-1 text-xs">
            {islands.map((id) => {
              const here = onLand.filter((s) => s.island === id);
              const first = here[0];
              return (
                <li
                  key={id}
                  className="flex items-center justify-between gap-2"
                >
                  <span>
                    {MIL.island(game.world.islands[id].name, here.length)}
                  </span>
                  <Btn
                    small
                    onClick={() => {
                      onSelect(
                        pickOf({ ships: [], soldiers: here.map((s) => s.id) }),
                      );
                      onFocus(first.x, first.y);
                    }}
                  >
                    {MIL.focus}
                  </Btn>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section>
        <Section>{MIL.groups}</Section>
        {keys.length === 0 ? (
          <p className="imp-muted text-xs">{MIL.noGroups}</p>
        ) : (
          <ul className="flex flex-col gap-1 text-xs">
            {keys.map(([key, units]) => (
              <li key={key} className="flex items-center justify-between gap-2">
                <span>
                  {MIL.group(key, units.ships.length + units.soldiers.length)}
                </span>
                <Btn small onClick={() => onSelect(pickOf(units))}>
                  {MIL.fleetSelect}
                </Btn>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <Section>{MIL.fleets}</Section>
        {fleets.length === 0 ? (
          <p className="imp-muted text-xs">{MIL.noFleets}</p>
        ) : (
          <ul
            className="flex flex-col gap-1 text-xs"
            data-testid="imp-mil-fleets"
          >
            {fleets.map((fleet) => {
              const members = fleetShips(game, fleet);
              const lead = members[0];
              return (
                <li key={fleet.id} className="imp-card flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <b>{fleet.name}</b>
                    <Btn
                      small
                      onClick={() => {
                        onSelect(pickOf(fleetUnits(game, fleet.id)));
                        if (lead !== undefined) {
                          onFocus(lead.x, lead.y);
                        }
                      }}
                      testId={`imp-fleet-select-${fleet.id}`}
                    >
                      {MIL.fleetSelect}
                    </Btn>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {members.map((ship) => (
                      <span
                        key={ship.id}
                        className="inline-flex items-center gap-1"
                        data-tip={SHIP_NAMES[ship.kind]}
                      >
                        <ShipArt kind={ship.kind} size={28} />
                        {ship.name}
                      </span>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section>
        <Section>{MIL.capacities}</Section>
        <ul className="flex flex-col gap-0.5 text-xs">
          <li data-testid="imp-mil-training">
            {MIL.training}:{" "}
            {MIL.barracksSlots(
              training,
              barracks.length * DRILL_ORDERS - training,
            )}
          </li>
          <li>
            {MIL.shipOrders}:{" "}
            {MIL.yardSlots(ordered, yards.length * YARD_ORDERS - ordered)}
          </li>
          <li>{MIL.troopRoom(troops.length - onLand.length, room)}</li>
        </ul>
      </section>
    </div>
  );
}
