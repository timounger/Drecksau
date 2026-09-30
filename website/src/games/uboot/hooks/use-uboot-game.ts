/**
 * Drives the whole game from React: die Karte, der Tauchgang und die Pause.
 *
 * @module
 * @remarks
 * The world lives in a ref and is advanced once per animation frame, so the
 * loop never waits on React. Only the handful of facts the screen shows are
 * mirrored into state, and only when they really change - otherwise every
 * frame would be a re-render of the whole page.
 *
 * Two things besides the dive live here, because both have to be true at the
 * same moment as the dive: **which screen is showing** (the chart or the
 * water) and **the profile**, which is what a finished course pays into.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { diving, progress, step } from "@/games/uboot/engine/engine";
import { courseFor, startDive } from "@/games/uboot/engine/setup";
import { LEVELS, LEVEL_COUNT, darkness } from "@/games/uboot/engine/levels";
import type { Course } from "@/games/uboot/engine/course";
import {
  SURFACE,
  type GameState,
  type Input,
  type Phase,
} from "@/games/uboot/engine/types";
import type { Gun, WeaponKind } from "@/games/uboot/engine/upgrades";
import { CANVAS_H, CANVAS_W, draw } from "@/games/uboot/components/render";
import { createControls } from "@/games/uboot/hooks/controls";
import { createTouch } from "@/games/uboot/hooks/touch-controls";
import {
  NEVER,
  NEW_PROFILE,
  bestOf,
  canPlay,
  gearOf,
  loadProfile,
  saveProfile,
  withMastered,
  type Profile,
} from "@/games/uboot/settings/profile";
import { useReady } from "@/lib/storage/use-ready";
import {
  engine,
  hum,
  play,
  quiet,
  warm,
  type Noise,
} from "@/games/uboot/audio/sounds";
import { useVolumes } from "@/games/uboot/hooks/use-volumes";
import { fitCanvas } from "@/lib/screen/fit-canvas";
import {
  recordGameFinished,
  recordGameStarted,
  recordPlayTime,
} from "@/lib/stats/stats-recorder";
import { invalidateStats } from "@/lib/stats/stats-store";
import type { GameId } from "@/games/registry";

/** Which game the statistics are recorded under. */
const GAME_ID: GameId = "uboot";

/** Milliseconds in a second, for turning frame timestamps into seconds. */
const MS_PER_SECOND = 1000;

/** How often gathered play time is written to the statistics, in ms. */
const STATS_FLUSH_MS = 4000;

/** Longest single frame that still counts as play time, in seconds. */
const MAX_FRAME_S = 0.1;

/** Ab wie wenig Luft gewarnt wird, in Sekunden. */
const AIR_WARN = 15;

/**
 * Wie jede Waffe klingt.
 *
 * @remarks
 * Drei Waffen, drei Geräusche. Wer den Torpedo gekauft hat, soll ihn auch
 * hören - eine neue Waffe, die klingt wie die alte, fühlt sich an wie keine.
 */
const SHOT_VOICE: Readonly<Record<WeaponKind, Noise>> = {
  harpoon: "shot",
  torpedo: "launch",
  mine: "lay",
};

/** How finely the bars are mirrored into React. */
const STEPS = 100;

/**
 * Und wie fein die Uhr läuft.
 *
 * @remarks
 * Auf die Millisekunde, weil die Bestenliste auf die Millisekunde geht: Zwei
 * gute Fahrten durch dasselbe Gewässer trennt oft weniger als ein Zehntel.
 */
const TICKS = 1000;

/** Which screen is showing. */
export type View = "map" | "dive";

/** What the screen needs to know about the dive. */
export type Hud = {
  /** Whether a dive is under way right now. */
  readonly running: boolean;
  /** And whether it is standing still because somebody asked it to. */
  readonly paused: boolean;
  readonly phase: Phase;
  /** Which course, counted from zero. */
  readonly level: number;
  /** What it is called. */
  readonly name: string;
  /** How many courses there are. */
  readonly levels: number;
  /** How far along the course the boat got, from nought to one. */
  readonly share: number;
  /** How long the dive took, in seconds. */
  readonly time: number;
  /** How much air is left, from nought to one. */
  readonly air: number;
  /** And how much hull, in hits. */
  readonly hull: number;
  readonly hullMax: number;
  /** Auf welcher Schwierigkeit dieser Tauchgang läuft. */
  readonly grade: number;
  /** Und wie weit man es in diesem Gewässer schon gebracht hat. */
  readonly best: number;
  /** Was im Rohr steckt, falls etwas drin ist. */
  readonly gun: Gun | null;
  /** Und ob Seeminen dazukommen. */
  readonly mines: boolean;
};

/** What the game screen gets from the hook. */
export type UbootGame = {
  readonly canvasRef: React.RefObject<HTMLCanvasElement | null>;
  readonly hud: Hud;
  /** Which screen is showing. */
  readonly view: View;
  /** Everything the player has kept: points, upgrades, mastered waters. */
  readonly profile: Profile;
  /** What the dive that just ended paid, for the overlay. */
  readonly gained: number;
  /** Und ob es dabei die höchste Schwierigkeit war, die hier je gelang. */
  readonly record: boolean;
  /** Takes a course from the chart and goes diving. */
  readonly dive: (level: number) => void;
  /** Back to the chart. */
  readonly toMap: () => void;
  /** Begins the course that is showing. */
  readonly start: () => void;
  /** Dives the same course again. */
  readonly again: () => void;
  /** Holds everything still, or lets it go again. */
  readonly pause: (held: boolean) => void;
  /** Takes a changed profile from the workshop and writes it away. */
  readonly keep: (profile: Profile) => void;
};

/**
 * Runs the game.
 *
 * @returns the canvas ref, the facts the screens show and everything they do
 */
export function useUbootGame(): UbootGame {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(startDive(0));
  const courseRef = useRef<Course>(courseFor(0));
  const runningRef = useRef(false);
  const pausedRef = useRef(false);
  const controlsRef = useRef(createControls());
  const touchRef = useRef(createTouch());
  /** Was die Schleife über React wissen muss, ohne neu gebaut zu werden. */
  const viewRef = useRef<View>("map");
  const startRef = useRef<() => void>(() => undefined);
  /** When the dive ended, for the age of the bang. */
  const endedRef = useRef(0);

  const [hud, setHud] = useState<Hud>(() =>
    hudOf(startDive(0), 0, false, false, NEVER),
  );
  const hudRef = useRef(hud);
  const [view, setView] = useState<View>("map");
  // **What is stored is only read once the page is standing**, and from the
  // first dive that pays out, what is shown is what was earned here. The
  // prerendered HTML is a player with nothing, which is exactly what a new
  // player has - so nothing ever flickers from wrong to right.
  const ready = useReady();
  const [earned, setEarned] = useState<Profile | null>(null);
  const profile = earned ?? (ready ? loadProfile() : NEW_PROFILE);
  const profileRef = useRef(profile);
  const [gained, setGained] = useState(0);
  const [record, setRecord] = useState(false);
  // Die beiden Regler aus den Einstellungen an den Tongeber hängen.
  useVolumes();

  const syncHud = useCallback((state: GameState) => {
    const next = hudOf(
      state,
      progress(state, courseRef.current),
      runningRef.current,
      pausedRef.current,
      bestOf(profileRef.current, state.level),
    );
    if (!sameHud(next, hudRef.current)) {
      hudRef.current = next;
      setHud(next);
    }
  }, []);

  /** Statistics of the dive: whether its end was counted, and time not yet written. */
  const tally = useRef({ ended: false, unflushedMs: 0 });

  const flushTime = useCallback(() => {
    const spent = tally.current.unflushedMs;
    if (spent > 0) {
      tally.current.unflushedMs = 0;
      recordPlayTime(GAME_ID, spent, Date.now());
      invalidateStats();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (canvas === null || ctx === null) {
      return;
    }
    const controls = controlsRef.current;
    const thumb = touchRef.current;
    // Die Tondateien gleich beim Öffnen holen: Sonst wäre der erste Schuss
    // gerechnet und der zweite geladen, und genau das hört man.
    warm();
    const stopListening = controls.listen(window);
    const stopTouching = thumb.listen(canvas);
    /**
     * Tastatur, Maus oder Daumen - was gedrückt ist, zählt.
     *
     * @remarks
     * Der Zielpunkt kommt von der Leinwand und muss in den Kurs umgerechnet
     * werden, bevor die Engine ihn sieht: **Geklickt wird auf ein Bild, gezielt
     * wird auf eine Stelle im Wasser.** Wer das verwechselt, dessen Schuss
     * verzieht mit jedem Meter, den das Fenster weiterläuft.
     */
    const asked = (): Input => {
      const keys = controls.read();
      const pad = thumb.read();
      const at = pad.aim;
      return {
        up: keys.up || pad.up,
        down: keys.down || pad.down,
        back: keys.back || pad.back,
        forward: keys.forward || pad.forward,
        fire: keys.fire || pad.fire,
        drop: keys.drop || pad.drop,
        aim:
          at === null
            ? null
            : {
                x: at.x + stateRef.current.window,
                y: at.y - SURFACE,
              },
      };
    };

    let raf = 0;
    let last = performance.now();
    let sinceFlush = 0;

    /**
     * Was man von einem Bild zum nächsten hört.
     *
     * @remarks
     * Aus dem Unterschied zweier Weltzustände und nicht aus Rückrufen in der
     * Engine: Die Engine bleibt damit rein, und was man hört, ist garantiert
     * das, was wirklich passiert ist.
     */
    const sing = (was: GameState, now: GameState) => {
      if (now.fired > was.fired) {
        // Das Erste, was neu im Wasser ist, sagt, was man hört.
        const fresh = now.shots.find((one) => one.id >= was.fired);
        play(SHOT_VOICE[fresh?.kind ?? now.gear.gun ?? "mine"]);
      }
      if (now.blasts.length > was.blasts.length) {
        play("boom");
      }
      if (now.hull < was.hull) {
        play("hit");
      }
      if (now.beasts.length < was.beasts.length) {
        play("critter");
      }
      if (was.air > AIR_WARN && now.air <= AIR_WARN) {
        play("air");
      }
    };

    /** Everything that happens the moment a dive stops being one. */
    const endDive = (state: GameState) => {
      runningRef.current = false;
      hum(false);
      play(state.phase === "arrived" ? "win" : "lose");
      endedRef.current = performance.now();
      if (!tally.current.ended) {
        tally.current.ended = true;
        flushTime();
        recordGameFinished(GAME_ID, {
          won: state.phase === "arrived",
          durationMs: state.time * MS_PER_SECOND,
          finishedAt: Date.now(),
        });
        invalidateStats();
      }
      if (state.phase === "arrived") {
        // **Vor dem Schreiben gefragt**, ob das hier die beste Fahrt war - eine
        // Sekunde später steht die neue Bestleistung drin und niemand könnte
        // es mehr auseinanderhalten.
        setRecord(state.grade > bestOf(profileRef.current, state.level));
        // The one moment points are earned. Written away at once: a player who
        // closes the tab on the victory screen has still mastered the water.
        const paid = withMastered(profileRef.current, state.level, state.grade);
        profileRef.current = paid.profile;
        saveProfile(paid.profile);
        setEarned(paid.profile);
        setGained(paid.gained);
      } else {
        setGained(0);
        setRecord(false);
      }
    };

    const frame = (now: number) => {
      const dt = (now - last) / MS_PER_SECOND;
      last = now;
      const want = asked();
      const under =
        runningRef.current && !pausedRef.current && diving(stateRef.current);
      // Das Fahrgeräusch hängt an genau dem, was man auch sieht: Schub.
      engine(under && want.forward);

      if (under) {
        const was = stateRef.current;
        stateRef.current = step(stateRef.current, courseRef.current, want, dt);
        sing(was, stateRef.current);
        tally.current.unflushedMs += Math.min(dt, MAX_FRAME_S) * MS_PER_SECOND;
        sinceFlush += dt * MS_PER_SECOND;
        if (sinceFlush >= STATS_FLUSH_MS) {
          sinceFlush = 0;
          flushTime();
        }
        if (!diving(stateRef.current)) {
          endDive(stateRef.current);
        }
      } else {
        // **Losgefahren wird losgefahren.** Kein Knopf, keine Rückfrage: Wer
        // vorwärts drückt, will tauchen, und das ist die einzige Auskunft, die
        // dafür nötig ist.
        const ready =
          viewRef.current === "dive" &&
          !runningRef.current &&
          diving(stateRef.current) &&
          !pausedRef.current;
        if (ready && want.forward) {
          startRef.current();
        } else {
          controls.forget();
          thumb.forget();
        }
      }

      syncHud(stateRef.current);
      const dots = fitCanvas(canvas, CANVAS_W, CANVAS_H);
      ctx.setTransform(dots, 0, 0, dots, 0, 0);
      draw(ctx, stateRef.current, courseRef.current, {
        since: (now - endedRef.current) / MS_PER_SECOND,
        level: stateRef.current.level + 1,
        levels: LEVEL_COUNT,
        name: courseRef.current.name,
        // Für neun Gewässer eine feste Zahl; für die letzte Fahrt wächst sie
        // über den Kurs, weil sie im Hellen anfängt und im Schwarzen endet.
        pad: thumb.view(),
        // Das Zielkreuz bleibt in Bildpunkten: Es gehört dorthin, wo der Zeiger
        // steht, und nicht dorthin, wo der Schuss hinfliegt.
        aim: thumb.read().aim,
        dark: darkness(
          LEVELS[stateRef.current.level],
          progress(stateRef.current, courseRef.current),
        ),
      });
      raf = window.requestAnimationFrame(frame);
    };
    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      flushTime();
      stopListening();
      stopTouching();
      // Wer die Seite verlässt, nimmt die Schleifen nicht mit.
      quiet();
    };
  }, [syncHud, flushTime]);

  const beginDive = useCallback(
    (level: number) => {
      const gear = gearOf(profileRef.current);
      // Die Schwierigkeit steckt im Kurs: Sie entscheidet, wie schnell das
      // Wasser nachläuft und wie viel darin lebt - also wird beides hier
      // zusammen gebaut.
      const grade = profileRef.current.grade;
      stateRef.current = startDive(level, gear, grade);
      courseRef.current = courseFor(level, grade);
      tally.current = { ended: false, unflushedMs: 0 };
      runningRef.current = true;
      pausedRef.current = false;
      hum(true);
      setGained(0);
      setRecord(false);
      recordGameStarted(GAME_ID, Date.now());
      invalidateStats();
      syncHud(stateRef.current);
    },
    [syncHud],
  );

  /** Shows a course without starting it, so it can be looked at first. */
  const showLevel = useCallback(
    (level: number) => {
      runningRef.current = false;
      pausedRef.current = false;
      hum(false);
      const grade = profileRef.current.grade;
      stateRef.current = startDive(level, gearOf(profileRef.current), grade);
      courseRef.current = courseFor(level, grade);
      syncHud(stateRef.current);
    },
    [syncHud],
  );

  // The loop reads the profile from a ref, because it runs outside React and
  // must not be re-created when points change.
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // Escape is the pause key everywhere, and the one people try first.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && runningRef.current) {
        pausedRef.current = !pausedRef.current;
        syncHud(stateRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [syncHud]);

  /**
   * Writes a changed profile away and shows it.
   *
   * @remarks
   * The ref is set here as well as by the effect below: the workshop and the
   * dive can both change the profile twice in one frame, and the loop must
   * never read yesterday's points.
   */
  const keep = useCallback((next: Profile) => {
    profileRef.current = next;
    saveProfile(next);
    setEarned(next);
  }, []);

  useEffect(() => {
    viewRef.current = view;
    startRef.current = () => beginDive(stateRef.current.level);
  });

  const pause = useCallback(
    (held: boolean) => {
      pausedRef.current = held;
      // Eine Pause ist auch für die Ohren eine.
      hum(!held && runningRef.current);
      syncHud(stateRef.current);
    },
    [syncHud],
  );

  return {
    canvasRef,
    hud,
    view,
    profile,
    gained,
    record,
    dive: (level: number) => {
      if (canPlay(profileRef.current, level)) {
        // Shown rather than started: the water gets a moment to be looked at,
        // and the clock does not run while somebody is still reading what is
        // in it. One click later it is a dive.
        setView("dive");
        showLevel(level);
      }
    },
    toMap: () => {
      runningRef.current = false;
      pausedRef.current = false;
      hum(false);
      setView("map");
      syncHud(stateRef.current);
    },
    start: () => {
      if (!runningRef.current) {
        beginDive(stateRef.current.level);
      }
    },
    again: () => beginDive(stateRef.current.level),
    pause,
    keep,
  };
}

/** The screen's view of the world. */
function hudOf(
  state: GameState,
  share: number,
  running: boolean,
  paused: boolean,
  best: number,
): Hud {
  return {
    running,
    paused,
    phase: state.phase,
    level: state.level,
    name: LEVELS[state.level].name,
    levels: LEVEL_COUNT,
    share: Math.round(share * STEPS) / STEPS,
    time: Math.round(state.time * TICKS) / TICKS,
    air: Math.round(Math.max(0, state.air / state.gear.air) * STEPS) / STEPS,
    hull: Math.max(0, state.hull),
    hullMax: state.gear.hull,
    grade: state.grade,
    best,
    gun: state.gear.gun,
    mines: state.gear.mines,
  };
}

/** Whether two views are the same, so React is only told about changes. */
function sameHud(a: Hud, b: Hud): boolean {
  return (
    a.running === b.running &&
    a.paused === b.paused &&
    a.phase === b.phase &&
    a.level === b.level &&
    a.share === b.share &&
    a.time === b.time &&
    a.air === b.air &&
    a.hull === b.hull &&
    a.hullMax === b.hullMax &&
    a.grade === b.grade &&
    a.best === b.best &&
    a.gun === b.gun &&
    a.mines === b.mines
  );
}
