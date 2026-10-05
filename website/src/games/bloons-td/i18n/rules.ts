/**
 * Das Regelblatt von Bloons TD.
 *
 * @module
 * @remarks
 * Die Tabellen stehen nicht hier, sondern kommen aus denselben Tabellen, aus
 * denen die Engine rechnet ({@link ../engine/towers}, {@link ../engine/bloons}).
 * Damit kann im Regelblatt nichts stehen, was es nicht gibt - der häufigste
 * Fehler in Spielregeln ist ein Preis, der seit drei Versionen ein anderer ist.
 */
import type { GameRules } from "@/components/game-rules";
import {
  ALL_LIVES,
  BLOONS,
  BLOON_ORDER,
  type BloonKind,
} from "@/games/bloons-td/engine/bloons";
import { GROUPS, TOWERS, TOWER_ORDER } from "@/games/bloons-td/engine/towers";
import { MOST, UPGRADES } from "@/games/bloons-td/engine/upgrades";
import {
  DIFFICULTIES,
  DIFFICULTY_ORDER,
} from "@/games/bloons-td/engine/difficulty";
import { MAPS, MAP_ORDER } from "@/games/bloons-td/engine/map";
import { UNLOCK } from "@/games/bloons-td/engine/progress";

/** Hundert, für Prozent. */
const PERCENT = 100;

/** Wie eine Schadensart auf Deutsch heißt. */
const HARM = {
  sharp: "spitz",
  explosion: "Sprengstoff",
  ice: "Eis",
  glue: "Klebstoff",
  energy: "Energie",
  normal: "alles",
} as const;

/** Was der Regelknopf aufmacht. */
export const BLOONS_RULES: GameRules = {
  title: "Bloons TD",
  players: "Allein",
  intro:
    "Ballons laufen über einen Weg quer durch die Wiese. Du baust Affen daneben, die sie zerstechen, bevor sie am anderen Ende hinauslaufen. Jede Runde kommen mehr, und jede neue Sorte kann etwas, das die vorige nicht konnte.",
  sections: [
    {
      title: "Karten und Schwierigkeit",
      table: [
        ["Schwierigkeit", "Leben", "Preise", "Ziel"],
        ...DIFFICULTY_ORDER.map((one) => [
          DIFFICULTIES[one].name,
          String(DIFFICULTIES[one].lives),
          `${Math.round(DIFFICULTIES[one].price * PERCENT)} %`,
          `Runde ${DIFFICULTIES[one].goal}`,
        ]),
      ],
      list: [
        `Es gibt ${MAP_ORDER.length} Karten: ${MAP_ORDER.map((one) => MAPS[one].name).join(", ")}. Je kürzer der Weg, desto schwerer.`,
        "Jede Karte gibt es auf Leicht, Mittel und Schwer. Wer die Zielrunde übersteht, hat gewonnen und bekommt die Medaille - danach kann er weiterspielen, solange es hält, oder zurück zur Kartenauswahl.",
        "Du fängst immer mit $650 an.",
      ],
    },
    {
      title: "Affen freischalten",
      list: [
        "Am Anfang gibt es nur den Wurfpfeilaffen. Jede überstandene Runde bringt Erfahrung - je später die Runde und je schwerer, desto mehr -, und mit jedem Level kommt ein Affe dazu.",
        `Die Reihenfolge ist die des Vorbilds: ${Object.entries(UNLOCK)
          .sort((a, b) => a[1] - b[1])
          .map(
            ([kind, level]) =>
              `${TOWERS[kind as keyof typeof TOWERS].name} (${level})`,
          )
          .join(", ")}.`,
        "Fortschritt und Medaillen speichert dein Browser. In der Kartenübersicht lässt sich beides zurücksetzen - dann fängst du wieder mit dem Wurfpfeilaffen an.",
      ],
    },
    {
      title: "Der Ablauf",
      list: [
        "Zwischen den Runden baust du: Affe im Laden wählen, auf ein Wiesenfeld klicken. U-Boot und Boot gehören in den Teich, auf der Straße geht nichts.",
        "Dann schickst du die nächste Welle los. Sie läuft, bis kein Ballon mehr da ist - weder in der Luft noch im Wartebereich.",
        "Jede zerstochene Schicht bringt einen Dollar, jede überstandene Runde eine Prämie. Je später die Runde, desto höher. Bananenplantagen zahlen am Rundenende noch etwas dazu.",
        "Was durchkommt, kostet Leben - und zwar so viele, wie in dem Ballon noch steckten. Bei null ist die Partie vorbei.",
        "Dann zeigt die Bestenliste die zehn, die am längsten durchgehalten haben. Wer mit seiner Runde einen Platz schafft, trägt dort seinen Namen ein - jeder Name einmal, mit seiner besten Partie. Partien, in denen geschummelt wurde, zählen nicht. Die Liste steht auch auf der Statistikseite.",
      ],
    },
    {
      title: "Die Affen",
      table: [
        ["Affe", "Gruppe", "Preis", "Schaden", "Wofür"],
        ...TOWER_ORDER.map((kind) => [
          TOWERS[kind].name,
          GROUPS.find((one) => one.group === TOWERS[kind].group)?.name ?? "",
          `$${TOWERS[kind].cost}`,
          TOWERS[kind].shooting === "none" ? "-" : HARM[TOWERS[kind].harm],
          TOWERS[kind].note,
        ]),
      ],
      body: [
        "Vier Gruppen wie im Vorbild: Primär, Militär, Magie und Unterstützung.",
        'Wichtiger als der Schaden ist die Schadensart: Spitzes prallt am Bleiballon ab, Sprengstoff am schwarzen, Eis am weißen, Energie (Magie, Laser) am lila. Gegen "alles" ist keine Sorte gefeit. Ein Feld aus lauter gleichen Affen steht irgendwann still.',
        "Zwei von ihnen zerstören gar nichts: Der Eisaffe hält auf, der Klebstoffschütze bremst. Beide lernen es erst durch eine Verbesserung (Deep Freeze, Corrosive Glue) - bis dahin brauchen sie jemanden neben sich, der zusticht.",
        "Jeder zielt zunächst auf den ersten Ballon in Reichweite. Wer einen fertigen Affen antippt, kann umstellen: Erster (der am weitesten ist), Letzter (der gerade erst kam) oder Stärkster (der mit den meisten Treffern darin). Das kostet nichts und geht auch mitten in der Welle. Der Klebstoffschütze nimmt dabei immer nur Ballons, an denen noch nichts klebt.",
        "Der Eisaffe wirft nie: Alle 2,2 Sekunden geht in seinem Umkreis eine Frostwelle los, ob ein Ballon in der Nähe ist oder nicht. Wen sie erfasst, der steht eine Sekunde lang still. Der Bombenwerfer trifft mit einem Knall mehrere Ballons auf einmal, lädt dafür am längsten nach, und der Bumerang trifft auf dem Rückweg ein zweites Mal.",
        "Scharfschütze und Mörser reichen über die ganze Karte. Der Scharfschuss trifft sofort, die Mörsergranate erst eine Sekunde später dort, wo der Ballon dann sein müsste.",
        "Der Hubschrauber fliegt dem vordersten Ballon in der Nähe seines Landeplatzes hinterher, das Flugzeug kreist um sein Feld und wirft dabei ununterbrochen Pfeile in alle Richtungen.",
        "Die Nagelfabrik legt Nagelhaufen auf die Straße, die liegen bleiben, bis genug Ballons darübergelaufen sind. Der Stachelexperte rollt Stachelkugeln die Straße hinunter, den Ballons entgegen.",
        "Das Affendorf schießt nicht: Alle Affen in seiner Reichweite reichen weiter und lassen sich mit dem Ausbau schneller und schärfer machen. Mehrere Dörfer stapeln sich nicht, es zählt das beste. Der Alchemist kann mit Berserker Brew jedem Wurf einen Trank für einen Nachbarn mitgeben.",
      ],
    },
    {
      title: "Verbesserungen",
      table: [
        ["Affe", "Säule 1", "Säule 2"],
        ...TOWER_ORDER.map((kind) => [
          TOWERS[kind].name,
          UPGRADES[kind].one.map((one) => one.name).join(", "),
          UPGRADES[kind].two.map((one) => one.name).join(", "),
        ]),
      ],
      list: [
        `Jeder Turm hat zwei Säulen mit je ${MOST} Stufen. Angetippter Affe, dann die Säule anklicken - das geht auch mitten in der Welle.`,
        "Eine Stufe kommt zur vorigen dazu: Wer beide Stufen einer Säule kauft, hat beide Wirkungen.",
        "Beim Verkauf bekommst du vier Fünftel von allem zurück, auch von den Verbesserungen.",
      ],
    },
    {
      title: "Die Ballons",
      table: [
        ["Sorte", "Treffer", "Darin", "Besonderheit"],
        ...BLOON_ORDER.map((kind) => [
          BLOONS[kind].name,
          // Ein Boss enthält nichts; seine Zahl ist seine Hülle.
          String(
            BLOONS[kind].rbe === ALL_LIVES
              ? BLOONS[kind].hull
              : BLOONS[kind].rbe,
          ),
          BLOONS[kind].inside.length === 0
            ? "nichts"
            : BLOONS[kind].inside.map((one) => BLOONS[one].name).join(" + "),
          traitsOf(kind),
        ]),
      ],
      body: [
        "Die Zahl ist nicht die Lebenspunktezahl, sondern die Summe aus allem, was in dem Ballon steckt: Ein schwarzer enthält zwei rosa, also elf Treffer insgesamt.",
        "Deshalb wird ein Spielfeld nicht dadurch leichter, dass man die Hülle schnell aufsticht - dahinter kommt dann alles auf einmal.",
        "Die Sorten kommen in denselben Runden zum ersten Mal wie im Vorbild: Schwarz 20, Weiß 22, Zebra 24, Lila 25, Regenbogen 26, Blei 28, Keramik 38.",
        "Die Zeppeline ebenso: M.O.A.B. ab Runde 40, B.F.B. ab 60, Z.O.M.G. ab 80, D.D.T. ab 90 und B.A.D. ab 100. Sie lassen sich nicht einfrieren und nicht zurückwehen, und über jedem hängt ein Lebensbalken.",
      ],
    },
    {
      title: "Eigenschaften",
      list: [
        "Getarnt (Tarnflecken, halb durchsichtig): Nur wer Tarnung sieht, zielt darauf - der Wurfpfeilaffe mit Enhanced Eyesight (die frühe Antwort, ab Level 1), der Ninja von Anfang an, der Scharfschütze mit Night Vision Goggles, der Zauberer mit Guided Magic und jeder Affe neben einem Affendorf mit Radar Scanner. Nagelhaufen, Stachelkugeln, Flugzeug-Ringe und Knalle treffen sie trotzdem.",
        "Nachwachsend (grünes Plus): bekommt alle zweieinhalb Sekunden eine Schicht zurück, aber nie mehr, als er am Anfang hatte.",
        "Verstärkt (Metallbänder): Blei, Keramik und Zeppeline halten doppelt so viel aus.",
        "Mit Schild (blauer Ring): Ein Schild aus der halben Hülle fängt zuerst alles ab.",
        "Nachwachsend kommt zum ersten Mal in Runde 17, getarnt in Runde 24 - wie im Vorbild. Mit Schild und verstärkt kommen erst nach Runde 40 dazu. Was aus einem Ballon herauskommt, erbt Tarnung, Nachwachsen und Verstärkung - den Schild nicht.",
      ],
    },
    {
      title: "Bosse",
      list: [
        "Bosse kommen wie im Vorbild nur in der Boss-Herausforderung, nie im normalen Spiel. Die wählst du in der Kartenübersicht unter der Karte: einen Boss aussuchen, gespielt wird auf Mittel.",
        "Der Boss kommt in fünf Stufen in den Runden 40, 60, 80, 100 und 120, jedes Mal mit mehr Hülle. Wer Runde 120 übersteht, hat die Herausforderung geschafft.",
        "Kommt ein Boss durch, ist die Partie verloren. Einfrieren, bremsen und zurückwehen wirken bei keinem.",
        "Vortex lähmt alle sechs Sekunden die Türme in seiner Nähe für zwei Sekunden.",
        "Bloonarius spuckt alle vier Sekunden drei Keramikballons aus.",
        "Dreadbloon legt sich alle neun Sekunden einen Steinpanzer zu, der gegen eine Schadensart schützt - der Reihe nach spitz, Sprengstoff, Energie. Ist der Panzer zerstört, wirkt wieder alles.",
        "Lych heilt sich alle fünf Sekunden um 3 % und stiehlt dabei jedem Turm den Trank des Alchemisten - für jeden heilt er 1 % mehr, aber nie mehr als 12 % auf einmal. Gegen ihn hilft viel Schaden in kurzer Zeit, nicht ein Feld voller Tränke.",
        "Phayze ist getarnt und verschwindet alle sechs Sekunden für zwei Sekunden ganz: Dann trifft ihn nichts.",
        "Blastapopoulos wirft alle sieben Sekunden einen Meteor auf einen Turm, der danach vier Sekunden nicht schießt.",
        "Ein betäubter Turm hat kreisende Sterne über dem Kopf.",
      ],
    },
    {
      title: "Steuerung",
      list: [
        "Affen im Laden auswählen, auf eine Wiese klicken - dort steht er.",
        "Ein Klick auf einen fertigen Affen zeigt seine Reichweite; daneben steht, was er beim Verkauf noch einbringt.",
        "Zwei Gangarten: Normal und Schnell (dreifach). Gebaut wird in beiden.",
        "Im Vollbild sind Anzeige, Tempo, Feld und Laden dabei; oben links auf dem Feld geht es wieder hinaus.",
        "Der Pausenknopf oben rechts auf dem Feld hält das Spiel an und öffnet ein Menü: weiterspielen oder neu starten.",
        "Auto-Start schickt die nächste Welle von selbst los, sofort nach dem Ende der vorigen.",
      ],
    },
  ],
  note: "Nachgebaut nach Bloons Tower Defense. Die Helden und die höheren Stufen der Bosse stehen noch aus.",
};

/** Was einer Sorte außer ihrer Hülle anzusehen ist, für die Ballontabelle. */
function traitsOf(kind: BloonKind): string {
  const breed = BLOONS[kind];
  const marks: string[] = [];
  if (breed.immune.length > 0) {
    marks.push(
      `immun gegen ${breed.immune.map((one) => HARM[one]).join(" und ")}`,
    );
  }
  if (breed.camo) {
    marks.push("getarnt");
  }
  if (breed.class === "blimp") {
    marks.push("Zeppelin");
  }
  if (breed.class === "boss") {
    marks.push("Boss, kostet alle Leben");
  }
  if (!breed.costly) {
    marks.push("kostet keine Leben");
  }
  return marks.length === 0 ? "-" : marks.join(", ");
}
