/**
 * What the disasters mean for one building, for its window: a disaster
 * raging or coming on its island, the dangers where it stands and what
 * guards it, how many buildings a protection guards, and the fuel of a
 * house in a blizzard.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import {
  blizzardRages,
  guardedBy,
  threatsOf,
  warmthOf,
} from "@/games/imperavis/engine/disasters";
import { eventOn, PROTECTION } from "@/games/imperavis/engine/disasters-data";
import type {
  Building,
  BuildingKind,
  DisasterKind,
  Game,
} from "@/games/imperavis/engine/types";
import { DISASTER_TEXTS as DT } from "@/games/imperavis/i18n/disaster-texts";
import { BUILDING_NAMES, INCIDENT_NAMES } from "@/games/imperavis/i18n/texts";
import { Icon } from "./icons";
import { Fact, Section } from "./ui";

/** Percent of a share. */
const PERCENT = 100;

/** Fuel supply below this share is shown as bad. */
const LOW_WARMTH = 0.5;

/** Guards that only soften a danger, per danger. */
const PARTLY: Readonly<Partial<Record<DisasterKind, readonly BuildingKind[]>>> =
  {
    drought: ["fountain"],
    flood: ["pumpStation"],
    tsunami: ["dike"],
  };

/** Props of {@link DisasterFacts}. */
type DisasterFactsProps = {
  readonly game: Game;
  readonly building: Building;
};

/**
 * The disaster lines of a building's window; nothing when none applies.
 *
 * @param props - the game and the building
 * @returns the lines
 */
export function DisasterFacts({
  game,
  building,
}: DisasterFactsProps): ReactElement | null {
  const threats = threatsOf(game, building).filter((threat) =>
    eventOn(game.settings, threat.kind),
  );
  const near = game.hazards.disasters.filter(
    (disaster) => disaster.island === building.island || disaster.island < 0,
  );
  const against = PROTECTION[building.kind];
  const centre = {
    x: building.x + building.w / 2,
    y: building.y + building.h / 2,
  };
  const cold = building.house !== null && blizzardRages(game);
  const shown =
    threats.length > 0 || near.length > 0 || against !== undefined || cold;
  return shown ? (
    <div className="flex flex-col gap-1" data-testid="imp-disaster-facts">
      {near.map((disaster) => (
        <p
          key={disaster.id}
          className="flex items-center gap-1 text-xs font-semibold text-[var(--imp-bad)]"
        >
          <Icon name="warning" size={14} />
          {disaster.struck
            ? DT.raging(
                INCIDENT_NAMES[disaster.kind],
                Math.max(0, Math.ceil(disaster.until - game.time)),
              )
            : DT.coming(
                INCIDENT_NAMES[disaster.kind],
                Math.max(0, Math.ceil(disaster.strikes - game.time)),
              )}
        </p>
      ))}
      {against !== undefined && (
        <p className="text-xs" data-testid="imp-guards">
          {DT.guards(
            guardedBy(game, building.kind, building.island, centre.x, centre.y),
          )}
        </p>
      )}
      {cold && (
        <Fact
          label={INCIDENT_NAMES.blizzard}
          tone={warmthOf(game, building.island) < LOW_WARMTH ? "bad" : "good"}
        >
          {DT.fuel(Math.round(warmthOf(game, building.island) * PERCENT))}
        </Fact>
      )}
      {threats.length > 0 && against === undefined && (
        <>
          <Section>{DT.threats}</Section>
          <ul className="flex flex-col gap-0.5 text-xs">
            {threats.map((threat) => (
              <li key={threat.kind}>
                <span className="font-semibold">
                  {INCIDENT_NAMES[threat.kind]}
                </span>
                : {threatWords(threat.kind, threat.guards)}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  ) : null;
}

/** How well a building is guarded against one danger, in words. */
function threatWords(
  kind: DisasterKind,
  guards: readonly BuildingKind[],
): string {
  const soft = PARTLY[kind] ?? [];
  const names = guards.map((guard) => BUILDING_NAMES[guard]).join(", ");
  let words: string;
  if (kind === "locusts") {
    words = DT.threatStock;
  } else if (kind === "blizzard") {
    words = DT.threatFuel;
  } else if (guards.length === 0) {
    words = DT.threatOpen;
  } else if (guards.every((guard) => soft.includes(guard))) {
    words = DT.threatPartly(names);
  } else {
    words = DT.threatGuarded(names);
  }
  return words;
}
