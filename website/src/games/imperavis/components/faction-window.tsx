/**
 * The harbour window of a foreign people or pirate band: the ruler's
 * portrait, the relation and its reasons, what it sells and buys with
 * prices (bought and sold from a ship lying in its harbour), its missions,
 * its strength and news - and for pirates their activity, known fleet,
 * black market, tavern and danger. Gifts, demands, treaties, contracts,
 * protection money and alliances live in the diplomacy window, which a
 * button here opens.
 *
 * @module
 */
"use client";

import { useState, type ReactElement } from "react";
import { strengthOf } from "@/games/imperavis/engine/combat";
import { relationOf } from "@/games/imperavis/engine/diplomacy";
import { CULTURE } from "@/games/imperavis/engine/factions-data";
import {
  askPrice,
  bidPrice,
  cultureOf,
  demandOf,
  factionById,
  factionOpinion,
  factionReasons,
  forSale,
  offerOf,
  ownerName,
  protectedFrom,
  shipsInHarbour,
  stageOf,
  wantedUnits,
} from "@/games/imperavis/engine/factions";
import { HUMAN } from "@/games/imperavis/engine/players";
import { INTEL_GOLD } from "@/games/imperavis/engine/pirates";
import { SHIP } from "@/games/imperavis/engine/ships-data";
import type {
  Command,
  Faction,
  Game,
  GoodId,
  Ship,
} from "@/games/imperavis/engine/types";
import {
  CULTURE_TEXTS,
  FX,
  MOOD_NAMES,
  NOTE_TEXTS,
  PERK_TEXTS,
  STAGE_BARS,
  STAGE_COLORS,
  STAGE_NAMES,
} from "@/games/imperavis/i18n/faction-texts";
import {
  GOOD_NAMES,
  MISSION_KIND_NAMES,
  REASON_NAMES,
  SHIP_NAMES,
  TEXTS as T,
} from "@/games/imperavis/i18n/texts";
import { FactionCrest, FactionPortrait } from "./faction-art";
import { GoodIcon } from "./icons";
import { Bar, Btn, Fact, goldText, Section, Tabs, Window } from "./ui";

/** The window's tabs. */
type Tab = "overview" | "trade" | "missions" | "pirates" | "news";

/** Units bought or sold with one click, and the larger step. */
const STEP_SMALL = 10;
const STEP_LARGE = 50;

/** Relations run from minus to plus this; the bar shows 0 to 1. */
const RELATION_SPAN = 100;

/** Seconds in a minute. */
const MINUTE = 60;

/** News lines shown. */
const NEWS_SHOWN = 12;

/** Portrait size, px. */
const PORTRAIT = 88;

/** Crest size in lists, px. */
const CREST = 18;

/** Raiders out from which the danger is high, and very high. */
const DANGER_HIGH = 1;
const DANGER_TOP = 2;

/** Props of the faction window. */
export type FactionWindowProps = {
  readonly game: Game;
  /** The faction's id. */
  readonly faction: number;
  readonly onCommand: (command: Command) => boolean;
  readonly onClose: () => void;
  readonly onFocus: (x: number, y: number) => void;
  /** Opens the diplomacy window, where the relation is dealt with. */
  readonly onDiplomacy?: () => void;
};

/**
 * Renders the window of a faction.
 *
 * @param props - the game, the faction and the command door
 * @returns the window, or an empty one when the faction is unknown
 */
export function FactionWindow(props: FactionWindowProps): ReactElement {
  const { game, onClose } = props;
  const faction = factionById(game, props.faction);
  const [tab, setTab] = useState<Tab>("overview");
  let body: ReactElement | null = null;
  if (faction !== null) {
    const pirates = faction.kind === "pirates";
    const tabs: { id: Tab; label: string }[] = [
      { id: "overview", label: FX.overview },
      { id: "trade", label: FX.offer },
      { id: "missions", label: pirates ? FX.tavern : FX.missions },
      ...(pirates ? [{ id: "pirates" as Tab, label: FX.market }] : []),
      { id: "news", label: FX.news },
    ];
    body = (
      <div className="flex flex-col gap-2">
        <Tabs
          tabs={tabs}
          value={tab}
          onChange={setTab}
          testPrefix="imp-fx-tab"
        />
        {tab === "overview" && <Overview {...props} faction={faction} />}
        {tab === "trade" && <Trade {...props} faction={faction} />}
        {tab === "missions" && <Missions {...props} faction={faction} />}
        {tab === "pirates" && <PirateDeals {...props} faction={faction} />}
        {tab === "news" && <News game={game} faction={faction} />}
      </div>
    );
  }
  const def = faction === null ? null : cultureOf(faction);
  return (
    <Window
      title={def?.name ?? FX.harbourWindow}
      icon="anchor"
      subtitle={
        faction === null
          ? undefined
          : FX.islandOf(game.world.islands[faction.island].name)
      }
      onClose={onClose}
      testId="imp-faction"
      closeTestId="imp-faction-close"
      className="h-full w-full max-w-[54rem]"
    >
      {body}
    </Window>
  );
}

/** A faction with the props of the window. */
type FactionProps = Omit<FactionWindowProps, "faction"> & {
  readonly faction: Faction;
};

/** Portrait, description, relation with reasons, mood, strength, fleet. */
function Overview({
  game,
  faction,
  onFocus,
  onDiplomacy,
}: FactionProps): ReactElement {
  const def = cultureOf(faction);
  const info = game.world.islands[faction.island];
  return (
    <div className="flex flex-col gap-2" data-testid="imp-fx-overview">
      <div className="flex flex-wrap items-start gap-3">
        <FactionPortrait culture={faction.culture} size={PORTRAIT} />
        <div className="min-w-0 flex-1 text-xs">
          <p className="imp-title text-[0.85rem]">
            {FX.leader}: {faction.leader}
          </p>
          <p className="mt-1">{CULTURE_TEXTS[faction.culture]}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            <Btn small icon="eye" onClick={() => onFocus(info.cx, info.cy)}>
              {FX.show}
            </Btn>
            {onDiplomacy !== undefined && (
              <Btn
                small
                icon="handshake"
                tip={FX.toDiplomacyTip}
                onClick={onDiplomacy}
                testId="imp-fx-diplomacy"
              >
                {FX.toDiplomacy}
              </Btn>
            )}
          </div>
        </div>
      </div>
      <RelationLine game={game} faction={faction} />
      <Reasons game={game} faction={faction} />
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <Fact label={FX.mood}>{MOOD_NAMES[faction.mood]}</Fact>
        <Fact label={FX.strength}>
          {Math.round(strengthOf(game, faction.id))}
        </Fact>
        <Fact label={FX.gold}>{goldText(faction.gold)}</Fact>
        <Fact label={FX.traded}>{goldText(faction.traded)}</Fact>
        <Fact label={FX.ships}>
          {faction.fleet
            .map((entry) => game.ships.find((s) => s.id === entry.ship))
            .filter((ship): ship is Ship => ship !== undefined)
            .map((ship) => SHIP_NAMES[ship.kind])
            .join(", ") || "-"}
        </Fact>
        <Fact label={FX.island}>{info.name}</Fact>
      </div>
      {def.perk !== null && (
        <p className="text-xs imp-muted">{PERK_TEXTS[def.perk]}</p>
      )}
      {game.settings.peaceful && faction.kind === "pirates" && (
        <p className="text-xs text-[var(--imp-good)]">{FX.peaceful}</p>
      )}
    </div>
  );
}

/** The relation as a value, a stage and a bar. */
function RelationLine({
  game,
  faction,
}: {
  readonly game: Game;
  readonly faction: Faction;
}): ReactElement {
  const opinion = factionOpinion(game, faction, HUMAN);
  const stage = stageOf(opinion);
  return (
    <div data-testid="imp-fx-relation">
      <div className="flex items-center justify-between text-xs">
        <span>{FX.relation}</span>
        <b style={{ color: STAGE_COLORS[stage] }} data-testid="imp-fx-stage">
          {STAGE_NAMES[stage]} ({Math.round(opinion)})
        </b>
      </div>
      <Bar
        value={(opinion + RELATION_SPAN) / (2 * RELATION_SPAN)}
        color={STAGE_BARS[stage]}
      />
    </div>
  );
}

/** Why the faction thinks as it does. */
function Reasons({
  game,
  faction,
}: {
  readonly game: Game;
  readonly faction: Faction;
}): ReactElement {
  const reasons = factionReasons(game, faction, HUMAN).filter(
    (m) => Math.round(m.value) !== 0,
  );
  return (
    <p className="text-xs imp-muted" data-testid="imp-fx-reasons">
      {FX.reasons}:{" "}
      {reasons
        .map(
          (m) =>
            `${REASON_NAMES[m.reason]} ${m.value > 0 ? "+" : ""}${Math.round(m.value)}`,
        )
        .join(", ") || "-"}
    </p>
  );
}

/** Choosing one of the player's ships in the harbour. */
function useHarbourShip(
  game: Game,
  faction: Faction,
): {
  ships: Ship[];
  ship: Ship | null;
  setShip: (id: number) => void;
} {
  const ships = shipsInHarbour(game, faction, HUMAN);
  const [chosen, setChosen] = useState<number>(-1);
  const ship = ships.find((s) => s.id === chosen) ?? ships[0] ?? null;
  return { ships, ship, setShip: setChosen };
}

/** The ship picker and its cargo. */
function ShipPicker({
  ships,
  ship,
  setShip,
}: {
  readonly ships: Ship[];
  readonly ship: Ship | null;
  readonly setShip: (id: number) => void;
}): ReactElement {
  return ships.length === 0 ? (
    <p className="text-xs text-amber-300" data-testid="imp-fx-no-ship">
      {FX.noShipHere}
    </p>
  ) : (
    <div className="flex flex-wrap items-center gap-1 text-xs">
      <span>{FX.inHarbour}:</span>
      {ships.map((s) => (
        <Btn
          key={s.id}
          small
          active={s.id === ship?.id}
          icon="ship"
          onClick={() => setShip(s.id)}
          testId="imp-fx-ship"
        >
          {s.name !== "" ? s.name : SHIP_NAMES[s.kind]}
        </Btn>
      ))}
      {ship !== null && (
        <span className="imp-muted">
          {FX.cargoOf}:{" "}
          {Object.entries(ship.cargo)
            .filter(([, amount]) => (amount ?? 0) > 0)
            .map(
              ([good, amount]) =>
                `${Math.floor(amount ?? 0)} ${GOOD_NAMES[good as GoodId]}`,
            )
            .join(", ") || "-"}
          {" / "}
          {SHIP[ship.kind].slots * SHIP[ship.kind].slotSize}
        </span>
      )}
    </div>
  );
}

/** Offer and demand with prices, bought and sold from a ship in the harbour. */
function Trade({ game, faction, onCommand }: FactionProps): ReactElement {
  const { ships, ship, setShip } = useHarbourShip(game, faction);
  const relation = relationOf(game, faction.id, HUMAN);
  const act = (type: "buy" | "sell", good: GoodId, amount: number) => {
    if (ship !== null) {
      onCommand({
        type: "faction",
        faction: faction.id,
        action: { type, ship: ship.id, good, amount },
        island: -1,
      });
    }
  };
  return (
    <div className="flex flex-col gap-2" data-testid="imp-fx-trade">
      {relation?.trade !== true && (
        <p className="text-xs text-amber-300" data-testid="imp-fx-trade-first">
          {FX.tradeFirst}
        </p>
      )}
      <ShipPicker ships={ships} ship={ship} setShip={setShip} />
      <Section>{FX.offer}</Section>
      <table className="w-full text-xs" data-testid="imp-fx-offer">
        <tbody>
          {offerOf(faction).map((good) => {
            const units = forSale(game, faction, HUMAN, good);
            return (
              <tr key={good} className="border-b border-[var(--imp-brass-lo)]">
                <td className="py-0.5">
                  <span className="flex items-center gap-1">
                    <GoodIcon good={good} size={14} /> {GOOD_NAMES[good]}
                  </span>
                </td>
                <td className="text-right tabular-nums">
                  {Math.floor(faction.stock[good])} ({units})
                </td>
                <td
                  className="text-right tabular-nums"
                  data-testid="imp-fx-ask"
                >
                  {Math.round(askPrice(game, faction, HUMAN, good))}
                </td>
                <td className="text-right">
                  <Btn
                    small
                    disabled={ship === null || units <= 0}
                    onClick={() => act("buy", good, STEP_SMALL)}
                    testId={`imp-fx-buy-${good}`}
                  >
                    {FX.buy} {STEP_SMALL}
                  </Btn>{" "}
                  <Btn
                    small
                    disabled={ship === null || units <= 0}
                    onClick={() => act("buy", good, STEP_LARGE)}
                  >
                    {STEP_LARGE}
                  </Btn>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Section>{FX.demand}</Section>
      <table className="w-full text-xs" data-testid="imp-fx-demand">
        <tbody>
          {demandOf(faction).map((good) => {
            const cargo = Math.floor(ship?.cargo[good] ?? 0);
            const wanted = wantedUnits(game, faction, HUMAN, good);
            return (
              <tr key={good} className="border-b border-[var(--imp-brass-lo)]">
                <td className="py-0.5">
                  <span className="flex items-center gap-1">
                    <GoodIcon good={good} size={14} /> {GOOD_NAMES[good]}
                  </span>
                </td>
                <td className="text-right tabular-nums">
                  {Math.floor(faction.stock[good])}
                </td>
                <td
                  className="text-right tabular-nums"
                  data-testid="imp-fx-bid"
                >
                  {Math.round(bidPrice(game, faction, HUMAN, good))}
                </td>
                <td className="text-right">
                  <Btn
                    small
                    disabled={cargo <= 0 || wanted <= 0}
                    onClick={() => act("sell", good, STEP_SMALL)}
                    testId={`imp-fx-sell-${good}`}
                  >
                    {FX.sell} {STEP_SMALL}
                  </Btn>{" "}
                  <Btn
                    small
                    disabled={cargo <= 0 || wanted <= 0}
                    onClick={() => act("sell", good, cargo)}
                  >
                    {FX.sellAll}
                  </Btn>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs imp-muted">
        {FX.tableHint}
        {cultureOf(faction).buysSurplus ? ` ${FX.surplus}` : ""}
      </p>
    </div>
  );
}

/** A faction command of the human. */
function factionCommand(
  faction: Faction,
  action: Extract<Command, { type: "faction" }>["action"],
): Command {
  return { type: "faction", faction: faction.id, action, island: -1 };
}

/** The faction's missions: offered, running, with delivery from a ship. */
function Missions({ game, faction, onCommand }: FactionProps): ReactElement {
  const { ships, ship, setShip } = useHarbourShip(game, faction);
  const missions = game.missions.filter(
    (m) =>
      m.giver === faction.id &&
      m.taker === HUMAN &&
      (m.state === "offered" || m.state === "active"),
  );
  return (
    <div className="flex flex-col gap-2 text-xs" data-testid="imp-fx-missions">
      {missions.length === 0 && <p className="imp-muted">{FX.noMissions}</p>}
      {missions.map((m) => {
        const prey = game.ships.find((s) => s.id === m.target);
        return (
          <div
            key={m.id}
            className="rounded border border-[var(--imp-brass-lo)] p-2"
            data-testid="imp-fx-mission"
          >
            <p className="font-semibold">
              {MISSION_KIND_NAMES[m.kind]} - {T.difficulty(m.difficulty)}
            </p>
            <p>
              {m.kind === "cargo"
                ? `${m.goal} ${m.good === null ? "" : GOOD_NAMES[m.good]} (${Math.floor(m.progress)} / ${m.goal})`
                : m.kind === "hunt"
                  ? `${m.goal} Piratenschiffe versenken`
                  : prey === undefined
                    ? "-"
                    : `${SHIP_NAMES[prey.kind]} von ${ownerName(game, prey.owner) ?? ""} versenken`}
              {" - "}
              {T.reward}: {goldText(m.reward.gold)} Gold,{" "}
              {T.relationGain(m.reward.relation)}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {m.state === "offered" ? (
                <>
                  <Btn
                    small
                    onClick={() =>
                      onCommand({ type: "missionAccept", mission: m.id })
                    }
                    testId="imp-fx-mission-accept"
                  >
                    {T.accept}
                  </Btn>
                  <Btn
                    small
                    onClick={() =>
                      onCommand({ type: "missionDecline", mission: m.id })
                    }
                  >
                    {T.decline}
                  </Btn>
                </>
              ) : (
                <>
                  {m.kind === "cargo" && ship !== null && (
                    <Btn
                      small
                      onClick={() =>
                        onCommand(
                          factionCommand(faction, {
                            type: "deliver",
                            mission: m.id,
                            ship: ship.id,
                          }),
                        )
                      }
                      testId="imp-fx-mission-deliver"
                    >
                      {FX.deliver}
                    </Btn>
                  )}
                  <span className="imp-muted">
                    {T.timeLeft(Math.max(0, m.deadline - game.time))}
                  </span>
                </>
              )}
            </div>
          </div>
        );
      })}
      {missions.some((m) => m.kind === "cargo" && m.state === "active") && (
        <ShipPicker ships={ships} ship={ship} setShip={setShip} />
      )}
    </div>
  );
}

/** How dangerous the pirates are right now, 0 to 3. */
function dangerOf(game: Game, faction: Faction): number {
  const out = faction.fleet.filter((s) =>
    ["patrolling", "searching", "chasing", "attacking", "looting"].includes(
      s.state,
    ),
  ).length;
  const calm = game.settings.peaceful || protectedFrom(game, faction, HUMAN);
  return calm
    ? 0
    : out > DANGER_TOP
      ? DANGER_TOP + 1
      : out >= DANGER_HIGH
        ? DANGER_TOP
        : factionOpinion(game, faction, HUMAN) < 0
          ? 1
          : 0;
}

/** The pirates' own business: activity, fleet, protection, black market, maps. */
function PirateDeals({ game, faction, onCommand }: FactionProps): ReactElement {
  const { ships, ship, setShip } = useHarbourShip(game, faction);
  const send = (action: Parameters<typeof factionCommand>[1]) =>
    onCommand(factionCommand(faction, action));
  const deal = faction.protection.find(
    (p) => p.player === HUMAN && p.until > game.time,
  );
  const intel = (faction.intel[String(HUMAN)] ?? 0) > game.time;
  const danger = dangerOf(game, faction);
  const maps = faction.treasures.filter((t) => t.owner === HUMAN);
  const open = faction.market.length > 0 && faction.marketUntil > game.time;
  return (
    <div className="flex flex-col gap-2 text-xs" data-testid="imp-fx-pirates">
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <Fact
          label={FX.danger}
          tone={danger >= DANGER_TOP ? "bad" : danger > 0 ? "warn" : "good"}
          testId="imp-fx-danger"
        >
          {FX.dangerLevels[danger]}
        </Fact>
        <Fact label={FX.piracy}>{MOOD_NAMES[faction.mood]}</Fact>
      </div>
      {faction.demand?.player === HUMAN && (
        <p className="text-amber-300">{FX.demanded}</p>
      )}
      <Section>{FX.knownFleet}</Section>
      {intel ? (
        <ul data-testid="imp-fx-fleet">
          {faction.fleet.map((entry) => {
            const s = game.ships.find((x) => x.id === entry.ship);
            return s === undefined ? null : (
              <li key={entry.ship}>
                {SHIP_NAMES[s.kind]} - {MOOD_NAMES[entry.state]} (
                {Math.round(s.x)}, {Math.round(s.y)})
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="imp-muted">
            {faction.fleet.length} {FX.ships} - {FX.fleetHidden}
          </span>
          <Btn
            small
            icon="eye"
            onClick={() => send({ type: "intel" })}
            testId="imp-fx-intel"
          >
            {FX.intel} ({goldText(INTEL_GOLD)})
          </Btn>
        </div>
      )}
      <Section>{FX.protection}</Section>
      <p data-testid="imp-fx-protection">
        {deal === undefined
          ? FX.protectionNone
          : FX.protectionUntil(
              Math.ceil((deal.until - game.time) / MINUTE),
            )}{" "}
        <span className="imp-muted">{FX.protectionInDiplomacy}</span>
      </p>
      <Section>{FX.market}</Section>
      <ShipPicker ships={ships} ship={ship} setShip={setShip} />
      {open ? (
        <table className="w-full" data-testid="imp-fx-market">
          <tbody>
            {faction.market.map((lot, index) => (
              <tr
                key={`${lot.good}-${index}`}
                className="border-b border-[var(--imp-brass-lo)]"
              >
                <td className="py-0.5">
                  <span className="flex items-center gap-1">
                    <GoodIcon good={lot.good} size={14} />{" "}
                    {GOOD_NAMES[lot.good]}
                  </span>
                </td>
                <td className="text-right tabular-nums">{lot.amount}</td>
                <td className="text-right tabular-nums">{lot.price}</td>
                <td className="text-right">
                  <Btn
                    small
                    disabled={ship === null}
                    onClick={() =>
                      ship !== null &&
                      send({
                        type: "market",
                        ship: ship.id,
                        lot: index,
                        amount: Math.min(lot.amount, STEP_SMALL),
                      })
                    }
                    testId="imp-fx-market-buy"
                  >
                    {FX.buy}
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="imp-muted" data-testid="imp-fx-market-closed">
          {FX.marketClosed}
        </p>
      )}
      <p className="imp-muted">
        {FX.marketUntil(
          Math.max(0, Math.ceil((faction.marketUntil - game.time) / MINUTE)),
        )}
      </p>
      {maps.length > 0 && (
        <>
          <Section>{FX.treasureMaps}</Section>
          <ul>
            {maps.map((t) => (
              <li key={`${t.x}-${t.y}`}>
                {FX.treasureAt(Math.round(t.x), Math.round(t.y))}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** The faction's news, newest first. */
function News({
  game,
  faction,
}: {
  readonly game: Game;
  readonly faction: Faction;
}): ReactElement {
  const notes = faction.notes.slice(-NEWS_SHOWN).reverse();
  return (
    <ul className="flex flex-col gap-0.5 text-xs" data-testid="imp-fx-news">
      {notes.length === 0 && <li className="imp-muted">{FX.noNews}</li>}
      {notes.map((note, index) => (
        <li key={`${note.time}-${index}`}>
          <span className="imp-muted">
            {Math.floor(note.time / MINUTE)} min:{" "}
          </span>
          {NOTE_TEXTS[note.kind](
            note.player >= 0 ? (ownerName(game, note.player) ?? "") : "",
            note.good === null ? "" : GOOD_NAMES[note.good],
            note.amount,
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * One line of a faction for lists: crest, name, stage.
 *
 * @param props - the game and the faction
 * @returns the line
 */
export function FactionLine({
  game,
  faction,
}: {
  readonly game: Game;
  readonly faction: Faction;
}): ReactElement {
  const stage = stageOf(factionOpinion(game, faction, HUMAN));
  return (
    <span className="flex items-center gap-1.5">
      <FactionCrest culture={faction.culture} size={CREST} />
      <span className="flex-1">{CULTURE[faction.culture].name}</span>
      <b style={{ color: STAGE_COLORS[stage] }}>{STAGE_NAMES[stage]}</b>
    </span>
  );
}
