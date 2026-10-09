/**
 * Bloons TD auf dem Bildschirm: Feld, Laden und die Zahlen darüber.
 *
 * @module
 * @remarks
 * Das Feld ist eine Leinwand, alles andere ist DOM - der Laden besteht aus
 * Knöpfen, die ein Bildschirmleser findet und eine Tastatur erreicht. Was sich
 * jedes Bild bewegt, gehört auf die Leinwand; was man anklickt und liest, nicht.
 */
"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactElement } from "react";
import { GameHeader } from "@/components/game-header";
import {
  CANVAS_H,
  CANVAS_W,
  drawTower,
} from "@/games/bloons-td/components/render";
import { Leaderboard } from "@/games/bloons-td/components/leaderboard";
import { MapMenu } from "@/games/bloons-td/components/map-menu";
import { aims, payoutOf, refundOf } from "@/games/bloons-td/engine/engine";
import {
  DIFFICULTIES,
  priceOf,
  type Difficulty,
} from "@/games/bloons-td/engine/difficulty";
import { MAPS } from "@/games/bloons-td/engine/map";
import { BLOONS } from "@/games/bloons-td/engine/bloons";
import { UNLOCK } from "@/games/bloons-td/engine/progress";
import type { Target } from "@/games/bloons-td/engine/types";
import {
  GROUPS,
  TOWERS,
  TOWER_ORDER,
  type TowerKind,
} from "@/games/bloons-td/engine/towers";
import {
  MOST,
  lastOf,
  nextOf,
  type Path,
  type Tiers,
} from "@/games/bloons-td/engine/upgrades";
import { useBloonsGame, SPEEDS } from "@/games/bloons-td/hooks/use-bloons-game";
import { BLOONS_RULES } from "@/games/bloons-td/i18n/rules";
import { BLOONS_TEXTS } from "@/games/bloons-td/i18n/texts";
import { useFullscreen } from "@/lib/screen/use-fullscreen";

/**
 * Rendert den Bildschirm.
 *
 * @returns das Spiel
 */
export function BloonsGame(): ReactElement {
  const {
    canvasRef,
    hud,
    picked,
    pick,
    chosen,
    send,
    sellChosen,
    upgradeChosen,
    aimChosen,
    restart,
    setSpeed,
    cheat,
    paused,
    setPaused,
    auto,
    setAuto,
    screen,
    start,
    toMenu,
    keepGoing,
    progress,
    level,
    unlocked,
    note,
    resetProgress,
  } = useBloonsGame();
  const autoHold = useHold(
    () => cheat("towers"),
    () => setAuto(!auto),
  );
  // **Im Vollbild ist alles dabei, was man zum Spielen braucht**: Anzeige,
  // Tempo, Feld und Laden. Nur das Feld allein wäre schön anzusehen, aber man
  // könnte keinen Affen mehr bauen.
  const stageRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(stageRef);
  const full = fullscreen.active;
  const ended = hud.phase === "over" || hud.phase === "won";

  // **Erst die Karte, dann das Spiel**: Ohne gewählte Karte gibt es kein Feld,
  // sondern die Übersicht - mit Level, Medaillen und den drei Schwierigkeiten.
  if (screen === "menu") {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
        <GameHeader
          rules={BLOONS_RULES}
          title={BLOONS_TEXTS.title}
          subtitle={BLOONS_TEXTS.subtitle}
        >
          <Link
            href="/bloons-td/statistik"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {BLOONS_TEXTS.statistics}
          </Link>
        </GameHeader>
        <MapMenu
          progress={progress}
          level={level}
          onStart={start}
          onReset={resetProgress}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
      <GameHeader
        rules={BLOONS_RULES}
        title={BLOONS_TEXTS.title}
        subtitle={BLOONS_TEXTS.subtitle}
      >
        <button
          type="button"
          data-testid="btd-maps"
          onClick={toMenu}
          className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {BLOONS_TEXTS.maps}
        </button>
        <button
          type="button"
          data-testid="btd-new-game"
          onClick={restart}
          title={BLOONS_TEXTS.newGameTitle}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {BLOONS_TEXTS.newGame}
        </button>
        {fullscreen.supported && (
          <button
            type="button"
            onClick={fullscreen.toggle}
            className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {BLOONS_TEXTS.fullscreen}
          </button>
        )}
        <Link
          href="/bloons-td/statistik"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {BLOONS_TEXTS.statistics}
        </Link>
      </GameHeader>

      <div
        ref={stageRef}
        className={
          full
            ? "flex h-dvh flex-col gap-3 overflow-y-auto bg-zinc-50 p-3 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
            : "flex flex-col gap-4"
        }
      >
        {/* Die Zahlen, die man im Blick haben muss - und rechts das Tempo. */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            {/* **Geheim**: Wer das Geld eine Sekunde lang gedrückt hält, hat
                unendlich davon - und wer die Leben gedrückt hält, ebenso. */}
            <Stat testId="btd-money" onHold={() => cheat("money")}>
              {BLOONS_TEXTS.money(hud.money)}
            </Stat>
            <Stat testId="btd-lives" onHold={() => cheat("lives")}>
              {BLOONS_TEXTS.lives(hud.lives)}
            </Stat>
            <Stat testId="btd-round">
              {BLOONS_TEXTS.roundOf(hud.round, hud.goal, hud.freeplay)}
            </Stat>
            <Stat testId="btd-map">
              {hud.boss === null
                ? `${MAPS[hud.map].name} · ${DIFFICULTIES[hud.difficulty].name}`
                : `${MAPS[hud.map].name} · ${BLOONS_TEXTS.bossMode(BLOONS[hud.boss].name)}`}
            </Stat>
            <Stat>{BLOONS_TEXTS.left(hud.bloons + hud.waiting)}</Stat>
            <Stat>{BLOONS_TEXTS.popped(hud.popped)}</Stat>
          </div>
          <div className="flex items-center gap-2">
            {/* **Geheim**: Auto-Start eine Sekunde lang gedrückt halten
                stellt auf jedes freie Feld den besten Affen, voll ausgebaut. */}
            <button
              type="button"
              data-testid="btd-auto"
              aria-pressed={auto}
              {...autoHold}
              title={BLOONS_TEXTS.autoHint}
              className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm select-none ${
                auto
                  ? "border-sky-500 bg-sky-600 text-white"
                  : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              {BLOONS_TEXTS.auto}
            </button>
            {SPEEDS.map((speed, nr) => (
              <SpeedButton
                key={speed}
                nr={nr}
                on={hud.speed === speed}
                onPick={() => setSpeed(speed)}
              />
            ))}
          </div>
        </div>

        <div
          className={`flex gap-4 max-lg:flex-col ${full ? "min-h-0 flex-1" : ""}`}
        >
          {/* Im Vollbild so groß, wie die Höhe es zulässt - quadratisch, mit
            Platz für den Laden daneben. */}
          <div
            className={
              full
                ? "relative aspect-square max-lg:w-full lg:h-full lg:max-w-[calc(100vw-21rem)]"
                : "relative"
            }
          >
            <canvas
              ref={canvasRef}
              data-testid="btd-canvas"
              width={CANVAS_W}
              height={CANVAS_H}
              className={`block w-full touch-none rounded-2xl border border-zinc-300 shadow-sm dark:border-zinc-700 ${full ? "h-full" : ""}`}
            />

            {/* Im Vollbild gibt es die Kopfzeile nicht - also braucht das Feld
              selbst einen Weg hinaus. */}
            {full && (
              <button
                type="button"
                data-testid="btd-fullscreen-exit"
                onClick={fullscreen.toggle}
                className="absolute top-3 left-3 z-20 cursor-pointer rounded-full bg-zinc-900/70 px-3 py-2 text-xs font-semibold text-white shadow-lg hover:bg-zinc-900/90"
              >
                {BLOONS_TEXTS.fullscreenExit}
              </button>
            )}

            {/* Eine Meldung, wenn ein Level erreicht und ein Affe dazugekommen
              ist - oben auf dem Feld, wo man ohnehin hinschaut. */}
            {note !== null && (
              <p
                data-testid="btd-level-note"
                role="status"
                className="pointer-events-none absolute inset-x-0 top-16 z-20 mx-auto w-fit max-w-[90%] rounded-full bg-amber-500 px-4 py-2 text-center text-sm font-bold text-white shadow-lg"
              >
                {note}
              </p>
            )}

            {/* **Das Ziel ist geschafft** - weiterspielen, solange es hält,
              oder zurück zur Kartenauswahl. */}
            {hud.phase === "won" && (
              <div
                data-testid="btd-won"
                role="dialog"
                aria-modal="true"
                aria-labelledby="btd-won-title"
                className="absolute inset-0 z-40 flex items-center justify-center rounded-2xl bg-emerald-950/60 p-4"
              >
                <div className="flex w-72 flex-col gap-3 rounded-2xl bg-white p-5 text-center shadow-xl dark:bg-zinc-900">
                  <h2 id="btd-won-title" className="text-2xl font-bold">
                    {BLOONS_TEXTS.won}
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {hud.boss === null
                      ? BLOONS_TEXTS.wonHint(
                          MAPS[hud.map].name,
                          DIFFICULTIES[hud.difficulty].name,
                          hud.goal,
                        )
                      : BLOONS_TEXTS.wonBossHint(BLOONS[hud.boss].name)}
                  </p>
                  <button
                    type="button"
                    data-testid="btd-keep-going"
                    autoFocus
                    onClick={keepGoing}
                    className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                  >
                    {BLOONS_TEXTS.keepGoing}
                  </button>
                  <button
                    type="button"
                    data-testid="btd-to-maps"
                    onClick={toMenu}
                    className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    {BLOONS_TEXTS.toMaps}
                  </button>
                </div>
              </div>
            )}

            {hud.phase === "over" && (
              <div
                data-testid="btd-over"
                className="absolute inset-0 z-40 flex flex-col items-center gap-3 overflow-y-auto rounded-2xl bg-red-950/70 p-4 text-center text-white"
              >
                <p className="mt-auto text-2xl font-bold">
                  {BLOONS_TEXTS.over}
                </p>
                <p className="text-sm">{BLOONS_TEXTS.overHint(hud.round)}</p>
                {/* Die Bestenliste: ob diese Partie einen Platz bekommt, und
                  wenn ja, das Feld für den Namen. */}
                {/* Auf festem Weiß: Die Liste selbst ist leicht durchsichtig,
                  und auf dem roten Schleier wäre das Namensfeld kaum zu
                  sehen. */}
                <div className="w-full max-w-sm rounded-2xl bg-white text-left text-zinc-900 shadow-lg dark:bg-zinc-900 dark:text-zinc-100">
                  <Leaderboard
                    map={hud.map}
                    difficulty={hud.difficulty}
                    run={{
                      round: hud.round,
                      // Die Boss-Herausforderung ist eine andere Wertung.
                      fair: hud.fair && hud.boss === null,
                    }}
                  />
                </div>
                <button
                  type="button"
                  data-testid="btd-again"
                  onClick={restart}
                  className="cursor-pointer rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  {BLOONS_TEXTS.again}
                </button>
                <button
                  type="button"
                  data-testid="btd-over-maps"
                  onClick={toMenu}
                  className="cursor-pointer rounded-lg border border-white/60 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10"
                >
                  {BLOONS_TEXTS.toMaps}
                </button>
                <span className="mb-auto" />
              </div>
            )}

            {/* Der Pausenknopf sitzt oben rechts auf dem Feld, wo man ihn in
              jedem Spiel sucht - und hält sofort an. */}
            {!paused && !ended && (
              <button
                type="button"
                data-testid="btd-pause"
                onClick={() => setPaused(true)}
                aria-label={BLOONS_TEXTS.pause}
                title={BLOONS_TEXTS.pause}
                className="absolute top-3 right-3 z-20 flex h-10 w-10 cursor-pointer items-center justify-center gap-1 rounded-full bg-zinc-900/70 shadow-lg hover:bg-zinc-900/90"
              >
                <span className="h-4 w-1.5 rounded-sm bg-white" />
                <span className="h-4 w-1.5 rounded-sm bg-white" />
              </button>
            )}

            {/* **Pause ist ein Menü**: weiter oder von vorn. Solange es offen
              ist, steht die Zeit - und auf das Feld klickt man nicht aus
              Versehen. */}
            {paused && !ended && (
              <div
                data-testid="btd-paused"
                role="dialog"
                aria-modal="true"
                aria-labelledby="btd-pause-title"
                className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-zinc-900/50"
              >
                <div className="flex w-56 flex-col gap-3 rounded-2xl bg-white p-5 text-center shadow-xl dark:bg-zinc-900">
                  <h2 id="btd-pause-title" className="text-lg font-bold">
                    {BLOONS_TEXTS.pause}
                  </h2>
                  <button
                    type="button"
                    data-testid="btd-resume"
                    autoFocus
                    onClick={() => setPaused(false)}
                    className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                  >
                    {BLOONS_TEXTS.resume}
                  </button>
                  <button
                    type="button"
                    data-testid="btd-restart"
                    onClick={restart}
                    className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    {BLOONS_TEXTS.restart}
                  </button>
                  <button
                    type="button"
                    data-testid="btd-pause-maps"
                    onClick={toMenu}
                    className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    {BLOONS_TEXTS.toMaps}
                  </button>
                </div>
              </div>
            )}

            {/* Der Knopf, der die Welle losschickt - mitten unter dem Feld, wo
              man ihn zwischen zwei Runden ohnehin sucht. */}
            {hud.phase === "ready" && (
              <button
                type="button"
                data-testid="btd-send"
                onClick={send}
                className="absolute inset-x-0 bottom-3 mx-auto w-fit cursor-pointer rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:bg-emerald-500"
              >
                {BLOONS_TEXTS.roundNext(hud.round + 1)}
              </button>
            )}
          </div>

          {/* Der Laden: Bilder nach Gruppen im Viererraster, und darunter -
            immer unten - die Beschreibung dessen, was man angeklickt hat.
            Die Liste scrollt, damit die Beschreibung neben dem Feld bleibt. */}
          <aside
            className={`flex w-72 shrink-0 flex-col gap-2 max-lg:w-full ${full ? "lg:h-full lg:overflow-y-auto" : ""}`}
          >
            <h2 className="text-sm font-semibold">{BLOONS_TEXTS.shop}</h2>
            <div className="flex min-h-0 flex-col gap-2 overflow-y-auto lg:max-h-[26rem] lg:pr-1">
              {GROUPS.map(({ group, name }) => (
                <div key={group} className="flex flex-col gap-1">
                  <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {name}
                  </h3>
                  <div className="grid grid-cols-4 gap-1.5 max-lg:grid-cols-6 max-sm:grid-cols-4">
                    {TOWER_ORDER.filter(
                      (kind) => TOWERS[kind].group === group,
                    ).map((kind) => (
                      <ShopTile
                        key={kind}
                        kind={kind}
                        money={hud.money}
                        price={priceOf(TOWERS[kind].cost, hud.difficulty)}
                        locked={unlocked(kind) ? null : UNLOCK[kind]}
                        picked={picked === kind}
                        onPick={() => pick(picked === kind ? null : kind)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <section className="shrink-0 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              {chosen !== null ? (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-bold">
                    {TOWERS[chosen.kind].name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {BLOONS_TEXTS.towerPops(chosen.pops)}
                  </p>
                  {aims(chosen.kind) && (
                    <div
                      role="radiogroup"
                      aria-label={BLOONS_TEXTS.target}
                      className="flex flex-col gap-1"
                    >
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        {BLOONS_TEXTS.target}
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {TARGETS.map((target) => (
                          <button
                            key={target}
                            type="button"
                            role="radio"
                            aria-checked={chosen.target === target}
                            data-testid={`btd-target-${target}`}
                            onClick={() => aimChosen(target)}
                            className={`cursor-pointer rounded-lg border px-2 py-1 text-xs font-semibold ${
                              chosen.target === target
                                ? "border-sky-500 bg-sky-600 text-white"
                                : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                            }`}
                          >
                            {BLOONS_TEXTS.targets[target]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {PATHS.map((path, nr) => (
                    <PathButton
                      key={path}
                      kind={chosen.kind}
                      tiers={chosen.tiers}
                      path={path}
                      nr={nr + 1}
                      money={hud.money}
                      difficulty={hud.difficulty}
                      onBuy={() => upgradeChosen(path)}
                    />
                  ))}
                  <button
                    type="button"
                    data-testid="btd-sell"
                    onClick={sellChosen}
                    className="cursor-pointer rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-500"
                  >
                    {BLOONS_TEXTS.sell(refundOf(hud.difficulty, chosen))}
                  </button>
                </div>
              ) : picked !== null ? (
                <div className="flex flex-col gap-1" data-testid="btd-note">
                  <h3 className="flex items-center justify-between gap-2 text-sm font-bold">
                    {TOWERS[picked].name}
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {BLOONS_TEXTS.cost(
                        priceOf(TOWERS[picked].cost, hud.difficulty),
                      )}
                    </span>
                  </h3>
                  <p className="text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                    {TOWERS[picked].note}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {TOWERS[picked].water
                      ? BLOONS_TEXTS.pickedWaterHint
                      : BLOONS_TEXTS.pickedHint}
                  </p>
                </div>
              ) : (
                <p className="text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                  {BLOONS_TEXTS.shopHint}
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {BLOONS_TEXTS.payout(payoutOf(hud.round))}
      </p>
    </div>
  );
}

/** Wie lange man für eine Schummelei gedrückt halten muss, in Millisekunden. */
const HOLD_MS = 1000;

/** Was ein Element braucht, damit es auf langes Drücken hört. */
type HoldHandlers = {
  readonly onPointerDown: () => void;
  readonly onPointerUp: () => void;
  readonly onPointerLeave: () => void;
  readonly onPointerCancel: () => void;
  readonly onContextMenu: (event: { preventDefault: () => void }) => void;
  readonly onClick: () => void;
};

/**
 * Langes Drücken: eine Sekunde gehalten, löst es aus.
 *
 * @param onHold - was nach einer Sekunde Drücken passiert
 * @param onClick - was ein gewöhnlicher Klick tut, oder nichts
 * @returns die Handler für das Element
 * @remarks
 * Das Loslassen nach dem langen Druck ist kein Klick mehr - sonst schaltete
 * ein lang gedrückter Auto-Start danach auch noch um.
 */
function useHold(onHold: () => void, onClick?: () => void): HoldHandlers {
  const timer = useRef<number | null>(null);
  const held = useRef(false);

  const stop = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  return {
    onPointerDown: () => {
      held.current = false;
      stop();
      timer.current = window.setTimeout(() => {
        held.current = true;
        timer.current = null;
        onHold();
      }, HOLD_MS);
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onContextMenu: (event) => event.preventDefault(),
    onClick: () => {
      if (!held.current) {
        onClick?.();
      }
      held.current = false;
    },
  };
}

/** Props of {@link SpeedButton}. */
type SpeedButtonProps = {
  readonly nr: number;
  readonly on: boolean;
  readonly onPick: () => void;
};

/** Ein Tempoknopf: normal, schnell oder Turbo - alle drei immer da. */
function SpeedButton({ nr, on, onPick }: SpeedButtonProps): ReactElement {
  return (
    <button
      type="button"
      data-testid={`btd-speed-${nr}`}
      aria-pressed={on}
      onClick={onPick}
      className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm select-none ${
        on
          ? "border-emerald-500 bg-emerald-600 text-white"
          : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      }`}
    >
      {PACE[nr] ?? BLOONS_TEXTS.turbo}
    </button>
  );
}

/** Die drei Zielwahlen, in der Reihenfolge der Knöpfe. */
const TARGETS: readonly Target[] = ["first", "last", "strong"];

/** Die beiden Säulen, in der Reihenfolge, in der sie dastehen. */
const PATHS: readonly Path[] = ["one", "two"];

/** Wie die drei Gangarten heißen. */
const PACE: readonly string[] = [
  BLOONS_TEXTS.normal,
  BLOONS_TEXTS.fast,
  BLOONS_TEXTS.turbo,
];

/** Props of {@link PathButton}. */
type PathButtonProps = {
  readonly kind: TowerKind;
  readonly tiers: Tiers;
  readonly path: Path;
  readonly nr: number;
  readonly money: number;
  /** Für die Preise. */
  readonly difficulty: Difficulty;
  readonly onBuy: () => void;
};

/**
 * Eine Säule mit ihrer nächsten Stufe.
 *
 * @remarks
 * Auf dem Knopf steht, was man bekommt, und nicht nur, was es kostet. Eine
 * Verbesserung, deren Wirkung man erst nach dem Kauf sieht, ist keine
 * Entscheidung, sondern ein Versuch.
 */
function PathButton({
  kind,
  tiers,
  path,
  nr,
  money,
  difficulty,
  onBuy,
}: PathButtonProps): ReactElement {
  const step = nextOf(kind, path, tiers);
  const price = step === null ? 0 : priceOf(step.cost, difficulty);
  const afford = step !== null && money >= price;
  // Auf einer vollen Säule steht, was man gekauft hat - nicht ein Strich.
  const shown = step ?? lastOf(kind, path, tiers);

  return (
    <button
      type="button"
      data-testid={`btd-upgrade-${path}`}
      onClick={onBuy}
      disabled={!afford}
      className="flex cursor-pointer flex-col gap-0.5 rounded-xl border border-zinc-200 p-2 text-left hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          {BLOONS_TEXTS.path(nr)} · {BLOONS_TEXTS.tierOf(tiers[path], MOST)}
        </span>
        <span
          className={`text-xs font-semibold ${afford ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-400"}`}
        >
          {step === null ? BLOONS_TEXTS.full : BLOONS_TEXTS.buy(price)}
        </span>
      </span>
      <span className="text-sm font-bold">{shown?.name ?? "-"}</span>
      <span className="text-xs leading-snug text-zinc-500 dark:text-zinc-400">
        {shown?.note ?? ""}
      </span>
    </button>
  );
}

/** Props of {@link ShopTile}. */
type ShopTileProps = {
  readonly kind: TowerKind;
  readonly money: number;
  /** Was er auf dieser Schwierigkeit kostet. */
  readonly price: number;
  /** Ab welchem Level er zu haben ist, oder null, wenn er es schon ist. */
  readonly locked: number | null;
  readonly picked: boolean;
  readonly onPick: () => void;
};

/**
 * Ein Affe im Laden: ein Bild, sonst nichts.
 *
 * @remarks
 * Vier nebeneinander, quadratisch, mit dem Preis am unteren Rand - der Name
 * und wofür er gut ist, stehen unten im Beschreibungsfeld, sobald man ihn
 * anklickt. Dreiundzwanzig Kacheln mit je drei Zeilen Text wären eine Liste
 * zum Lesen; hier soll man erkennen, nicht lesen.
 *
 * Ein Affe, der noch nicht freigeschaltet ist, steht trotzdem da - als
 * Schatten mit Schloss und dem Level, ab dem es ihn gibt. So weiß man, worauf
 * man hinspielt.
 */
function ShopTile({
  kind,
  money,
  price,
  locked,
  picked,
  onPick,
}: ShopTileProps): ReactElement {
  const monkey = TOWERS[kind];
  const afford = money >= price;

  return (
    <button
      type="button"
      data-testid={`btd-shop-${kind}`}
      aria-pressed={picked}
      aria-label={
        locked === null
          ? `${monkey.name}, ${BLOONS_TEXTS.cost(price)}`
          : `${monkey.name}, ${BLOONS_TEXTS.lockedAt(locked)}`
      }
      title={
        locked === null
          ? monkey.name
          : `${monkey.name} - ${BLOONS_TEXTS.lockedAt(locked)}`
      }
      onClick={onPick}
      disabled={locked !== null || (!afford && !picked)}
      className={`relative flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        picked
          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
          : "border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
      }`}
    >
      <span
        className={`block h-full w-full ${locked === null ? "" : "opacity-60 grayscale"}`}
      >
        <TowerIcon kind={kind} />
      </span>
      {locked !== null && (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center rounded-lg bg-zinc-900/50 text-xl"
        >
          {"\u{1F512}"}
        </span>
      )}
      <span
        className={`absolute inset-x-0 bottom-0 rounded-b-lg bg-white/80 py-0.5 text-center text-[0.65rem] leading-tight font-semibold dark:bg-zinc-900/80 ${
          locked !== null
            ? "text-zinc-600 dark:text-zinc-300"
            : afford
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
        }`}
      >
        {locked === null
          ? BLOONS_TEXTS.cost(price)
          : BLOONS_TEXTS.levelShort(locked)}
      </span>
    </button>
  );
}

/** Wie groß ein Ladenbild gezeichnet wird, in Bildpunkten. */
const ICON = 96;

/**
 * Das Bild eines Turms.
 *
 * @remarks
 * Gezeichnet mit demselben Zeichner wie auf dem Feld - wer im Laden eine
 * Kanone sieht, stellt eine Kanone auf die Wiese.
 */
function TowerIcon({ kind }: { readonly kind: TowerKind }): ReactElement {
  const iconRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = iconRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (canvas !== null && ctx !== null) {
      const dots = window.devicePixelRatio;
      canvas.width = ICON * dots;
      canvas.height = ICON * dots;
      ctx.setTransform(dots, 0, 0, dots, 0, 0);
      ctx.clearRect(0, 0, ICON, ICON);
      drawTower(ctx, kind, ICON);
    }
  }, [kind]);

  return (
    <canvas
      ref={iconRef}
      aria-hidden="true"
      className="pointer-events-none h-full w-full"
    />
  );
}

/** Props of {@link Stat}. */ /** Props of {@link Stat}. */
type StatProps = {
  readonly children: string;
  readonly testId?: string;
  /** Was langes Drücken auslöst, oder nichts. */
  readonly onHold?: () => void;
};

/** Nichts - für eine Zahl, die auf langes Drücken nicht hört. */
const IDLE = (): void => undefined;

/** Eine Zahl über dem Feld. */
function Stat({ children, testId, onHold }: StatProps): ReactElement {
  const hold = useHold(onHold ?? IDLE);
  return (
    <span
      {...(onHold === undefined ? {} : hold)}
      data-testid={testId}
      className="rounded-lg bg-zinc-100 px-2 py-1 text-sm font-medium select-none dark:bg-zinc-900"
    >
      {children}
    </span>
  );
}
