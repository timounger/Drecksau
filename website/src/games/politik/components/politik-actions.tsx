/**
 * The panel that asks the player whatever the current phase asks of them.
 *
 * @module
 * @remarks
 * One component per phase, all behind {@link PolitikPanel}, so the screen only
 * ever has to render "what am I being asked right now" - the same panel serves
 * the game against the computer and the online table.
 *
 * Actions that need a target are asked in two steps, and the first step already
 * hides what has nowhere to go: an action board that offers "Skandal
 * verdecken" to somebody with nothing uncovered only teaches you to read the
 * error message.
 */
"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import {
  ABILITY_LABELS,
  THEMES,
  THEME_ICONS,
  THEME_LABELS,
  candidateById,
  officeCard,
  officesFor,
  oppositionById,
  promiseById,
  scandalById,
  type Theme,
} from "@/games/politik/engine/cards";
import {
  availableActions,
  isProposalLegal,
} from "@/games/politik/engine/moves";
import {
  MAJORITY_SEATS,
  PARTY_INK,
  campaignStrength,
  diceCount,
  type OfficeAssignment,
  type PolitikAction,
  type PolitikGame,
  type PolitikMove,
} from "@/games/politik/engine/state";
import {
  ACTION_HINTS,
  ACTION_LABELS,
  POLITIK_TEXTS as T,
} from "@/games/politik/i18n/texts";

/** Props of {@link PolitikPanel}. */
export type PolitikPanelProps = {
  readonly game: PolitikGame;
  /** The seat the reader plays, or null while only watching. */
  readonly mySeat: number | null;
  readonly onMove: (move: PolitikMove) => void;
  /** True while somebody else is being waited for. */
  readonly busy?: boolean;
  /**
   * The turn clock, shown beside whose turn it is.
   *
   * @remarks
   * Passed in rather than built here, because only an online table has one:
   * offline nobody is waiting on anybody.
   */
  readonly clock?: ReactNode;
};

/** What the panel is asking for at the moment. */
type Step =
  | { readonly at: "action" }
  | { readonly at: "target"; readonly kind: PolitikAction["kind"] }
  | { readonly at: "oppositionAim"; readonly cardId: number };

/** The step a fresh panel starts from. */
const START: Step = { at: "action" };

/**
 * Renders whatever the player has to answer right now.
 *
 * @param props - the game, who is reading and where a move goes
 * @returns the panel element
 */
export function PolitikPanel({
  game,
  mySeat,
  onMove,
  busy = false,
  clock,
}: PolitikPanelProps): ReactElement {
  const mine = mySeat !== null && game.turn === mySeat && !busy;
  const waitingFor = game.players[game.turn]?.name ?? "";

  let body: ReactElement;
  if (game.phase === "gameOver") {
    body = <p className="text-sm">{T.phaseGameOver}</p>;
  } else if (!mine) {
    body = (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {game.phase === "coalition"
          ? T.waitingForCoalition(waitingFor)
          : game.phase === "ballot"
            ? T.ballotWaiting(waitingFor)
            : T.waitingFor(waitingFor)}
      </p>
    );
  } else {
    body = <MyTurn game={game} seat={game.turn} onMove={onMove} />;
  }

  return (
    <section
      data-testid="politik-panel"
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Results game={game} />
        {clock}
      </div>
      {body}
    </section>
  );
}

/** The panel for the seat that is actually on turn. */
function MyTurn({
  game,
  seat,
  onMove,
}: {
  readonly game: PolitikGame;
  readonly seat: number;
  readonly onMove: (move: PolitikMove) => void;
}): ReactElement {
  let body: ReactElement;
  switch (game.phase) {
    case "candidate":
      body = <CandidateChoice game={game} seat={seat} onMove={onMove} />;
      break;
    case "campaign":
      body = <CampaignDuel game={game} seat={seat} onMove={onMove} />;
      break;
    case "coalition":
      body = (
        <div className="flex flex-col gap-2">
          <Heading
            title={T.coalitionTitle}
            hint={T.coalitionHint(MAJORITY_SEATS)}
          />
          <GovernmentBuilder
            game={game}
            seat={seat}
            needMajority
            submitLabel={T.proposeCoalition}
            onSubmit={(members, offices) =>
              onMove({ kind: "propose", members, offices })
            }
          />
        </div>
      );
      break;
    case "ballot":
      body = <BallotChoice game={game} onMove={onMove} />;
      break;
    case "action":
      body = <ActionChoice game={game} seat={seat} onMove={onMove} />;
      break;
    case "gameOver":
      body = <p className="text-sm">{T.phaseGameOver}</p>;
      break;
  }
  return body;
}

/* ------------------------------------------------------------------ *
 * What just happened                                                  *
 * ------------------------------------------------------------------ */

/** The last duel, dice check or vote, so a result is never missed. */
function Results({
  game,
}: {
  readonly game: PolitikGame;
}): ReactElement | null {
  const { lastDuel, lastCheck, lastBallot } = game;
  const nothing =
    lastDuel === null && lastCheck === null && lastBallot === null;
  return nothing ? null : (
    <div className="flex flex-wrap gap-2 text-sm">
      {lastDuel !== null && game.phase === "campaign" && (
        <Note tone={lastDuel.winner === null ? "plain" : "good"}>
          {game.players[lastDuel.attacker].name} {lastDuel.attackerTotal} :{" "}
          {lastDuel.defenderTotal} {game.players[lastDuel.defender].name} -{" "}
          {lastDuel.winner === null
            ? T.duelDraw
            : T.duelWon(game.players[lastDuel.winner].name, lastDuel.seats)}
        </Note>
      )}
      {lastCheck !== null && (
        <Note tone={lastCheck.passed ? "good" : "bad"}>
          {game.players[lastCheck.seat].name}:{" "}
          {lastCheck.passed
            ? T.checkPassed(lastCheck.what, lastCheck.total)
            : T.checkFailed(lastCheck.what, lastCheck.total)}{" "}
          ({ABILITY_LABELS[lastCheck.ability]} {lastCheck.abilityPoints} +{" "}
          {lastCheck.die})
        </Note>
      )}
      {lastBallot !== null && (
        <Note tone={lastBallot.passed ? "good" : "bad"}>
          {lastBallot.what}:{" "}
          {lastBallot.passed
            ? T.ballotPassed(lastBallot.yesSeats)
            : T.ballotFailed(lastBallot.yesSeats)}
        </Note>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The individual phases                                               *
 * ------------------------------------------------------------------ */

/** Two candidates to pick between, and on a swap the option to keep one. */
function CandidateChoice({
  game,
  seat,
  onMove,
}: {
  readonly game: PolitikGame;
  readonly seat: number;
  readonly onMove: (move: PolitikMove) => void;
}): ReactElement {
  const offer = game.offer;
  const own = game.players[seat].candidateId;
  return (
    <div className="flex flex-col gap-3">
      <Heading title={T.chooseCandidate} hint={T.chooseCandidateHint} />
      <div className="grid gap-2 sm:grid-cols-2">
        {(offer?.cardIds ?? []).map((id, index) => {
          const card = candidateById(id);
          return (
            <button
              key={`${id}-${index}`}
              type="button"
              data-testid={`candidate-${index}`}
              onClick={() => onMove({ kind: "chooseCandidate", index })}
              className="cursor-pointer rounded-xl border border-zinc-300 p-3 text-left hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <span className="block font-semibold">
                {card?.name ?? T.chooseCard}
              </span>
              <span className="block text-sm tabular-nums">
                {card?.campaignPoints ?? 0} {T.campaignPoints}
              </span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                {card === null
                  ? ""
                  : `${ABILITY_LABELS.manipulation} ${card.abilities.manipulation} · ${ABILITY_LABELS.medien} ${card.abilities.medien} · ${ABILITY_LABELS.popularitaet} ${card.abilities.popularitaet}`}
              </span>
            </button>
          );
        })}
      </div>
      {offer?.isSwap === true && own !== null && (
        <SecondaryButton
          onClick={() => onMove({ kind: "chooseCandidate", index: -1 })}
        >
          {T.keepCandidate}
        </SecondaryButton>
      )}
    </div>
  );
}

/** The duel that is due, and the button that rolls it. */
function CampaignDuel({
  game,
  seat,
  onMove,
}: {
  readonly game: PolitikGame;
  readonly seat: number;
  readonly onMove: (move: PolitikMove) => void;
}): ReactElement {
  const defender = (seat + 1) % game.players.length;
  return (
    <div className="flex flex-col gap-3">
      <Heading
        title={T.duelTitle(
          game.players[seat].name,
          game.players[defender].name,
        )}
        hint={T.duelHint}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        {[seat, defender].map((at) => (
          <div
            key={at}
            className="rounded-xl border border-zinc-200 p-2 text-sm dark:border-zinc-800"
          >
            <span className="flex items-center gap-2 font-medium">
              <span
                aria-hidden
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: PARTY_INK[game.players[at].color] }}
              />
              {game.players[at].name}
            </span>
            <span className="block tabular-nums">
              {campaignStrength(game.players[at])} {T.campaignPoints}
            </span>
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">
              {diceCount(game.players[at], game.theme) > 1
                ? T.twoDice
                : T.oneDie}
            </span>
          </div>
        ))}
      </div>
      <PrimaryButton onClick={() => onMove({ kind: "duel" })}>
        {T.rollDice}
      </PrimaryButton>
    </div>
  );
}

/** What is being voted on, and the two answers. */
function BallotChoice({
  game,
  onMove,
}: {
  readonly game: PolitikGame;
  readonly onMove: (move: PolitikMove) => void;
}): ReactElement {
  const ballot = game.ballot;
  const actor = ballot === null ? "" : game.players[ballot.actor].name;
  const promise = promiseById(ballot?.promiseId ?? 0);
  const proposal = ballot?.proposal ?? null;
  return (
    <div className="flex flex-col gap-3">
      <Heading
        title={T.phaseBallot}
        hint={
          ballot?.kind === "promise"
            ? T.ballotPromise(actor)
            : ballot?.kind === "coalition"
              ? T.ballotCoalition(actor)
              : T.ballotChange(actor)
        }
      />
      {promise !== null && (
        <p className="rounded-xl bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
          {THEME_ICONS[promise.theme]} <strong>{promise.title}</strong> -{" "}
          {promise.points} {T.pointsShort} ({THEME_LABELS[promise.theme]})
        </p>
      )}
      {proposal !== null && (
        <ul className="flex flex-col gap-1 rounded-xl bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
          {proposal.offices.map((entry) => (
            <li key={entry.office}>
              {officeCard(entry.office).title}:{" "}
              <strong>{game.players[entry.seat].name}</strong>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <PrimaryButton onClick={() => onMove({ kind: "vote", accept: true })}>
          {T.ballotFor}
        </PrimaryButton>
        <SecondaryButton
          onClick={() => onMove({ kind: "vote", accept: false })}
        >
          {T.ballotAgainst}
        </SecondaryButton>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The Spielrunde action                                               *
 * ------------------------------------------------------------------ */

/** The action board, and the second step for whatever needs a target. */
function ActionChoice({
  game,
  seat,
  onMove,
}: {
  readonly game: PolitikGame;
  readonly seat: number;
  readonly onMove: (move: PolitikMove) => void;
}): ReactElement {
  const [step, setStep] = useState<Step>(START);
  const kinds = availableActions(game, seat);
  const play = (action: PolitikAction) => {
    setStep(START);
    onMove({ kind: "act", action });
  };
  const start = (kind: PolitikAction["kind"]) => {
    if (kind === "swapCandidate" || kind === "imageCampaign") {
      play({ kind });
    } else {
      setStep({ at: "target", kind });
    }
  };

  let body: ReactElement;
  if (step.at === "action") {
    body = (
      <div className="grid gap-2 sm:grid-cols-2">
        {kinds.map((kind) => (
          <button
            key={kind}
            type="button"
            data-testid={`action-${kind}`}
            onClick={() => start(kind)}
            className="cursor-pointer rounded-xl border border-zinc-300 p-2.5 text-left hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <span className="block text-sm font-semibold">
              {ACTION_LABELS[kind]}
            </span>
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">
              {ACTION_HINTS[kind]}
            </span>
          </button>
        ))}
      </div>
    );
  } else {
    body = (
      <TargetStep
        game={game}
        seat={seat}
        step={step}
        onPlay={play}
        onAim={(cardId) => setStep({ at: "oppositionAim", cardId })}
        onCancel={() => setStep(START)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Heading title={step.at === "action" ? T.chooseAction : T.chooseTarget} />
      {body}
      {step.at !== "action" && (
        <SecondaryButton onClick={() => setStep(START)}>
          {T.cancel}
        </SecondaryButton>
      )}
    </div>
  );
}

/** The second step: whatever the chosen action still has to be pointed at. */
function TargetStep({
  game,
  seat,
  step,
  onPlay,
  onAim,
  onCancel,
}: {
  readonly game: PolitikGame;
  readonly seat: number;
  readonly step: Step;
  readonly onPlay: (action: PolitikAction) => void;
  readonly onAim: (cardId: number) => void;
  readonly onCancel: () => void;
}): ReactElement {
  let body: ReactElement = <p className="text-sm">{T.chooseTarget}</p>;
  if (step.at === "oppositionAim") {
    body = (
      <OppositionAim
        game={game}
        seat={seat}
        cardId={step.cardId}
        onPlay={onPlay}
      />
    );
  } else if (step.at === "target") {
    switch (step.kind) {
      case "promise":
        body = (
          <ChoiceGrid
            options={game.players[seat].promises.map((id) => {
              const card = promiseById(id);
              return {
                key: String(id),
                title: card?.title ?? "",
                hint: `${THEME_LABELS[card?.theme ?? "arbeit"]} · ${card?.points ?? 0} ${T.pointsShort}`,
                onPick: () => onPlay({ kind: "promise", cardId: id }),
              };
            })}
          />
        );
        break;
      case "opposition":
        body = (
          <ChoiceGrid
            options={game.players[seat].opposition.map((id) => {
              const card = oppositionById(id);
              return {
                key: String(id),
                title: card?.title ?? T.chooseCard,
                hint: card?.text ?? "",
                onPick: () =>
                  card !== null && card.targeting === "none"
                    ? onPlay({ kind: "opposition", cardId: id })
                    : onAim(id),
              };
            })}
          />
        );
        break;
      case "dirtyCampaign":
        body = (
          <PlayerGrid
            game={game}
            omit={seat}
            onPick={(target) => onPlay({ kind: "dirtyCampaign", target })}
          />
        );
        break;
      case "poachSeat":
        body = (
          <PlayerGrid
            game={game}
            omit={seat}
            onPick={(target) => onPlay({ kind: "poachSeat", target })}
          />
        );
        break;
      case "changeTheme":
        body = (
          <ThemeGrid
            current={game.theme}
            onPick={(theme) => onPlay({ kind: "changeTheme", theme })}
          />
        );
        break;
      case "revealScandal":
        body = (
          <ScandalGrid
            game={game}
            wantRevealed={false}
            onPick={(target, scandalIndex) =>
              onPlay({ kind: "revealScandal", target, scandalIndex })
            }
          />
        );
        break;
      case "hideScandal":
        body = (
          <ScandalGrid
            game={game}
            only={seat}
            wantRevealed
            onPick={(atSeat, scandalIndex) =>
              onPlay({ kind: "hideScandal", scandalIndex })
            }
          />
        );
        break;
      case "governmentChange":
        body = (
          <GovernmentBuilder
            game={game}
            seat={seat}
            needMajority={false}
            submitLabel={ACTION_LABELS.governmentChange}
            onSubmit={(members, offices) =>
              onPlay({ kind: "governmentChange", members, offices })
            }
          />
        );
        break;
      default:
        body = <SecondaryButton onClick={onCancel}>{T.cancel}</SecondaryButton>;
        break;
    }
  }
  return body;
}

/** Points one opposition card at whatever it needs. */
function OppositionAim({
  game,
  seat,
  cardId,
  onPlay,
}: {
  readonly game: PolitikGame;
  readonly seat: number;
  readonly cardId: number;
  readonly onPlay: (action: PolitikAction) => void;
}): ReactElement {
  const card = oppositionById(cardId);
  let body: ReactElement = <p className="text-sm">{T.chooseTarget}</p>;
  if (card?.targeting === "theme") {
    body = (
      <ThemeGrid
        current={game.theme}
        onPick={(theme) => onPlay({ kind: "opposition", cardId, theme })}
      />
    );
  } else if (card?.targeting === "player") {
    body = (
      <PlayerGrid
        game={game}
        omit={seat}
        onPick={(target) => onPlay({ kind: "opposition", cardId, target })}
      />
    );
  } else if (card?.targeting === "governmentMember") {
    body = (
      <PlayerGrid
        game={game}
        onlyGovernment
        onPick={(target) => onPlay({ kind: "opposition", cardId, target })}
      />
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">{card?.text}</p>
      {body}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Pickers                                                             *
 * ------------------------------------------------------------------ */

/** Picks one party. */
function PlayerGrid({
  game,
  omit,
  onlyGovernment = false,
  onPick,
}: {
  readonly game: PolitikGame;
  readonly omit?: number;
  readonly onlyGovernment?: boolean;
  readonly onPick: (seat: number) => void;
}): ReactElement {
  return (
    <ChoiceGrid
      options={game.players
        .map((player, seat) => ({ player, seat }))
        .filter(
          (entry) =>
            entry.seat !== omit &&
            (!onlyGovernment || entry.player.offices.length > 0),
        )
        .map((entry) => ({
          key: String(entry.seat),
          title: entry.player.name,
          hint: `${entry.player.seats} ${T.seats} · ${entry.player.points} ${T.pointsShort}`,
          ink: PARTY_INK[entry.player.color],
          onPick: () => onPick(entry.seat),
        }))}
    />
  );
}

/** Picks one theme other than the one already up. */
function ThemeGrid({
  current,
  onPick,
}: {
  readonly current: Theme;
  readonly onPick: (theme: Theme) => void;
}): ReactElement {
  return (
    <ChoiceGrid
      options={THEMES.filter((theme) => theme !== current).map((theme) => ({
        key: theme,
        title: `${THEME_ICONS[theme]} ${THEME_LABELS[theme]}`,
        hint: "",
        onPick: () => onPick(theme),
      }))}
    />
  );
}

/** Picks one scandal lying in front of somebody. */
function ScandalGrid({
  game,
  only,
  wantRevealed,
  onPick,
}: {
  readonly game: PolitikGame;
  readonly only?: number;
  readonly wantRevealed: boolean;
  readonly onPick: (seat: number, index: number) => void;
}): ReactElement {
  const options = game.players.flatMap((player, seat) =>
    only !== undefined && seat !== only
      ? []
      : player.scandals
          .map((held, index) => ({ held, index }))
          .filter((entry) => entry.held.revealed === wantRevealed)
          .map((entry) => ({
            key: `${seat}-${entry.index}`,
            title: player.name,
            hint: wantRevealed
              ? (scandalById(entry.held.cardId)?.title ?? "")
              : `${T.scandals} ${entry.index + 1} (${T.scandalHidden})`,
            ink: PARTY_INK[player.color],
            onPick: () => onPick(seat, entry.index),
          })),
  );
  return <ChoiceGrid options={options} />;
}

/** One choice in a {@link ChoiceGrid}. */
type Choice = {
  readonly key: string;
  readonly title: string;
  readonly hint: string;
  readonly ink?: string;
  readonly onPick: () => void;
};

/** A grid of things to pick one of. */
function ChoiceGrid({
  options,
}: {
  readonly options: readonly Choice[];
}): ReactElement {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          data-testid={`pick-${option.key}`}
          onClick={option.onPick}
          className="flex cursor-pointer items-start gap-2 rounded-xl border border-zinc-300 p-2.5 text-left hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {option.ink !== undefined && (
            <span
              aria-hidden
              className="mt-1 h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: option.ink }}
            />
          )}
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{option.title}</span>
            {option.hint !== "" && (
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                {option.hint}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Building a government                                               *
 * ------------------------------------------------------------------ */

/**
 * Picks the partners and hands out the offices.
 *
 * @remarks
 * The same builder serves the coalition talks after a campaign and a
 * Regierungswechsel during a Spielrunde. Only one thing differs, and it is
 * passed in: a government being **formed** needs the majority in its own
 * right, while a **change** is carried by the vote instead - which is why the
 * seat counter turns red in the first case and stays quiet in the second.
 */
function GovernmentBuilder({
  game,
  seat,
  needMajority,
  submitLabel,
  onSubmit,
}: {
  readonly game: PolitikGame;
  readonly seat: number;
  readonly needMajority: boolean;
  readonly submitLabel: string;
  readonly onSubmit: (
    members: readonly number[],
    offices: readonly OfficeAssignment[],
  ) => void;
}): ReactElement {
  const inPlay = officesFor(game.players.length);
  const [members, setMembers] = useState<readonly number[]>([seat]);
  const [holders, setHolders] = useState<Readonly<Record<string, number>>>(() =>
    Object.fromEntries(inPlay.map((entry) => [entry.office, seat])),
  );

  const toggle = (at: number) => {
    const next = members.includes(at)
      ? members.filter((member) => member !== at)
      : [...members, at];
    setMembers(next.length === 0 ? [seat] : next);
    // An office cannot stay with somebody who just left the coalition.
    setHolders((current) =>
      Object.fromEntries(
        Object.entries(current).map(([office, holder]) => [
          office,
          next.includes(holder) ? holder : (next[0] ?? seat),
        ]),
      ),
    );
  };

  const offices: readonly OfficeAssignment[] = inPlay.map((entry) => ({
    office: entry.office,
    seat: holders[entry.office] ?? seat,
  }));
  const seats = members.reduce(
    (sum, member) => sum + game.players[member].seats,
    0,
  );
  const legal = isProposalLegal(game, members, offices, needMajority);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {game.players.map((player, at) => (
          <button
            key={at}
            type="button"
            role="checkbox"
            aria-checked={members.includes(at)}
            data-testid={`coalition-${at}`}
            disabled={at === seat}
            onClick={() => toggle(at)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm disabled:cursor-not-allowed ${
              members.includes(at)
                ? "border-indigo-500 bg-indigo-600 text-white"
                : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            <span
              aria-hidden
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: PARTY_INK[player.color] }}
            />
            {player.name}
            <span className="tabular-nums opacity-80">{player.seats}</span>
          </button>
        ))}
      </div>

      <p
        className={`text-sm font-medium tabular-nums ${
          !needMajority || seats >= MAJORITY_SEATS
            ? "text-emerald-700 dark:text-emerald-300"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {T.coalitionSeats(seats)}
      </p>

      <ul className="flex flex-col gap-2">
        {inPlay.map((entry) => (
          <li key={entry.office} className="flex items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate">
              {entry.title} ({entry.points} {T.pointsShort})
            </span>
            <select
              aria-label={entry.title}
              data-testid={`office-${entry.office}`}
              value={holders[entry.office] ?? seat}
              onChange={(event) =>
                setHolders((current) => ({
                  ...current,
                  [entry.office]: Number(event.target.value),
                }))
              }
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            >
              {members.map((member) => (
                <option key={member} value={member}>
                  {game.players[member].name}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>

      <PrimaryButton
        disabled={!legal}
        onClick={() => onSubmit(members, offices)}
      >
        {submitLabel}
      </PrimaryButton>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Small pieces                                                        *
 * ------------------------------------------------------------------ */

/** A panel heading with its one line of explanation. */
function Heading({
  title,
  hint,
}: {
  readonly title: string;
  readonly hint?: string;
}): ReactElement {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      {hint !== undefined && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
    </div>
  );
}

/** A coloured note about something that just happened. */
function Note({
  children,
  tone,
}: {
  readonly children: ReactNode;
  readonly tone: "plain" | "good" | "bad";
}): ReactElement {
  const tones = {
    plain: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
    good: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
    bad: "bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200",
  };
  return <p className={`rounded-lg px-3 py-1.5 ${tones[tone]}`}>{children}</p>;
}

/** The button that carries the panel's main action. */
function PrimaryButton({
  children,
  onClick,
  disabled = false,
}: {
  readonly children: ReactNode;
  readonly onClick: () => void;
  readonly disabled?: boolean;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/** The quieter of two buttons. */
function SecondaryButton({
  children,
  onClick,
}: {
  readonly children: ReactNode;
  readonly onClick: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer self-start rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {children}
    </button>
  );
}
