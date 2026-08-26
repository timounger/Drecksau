/**
 * The Bohnanza rules, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";
import { BEANS, BEAN_INFO } from "@/games/bohnanza/engine/beans";

/** A dash where a sort's Bohnometer has no entry for that many Taler. */
const NONE = "-";

/** How many Taler columns the table shows. */
const COIN_COLUMNS = 4;

/**
 * The Bohnometer of all eight sorts as one table.
 *
 * @remarks
 * Built from the card data rather than typed out again: the numbers on this
 * page and the numbers a harvest actually pays have to be the same numbers, and
 * the only way to be sure of that is for there to be one copy of them.
 */
const METER_TABLE: readonly (readonly string[])[] = [
  ["Sorte", "Karten", "1 Taler", "2", "3", "4"],
  ...BEANS.map((bean) => {
    const info = BEAN_INFO[bean];
    return [
      info.name,
      String(info.count),
      ...Array.from(
        { length: COIN_COLUMNS },
        (unused, at) => info.meter[at]?.toString() ?? NONE,
      ),
    ];
  }),
];

/** What the rules button opens. */
export const BZ_RULES: GameRules = {
  title: "Bohnanza",
  players: "3 bis 5 Spieler",
  intro:
    "Baue Bohnen auf deinen Feldern an, handle mit den anderen und ernte zur richtigen Zeit. Wer am Ende die meisten Bohnentaler hat, gewinnt.",
  sections: [
    {
      title: "Die wichtigste Regel",
      body: [
        "Die Reihenfolge deiner Handkarten darfst du nie ändern. Die vorderste Karte ist die, die du anbauen musst; nachgezogene Karten kommen hinten an. Sortieren ist verboten.",
      ],
    },
    {
      title: "Bohnenfelder",
      body: [
        "Zu dritt hat jeder drei Felder, zu viert und zu fünft nur zwei.",
        "Auf einem Feld wächst nur eine Sorte. Dieselbe Sorte darf gleichzeitig auf mehreren Feldern liegen.",
      ],
    },
    {
      title: "Ein Zug in vier Phasen",
      list: [
        "1. Die vorderste Handkarte anbauen - danach darfst du noch eine zweite anbauen, eine dritte nicht.",
        "2. Zwei Karten aufdecken. Sie gehören dir. Jetzt wird gehandelt.",
        "3. Alles, was quer neben den Feldern liegt, wird angebaut - bei allen, nicht nur bei dir.",
        "4. Drei Karten nachziehen und hinten an die Hand stecken.",
      ],
      body: [
        "Passt eine Bohne auf kein Feld, musst du zuerst ein Feld abernten. Hast du zu Beginn keine Handkarten, geht es gleich mit Phase 2 weiter.",
      ],
    },
    {
      title: "Handeln",
      body: [
        "Nur die aktive Person handelt mit den anderen; die anderen nicht untereinander. Gehandelt wird mit Handkarten - egal, an welcher Stelle sie liegen - und mit den zwei aufgedeckten Karten.",
        "Ein Angebot nennt die Karten, die es hergibt, und die Sorten, die es dafür will. Ohne Wunschsorte ist es ein Geschenk - auch das muss angenommen werden.",
        "Beide müssen zustimmen. Erhaltene Karten legst du quer neben deine Felder; auf die Hand darfst du sie nicht nehmen, und weiterhandeln damit auch nicht.",
      ],
    },
    {
      title: "Die Bohnenernte",
      body: [
        "Ernten darfst du jederzeit, auch wenn du nicht dran bist. Zähle die Karten auf dem Feld, lies im Bohnometer ab, wie viele Taler es dafür gibt, drehe so viele Karten auf die Talerseite und lege den Rest ab. Das Feld ist danach leer.",
        "Bohnenschutzregel: eine einzelne Bohne darfst du nicht ernten, solange auf einem deiner Felder mehr als eine Bohne liegt.",
      ],
    },
    {
      title: "Das Bohnometer",
      table: METER_TABLE,
      body: [
        "Die große Zahl auf der Karte sagt, wie oft die Sorte im Spiel ist - je häufiger sie ist, desto mehr Karten braucht sie für einen Taler.",
      ],
    },
    {
      title: "Spielende",
      body: [
        "Das Spiel endet, sobald der Nachziehstapel zum dritten Mal leer wird. Passiert das beim Aufdecken in Phase 2, werden Phase 2 und 3 noch zu Ende gespielt.",
        "Dann erntet jeder seine Felder ab. Handkarten zählen nicht mehr. Wer die meisten Taler hat, gewinnt; bei Gleichstand gewinnt, wer im Uhrzeigersinn am weitesten von der Start-Karte sitzt.",
      ],
    },
  ],
  note: "Spiel von Uwe Rosenberg, AMIGO 1997 und 2016. Diese Ausgabe hat 104 Karten mit acht Sorten; die großen Ausgaben haben mehr.",
};
