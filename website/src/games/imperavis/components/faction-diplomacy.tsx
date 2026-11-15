/**
 * The peoples and pirate bands in the diplomacy window: each as a card like
 * a rival's, with relation and reasons, status, gifts and demands, trade
 * relations, treaties, help, the art, supply contracts, protection money
 * and the way to an alliance with the pirates - and a button to its harbour.
 *
 * @module
 */
"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import { strengthOf } from "@/games/imperavis/engine/combat";
import { relationOf } from "@/games/imperavis/engine/diplomacy";
import {
  contractGold,
  CONTRACT_LEAST,
  CONTRACT_MOST,
  cultureOf,
  demandOf,
  factionOpinion,
  factionReasons,
  offerOf,
  protectedFrom,
  stageOf,
} from "@/games/imperavis/engine/factions";
import { HUMAN } from "@/games/imperavis/engine/players";
import {
  ALLIANCE_OPINION,
  ALLIANCE_SUNK,
  ALLIANCE_TAKEN,
  allianceProgress,
  protectionPrice,
} from "@/games/imperavis/engine/pirates";
import type {
  Command,
  Faction,
  FactionAction,
  GoodId,
} from "@/games/imperavis/engine/types";
import {
  FX,
  MOOD_NAMES,
  PERK_TEXTS,
  STAGE_BARS,
  STAGE_COLORS,
  STAGE_NAMES,
} from "@/games/imperavis/i18n/faction-texts";
import { GOOD_NAMES, TEXTS as T } from "@/games/imperavis/i18n/texts";
import { FactionCrest } from "./faction-art";
import type { OverviewProps } from "./overviews";
import { GoldDeals, PowerCard, type StatusTone } from "./power-card";
import { Btn, goldText, Section } from "./ui";

/** Crest size in the list, px. */
const CREST = 32;

/** Seconds in a minute. */
const MINUTE = 60;

/** Units of a contract delivery, as offered in the form. */
const CONTRACT_SOME = 25;
const CONTRACT_HALF = 50;
const CONTRACT_STEPS: readonly number[] = [
  CONTRACT_LEAST,
  CONTRACT_SOME,
  CONTRACT_HALF,
  CONTRACT_MOST,
];

/** Props of an entry: the window's props and the faction. */
type EntryProps = OverviewProps & { readonly faction: Faction };

/**
 * A foreign people in the diplomacy window.
 *
 * @param props - the window's props and the people
 * @returns the card
 */
export function NationEntry(props: EntryProps): ReactElement {
  const { game, faction } = props;
  const relation = relationOf(game, faction.id, HUMAN);
  const def = cultureOf(faction);
  const send = sender(props);
  const war = relation?.war === true;
  const cease = faction.ceasefire[String(HUMAN)] ?? 0;
  const support = faction.support;
  const learned = faction.granted.includes(HUMAN);
  const status: [string, StatusTone] = war
    ? [FX.statusWar, "bad"]
    : relation?.alliance === true
      ? [FX.statusAlliance, "good"]
      : relation?.trade === true
        ? [FX.statusTrade, "good"]
        : [FX.statusPeace, "plain"];
  return (
    <FactionCard {...props} kind={FX.kindNation} status={status}>
      <div className="mt-1 flex flex-wrap gap-1">
        {relation?.trade !== true && (
          <Btn
            small
            icon="handshake"
            disabled={war}
            onClick={() => send({ type: "open" })}
            testId={`imp-fx-open-${faction.culture}`}
          >
            {FX.openTrade}
          </Btn>
        )}
        <GoldDeals
          testKey={faction.culture}
          onGift={(gold) => send({ type: "gift", gold })}
          onDemand={(gold) => send({ type: "demand", gold })}
          demandClosed={war}
        />
        {war && (
          <Btn
            small
            icon="handshake"
            onClick={() => send({ type: "ceasefire" })}
            testId={`imp-fx-ceasefire-${faction.culture}`}
          >
            {FX.ceasefireNation}
          </Btn>
        )}
        {def.helps && (
          <>
            <Btn
              small
              icon="swords"
              disabled={war}
              onClick={() => send({ type: "support" })}
              testId={`imp-fx-support-${faction.culture}`}
            >
              {FX.support}
            </Btn>
            <Btn
              small
              icon="cannon"
              disabled={war}
              onClick={() => send({ type: "hunt" })}
              testId={`imp-fx-hunt-${faction.culture}`}
            >
              {FX.hunt}
            </Btn>
          </>
        )}
        {relation?.alliance === true ? (
          <Btn small danger onClick={() => send({ type: "cancelAlliance" })}>
            {FX.cancelAlliance}
          </Btn>
        ) : (
          <Btn
            small
            icon="crown"
            disabled={war}
            onClick={() => send({ type: "alliance" })}
            testId={`imp-fx-alliance-${faction.culture}`}
          >
            {FX.alliance}
          </Btn>
        )}
      </div>
      {cease > game.time && (
        <p className="mt-1 text-xs">
          {FX.ceasefireUntil(Math.ceil((cease - game.time) / MINUTE))}
        </p>
      )}
      {support !== null &&
        support.player === HUMAN &&
        support.until > game.time && (
          <p className="mt-1 text-xs text-[var(--imp-good)]">
            {FX.supportUntil(Math.ceil((support.until - game.time) / MINUTE))}
          </p>
        )}
      {def.perk !== null && (
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <span className="min-w-[14rem] flex-1">{PERK_TEXTS[def.perk]}</span>
          {learned ? (
            <b className="text-[var(--imp-good)]">{FX.learned}</b>
          ) : (
            <>
              <span className="imp-muted">
                {STAGE_NAMES[stageOf(def.perkOpinion)]} -{" "}
                {FX.perkCost(goldText(def.perkGold))}
              </span>
              <Btn
                small
                icon="book"
                onClick={() => send({ type: "learn" })}
                testId={`imp-fx-learn-${faction.culture}`}
              >
                {FX.learn}
              </Btn>
            </>
          )}
        </div>
      )}
      <Contracts {...props} />
    </FactionCard>
  );
}

/**
 * A pirate band in the diplomacy window: always at war, protection money,
 * and the alliance with its condition and progress.
 *
 * @param props - the window's props and the band
 * @returns the card
 */
export function PirateEntry(props: EntryProps): ReactElement {
  const { game, faction } = props;
  const send = sender(props);
  const relation = relationOf(game, faction.id, HUMAN);
  const peaceful = game.settings.peaceful;
  const allied = relation?.alliance === true;
  const deal = faction.protection.find(
    (p) => p.player === HUMAN && p.until > game.time,
  );
  const progress = allianceProgress(faction, HUMAN);
  const status: [string, StatusTone] = peaceful
    ? [FX.statusPeaceful, "good"]
    : allied
      ? [FX.statusAlliance, "good"]
      : protectedFrom(game, faction, HUMAN)
        ? [FX.statusProtected, "warn"]
        : [FX.statusWar, "bad"];
  const key = faction.culture;
  return (
    <FactionCard {...props} kind={FX.kindPirates} status={status}>
      <p className="mt-1 text-xs">
        {peaceful ? FX.peaceful : allied ? FX.pirateAllyHint : FX.pirateWarHint}
      </p>
      <div className="mt-1 flex flex-wrap gap-1">
        <GoldDeals
          testKey={key}
          onGift={(gold) => send({ type: "gift", gold })}
        />
      </div>
      {!peaceful && !allied && (
        <div
          className="mt-1 flex flex-wrap items-center gap-2 text-xs"
          data-testid={`imp-pirate-protection-${key}`}
        >
          <span className="imp-title text-[0.8rem]">{FX.protection}:</span>
          <span className="min-w-0 flex-1">
            {deal === undefined
              ? FX.protectionNone
              : FX.protectionUntil(
                  Math.ceil((deal.until - game.time) / MINUTE),
                )}
          </span>
          {deal === undefined ? (
            <Btn
              small
              icon="coins"
              onClick={() => send({ type: "protection" })}
              testId={`imp-fx-protect-${key}`}
            >
              {FX.protectionSign(goldText(protectionPrice(game, HUMAN)))}
            </Btn>
          ) : (
            <Btn small danger onClick={() => send({ type: "endProtection" })}>
              {FX.protectionEnd}
            </Btn>
          )}
        </div>
      )}
      {!peaceful && (
        <div
          className="mt-1 rounded border border-[var(--imp-brass-lo)] p-2 text-xs"
          data-testid={`imp-pirate-alliance-box-${key}`}
        >
          {allied ? (
            <Btn
              small
              danger
              onClick={() => send({ type: "cancelAlliance" })}
              testId={`imp-pirate-end-${key}`}
            >
              {FX.endAlliance}
            </Btn>
          ) : (
            <>
              <p data-testid={`imp-pirate-progress-${key}`}>
                {FX.allianceProgress(
                  Math.min(progress.sunk, ALLIANCE_SUNK),
                  ALLIANCE_SUNK,
                  Math.min(progress.taken, ALLIANCE_TAKEN),
                  ALLIANCE_TAKEN,
                )}
              </p>
              <p
                className={
                  progress.open ? "text-[var(--imp-good)]" : "text-amber-300"
                }
                data-testid={`imp-pirate-condition-${key}`}
              >
                {progress.open
                  ? FX.allianceOpen(ALLIANCE_OPINION)
                  : FX.allianceLocked}
              </p>
              <Btn
                small
                icon="crown"
                disabled={!progress.open}
                tip={progress.open ? undefined : FX.allianceLocked}
                onClick={() => send({ type: "alliance" })}
                testId={`imp-pirate-alliance-${key}`}
                className="mt-1"
              >
                {FX.offerAlliance}
              </Btn>
            </>
          )}
        </div>
      )}
    </FactionCard>
  );
}

/** Sends an action of the human to a faction. */
function sender(props: EntryProps): (action: FactionAction) => void {
  const { faction, onCommand } = props;
  return (action) => {
    onCommand(factionCommand(faction, action));
  };
}

/** A faction command of the human. */
function factionCommand(faction: Faction, action: FactionAction): Command {
  return { type: "faction", faction: faction.id, action, island: -1 };
}

/** The card of a people or band: crest, ruler, home, facts and the ways there. */
function FactionCard(
  props: EntryProps & {
    readonly kind: string;
    readonly status: [string, StatusTone];
    readonly children: ReactNode;
  },
): ReactElement {
  const { game, faction, onClose, onFocus, onSelect } = props;
  const def = cultureOf(faction);
  const info = game.world.islands[faction.island];
  const opinion = factionOpinion(game, faction, HUMAN);
  const stage = stageOf(opinion);
  const power = faction.kind === "pirates" ? "pirates" : "nation";
  return (
    <PowerCard
      emblem={<FactionCrest culture={faction.culture} size={CREST} />}
      name={def.name}
      kind={props.kind}
      status={props.status[0]}
      tone={props.status[1]}
      sub={`${faction.leader} - ${FX.islandOf(info.name)}`}
      facts={`${FX.strength} ${Math.round(strengthOf(game, faction.id))} (${T.yourStrength} ${Math.round(strengthOf(game, HUMAN))}) - ${FX.mood}: ${MOOD_NAMES[faction.mood]} - ${FX.traded}: ${goldText(faction.traded)} Gold`}
      opinion={opinion}
      stage={{ name: STAGE_NAMES[stage], color: STAGE_COLORS[stage] }}
      bar={STAGE_BARS[stage]}
      reasons={factionReasons(game, faction, HUMAN)}
      opinionId={`imp-opinion-${faction.culture}`}
      testId={`imp-${power}-${faction.culture}`}
      power={power}
    >
      {props.children}
      <div className="mt-2 flex flex-wrap gap-1 border-t border-[var(--imp-brass-lo)] pt-1">
        <Btn
          small
          icon="anchor"
          tip={FX.openHarbourTip}
          onClick={() => {
            onClose();
            onSelect?.({ type: "faction", id: faction.id });
          }}
          testId={`imp-harbour-${faction.culture}`}
        >
          {FX.openHarbour}
        </Btn>
        <Btn
          small
          icon="eye"
          onClick={() => {
            onClose();
            onFocus(info.cx, info.cy);
          }}
          testId={`imp-goto-${faction.culture}`}
        >
          {FX.toIsland}
        </Btn>
      </div>
    </PowerCard>
  );
}

/** The supply contracts with a people and the form for a new one, folded away. */
function Contracts({ game, faction, onCommand }: EntryProps): ReactElement {
  const [direction, setDirection] = useState<"sell" | "buy">("sell");
  const goods = direction === "sell" ? demandOf(faction) : offerOf(faction);
  const [good, setGood] = useState<GoodId | null>(null);
  const [amount, setAmount] = useState<number>(CONTRACT_STEPS[1]);
  const chosen =
    good !== null && goods.includes(good) ? good : (goods[0] ?? null);
  const gold =
    chosen === null
      ? null
      : contractGold(game, faction, HUMAN, chosen, amount, direction);
  const mine = faction.contracts.filter((c) => c.player === HUMAN);
  const send = (action: FactionAction) =>
    onCommand(factionCommand(faction, action));
  return (
    <details
      className="mt-1 text-xs"
      data-testid={`imp-fx-contracts-${faction.culture}`}
    >
      <summary className="cursor-pointer select-none">
        {FX.contracts} ({mine.length})
      </summary>
      <ul className="flex flex-col gap-1">
        {mine.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center gap-2"
            data-testid="imp-fx-contract"
          >
            <span className="flex-1">
              {c.direction === "sell" ? FX.contractSell : FX.contractBuy}:{" "}
              {c.amount} {GOOD_NAMES[c.good]} - {goldText(c.gold)} Gold{" "}
              {FX.contractEvery} - {FX.deliveries} {c.deliveries}, {FX.breaches}{" "}
              {c.breaches}
              {c.suspended ? ` - ${FX.suspended}` : ""}
            </span>
            <Btn
              small
              danger
              onClick={() => send({ type: "cancelContract", contract: c.id })}
            >
              {FX.cancel}
            </Btn>
          </li>
        ))}
      </ul>
      <Section>{FX.contract}</Section>
      <div className="flex flex-wrap items-center gap-1">
        <Btn
          small
          active={direction === "sell"}
          onClick={() => setDirection("sell")}
        >
          {FX.contractSell}
        </Btn>
        <Btn
          small
          active={direction === "buy"}
          onClick={() => setDirection("buy")}
        >
          {FX.contractBuy}
        </Btn>
        <select
          className="imp-input rounded px-1 py-0.5 text-xs"
          value={chosen ?? ""}
          onChange={(event) => setGood(event.target.value as GoodId)}
          data-testid={`imp-fx-contract-good-${faction.culture}`}
        >
          {goods.map((g) => (
            <option key={g} value={g}>
              {GOOD_NAMES[g]}
            </option>
          ))}
        </select>
        <select
          className="imp-input rounded px-1 py-0.5 text-xs"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
        >
          {CONTRACT_STEPS.map((step) => (
            <option key={step} value={step}>
              {step}
            </option>
          ))}
        </select>
        <span className="imp-muted">
          {gold === null ? "-" : `${goldText(gold)} Gold ${FX.contractEvery}`}
        </span>
        <Btn
          small
          icon="scroll"
          disabled={chosen === null || gold === null}
          onClick={() => {
            if (chosen !== null) {
              send({ type: "contract", good: chosen, amount, direction });
            }
          }}
          testId={`imp-fx-contract-sign-${faction.culture}`}
        >
          {FX.propose}
        </Btn>
      </div>
    </details>
  );
}
