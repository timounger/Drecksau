/**
 * Der Endlosmodus zu zweit, auf der Firebase-Leitung.
 *
 * @module
 * @remarks
 * Dieselbe Bauart wie die Panzerkiste, weil sie sich dort bewährt hat:
 *
 * - **Der Host rechnet.** Jedes Bild bringt er die Welt mit seinen eigenen
 *   Tasten als Boot eins und den gestreamten Tasten des Gastes als Boot zwei
 *   weiter und veröffentlicht sie ein paar Mal in der Sekunde.
 * - **Der Gast schaut zu.** Er schickt seine Tasten und zeichnet den neuesten
 *   Zustand, den er bekommen hat; gerechnet wird bei ihm nichts.
 *
 * Es gibt keine Übernahme: Geht der Host, ist der Lauf zu Ende. Zwei Plätze,
 * mehr nicht - `one` ist immer der Host, `two` immer der Gast.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { play } from "@/games/uboot/audio/sounds";
import {
  DEEP_GEAR,
  STAGE_PAUSE,
  advanceDeep,
  startDeep,
  stepDeep,
} from "@/games/uboot/endless/engine";
import {
  DEEP_VIEW_H,
  DEEP_VIEW_W,
  deepCamera,
  drawDeep,
} from "@/games/uboot/endless/render";
import {
  DEEP_IDLE,
  type DeepInput,
  type DeepPhase,
  type DeepState,
  type DiverId,
} from "@/games/uboot/endless/types";
import { buildDeep, type DeepWorld } from "@/games/uboot/endless/world";
import { createControls } from "@/games/uboot/hooks/controls";
import { createTouch } from "@/games/uboot/hooks/touch-controls";
import {
  UBOOT_GAME_ID,
  UBOOT_GUARDS,
  makeSeat,
  type DeepMove,
  type DeepSnapshot,
} from "@/games/uboot/multiplayer/net";
import { fitCanvas } from "@/lib/screen/fit-canvas";
import type { RoomPhase, RoomState, Seat, SeatId } from "@/online/adapter";
import { database, signIn } from "@/online/firebase-app";
import { createFirebaseTransport } from "@/online/firebase-transport";
import type { ChatMessage, RoomTransport } from "@/online/transport";

/** Millisekunden in einer Sekunde. */
const MS_PER_SECOND = 1000;

/** Wie oft der Host seinen Zustand veröffentlicht, in Sekunden. */
const PUBLISH_INTERVAL = 0.05;

/** Und wie oft der Gast seine Tasten schickt. */
const INPUT_INTERVAL = 0.05;

/** Der Name für jemanden, der keinen eingetragen hat. */
const FALLBACK_NAME = "Spieler";

/** Hier wechselt nichts Geheimes den Besitzer. */
const EMPTY_HANDS: ReadonlyMap<SeatId, null> = new Map<SeatId, null>();

/** Wo der Online-Ablauf gerade steht. */
export type DeepStatus = "connecting" | "lobby" | "playing" | "error";

/** Wie jemand in einen Raum kommt. */
export type DeepSession = {
  readonly mode: "host" | "guest";
  readonly code: string;
  readonly name: string;
};

/** Was über dem Bild steht. */
export type DeepOnlineHud = {
  readonly stage: number;
  readonly phase: DeepPhase;
  readonly hull: number;
  readonly hullMax: number;
  readonly air: number;
  readonly airMax: number;
  readonly beasts: number;
  readonly kills: number;
  /** Ob das eigene Boot gerade unten liegt - und ob das andere. */
  readonly imDown: boolean;
  readonly partnerDown: boolean;
};

/** Was der Bildschirm vom Raum braucht. */
export type UbootOnline = {
  readonly status: DeepStatus;
  readonly seatId: SeatId | null;
  readonly isHost: boolean;
  readonly seats: readonly Seat[];
  readonly hud: DeepOnlineHud;
  readonly canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Nur der Host: den Lauf beginnen. */
  readonly start: () => void;
  /** Nur der Host: nach dem Untergang noch einmal von vorn. */
  readonly again: () => void;
  readonly messages: readonly ChatMessage[];
  readonly sendChat: (text: string) => void;
};

/** Die Anzeige, bevor es irgendeine Welt gibt. */
const EMPTY_HUD: DeepOnlineHud = {
  stage: 1,
  phase: "waiting",
  hull: DEEP_GEAR.hull,
  hullMax: DEEP_GEAR.hull,
  air: DEEP_GEAR.air,
  airMax: DEEP_GEAR.air,
  beasts: 0,
  kills: 0,
  imDown: false,
  partnerDown: false,
};

/**
 * Fährt einen Lauf zu zweit.
 *
 * @param session - wie der Raum betreten wird, oder null vor der Wahl
 * @returns der Stand des Raums, die Leinwand, die Anzeige und die Knöpfe
 */
export function useUbootOnline(session: DeepSession | null): UbootOnline {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [status, setStatus] = useState<DeepStatus>("connecting");
  const [seatId, setSeatId] = useState<SeatId | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [seats, setSeats] = useState<readonly Seat[]>([]);
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);
  const [hud, setHud] = useState<DeepOnlineHud>(EMPTY_HUD);

  // Leitung und Welt liegen in Refs: Die enge Schleife wartet nie auf React.
  const transportRef = useRef<RoomTransport<
    DeepSnapshot,
    DeepMove,
    null
  > | null>(null);
  const roleRef = useRef<"host" | "guest">("host");
  const seatIdRef = useRef<SeatId | null>(null);
  const codeRef = useRef("");
  const seatsRef = useRef<readonly Seat[]>([]);
  const nameRef = useRef(FALLBACK_NAME);
  const roomPhaseRef = useRef<RoomPhase>("lobby");
  const versionRef = useRef(0);
  const lastVersionRef = useRef(0);

  // Host: die maßgebliche Welt und die zuletzt empfangenen Tasten des Gastes.
  const authRef = useRef<DeepState | null>(null);
  const worldRef = useRef<DeepWorld | null>(null);
  const guestInputRef = useRef<DeepMove>(DEEP_IDLE);
  const runningRef = useRef(false);
  // Gast: der neueste Zustand, so wie er hereingekommen ist.
  const snapshotRef = useRef<DeepSnapshot | null>(null);

  const controlsRef = useRef(createControls());
  const touchRef = useRef(createTouch());
  const hudRef = useRef(hud);

  const syncHud = useCallback((state: DeepState) => {
    const me = roleRef.current === "host" ? "one" : "two";
    const mine = state.divers.find((one) => one.id === me);
    const other = state.divers.find((one) => one.id !== me);
    const next: DeepOnlineHud = {
      stage: state.stage,
      phase: state.phase,
      hull: Math.max(0, mine?.hull ?? 0),
      hullMax: DEEP_GEAR.hull,
      air: Math.max(0, mine?.air ?? 0),
      airMax: DEEP_GEAR.air,
      beasts: state.beasts.length,
      kills: state.kills,
      imDown: mine?.down === true,
      partnerDown: other?.down === true,
    };
    if (!sameHud(next, hudRef.current)) {
      hudRef.current = next;
      setHud(next);
    }
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) =>
      prev.some((one) => one.id === message.id) ? prev : [...prev, message],
    );
  }, []);

  /** Schickt die Welt des Hosts als neuesten Stand des Raums. */
  const publishNow = useCallback(() => {
    const state = authRef.current;
    const transport = transportRef.current;
    const host = seatIdRef.current;
    if (state === null || transport === null || host === null) {
      return;
    }
    versionRef.current += 1;
    const room: RoomState<DeepSnapshot> = {
      code: codeRef.current,
      hostId: host,
      seats: seatsRef.current,
      phase: roomPhaseRef.current,
      game: state,
      version: versionRef.current,
    };
    void transport.publish(room, EMPTY_HANDS);
  }, []);

  const begin = useCallback(() => {
    if (roleRef.current !== "host") {
      return;
    }
    const seed = Date.now();
    authRef.current = startDeep(seed, 2);
    worldRef.current = buildDeep(1, seed);
    runningRef.current = true;
    roomPhaseRef.current = "playing";
    syncHud(authRef.current);
    publishNow();
    setStatus("playing");
  }, [publishNow, syncHud]);

  const sendChat = useCallback((text: string) => {
    const transport = transportRef.current;
    const me = seatIdRef.current;
    const trimmed = text.trim();
    if (transport === null || me === null || trimmed.length === 0) {
      return;
    }
    void transport.sendChat({
      seatId: me,
      name: nameRef.current,
      text: trimmed,
    });
  }, []);

  // In den Raum: anmelden, Leitung legen, Rolle einnehmen.
  useEffect(() => {
    if (session === null) {
      return;
    }
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- neue Sitzung, neuer Anfang
    setStatus("connecting");
    lastVersionRef.current = 0;
    versionRef.current = 0;
    snapshotRef.current = null;
    authRef.current = null;
    worldRef.current = null;
    runningRef.current = false;
    nameRef.current = session.name.trim() || FALLBACK_NAME;
    codeRef.current = session.code;

    const connect = async (): Promise<void> => {
      const uid = await signIn();
      if (cancelled) {
        return;
      }
      seatIdRef.current = uid;
      setSeatId(uid);
      const asHost = session.mode === "host";
      roleRef.current = asHost ? "host" : "guest";
      setIsHost(asHost);
      roomPhaseRef.current = "lobby";

      const transport = createFirebaseTransport<DeepSnapshot, DeepMove, null>(
        database(),
        UBOOT_GAME_ID,
        session.code,
        UBOOT_GUARDS,
      );
      transportRef.current = transport;

      transport.onChat(addMessage);
      transport.onMembers((members) => {
        seatsRef.current = members;
        setSeats(members);
      });

      if (asHost) {
        transport.onIntents((intent) => {
          guestInputRef.current = intent.move;
        });
        await transport.markHost(uid);
      } else {
        transport.onShared((room) => {
          if (room.version <= lastVersionRef.current) {
            return;
          }
          lastVersionRef.current = room.version;
          seatsRef.current = room.seats;
          setSeats(room.seats);
          if (room.game !== null) {
            snapshotRef.current = room.game;
          }
          if (room.phase === "playing") {
            setStatus("playing");
          }
        });
      }

      await transport.join(makeSeat(uid, nameRef.current, asHost));
      if (!cancelled) {
        setStatus((current) => (current === "connecting" ? "lobby" : current));
      }
    };

    connect().catch(() => {
      if (!cancelled) {
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
      void transportRef.current?.disconnect();
      transportRef.current = null;
      runningRef.current = false;
    };
  }, [session, addMessage]);

  // Die Schleife, solange ein Lauf auf dem Bildschirm ist.
  const playing = status === "playing";
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (!playing || canvas === null || ctx === null) {
      return;
    }

    const controls = controlsRef.current;
    const thumb = touchRef.current;
    const stopKeys = controls.listen(window);
    const stopTouch = thumb.listen(canvas);
    const me: DiverId = roleRef.current === "host" ? "one" : "two";

    /** Was dieses Boot will - und wohin es zielt, in Weltpixeln. */
    const asked = (shown: DeepState | null): DeepInput => {
      const keys = controls.read();
      const point = thumb.read();
      const at = point.aim;
      const camera = shown === null ? { x: 0, y: 0 } : deepCamera(shown, me);
      return {
        up: keys.up || point.up,
        down: keys.down || point.down,
        back: keys.back || point.back,
        forward: keys.forward || point.forward,
        fire: keys.fire || point.fire,
        drop: keys.drop || point.drop,
        aim: at === null ? null : { x: at.x + camera.x, y: at.y + camera.y },
      };
    };

    /** Was man hört, aus dem Unterschied zweier Welten. */
    let heard: DeepState | null = null;
    const sing = (now: DeepState) => {
      if (heard !== null) {
        if (now.blasts.length > heard.blasts.length) {
          play("boom");
        }
        if (now.beasts.length < heard.beasts.length) {
          play("critter");
        }
        if (heard.phase !== "over" && now.phase === "over") {
          play("lose");
        }
      }
      heard = now;
    };

    /** Die Karte zum gezeigten Zustand - neu gebaut nur bei neuer Stufe. */
    const mapFor = (state: DeepState): DeepWorld => {
      const held = worldRef.current;
      const fits =
        held !== null && held.stage === state.stage && held.seed === state.seed;
      const world = fits ? held : buildDeep(state.stage, state.seed);
      worldRef.current = world;
      return world;
    };

    let raf = 0;
    let last = performance.now();
    let sincePublish = 0;
    let sinceInput = 0;

    const frame = (now: number) => {
      const dt = (now - last) / MS_PER_SECOND;
      last = now;
      const host = roleRef.current === "host";
      let shown: DeepState | null = null;

      if (host) {
        const state = authRef.current;
        if (state !== null && runningRef.current) {
          const world = mapFor(state);
          const next = stepDeep(
            state,
            world,
            { one: asked(state), two: guestInputRef.current },
            dt,
          );
          authRef.current =
            next.phase === "cleared" && next.since >= STAGE_PAUSE
              ? advanceDeep(next, buildDeep(next.stage + 1, next.seed))
              : next;
        }
        shown = authRef.current;
        sincePublish += dt;
        if (sincePublish >= PUBLISH_INTERVAL) {
          sincePublish = 0;
          publishNow();
        }
      } else {
        shown = snapshotRef.current;
        sinceInput += dt;
        if (sinceInput >= INPUT_INTERVAL) {
          sinceInput = 0;
          const seat = seatIdRef.current;
          if (seat !== null) {
            void transportRef.current?.sendIntent({
              seatId: seat,
              move: asked(shown),
            });
          }
        }
      }

      if (shown !== null) {
        const world = mapFor(shown);
        const dots = fitCanvas(canvas, DEEP_VIEW_W, DEEP_VIEW_H);
        ctx.setTransform(dots, 0, 0, dots, 0, 0);
        drawDeep(ctx, shown, world, {
          me,
          aim: thumb.read().aim,
          pad: thumb.view(),
        });
        syncHud(shown);
        sing(shown);
      }
      raf = window.requestAnimationFrame(frame);
    };
    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      stopKeys();
      stopTouch();
      controls.forget();
      thumb.forget();
    };
  }, [playing, publishNow, syncHud]);

  return {
    status,
    seatId,
    isHost,
    seats,
    hud,
    canvasRef,
    start: begin,
    again: begin,
    messages,
    sendChat,
  };
}

/** Ob zwei Anzeigen dasselbe sagen. */
function sameHud(a: DeepOnlineHud, b: DeepOnlineHud): boolean {
  return (
    a.stage === b.stage &&
    a.phase === b.phase &&
    a.hull === b.hull &&
    Math.round(a.air) === Math.round(b.air) &&
    a.beasts === b.beasts &&
    a.kills === b.kills &&
    a.imDown === b.imDown &&
    a.partnerDown === b.partnerDown
  );
}
