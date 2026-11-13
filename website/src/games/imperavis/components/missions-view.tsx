/**
 * The mission window: offers to accept or turn down, running missions with
 * goal, progress, time left and reward, the rivals racing for the same
 * crown order, and the ones that ended.
 *
 * @module
 */
"use client";

import type { ReactElement } from "react";
import { rivalsOf } from "@/games/imperavis/engine/missions";
import { HUMAN, playerById } from "@/games/imperavis/engine/players";
import { dayNumber } from "@/games/imperavis/engine/time";
import type { Game, Mission } from "@/games/imperavis/engine/types";
import {
  BUILDING_NAMES,
  GOOD_ICONS,
  GOOD_NAMES,
  MISSION_KIND_NAMES,
  MISSION_STATE_NAMES,
  TEXTS as T,
  TIER_NAMES,
} from "@/games/imperavis/i18n/texts";
import type { OverviewProps } from "./overviews";
import { Bar, Btn, goldText } from "./ui";

/**
 * Renders the mission window.
 *
 * @param props - the game, the island in view and the command door
 * @returns the panel
 */
export function Missions({
  game,
  island,
  onCommand,
  onFocus,
}: OverviewProps): ReactElement {
  const mine = game.missions.filter((m) => m.taker === HUMAN);
  const offered = mine.filter((m) => m.state === "offered");
  const active = mine.filter((m) => m.state === "active");
  const ended = mine
    .filter((m) => m.state !== "offered" && m.state !== "active")
    .reverse();
  return (
    <div className="flex flex-col gap-3 text-sm" data-testid="imp-missions">
      {mine.length === 0 && <p>{T.noMissions}</p>}
      {active.length > 0 && (
        <section>
          <h3 className="mb-1 imp-title text-[0.8rem]">{T.activeMissions}</h3>
          <ul className="flex flex-col gap-2">
            {active.map((mission) => (
              <li
                key={mission.id}
                className="rounded-lg border border-emerald-400 p-2"
                data-testid="imp-mission-active"
              >
                <MissionText game={game} mission={mission} />
                <Rivals game={game} mission={mission} />
                <div className="my-1 flex items-center gap-2">
                  <Bar value={mission.progress / Math.max(1, mission.goal)} />
                  <span
                    className="text-xs tabular-nums"
                    data-testid="imp-mission-progress"
                  >
                    {progressText(mission)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1 text-xs">
                  <span className="imp-muted">
                    {T.timeLeft(Math.max(0, mission.deadline - game.time))}
                  </span>
                  {mission.kind === "delivery" &&
                    game.islands[island]?.owner === HUMAN && (
                      <Btn
                        small
                        onClick={() =>
                          onCommand({
                            type: "missionDeliver",
                            mission: mission.id,
                            island,
                          })
                        }
                        testId="imp-mission-deliver"
                      >
                        {T.deliverNow(game.world.islands[island].name)}
                      </Btn>
                    )}
                  {mission.kind === "rescue" && (
                    <Btn small onClick={() => onFocus(mission.x, mission.y)}>
                      {T.goTo}
                    </Btn>
                  )}
                  {mission.kind === "settle" && (
                    <Btn
                      small
                      onClick={() =>
                        onFocus(
                          game.world.islands[mission.island].cx,
                          game.world.islands[mission.island].cy,
                        )
                      }
                    >
                      {T.goTo}
                    </Btn>
                  )}
                  <Btn
                    small
                    onClick={() =>
                      onCommand({ type: "missionDecline", mission: mission.id })
                    }
                  >
                    {T.abandon}
                  </Btn>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {offered.length > 0 && (
        <section>
          <h3 className="mb-1 imp-title text-[0.8rem]">{T.offeredMissions}</h3>
          <ul className="flex flex-col gap-2">
            {offered.map((mission) => (
              <li
                key={mission.id}
                className="rounded-lg border border-amber-400 p-2"
                data-testid="imp-mission-offer"
              >
                <MissionText game={game} mission={mission} />
                <Rivals game={game} mission={mission} />
                <div className="mt-1 flex flex-wrap items-center gap-1 text-xs">
                  <span className="imp-muted">
                    {T.timeLimit(mission.duration)} -{" "}
                    {T.expiresIn(Math.round(mission.offerUntil - game.time))}
                  </span>
                  <Btn
                    small
                    onClick={() =>
                      onCommand({ type: "missionAccept", mission: mission.id })
                    }
                    testId="imp-mission-accept"
                  >
                    {T.accept}
                  </Btn>
                  <Btn
                    small
                    onClick={() =>
                      onCommand({ type: "missionDecline", mission: mission.id })
                    }
                  >
                    {T.decline}
                  </Btn>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {ended.length > 0 && (
        <section>
          <h3 className="mb-1 imp-title text-[0.8rem]">{T.endedMissions}</h3>
          <ul
            className="flex flex-col gap-0.5 text-xs"
            data-testid="imp-missions-ended"
          >
            {ended.map((mission) => (
              <li key={mission.id}>
                {T.dayOf(dayNumber(mission.endedAt))}:{" "}
                {MISSION_KIND_NAMES[mission.kind]} - {goalText(game, mission)}{" "}
                <b>{MISSION_STATE_NAMES[mission.state]}</b>
                {mission.state === "lost" && mission.wonBy >= 0
                  ? ` - ${T.missionWonBy(playerById(game, mission.wonBy)?.name ?? "")}`
                  : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** The rivals racing for the same crown order, with their progress. */
function Rivals({
  game,
  mission,
}: {
  readonly game: Game;
  readonly mission: Mission;
}): ReactElement | null {
  const racing = rivalsOf(game, mission).filter(
    (rival) => rival.taker !== HUMAN && rival.state === "active",
  );
  return racing.length === 0 ? null : (
    <div
      className="imp-inset mt-1 px-2 py-1 text-xs"
      data-testid="imp-mission-rivals"
    >
      <span className="imp-title text-[0.8rem]">{T.missionRivals}:</span>{" "}
      {racing
        .map(
          (rival) =>
            `${playerById(game, rival.taker)?.name ?? ""} ${progressText(rival)}`,
        )
        .join(", ")}
    </div>
  );
}

/** Title, giver, goal, difficulty and reward of a mission. */
function MissionText({
  game,
  mission,
}: {
  readonly game: Game;
  readonly mission: Mission;
}): ReactElement {
  const giver = playerById(game, mission.giver);
  const goods = Object.entries(mission.reward.goods)
    .map(
      ([good, amount]) =>
        `${GOOD_ICONS[good as keyof typeof GOOD_ICONS]} ${amount}`,
    )
    .join(" ");
  return (
    <div>
      <p className="font-semibold">
        {MISSION_KIND_NAMES[mission.kind]}{" "}
        <span className="text-xs font-normal text-amber-600">
          {T.difficulty(mission.difficulty)}
        </span>
      </p>
      <p>{goalText(game, mission)}</p>
      <p className="text-xs imp-muted">
        {T.from(giver?.name ?? T.crown)} - {T.reward}: {"\u{1FA99}"}{" "}
        {goldText(mission.reward.gold)} {goods}
        {giver !== null
          ? ` - ${T.relationGain(mission.reward.relation)}`
          : ""}{" "}
        - {T.reputationGain(mission.reward.reputation)}
        {mission.minTier > 0 ? ` - ${TIER_NAMES[mission.minTier]}` : ""}
      </p>
    </div>
  );
}

/** What a mission asks, in words. */
function goalText(game: Game, mission: Mission): string {
  const good = mission.good === null ? "" : GOOD_NAMES[mission.good];
  const island =
    mission.island >= 0 ? game.world.islands[mission.island].name : "";
  const partner = playerById(game, mission.partner)?.name ?? "";
  const goals: Record<Mission["kind"], string> = {
    delivery: `Liefere ${mission.goal} ${good}.`,
    settle: `Gründe ein Kontor auf ${island}.`,
    production: `Erzeuge ${mission.goal} ${good} in deinen Betrieben.`,
    trade: `Verkaufe ${mission.goal} Waren an den freien Händler.`,
    economy:
      mission.metric === "residents"
        ? `Bring dein Reich auf ${mission.goal} Einwohner.`
        : `Halte ${goldText(mission.goal)} Gold in der Kasse.`,
    diplomacy: `Schließe ein Handelsabkommen mit ${partner}.`,
    rescue:
      mission.carrier < 0
        ? "Schiffbrüchige treiben auf einem Floß: hol sie mit einem Schiff ab."
        : "Die Schiffbrüchigen sind an Bord: bring sie in einen deiner Häfen.",
    build: `Baue ${mission.goal} x ${mission.building === null ? "" : BUILDING_NAMES[mission.building]}.`,
  };
  return goals[mission.kind];
}

/** Progress as numbers. */
function progressText(mission: Mission): string {
  return `${Math.floor(mission.progress)} / ${mission.goal}`;
}
