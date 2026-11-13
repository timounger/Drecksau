/**
 * The notifications: what an event of the game says and how much it
 * matters, and what the screen notices on its own by watching the state -
 * full warehouses, blocked routes, stalled producers, a kontor under fire,
 * growth and discontent.
 *
 * @module
 * @remarks
 * Only reads the game; nothing here changes it. The watch keeps what it saw
 * last, so each change is told once, and its first look only takes notes,
 * so a freshly loaded game does not flood the corner.
 */
import {
  TUTORIAL_STEPS,
  tutorialHolds,
} from "@/games/imperavis/engine/tutorial-data";
import { HUMAN, playerById } from "@/games/imperavis/engine/players";
import { capacityOf } from "@/games/imperavis/engine/warehouse";
import { GOOD_IDS } from "@/games/imperavis/engine/goods";
import type {
  Building,
  Game,
  GameEvent,
  ProducerStatus,
} from "@/games/imperavis/engine/types";
import {
  ANSWER_TEXTS,
  BUILDING_NAMES,
  GOOD_NAMES,
  INCIDENT_NAMES,
  MISSION_KIND_NAMES,
  RESEARCH_NAMES,
  SEASON_NAMES,
  SHIP_NAMES,
  STATUS_TEXTS,
  TEXTS as T,
  TIER_NAMES,
  TREATY_NAMES,
} from "@/games/imperavis/i18n/texts";
import { HUD } from "@/games/imperavis/i18n/hud-texts";
import {
  TUTORIAL,
  TUTORIAL_STEP_TEXTS,
} from "@/games/imperavis/i18n/tutorial-texts";
import type { Message, MessageLevel, News } from "./use-imperavis";

/** Residents between two "the town has grown" messages. */
const GROWTH_STEP = 100;

/** Mean satisfaction below this is told as discontent. */
const UNHAPPY = 0.4;

/** Discontent is told again only after the mood rose above this. */
const CONTENT = 0.5;

/** A stock this share below the room counts as no longer full. */
const NOT_FULL = 0.95;

/** Game seconds after a hit in which a kontor counts as attacked. */
const UNDER_FIRE = 3;

/** Game seconds before the same kontor is told as attacked again. */
const FIRE_QUIET = 60;

/** Producer states told as a stop: they do not go away by themselves. */
const STOPS: readonly ProducerStatus[] = ["noWorkers", "noResource", "noRoad"];

/** Percent of a share. */
const PERCENT = 100;

/** What the watch saw last. */
export type Watch = {
  /** False until the first look took its notes. */
  primed: boolean;
  /** Full stocks as "island:good". */
  full: Set<string>;
  /** Routes that are blocked, by id. */
  blocked: Set<number>;
  /** Producers that stand still for good, by id. */
  stalled: Set<number>;
  /** Kontors under fire and until when they are quiet, by id. */
  fire: Map<number, number>;
  /** The last hundred of residents told. */
  grown: number;
  /** Whether discontent was told and has not passed yet. */
  unhappy: boolean;
};

/**
 * A watch that has not looked yet.
 *
 * @returns it
 */
export function emptyWatch(): Watch {
  return {
    primed: false,
    full: new Set(),
    blocked: new Set(),
    stalled: new Set(),
    fire: new Map(),
    grown: 0,
    unhappy: false,
  };
}

/**
 * Adds a message to the list: alerts stay until confirmed (the oldest go
 * when there are too many), passing ones make room for new ones.
 *
 * @param list - the messages so far
 * @param message - the new one
 * @param passing - most passing messages kept
 * @param alerts - most alerts kept
 * @returns the new list
 */
export function keep(
  list: readonly Message[],
  message: Message,
  passing: number,
  alerts: number,
): Message[] {
  const all = [...list, message];
  const sticky = all.filter((item) => item.level === "alert").slice(-alerts);
  const rest = all.filter((item) => item.level !== "alert").slice(-passing);
  return all.filter((item) => sticky.includes(item) || rest.includes(item));
}

/**
 * Looks at the game and tells what changed since the last look.
 *
 * @param game - the game
 * @param seen - what was seen last, updated
 * @returns the news, often none
 */
export function watch(game: Game, seen: Watch): News[] {
  const news: News[] = [];
  const tellIt = (text: string, level: MessageLevel, where: News["where"]) => {
    if (seen.primed) {
      news.push({ text, level, where });
    }
  };
  watchStock(game, seen, tellIt);
  watchRoutes(game, seen, tellIt);
  watchProducers(game, seen, tellIt);
  watchKontors(game, seen, tellIt);
  watchPeople(game, seen, tellIt);
  seen.primed = true;
  return news;
}

/**
 * A message for an event worth telling, or null.
 *
 * @param game - the game
 * @param event - what happened
 * @returns the news, or null when it is nothing for the human
 */
export function describe(game: Game, event: GameEvent): News | null {
  const islandName = (id: number) => game.world.islands[id]?.name ?? "";
  const islandAt = (id: number) => {
    const info = game.world.islands[id];
    return info === undefined ? null : { x: info.cx, y: info.cy };
  };
  const who = (id: number) => playerById(game, id)?.name ?? T.pirates;
  const own = "player" in event && event.player === HUMAN;
  let text: string | null = null;
  let level: MessageLevel = "info";
  let where: News["where"] = null;
  switch (event.type) {
    case "founded":
      text = own
        ? T.eventFounded(islandName(event.island))
        : T.eventRivalFounded(who(event.player), islandName(event.island));
      where = islandAt(event.island);
      break;
    case "built":
      // Buildings stand the moment they are placed: nothing to report.
      text = null;
      break;
    case "unlocked":
      // Still held back by the guided start: its task will say so.
      text =
        own && !tutorialHolds(game.tutorial, event.kind)
          ? T.eventUnlocked(BUILDING_NAMES[event.kind])
          : null;
      break;
    case "tutorial":
      text = own ? tutorialNews(game, event) : null;
      level = event.state === "finished" ? "warning" : "info";
      break;
    case "upgraded":
      text = own ? T.eventUpgraded(TIER_NAMES[event.tier]) : null;
      where = { x: event.x, y: event.y };
      break;
    case "downgraded":
      text = own ? T.eventDowngraded(TIER_NAMES[event.tier]) : null;
      level = "warning";
      where = { x: event.x, y: event.y };
      break;
    case "levelUp":
      text = own ? T.eventLevelUp(BUILDING_NAMES[event.kind]) : null;
      where = { x: event.x, y: event.y };
      break;
    case "shortage":
      text = own
        ? T.eventShortage(GOOD_NAMES[event.good], islandName(event.island))
        : null;
      level = "warning";
      where = islandAt(event.island);
      break;
    case "shipBuilt":
      text = own ? T.eventShip : null;
      break;
    case "trader":
      text = own
        ? T.eventTrader(islandName(event.island), event.sold, event.bought)
        : null;
      break;
    case "debt":
      text = own ? T.eventDebt : null;
      level = "alert";
      break;
    case "season":
      text = T.eventSeason(SEASON_NAMES[event.season]);
      break;
    case "docked":
      text = own ? T.eventDocked(islandName(event.island)) : null;
      where = islandAt(event.island);
      break;
    case "sunk":
      text = own ? T.eventSunk(SHIP_NAMES[event.kind]) : null;
      level = "alert";
      where = { x: event.x, y: event.y };
      break;
    case "destroyed":
      text = own ? T.eventDestroyed(BUILDING_NAMES[event.kind]) : null;
      level = "warning";
      where = { x: event.x, y: event.y };
      break;
    case "captured":
      text =
        event.from === HUMAN || event.to === HUMAN
          ? T.eventCaptured(islandName(event.island), who(event.to))
          : null;
      level = "alert";
      where = islandAt(event.island);
      break;
    case "plundered":
      text =
        event.player === HUMAN
          ? T.eventPlundered(islandName(event.island))
          : null;
      level = "warning";
      where = islandAt(event.island);
      break;
    case "incident":
      text =
        own || event.kind === "pirates" || event.kind === "storm"
          ? T.eventIncident(
              INCIDENT_NAMES[event.kind],
              event.island >= 0 ? islandName(event.island) : "",
            )
          : null;
      level = event.kind === "goodHarvest" ? "info" : "warning";
      where = { x: event.x, y: event.y };
      break;
    case "fireOut":
      text = own ? T.eventFireOut(BUILDING_NAMES[event.kind]) : null;
      break;
    case "war":
      text = T.eventWar(who(event.a), who(event.b));
      level = event.a === HUMAN || event.b === HUMAN ? "alert" : "info";
      break;
    case "peace":
      text = T.eventPeace(who(event.a), who(event.b));
      break;
    case "treaty":
      text =
        event.a === HUMAN || event.b === HUMAN
          ? T.eventTreaty(
              TREATY_NAMES[event.treaty],
              who(event.a === HUMAN ? event.b : event.a),
              event.signed,
            )
          : null;
      break;
    case "offer":
      text = T.eventOffer(who(event.from));
      level = "warning";
      break;
    case "answer":
      // Things that need no consent are told by their own events.
      text =
        event.from === HUMAN && event.answer !== "accepted"
          ? `${who(event.to)}: ${ANSWER_TEXTS[event.answer]}`
          : null;
      break;
    case "mission": {
      const mission = game.missions.find((m) => m.id === event.mission);
      // Only the human's own orders are told; rivals race quietly.
      text =
        mission === undefined ||
        mission.taker !== HUMAN ||
        event.state === "active"
          ? null
          : T.eventMission(MISSION_KIND_NAMES[mission.kind], event.state);
      level =
        event.state === "done" || event.state === "offered"
          ? "info"
          : "warning";
      break;
    }
    case "trespass":
      // Only what rivals think of the human's soldiers is told.
      text =
        event.intruder === HUMAN
          ? event.war
            ? HUD.trespassWar(who(event.owner))
            : HUD.trespassAngry(who(event.owner))
          : null;
      level = event.war ? "alert" : "warning";
      break;
    case "landed": {
      const mine = game.islands[event.island]?.owner === HUMAN;
      text =
        event.player !== HUMAN && mine
          ? HUD.attackedBy(who(event.player), islandName(event.island))
          : event.player === HUMAN
            ? T.eventLanded(who(event.player), islandName(event.island))
            : null;
      level = event.player !== HUMAN && mine ? "alert" : "info";
      where = islandAt(event.island);
      break;
    }
    case "researched":
      text = own ? T.eventResearched(RESEARCH_NAMES[event.research]) : null;
      break;
    default:
      text = null;
  }
  return text === null ? null : { text, level, where };
}

/**
 * The words for a step of the guided start: the task done and what it put
 * into the build menu, its end, or that the player ended it.
 */
function tutorialNews(
  game: Game,
  event: Extract<GameEvent, { type: "tutorial" }>,
): string {
  let text: string;
  if (event.state === "finished") {
    text = TUTORIAL.finished;
  } else if (event.state === "ended" || event.step === null) {
    text = TUTORIAL.ended;
  } else {
    const index = TUTORIAL_STEPS.findIndex((step) => step.id === event.step);
    const human = game.players[HUMAN];
    // What the next task released and the usual rules already allow.
    const opened = (TUTORIAL_STEPS[index + 1]?.releases ?? []).filter((kind) =>
      human.unlocked.includes(kind),
    );
    const done = TUTORIAL.done(TUTORIAL_STEP_TEXTS[event.step].title);
    text =
      opened.length === 0
        ? done
        : `${done}. ${TUTORIAL.released(
            opened.map((kind) => BUILDING_NAMES[kind]).join(", "),
          )}`;
  }
  return text;
}

/** A function that tells one piece of news. */
type Teller = (text: string, level: MessageLevel, where: News["where"]) => void;

/** Warehouses that ran full. */
function watchStock(game: Game, seen: Watch, tell: Teller): void {
  for (const island of game.islands) {
    if (island.owner === HUMAN && !game.cheat) {
      const room = capacityOf(game, island.id);
      const info = game.world.islands[island.id];
      for (const good of GOOD_IDS) {
        const key = `${island.id}:${good}`;
        const have = island.stock[good];
        if (room > 0 && have >= room && !seen.full.has(key)) {
          seen.full.add(key);
          tell(HUD.storageFull(GOOD_NAMES[good], info.name), "warning", {
            x: info.cx,
            y: info.cy,
          });
        } else if (have < room * NOT_FULL) {
          seen.full.delete(key);
        }
      }
    }
  }
}

/** Trade routes that stopped. */
function watchRoutes(game: Game, seen: Watch, tell: Teller): void {
  for (const route of game.routes) {
    if (route.owner === HUMAN) {
      if (
        route.blocked !== null &&
        route.active &&
        !seen.blocked.has(route.id)
      ) {
        seen.blocked.add(route.id);
        tell(
          HUD.routeBlocked(route.name, T.blockedNames[route.blocked]),
          "warning",
          null,
        );
      } else if (route.blocked === null) {
        seen.blocked.delete(route.id);
      }
    }
  }
}

/** Producers that stand still and will not start by themselves. */
function watchProducers(game: Game, seen: Watch, tell: Teller): void {
  for (const building of game.buildings) {
    const prod = building.prod;
    if (prod !== null && game.islands[building.island].owner === HUMAN) {
      const stopped = STOPS.includes(prod.status);
      if (stopped && !seen.stalled.has(building.id)) {
        seen.stalled.add(building.id);
        tell(
          HUD.productionStopped(
            BUILDING_NAMES[building.kind],
            STATUS_TEXTS[prod.status],
          ),
          "warning",
          centre(building),
        );
      } else if (!stopped) {
        seen.stalled.delete(building.id);
      }
    }
  }
}

/** Own kontors that were hit a moment ago. */
function watchKontors(game: Game, seen: Watch, tell: Teller): void {
  for (const building of game.buildings) {
    if (
      building.kind === "kontor" &&
      game.islands[building.island].owner === HUMAN &&
      building.hitAt > 0 &&
      game.time - building.hitAt < UNDER_FIRE &&
      (seen.fire.get(building.id) ?? 0) < game.time
    ) {
      seen.fire.set(building.id, game.time + FIRE_QUIET);
      tell(
        HUD.kontorAttacked(game.world.islands[building.island].name),
        "alert",
        centre(building),
      );
    }
  }
}

/** Growth by the hundred, and discontent. */
function watchPeople(game: Game, seen: Watch, tell: Teller): void {
  let residents = 0;
  let mood = 0;
  for (const building of game.buildings) {
    const house = building.house;
    if (house !== null && game.islands[building.island].owner === HUMAN) {
      residents += house.residents;
      mood += house.satisfaction * house.residents;
    }
  }
  const step = Math.floor(residents / GROWTH_STEP) * GROWTH_STEP;
  if (step > seen.grown) {
    if (step > 0) {
      tell(HUD.populationGrew(residents), "info", null);
    }
    seen.grown = step;
  }
  const mean = residents > 0 ? mood / residents : 1;
  if (mean < UNHAPPY && !seen.unhappy && residents > 0) {
    seen.unhappy = true;
    tell(HUD.unhappy(Math.round(mean * PERCENT)), "warning", null);
  } else if (mean > CONTENT) {
    seen.unhappy = false;
  }
}

/** The middle of a building, in tiles. */
function centre(building: Building): { x: number; y: number } {
  return { x: building.x + building.w / 2, y: building.y + building.h / 2 };
}
