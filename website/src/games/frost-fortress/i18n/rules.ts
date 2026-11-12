/**
 * The Frost Fortress rules, as shown in the game.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";
import { BOSS_EVERY } from "@/games/frost-fortress/engine/enemies";
import { FIRST_WAVE, WAVE_GAP } from "@/games/frost-fortress/engine/waves";

/** Seconds in a minute. */
const MINUTE = 60;

/** What the rules button opens. */
export const FROST_RULES: GameRules = {
  title: "Frost Fortress",
  players: "1 Spieler",
  intro:
    "Im ewigen Winter steht dein Hauptquartier mit einem kleinen Lager im Schnee. Baue Holzfäller, Minen und Generatoren, errichte Türme und Mauern und überstehe Welle um Welle. Fällt das Hauptquartier, ist das Spiel verloren.",
  sections: [
    {
      title: "Ressourcen",
      body: [
        "Es gibt Holz, Eisen, Stein, Energie, Nahrung und Treibstoff. Zu Beginn: 200 Holz, 150 Eisen, 100 Stein, 100 Energie. Die Leiste oben zeigt Vorrat und Änderung pro Sekunde.",
        "Holzfällerlager brauchen Wald in der Nähe, Minen müssen auf Erz (rostbraun) oder Stein (grau) stehen. Generatoren machen Energie, Werkstätten machen aus Holz Treibstoff. Das Hauptquartier erzeugt von allem ein wenig.",
        "Lagerhäuser und Hauptquartier-Stufen erhöhen das Lager. Fehlt Energie, arbeiten alle Verbraucher langsamer.",
        "Weitere Quellen: besiegte Gegner lassen manchmal Beute fallen (anklicken oder sie wird in der Basis eingesammelt), Versorgungsabwürfe, Händler, Erkundungen vom Hauptquartier aus und die Belohnung nach jeder Welle.",
      ],
    },
    {
      title: "Bauen",
      body: [
        "Links ein Gebäude wählen und auf die Karte setzen - grün heißt möglich, rot nicht (der Grund steht darunter). Gebaut wird nur innerhalb des Baugebiets um das Hauptquartier; jede HQ-Stufe vergrößert es.",
        "Bautrupps arbeiten gleichzeitig an wenigen Baustellen, die anderen warten. Solange ein Gebäude nicht fertig ist, lässt es sich verschieben (ziehen oder 'Verschieben') und kostenlos abbrechen.",
        "Jedes Gebäude hat mehrere Stufen. Keine Stufe darf höher sein als das Hauptquartier. Kann ein Bau gerade ausgebaut werden, erscheint ein grüner Pfeil an ihm - ein Klick darauf baut ihn sofort aus. Im Baumenü lässt sich unter „Stufe“ auch gleich eine höhere Stufe wählen; dann kostet und dauert der Bau so viel wie Bau und Ausbauten zusammen. Beschädigte Bauten werden über 'Reparieren' gegen Ressourcen wieder heil; Werkstätten reparieren in ihrer Nähe von selbst.",
        "Mauern mit gedrückter Maus ziehen baut eine ganze Reihe. Gegner suchen sich den bequemsten Weg - Mauern lenken sie, ganz eingeschlossen brechen sie durch die schwächste Stelle.",
      ],
    },
    {
      title: "Verteidigung",
      body: [
        "MG-Turm (schnelles Dauerfeuer), Kanonenturm (Flächenschaden), Scharfschützenturm (große Reichweite, stärkstes Ziel), Elektroturm (Kettenblitz, betäubt, braucht Energie), Flammenwerfer (Kegel, setzt in Brand, braucht Treibstoff), Minenfeld (versteckt, explodiert unter Gegnern, per Reparatur neu legen) und Mauern.",
        "Die meisten Türme müssen erst erforscht werden. Kasernen bilden Soldaten aus, die rund um die Kaserne kämpfen; die Krankenstation heilt sie.",
      ],
    },
    {
      title: "Wellen und Gegner",
      body: [
        `Die erste Welle kommt nach ${FIRST_WAVE / MINUTE} Minuten, danach jeweils ${WAVE_GAP} Sekunden nach dem Ende der letzten. Rote Markierungen am Kartenrand zeigen, wo sie kommt. 'Welle jetzt rufen' bringt einen Bonus.`,
        `Plünderer (schnell, stehlen Vorräte), Soldaten, schwere Soldaten, Sprengkommandos (sprengen Türme und Mauern), Belagerungsfahrzeuge (beschießen aus großer Entfernung) und alle ${BOSS_EVERY} Wellen ein Frostkoloss als Boss. Jede Welle wird stärker und zahlreicher.`,
      ],
    },
    {
      title: "Forschung, Tag und Nacht, Wetter",
      body: [
        "Das Forschungszentrum erforscht neue Türme, mehr Schaden, Panzerung, Produktion und bessere Sicht. Immer läuft ein Projekt; mehr Labore forschen schneller.",
        "Nachts und im Schneesturm sehen Türme und Gegner weniger weit. Im Sturm sinkt außerdem die Produktion. Zufallsereignisse wie Kältewellen, Polarlichter, Generatorausfälle oder Plündertrupps halten die Lage in Bewegung.",
      ],
    },
    {
      title: "Steuerung",
      body: [
        "Linksklick: auswählen und platzieren. Rechtsklick oder Esc: Auswahl abbrechen. Mausrad: zoomen. WASD oder Pfeiltasten: Karte bewegen (auch am Bildrand, abschaltbar). Leertaste: Pause, 1 bis 3: Tempo. Ziehen auf freiem Feld verschiebt die Karte.",
        "Am Handy: Tippen wählt und baut, Ziehen verschiebt die Karte, zwei Finger zoomen. Die Seitenleisten lassen sich ein- und ausklappen.",
        "Gespeichert wird automatisch (nach jeder Welle und regelmäßig) und von Hand über das Menü.",
        "In den Einstellungen lässt sich „Freies Bauen“ wählen: Dann kommen keine Wellen und keine Überfälle von selbst. Rechts in der Leiste ruft man Gegnergruppen jeder Art (so stark wie die aktuelle Welle) und verbündete Soldaten, die das Hauptquartier bewachen; „Welle jetzt rufen“ schickt eine ganze Welle.",
        "Der Knopf „Cheat-Modus“ oben schaltet alles frei: alle Forschung, alle Gebäude und Stufen ohne Hauptquartier-Grenze, unendlich Ressourcen, keine Bauzeiten und dazu das Tempo 10x und 100x. Eine Partie mit Cheat zählt für keine Bestwerte.",
      ],
    },
  ],
};
