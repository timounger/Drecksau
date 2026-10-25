/**
 * The rules sheet of Murdle.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const MURDLE_RULES: GameRules = {
  title: "Murdle",
  players: "Allein, oder online gemeinsam zu zweit bis zu sechst",
  intro:
    "Ein Mord, eine Handvoll Verdächtiger, Waffen und Orte - und manchmal Motive. Jede Person hatte genau eine Waffe, war an genau einem Ort und hatte genau ein Motiv. Finde mit den Hinweisen heraus, wer was wo hatte. Dann klage an: Wer? Womit? Wo? (Warum?)",
  sections: [
    {
      title: "Die Regeln",
      list: [
        "Jede Waffe, jeder Ort und jedes Motiv gehört zu genau einer Person.",
        'Jeder Hinweis stimmt. Was er meint, steht oft in den Beschreibungen: "rote Samtsitze" gibt es im Vorführraum, Logikbücher trägt man im schweren Rucksack.',
        "Der fett gedruckte letzte Hinweis sagt, wo die Leiche lag. Wer dort war, ist der Mörder.",
        'Aussagen (ab "Okkultes Medium"): Der Mörder lügt, alle anderen sagen die Wahrheit. Gibt es keinen Leichenfund, ist der einzige Lügner der Mörder.',
        "Beweismittel wie Logicos Detektivkoffer stehen beim Fall, wenn ein Hinweis sie braucht.",
      ],
    },
    {
      title: "Das Deduktionsraster",
      list: [
        "Oben stehen die Verdächtigen, (die Motive) und die Orte, links die Waffen, die Orte und (die Motive) - wie im Buch. Jedes Feld ist ein mögliches Paar.",
        "Ein Tipp auf ein Feld setzt ein Kreuz (geht nicht), ein zweiter einen Haken (stimmt), ein dritter macht es wieder leer.",
        "Ein Haken streicht den Rest seiner Zeile und Spalte im selben Block aus. Das lässt sich unter dem Raster abschalten.",
        "Das Raster prüft nichts - es ist dein Notizblock.",
      ],
    },
    {
      title: "Anklagen",
      list: [
        "Wähle Täter, Waffe und Ort (und Motiv) und drücke Anklagen. Stimmt alles, ist der Fall gelöst und die Zeit wird gespeichert.",
        'Eine falsche Anklage sagt nur "falsch" - nicht, was daran falsch war.',
        "Ein Tipp zeigt den nächsten Schritt - den Hinweis aus dem Buch, wo es einen gibt, dann den Lösungsweg. Wer gar nicht weiterkommt, kann sich die Lösung zeigen lassen; dann zählt der Fall nicht als gelöst.",
        '"Tipp" eine Sekunde gedrückt halten zeigt alle Tipps auf einmal und füllt das ganze Raster richtig aus und trägt die Anklage ein - in einem Zug, den "Rückgängig" wieder zurücknimmt. Online gilt das für alle, und Rückgängig gibt es dort nicht. Anklagen muss man selbst; der Fall zählt dann wie jeder andere als gelöst.',
        'Schließt ein Tipp auf bestimmte Paare, steht "▶ Ausführen" daneben: Ein Klick auf den Tipp setzt genau diese Haken und Kreuze, in einem Zug.',
      ],
    },
    {
      title: "Gemeinsam online",
      list: [
        'Unter "Gemeinsam online" lösen 2 bis 6 Ermittler einen Fall zusammen: Der Host erstellt einen Raum, teilt den Code, wählt den Fall und öffnet ihn.',
        "Alle schreiben gleichzeitig im selben Deduktionsraster und füllen dieselbe Anklage aus; Tipps und die Lösung sehen alle. Ob ein Haken automatisch ausstreicht, stellt jede:r für sich ein.",
        "Anklagen kann jede:r. Stimmt sie, ist der Fall für alle gelöst, und der Host öffnet den nächsten. Die Uhr läuft, seit der Host den Fall geöffnet hat.",
        "Online-Fälle zählen nicht in die Statistik dieses Browsers.",
      ],
    },
  ],
  note: "Nach den Fällen aus Murdle: Volume 1 von G. T. Karber - die Fälle der Leseprobe, ins Deutsche übertragen.",
};
