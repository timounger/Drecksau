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
import { START } from "@/games/bloons-td/engine/types";

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
      title: "Der Ablauf",
      list: [
        `Du fängst mit $${START.money} und ${START.lives} Leben an.`,
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
        "Jeder zielt auf den vordersten Ballon in Reichweite - außer dem Klebstoffschützen: Der sucht sich den vordersten, an dem noch nichts klebt, und schweigt, wenn alle kleben.",
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
        "Der goldene Ballon kommt ab Runde 27 alle zehn Runden einmal. Er kostet nichts, wenn er durchkommt, bringt aber $300, wenn man ihn erwischt.",
        "Die Zeppeline kommen ab Runde 24 (M.O.A.B.), 32 (D.D.T.), 36 (B.F.B.), 50 (Z.O.M.G.) und 70 (B.A.D.). Sie lassen sich nicht einfrieren und nicht zurückwehen, und über jedem hängt ein Lebensbalken.",
      ],
    },
    {
      title: "Eigenschaften",
      list: [
        "Getarnt (Tarnflecken, halb durchsichtig): Nur wer Tarnung sieht, zielt darauf - der Ninja von Anfang an, der Scharfschütze mit Night Vision Goggles, der Zauberer mit Guided Magic und jeder Affe neben einem Affendorf mit Radar Scanner. Nagelhaufen, Stachelkugeln, Flugzeug-Ringe und Knalle treffen sie trotzdem.",
        "Nachwachsend (grünes Plus): bekommt alle zweieinhalb Sekunden eine Schicht zurück, aber nie mehr, als er am Anfang hatte.",
        "Verstärkt (Metallbänder): Blei, Keramik und Zeppeline halten doppelt so viel aus.",
        "Mit Schild (blauer Ring): Ein Schild aus der halben Hülle fängt zuerst alles ab.",
        "Jede Eigenschaft taucht in den ersten zwanzig Runden einmal in kleiner Zahl auf, danach werden sie unter alles gemischt. Was aus einem Ballon herauskommt, erbt Tarnung, Nachwachsen und Verstärkung - den Schild nicht.",
      ],
    },
    {
      title: "Bosse",
      list: [
        "Ab Runde 30 kommt alle zehn Runden ein Boss: Bloonarius, Vortex, Lych, Dreadbloon, Phayze, Blastapopoulos - danach von vorn, jedes Mal mit drei Vierteln mehr Hülle.",
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
