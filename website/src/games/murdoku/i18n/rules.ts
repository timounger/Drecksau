/**
 * The rules sheet of Murdoku.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const MURDOKU_RULES: GameRules = {
  title: "Murdoku",
  players: "Allein, oder online gemeinsam zu zweit bis zu sechst",
  intro:
    "Ein Verbrechen, ein Lageplan und eine Handvoll Verdächtiger. Jeder hat einen Hinweis, wo er war. Finde für jede Person ihr Feld - dann weißt du, wer mit dem Opfer allein war. Das ist der Täter.",
  sections: [
    {
      title: "Die Regeln",
      list: [
        "In jeder Reihe und in jeder Spalte steht genau eine Person.",
        "Personen stehen auf freien Feldern, im Wasser, in einem Haus oder auf einem Boot - nie auf einem Baum, einem Strauch, einem Felsen, einem Kaktus oder einem Tier.",
        "Neben heißt: links, rechts, darüber oder darunter, und im selben Bereich. Ein Haus auf der anderen Seite des Wassers ist nicht neben dir.",
        "Jeder Hinweis stimmt.",
        "Der Täter war allein mit dem Opfer in einem Bereich - also eine Insel oder das Meer, in dem sonst niemand war.",
      ],
    },
    {
      title: "So wird gespielt",
      list: [
        "Wähle eine verdächtige Person und tippe auf die Felder, auf denen sie gewesen sein könnte: Dort steht dann ihr Buchstabe klein - eine Notiz, noch keine Entscheidung. Noch einmal tippen nimmt sie weg.",
        "Bist du sicher, halte das Feld gedrückt: Die Person steht dann fest, ihre anderen Notizen verschwinden, und ihre ganze Reihe und Spalte wird ausgekreuzt. Ein Feld mit nur einer Notiz lässt sich auch ohne gewählte Person gedrückt halten.",
        "Ohne gewählte Person setzt ein Tipp aufs Feld ein Kreuz - für Felder, die du ausgeschlossen hast. Eine fest gesetzte Person antippen nimmt sie wieder herunter.",
        "Mit der Maus: Ein Rechtsklick auf ein Feld entfernt alle Notizen und das Kreuz darin. Rechts gedrückt halten setzt niemanden fest.",
        "Ein Haken am Hinweis heißt: Er passt zu dem Feld, auf dem die Person steht. Ein rotes Kreuz: Er passt nicht.",
        "Wenn du weißt, wer es war, klage an. Ein Tipp zeigt den nächsten Schritt des Lösungswegs - keine Positionen. Wer gar nicht weiterkommt, kann sich die Lösung zeigen lassen.",
      ],
    },
  ],
  note: 'Nach den Rätseln von Murdoku von Manuel Garand (murdoku.com). Der erste Fall ist sein kostenloser Probefall "Summer Isles".',
};
