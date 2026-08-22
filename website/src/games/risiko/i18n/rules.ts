/**
 * The rules of Risiko, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const RISIKO_RULES: GameRules = {
  title: "Risiko",
  players: "2 bis 5 Spieler",
  intro:
    "42 Gebiete auf sechs Kontinenten. Am Anfang jedes Zugs bekommst du neue Einheiten, mit denen du angrenzende Gebiete angreifst. Wer genug Gebiete hält, gewinnt.",
  sections: [
    {
      title: "Ein Zug",
      list: [
        "Einheiten platzieren",
        "Erobern - so oft du willst, oder gar nicht",
        "Truppen bewegen - einmal",
        "Karte ziehen, wenn du etwas erobert hast",
      ],
    },
    {
      title: "Wie viele Einheiten bekommst du?",
      body: [
        "Immer mindestens 3. Dazu kommt Verstärkung für Gebiete ab dem zwölften, für ganze Kontinente und für eingetauschte Karten.",
        'Achtung: Das ist nicht „Gebiete durch drei". Mit elf Gebieten bekommst du drei Einheiten, mit zwölf vier - das zwölfte Gebiet ist deshalb weit mehr wert als das elfte.',
      ],
      table: [
        ["Gebiete", "Extra"],
        ["12-14", "+1"],
        ["15-17", "+2"],
        ["18-20", "+3"],
        ["21-23", "+4"],
        ["24-26", "+5"],
        ["27-29", "+6"],
        ["30-32", "+7"],
        ["33-35", "+8"],
        ["36-39", "+9"],
        ["40-42", "+10"],
      ],
    },
    {
      title: "Kontinente",
      table: [
        ["Kontinent", "Gebiete", "Extra"],
        ["Nordamerika", "9", "+5"],
        ["Südamerika", "4", "+2"],
        ["Europa", "7", "+5"],
        ["Afrika", "6", "+3"],
        ["Asien", "12", "+7"],
        ["Australien", "4", "+2"],
      ],
    },
    {
      title: "Erobern",
      body: [
        "Du greifst von einem deiner Gebiete ein angrenzendes an - über eine Grenze oder eine Seestraße. Mitgehen dürfen höchstens 3 Einheiten, und mindestens 1 muss zur Befestigung zurückbleiben.",
        "Der Verteidiger antwortet mit 1 oder 2 Einheiten und muss nichts zurücklassen.",
        "Jeder Angreifer würfelt einen schwarzen Würfel, jeder Verteidiger einen roten. Die Würfel werden von hoch nach niedrig paarweise verglichen: Der höhere Angriffswürfel schlägt, bei Gleichstand gewinnt der Verteidiger. Überzählige Würfel entfallen.",
        "Ein Angriff ist ein Wurf, nicht ein Kampf bis zum Ende. Danach darfst du erneut angreifen - oder aufhören.",
      ],
    },
    {
      title: "Wer bekommt das Gebiet?",
      body: [
        "Stehen noch Verteidiger da, gehört es ihnen weiter, und deine Überlebenden kehren zurück.",
        "Ist der letzte Verteidiger gefallen, gehört das Gebiet dir. Die überlebenden Angreifer bleiben dort stehen, und du darfst weitere Einheiten nachziehen - eine bleibt immer zurück.",
      ],
    },
    {
      title: "Karten eintauschen",
      body: [
        "Jede Gebietskarte zeigt einen oder zwei Sterne. Beim Platzieren darfst du Karten eintauschen; wie viele Einheiten du bekommst, hängt an der Summe der Sterne.",
      ],
      table: [
        ["Sterne", "Einheiten", "Sterne", "Einheiten"],
        ["2", "2", "7", "17"],
        ["3", "4", "8", "21"],
        ["4", "7", "9", "25"],
        ["5", "10", "10", "30"],
        ["6", "13", "", ""],
      ],
    },
    {
      title: "Truppen bewegen",
      body: [
        "Einmal am Ende deines Zugs: beliebig viele Einheiten aus einem deiner Gebiete in ein anderes, das über eine Kette deiner eigenen Gebiete damit verbunden ist. Durch fremde Gebiete geht es nicht, und eine Einheit bleibt zurück.",
      ],
    },
    {
      title: "Gewinnen - Grundspiel",
      body: [
        "Wer am Ende seines Zugs die verlangte Zahl an Gebieten hält, gewinnt: bei 3 Spielern 25, bei 4 Spielern 20, bei 5 Spielern 15.",
        "Oder: Sobald die Waffenstillstandskarte gezogen wird, ist sofort Schluss. Es gewinnt, wer die meisten Gebiete hält - bei Gleichstand, wer die meisten Einheiten hat, und sonst gewinnen beide.",
      ],
    },
    {
      title: "Klassisches Risiko",
      body: [
        "Die Gebiete werden nicht ausgeteilt, sondern reihum besetzt; danach verteilt jeder reihum seine restlichen Starteinheiten (3 Spieler: 35, 4 Spieler: 30, 5 Spieler: 25).",
        "Es gibt keine Waffenstillstandskarte. Gewonnen hat, wer alle 42 Gebiete hält.",
      ],
    },
    {
      title: "Zu zweit",
      body: [
        "Drei neutrale Armeen stehen im Weg. Vor jedem eigenen Zug verstärkst du eine von ihnen um 3 Einheiten - alle drei auf dieselbe Armee.",
        "Wer das letzte Gebiet einer neutralen Armee erobert, bekommt die 3 Karten, die zu Spielbeginn unter sie gelegt wurden.",
        "Gewonnen hat, wer 30 Gebiete hält oder den anderen Spieler besiegt.",
      ],
    },
  ],
  note: 'Risiko von Hasbro/Parker, Ausgabe „Risk Reinvention" (2010). Die Verstärkung ist dort eine Tabelle, und die Karten zeigen Sterne statt Truppensymbolen.',
};
