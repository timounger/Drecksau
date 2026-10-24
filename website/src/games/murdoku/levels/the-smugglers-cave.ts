/**
 * Die Schmugglerhöhle: three nameless caves, an underground lake with a
 * sloop and a frigate, a dock and the main tunnel, with a murdered smuggler.
 *
 * @module
 * @remarks
 * After the case of Murdoku by Manuel Garand
 * (`game_instructions/Murdoku/Murdoku 2 - Auf Zeitreise/41.png`, no
 * solution sheet - the solved grid and the culprit are pencilled in on the
 * photographed page, and the solver proves it is the only solution).
 * Van Keef is the victim; whoever was alone with him killed him. No estates
 * in this case.
 *
 * The map is nine by nine. The three caves have lost their names: one is
 * the captain's cave, one the deck cave and one the stash cave, and the
 * clues that name one only say that they are three different caves
 * ({@link namesFit}). Hammocks can be stood on; barrels, crates, ropes and
 * the campfire cannot.
 */
/* eslint-disable @typescript-eslint/no-magic-numbers -- the case is data: rows, columns and counts straight off the printed page. */
import {
  alone,
  all,
  counting,
  beside,
  inArea,
  not,
  on,
  own,
  victim,
} from "../engine/clues";
import type { Context, Level } from "../engine/types";

/** The three caves without a name. */
const CAVES: readonly string[] = ["X", "Y", "Z"];

/** The two ships. */
const SHIPS: readonly string[] = ["S", "F"];

/** The cave somebody stood in, or null. */
function caveOf(c: Context, id: string): string | null {
  const there = c.cellOf(id);
  const area = there === undefined ? null : c.areaOf(there);
  return area !== null && CAVES.includes(area) ? area : null;
}

/** The caves of the people standing exactly three rows north of Al. */
function cavesNorthOfAl(c: Context): readonly string[] {
  const al = c.cellOf("A");
  return c.people().flatMap((id) => {
    const there = c.cellOf(id);
    const cave = caveOf(c, id);
    return al !== undefined &&
      there !== undefined &&
      cave !== null &&
      there.row === al.row - 3
      ? [cave]
      : [];
  });
}

/**
 * Whether the caves can be named so that Barnabas is in the stash cave,
 * Frederick in the captain's cave and somebody three rows north of Al in the
 * deck cave - three different caves.
 */
function namesFit(c: Context): boolean {
  const stash = caveOf(c, "B");
  const captain = caveOf(c, "F");
  return (
    stash !== null &&
    captain !== null &&
    stash !== captain &&
    cavesNorthOfAl(c).some((deck) => deck !== stash && deck !== captain)
  );
}

/** How many people stand in somebody's area, them included; 0 while not placed. */
function crowdOf(c: Context, id: string): number {
  const there = c.cellOf(id);
  return there === undefined ? 0 : c.peopleIn(c.areaOf(there) ?? "").length;
}

/**
 * For the solver: whether a partial placement can still be finished - the
 * ones who were alone are, Frederick has at most one companion, and
 * Barnabas and Frederick are in different caves.
 */
function stillPossible(c: Context): boolean {
  const stash = caveOf(c, "B");
  return (
    crowdOf(c, "B") <= 1 &&
    crowdOf(c, "G") <= 1 &&
    crowdOf(c, "F") <= 2 &&
    (stash === null || stash !== caveOf(c, "F"))
  );
}

/** The case. */
export const THE_SMUGGLERS_CAVE: Level = {
  id: "the-smugglers-cave",
  name: "Die Schmugglerhöhle",
  series: { book: "timeTravel", number: 41 },
  story:
    "Wie hat die Fregatte diese enge Durchfahrt geschafft? Ein alter Schmugglertrick.",
  culprit: { name: "der Mörder", dative: "dem Mörder" },
  areas: [
    {
      key: "X",
      name: "???",
      at: "in der unbekannten Höhle im Nordwesten",
      ground: "stone",
      tint: "#ddd3e2",
      label: { row: 2, col: 0 },
    },
    {
      key: "Y",
      name: "???",
      at: "in der unbekannten Höhle im Nordosten",
      ground: "stone",
      tint: "#ddd3e2",
      label: { row: 2, col: 7 },
    },
    {
      key: "Z",
      name: "???",
      at: "in der unbekannten Höhle im Südwesten",
      ground: "stone",
      tint: "#d4cce0",
      label: { row: 8, col: 0 },
    },
    {
      key: "W",
      name: "Wasser",
      at: "im Wasser",
      ground: "water",
      label: { row: 7, col: 4 },
    },
    {
      key: "S",
      name: "Schaluppe",
      at: "auf der Schaluppe",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 3, col: 2 },
    },
    {
      key: "F",
      name: "Fregatte",
      at: "auf der Fregatte",
      ground: "floor",
      tint: "#e8dcc4",
      label: { row: 6, col: 6 },
    },
    {
      key: "D",
      name: "Steg",
      at: "auf dem Steg",
      ground: "floor",
      tint: "#e2d6e6",
      label: { row: 4, col: 6 },
    },
    {
      key: "T",
      name: "Haupttunnel",
      at: "im Haupttunnel",
      ground: "stone",
      tint: "#cfd2d8",
      label: { row: 8, col: 5 },
    },
  ],
  areaMap: [
    "XXXXXYYYY",
    "XXXXXYYYY",
    "XXXXWWYYY",
    "WWSSWWDDD",
    "ZWWWWWDDD",
    "ZZWWWFFFT",
    "ZZZWWFFFT",
    "ZZZTWWWWT",
    "ZZZTTTTTT",
  ],
  thingMap: [
    ".hho..o.b",
    "f..b.hhb.",
    "........c",
    ".......bo",
    ".......b.",
    "bc...b...",
    "chh..c...",
    ".........",
    ".co......",
  ],
  things: {
    b: "barrel",
    c: "woodCrate",
    f: "campfire",
    h: "hammock",
    o: "rope",
  },
  // The three hammocks, two fields each.
  pieces: [
    { at: { row: 0, col: 1 }, rows: 1, cols: 2 },
    { at: { row: 1, col: 5 }, rows: 1, cols: 2 },
    { at: { row: 6, col: 1 }, rows: 1, cols: 2 },
  ],
  suspects: [
    {
      id: "A",
      name: "Al",
      pronoun: "er",
      clue: {
        text: "Jemand war in der Deckshöhle, genau drei Zeilen nördlich von ihm.",
        ...all(
          own((c) => c.cell.row >= 3),
          counting((c) => cavesNorthOfAl(c).length > 0),
        ),
      },
      colour: "#b91c1c",
      face: "\u{1F468}‍\u{1F9B0}",
    },
    {
      id: "B",
      name: "Barnabas",
      pronoun: "er",
      clue: {
        text: "Er war allein in der Versteckhöhle.",
        ...all(inArea(...CAVES), alone()),
      },
      colour: "#15803d",
      face: "\u{1F9D4}",
    },
    {
      id: "C",
      name: "Conrad",
      pronoun: "er",
      clue: { text: "Er war auf dem Steg.", ...inArea("D") },
      colour: "#0e7490",
      face: "\u{1F468}\u{1F3FF}",
    },
    {
      id: "D",
      name: "Don",
      pronoun: "er",
      clue: { text: "Er war neben einem Seil.", ...beside("rope") },
      colour: "#6366f1",
      face: "\u{1F474}",
    },
    {
      id: "E",
      name: "Elsbeth",
      pronoun: "sie",
      clue: { text: "Sie war neben einem Fass.", ...beside("barrel") },
      colour: "#a16207",
      face: "\u{1F471}‍♀️",
    },
    {
      id: "F",
      name: "Frederick",
      pronoun: "er",
      clue: {
        text: "Er war in der Kapitänshöhle, allein mit jemandem.",
        ...all(
          inArea(...CAVES),
          counting((c) => c.peopleIn(c.areaOf(c.cell) ?? "").length === 2),
        ),
      },
      colour: "#be185d",
      face: "\u{1F9D1}‍\u{1F9B3}",
    },
    {
      id: "G",
      name: "Gannon",
      pronoun: "er",
      clue: {
        text: "Er war in einer Hängematte. Er war allein.",
        ...all(on("hammock"), alone()),
      },
      colour: "#7c3aed",
      face: "\u{1F468}",
    },
    {
      id: "H",
      name: "Hester",
      pronoun: "sie",
      clue: { text: "Sie war nicht auf einem Boot.", ...not(inArea(...SHIPS)) },
      colour: "#334155",
      face: "\u{1F469}\u{1F3FD}",
    },
    {
      id: "V",
      name: "Van Keef",
      pronoun: "er",
      clue: {
        text: "Das Opfer. Er war allein mit der Person, die den Mord beging.",
        ...victim(),
      },
      colour: "#57534e",
      face: "\u{1F977}",
    },
  ],
  rules: [
    {
      text: "Die drei Höhlen sind die Kapitänshöhle, die Deckshöhle und die Versteckhöhle - aber welche ist welche? Finde es heraus.",
      check: namesFit,
      prune: stillPossible,
    },
  ],
  hints: [
    {
      text: "Gannon und Barnabas waren allein in ihrer Höhle, Frederick mit genau einer weiteren Person - die drei stehen in drei verschiedenen Höhlen. Die Deckshöhle ist also Gannons, und Gannon steht genau drei Zeilen nördlich von Al. Seine Hängematte liegt in R1 (Nordwesten) oder R2 (Nordosten); unter der in R7 gibt es keine drei Zeilen mehr.",
    },
    {
      text: "Stünde Gannon im Nordosten in Zeile 2, wäre Al in Zeile 5, Conrad auf dem Steg in R4 C7 und Gannon in R2 C6. Elsbeth bliebe neben einem Fass nur R3 C4 im Nordwesten, wo auch die Person aus Zeile 1 stehen muss (Zeile 1 liegt ganz in Höhlen) - das wären Frederick und Elsbeth. Don bliebe neben einem Seil nur R8 C3, bei Barnabas, der allein war. Gannon liegt also im Nordwesten in Zeile 1, und Al steht in Zeile 4.",
    },
    {
      text: "Conrad steht auf dem Steg in Zeile 5 (R4 C7 ist Als Zeile). Don steht neben einem Seil: Zeile 1 ist Gannons; in R5 C9 hätte Conrad keinen Platz; in R2 C7 wäre er mit Frederick im Nordosten, und Elsbeth fände kein Fass mehr - der Nordwesten gehört Gannon allein, der Nordosten wäre voll, auf dem Steg stünde sie in Conrads Zeile, R5 C1 läge bei Barnabas im Südwesten und R6 C7 in Dons Spalte. Don steht in R8 C3, und Gannon in R1 C2, denn C3 ist Dons Spalte.",
      place: { D: { row: 7, col: 2 }, G: { row: 0, col: 1 } },
    },
    {
      text: "Mit Don ist der Südwesten Fredericks Kapitänshöhle, der Nordosten Barnabas' Versteckhöhle. Zeile 2 liegt ganz in Höhlen - dort steht Barnabas. Elsbeth: Nordwesten und Nordosten gehören Gannon und Barnabas allein, der Südwesten ist voll, auf dem Steg stünde sie in Conrads Zeile - sie steht in R6 C7 auf der Fregatte. Conrad steht in R5 C9.",
      place: { E: { row: 5, col: 6 }, C: { row: 4, col: 8 } },
    },
    {
      text: "Barnabas steht in Zeile 2 im Nordosten: C7 ist Elsbeths, C9 Conrads Spalte - R2 C6. Frederick steht im Südwesten, nicht in Zeile 5, 6 oder 8 und nicht in C2 oder C3: R9 C1.",
      place: { B: { row: 1, col: 5 }, F: { row: 8, col: 0 } },
    },
    {
      text: "Frei sind die Zeilen 3, 4 und 7 und die Spalten 4, 5 und 8. In Zeile 3 bleibt nur R3 C5 im Wasser (R3 C4 und R3 C8 liegen bei Gannon und Barnabas). Al steht in R4 C4 auf der Schaluppe, die letzte Person in R7 C8 auf der Fregatte. Hester war nicht auf einem Boot: Sie steht in R3 C5, Van Keef in R7 C8 - allein mit Elsbeth. Elsbeth ist die Mörderin!",
      place: {
        A: { row: 3, col: 3 },
        H: { row: 2, col: 4 },
        V: { row: 6, col: 7 },
      },
    },
  ],
  solution: {
    A: { row: 3, col: 3 },
    B: { row: 1, col: 5 },
    C: { row: 4, col: 8 },
    D: { row: 7, col: 2 },
    E: { row: 5, col: 6 },
    F: { row: 8, col: 0 },
    G: { row: 0, col: 1 },
    H: { row: 2, col: 4 },
    V: { row: 6, col: 7 },
  },
};
