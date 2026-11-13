/**
 * Building: the bar of eight categories at the bottom, the build window
 * that opens above it with a tile per building (cost, materials, upkeep,
 * workers, what unlocks it), and the strip of the build mode with the
 * chosen building, its cost, the verdict of the spot and the controls.
 *
 * @module
 * @remarks
 * The game's own shelves (`BuildingCategory`) are finer; here they are
 * grouped into the eight categories of the screen. Every building of the
 * game has exactly one place, the road tool sits with the infrastructure.
 */
"use client";

import { useState, type ReactElement } from "react";
import { BUILDING, BUILDINGS } from "@/games/imperavis/engine/buildings-data";
import { buildOpen, guidedHolds } from "@/games/imperavis/engine/cheat";
import { PAVE_COST } from "@/games/imperavis/engine/logistics-data";
import { QUARTER_TURNS } from "@/games/imperavis/engine/placement";
import { HUMAN } from "@/games/imperavis/engine/players";
import {
  currentStep,
  tutorialRecommends,
} from "@/games/imperavis/engine/tutorial-data";
import type {
  BuildingDef,
  BuildingKind,
  Game,
} from "@/games/imperavis/engine/types";
import { HUD } from "@/games/imperavis/i18n/hud-texts";
import {
  BUILDING_INFO,
  BUILDING_NAMES,
  GOOD_NAMES,
  ISSUE_TEXTS,
  RESEARCH_NAMES,
  TEXTS as T,
  TIER_NAMES,
} from "@/games/imperavis/i18n/texts";
import {
  TUTORIAL,
  TUTORIAL_STEP_TEXTS,
  tutorialLockText,
} from "@/games/imperavis/i18n/tutorial-texts";
import type { Hint, Tool } from "@/games/imperavis/render/view";
import { BuildingArt, Icon, type IconName } from "./icons";
import { Btn, CostLine, goldText, IconBtn, Panel } from "./ui";

/** The eight categories of the build bar. */
export type BuildGroup =
  | "housing"
  | "farm"
  | "production"
  | "public"
  | "infrastructure"
  | "harbour"
  | "military"
  | "decor";

/** Name, symbol and line of each category. */
const GROUPS: readonly {
  readonly id: BuildGroup;
  readonly name: string;
  readonly short: string;
  readonly icon: IconName;
  readonly line: string;
}[] = [
  {
    id: "housing",
    name: "Wohngebäude",
    short: "Wohnen",
    icon: "house",
    line: "Häuser deiner Bürger - sie steigen von selbst in die nächste Schicht auf.",
  },
  {
    id: "farm",
    name: "Landwirtschaft",
    short: "Land",
    icon: "wheat",
    line: "Höfe, Plantagen, Forst und Fischerei: die Grundstoffe deiner Ketten.",
  },
  {
    id: "production",
    name: "Produktion",
    short: "Produktion",
    icon: "factory",
    line: "Gruben, Werkstätten und Hütten verarbeiten Rohstoffe zu Waren.",
  },
  {
    id: "public",
    name: "Öffentliche Gebäude",
    short: "Öffentlich",
    icon: "townhall",
    line: "Markt, Glaube, Bildung, Gesundheit und Kultur für die Häuser in Reichweite.",
  },
  {
    id: "infrastructure",
    name: "Infrastruktur",
    short: "Wege",
    icon: "road",
    line: "Straßen verbinden Betriebe mit den Lagern, Lagerhäuser schicken Karren.",
  },
  {
    id: "harbour",
    name: "Hafen",
    short: "Hafen",
    icon: "anchor",
    line: "Das Kontor gründet eine Insel, die Werft baut Schiffe.",
  },
  {
    id: "military",
    name: "Militär",
    short: "Militär",
    icon: "cannon",
    line: "Türme und Küstenbatterien verteidigen, die Kaserne bildet Soldaten aus.",
  },
  {
    id: "decor",
    name: "Dekoration",
    short: "Zierde",
    icon: "decor",
    line: "Bäume, Beete, Plätze, Parks, Brunnen und Statuen machen die Häuser in Reichweite zufriedener.",
  },
];

/** Degrees of one quarter turn. */
const QUARTER_DEGREES = 90;

/** Raw-goods producers that belong to the land, not to production. */
const LAND_RAW: readonly BuildingKind[] = ["woodcutter", "fishery"];

/** Props of {@link BuildBar}. */
type BuildBarProps = {
  /** The game, for what the guided start recommends and holds back. */
  readonly game: Game;
  readonly group: BuildGroup | null;
  readonly onGroup: (group: BuildGroup | null) => void;
  readonly tool: Tool;
  readonly onTool: (tool: Tool) => void;
  readonly adminOpen: boolean;
  readonly onAdmin: () => void;
  readonly adminBadge: number;
  readonly mapOpen: boolean;
  readonly onMap: () => void;
  readonly open: boolean;
  readonly onToggle: () => void;
};

/**
 * The category of the screen a building belongs to.
 *
 * @param def - the building
 * @returns its category
 */
export function groupOf(def: BuildingDef): BuildGroup {
  let group: BuildGroup;
  switch (def.category) {
    case "housing":
      group = "housing";
      break;
    case "farm":
      group = "farm";
      break;
    case "raw":
      group = LAND_RAW.includes(def.kind) ? "farm" : "production";
      break;
    case "craft":
      group = "production";
      break;
    case "public":
      group = "public";
      break;
    case "logistics":
      group = def.kind === "kontor" ? "harbour" : "infrastructure";
      break;
    case "harbour":
      group = "harbour";
      break;
    case "defence":
      group = "military";
      break;
    default:
      group = "decor";
  }
  return group;
}

/**
 * The bar at the bottom: the eight categories, the demolish tool, the
 * administration and, on a phone, the world map.
 *
 * @param props - what is open and how to change it
 * @returns the bar
 */
export function BuildBar({
  game,
  group,
  onGroup,
  tool,
  onTool,
  adminOpen,
  onAdmin,
  adminBadge,
  mapOpen,
  onMap,
  open,
  onToggle,
}: BuildBarProps): ReactElement {
  const building = tool.type === "build" ? groupOf(BUILDING[tool.kind]) : null;
  const guided = game.tutorial.active;
  return (
    <Panel
      className="flex items-stretch gap-0.5 px-1 py-1 md:gap-1 md:px-2 md:py-1.5"
      testId="imp-build-bar"
    >
      <button
        type="button"
        className="imp-cat hidden w-6 md:flex"
        data-tip={open ? HUD.hideBar : HUD.showBar}
        aria-label={open ? HUD.hideBar : HUD.showBar}
        aria-pressed={false}
        onClick={(event) => {
          onToggle();
          event.currentTarget.blur();
        }}
        data-testid="imp-toggle-build"
      >
        <Icon name={open ? "chevronDown" : "chevronUp"} size={16} />
      </button>
      {open &&
        GROUPS.map((item) => {
          const recommended = guided && groupRecommended(game, item.id);
          const dim = guided && !groupAvailable(game, item.id);
          const extra = recommended
            ? `\n${TUTORIAL.categoryTip}`
            : dim
              ? `\n${TUTORIAL.categoryLocked}`
              : "";
          return (
            <button
              key={item.id}
              type="button"
              className="imp-cat h-10 min-w-0 flex-1 md:h-[5.25rem] md:w-[5.5rem] md:flex-none"
              aria-pressed={group === item.id || building === item.id}
              data-tip={`${item.name}\n${item.line}${extra}`}
              data-recommended={recommended}
              data-dim={dim}
              aria-label={item.name}
              data-testid={`imp-cat-${item.id}`}
              onClick={(event) => {
                onGroup(group === item.id ? null : item.id);
                event.currentTarget.blur();
              }}
            >
              <span className="imp-medal hidden h-11 w-11 md:inline-flex">
                <Icon name={item.icon} size={26} />
              </span>
              <span className="md:hidden">
                <Icon name={item.icon} size={22} />
              </span>
              <span className="imp-display hidden text-[11px] md:block">
                {item.short}
              </span>
              {recommended && (
                <span className="imp-cat-star" aria-hidden="true">
                  <Icon name="star" size={12} />
                </span>
              )}
            </button>
          );
        })}
      <span className="mx-0.5 w-px self-stretch bg-gradient-to-b from-transparent via-[var(--imp-brass)] to-transparent md:mx-1" />
      <button
        type="button"
        className="imp-cat h-10 min-w-0 flex-1 md:h-[5.25rem] md:w-[4.5rem] md:flex-none"
        aria-pressed={tool.type === "demolish"}
        data-tip={`${HUD.demolishTool}\n${HUD.demolishToolTip}`}
        aria-label={HUD.demolishTool}
        data-testid="imp-tool-demolish"
        onClick={(event) => {
          onTool(
            tool.type === "demolish"
              ? { type: "select" }
              : { type: "demolish" },
          );
          event.currentTarget.blur();
        }}
      >
        <Icon name="hammer" size={24} />
        <span className="imp-display hidden text-[11px] md:block">
          {HUD.demolishTool}
        </span>
      </button>
      <button
        type="button"
        className="imp-cat relative h-10 min-w-0 flex-1 md:h-[5.25rem] md:w-[5rem] md:flex-none"
        aria-pressed={adminOpen}
        data-tip={`${HUD.admin}\n${HUD.adminTip}`}
        aria-label={HUD.admin}
        data-testid="imp-open-admin"
        onClick={(event) => {
          onAdmin();
          event.currentTarget.blur();
        }}
      >
        <Icon name="scroll" size={24} />
        <span className="imp-display hidden text-[11px] md:block">
          {HUD.admin}
        </span>
        {adminBadge > 0 && <span className="imp-cat-badge">{adminBadge}</span>}
      </button>
      <button
        type="button"
        className="imp-cat h-10 min-w-0 flex-1 md:hidden"
        aria-pressed={mapOpen}
        data-tip={`${HUD.worldMap}\n${HUD.worldMapTip}`}
        aria-label={HUD.worldMap}
        data-testid="imp-open-map-phone"
        onClick={(event) => {
          onMap();
          event.currentTarget.blur();
        }}
      >
        <Icon name="map" size={22} />
      </button>
    </Panel>
  );
}

/** Props of {@link BuildWindow}. */
type BuildWindowProps = {
  readonly game: Game;
  /** The island whose stock pays. */
  readonly island: number;
  readonly group: BuildGroup;
  readonly tool: Tool;
  readonly onTool: (tool: Tool) => void;
  readonly onClose: () => void;
};

/**
 * The build window of one category: a tile per building.
 *
 * @param props - game, paying island, category, tool and actions
 * @returns the window
 */
export function BuildWindow({
  game,
  island,
  group,
  tool,
  onTool,
  onClose,
}: BuildWindowProps): ReactElement {
  const [query, setQuery] = useState("");
  const meta = GROUPS.find((item) => item.id === group) ?? GROUPS[0];
  const needle = query.trim().toLowerCase();
  const state = game.tutorial;
  // Recommended buildings come first; the rest keep the menu order.
  const defs = BUILDINGS.filter(
    (def) =>
      groupOf(def) === group &&
      (needle === "" ||
        BUILDING_NAMES[def.kind].toLowerCase().includes(needle)),
  ).sort(
    (a, b) =>
      Number(tutorialRecommends(state, b.kind)) -
      Number(tutorialRecommends(state, a.kind)),
  );
  const showRoad =
    group === "infrastructure" &&
    (needle === "" || HUD.roadTool.toLowerCase().includes(needle));
  const roadRecommended = currentStep(state)?.road === true;
  const advice = guideLine(game, group);
  return (
    <section
      className="imp-panel imp-open flex max-h-full min-h-0 w-full flex-col text-sm"
      data-testid="imp-build-menu"
    >
      <header className="flex flex-wrap items-center gap-2 px-3 pt-2.5">
        <span className="imp-medal h-9 w-9">
          <Icon name={meta.icon} size={20} className="imp-gold" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="imp-title text-base">{meta.name}</h2>
          <p className="imp-muted hidden text-xs sm:block">{meta.line}</p>
        </div>
        <label className="imp-inset flex items-center gap-1 px-2 py-1">
          <Icon name="search" size={14} className="imp-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={HUD.search}
            aria-label={HUD.searchLabel}
            data-testid="imp-build-search"
            className="w-28 bg-transparent text-xs outline-none placeholder:text-[var(--imp-faint)] sm:w-40"
          />
        </label>
        <IconBtn
          icon="close"
          tip="Schließen (Esc)"
          onClick={onClose}
          testId="imp-build-close"
          size={26}
        />
      </header>
      <div className="imp-rule mx-3 my-1.5" />
      {advice !== null && (
        <p
          className="imp-guide mx-3 mb-1.5 flex items-start gap-1.5 px-2 py-1 text-xs"
          data-testid="imp-build-advice"
        >
          <Icon name="star" size={14} className="imp-gold mt-px shrink-0" />
          <span>{advice}</span>
        </p>
      )}
      <div className="imp-scroll grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-y-auto px-3 pb-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {showRoad && (
          <button
            type="button"
            className="imp-tile"
            aria-pressed={tool.type === "road"}
            data-recommended={roadRecommended}
            data-tip={`${HUD.roadTool}\n${HUD.roadTip}${
              roadRecommended ? `\n${TUTORIAL.recommendedTip}` : ""
            }`}
            data-testid="imp-tool-road"
            onClick={(event) => {
              onTool(
                tool.type === "road" ? { type: "select" } : { type: "road" },
              );
              event.currentTarget.blur();
            }}
          >
            <div className="flex items-center gap-2">
              <span className="imp-medal h-12 w-12">
                <Icon name="road" size={28} className="imp-gold" />
              </span>
              <div className="min-w-0">
                <div className="imp-display truncate text-[13px]">
                  {HUD.roadTool}
                </div>
                <div className="imp-muted text-[11px]">T</div>
              </div>
            </div>
            <div className="imp-muted text-[11px] leading-snug">
              {T.hintRoadStart}
            </div>
            {roadRecommended && <RecommendedBadge />}
          </button>
        )}
        {showRoad && (
          <button
            type="button"
            className="imp-tile"
            aria-pressed={tool.type === "pave"}
            data-tip={`${HUD.paveTool}
${HUD.paveTip(PAVE_COST.gold, PAVE_COST.stone ?? 0)}`}
            data-testid="imp-tool-pave"
            onClick={(event) => {
              onTool(
                tool.type === "pave" ? { type: "select" } : { type: "pave" },
              );
              event.currentTarget.blur();
            }}
          >
            <div className="flex items-center gap-2">
              <span className="imp-medal h-12 w-12">
                <Icon name="road" size={28} className="text-[#d4d4d8]" />
              </span>
              <div className="min-w-0">
                <div className="imp-display truncate text-[13px]">
                  {HUD.paveTool}
                </div>
                <div className="imp-muted text-[11px]">{HUD.paveKey}</div>
              </div>
            </div>
            <div className="imp-muted text-[11px] leading-snug">
              {T.hintPaveStart}
            </div>
          </button>
        )}
        {defs.map((def) => (
          <BuildTile
            key={def.kind}
            game={game}
            island={island}
            def={def}
            chosen={tool.type === "build" && tool.kind === def.kind}
            onChoose={() =>
              onTool(
                tool.type === "build" && tool.kind === def.kind
                  ? { type: "select" }
                  : { type: "build", kind: def.kind, rot: 0 },
              )
            }
          />
        ))}
        {defs.length === 0 && !showRoad && (
          <p className="imp-muted col-span-full py-4 text-center">
            {HUD.noMatch}
          </p>
        )}
      </div>
    </section>
  );
}

/** One building of the build window. */
function BuildTile({
  game,
  island,
  def,
  chosen,
  onChoose,
}: {
  readonly game: Game;
  readonly island: number;
  readonly def: BuildingDef;
  readonly chosen: boolean;
  readonly onChoose: () => void;
}): ReactElement {
  const usual = buildOpen(game, HUMAN, def.kind);
  // The guided start only holds back what the usual rules already open.
  const held = usual && guidedHolds(game, HUMAN, def.kind);
  const unlocked = usual && !held;
  const recommended = tutorialRecommends(game.tutorial, def.kind);
  const stock = game.islands[island]?.stock;
  const needs = held ? [tutorialLockText(def.kind)] : unlockNeeds(def);
  const { gold, ...goods } = def.cost;
  const tip = [
    BUILDING_NAMES[def.kind],
    BUILDING_INFO[def.kind],
    `${T.costs}: ${goldText(gold)} Gold${Object.entries(goods)
      .map(
        ([good, amount]) =>
          `, ${amount} ${GOOD_NAMES[good as keyof typeof GOOD_NAMES]}`,
      )
      .join("")}`,
    `${T.upkeep}: ${def.upkeep}${T.perMinute}`,
    unlocked ? HUD.canBuild : `${HUD.unlockNeeds}: ${needs.join(", ")}`,
    ...(recommended ? [TUTORIAL.recommendedTip] : []),
  ].join("\n");
  return (
    <button
      type="button"
      className="imp-tile"
      aria-pressed={chosen}
      data-locked={!unlocked}
      data-recommended={recommended}
      disabled={!unlocked}
      data-tip={tip}
      data-testid={`imp-build-${def.kind}`}
      onClick={(event) => {
        onChoose();
        event.currentTarget.blur();
      }}
    >
      <div className="flex items-center gap-2">
        <BuildingArt kind={def.kind} size={46} />
        <div className="min-w-0">
          <div className="imp-display truncate text-[13px] leading-tight">
            {BUILDING_NAMES[def.kind]}
          </div>
          <div className="imp-muted text-[11px]">{HUD.size(def.w, def.h)}</div>
        </div>
      </div>
      <div className="text-xs">
        <CostLine
          cost={def.cost}
          stock={stock}
          gold={game.cheat ? undefined : game.players[HUMAN].gold}
        />
      </div>
      <div className="imp-muted flex flex-wrap gap-x-2 text-[11px]">
        <span>
          {T.upkeep} {def.upkeep}
          {T.perMinute}
        </span>
        {def.workers !== null && (
          <span>
            {def.workers.count} {TIER_NAMES[def.workers.tier]}
          </span>
        )}
      </div>
      {!unlocked && (
        <div
          className="flex min-w-0 items-center gap-1 text-[11px] text-[var(--imp-warn)]"
          aria-label={`${HUD.locked}: ${needs.join(", ")}`}
        >
          <Icon name="warning" size={12} className="shrink-0" />
          {/* One line; the tooltip of the tile holds the whole text. */}
          <span className="truncate">{needs.join(", ")}</span>
        </div>
      )}
      {recommended && <RecommendedBadge />}
    </button>
  );
}

/** The badge of a recommended tile. */
function RecommendedBadge(): ReactElement {
  return (
    <span className="imp-tile-badge" data-testid="imp-recommended">
      <Icon name="star" size={10} /> {TUTORIAL.recommended}
    </span>
  );
}

/** Whether a category holds what the current task recommends. */
function groupRecommended(game: Game, group: BuildGroup): boolean {
  const step = currentStep(game.tutorial);
  return (
    step !== null &&
    ((step.road && group === "infrastructure") ||
      step.recommended.some((kind) => groupOf(BUILDING[kind]) === group))
  );
}

/**
 * Whether a category offers anything to build now: a building open by the
 * usual rules and the guided start, or the road tool.
 */
function groupAvailable(game: Game, group: BuildGroup): boolean {
  return (
    group === "infrastructure" ||
    BUILDINGS.some(
      (def) =>
        groupOf(def) === group &&
        buildOpen(game, HUMAN, def.kind) &&
        !guidedHolds(game, HUMAN, def.kind),
    )
  );
}

/**
 * The line of the guided start above the tiles: the recommended building
 * of this category and why, or first the island to find.
 */
function guideLine(game: Game, group: BuildGroup): string | null {
  const step = currentStep(game.tutorial);
  let line: string | null = null;
  if (step !== null) {
    const why = TUTORIAL_STEP_TEXTS[step.id].why;
    const kind = step.recommended.find(
      (item) => groupOf(BUILDING[item]) === group,
    );
    if (step.id === "explore") {
      line = TUTORIAL.findIslandFirst;
    } else if (kind !== undefined) {
      line = TUTORIAL.recommendedLine(BUILDING_NAMES[kind], why);
    } else if (step.road && group === "infrastructure") {
      line = TUTORIAL.recommendedLine(HUD.roadTool, why);
    }
  }
  return line;
}

/** What a building still waits for, in words. */
function unlockNeeds(def: BuildingDef): string[] {
  const needs: string[] = [];
  if (def.unlock !== null) {
    needs.push(
      HUD.unlockResidents(def.unlock.residents, TIER_NAMES[def.unlock.tier]),
    );
  }
  if (def.research !== null) {
    needs.push(HUD.unlockResearch(RESEARCH_NAMES[def.research]));
  }
  return needs;
}

/** Props of {@link BuildModeBar}. */
type BuildModeBarProps = {
  readonly game: Game;
  readonly island: number;
  readonly tool: Tool;
  readonly hint: Hint | null;
  readonly onTool: (tool: Tool) => void;
  readonly touch: boolean;
};

/**
 * The strip of the build mode: what is being placed and how.
 *
 * @param props - game, paying island, tool, hint and actions
 * @returns the strip, or null without a tool
 */
export function BuildModeBar({
  game,
  island,
  tool,
  hint,
  onTool,
  touch,
}: BuildModeBarProps): ReactElement | null {
  const human = game.players[HUMAN];
  const stock = game.islands[island]?.stock;
  const verdict = hintVerdict(hint);
  let content: ReactElement | null = null;
  if (tool.type !== "select") {
    const placing = tool.type === "build" || tool.type === "relocate";
    const kind = placing ? tool.kind : null;
    content = (
      <Panel
        className="imp-open flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2"
        testId="imp-build-mode"
      >
        {kind !== null ? (
          <BuildingArt kind={kind} size={38} />
        ) : (
          <span className="imp-medal h-9 w-9">
            <Icon name={modeIcon(tool)} size={20} className="imp-gold" />
          </span>
        )}
        <div className="min-w-0">
          <div className="imp-muted text-[10px] tracking-widest uppercase">
            {modeName(tool)}
          </div>
          <div className="imp-title text-sm">
            {kind !== null ? BUILDING_NAMES[kind] : modeName(tool)}
          </div>
          {placing && (
            <div className="imp-muted text-[10px]" data-testid="imp-rotation">
              {HUD.rotation(tool.rot * QUARTER_DEGREES)}
            </div>
          )}
        </div>
        {tool.type === "build" && (
          <div className="flex flex-col gap-0.5 text-xs">
            <span className="imp-muted text-[10px]">{T.costs}</span>
            <CostLine
              cost={BUILDING[tool.kind].cost}
              stock={stock}
              gold={game.cheat ? undefined : human.gold}
            />
          </div>
        )}
        {tool.type === "build" && (
          <div
            className="hidden flex-col gap-0.5 text-xs lg:flex"
            data-tip={HUD.available}
          >
            <span className="imp-muted text-[10px]">{HUD.available}</span>
            <CostLine cost={availableOf(game, island, tool.kind)} />
          </div>
        )}
        <div
          className="flex min-w-0 flex-1 items-center gap-1.5 text-xs"
          data-testid="imp-hint"
        >
          {verdict !== null && (
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                verdict === "ok"
                  ? "bg-[#4ade80]"
                  : verdict === "limited"
                    ? "bg-[#facc15]"
                    : "bg-[#ef4444]"
              }`}
            />
          )}
          <span className="min-w-0">
            {hint === null
              ? HUD.pointHint
              : hint.type === "placement" &&
                  hint.issue === "tutorial" &&
                  kind !== null
                ? `${HUD.cannotBuild}: ${tutorialLockText(kind)}`
                : hintText(hint)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {placing && (
            <Btn
              small
              icon="rotate"
              tip={HUD.rotateTip}
              onClick={() =>
                onTool({ ...tool, rot: (tool.rot + 1) % QUARTER_TURNS })
              }
              testId="imp-rotate"
            >
              {HUD.rotate}
            </Btn>
          )}
          <Btn
            small
            icon="close"
            tip={HUD.cancelTip}
            onClick={() => onTool({ type: "select" })}
            testId="imp-tool-cancel"
          >
            {HUD.cancel}
          </Btn>
        </div>
        <p className="imp-faint w-full text-[10px] leading-tight">
          {touch ? HUD.controlsTouch : HUD.controls}
        </p>
      </Panel>
    );
  }
  return content;
}

/** Gold and the goods a building costs, as the island has them. */
function availableOf(
  game: Game,
  island: number,
  kind: BuildingKind,
): { gold: number } & Partial<Record<keyof typeof GOOD_NAMES, number>> {
  const stock = game.islands[island]?.stock;
  const result: { gold: number } & Partial<
    Record<keyof typeof GOOD_NAMES, number>
  > = {
    gold: Math.floor(game.players[HUMAN].gold),
  };
  const goods = Object.keys(BUILDING[kind].cost).filter(
    (good) => good !== "gold",
  ) as (keyof typeof GOOD_NAMES)[];
  for (const good of goods) {
    result[good] = Math.floor(stock?.[good] ?? 0);
  }
  return result;
}

/** Whether the spot is fine, fine with a catch, or impossible. */
function hintVerdict(hint: Hint | null): "ok" | "limited" | "no" | null {
  let verdict: "ok" | "limited" | "no" | null = null;
  if (hint?.type === "placement") {
    verdict = hint.issue !== null ? "no" : hint.noRoad ? "limited" : "ok";
  } else if (hint?.type === "road") {
    verdict = hint.blocked ? "no" : "ok";
  } else if (hint?.type === "sail") {
    verdict = hint.water ? "ok" : "no";
  }
  return verdict;
}

/** The name of a tool's mode. */
function modeName(tool: Tool): string {
  let name: string;
  switch (tool.type) {
    case "build":
      name = HUD.buildMode;
      break;
    case "road":
      name = HUD.roadMode;
      break;
    case "pave":
      name = HUD.paveMode;
      break;
    case "demolish":
      name = HUD.demolishMode;
      break;
    case "relocate":
      name = HUD.relocateMode;
      break;
    case "patrol":
      name = HUD.patrolMode;
      break;
    default:
      name = HUD.sailMode;
  }
  return name;
}

/** The symbol of a tool's mode. */
function modeIcon(tool: Tool): IconName {
  let icon: IconName;
  switch (tool.type) {
    case "road":
    case "pave":
      icon = "road";
      break;
    case "demolish":
      icon = "hammer";
      break;
    case "sail":
      icon = "ship";
      break;
    case "patrol":
      icon = "map";
      break;
    default:
      icon = "move";
  }
  return icon;
}

/** The words for the road and the paving tool. */
function roadHint(hint: Extract<Hint, { type: "road" }>): string {
  let text: string;
  if (hint.pave) {
    text = hint.blocked
      ? T.hintPaveBlocked
      : hint.tiles > 0
        ? T.hintPave(hint.tiles, hint.gold, hint.stone)
        : T.hintPaveStart;
  } else {
    text = hint.blocked
      ? T.hintRoadBlocked
      : hint.tiles > 0
        ? T.hintRoad(hint.tiles, hint.gold)
        : T.hintRoadStart;
  }
  return text;
}

/**
 * The words for a hint under the pointer.
 *
 * @param hint - the hint
 * @returns the text
 */
export function hintText(hint: Hint): string {
  let text: string;
  switch (hint.type) {
    case "placement":
      text =
        hint.issue !== null
          ? `${HUD.cannotBuild}: ${ISSUE_TEXTS[hint.issue]}`
          : hint.noRoad
            ? HUD.limited
            : HUD.canBuild;
      break;
    case "road":
      text = roadHint(hint);
      break;
    case "demolish":
      text = T.hintDemolish[hint.what];
      break;
    default:
      text = T.hintSail(hint.water);
  }
  return text;
}
