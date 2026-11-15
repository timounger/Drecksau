/**
 * The diplomacy window: every power together - the rivals first, then the
 * foreign peoples, then the pirate bands - each with what it thinks of the
 * player and why, its status and what can be done with it; for the rivals
 * proposals, gifts, demands and trades of goods, their offers and the log
 * of answers. A filter shows one kind at a time.
 *
 * @module
 */
"use client";

import { useState, type ReactElement } from "react";
import { strengthOf } from "@/games/imperavis/engine/combat";
import {
  opinionOf,
  opinionReasons,
  relationOf,
  reputationOf,
} from "@/games/imperavis/engine/diplomacy";
import { GOOD_IDS } from "@/games/imperavis/engine/goods";
import { HUMAN, islandsOf, playerById } from "@/games/imperavis/engine/players";
import { populationOf } from "@/games/imperavis/engine/population";
import type {
  Deal,
  DiplomacyAction,
  GoodId,
  Player,
  Treaty,
} from "@/games/imperavis/engine/types";
import {
  ANSWER_TEXTS,
  GOOD_NAMES,
  PERSONALITY_NAMES,
  REASON_NAMES,
  TEXTS as T,
  TREATY_NAMES,
} from "@/games/imperavis/i18n/texts";
import { FX } from "@/games/imperavis/i18n/faction-texts";
import { NationEntry, PirateEntry } from "./faction-diplomacy";
import { Crest } from "./icons";
import type { OverviewProps } from "./overviews";
import { GoldDeals, PowerCard, signed } from "./power-card";
import { Btn, Tabs } from "./ui";

/** Units in a goods deal unless changed. */
const DEAL_UNITS = 20;

/** Log entries shown. */
const LOG_SHOWN = 8;

/** Crest size in the list, px. */
const CREST = 32;

/** The treaties in the order of the buttons. */
const TREATIES: readonly Treaty[] = ["trade", "pact", "alliance"];

/** Which powers the list shows. */
type Filter = "all" | "rivals" | "nations" | "pirates";

/**
 * Renders the diplomacy window.
 *
 * @param props - the game, the island in view and the command door
 * @returns the panel
 */
export function Diplomacy(props: OverviewProps): ReactElement {
  const { game, island, onCommand } = props;
  const [filter, setFilter] = useState<Filter>("all");
  const rivals = game.players.filter((player) => player.ai !== null);
  const nations = game.factions.filter((f) => f.kind === "nation");
  const bands = game.factions.filter((f) => f.kind === "pirates");
  const show = (kind: Filter) => filter === "all" || filter === kind;
  const filters: { id: Filter; label: string }[] = [
    {
      id: "all",
      label: `${FX.filterAll} (${rivals.length + game.factions.length})`,
    },
    { id: "rivals", label: `${FX.filterRivals} (${rivals.length})` },
    { id: "nations", label: `${FX.filterNations} (${nations.length})` },
    { id: "pirates", label: `${FX.filterPirates} (${bands.length})` },
  ];
  const human = game.players[HUMAN];
  const offers = game.diplomacy.offers.filter((offer) => offer.to === HUMAN);
  const log = game.diplomacy.log
    .filter((entry) => entry.from === HUMAN || entry.to === HUMAN)
    .slice(-LOG_SHOWN)
    .reverse();
  return (
    <div className="flex flex-col gap-3 text-sm" data-testid="imp-diplomacy">
      <p>
        {T.yourReputation}:{" "}
        <b data-testid="imp-reputation">{Math.round(reputationOf(human))}</b>
        {human.reputation.length > 0 && (
          <span className="text-xs imp-muted">
            {" "}
            (
            {human.reputation
              .map((m) => `${REASON_NAMES[m.reason]} ${signed(m.value)}`)
              .join(", ")}
            )
          </span>
        )}
      </p>
      {game.settings.peaceful && (
        <p className="text-xs text-[var(--imp-good)]">{T.peacefulGame}</p>
      )}
      {offers.length > 0 && (
        <section>
          <h3 className="mb-1 imp-title text-[0.8rem]">{T.offersToYou}</h3>
          <ul className="flex flex-col gap-1">
            {offers.map((offer) => (
              <li
                key={offer.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-400 p-2"
                data-testid="imp-offer"
              >
                <span className="flex-1">
                  <b>{playerById(game, offer.from)?.name}</b>{" "}
                  {offerText(offer.action)}{" "}
                  <span className="text-xs imp-muted">
                    {T.expiresIn(Math.round(offer.expires - game.time))}
                  </span>
                </span>
                <Btn
                  small
                  onClick={() =>
                    onCommand({
                      type: "answer",
                      offer: offer.id,
                      accept: true,
                      island,
                    })
                  }
                  testId="imp-offer-accept"
                >
                  {T.accept}
                </Btn>
                <Btn
                  small
                  onClick={() =>
                    onCommand({
                      type: "answer",
                      offer: offer.id,
                      accept: false,
                      island,
                    })
                  }
                  testId="imp-offer-decline"
                >
                  {T.decline}
                </Btn>
              </li>
            ))}
          </ul>
        </section>
      )}
      {game.factions.length > 0 && (
        <Tabs
          tabs={filters}
          value={filter}
          onChange={setFilter}
          testPrefix="imp-dip-filter"
        />
      )}
      {show("rivals") &&
        (rivals.length === 0 ? (
          <p className="imp-muted">{T.noRivals}</p>
        ) : (
          rivals.map((rival) => (
            <Rival key={rival.id} {...props} rival={rival} />
          ))
        ))}
      {(show("nations") || show("pirates")) && game.factions.length === 0 && (
        <p className="imp-muted">{FX.noFactions}</p>
      )}
      {show("nations") &&
        nations.map((faction) => (
          <NationEntry key={faction.id} {...props} faction={faction} />
        ))}
      {show("pirates") &&
        bands.map((faction) => (
          <PirateEntry key={faction.id} {...props} faction={faction} />
        ))}
      {game.factions.length > 0 && (
        <p className="text-xs imp-muted">{FX.harbourHint}</p>
      )}
      {log.length > 0 && (
        <section>
          <h3 className="mb-1 imp-title text-[0.8rem]">{T.historyLog}</h3>
          <ul
            className="flex flex-col gap-0.5 text-xs"
            data-testid="imp-dip-log"
          >
            {log.map((entry, index) => (
              <li key={`${entry.time}-${index}`}>
                {playerById(game, entry.from)?.name} -{" "}
                {playerById(game, entry.to)?.name}:{" "}
                {T.actionNames[entry.action.type]} -{" "}
                {ANSWER_TEXTS[entry.answer]}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** One rival: standing, reasons and what can be proposed. */
function Rival({
  game,
  island,
  onCommand,
  rival,
}: OverviewProps & { readonly rival: Player }): ReactElement {
  const [give, setGive] = useState<GoodId>("planks");
  const [take, setTake] = useState<GoodId | "gold">("gold");
  const [giveAmount, setGiveAmount] = useState(DEAL_UNITS);
  const [takeAmount, setTakeAmount] = useState(DEAL_UNITS * DEAL_UNITS);
  const relation = relationOf(game, HUMAN, rival.id);
  const opinion = opinionOf(game, rival.id, HUMAN);
  const act = (action: DiplomacyAction) =>
    onCommand({ type: "diplomacy", to: rival.id, action, island });
  const takeDeal: Deal =
    take === "gold"
      ? { gold: takeAmount, good: null, amount: 0 }
      : { gold: 0, good: take, amount: takeAmount };
  const war = relation?.war === true;
  return (
    <PowerCard
      emblem={<Crest color={rival.color} size={CREST} variant={rival.id} />}
      name={rival.name}
      kind={FX.kindRival}
      status={rival.alive ? (war ? T.atWar : T.atPeace) : ANSWER_TEXTS.gone}
      tone={!rival.alive ? "plain" : war ? "bad" : "good"}
      sub={`${T.personality}: ${PERSONALITY_NAMES[rival.ai?.personality ?? "trader"]}`}
      facts={`${T.islandsOf(islandsOf(game, rival.id).length)} - ${T.residentsOf(populationOf(game, rival.id))} - ${T.strength} ${Math.round(strengthOf(game, rival.id))} (${T.yourStrength} ${Math.round(strengthOf(game, HUMAN))})`}
      opinion={opinion}
      bar={opinion < 0 ? "bg-red-500" : "bg-emerald-500"}
      reasons={opinionReasons(game, rival.id, HUMAN)}
      opinionId={`imp-opinion-${rival.id}`}
      testId={`imp-rival-${rival.id}`}
      power="rival"
    >
      <p className="mt-1 text-xs">
        {TREATIES.filter((treaty) => relation?.[treaty] === true)
          .map((treaty) => TREATY_NAMES[treaty])
          .join(", ")}
      </p>
      {rival.alive && relation !== null && (
        <div className="mt-1 flex flex-wrap gap-1">
          {TREATIES.map((treaty) =>
            relation[treaty] ? (
              <Btn
                key={treaty}
                small
                onClick={() => act({ type: "cancel", treaty })}
                testId={`imp-cancel-${treaty}-${rival.id}`}
              >
                {T.cancelTreaty(TREATY_NAMES[treaty])}
              </Btn>
            ) : (
              <Btn
                key={treaty}
                small
                disabled={relation.war}
                onClick={() => act({ type: "propose", treaty })}
                testId={`imp-propose-${treaty}-${rival.id}`}
              >
                {T.proposeTreaty(TREATY_NAMES[treaty])}
              </Btn>
            ),
          )}
          {relation.war ? (
            <Btn
              small
              onClick={() => act({ type: "peace" })}
              testId={`imp-peace-${rival.id}`}
            >
              {T.offerPeace}
            </Btn>
          ) : (
            <Btn
              small
              disabled={game.settings.peaceful || relation.pact}
              onClick={() => act({ type: "war" })}
              testId={`imp-war-${rival.id}`}
            >
              {T.declareWar}
            </Btn>
          )}
          <GoldDeals
            testKey={String(rival.id)}
            onGift={(gold) =>
              act({ type: "gift", give: { gold, good: null, amount: 0 } })
            }
            onDemand={(gold) =>
              act({ type: "demand", take: { gold, good: null, amount: 0 } })
            }
            demandClosed={relation.war}
          />
        </div>
      )}
      {rival.alive && relation !== null && !relation.war && (
        <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
          <span className="imp-title text-[0.8rem]">{T.goodsDeal}:</span>
          <span>{T.youGive}</span>
          <input
            type="number"
            min={1}
            value={giveAmount}
            onChange={(event) =>
              setGiveAmount(Math.max(1, Number(event.target.value)))
            }
            className="imp-input w-14"
          />
          <GoodSelect
            value={give}
            onChange={setGive}
            testId={`imp-give-${rival.id}`}
          />
          <span>{T.youGet}</span>
          <input
            type="number"
            min={1}
            value={takeAmount}
            onChange={(event) =>
              setTakeAmount(Math.max(1, Number(event.target.value)))
            }
            className="imp-input w-16"
          />
          <select
            value={take}
            onChange={(event) => setTake(event.target.value as GoodId | "gold")}
            className="imp-input"
            data-testid={`imp-take-${rival.id}`}
          >
            <option value="gold">{T.goldLabel}</option>
            {GOOD_IDS.map((good) => (
              <option key={good} value={good}>
                {GOOD_NAMES[good]}
              </option>
            ))}
          </select>
          <Btn
            small
            onClick={() =>
              act({
                type: "trade",
                give: { gold: 0, good: give, amount: giveAmount },
                take: takeDeal,
              })
            }
            testId={`imp-trade-${rival.id}`}
          >
            {T.proposeTrade}
          </Btn>
          <Btn
            small
            onClick={() =>
              act({
                type: "gift",
                give: { gold: 0, good: give, amount: giveAmount },
              })
            }
          >
            {T.giftGoods}
          </Btn>
          <span className="w-full imp-muted">
            {T.dealFrom(game.world.islands[island]?.name ?? "")}
          </span>
        </div>
      )}
    </PowerCard>
  );
}

/** A list of goods to pick from. */
function GoodSelect({
  value,
  onChange,
  testId,
}: {
  readonly value: GoodId;
  readonly onChange: (good: GoodId) => void;
  readonly testId: string;
}): ReactElement {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as GoodId)}
      className="imp-input"
      data-testid={testId}
    >
      {GOOD_IDS.map((good) => (
        <option key={good} value={good}>
          {GOOD_NAMES[good]}
        </option>
      ))}
    </select>
  );
}

/** What an offer of a rival is about, in words. */
function offerText(action: DiplomacyAction): string {
  let text: string;
  switch (action.type) {
    case "propose":
      text = T.wantsTreaty(TREATY_NAMES[action.treaty]);
      break;
    case "peace":
      text = T.wantsPeace;
      break;
    case "demand":
      text = T.wantsTribute(dealText(action.take));
      break;
    case "trade":
      text = T.wantsTrade(dealText(action.give), dealText(action.take));
      break;
    default:
      text = T.actionNames[action.type];
  }
  return text;
}

/** One side of a deal, in words. */
function dealText(deal: Deal): string {
  const parts: string[] = [];
  if (deal.gold > 0) {
    parts.push(`${deal.gold} ${T.goldLabel}`);
  }
  if (deal.good !== null && deal.amount > 0) {
    parts.push(`${deal.amount} ${GOOD_NAMES[deal.good]}`);
  }
  return parts.join(" + ");
}
