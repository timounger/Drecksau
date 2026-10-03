/**
 * Was im Wasser lebt: wie es heißt, wie es schwimmt und was es aushält.
 *
 * @module
 * @remarks
 * Ein eigenes Modul, weil hier drei Dinge zusammengehören, die sonst über die
 * halbe Engine verstreut lägen: **die Tabelle** ({@link BREEDS}), **die
 * Bewegung** ({@link swum}) und **der Schaden** ({@link mauled}).
 *
 * Die Enzyklopädie liest dieselbe Tabelle. Damit kann im Wasser nichts
 * schwimmen, was dort nicht beschrieben ist, und im Buch nichts stehen, was es
 * nicht gibt - der häufigste Fehler in Spielen mit einem Bestiarium.
 *
 * Die Tiere stehen als Buchstaben in den Kursstücken ({@link ./levels}) und
 * werden beim Bauen des Kurses zu Wesen. Sie leben nur für einen Tauchgang:
 * Wer ein Gewässer wiederholt, trifft sie alle wieder an.
 */
import { CELL, ROWS, type Beast, type BeastKind, type Vec } from "./types";
import type { Blast, Shot } from "./types";
import type { WeaponKind } from "./upgrades";

/**
 * Wie sich ein Tier bewegt.
 *
 * @remarks
 * Sechs Gangarten für sechs Tiere, und jede ist eine Entscheidung für den
 * Spieler: Was treibt, kann man umfahren. Was jagt, muss man loswerden.
 */
export type Gait = "drift" | "sway" | "floor" | "still" | "dart" | "hunt";

/** Alles, was eine Art ausmacht. */
export type Breed = {
  /** Wie es auf Deutsch heißt. */
  readonly name: string;
  /** Wie viele Harpunentreffer es aushält. */
  readonly hull: number;
  /** Wie groß es ist, als Radius in Pixeln. */
  readonly size: number;
  /** Wie weit es sich von seinem Zuhause entfernt. */
  readonly roam: number;
  /** Und wie schnell, in Pixeln je Sekunde. */
  readonly pace: number;
  readonly gait: Gait;
  /** Ob man es im Dunkeln auch ohne Scheinwerfer sieht. */
  readonly glows: boolean;
  /** Ob Stiche an ihm abprallen und nur Explosionen helfen. */
  readonly armoured: boolean;
  /** Was die Enzyklopädie darüber schreibt. */
  readonly note: string;
  /** Und was man damit anfängt. */
  readonly tip: string;
};

/**
 * Jede Art, einmal beschrieben.
 *
 * @remarks
 * Die Reihenfolge ist die, in der man ihnen auf dem Weg nach unten begegnet -
 * so steht die Enzyklopädie nachher in derselben Ordnung wie die Fahrt.
 */
export const BREEDS: Readonly<Record<BeastKind, Breed>> = {
  shoal: {
    name: "Fischschwarm",
    hull: 1,
    size: 20,
    roam: 95,
    pace: 60,
    gait: "sway",
    glows: false,
    armoured: false,
    note: "Hunderte kleine Leiber, die sich wie einer bewegen. Allein wäre jeder davon harmlos; zusammen sind sie eine Wand, die zur Seite zieht und wiederkommt.",
    tip: "Ein einziger Treffer reicht und der Schwarm stiebt auseinander. Wer sparen will, fährt einfach daran vorbei - er zieht ohnehin ständig zur Seite.",
  },
  jelly: {
    name: "Leuchtqualle",
    hull: 2,
    size: 16,
    roam: 80,
    pace: 30,
    gait: "drift",
    glows: true,
    armoured: false,
    note: "Sie steigt und sinkt, als hätte sie alle Zeit der Welt, und leuchtet dabei von innen. In den tiefen Gewässern ist sie oft das Einzige, was man sieht, bevor man es berührt.",
    tip: "Zwei Treffer. Ihr Leuchten verrät sie auch ohne Scheinwerfer - wer sie kommen sieht, braucht gar nicht zu schießen.",
  },
  urchin: {
    name: "Seeigel",
    hull: 4,
    size: 14,
    roam: 0,
    pace: 0,
    gait: "still",
    glows: false,
    armoured: true,
    note: "Ein Ball aus Stacheln, der sich am Fels festhält und nichts weiter tut. Er jagt niemanden. Er ist einfach da, meistens genau dort, wo man lang will.",
    tip: "Harpunen prallen an den Stacheln ab - hier hilft nur eine Explosion oder ein Bogen darum herum. Das billigste Gegenmittel ist Abstand.",
  },
  crab: {
    name: "Panzerkrabbe",
    hull: 4,
    size: 18,
    roam: 70,
    pace: 38,
    gait: "floor",
    glows: false,
    armoured: false,
    note: "Sie läuft den Grund ab, immer dieselbe Strecke, und hebt die Scheren, wenn etwas vorbeikommt. Ihr Panzer ist das, was von den Tieren übrig bleibt, die hier unten keinen haben.",
    tip: "Vier Treffer, also nichts für die Harpune allein. Oben herum ist fast immer frei - sie verlässt den Grund nie.",
  },
  eel: {
    name: "Tiefseeaal",
    hull: 2,
    size: 16,
    roam: 120,
    pace: 150,
    gait: "dart",
    glows: false,
    armoured: false,
    note: "Er liegt still, bis er es nicht mehr tut. Dann schießt er quer durch den Gang und ist auf der anderen Seite, bevor man den Finger an der Taste hat.",
    tip: "Zwei Treffer, aber erst muss man ihn erwischen. Einfacher ist, seinen Takt abzuwarten: Er fährt immer dieselbe Linie.",
  },
  angler: {
    name: "Anglerfisch",
    hull: 5,
    size: 19,
    roam: 170,
    pace: 46,
    gait: "hunt",
    glows: true,
    armoured: false,
    note: "Das Licht an seiner Rute ist keine Freundlichkeit. Es ist der einzige Köder, den es in einer Welt ohne Licht braucht, und es kommt langsam, aber es kommt.",
    tip: "Fünf Treffer - der zäheste Bewohner vor dem Wächter. Er ist langsamer als jedes Boot: Wer nicht kämpfen will, fährt ihm davon.",
  },
};

/** Welcher Buchstabe im Kursplan welches Tier bedeutet. */
export const BEAST_LETTERS: Readonly<Record<string, BeastKind>> = {
  F: "shoal",
  Q: "jelly",
  I: "urchin",
  K: "crab",
  A: "eel",
  T: "angler",
};

/** Was eine Waffe von einem Tier abbeißt. */
const TEETH: Readonly<Record<WeaponKind, number>> = {
  harpoon: 1,
  torpedo: 3,
  mine: 3,
};

/** Und was eine Explosion in seiner Nähe abbeißt. */
const SINGED = 3;

/** Wie lange ein Tier nach einem Treffer aufleuchtet, in Sekunden. */
const SMART = 0.2;

/** Wie weit ein Jäger höchstens vom Boot entfernt bleibt, bevor er aufgibt. */
const GIVE_UP = 520;

/** Wie hoch die Grenzen sind, zwischen denen alles schwimmt. */
const LANE = { top: CELL, floor: ROWS * CELL - CELL } as const;

/**
 * Ein Wesen, wie es in den Kurs gesetzt wird.
 *
 * @param id - seine Nummer im Kurs
 * @param kind - welche Art
 * @param at - wo es zu Hause ist, in Kurspixeln
 * @returns das Wesen, unversehrt und in Ruhe
 */
export function spawn(id: number, kind: BeastKind, at: Vec): Beast {
  return {
    id,
    kind,
    x: at.x,
    y: at.y,
    homeX: at.x,
    homeY: at.y,
    vx: 0,
    vy: 0,
    // Versetzt angefangen, damit nicht der halbe Kurs im Gleichtakt schwimmt.
    beat: id * BEAT_OFFSET,
    hull: BREEDS[kind].hull,
    hurt: 0,
  };
}

/** Wie weit die Uhren zweier Nachbarn auseinanderliegen, in Sekunden. */
const BEAT_OFFSET = 0.7;

/**
 * Ein Wesen, eine Bewegung weiter.
 *
 * @param beast - wie es steht
 * @param sub - wo das Boot ist, für die Jäger
 * @param dt - wie lange das Bild gedauert hat
 * @returns das Wesen danach
 * @remarks
 * Alles außer dem Jäger ist eine **Funktion seiner eigenen Uhr** und nicht des
 * letzten Bildes: Ein Aal fährt bei jedem Versuch dieselbe Linie, und genau
 * das macht ihn lernbar. Gerechnet wird trotzdem Schritt für Schritt, weil die
 * Geschwindigkeit fürs Zeichnen gebraucht wird.
 */
export function swum(beast: Beast, sub: Vec, dt: number): Beast {
  const breed = BREEDS[beast.kind];
  const beat = beast.beat + dt;
  const turn = breed.roam === 0 ? 0 : (breed.pace / breed.roam) * beat;
  const wave = Math.sin(turn);
  let x = beast.x;
  let y = beast.y;

  switch (breed.gait) {
    case "drift":
      y = beast.homeY + wave * breed.roam;
      break;
    case "sway":
    case "floor":
      x = beast.homeX + wave * breed.roam;
      break;
    case "dart":
      // Die dritte Potenz: lange still an den Enden, dann ein Satz durch die
      // Mitte. Dasselbe Hin und Her, nur mit Temperament.
      x = beast.homeX + wave * wave * wave * breed.roam;
      break;
    case "hunt": {
      const toward = Math.hypot(sub.x - beast.x, sub.y - beast.y) || 1;
      const after = toward < GIVE_UP;
      const goX = after ? sub.x : beast.homeX;
      const goY = after ? sub.y : beast.homeY;
      const away = Math.hypot(goX - beast.x, goY - beast.y) || 1;
      const step = Math.min(breed.pace * dt, away);
      x = beast.x + ((goX - beast.x) / away) * step;
      y = beast.y + ((goY - beast.y) / away) * step;
      // Weiter als seine Leine lässt er sich nicht ziehen.
      const rope = Math.hypot(x - beast.homeX, y - beast.homeY);
      if (rope > breed.roam) {
        x = beast.homeX + ((x - beast.homeX) / rope) * breed.roam;
        y = beast.homeY + ((y - beast.homeY) / rope) * breed.roam;
      }
      break;
    }
    default:
      break;
  }

  const held = Math.max(LANE.top, Math.min(LANE.floor, y));
  return {
    ...beast,
    x,
    y: held,
    vx: (x - beast.x) / Math.max(dt, Number.EPSILON),
    vy: (held - beast.y) / Math.max(dt, Number.EPSILON),
    beat,
    hurt: Math.max(0, beast.hurt - dt),
  };
}

/**
 * Was die eigenen Schüsse und Explosionen von den Tieren übrig lassen.
 *
 * @param beasts - alles, was lebt
 * @param shots - was gerade unterwegs ist
 * @param booms - und was gerade hochgeht
 * @param reachOf - wie weit der Knall einer Waffe reicht, oder null
 * @typeParam S - die Sorte Schuss; was hereingeht, kommt auch wieder heraus,
 *   damit der Endlosmodus seinen eigenen Schuss durchreichen kann
 * @returns die Überlebenden, die weiterfliegenden Schüsse, die Toten und die
 *   Knalle, die dabei entstanden sind
 * @remarks
 * **Ein Stich prallt am Seeigel ab.** Der Schuss ist trotzdem weg - er steckt
 * in den Stacheln. Was einen Knall hat, geht an ihm aber sehr wohl hoch, und
 * das ist der einzige Ort im Spiel, an dem die teure Waffe etwas kann, was die
 * billige nicht kann: Der Seeigel ist die Antwort auf die Frage, wozu man
 * einen Torpedo braucht, wenn die Harpune doch dasselbe trifft.
 */
export function mauled<S extends Shot>(
  beasts: readonly Beast[],
  shots: readonly S[],
  booms: readonly Blast[],
  reachOf: (kind: WeaponKind) => number,
): {
  readonly beasts: readonly Beast[];
  readonly shots: readonly S[];
  readonly dead: readonly Vec[];
  readonly pops: readonly { readonly at: Vec; readonly reach: number }[];
} {
  const left: S[] = [];
  const dead: Vec[] = [];
  const pops: { at: Vec; reach: number }[] = [];
  let living = beasts;

  for (const shot of shots) {
    const struck = living.find((one) => near(one, shot, 0));
    if (struck === undefined) {
      left.push(shot);
    } else {
      const reach = reachOf(shot.kind);
      const armoured = BREEDS[struck.kind].armoured;
      living = hurt(living, struck.id, armoured ? 0 : TEETH[shot.kind], dead);
      if (reach > 0) {
        pops.push({ at: { x: shot.x, y: shot.y }, reach });
        for (const one of living) {
          if (near(one, shot, reach)) {
            living = hurt(living, one.id, SINGED, dead);
          }
        }
      }
    }
  }

  for (const boom of booms) {
    for (const one of living) {
      if (near(one, boom, boom.reach)) {
        living = hurt(living, one.id, SINGED, dead);
      }
    }
  }

  return { beasts: living, shots: left, dead, pops };
}

/**
 * Ob eines der Tiere das Boot erwischt hat.
 *
 * @param beasts - alles, was lebt
 * @param sub - das Boot
 * @param discs - die Scheiben, aus denen der Rumpf besteht
 * @param radius - wie dick eine davon ist
 * @returns die Stelle, an der es wehtut, oder null
 */
export function bitten(
  beasts: readonly Beast[],
  sub: Vec,
  discs: readonly number[],
  radius: number,
): Vec | null {
  let hit: Vec | null = null;

  for (const beast of beasts) {
    for (const along of discs) {
      const cx = sub.x + along;
      const close =
        Math.hypot(beast.x - cx, beast.y - sub.y) <
        radius + BREEDS[beast.kind].size;
      if (close && hit === null) {
        hit = { x: cx, y: sub.y };
      }
    }
  }

  return hit;
}

/** Ob ein Punkt nah genug an einem Tier ist, um es zu treffen. */
function near(beast: Beast, at: Vec, extra: number): boolean {
  return (
    Math.hypot(beast.x - at.x, beast.y - at.y) < BREEDS[beast.kind].size + extra
  );
}

/**
 * Ein Tier, um so viel beschädigt - und aus der Liste, wenn es das war.
 *
 * @remarks
 * `dead` wird nebenbei gefüllt statt zurückgegeben: Die Liste gehört dem
 * Aufrufer, der daraus die Knalle macht, und zwei Rückgabewerte für eine
 * Hilfsfunktion wären hier mehr Umstand als Nutzen.
 */
function hurt(
  beasts: readonly Beast[],
  id: number,
  bite: number,
  dead: Vec[],
): readonly Beast[] {
  const next: Beast[] = [];

  for (const one of beasts) {
    const mine = one.id === id;
    const rest = mine ? one.hull - bite : one.hull;
    if (mine && rest <= 0) {
      dead.push({ x: one.x, y: one.y });
    } else {
      next.push(mine ? { ...one, hull: rest, hurt: SMART } : one);
    }
  }

  return next;
}
