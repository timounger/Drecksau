/**
 * The task window of the guided start: only the current task with one
 * sentence, its progress, a way to it (camera or build menu) and the way
 * out - plus the offer to settle the island the ship lies at, shared with
 * the ship's window.
 *
 * @module
 */
"use client";

import { useState, type ReactElement } from "react";
import { BUILDING } from "@/games/imperavis/engine/buildings-data";
import {
  freeCoastNear,
  hasAmounts,
  kontorShortfall,
  settleSite,
} from "@/games/imperavis/engine/placement";
import { HUMAN } from "@/games/imperavis/engine/players";
import {
  shipOffFreeCoast,
  tutorialProgress,
} from "@/games/imperavis/engine/tutorial";
import {
  currentStep,
  TUTORIAL_STEPS,
  type TutorialStep,
} from "@/games/imperavis/engine/tutorial-data";
import type { Command, Game, Ship } from "@/games/imperavis/engine/types";
import {
  TUTORIAL,
  TUTORIAL_STEP_TEXTS,
} from "@/games/imperavis/i18n/tutorial-texts";
import type { Pick } from "@/games/imperavis/render/view";
import { groupOf, type BuildGroup } from "./build-menu";
import { Icon } from "./icons";
import { amountWords } from "./shipyard-panel";
import { Bar, Btn, IconBtn, Panel } from "./ui";

/** What settling from a ship would do: the command, or why it cannot. */
export type SettleOffer = {
  /** The free island the ship lies at. */
  readonly island: number;
  /** The kontor to place, or null when it cannot be. */
  readonly command: Command | null;
  /** Why not, in words, or null when it can. */
  readonly reason: string | null;
};

/** Props of {@link TutorialPanel}. */
type TutorialPanelProps = {
  readonly game: Game;
  readonly onFocus: (x: number, y: number) => void;
  readonly onSelect: (pick: Pick) => void;
  readonly onGroup: (group: BuildGroup) => void;
  readonly onCommand: (command: Command) => boolean;
  readonly className?: string;
};

/**
 * Settling the free island a ship lies at, by the usual rules of the kontor.
 *
 * @param game - the game
 * @param ship - an own ship
 * @returns the offer, or null when the ship lies at no free island
 */
export function settleOffer(game: Game, ship: Ship): SettleOffer | null {
  const island = freeCoastNear(game, ship.x, ship.y);
  let offer: SettleOffer | null = null;
  if (island >= 0) {
    const site = settleSite(game, HUMAN, ship, island);
    const cost = BUILDING.kontor.cost;
    const reason =
      site !== null
        ? null
        : game.players[HUMAN].gold < cost.gold
          ? TUTORIAL.settleGold
          : !hasAmounts(ship.cargo, cost) && !game.cheat
            ? TUTORIAL.settleCargo(amountWords(kontorShortfall(ship)))
            : TUTORIAL.settleNoSite;
    offer = {
      island,
      command:
        site === null
          ? null
          : { type: "build", kind: "kontor", x: site.x, y: site.y, rot: 0 },
      reason,
    };
  }
  return offer;
}

/**
 * Renders the task window, or nothing when the guided start is off.
 *
 * @param props - the game and the ways to the camera, selection and menu
 * @returns the window or null
 */
export function TutorialPanel({
  game,
  onFocus,
  onSelect,
  onGroup,
  onCommand,
  className = "",
}: TutorialPanelProps): ReactElement | null {
  const [open, setOpen] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const step = currentStep(game.tutorial);
  let content: ReactElement | null = null;
  if (step !== null) {
    const words = TUTORIAL_STEP_TEXTS[step.id];
    const progress = tutorialProgress(game);
    const index = game.tutorial.step + 1;
    const header = (
      <header className="flex items-center gap-2 px-3 pt-2">
        <span className="imp-medal h-8 w-8">
          <Icon name="star" size={16} className="imp-gold" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="imp-muted text-[10px] tracking-widest uppercase">
            {TUTORIAL.window} - {TUTORIAL.step(index, TUTORIAL_STEPS.length)}
          </p>
          <h2
            className="imp-title text-sm leading-tight"
            data-testid="imp-task-title"
          >
            {words.title}
          </h2>
        </div>
        <IconBtn
          icon={open ? "chevronDown" : "chevronUp"}
          tip={open ? TUTORIAL.collapse : TUTORIAL.expand}
          onClick={() => setOpen(!open)}
          testId="imp-task-toggle"
          size={24}
        />
      </header>
    );
    content = (
      <Panel
        className={`imp-open flex w-full flex-col pb-2 ${className}`}
        testId="imp-task"
      >
        {header}
        {open && (
          <div className="flex flex-col gap-1.5 px-3 pt-1.5">
            <p className="text-xs leading-snug" data-testid="imp-task-text">
              {words.text}
            </p>
            {progress !== null && progress.total > 1 && (
              <div
                className="flex items-center gap-2 text-[11px]"
                data-testid="imp-task-progress"
              >
                <div className="min-w-0 flex-1">
                  <Bar value={progress.done / progress.total} />
                </div>
                <span className="imp-muted shrink-0">
                  {TUTORIAL.progress(progress.done, progress.total, words.unit)}
                </span>
              </div>
            )}
            {confirm ? (
              <div className="imp-inset flex flex-col gap-1.5 p-2 text-xs">
                <p>{TUTORIAL.endConfirm}</p>
                <div className="flex flex-wrap gap-1">
                  <Btn
                    small
                    danger
                    onClick={() => {
                      onCommand({ type: "tutorialEnd" });
                      setConfirm(false);
                    }}
                    testId="imp-task-end-yes"
                  >
                    {TUTORIAL.endYes}
                  </Btn>
                  <Btn
                    small
                    onClick={() => setConfirm(false)}
                    testId="imp-task-end-no"
                  >
                    {TUTORIAL.endNo}
                  </Btn>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1">
                <SettleButton game={game} step={step} onCommand={onCommand} />
                <ShowButton
                  game={game}
                  step={step}
                  onFocus={onFocus}
                  onSelect={onSelect}
                  onGroup={onGroup}
                />
                <Btn
                  small
                  tip={TUTORIAL.endTip}
                  onClick={() => setConfirm(true)}
                  testId="imp-task-end"
                  className="ml-auto"
                >
                  {TUTORIAL.end}
                </Btn>
              </div>
            )}
          </div>
        )}
      </Panel>
    );
  }
  return content;
}

/** "Insel besiedeln" right in the task window, while a ship lies at a free coast. */
function SettleButton({
  game,
  step,
  onCommand,
}: {
  readonly game: Game;
  readonly step: TutorialStep;
  readonly onCommand: (command: Command) => boolean;
}): ReactElement | null {
  const off =
    step.id === "explore" || step.id === "settle"
      ? shipOffFreeCoast(game)
      : null;
  const offer = off === null ? null : settleOffer(game, off.ship);
  const command = offer?.command ?? null;
  return offer === null || command === null ? null : (
    <Btn
      small
      icon="anchor"
      className="imp-btn-primary"
      tip={TUTORIAL.settleTip(game.world.islands[offer.island].name)}
      onClick={() => onCommand(command)}
      testId="imp-task-settle"
    >
      {TUTORIAL.settle}
    </Btn>
  );
}

/** "Zeigen": the camera to the island or the ship, or the build menu. */
function ShowButton({
  game,
  step,
  onFocus,
  onSelect,
  onGroup,
}: {
  readonly game: Game;
  readonly step: TutorialStep;
  readonly onFocus: (x: number, y: number) => void;
  readonly onSelect: (pick: Pick) => void;
  readonly onGroup: (group: BuildGroup) => void;
}): ReactElement {
  const ship =
    shipOffFreeCoast(game)?.ship ??
    game.ships.find((item) => item.owner === HUMAN) ??
    null;
  let label: string = TUTORIAL.show;
  let tip: string = TUTORIAL.showTip;
  let action: () => void;
  if (step.id === "explore") {
    label = TUTORIAL.toIsland;
    tip = TUTORIAL.toIslandTip;
    action = () => {
      const island = goodFreeIsland(game, ship);
      if (ship !== null) {
        onSelect({ type: "ship", id: ship.id });
      }
      if (island !== null) {
        onFocus(island.x, island.y);
      }
    };
  } else if (step.id === "settle") {
    label = TUTORIAL.toShip;
    tip = TUTORIAL.toShipTip;
    action = () => {
      if (ship !== null) {
        onSelect({ type: "ship", id: ship.id });
        onFocus(ship.x, ship.y);
      }
    };
  } else {
    action = () => {
      onGroup(stepGroup(game, step));
      const kontor = game.buildings.find(
        (b) => b.kind === "kontor" && game.islands[b.island].owner === HUMAN,
      );
      if (kontor !== undefined) {
        onFocus(kontor.x + kontor.w / 2, kontor.y + kontor.h / 2);
      }
    };
  }
  return (
    <Btn small icon="eye" tip={tip} onClick={action} testId="imp-task-show">
      {label}
    </Btn>
  );
}

/**
 * The category a task wants: the road's, or that of the first recommended
 * building not built yet.
 */
function stepGroup(game: Game, step: TutorialStep): BuildGroup {
  const missing =
    step.recommended.find(
      (kind) =>
        !game.buildings.some(
          (b) => b.kind === kind && game.islands[b.island].owner === HUMAN,
        ),
    ) ?? step.recommended[0];
  return step.road || missing === undefined
    ? "infrastructure"
    : groupOf(BUILDING[missing]);
}

/**
 * A good free island to head for: the home island of the map while it is
 * free, else the free island nearest the ship.
 */
function goodFreeIsland(
  game: Game,
  ship: Ship | null,
): { x: number; y: number } | null {
  const world = game.world;
  const home = world.islands[world.startIsland];
  const homeFree = game.islands[home.id].owner < 0;
  let best: { x: number; y: number } | null = homeFree
    ? { x: home.cx, y: home.cy }
    : null;
  let distance = Infinity;
  for (const info of homeFree ? [] : world.islands) {
    const d =
      ship === null ? info.id : Math.hypot(info.cx - ship.x, info.cy - ship.y);
    if (game.islands[info.id].owner < 0 && d < distance) {
      distance = d;
      best = { x: info.cx, y: info.cy };
    }
  }
  return best;
}
