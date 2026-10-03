/**
 * Was zwischen zwei Booten über die Leitung geht.
 *
 * @module
 * @remarks
 * Der Endlosmodus läuft in Echtzeit, also nicht über den rundenbasierten
 * Online-Kern: **Der Host rechnet, der Gast schaut zu und schickt seine
 * Tasten.** Zwanzigmal in der Sekunde veröffentlicht der Host den Zustand,
 * der Gast zeichnet den neuesten, den er hat.
 *
 * Verschickt wird der Zustand, wie er ist - er ist klein genug: zwei Boote,
 * ein paar Bewohner, ein paar Schüsse. **Die Karte geht nicht mit.** Sie wächst
 * aus Stufe und Saat ({@link ../endless/world buildDeep}), und die beiden
 * Zahlen stehen im Zustand - der Gast baut sich dieselbe Karte daraus selbst,
 * genauso wie es die Panzerkiste mit ihrem Gitter macht.
 */
import type { DeepInput, DeepState } from "@/games/uboot/endless/types";
import { isChatPayload } from "@/online/online-state";
import type { RoomState, Seat } from "@/online/adapter";
import type { MoveIntent, WireGuards } from "@/online/transport";

/** Unter welchem Namen die Räume dieses Spiels stehen. */
export const UBOOT_GAME_ID = "uboot";

/** Was der Gast schickt: seine Tasten, Bild für Bild. */
export type DeepMove = DeepInput;

/** Und was der Host schickt: die Welt, wie sie bei ihm steht. */
export type DeepSnapshot = DeepState;

/** Die Prüfungen, mit denen die Leitung fremde Werte aussiebt. */
export const UBOOT_GUARDS: WireGuards<DeepSnapshot, DeepMove, null> = {
  isRoomState: isDeepRoom,
  isMoveIntent: isDeepIntent,
  isHand: isNoHand,
  isChatPayload,
};

/** Ob ein Wert aussieht wie ein Weltzustand. */
function isDeepSnapshot(value: unknown): value is DeepSnapshot {
  const snap = value as DeepSnapshot;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof snap.stage === "number" &&
    typeof snap.seed === "number" &&
    typeof snap.phase === "string" &&
    typeof snap.time === "number" &&
    typeof snap.nextId === "number" &&
    Array.isArray(snap.divers) &&
    Array.isArray(snap.beasts) &&
    Array.isArray(snap.shots) &&
    Array.isArray(snap.blasts) &&
    Array.isArray(snap.drops) &&
    Array.isArray(snap.gone)
  );
}

/** Ob ein Wert ein Raum ist, in dem so ein Zustand steckt. */
function isDeepRoom(value: unknown): value is RoomState<DeepSnapshot> {
  const room = value as RoomState<DeepSnapshot>;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof room.code === "string" &&
    typeof room.hostId === "string" &&
    Array.isArray(room.seats) &&
    typeof room.phase === "string" &&
    typeof room.version === "number" &&
    (room.game === null || isDeepSnapshot(room.game))
  );
}

/** Ob ein Wert die Tasten eines Gastes sind. */
function isDeepMove(value: unknown): value is DeepMove {
  const move = value as DeepMove;
  const aim = move?.aim;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof move.up === "boolean" &&
    typeof move.down === "boolean" &&
    typeof move.back === "boolean" &&
    typeof move.forward === "boolean" &&
    typeof move.fire === "boolean" &&
    typeof move.drop === "boolean" &&
    (aim === null ||
      (typeof aim === "object" &&
        typeof aim.x === "number" &&
        typeof aim.y === "number"))
  );
}

/** Ob ein Wert eine Absicht eines Gastes ist. */
function isDeepIntent(value: unknown): value is MoveIntent<DeepMove> {
  const intent = value as MoveIntent<DeepMove>;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof intent.seatId === "string" &&
    isDeepMove(intent.move)
  );
}

/** Hier wechselt nichts Geheimes den Besitzer, also ist die Hand immer leer. */
function isNoHand(value: unknown): value is null {
  return value === null;
}

/**
 * Baut den Platz eines Spielers.
 *
 * @param id - seine Nummer in diesem Raum
 * @param name - wie er heißt
 * @param isHost - ob er den Raum aufgemacht hat
 * @returns der Platz
 */
export function makeSeat(id: string, name: string, isHost: boolean): Seat {
  return { id, name, isHost };
}
