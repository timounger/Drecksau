/**
 * The rules sheet of the Sherlock Holmes puzzle collection.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const SHERLOCK_RULES: GameRules = {
  title: "Sherlock Holmes - Rätselsammlung",
  players: "Allein - oder gemeinsam am selben Bildschirm",
  intro:
    "Eine Sammlung von Rätseln rund um Sherlock Holmes und Dr. Watson: Logik, Zahlen, Wörter, Bilder und kleine Kriminalfälle. Lies das Rätsel, denk nach, und prüfe dann deine Antwort mit der Lösung.",
  sections: [
    {
      title: "Die Rätsel",
      list: [
        "Das Buch hat vier Teile, vom leichtesten zum schwersten: Elementar, Einfach, Knifflig und Teuflisch. Die Lupen neben dem Namen zeigen, wie schwer ein Teil ist.",
        "Manche Rätsel brauchen ein Bild - einen Zettel mit Buchstaben, eine Skizze. Es steht direkt beim Text.",
        "Englische Worträtsel sind markiert: Wo es um englische Wörter oder Buchstaben geht, bleiben diese englisch, der Rest ist deutsch.",
      ],
    },
    {
      title: "Lösen",
      list: [
        '"Lösung ansehen" zeigt die Lösung sofort, "Lösung ausblenden" verbirgt sie wieder.',
        'Wer richtig lag, drückt "Gelöst". Ein zweiter Druck nimmt das wieder zurück.',
        "Die Uhr läuft, solange das Rätsel offen und nicht gelöst ist.",
        '"🔊 Vorlesen" liest Titel, Text und - bei Bildern - die Buchstabenreihen vor, Buchstabe für Buchstabe. Währenddessen gibt es Pause, Weiter und Stopp; ist die Lösung offen, liest "Lösung vorlesen" sie vor. Das gesprochene Wort ist gelb hinterlegt. Ein Klick auf ein Wort setzt den Startpunkt ("Ab hier vorlesen"), während des Lesens springt er dorthin. Unter "Vorlese-Stimme" lassen sich die deutsche Stimme und das Tempo wählen.',
        '"Drucken / PDF" öffnet das Rätsel als Druckseite, die Lösung steht auf einer eigenen Seite dahinter.',
      ],
    },
    {
      title: "Auswahl und Statistik",
      list: [
        "Die Liste lässt sich nach Teilen filtern und durchsuchen - nach deutschem Titel, englischem Originaltitel und Text. Gelöste Rätsel lassen sich ausblenden.",
        "Die Statistik zeigt, wie viele Rätsel je Teil gelöst sind und bei wie vielen die Lösung angesehen wurde.",
      ],
    },
  ],
  note: "Nach einem Rätselbuch mit Sherlock Holmes - die Rätsel ins Deutsche übertragen.",
};
