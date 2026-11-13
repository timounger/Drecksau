/**
 * The barracks' window: the training queue with progress, pause and
 * cancelling, and the units by shelf - infantry, ranged, heavy infantry,
 * specialists - each tile with its picture, values, cost (red where short),
 * unlock and the training buttons, greyed out with the reason when closed.
 *
 * @module
 */
"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import { hasAmounts } from "@/games/imperavis/engine/placement";
import { HUMAN } from "@/games/imperavis/engine/players";
import {
  exitTile,
  trainingLeft,
  trainingRefund,
  unitLocked,
} from "@/games/imperavis/engine/troops";
import {
  DRILL_ORDERS,
  UNIT,
  UNIT_CATEGORIES,
  UNITS,
} from "@/games/imperavis/engine/units-data";
import type {
  Building,
  Command,
  Game,
  UnitCategory,
  UnitKind,
} from "@/games/imperavis/engine/types";
import {
  BUILDING_NAMES,
  REFUSAL_TEXTS,
  RESEARCH_NAMES,
  TIER_NAMES,
} from "@/games/imperavis/i18n/texts";
import {
  CATEGORY_NAMES,
  MIL,
  UNIT_INFO,
  UNIT_LOCK_TEXTS,
  UNIT_NAMES,
} from "@/games/imperavis/i18n/military-texts";
import { amountWords, shortOf } from "./shipyard-panel";
import { UnitArt } from "./unit-art";
import { Bar, Btn, CostLine, Fact, IconBtn, Section, Tabs } from "./ui";

/** Percent of a share. */
const PERCENT = 100;

/** Units ordered by the larger button. */
const MANY = 5;

/**
 * Renders the barracks' window.
 *
 * @param props - the game, the barracks and the way to give commands
 * @returns the window's body
 */
export function BarracksPanel({
  game,
  building,
  onCommand,
}: {
  readonly game: Game;
  readonly building: Building;
  readonly onCommand: (command: Command) => boolean;
}): ReactElement {
  const [shelf, setShelf] = useState<UnitCategory>("infantry");
  const drill = building.drill as NonNullable<Building["drill"]>;
  const here = game.soldiers.filter(
    (s) => s.owner === HUMAN && s.ship < 0 && s.island === building.island,
  ).length;
  const all = game.soldiers.filter((s) => s.owner === HUMAN).length;
  return (
    <div
      className="grid grid-cols-1 gap-3 lg:grid-cols-[15rem_1fr]"
      data-testid="imp-barracks"
    >
      <div className="flex flex-col gap-2 lg:sticky lg:top-0 lg:self-start">
        <p className="text-xs" data-testid="imp-soldiers">
          {MIL.hereAndAll(here, all)}
        </p>
        <div className="flex items-center justify-between gap-2">
          <Section>{MIL.trainQueue}</Section>
          <span className="text-xs tabular-nums" data-testid="imp-drill-count">
            {drill.queue.length} / {DRILL_ORDERS}
          </span>
        </div>
        {drill.queue.length === 0 ? (
          <p className="imp-muted text-xs">{MIL.trainEmpty}</p>
        ) : (
          <ol
            className="flex flex-col gap-1 text-xs"
            data-testid="imp-drill-queue"
          >
            {drill.queue.map((kind, k) => (
              <li
                key={`${kind}-${k}`}
                className="imp-card flex flex-col gap-1 !py-1"
                data-testid={`imp-drill-queue-${k}`}
              >
                <div className="flex items-center gap-2">
                  <UnitArt kind={kind} size={22} />
                  <span className="min-w-0 flex-1">
                    {k + 1}. {UNIT_NAMES[kind]}
                  </span>
                  <CancelButton
                    building={building}
                    index={k}
                    onCommand={onCommand}
                  />
                </div>
                {k === 0 && (
                  <Training game={game} building={building} kind={kind} />
                )}
              </li>
            ))}
          </ol>
        )}
        <Btn
          small
          icon={drill.paused ? "play" : "stop"}
          active={drill.paused}
          disabled={drill.queue.length === 0 && !drill.paused}
          onClick={() =>
            onCommand({
              type: "pauseTraining",
              barracks: building.id,
              paused: !drill.paused,
            })
          }
          testId="imp-drill-pause"
        >
          {drill.paused ? MIL.resume : MIL.pause}
        </Btn>
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <Tabs
          tabs={UNIT_CATEGORIES.map((id) => ({
            id,
            label: CATEGORY_NAMES[id],
          }))}
          value={shelf}
          onChange={setShelf}
          testPrefix="imp-drill-tab"
        />
        <ul className="grid grid-cols-1 gap-2">
          {UNITS.filter((def) => def.category === shelf).map((def) => (
            <UnitTile
              key={def.kind}
              game={game}
              building={building}
              kind={def.kind}
              onCommand={onCommand}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

/** The progress of the unit in training. */
function Training({
  game,
  building,
  kind,
}: {
  readonly game: Game;
  readonly building: Building;
  readonly kind: UnitKind;
}): ReactElement {
  const drill = building.drill as NonNullable<Building["drill"]>;
  const share = drill.progress / UNIT[kind].train;
  const waiting = share >= 1 && exitTile(game, building) < 0;
  return (
    <>
      <Bar value={share} color="bg-[var(--imp-warn)]" />
      <span data-testid="imp-drill-progress">
        {waiting
          ? MIL.waitingDoor
          : drill.paused
            ? MIL.paused
            : MIL.progress(
                Math.floor(share * PERCENT),
                Math.ceil(trainingLeft(building)),
              )}
      </span>
    </>
  );
}

/** Cancels one unit, with what comes back in its tooltip. */
function CancelButton({
  building,
  index,
  onCommand,
}: {
  readonly building: Building;
  readonly index: number;
  readonly onCommand: (command: Command) => boolean;
}): ReactElement {
  const back = trainingRefund(building, index);
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
        onCommand({ type: "cancelTraining", barracks: building.id, index })
      }
      testId={`imp-drill-cancel-${index}`}
    />
  );
}

/** One unit to train: picture, values, cost, unlock and the buttons. */
function UnitTile({
  game,
  building,
  kind,
  onCommand,
}: {
  readonly game: Game;
  readonly building: Building;
  readonly kind: UnitKind;
  readonly onCommand: (command: Command) => boolean;
}): ReactElement {
  const def = UNIT[kind];
  const player = game.players[HUMAN];
  const stock = game.islands[building.island].stock;
  const drill = building.drill as NonNullable<Building["drill"]>;
  const lock = unitLocked(game, player, kind);
  const missing = shortOf(stock, def.cost);
  const reason =
    lock !== null
      ? REFUSAL_TEXTS[`unit:${lock}`]
      : drill.queue.length >= DRILL_ORDERS
        ? REFUSAL_TEXTS.queueFull
        : player.gold < def.cost.gold
          ? REFUSAL_TEXTS.gold
          : !hasAmounts(stock, def.cost)
            ? REFUSAL_TEXTS.materials
            : null;
  const needs = [
    MIL.unlockTier(TIER_NAMES[def.tier]),
    ...(def.research === null
      ? []
      : [MIL.unlockResearch(RESEARCH_NAMES[def.research])]),
    ...(def.building === null
      ? []
      : [MIL.needsBuilding(BUILDING_NAMES[def.building])]),
  ];
  return (
    <li
      className={`imp-card flex flex-col gap-1 text-xs ${reason !== null ? "opacity-60" : ""}`}
      data-testid={`imp-unit-${kind}`}
      data-trainable={reason === null ? "yes" : "no"}
    >
      <div className="flex items-start gap-2">
        <UnitArt kind={kind} size={44} />
        <div className="min-w-0 flex-1">
          <b className="text-sm">{UNIT_NAMES[kind]}</b>
          <p className="imp-muted leading-snug">{UNIT_INFO[kind]}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <Stat label={MIL.unitStats.attack}>{def.damage}</Stat>
        <Stat label={MIL.unitStats.defence}>
          {MIL.percent(Math.round(def.armour * PERCENT))}
        </Stat>
        <Stat label={MIL.unitStats.hp}>{def.hp}</Stat>
        <Stat label={MIL.unitStats.speed}>{MIL.perSecond(def.speed)}</Stat>
        <Stat label={MIL.unitStats.range}>{def.range}</Stat>
        <Stat label={MIL.unitStats.reload}>{MIL.seconds(def.reload)}</Stat>
        <Stat label={MIL.unitStats.train}>{MIL.seconds(def.train)}</Stat>
        <Stat label={MIL.unitStats.upkeep}>{def.upkeep}/Min</Stat>
      </dl>
      <Fact label={MIL.cost}>
        <CostLine cost={def.cost} stock={stock} gold={player.gold} />
      </Fact>
      <Fact label={MIL.unlock} tone={lock !== null ? "bad" : undefined}>
        {needs.join(", ")}
        {lock !== null && ` (${UNIT_LOCK_TEXTS[lock]})`}
      </Fact>
      {Object.keys(missing).length > 0 && (
        <p className="text-[var(--imp-bad)]">
          {MIL.missing}: {amountWords(missing)}
        </p>
      )}
      <div className="flex flex-wrap gap-1">
        {[1, MANY].map((count) => (
          <Btn
            key={count}
            small
            icon="swords"
            disabled={
              reason !== null || drill.queue.length + count > DRILL_ORDERS
            }
            tip={reason ?? UNIT_NAMES[kind]}
            onClick={() =>
              onCommand({
                type: "train",
                barracks: building.id,
                unit: kind,
                count,
              })
            }
            testId={`imp-train-${kind}-${count}`}
          >
            {count === 1 ? MIL.trainOne : MIL.trainFive}
          </Btn>
        ))}
      </div>
      {reason !== null && <span className="imp-muted">{reason}</span>}
    </li>
  );
}

/** One value of a unit. */
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
