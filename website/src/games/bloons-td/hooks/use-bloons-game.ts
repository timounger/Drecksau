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
  build,
  canBuild,
  cheated,
  createGame,
  sell,
  sendWave,
  step,
  upgrade,
} from "@/games/bloons-td/engine/engine";
import type { Path } from "@/games/bloons-td/engine/upgrades";
import { CELL, COLS, ROWS } from "@/games/bloons-td/engine/map";
import type { TowerKind } from "@/games/bloons-td/engine/towers";
import type { Game, Phase, Tower } from "@/games/bloons-td/engine/types";
import { WRITTEN_ROUNDS } from "@/games/bloons-td/engine/waves";
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

/** Wie schnell der Schnellvorlauf ist - und wie schnell der Turbo. */
const FAST = 3;
const TURBO = 100;

/** Die drei Gangarten: normal, schnell, Turbo. */
export const SPEEDS: readonly number[] = [1, FAST, TURBO];

/** Was über dem Feld steht. */
export type Hud = {
  readonly phase: Phase;
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
  /** Noch einmal von vorn. */
  readonly restart: () => void;
  readonly setSpeed: (speed: number) => void;
  /** Unendlich Geld, und das ganze Feld voller ausgebauter Türme. */
  readonly cheat: () => void;
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
  const hudRef = useRef(hud);

  const syncHud = useCallback((game: Game) => {
    const next: Hud = {
      phase: game.phase,
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

  // **Schummeln ist ein Knopf und kein Geheimnis.** Wer ausprobieren will, wie
  // sich ein ausgebautes Feld anfühlt, soll nicht vorher zwanzig Runden
  // spielen müssen: unendlich Geld, und jedes freie Feld bekommt den voll
  // ausgebauten Turm, der dort am meisten bringt.
  const cheat = useCallback(() => {
    gameRef.current = cheated(gameRef.current);
    syncChosen(gameRef.current);
    syncHud(gameRef.current);
  }, [syncHud, syncChosen]);

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

  const restart = useCallback(() => {
    gameRef.current = createGame();
    chosenRef.current = null;
    pickedRef.current = null;
    haltRef.current = false;
    setHalted(false);
    setChosen(null);
    setPicked(null);
    spentRef.current = { ms: 0, began: Date.now(), ended: false };
    recordGameStarted(GAME_ID, Date.now());
    invalidateStats();
    syncHud(gameRef.current);
  }, [syncHud]);

  const setSpeed = useCallback(
    (speed: number) => {
      speedRef.current = speed;
      syncHud(gameRef.current);
    },
    [syncHud],
  );

  // **Eine Partie zählt, sobald sie offen ist.** Wer das Spiel aufruft, hat
  // es gespielt - die Statistik fragt nicht, wie weit jemand gekommen ist.
  useEffect(() => {
    spentRef.current = { ms: 0, began: Date.now(), ended: false };
    recordGameStarted(GAME_ID, Date.now());
    invalidateStats();
  }, []);

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
        gameRef.current = step(gameRef.current, dt);
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
      // die Schleife danach weiterläuft.
      if (gameRef.current.phase === "over" && !spentRef.current.ended) {
        spentRef.current.ended = true;
        recordPlayTime(GAME_ID, spentRef.current.ms, Date.now());
        spentRef.current.ms = 0;
        recordGameFinished(GAME_ID, {
          won: gameRef.current.round > WRITTEN_ROUNDS,
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
  }, [syncHud, syncChosen]);

  return {
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
  };
}

/** Ob zwei Anzeigen dasselbe sagen. */
function sameHud(a: Hud, b: Hud): boolean {
  return (
    a.phase === b.phase &&
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
