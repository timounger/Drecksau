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
import { payoutOf } from "@/games/bloons-td/engine/engine";
import {
  TOWERS,
  TOWER_ORDER,
  type TowerKind,
} from "@/games/bloons-td/engine/towers";
import {
  MOST,
  lastOf,
  nextOf,
  refundOfTower,
  type Path,
  type Tiers,
} from "@/games/bloons-td/engine/upgrades";
import { useBloonsGame, SPEEDS } from "@/games/bloons-td/hooks/use-bloons-game";
import { BLOONS_RULES } from "@/games/bloons-td/i18n/rules";
import { BLOONS_TEXTS } from "@/games/bloons-td/i18n/texts";
import { useFullscreen } from "@/lib/screen/use-fullscreen";
import { useShotRatio } from "@/lib/screen/use-shot-ratio";

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
    restart,
    setSpeed,
    cheat,
    paused,
    setPaused,
    auto,
    setAuto,
  } = useBloonsGame();
  const fieldRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(fieldRef);
  useShotRatio(canvasRef, fieldRef);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
      <GameHeader
        rules={BLOONS_RULES}
        title={BLOONS_TEXTS.title}
        subtitle={BLOONS_TEXTS.subtitle}
      >
        <button
          type="button"
          data-testid="btd-new-game"
          onClick={restart}
          title={BLOONS_TEXTS.newGameTitle}
          className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {BLOONS_TEXTS.newGame}
        </button>
        <button
          type="button"
          data-testid="btd-pause"
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium ${
            paused
              ? "border-sky-500 bg-sky-600 text-white"
              : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }`}
        >
          {paused ? BLOONS_TEXTS.resume : BLOONS_TEXTS.pause}
        </button>
        <button
          type="button"
          data-testid="btd-cheat"
          onClick={cheat}
          title={BLOONS_TEXTS.cheatTitle}
          className="cursor-pointer rounded-lg border border-amber-400 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/40"
        >
          {BLOONS_TEXTS.cheat}
        </button>
        {fullscreen.supported && (
          <button
            type="button"
            onClick={fullscreen.toggle}
            className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {fullscreen.active ? "Vollbild beenden" : "Vollbild"}
          </button>
        )}
        <Link
          href="/bloons-td/statistik"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {BLOONS_TEXTS.statistics}
        </Link>
      </GameHeader>

      {/* Die Zahlen, die man im Blick haben muss - und rechts das Tempo. */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Stat testId="btd-money">{BLOONS_TEXTS.money(hud.money)}</Stat>
          <Stat testId="btd-lives">{BLOONS_TEXTS.lives(hud.lives)}</Stat>
          <Stat testId="btd-round">{BLOONS_TEXTS.round(hud.round)}</Stat>
          <Stat>{BLOONS_TEXTS.left(hud.bloons + hud.waiting)}</Stat>
          <Stat>{BLOONS_TEXTS.popped(hud.popped)}</Stat>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="btd-auto"
            aria-pressed={auto}
            onClick={() => setAuto(!auto)}
            title={BLOONS_TEXTS.autoHint}
            className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${
              auto
                ? "border-sky-500 bg-sky-600 text-white"
                : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            {BLOONS_TEXTS.auto}
          </button>
          {SPEEDS.map((speed, nr) => (
            <button
              key={speed}
              type="button"
              data-testid={`btd-speed-${nr}`}
              aria-pressed={hud.speed === speed}
              onClick={() => setSpeed(speed)}
              className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${
                hud.speed === speed
                  ? "border-emerald-500 bg-emerald-600 text-white"
                  : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              {PACE[nr] ?? BLOONS_TEXTS.turbo}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 max-lg:flex-col">
        <div ref={fieldRef} className="game-fullscreen relative">
          <canvas
            ref={canvasRef}
            data-testid="btd-canvas"
            width={CANVAS_W}
            height={CANVAS_H}
            className="block w-full touch-none rounded-2xl border border-zinc-300 shadow-sm dark:border-zinc-700"
          />

          {hud.phase === "over" && (
            <div
              data-testid="btd-over"
              className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 rounded-2xl bg-red-950/70 text-center text-white"
            >
              <p className="text-2xl font-bold">{BLOONS_TEXTS.over}</p>
              <p className="text-sm">{BLOONS_TEXTS.overHint(hud.round)}</p>
              <button
                type="button"
                data-testid="btd-again"
                onClick={restart}
                className="cursor-pointer rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                {BLOONS_TEXTS.again}
              </button>
            </div>
          )}

          {paused && hud.phase !== "over" && (
            <div
              data-testid="btd-paused"
              className="pointer-events-none absolute inset-0 z-30 flex items-start justify-center rounded-2xl bg-zinc-900/30"
            >
              <p className="mt-6 rounded-full bg-zinc-900/80 px-4 py-1.5 text-sm font-semibold text-white">
                {BLOONS_TEXTS.pause}
              </p>
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

        {/* Der Laden: Bilder im Dreierraster, und darunter - immer unten -
            die Beschreibung dessen, was man angeklickt hat. */}
        <aside className="flex w-72 shrink-0 flex-col gap-2 max-lg:w-full">
          <h2 className="text-sm font-semibold">{BLOONS_TEXTS.shop}</h2>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-3 gap-2">
              {TOWER_ORDER.map((kind) => (
                <ShopTile
                  key={kind}
                  kind={kind}
                  money={hud.money}
                  picked={picked === kind}
                  onPick={() => pick(picked === kind ? null : kind)}
                />
              ))}
            </div>
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
                {PATHS.map((path, nr) => (
                  <PathButton
                    key={path}
                    kind={chosen.kind}
                    tiers={chosen.tiers}
                    path={path}
                    nr={nr + 1}
                    money={hud.money}
                    onBuy={() => upgradeChosen(path)}
                  />
                ))}
                <button
                  type="button"
                  data-testid="btd-sell"
                  onClick={sellChosen}
                  className="cursor-pointer rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-500"
                >
                  {BLOONS_TEXTS.sell(refundOfTower(chosen.kind, chosen.tiers))}
                </button>
              </div>
            ) : picked !== null ? (
              <div className="flex flex-col gap-1" data-testid="btd-note">
                <h3 className="flex items-center justify-between gap-2 text-sm font-bold">
                  {TOWERS[picked].name}
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {BLOONS_TEXTS.cost(TOWERS[picked].cost)}
                  </span>
                </h3>
                <p className="text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                  {TOWERS[picked].note}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {BLOONS_TEXTS.pickedHint}
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

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {BLOONS_TEXTS.payout(payoutOf(hud.round))}
      </p>
    </div>
  );
}

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
  onBuy,
}: PathButtonProps): ReactElement {
  const step = nextOf(kind, path, tiers);
  const afford = step !== null && money >= step.cost;
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
          {step === null ? BLOONS_TEXTS.full : BLOONS_TEXTS.buy(step.cost)}
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
  readonly picked: boolean;
  readonly onPick: () => void;
};

/**
 * Ein Affe im Laden: ein Bild, sonst nichts.
 *
 * @remarks
 * Drei nebeneinander, quadratisch, mit dem Preis am unteren Rand - der Name
 * und wofür er gut ist, stehen unten im Beschreibungsfeld, sobald man ihn
 * anklickt. Sechs Kacheln mit je drei Zeilen Text wären eine Liste zum Lesen;
 * hier soll man erkennen, nicht lesen.
 */
function ShopTile({
  kind,
  money,
  picked,
  onPick,
}: ShopTileProps): ReactElement {
  const monkey = TOWERS[kind];
  const afford = money >= monkey.cost;

  return (
    <button
      type="button"
      data-testid={`btd-shop-${kind}`}
      aria-pressed={picked}
      aria-label={`${monkey.name}, ${BLOONS_TEXTS.cost(monkey.cost)}`}
      title={monkey.name}
      onClick={onPick}
      disabled={!afford && !picked}
      className={`relative flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        picked
          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
          : "border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
      }`}
    >
      <TowerIcon kind={kind} />
      <span
        className={`absolute inset-x-0 bottom-0 rounded-b-lg bg-white/80 py-0.5 text-center text-[0.7rem] font-semibold dark:bg-zinc-900/80 ${
          afford
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {BLOONS_TEXTS.cost(monkey.cost)}
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
};

/** Eine Zahl über dem Feld. */
function Stat({ children, testId }: StatProps): ReactElement {
  return (
    <span
      data-testid={testId}
      className="rounded-lg bg-zinc-100 px-2 py-1 text-sm font-medium dark:bg-zinc-900"
    >
      {children}
    </span>
  );
}
