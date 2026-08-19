/**
 * The RV There Yet? manual, as shown in the game.
 *
 * @module
 * @remarks
 * A manual rather than rules: this is a driving game, and what a player needs
 * looked up mid-climb is which key does what and how the gearbox behaves - not
 * a definition of winning.
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const RV_RULES: GameRules = {
  title: "RV There Yet?",
  players: "Allein oder zu zweit im Koop-Online",
  intro:
    "Ein Seitenansicht-Fahrspiel. Auf der x-Achse läuft die Strecke, auf der y-Achse das Gelände mit Bergen und Tälern. Die Aufgabe ist simpel und selten einfach: Bring das Wohnmobil nach rechts bis zur Zielflagge.",
  sections: [
    {
      title: "Steuerung",
      table: [
        ["Was", "Wie"],
        ["Fahren", "W vorwärts, S rückwärts"],
        ["Gänge", "1 2 3 4 5 einlegen, N Leerlauf"],
        ["Zu Fuß", "A D oder Pfeiltasten, Umschalt zum Rennen"],
        ["Aus- und einsteigen", "E - nur wenn das Wohnmobil steht"],
        ["Springen", "Leertaste, zweimal kurz hintereinander doppelt so hoch"],
        ["Aufs Dach klettern", "Leertaste an der Leiter hinten"],
        ["Gegenstand aufheben", "F, zu Fuß und direkt davor"],
        ["Arbeiten (hämmern, tanken, sprühen)", "F halten"],
        ["Seil an- und abmachen", "F, zu Fuß direkt am Baum"],
        ["Seilwinde", "W zieht ein, S gibt aus - nur zu Fuß"],
        ["Handbremse", "Leertaste halten, im Fahrerhaus"],
      ],
      body: ["Auf dem Handy gibt es dafür Knöpfe auf dem Bildschirm."],
    },
    {
      title: "Das Getriebe",
      body: [
        "Fünf Gänge, Leerlauf und Rückwärts. Welche Richtung es geht, entscheidet der Gang, nicht das Pedal.",
        "Der Handel ist der, den jedes Getriebe macht: Ein kleiner Gang zieht hart und geht früh die Puste aus, ein großer zieht lasch und läuft weiter. Im fünften kommt man keinen Hügel hoch, im ersten auf gerader Strecke nicht vom Fleck.",
      ],
      table: [
        ["Gang", "zieht", "läuft bis"],
        ["R", "stark", "4,5 m/s rückwärts"],
        ["N", "gar nicht", "-"],
        ["1", "am stärksten", "4,5 m/s"],
        ["2", "", "7,5 m/s"],
        ["3", "", "10,5 m/s"],
        ["4", "", "13,5 m/s"],
        ["5", "am schwächsten", "16,5 m/s"],
      ],
    },
    {
      title: "Was das Getriebe sonst noch tut",
      list: [
        "Jedes Pedal bremst erst und fährt dann. Drückst du rückwärts, während es noch vorwärts rollt, wirst du langsamer - genau wie im Auto.",
        "Steht das Fahrzeug, legt sich der Rückwärtsgang von selbst ein. Die Vorwärtsgänge bleiben deine Sache: W allein tut nichts, wenn der Rückwärtsgang steckt.",
        "Leerlauf zieht nichts. Am Hang gehört das Fahrzeug damit der Schwerkraft allein.",
        "Geschaltet wird nur aus dem Fahrerhaus - der Schalthebel steckt nicht in der Hosentasche.",
      ],
    },
    {
      title: "Die Seilwinde",
      body: [
        "An einer echten Wand hilft das Getriebe nicht: Dort ist nicht die Kraft zu klein, sondern die Haftung null. Die Wand bleibt Sache der Winde.",
        "Hängt das Seil, wird das Fahrzeug von außen bedient - der Handsender liegt in der Hand, und Hände sind nicht hinter einer Windschutzscheibe. Draußen ist ohnehin der einzige Ort, von dem aus man sieht, was das Seil tut.",
        "Ausgeben ist kein Zierrat: Am Berg ist herunterlassen so nützlich wie heraufziehen. Einziehen kostet Sprit, ausgeben ist umsonst.",
      ],
    },
    {
      title: "Handbremse und Seil",
      body: [
        "Solange das Seil hängt, ist die Handbremse gelöst - das Wohnmobil hängt am Seil, nicht an der Bremse. Genau deshalb kann die Winde es auch herunterlassen.",
        "Beim Aussteigen ohne Seil ist die Handbremse angezogen. Ein Wohnmobil, das sich verabschiedet, während man am Baum steht, ist ein Witz, der beim ersten Mal aufhört, lustig zu sein.",
      ],
    },
    {
      title: "Koop online",
      body: [
        "Zu zweit über dieselbe Strecke: Einer fährt, einer läuft voraus, macht das Seil am Baum fest oder sucht Werkzeug. Wer auf dem Dach steht, während der andere fährt, fährt mit.",
        "Online beginnt jede Partie bei Abschnitt 1 - der Fortschritt des Hosts zählt dafür nicht.",
      ],
    },
  ],
};
