/**
 * "U-Boot" - der Bildschirm: Seekarte, Tauchgang, Pause und Daumenknöpfe.
 *
 * @module
 * @remarks
 * Two screens in one page, because they are two halves of one game: the chart
 * hands a course to the dive, the dive hands points back to the chart, and a
 * route change between them would throw away the canvas and the loop every
 * time. The diving and the drawing live in the engine and {@link ./render};
 * this component only lays things out and wires them to {@link useUbootGame}.
 */
"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { GameHeader } from "@/components/game-header";
import { AwardBoard } from "@/games/uboot/components/award-board";
import { AwardToast } from "@/games/uboot/components/award-toast";
import { useAwardNews } from "@/games/uboot/hooks/use-award-news";
import { LevelMap } from "@/games/uboot/components/level-map";
import { Panel, type PanelKind } from "@/games/uboot/components/panel";
import { SettingsBoard } from "@/games/uboot/components/settings-board";
import {
  UpgradeBoard,
  UpgradeTools,
} from "@/games/uboot/components/upgrade-board";
import { CANVAS_H, CANVAS_W } from "@/games/uboot/components/render";
import { useUbootGame, type Hud } from "@/games/uboot/hooks/use-uboot-game";
import { UBOOT_RULES } from "@/games/uboot/i18n/rules";
import { CodexBoard } from "@/games/uboot/components/codex-board";
import { Leaderboard, asClock } from "@/games/uboot/components/leaderboard";
import { CourseBrief } from "@/games/uboot/components/course-brief";
import { DeepGame } from "@/games/uboot/components/deep-game";
import { withGrade } from "@/games/uboot/settings/profile";
import { gradeAt } from "@/games/uboot/engine/grades";
import type { Profile } from "@/games/uboot/settings/profile";
import { UBOOT_TEXTS } from "@/games/uboot/i18n/texts";
import { useFullscreen } from "@/lib/screen/use-fullscreen";
import { useShotRatio } from "@/lib/screen/use-shot-ratio";

/** Turning the share of the course into whole percent. */
const PERCENT = 100;

/**
 * Renders the "U-Boot" game screen.
 *
 * @returns the game element
 */
export function UbootGame(): ReactElement {
  /**
   * Wo der Endlosmodus gerade steht.
   *
   * @remarks
   * Steht vor dem Spiel-Haken, weil er ihn schlafen legt: Solange der Schlund
   * das Fenster hat, rechnet die Kampagne nicht mit.
   */
  const [deep, setDeep] = useState<"off" | "pick" | "solo">("off");
  const {
    canvasRef,
    hud,
    view,
    profile,
    gained,
    dive,
    toMap,
    again,
    pause,
    keep,
    record,
  } = useUbootGame(deep !== "solo");

  // Was gerade dazugekommen ist, meldet sich oben im Bild - egal, ob man
  // gerade fährt, in der Werkstatt steht oder auf der Karte.
  const news = useAwardNews(profile);

  const stageRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(stageRef);
  useShotRatio(canvasRef, stageRef);
  const diving = view === "dive";
  /** Which of the three sheets is open over the window, if any. */
  const [panel, setPanel] = useState<PanelKind | null>(null);
  /**
   * Das Gewässer, dessen Bestenliste gerade offen ist.
   *
   * @remarks
   * **Zwischen Karte und Wasser liegt die Liste.** Ein Klick auf ein Gewässer
   * taucht nicht sofort ab, sondern zeigt erst, wer hier wie schnell war - und
   * genau dort steht dann der Knopf, der den Tauchgang startet. Wer eine Zeit
   * schlagen will, soll sie vorher gesehen haben.
   */
  const [waiting, setWaiting] = useState<number | null>(null);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
      <GameHeader
        rules={UBOOT_RULES}
        title={UBOOT_TEXTS.title}
        subtitle={UBOOT_TEXTS.subtitle}
      >
        {/* Immer, nicht nur im Tauchgang: Auf dem Telefon ist das Vollbild
            der einzige Weg zu einer Karte, auf der man etwas lesen kann - und
            dorthin will man, bevor man ein Gewässer aussucht. */}
        {fullscreen.supported && (
          <button
            type="button"
            data-testid="uboot-fullscreen"
            onClick={fullscreen.toggle}
            className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {fullscreen.active
              ? UBOOT_TEXTS.fullscreenExit
              : UBOOT_TEXTS.fullscreen}
          </button>
        )}
        <Link
          href="/uboot/statistik"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {UBOOT_TEXTS.statistics}
        </Link>
      </GameHeader>

      {/* **One window for everything.** The canvas always lies in the layout,
          because it is what gives the frame its size and proportions; the
          chart and the three sheets are laid over it. Nothing here is ever
          unmounted, so a trip to the workshop cannot cost anybody the dive
          they had going. */}
      <div ref={stageRef} className="game-fullscreen flex flex-col gap-4">
        {deep === "solo" ? (
          <DeepGame onExit={() => setDeep("off")} />
        ) : (
          <div className="game-shot relative">
            <canvas
              ref={canvasRef}
              data-testid="uboot-canvas"
              width={CANVAS_W}
              height={CANVAS_H}
              className="block w-full touch-none rounded-2xl border border-zinc-300 shadow-sm dark:border-zinc-700"
            />

            {!diving && (
              <LevelMap
                profile={profile}
                onDive={(level) => setWaiting(level)}
                onOpen={setPanel}
                onDeep={() => setDeep("pick")}
              />
            )}

            {!diving && deep === "pick" && (
              <DeepChoice
                onSolo={() => setDeep("solo")}
                onClose={() => setDeep("off")}
              />
            )}

            {!diving && waiting !== null && (
              <CourseBrief
                level={waiting}
                profile={profile}
                onGrade={(grade) => keep(withGrade(profile, grade))}
                onClose={() => setWaiting(null)}
                onStart={() => {
                  const level = waiting;
                  setWaiting(null);
                  dive(level);
                }}
              />
            )}

            {panel !== null && (
              <Sheets
                kind={panel}
                profile={profile}
                onKeep={keep}
                onClose={() => setPanel(null)}
              />
            )}

            {/* **Auch bevor es losgeht.** Der Tauchgang beginnt erst mit dem
              ersten Druck nach vorn - und bis dahin führt nur dieser Knopf
              zurück zur Seekarte. Ein Weg hinaus, den es erst gibt, wenn man
              drin ist, ist keiner. */}
            {diving && !hud.paused && (
              <button
                type="button"
                data-testid="uboot-pause"
                onClick={() => pause(true)}
                aria-label={UBOOT_TEXTS.pause}
                className="absolute top-3 right-3 z-40 cursor-pointer rounded-lg bg-black/55 px-3 py-1.5 text-sm font-medium text-white backdrop-blur hover:bg-black/75"
              >
                {"\u23F8"} {UBOOT_TEXTS.pause}
              </button>
            )}

            {diving && (
              <Overlay
                hud={hud}
                gained={gained}
                record={record}
                onAgain={again}
                onResume={() => pause(false)}
                onMap={toMap}
              />
            )}

            {fullscreen.active && (
              <button
                type="button"
                onClick={fullscreen.toggle}
                className="absolute right-3 bottom-3 z-50 cursor-pointer rounded-lg bg-black/60 px-3 py-1.5 text-sm font-medium text-white backdrop-blur hover:bg-black/75"
              >
                {UBOOT_TEXTS.fullscreenExit}
              </button>
            )}

            {/* Ganz oben und über allem: Was man eben verdient hat, soll man
                sehen, ohne das Spiel dafür zu verlassen. */}
            <AwardToast news={news} />
          </div>
        )}

        {/* Auf dem Telefon wird im Bild gesteuert - links das Kreuz unter
            dem Daumen, rechts feuern. Hier steht nur noch, was die Tasten
            tun; Knöpfe unter dem Bild kosten den Platz, den das Spiel
            braucht. */}
        {diving && (
          <div className="game-controls flex w-full flex-col gap-3">
            <div className="game-hint text-center text-xs text-zinc-500 dark:text-zinc-400">
              {UBOOT_TEXTS.controlsHint}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Props of {@link DeepChoice}. */
type DeepChoiceProps = {
  readonly onSolo: () => void;
  readonly onClose: () => void;
};

/**
 * Das Blatt zwischen Seekarte und Schlund: allein oder zu zweit.
 *
 * @param props - was die beiden Wege tun
 * @returns das Blatt
 * @remarks
 * **Zwei Wege und keine Voreinstellung.** Der Koop ist kein Zusatz, der in
 * einer Ecke steht, sondern die zweite Hälfte dieses Modus - also wird
 * gefragt, bevor es losgeht, und nicht erst, wenn man schon unten ist.
 */
function DeepChoice({ onSolo, onClose }: DeepChoiceProps): ReactElement {
  return (
    <div
      data-testid="uboot-deep-pick"
      className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 rounded-2xl bg-slate-950/80 p-6 text-center text-white backdrop-blur"
    >
      <div>
        <p className="text-2xl font-bold">{UBOOT_TEXTS.deepName}</p>
        <p className="mt-1 max-w-md text-sm text-slate-200">
          {UBOOT_TEXTS.deepHint}
        </p>
      </div>
      <p className="text-sm font-semibold">{UBOOT_TEXTS.deepPick}</p>
      <div className="flex flex-wrap items-stretch justify-center gap-3">
        <button
          type="button"
          data-testid="uboot-deep-solo"
          onClick={onSolo}
          className="flex w-48 cursor-pointer flex-col gap-1 rounded-xl bg-emerald-600 px-4 py-3 text-left hover:bg-emerald-500"
        >
          <span className="text-sm font-bold">{UBOOT_TEXTS.deepSolo}</span>
          <span className="text-xs text-emerald-50">
            {UBOOT_TEXTS.deepSoloHint}
          </span>
        </button>
        <Link
          href="/uboot/online"
          data-testid="uboot-deep-coop"
          className="flex w-48 flex-col gap-1 rounded-xl border border-white/50 px-4 py-3 text-left hover:bg-white/15"
        >
          <span className="text-sm font-bold">{UBOOT_TEXTS.deepCoop}</span>
          <span className="text-xs text-slate-200">
            {UBOOT_TEXTS.deepCoopHint}
          </span>
        </Link>
      </div>
      <p className="max-w-md text-xs text-slate-300">{UBOOT_TEXTS.deepBoons}</p>
      <button
        type="button"
        onClick={onClose}
        className="cursor-pointer rounded-lg border border-white/40 px-4 py-1.5 text-sm hover:bg-white/10"
      >
        {UBOOT_TEXTS.close}
      </button>
    </div>
  );
}

/** Props of {@link Sheets}. */
type SheetsProps = {
  readonly kind: PanelKind;
  readonly profile: Profile;
  readonly onKeep: (profile: Profile) => void;
  readonly onClose: () => void;
};

/** Whichever of the three sheets is open. */
function Sheets({ kind, profile, onKeep, onClose }: SheetsProps): ReactElement {
  let sheet: ReactElement;

  switch (kind) {
    case "upgrades":
      sheet = (
        <Panel
          icon={"\u{1F528}"}
          title={UBOOT_TEXTS.upgrades}
          onClose={onClose}
          // Oben rechts, wo die Werkzeuge eines Blattes hingehören: der
          // Punktestand und der Knopf, der alles wieder herausholt.
          tools={<UpgradeTools profile={profile} onChange={onKeep} />}
          // Der Baum passt ins Blatt und soll nicht rollen.
          scroll={false}
        >
          <UpgradeBoard profile={profile} onChange={onKeep} />
        </Panel>
      );
      break;
    case "settings":
      sheet = (
        <Panel
          icon={"\u2699\uFE0F"}
          title={UBOOT_TEXTS.settings}
          onClose={onClose}
        >
          <SettingsBoard profile={profile} onChange={onKeep} />
        </Panel>
      );
      break;
    case "encyclopedia":
      sheet = (
        <Panel
          icon={"\u{1F4D6}"}
          title={UBOOT_TEXTS.encyclopedia}
          onClose={onClose}
        >
          <CodexBoard />
        </Panel>
      );
      break;
    default:
      sheet = (
        <Panel
          icon={"\u{1F3C6}"}
          title={UBOOT_TEXTS.trophies}
          onClose={onClose}
          // Die Tafel rollt selbst, und zwar nach rechts.
          scroll={false}
        >
          <AwardBoard profile={profile} />
        </Panel>
      );
  }

  return sheet;
}

/** Props of {@link Overlay}. */
type OverlayProps = {
  readonly hud: Hud;
  /** What the dive that just ended paid. */
  readonly gained: number;
  /** Und ob es die bisher höchste Schwierigkeit hier war. */
  readonly record: boolean;
  readonly onAgain: () => void;
  readonly onResume: () => void;
  readonly onMap: () => void;
};

/**
 * The screen over the canvas: before a dive, while it is held, after it ends.
 *
 * @param props - the dive as the screen sees it, and what the buttons do
 * @returns the overlay, or nothing while the dive is running
 */
export function Overlay({
  hud,
  gained,
  record,
  onAgain,
  onResume,
  onMap,
}: OverlayProps): ReactElement | null {
  const share = Math.round(hud.share * PERCENT);
  let screen: ReactElement | null = null;

  if (hud.paused) {
    screen = (
      <Sheet tone="bg-zinc-900/80" testId="uboot-paused">
        <p className="text-2xl font-bold">
          {"⏸"} {UBOOT_TEXTS.paused}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Action onClick={onResume} testId="uboot-resume">
            {UBOOT_TEXTS.resume}
          </Action>
          <Action onClick={onAgain} quiet>
            {UBOOT_TEXTS.repeat}
          </Action>
          <Action onClick={onMap} quiet testId="uboot-to-map">
            {UBOOT_TEXTS.toMap}
          </Action>
        </div>
      </Sheet>
    );
  } else if (!hud.running && hud.phase === "diving") {
    // **Kein Schirm, nur ein Hinweis.** Er liegt am Fuß des Bildes, nimmt
    // keine Klicks entgegen und verschwindet in dem Moment, in dem man
    // losfährt - denn genau das startet den Tauchgang.
    screen = (
      <div
        data-testid="uboot-waiting"
        className="pointer-events-none absolute inset-x-0 bottom-6 z-40 flex flex-col items-center gap-1 text-center text-white"
      >
        <span className="rounded-lg bg-black/55 px-4 py-2 text-sm font-semibold backdrop-blur">
          {UBOOT_TEXTS.course} {hud.level + 1} - {hud.name}
        </span>
        <span className="rounded-lg bg-black/45 px-3 py-1 text-xs backdrop-blur">
          {UBOOT_TEXTS.startHint}
        </span>
        <span className="rounded-lg bg-black/45 px-3 py-1 text-xs backdrop-blur">
          {gradeAt(hud.grade).name}
          {" \u00B7 "}
          {hud.best < 0
            ? UBOOT_TEXTS.gradeNever
            : UBOOT_TEXTS.gradeBest(gradeAt(hud.best).name)}
        </span>
      </div>
    );
  } else if (hud.phase === "wrecked" || hud.phase === "drowned") {
    const sunk = hud.phase === "wrecked";
    screen = (
      <Sheet
        tone={sunk ? "bg-red-950/60" : "bg-sky-950/65"}
        testId="uboot-lost"
      >
        <p className="text-2xl font-bold">
          {sunk ? "\u{1F4A5}" : "\u{1FAE7}"}{" "}
          {sunk ? UBOOT_TEXTS.wrecked : UBOOT_TEXTS.drowned}
        </p>
        <p className="text-sm text-zinc-100">
          {sunk
            ? UBOOT_TEXTS.wreckedHint(share)
            : UBOOT_TEXTS.drownedHint(share)}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Action onClick={onAgain}>{UBOOT_TEXTS.again}</Action>
          <Action onClick={onMap} quiet testId="uboot-to-map">
            {UBOOT_TEXTS.toMap}
          </Action>
        </div>
      </Sheet>
    );
  } else if (hud.phase === "arrived") {
    screen = (
      <Sheet tone="bg-zinc-900/55" testId="uboot-won">
        <Won
          gained={gained}
          seconds={hud.time}
          level={hud.level}
          name={hud.name}
          last={hud.level + 1 >= hud.levels}
          grade={hud.grade}
          best={hud.best}
          record={record}
          onAgain={onAgain}
          onMap={onMap}
        />
      </Sheet>
    );
  }

  return screen;
}

/** Props of {@link Won}. */
type WonProps = {
  /** What the dive paid. */
  readonly gained: number;
  /** How long it took. */
  readonly seconds: number;
  /** Whether that was the last water there is. */
  readonly last: boolean;
  readonly onAgain: () => void;
  /** Welches Gewässer es war, für die Bestenliste. */
  readonly level: number;
  readonly name: string;
  /** Auf welcher Stufe gefahren wurde, und was hier bisher das Höchste war. */
  readonly grade: number;
  readonly best: number;
  /** Ob gerade eben eine neue Bestleistung daraus wurde. */
  readonly record: boolean;
  readonly onMap: () => void;
};

/**
 * Was am Ende eines geschafften Kurses aufgeht.
 *
 * @param props - what it paid, how long it took and what happens next
 * @returns the celebration
 * @remarks
 * **Eine Sekunde Feier, dann zwei Knöpfe.** Die Flagge springt, ein Ring geht
 * nach außen, und die Punkte laufen von null auf das hoch, was es gab - denn
 * eine Zahl, die einfach dasteht, ist etwas, das man liest, und eine, die
 * hochläuft, ist etwas, das man bekommen hat. Der Rest der Feier liegt hinter
 * dem Blatt auf dem Wasser ({@link ./render cheer}).
 */
function Won({
  gained,
  seconds,
  level,
  name,
  last,
  grade,
  best,
  record,
  onAgain,
  onMap,
}: WonProps): ReactElement {
  const counted = useCountUp(gained);

  return (
    <>
      <span className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
        <span aria-hidden="true" className="animate-bounce text-5xl">
          {"\u{1F3C1}"}
        </span>
      </span>
      <p className="text-2xl font-bold">{UBOOT_TEXTS.arrived}</p>
      <p className="text-sm text-zinc-200">
        {/* Auf die Millisekunde, genau wie auf der Bestenliste - zwei gute
            Fahrten trennt oft weniger als ein Zehntel. */}
        {UBOOT_TEXTS.arrivedIn(asClock(seconds * A_SECOND))}
      </p>
      <p
        data-testid="uboot-earned"
        className="text-2xl font-extrabold text-amber-300"
      >
        {UBOOT_TEXTS.earned(counted)}
      </p>
      {gained === 0 && (
        <p className="max-w-md text-xs text-zinc-300">{UBOOT_TEXTS.capped}</p>
      )}
      {/* Auf welcher Stufe das hier war - und was in diesem Gewässer bisher
          das Höchste war. Beides nebeneinander, damit man sieht, ob noch
          etwas geht. */}
      <p
        data-testid="uboot-grade-done"
        className="flex flex-wrap items-center justify-center gap-2 text-sm"
      >
        <span className="rounded-full bg-white/15 px-3 py-1 font-semibold">
          {UBOOT_TEXTS.gradeDone(gradeAt(grade).name)}
        </span>
        {record ? (
          <span className="rounded-full bg-amber-400/90 px-3 py-1 font-bold text-amber-950">
            {UBOOT_TEXTS.gradeNew}
          </span>
        ) : (
          <span className="text-zinc-300">
            {UBOOT_TEXTS.gradeBest(gradeAt(best).name)}
          </span>
        )}
      </p>
      {last && (
        <p className="text-base font-semibold text-emerald-300">
          {UBOOT_TEXTS.allDone}
        </p>
      )}
      {/* Die Bestenliste gleich hier: Der Moment, in dem die Zeit feststeht,
          ist der einzige, in dem sie jemanden interessiert. */}
      <Leaderboard
        level={level}
        name={name}
        run={{ ms: Math.round(seconds * A_SECOND), whole: true }}
      />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Action onClick={onMap} testId="uboot-onwards">
          {UBOOT_TEXTS.carryOnToMap}
        </Action>
        <Action onClick={onAgain} quiet testId="uboot-repeat">
          {UBOOT_TEXTS.repeat}
        </Action>
      </div>
    </>
  );
}

/** How long the points take to count up, in milliseconds. */
const COUNT_MS = 900;

/** Millisekunden in einer Sekunde, für die Zeit auf der Bestenliste. */
const A_SECOND = 1000;

/**
 * Counts from nought up to a number.
 *
 * @param target - what it counts to
 * @returns where the count is now
 * @remarks
 * Per animation frame rather than on a timer, so it is as smooth as the game
 * itself and stops the moment the screen goes away.
 */
function useCountUp(target: number): number {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let raf = 0;
    const from = performance.now();
    const tick = (now: number) => {
      const share = Math.min(1, (now - from) / COUNT_MS);
      setShown(Math.round(target * share));
      if (share < 1) {
        raf = window.requestAnimationFrame(tick);
      }
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [target]);

  return shown;
}

/** Props of {@link Sheet}. */
type SheetProps = {
  /** The wash over the picture - each ending has its own colour. */
  readonly tone: string;
  readonly testId: string;
  readonly children: ReactNode;
};

/** The sheet an overlay is written on. */
function Sheet({ tone, testId, children }: SheetProps): ReactElement {
  return (
    <div
      data-testid={testId}
      className={`absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 overflow-y-auto rounded-2xl p-4 text-center text-white ${tone}`}
    >
      {children}
    </div>
  );
}

/** Props of {@link Action}. */
type ActionProps = {
  readonly onClick: () => void;
  readonly children: string;
  /** Quiet ones are the way out, loud ones are what most people want next. */
  readonly quiet?: boolean;
  readonly testId?: string;
};

/** A button on one of the overlays. */
function Action({
  onClick,
  children,
  quiet,
  testId,
}: ActionProps): ReactElement {
  const look =
    quiet === true
      ? "border border-white/50 text-white hover:bg-white/15"
      : "bg-emerald-600 text-white hover:bg-emerald-500";
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`cursor-pointer rounded-lg px-5 py-2 text-sm font-semibold ${look}`}
    >
      {children}
    </button>
  );
}
