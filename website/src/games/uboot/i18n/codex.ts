/**
 * Die Enzyklopädie: was es da unten gibt und warum es da unten ist.
 *
 * @module
 * @remarks
 * **Die Tiere stehen hier nicht.** Sie kommen aus {@link ../engine/beasts
 * BREEDS}, aus derselben Tabelle, aus der die Engine ihre Trefferzahlen nimmt.
 * Damit kann im Buch nichts stehen, was es nicht gibt, und nichts fehlen, was
 * schwimmt - der häufigste Fehler in Spielen mit einem Bestiarium ist ein
 * Eintrag, der seit drei Versionen von etwas anderem handelt.
 *
 * Geschrieben ist alles für jemanden, der gerade gestorben ist und wissen
 * will, woran: erst was es ist, dann was man dagegen tut.
 */
import { BREEDS } from "@/games/uboot/engine/beasts";
import type { BeastKind } from "@/games/uboot/engine/types";

/** Ein Eintrag im Buch. */
export type CodexEntry = {
  readonly id: string;
  readonly title: string;
  /** Ein Tier, dann wird sein Bild gezeichnet - sonst steht da ein Zeichen. */
  readonly beast?: BeastKind;
  readonly icon?: string;
  /** Die Kurzangaben über dem Text. */
  readonly facts?: readonly (readonly [string, string])[];
  readonly body: readonly string[];
};

/** Ein Kapitel davon. */
export type CodexChapter = {
  readonly id: string;
  readonly title: string;
  readonly intro?: string;
  readonly entries: readonly CodexEntry[];
};

/** In welcher Reihenfolge die Tiere im Buch stehen. */
const ORDER: readonly BeastKind[] = [
  "shoal",
  "jelly",
  "urchin",
  "crab",
  "eel",
  "angler",
];

/** Wie eine Gangart auf Deutsch heißt. */
const GAITS = {
  drift: "treibt auf und ab",
  sway: "zieht zur Seite und zurück",
  floor: "läuft den Grund ab",
  still: "rührt sich nicht",
  dart: "schießt in Sätzen umher",
  hunt: "kommt auf dich zu",
} as const;

/** Aus der Tabelle der Engine wird ein Eintrag. */
function fromBreed(kind: BeastKind): CodexEntry {
  const breed = BREEDS[kind];
  return {
    id: kind,
    title: breed.name,
    beast: kind,
    facts: [
      ["Hält aus", `${breed.hull} Harpunentreffer`],
      ["Bewegung", GAITS[breed.gait]],
      [
        "Im Dunkeln",
        breed.glows ? "leuchtet selbst" : "nur mit Licht oder Sonar",
      ],
      ...(breed.armoured
        ? ([["Besonderheit", "Stiche prallen ab"]] as const)
        : []),
    ],
    body: [breed.note, breed.tip],
  };
}

/** Das ganze Buch. */
export const UBOOT_CODEX: readonly CodexChapter[] = [
  {
    id: "story",
    title: "Die Geschichte",
    entries: [
      {
        id: "tale",
        title: "Journey to the Deep",
        icon: "\u{1F30A}",
        body: [
          "Irgendwann hat jemand aufgeschrieben, wie tief das Wasser hier ist, und irgendwann hat jemand anders die Zahl nicht geglaubt. So fangen die meisten Fahrten an.",
          "Das Boot ist gelb, weil gelb die einzige Farbe ist, die man unten noch eine Weile sieht. Es ist klein, weil nichts Großes durch die Gänge passt, die weiter unten warten. Und es ist alt, weil die neuen Boote alle oben geblieben sind.",
          "Hinter dir läuft das Wasser nach. Niemand weiß genau, warum - die einen sagen Strömung, die anderen sagen, der Graben zieht. Es ist auch egal: Wer stehenbleibt, wird geschoben, und wer geschoben wird, fährt irgendwann gegen etwas.",
          "Ganz unten, wo das Licht schon lange nicht mehr hinkommt, liegt der Graben. Dort wartet etwas, das größer ist als alles, was vorher kam, und es hat dort gewartet, lange bevor jemand Zahlen aufgeschrieben hat.",
          "Und vorn in der Kanzel sitzt einer, der das alles mitliest und nichts dazu sagt. Woher der kommt, steht nebenan.",
        ],
      },
      {
        id: "monkey",
        title: "Der Affe",
        icon: "\u{1F412}",
        facts: [
          ["An Bord seit", "jemand hat ihn hinzugefügt"],
          ["Aufgabe", "keine"],
          ["Bisher gesagt", "nichts"],
        ],
        body: [
          "Vorn in der Kanzel sitzt ein Affe mit einem Laptop. Er ist nicht als Fracht an Bord und nicht als Maskottchen: Jemand hat ihn eines Morgens zu dieser Fahrt dazugesetzt, ohne zu fragen, und seitdem ist er eben dabei.",
          "So etwas kennt man aus der Softwareentwicklung. Da stellt einer eine Änderung ein und hängt an die Liste der Prüfer noch drei Namen, die mit der Sache nichts zu tun haben. Die sitzen dann da unten, lesen mit, sagen nichts und tauchen nie auf. Man nennt sie U-Boote - und sie sind der Grund, warum dieses Spiel so heißt.",
          "Er steuert also nicht mit. Er fasst nichts an, er gibt nichts frei, er fordert nichts nach. Was er tut, ist zuschauen und einen Finger ans Kinn legen: Sein Blick liegt immer schon dort, wo es gleich knallt - ein, zwei Sekunden bevor du selbst hinschaust. Kommentiert hat er noch nie.",
          "Wer lange genug fährt, lenkt irgendwann nach dem Affen statt nach dem Fenster. Es ist nicht bewiesen, dass das hilft. Es ist nur noch nie jemand gesund zurückgekommen, der behauptet hätte, es helfe nicht.",
        ],
      },
    ],
  },
  {
    id: "life",
    title: "Die Bewohner",
    intro:
      "Alles hier unten hat einen Grund, dich nicht zu mögen: Du bist laut, du bist hell, und du fährst mitten hindurch. Was du abschießen kannst, steht dabei - was du besser umfährst, auch.",
    entries: [
      ...ORDER.map(fromBreed),
      {
        id: "kraken",
        title: "Der Wächter",
        icon: "\u{1F991}",
        facts: [
          ["Hält aus", "18 Harpunentreffer"],
          ["Bewegung", "zieht auf und ab, bleibt im Graben"],
          ["Im Dunkeln", "leuchtet selbst"],
          ["Besonderheit", "wirft drei Strahlen auf einmal"],
        ],
        body: [
          "Am Ende der zehnten Fahrt bleibt das Fenster stehen. Das ist kein Entgegenkommen - es heißt nur, dass es von hier aus nicht weitergeht, solange er da ist.",
          "Er wirft Tinte dorthin, wo du gerade warst, gleich drei Strahlen nebeneinander, und je mehr von ihm fehlt, desto schneller wirft er. Sein Leib tut weh: Wer glaubt, in ihm drin sei der sicherste Platz, hat recht - für ungefähr eine Sekunde.",
          "Die Linie hinter ihm zählt erst, wenn er unten ist. Ohne Waffe gibt es hier keinen Weg vorbei, und das ist die einzige Stelle im Spiel, an der das so ist.",
        ],
      },
    ],
  },
  {
    id: "things",
    title: "Was im Wasser liegt",
    intro:
      "Nichts davon lebt, und genau deshalb ändert nichts davon je seine Meinung. Fels bleibt Fels, eine Mine wartet, und das Tor am Ende steht immer offen.",
    entries: [
      {
        id: "rock",
        title: "Fels",
        icon: "\u{1FAA8}",
        facts: [
          ["Schaden", "eine Hülle je Berührung"],
          ["Zerstörbar", "nein - grauer Fels hält alles aus"],
        ],
        body: [
          "Der Grund wächst nach oben, die Decke hängt herunter, und dazwischen ist der Weg. In den Höhlen liegt immer Fels über dir - deshalb holt man dort keine Luft mehr.",
          "Gewachsener Stein bleibt, was auch immer man dagegen schießt. Er ist die Form des Gewässers, und eine Form, die man wegsprengen kann, ist keine.",
        ],
      },
      {
        id: "brittle",
        title: "Bruchfels",
        icon: "\u{1F9F1}",
        facts: [
          ["Schaden", "eine Hülle je Berührung"],
          ["Zerstörbar", "Torpedo oder Seemine"],
          ["Erkennbar", "bräunlich, mit Rissen"],
        ],
        body: [
          "Dasselbe Hindernis, nur mürbe: ein Torpedo oder eine gelegte Seemine macht eine Tür hinein. Man sieht es ihm an, bevor man schießt - er ist wärmer in der Farbe und voller Risse.",
          "Was weggesprengt ist, ist nur für diesen Tauchgang weg. Beim nächsten Mal steht die Wand wieder da, wo sie aufgeschrieben ist.",
        ],
      },
      {
        id: "mine",
        title: "Treibmine",
        icon: "\u{1F4A3}",
        facts: [
          ["Schaden", "eine Hülle, dann ist sie weg"],
          ["Zerstörbar", "drei Harpunen oder ein Torpedo"],
        ],
        body: [
          "Eine Kugel mit Stacheln und einem Licht, das nicht aufhört zu blinken. Sie treibt nicht, sie hängt - immer genau dort, wo die schnelle Linie durchgeht.",
          "Man sieht ihr an, wie oft sie schon getroffen wurde: Mit jedem Stich fehlt ihr ein Dorn, sie wird bleicher, und ein Riss läuft über sie. Beim dritten Mal geht sie hoch.",
        ],
      },
      {
        id: "kelp",
        title: "Tang",
        icon: "\u{1F33F}",
        facts: [
          ["Schaden", "keiner"],
          ["Besonderheit", "versteckt, was dahinter liegt"],
        ],
        body: [
          "Das Einzige hier unten, was wirklich harmlos ist. Man fährt mitten hindurch, und nichts passiert.",
          "Gefährlich ist nur, was darin steht: Eine Krabbe im Tang sieht man eine halbe Sekunde später als eine auf nacktem Grund.",
        ],
      },
      {
        id: "gate",
        title: "Das Tor",
        icon: "\u{1F6AA}",
        facts: [
          ["Wo", "am Ende jedes Gewässers"],
          ["Bringt", "Erfahrung, beim ersten Mal am meisten"],
        ],
        body: [
          "Ein Vorhang aus Licht quer durch das ganze Wasser. Wer ihn berührt, hat das Gewässer gemeistert - bei der letzten Fahrt allerdings erst, wenn der Wächter unten ist.",
          "Ein Gewässer, das man schon hat, zahlt beim zweiten Mal ein Viertel. Nichts ist also je verloren, es ist nur weiter weg.",
        ],
      },
    ],
  },
  {
    id: "boat",
    title: "Was du dabeihast",
    intro:
      "Alles davon wird in der Werkstatt gekauft, und alles zusammen kostet mehr, als zehn Gewässer beim ersten Mal einbringen. Die erste Frage ist deshalb nicht, wann du alles hast, sondern welches Boot du willst.",
    entries: [
      {
        id: "harpoon",
        title: "Harpune",
        icon: "\u{1F3F9}",
        facts: [
          ["Schuss", "Linksklick, dorthin, wo du hinklickst"],
          ["Wirkung", "sticht, kein Knall"],
        ],
        body: [
          "Schnell, billig und sie kommt schnell hintereinander. Dafür sticht sie nur: Eine Treibmine hält drei aus, eine Krabbe vier, und am Seeigel prallt sie ganz ab.",
          "An Fels ist sie verloren. Sie ist die Waffe für alles, was weich ist und im Weg schwimmt.",
        ],
      },
      {
        id: "torpedo",
        title: "Torpedo",
        icon: "\u{1F6E2}️",
        facts: [
          ["Schuss", "Linksklick - er ersetzt die Harpune"],
          ["Wirkung", "ein Treffer genügt, nimmt Fels mit"],
        ],
        body: [
          "Dasselbe Rohr, besser bestückt. Langsamer und seltener, aber was er trifft, ist beim ersten Mal weg, und den Fels daneben nimmt er gleich mit: Ein Torpedo macht eine Tür, wo vorher eine Wand war.",
          "Er ist die einzige Antwort auf den Seeigel - Stacheln halten Stiche auf, aber keinen Knall.",
        ],
      },
      {
        id: "seamine",
        title: "Seemine",
        icon: "\u{1F9EB}",
        facts: [
          ["Legen", "Rechtsklick, zusätzlich zum Rohr"],
          ["Wirkung", "geht nach zwei Sekunden hoch"],
        ],
        body: [
          "Sie wird nicht geschossen, sondern gelegt, und sie bleibt liegen, wo du sie gelassen hast. Nach ein paar Sekunden geht sie hoch - mit allem in ihrem Umkreis.",
          "Die eigenen Explosionen tun dem Boot nichts. Das ist eine Entscheidung und keine Physik: Eine Waffe, die einen selbst zerlegt, setzt niemand ein.",
        ],
      },
      {
        id: "light",
        title: "Scheinwerfer und Sonar",
        icon: "\u{1F526}",
        facts: [
          ["Scheinwerfer", "ein Kegel nach vorn"],
          ["Sonar", "gelbe Umrisse, auch hinter dem Licht"],
        ],
        body: [
          "In den tiefen Gewässern sieht man ohne Scheinwerfer kaum mehr als das eigene Boot. Mit ihm hat man einen Kegel - nicht viel, aber genug, um zu lenken.",
          "Das Sonar ist kein zweites Licht. Es sagt, **wo** etwas ist, und nichts darüber, wie es aussieht: Fels, Minen und alles, was lebt, stehen als gelbe Umrisse im Schwarzen. Was leuchtet, sieht man ohnehin.",
        ],
      },
      {
        id: "hull",
        title: "Hülle und Luft",
        icon: "\u{1FAE7}",
        facts: [
          ["Hülle", "eine je Stufe Rüstung"],
          ["Luft", "70 Sekunden, je Stufe 20 mehr"],
        ],
        body: [
          "Jeder Treffer kostet eine Hülle und macht dich für gut eine Sekunde unverwundbar - ohne diese Sekunde nähme ein einziger Fels gleich alle Stufen auf einmal.",
          "Die Luft läuft, solange du unten bist. In den ersten drei Gewässern füllt Auftauchen den Vorrat wieder auf; ab der Höhle ist über dir Fels, und dann ist der Tank, was du dabeihast.",
        ],
      },
    ],
  },
];
