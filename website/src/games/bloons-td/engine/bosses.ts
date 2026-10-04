/**
 * Was die Bosse können, und wann.
 *
 * @module
 * @remarks
 * **Hier wird nur entschieden, nicht ausgeführt.** {@link skillOf} sagt, was
 * ein Boss in diesem Augenblick tut - Türme lähmen, Ballons ausspucken, sich
 * heilen, einen Panzer anlegen, verschwinden, einen Meteor werfen -, und die
 * Engine setzt es um. So bleibt die Engine die einzige Stelle, die den
 * Zustand ändert, und jeder Boss steht hier in einer Zeile.
 */
import type { BloonKind, Harm } from "@/games/bloons-td/engine/bloons";

/** Was ein Boss gerade tut. */
export type Act =
  /** Alle Türme im Umkreis schießen so viele Sekunden nicht. */
  | { readonly does: "stun"; readonly reach: number; readonly seconds: number }
  /** Ein Meteor legt einen einzelnen Turm lahm. */
  | { readonly does: "meteor"; readonly seconds: number }
  /** So viele Ballons dieser Sorte kommen hinter ihm heraus. */
  | { readonly does: "spawn"; readonly kind: BloonKind; readonly count: number }
  /**
   * Er heilt diesen Anteil seiner vollen Hülle, für jeden Trank, den er einem
   * Turm stiehlt, ein Stück mehr - aber nie mehr als `most` auf einmal.
   */
  | {
      readonly does: "heal";
      readonly share: number;
      readonly perBrew: number;
      readonly most: number;
    }
  /** Ein Steinpanzer aus diesem Anteil seiner Hülle, gegen diese Schadensart. */
  | { readonly does: "armor"; readonly share: number; readonly ward: Harm }
  /** Er ist so viele Sekunden nicht zu treffen. */
  | { readonly does: "phase"; readonly seconds: number }
  /** Er tut nichts - ein gewöhnlicher Ballon. */
  | { readonly does: "nothing" };

/**
 * Wie oft jeder Boss seine Fähigkeit einsetzt, in Sekunden.
 *
 * @remarks
 * Die erste kommt so viele Sekunden nach seinem Auftritt, danach in diesem
 * Takt. Ein fester Takt statt Zufall, damit man ihn lernen kann.
 */
export const EVERY: Readonly<Partial<Record<BloonKind, number>>> = {
  vortex: 6,
  bloonarius: 4,
  dreadbloon: 9,
  lych: 5,
  phayze: 6,
  blastapopoulos: 7,
};

/** Die Zahlen hinter den Fähigkeiten. */
const SKILL = {
  /** Vortex: wie weit sein Wirbel reicht (in Feldbreiten) und wie lange er lähmt. */
  vortexReach: 2.5,
  vortexStun: 2,
  /** Bloonarius: was er ausspuckt und wie viele. */
  spawn: "ceramic",
  spawnCount: 3,
  /**
   * Lych: wie viel er sich heilt, wie viel mehr je gestohlenem Trank, und wie
   * viel höchstens auf einmal.
   *
   * @remarks
   * **Ohne Obergrenze war er unbesiegbar**: Ein Feld voller Alchemisten gibt
   * zwanzig Türmen gleichzeitig einen Trank, und mit vier Prozent je Trank
   * heilte Lych sich alle fünf Sekunden um mehr als drei Viertel.
   */
  heal: 0.03,
  perBrew: 0.01,
  healMost: 0.12,
  /** Dreadbloon: wie dick sein Panzer ist, als Anteil der vollen Hülle. */
  armor: 0.12,
  /** Phayze: wie lange er verschoben bleibt. */
  phase: 2,
  /** Blastapopoulos: wie lange ein Meteor einen Turm lahmlegt. */
  meteor: 4,
} as const;

/**
 * Wogegen der Steinpanzer des Dreadbloon schützt, der Reihe nach.
 *
 * @remarks
 * Jeder neue Panzer schützt gegen die nächste Schadensart in dieser Liste.
 * Wer nur eine Sorte Turm gebaut hat, steht jedes dritte Mal vor einer Wand.
 */
const WARDS: readonly Harm[] = ["sharp", "explosion", "energy"];

/**
 * Was ein Boss tut, wenn seine Uhr abgelaufen ist.
 *
 * @param kind - welcher Boss
 * @param ward - wogegen sein letzter Panzer geschützt hat, oder null
 * @returns die Fähigkeit
 */
export function skillOf(kind: BloonKind, ward: Harm | null): Act {
  let act: Act;

  switch (kind) {
    case "vortex":
      act = {
        does: "stun",
        reach: SKILL.vortexReach,
        seconds: SKILL.vortexStun,
      };
      break;
    case "bloonarius":
      act = { does: "spawn", kind: SKILL.spawn, count: SKILL.spawnCount };
      break;
    case "dreadbloon": {
      const at = ward === null ? -1 : WARDS.indexOf(ward);
      act = {
        does: "armor",
        share: SKILL.armor,
        ward: WARDS[(at + 1) % WARDS.length] ?? "sharp",
      };
      break;
    }
    case "lych":
      act = {
        does: "heal",
        share: SKILL.heal,
        perBrew: SKILL.perBrew,
        most: SKILL.healMost,
      };
      break;
    case "phayze":
      act = { does: "phase", seconds: SKILL.phase };
      break;
    case "blastapopoulos":
      act = { does: "meteor", seconds: SKILL.meteor };
      break;
    default:
      act = { does: "nothing" };
  }

  return act;
}
