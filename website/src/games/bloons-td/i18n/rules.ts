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
import { BLOONS, BLOON_ORDER } from "@/games/bloons-td/engine/bloons";
import { TOWERS, TOWER_ORDER } from "@/games/bloons-td/engine/towers";
import { MOST, UPGRADES } from "@/games/bloons-td/engine/upgrades";
import { START } from "@/games/bloons-td/engine/types";

/** Wie eine Schadensart auf Deutsch heißt. */
const HARM = {
  sharp: "spitz",
  explosion: "Sprengstoff",
  ice: "Eis",
  glue: "Klebstoff",
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
        "Zwischen den Runden baust du: Affe im Laden wählen, auf ein Wiesenfeld klicken. Auf der Straße geht nichts.",
        "Dann schickst du die nächste Welle los. Sie läuft, bis kein Ballon mehr da ist - weder in der Luft noch im Wartebereich.",
        "Jede zerstochene Schicht bringt einen Dollar, jede überstandene Runde eine Prämie. Je später die Runde, desto höher.",
        "Was durchkommt, kostet Leben - und zwar so viele, wie in dem Ballon noch steckten. Bei null ist die Partie vorbei.",
      ],
    },
    {
      title: "Die Affen",
      table: [
        ["Affe", "Preis", "Schaden", "Wofür"],
        ...TOWER_ORDER.map((kind) => [
          TOWERS[kind].name,
          `$${TOWERS[kind].cost}`,
          HARM[TOWERS[kind].harm],
          TOWERS[kind].note,
        ]),
      ],
      body: [
        "Es sind die sechs Primär-Affen. Militär, Magie und Unterstützung gibt es im Vorbild - hier noch nicht.",
        "Wichtiger als der Schaden ist die Schadensart: Spitzes prallt am Bleiballon ab, Sprengstoff am schwarzen, Eis am weißen. Ein Feld aus sechs gleichen Affen steht irgendwann still.",
        "Zwei von ihnen zerstören gar nichts: Der Eisaffe hält auf, der Klebstoffschütze bremst. Beide lernen es erst durch eine Verbesserung (Deep Freeze, Corrosive Glue) - bis dahin brauchen sie jemanden neben sich, der zusticht.",
        "Jeder zielt auf den vordersten Ballon in Reichweite - außer dem Klebstoffschützen: Der sucht sich den vordersten, an dem noch nichts klebt, und schweigt, wenn alle kleben.",
        "Der Eisaffe wirft nie: Alle 2,2 Sekunden geht in seinem Umkreis eine Frostwelle los, ob ein Ballon in der Nähe ist oder nicht. Wen sie erfasst, der steht eine Sekunde lang still. Der Bombenwerfer trifft mit einem Knall mehrere Ballons auf einmal, lädt dafür am längsten nach, und der Bumerang trifft auf dem Rückweg ein zweites Mal.",
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
          String(BLOONS[kind].rbe),
          BLOONS[kind].inside.length === 0
            ? "nichts"
            : BLOONS[kind].inside.map((one) => BLOONS[one].name).join(" + "),
          BLOONS[kind].immune.length === 0
            ? "-"
            : `immun gegen ${BLOONS[kind].immune.map((one) => HARM[one]).join(" und ")}`,
        ]),
      ],
      body: [
        "Die Zahl ist nicht die Lebenspunktezahl, sondern die Summe aus allem, was in dem Ballon steckt: Ein schwarzer enthält zwei rosa, also elf Treffer insgesamt.",
        "Deshalb wird ein Spielfeld nicht dadurch leichter, dass man die Hülle schnell aufsticht - dahinter kommt dann alles auf einmal.",
      ],
    },
    {
      title: "Steuerung",
      list: [
        "Affen im Laden auswählen, auf eine Wiese klicken - dort steht er.",
        "Ein Klick auf einen fertigen Affen zeigt seine Reichweite; daneben steht, was er beim Verkauf noch einbringt.",
        "Drei Gangarten: Normal, Schnell (dreifach) und Turbo (achtfach). Gebaut wird in jeder davon.",
        "Auto-Start schickt die nächste Welle von selbst los, anderthalb Sekunden nach dem Ende der vorigen.",
        "Der Knopf +$10.000 ist zum Ausprobieren da - er schummelt, und er sagt es auch.",
      ],
    },
  ],
  note: "Nachgebaut nach Bloons Tower Defense. Die MOAB-Klasse, die Zusatzeigenschaften (getarnt, nachwachsend, verstärkt) und die Boss-Ballons stehen noch aus - hier laufen die zwölf Standardsorten.",
};
