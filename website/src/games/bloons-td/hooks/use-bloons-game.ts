/**
 * Eine Partie Bloons TD aus React heraus: Schleife, Zeiger, Zahlen.
 *
 * @module
 * @remarks
 * Die Partie liegt in einem Ref, damit die Schleife nie auf React wartet; nach
 * außen geht nur, was auch wirklich auf dem Blatt steht. Gerechnet wird in
 * {@link ../engine/engine}, gezeichnet in {@link ../components/render} - hier
 * wird gekurbelt und zugehört.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  aimAt,
  build,
  canBuild,
  immortal,
  rich,
  stocked,
  createGame,
  goalOf,
  keepPlaying,
  sell,
  sendWave,
  step,
  upgrade,
} from "@/games/bloons-td/engine/engine";
import type { Path } from "@/games/bloons-td/engine/upgrades";
import { CELL, COLS, ROWS, type MapId } from "@/games/bloons-td/engine/map";
import { TOWERS, type TowerKind } from "@/games/bloons-td/engine/towers";
import type { BloonKind } from "@/games/bloons-td/engine/bloons";
import {
  DIFFICULTIES,
  type Difficulty,
} from "@/games/bloons-td/engine/difficulty";
import {
  NO_PROGRESS,
  clearProgress,
  isUnlocked,
  levelOf,
  loadProgress,
  saveProgress,
  unlockedAt,
  withMedal,
  xpOfRound,
  type Progress,
} from "@/games/bloons-td/engine/progress";
import type {
  Game,
  Phase,
  Target,
  Tower,
} from "@/games/bloons-td/engine/types";
import { CANVAS_H, CANVAS_W, draw } from "@/games/bloons-td/components/render";
import { fitCanvas } from "@/lib/screen/fit-canvas";
import {
  recordGameFinished,
  recordGameStarted,
  recordPlayTime,
} from "@/lib/stats/stats-recorder";
import { invalidateStats } from "@/lib/stats/stats-store";

/** Unter welchem Namen die Statistik dieses Spiel führt. */
const GAME_ID = "bloons-td";

/** Millisekunden in einer Sekunde. */
const MS_PER_SECOND = 1000;

/** Wie oft die gespielte Zeit weggeschrieben wird, in Millisekunden. */
const FLUSH_MS = 15_000;

/** Das längste Bild, das als Spielzeit zählt, in Sekunden. */
const MAX_FRAME = 0.25;

/** Die Schummeleien: unendlich Geld, unendlich Leben, ein Feld voller Türme. */
export type Cheat = "money" | "lives" | "towers";

/** Wie schnell der Schnellvorlauf ist - und wie schnell der Turbo. */
const FAST = 3;
const TURBO = 100;

/** Die drei Gangarten: normal, schnell, Turbo. */
export const SPEEDS: readonly number[] = [1, FAST, TURBO];

/** Wie lange die Meldung über einen Levelaufstieg zu sehen ist, in Millisekunden. */
const NOTE_MS = 5000;

/** Was gerade zu sehen ist: die Kartenübersicht oder eine Partie. */
export type Screen = "menu" | "game";

/** Was über dem Feld steht. */
export type Hud = {
  readonly phase: Phase;
  /** Wo und wie schwer gespielt wird, und welche Runde das Ziel ist. */
  readonly map: MapId;
  readonly difficulty: Difficulty;
  readonly goal: number;
  /** Ob das Ziel schon geschafft ist und weitergespielt wird. */
  readonly freeplay: boolean;
  /** Der Boss der Boss-Herausforderung, oder null. */
  readonly boss: BloonKind | null;
  readonly round: number;
  readonly money: number;
  readonly lives: number;
  /** Wie viele Ballons gerade unterwegs sind und wie viele noch warten. */
  readonly bloons: number;
  readonly waiting: number;
  readonly popped: number;
  readonly leaked: number;
  /** Das Vielfache, mit dem die Zeit gerade läuft. */
  readonly speed: number;
  /** Ob die Partie für die Bestenliste zählt - also ohne Schummeln. */
  readonly fair: boolean;
};

/** Was der Bildschirm von einer Partie braucht. */
export type BloonsGame = {
  readonly canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Kartenübersicht oder Partie. */
  readonly screen: Screen;
  /** Eine Partie auf dieser Karte und Schwierigkeit anfangen. */
  readonly start: (
    map: MapId,
    difficulty: Difficulty,
    boss: BloonKind | null,
  ) => void;
  /** Zurück zur Kartenübersicht - die laufende Partie ist dann vorbei. */
  readonly toMenu: () => void;
  /** Nach dem Sieg weiterspielen. */
  readonly keepGoing: () => void;
  /** Erfahrung, Level und Medaillen über alle Partien. */
  readonly progress: Progress;
  readonly level: number;
  /** Ob dieser Affe gerade zu haben ist - freigeschaltet oder geschummelt. */
  readonly unlocked: (kind: TowerKind) => boolean;
  /** Eine Meldung über einen Levelaufstieg, oder null. */
  readonly note: string | null;
  /** Erfahrung, Level und Medaillen löschen - zurück auf Anfang. */
  readonly resetProgress: () => void;
  readonly hud: Hud;
  /** Was im Laden ausgewählt ist. */
  readonly picked: TowerKind | null;
  readonly pick: (kind: TowerKind | null) => void;
  /** Der angetippte Turm, samt allem, was er ist. */
  readonly chosen: Tower | null;
  /** Die nächste Welle losschicken. */
  readonly send: () => void;
  /** Den angetippten Turm verkaufen. */
  readonly sellChosen: () => void;
  /** Den angetippten Turm auf einer Säule eine Stufe weiterbauen. */
  readonly upgradeChosen: (path: Path) => void;
  /** Einstellen, auf wen der angetippte Turm zielt. */
  readonly aimChosen: (target: Target) => void;
  /** Noch einmal von vorn. */
  readonly restart: () => void;
  readonly setSpeed: (speed: number) => void;
  /** Schummeln: unendlich Geld, unendlich Leben oder ein Feld voller Türme. */
  readonly cheat: (kind: Cheat) => void;
  /** Ob gerade angehalten ist. */
  readonly paused: boolean;
  readonly setPaused: (paused: boolean) => void;
  /** Ob die nächste Runde von selbst losgeht. */
  readonly auto: boolean;
  readonly setAuto: (auto: boolean) => void;
};

/** Die Anzeige, bevor es irgendeine Partie gibt. */
const EMPTY_HUD: Hud = {
  phase: "ready",
  map: "meadow",
  difficulty: "medium",
  goal: DIFFICULTIES.medium.goal,
  freeplay: false,
  boss: null,
  round: 0,
  money: 0,
  lives: 0,
  bloons: 0,
  waiting: 0,
  popped: 0,
  leaked: 0,
  speed: 1,
  fair: true,
};

/**
 * Führt eine Partie.
 *
 * @returns die Leinwand, die Anzeige und alles, was man anklicken kann
 */
export function useBloonsGame(): BloonsGame {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<Game>(createGame());
  const overRef = useRef<{ col: number; row: number } | null>(null);
  const pickedRef = useRef<TowerKind | null>(null);
  const chosenRef = useRef<number | null>(null);
  const speedRef = useRef(1);
  // Die Uhr wird erst im Effekt gestellt: Beim Rendern selbst wird nichts
  // abgefragt, was sich zwischen zwei Durchläufen ändert.
  const spentRef = useRef({ ms: 0, began: 0, ended: false });

  const autoRef = useRef(false);
  const haltRef = useRef(false);

  const [hud, setHud] = useState<Hud>(EMPTY_HUD);
  const [auto, setKeepGoing] = useState(false);
  const [paused, setHalted] = useState(false);
  const [picked, setPicked] = useState<TowerKind | null>(null);
  const [chosen, setChosen] = useState<Tower | null>(null);
  const [screen, setScreen] = useState<Screen>("menu");
  const [progress, setProgress] = useState<Progress>(NO_PROGRESS);
  const [note, setNote] = useState<string | null>(null);
  const progressRef = useRef<Progress>(NO_PROGRESS);
  const noteRef = useRef(0);
  const hudRef = useRef(hud);

  const syncHud = useCallback((game: Game) => {
    const next: Hud = {
      phase: game.phase,
      map: game.map,
      difficulty: game.difficulty,
      goal: goalOf(game),
      freeplay: game.freeplay,
      boss: game.boss,
      round: game.round,
      money: game.money,
      lives: game.lives,
      bloons: game.bloons.length,
      waiting: game.waiting.length,
      popped: game.popped,
      leaked: game.leaked,
      speed: speedRef.current,
      fair: !game.cheated,
    };
    if (!sameHud(next, hudRef.current)) {
      hudRef.current = next;
      setHud(next);
    }
  }, []);

  /** Den angetippten Turm nach außen reichen. */
  const syncChosen = useCallback((game: Game) => {
    const one = game.towers.find((tower) => tower.id === chosenRef.current);
    setChosen(one ?? null);
  }, []);

  const pick = useCallback(
    (kind: TowerKind | null) => {
      pickedRef.current = kind;
      setPicked(kind);
      // Wer baut, schaut nicht gleichzeitig einen fertigen Turm an.
      chosenRef.current = kind === null ? chosenRef.current : null;
      setChosen(kind === null ? chosen : null);
    },
    [chosen],
  );

  const send = useCallback(() => {
    gameRef.current = sendWave(gameRef.current);
    syncHud(gameRef.current);
  }, [syncHud]);

  const sellChosen = useCallback(() => {
    const id = chosenRef.current;
    if (id !== null) {
      gameRef.current = sell(gameRef.current, id);
      chosenRef.current = null;
      setChosen(null);
      syncHud(gameRef.current);
    }
  }, [syncHud]);

  const upgradeChosen = useCallback(
    (path: Path) => {
      const id = chosenRef.current;
      if (id !== null) {
        gameRef.current = upgrade(gameRef.current, id, path);
        syncChosen(gameRef.current);
        syncHud(gameRef.current);
      }
    },
    [syncHud, syncChosen],
  );

  const aimChosen = useCallback(
    (target: Target) => {
      const id = chosenRef.current;
      if (id !== null) {
        gameRef.current = aimAt(gameRef.current, id, target);
        syncChosen(gameRef.current);
      }
    },
    [syncChosen],
  );

  // **Drei geheime Schummeleien**, jede für sich: unendlich Geld, unendlich
  // Leben, oder jedes freie Feld bekommt den voll ausgebauten Turm, der dort
  // am meisten bringt. Wer eine davon nutzt, kommt nicht mehr auf die
  // Bestenliste und sammelt keine Erfahrung.
  const cheat = useCallback(
    (kind: Cheat) => {
      let next: Game;
      switch (kind) {
        case "money":
          next = rich(gameRef.current);
          break;
        case "lives":
          next = immortal(gameRef.current);
          break;
        default:
          next = stocked(gameRef.current);
      }
      gameRef.current = next;
      syncChosen(gameRef.current);
      syncHud(gameRef.current);
    },
    [syncHud, syncChosen],
  );

  // **Pause hält die Zeit an, nicht das Bild.** Gezeichnet wird weiter, sonst
  // friert auch der Mauszeiger-Umriss ein und man sieht nicht mehr, wohin man
  // gerade baut.
  const setPaused = useCallback((want: boolean) => {
    haltRef.current = want;
    setHalted(want);
  }, []);

  const setAuto = useCallback((want: boolean) => {
    autoRef.current = want;
    setKeepGoing(want);
  }, []);

  /** Eine frische Partie auf dieser Karte und Schwierigkeit. */
  const begin = useCallback(
    (map: MapId, difficulty: Difficulty, boss: BloonKind | null) => {
      gameRef.current = createGame(map, difficulty, boss);
      chosenRef.current = null;
      pickedRef.current = null;
      haltRef.current = false;
      setHalted(false);
      // Jede neue Partie beginnt ohne Auto-Start - die erste Welle schickt
      // man selbst los, wenn die ersten Affen stehen.
      autoRef.current = false;
      setKeepGoing(false);
      setChosen(null);
      setPicked(null);
      spentRef.current = { ms: 0, began: Date.now(), ended: false };
      recordGameStarted(GAME_ID, Date.now());
      invalidateStats();
      syncHud(gameRef.current);
    },
    [syncHud],
  );

  const restart = useCallback(() => {
    begin(
      gameRef.current.map,
      gameRef.current.difficulty,
      gameRef.current.boss,
    );
  }, [begin]);

  const start = useCallback(
    (map: MapId, difficulty: Difficulty, boss: BloonKind | null) => {
      begin(map, difficulty, boss);
      setScreen("game");
    },
    [begin],
  );

  const toMenu = useCallback(() => {
    haltRef.current = false;
    setHalted(false);
    setScreen("menu");
  }, []);

  const keepGoing = useCallback(() => {
    gameRef.current = keepPlaying(gameRef.current);
    syncHud(gameRef.current);
  }, [syncHud]);

  /**
   * Eine Runde ist überstanden: Erfahrung gutschreiben, beim Sieg die Medaille
   * - und wer dabei aufsteigt, erfährt, welcher Affe dazukommt.
   *
   * @remarks
   * Wer geschummelt hat, bekommt nichts. Sonst hätte man mit einem Druck auf
   * den Knopf und hundertfachem Tempo in einer Minute alle Affen.
   */
  const completed = useCallback((game: Game) => {
    if (!game.cheated) {
      const had = progressRef.current;
      let next: Progress = {
        ...had,
        xp: had.xp + xpOfRound(game.round, game.difficulty),
      };
      // Die Medaille gibt es für die Karte, nicht für den Boss.
      if (game.phase === "won" && game.boss === null) {
        next = withMedal(next, game.map, game.difficulty);
      }
      const before = levelOf(had.xp);
      const after = levelOf(next.xp);
      progressRef.current = next;
      saveProgress(next);
      setProgress(next);
      if (after > before) {
        const fresh: string[] = [];
        for (let level = before + 1; level <= after; level += 1) {
          fresh.push(...unlockedAt(level).map((kind) => TOWERS[kind].name));
        }
        setNote(
          fresh.length > 0
            ? `Level ${after}! Neu: ${fresh.join(", ")}`
            : `Level ${after}!`,
        );
        window.clearTimeout(noteRef.current);
        noteRef.current = window.setTimeout(() => setNote(null), NOTE_MS);
      }
    }
  }, []);

  const resetProgress = useCallback(() => {
    clearProgress();
    progressRef.current = NO_PROGRESS;
    setProgress(NO_PROGRESS);
  }, []);

  // Der Fortschritt steht im Browser - gelesen wird er erst hier, damit die
  // vorgerenderte Seite und das erste Bild im Browser übereinstimmen.
  useEffect(() => {
    const stored = loadProgress();
    progressRef.current = stored;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage once on mount
    setProgress(stored);
    return () => window.clearTimeout(noteRef.current);
  }, []);

  const setSpeed = useCallback(
    (speed: number) => {
      speedRef.current = speed;
      syncHud(gameRef.current);
    },
    [syncHud],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (canvas === null || ctx === null) {
      return;
    }

    /** Welches Feld unter einem Punkt der Leinwand liegt. */
    const cellUnder = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const x = ((event.clientX - box.left) / box.width) * CANVAS_W;
      const y = ((event.clientY - box.top) / box.height) * CANVAS_H;
      const col = Math.floor(x / CELL);
      const row = Math.floor(y / CELL);
      const inside = col >= 0 && col < COLS && row >= 0 && row < ROWS;
      return inside ? { col, row } : null;
    };

    const move = (event: PointerEvent) => {
      overRef.current = cellUnder(event);
    };
    const leave = () => {
      overRef.current = null;
    };
    const down = (event: PointerEvent) => {
      const at = cellUnder(event);
      const kind = pickedRef.current;
      const game = gameRef.current;
      if (at !== null) {
        const standing = game.towers.find(
          (one) => one.col === at.col && one.row === at.row,
        );
        if (kind !== null && canBuild(game, kind, at.col, at.row)) {
          gameRef.current = build(game, kind, at.col, at.row);
          // **Ein Klick, ein Affe.** Danach ist der Laden wieder leer: Wer
          // zwei davon will, wählt ihn ein zweites Mal - sonst setzt ein
          // Klick daneben aus Versehen den nächsten für zweihundert Dollar.
          pickedRef.current = null;
          setPicked(null);
        } else if (standing !== undefined) {
          // Ein fertiger Turm wird angesehen, nicht überbaut.
          chosenRef.current = standing.id;
          pickedRef.current = null;
          setPicked(null);
        } else {
          chosenRef.current = null;
        }
        syncChosen(gameRef.current);
        syncHud(gameRef.current);
      }
      event.preventDefault();
    };

    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("pointerdown", down);

    let raf = 0;
    let last = performance.now();
    let since = 0;

    const frame = (now: number) => {
      const dt = (now - last) / MS_PER_SECOND;
      last = now;
      const was = gameRef.current;

      // Schneller Vorlauf heißt: dasselbe Bild mehrmals rechnen. Ein größerer
      // Zeitschritt ließe Geschosse durch Ballons springen.
      // **Auto-Start schickt die nächste Welle sofort los**, und zwar mitten
      // im Vorlauf: Endet eine Runde im dritten von hundert Turbo-
      // Schritten, laufen die übrigen schon in der nächsten.
      const turns = haltRef.current ? 0 : speedRef.current;
      for (let turn = 0; turn < turns; turn += 1) {
        if (autoRef.current && gameRef.current.phase === "ready") {
          gameRef.current = sendWave(gameRef.current);
        }
        const before = gameRef.current.phase;
        gameRef.current = step(gameRef.current, dt);
        // Im Turbo enden in einem Bild mehrere Runden - jede zählt einzeln.
        const after = gameRef.current.phase;
        if (before === "running" && (after === "ready" || after === "won")) {
          completed(gameRef.current);
        }
      }
      if (
        autoRef.current &&
        !haltRef.current &&
        gameRef.current.phase === "ready"
      ) {
        gameRef.current = sendWave(gameRef.current);
      }

      if (was.phase === "running" && !haltRef.current) {
        spentRef.current.ms += Math.min(dt, MAX_FRAME) * MS_PER_SECOND;
        since += dt * MS_PER_SECOND;
        if (since >= FLUSH_MS) {
          since = 0;
          recordPlayTime(GAME_ID, spentRef.current.ms, Date.now());
          spentRef.current.ms = 0;
          invalidateStats();
        }
      }

      // **Einmal je Partie gezählt.** Das Ende kommt genau einmal, auch wenn
      // die Schleife danach weiterläuft: beim Sieg als gewonnen, und wer danach
      // weiterspielt und verliert, hat trotzdem gewonnen.
      const ending =
        gameRef.current.phase === "over" || gameRef.current.phase === "won";
      if (ending && !spentRef.current.ended) {
        spentRef.current.ended = true;
        recordPlayTime(GAME_ID, spentRef.current.ms, Date.now());
        spentRef.current.ms = 0;
        recordGameFinished(GAME_ID, {
          won: gameRef.current.phase === "won" || gameRef.current.freeplay,
          durationMs: Date.now() - spentRef.current.began,
          finishedAt: Date.now(),
        });
        invalidateStats();
      }

      syncHud(gameRef.current);
      const dots = fitCanvas(canvas, CANVAS_W, CANVAS_H);
      ctx.setTransform(dots, 0, 0, dots, 0, 0);
      draw(ctx, gameRef.current, {
        over: overRef.current,
        picked: pickedRef.current,
        chosen: chosenRef.current,
      });
      raf = window.requestAnimationFrame(frame);
    };
    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("pointerdown", down);
    };
  }, [syncHud, syncChosen, completed, screen]);

  const level = levelOf(progress.xp);
  const unlocked = useCallback(
    (kind: TowerKind) => !hud.fair || isUnlocked(kind, level),
    [hud.fair, level],
  );

  return {
    canvasRef,
    screen,
    start,
    toMenu,
    keepGoing,
    progress,
    level,
    unlocked,
    note,
    resetProgress,
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
  };
}

/** Ob zwei Anzeigen dasselbe sagen. */
function sameHud(a: Hud, b: Hud): boolean {
  return (
    a.phase === b.phase &&
    a.map === b.map &&
    a.difficulty === b.difficulty &&
    a.freeplay === b.freeplay &&
    a.boss === b.boss &&
    a.round === b.round &&
    a.money === b.money &&
    a.lives === b.lives &&
    a.bloons === b.bloons &&
    a.waiting === b.waiting &&
    a.popped === b.popped &&
    a.leaked === b.leaked &&
    a.speed === b.speed &&
    a.fair === b.fair
  );
}
