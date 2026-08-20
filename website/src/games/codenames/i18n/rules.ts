/**
 * The Codenames rules, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const CN_RULES: GameRules = {
  title: "Codenames",
  players: "ab 4 Spielern (online), allein gegen den Computer",
  intro:
    "25 Wörter liegen auf dem Tisch. Jedes Team hat Agenten darunter - aber nur die beiden Geheimdienstchefs wissen, welche. Sie geben Hinweise aus einem Wort und einer Zahl; ihre Teams raten. Wer zuerst alle eigenen Agenten gefunden hat, gewinnt. Wer den Attentäter erwischt, verliert sofort.",
  sections: [
    {
      title: "Aufbau",
      list: [
        "25 Wörter im 5x5-Raster.",
        "Der Schlüssel sagt, wem welches Wort gehört - nur die Geheimdienstchefs sehen ihn.",
        "9 Wörter für das beginnende Team, 8 für das andere, 7 Unbeteiligte, 1 Attentäter.",
      ],
    },
    {
      title: "Hinweis geben",
      body: [
        "Der Geheimdienstchef sagt ein Wort und eine Zahl. Die Zahl sagt, wie viele Wörter auf dem Tisch dazu passen.",
        "Der Hinweis muss sich auf die Bedeutung beziehen - nicht auf Buchstaben oder die Position. Und er darf kein Wort sein, das noch offen auf dem Tisch liegt.",
      ],
    },
    {
      title: "Raten",
      table: [
        ["Getroffen", "Was passiert"],
        ["Eigener Agent", "Richtig - ihr dürft weiterraten"],
        ["Unbeteiligter", "Zug vorbei"],
        ["Agent des anderen Teams", "Zug vorbei - und die sind weiter"],
        ["Attentäter", "Ihr verliert sofort"],
      ],
      body: [
        "Mindestens einmal muss geraten werden, höchstens Zahl + 1 Mal. Der eine Extra-Tipp ist für ein Wort aus einer früheren Runde gedacht.",
        "Aufhören ist nach dem ersten Tipp jederzeit erlaubt.",
      ],
    },
    {
      title: "Die Zahl 0",
      body: [
        '0 heißt „keines unserer Wörter passt dazu". Dann fällt die Obergrenze weg und ihr dürft so oft raten, wie ihr euch traut - mindestens aber einmal.',
      ],
    },
    {
      title: "Spielende",
      body: [
        "Sobald ein Team alle eigenen Wörter abgedeckt hat, gewinnt es - auch dann, wenn das andere Team das letzte Wort für es aufgedeckt hat.",
      ],
    },
    {
      title: "Allein gegen den Computer",
      body: [
        'Du bist Ermittler, beide Geheimdienstchefs sind Computer. Ein Hinweis ist ein Einfall, und den hat eine Maschine ohne Sprachgefühl nicht - deshalb nennt sie Oberbegriffe: „Tier: 3".',
        "Die Aufgabe bleibt dieselbe: Auf dem Raster liegen fünf Tiere, drei davon sind deine - und eines könnte der Attentäter sein.",
        "Der Computer-Ermittler der Gegenseite kennt den Schlüssel genauso wenig wie du.",
      ],
    },
    {
      title: "Online",
      body: [
        "Ab vier Spielern, und da tippen Menschen ihre Hinweise frei ein. Die Rollen werden in Beitrittsreihenfolge verteilt: abwechselnd Rot und Blau, und der jeweils Erste eines Teams ist sein Geheimdienstchef.",
      ],
    },
  ],
  note: "Spiel von Vlaada Chvátil, Czech Games Edition 2015. Die 400 Wörter der Originalausgabe sind geschützt und englisch; hier wird mit einer eigenen deutschen Liste gespielt.",
};
