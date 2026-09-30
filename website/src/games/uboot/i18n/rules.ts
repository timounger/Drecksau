/**
 * The U-Boot manual, as shown in the game.
 *
 * @module
 * @remarks
 * A manual rather than rules: there is nothing to win here but the far end of
 * the course, and what somebody looks up mid-dive is which key does what, what
 * exactly it is that kills them, and what the points are for.
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const UBOOT_RULES: GameRules = {
  title: "U-Boot",
  players: "Allein",
  intro:
    "Ein Tauchspiel von der Seite. Auf der Seekarte wählst du ein Gewässer, links legst du ab, rechts ist der Ausgang. Dazwischen liegt alles, was ein U-Boot aufreißen kann - und die Luft wird nicht mehr.",
  sections: [
    {
      title: "Steuerung",
      table: [
        ["Was", "Wie"],
        ["Auftauchen", "W"],
        ["Abtauchen", "S"],
        ["Zurück", "A"],
        ["Vorwärts", "D"],
        ["Zielen und feuern", "Linksklick - dorthin, wo du hinklickst"],
        ["Seemine legen", "Rechtsklick - sie bleibt liegen, wo du sie lässt"],
        ["Pause", "Esc oder der Knopf oben rechts"],
      ],
      body: [
        "Die Pfeiltasten tun dasselbe, und wer die Hand nicht von WASD nehmen will: Leertaste feuert - zum Zeiger, wenn der im Bild steht, sonst geradeaus - und Q legt eine Seemine.",
        "Auf dem Telefon fasst du links ins Bild - dort geht ein Steuerkreuz unter deinem Daumen auf. Rechts tippen schießt dorthin, rechts halten legt eine Seemine.",
        "Einen Startknopf gibt es nicht: Der erste Druck nach vorn legt ab.",
        "Das Boot hat Masse: Es läuft nach, wenn du loslässt, und es kommt nicht sofort auf Tempo. Eine Lücke fährt man deshalb früh an, nicht im letzten Moment.",
        "Vorwärts ist immer schneller als rückwärts - rückwärts bleiben sechzig Prozent vom Schub, egal wie weit der Antrieb ausgebaut ist. Rückwärts ist zum Warten da, nicht zum Davonfahren.",
      ],
    },
    {
      title: "Das Fenster",
      body: [
        "Der Ausschnitt, den du siehst, wandert von allein nach rechts. Am hinteren Rand steht dunkles Wasser: Wer dort hängenbleibt, wird mitgeschoben, aber niemand fällt hinten heraus.",
        "Innerhalb des Fensters bist du frei. Vorwärts kaufst du dir Platz, den du vor einem Hindernis wieder ausgibst - genau das ist der Handel, um den es geht.",
        "Wer sich weit vorn hält, zieht das Fenster mit: Es läuft dann bis zu dreimal so schnell und holt dich ein. Vorsprung gibt es also, aber nicht geschenkt.",
        "Am Ende des Kurses bleibt das Fenster stehen. Die letzten Meter gehören dir allein.",
      ],
    },
    {
      title: "Was dich umbringt",
      table: [
        ["Was", "Gefährlich?"],
        ["Fels", "Ja - vom Grund und von Überhängen"],
        ["Minen", "Ja - sie treiben frei im offenen Wasser"],
        ["Leerer Tank", "Ja - die Luft läuft die ganze Zeit"],
        ["Seetang", "Nein - er sieht nur so aus"],
        ["Oberfläche und Grund", "Begrenzung, kein Schaden"],
      ],
      body: [
        "Ohne Rüstung ist eine Berührung das Ende. Mit Rüstung hält die Hülle mehrere aus - nach einem Treffer glüht sie kurz und ist in dieser Zeit unverwundbar, sonst wäre ein einziger Fels sofort alle Stufen los.",
        "Unten ist die Gefahr Stein, den man sieht; oben sind es Stacheln, nach denen man suchen muss. Der schnelle Weg ist selten einer von beiden.",
      ],
    },
    {
      title: "Erfahrung und Verbesserungen",
      body: [
        "Jedes gemeisterte Gewässer bringt Erfahrungspunkte, tiefere mehr als flache. Ein Gewässer, das du schon kennst, bringt beim Wiederholen noch ein Viertel - genug, dass es sich lohnt, zu wenig, um das Hafenbecken zum Beruf zu machen.",
        "Ausgegeben wird in der Werkstatt - der Hammer am Fuß des Spielfensters, gleich neben Enzyklopädie und Erfolgen. Alles zusammen kostet deutlich mehr, als alle Gewässer beim ersten Mal einbringen: Die erste Frage ist also nicht, wann du alles hast, sondern welches Boot du willst.",
        "Mehr Punkte, als das ganze Boot kostet, kann niemand ansammeln: Bei 900 ist Schluss. Punkte sind hier kein Guthaben, sondern die Frage, welches Boot du fährst - und die ist beantwortet, sobald alles gekauft werden kann.",
        "Du kannst jederzeit alles zurücksetzen. Dann sind sämtliche Punkte wieder frei und du verteilst neu - gesammelte Punkte und gemeisterte Gewässer bleiben dabei unangetastet.",
      ],
      table: [
        ["Verbesserung", "Was sie bringt"],
        ["Sauerstoffkapazität", "Mehr Luft, also mehr Zeit unter Wasser"],
        ["Rüstung", "Jede Stufe ein Treffer mehr"],
        ["Bewaffnung", "Harpune, dann Torpedo, dazu Seeminen"],
        ["Beleuchtung", "Scheinwerfer, dann Sonar"],
        ["Tauchgeschwindigkeit", "Schneller auf und ab"],
        ["Antriebsgeschwindigkeit", "Mehr Schub vor und zurück"],
      ],
    },
    {
      title: "Die Waffen",
      list: [
        "Geschossen wird dorthin, wo du hinklickst - nicht nur nach vorn. Halten feuert weiter, so schnell das Rohr wieder voll ist.",
        "Es gibt zwei Sorten Fels. Grauer ist gewachsener Stein und hält alles aus; brauner mit Rissen ist Bruchfels, und da macht ein Torpedo oder eine Seemine eine Tür hinein. Der Grund und die Decke einer Höhle sind immer grau - ein Weg nach draußen lässt sich nicht freisprengen.",
        "Harpune: schnell und billig, aber sie sticht nur. Drei Treffer, dann geht eine Mine hoch - und man sieht ihr an, wie viele sie schon hat: Mit jedem Stich fehlt ihr ein Dorn und ein Riss läuft über sie. An Fels ist die Harpune verloren.",
        "Torpedo: ersetzt die Harpune im selben Rohr. Langsamer und seltener, aber was er trifft, ist beim ersten Treffer weg - und den Fels nimmt er gleich mit. Ein Torpedo macht eine Tür, wo vorher eine Wand war.",
        "Seemine: kommt zusätzlich zum Rohr und liegt auf der rechten Maustaste. Sie wird nicht geschossen, sondern gelegt, bleibt liegen, wo du sie lässt, und geht nach ein paar Sekunden hoch - mit allem in ihrem Umkreis.",
        "Die eigenen Explosionen tun dem Boot nichts. Das ist eine Entscheidung, keine Physik - eine Seemine, die einen selbst zerlegt, ist eine Waffe, die niemand einsetzt.",
      ],
    },
    {
      title: "Bestenliste",
      body: [
        "Jedes Gewässer hat seine eigene Liste mit den zehn schnellsten Durchfahrten. Klickst du ein Gewässer an, siehst du zuerst ein Blatt dazu: links ein Blick ins Wasser und die drei schnellsten Zeiten, rechts der Text zur Karte, deine Bestmarke, die Schwierigkeit und der Knopf zum Ablegen. Wer eine Zeit schlagen will, soll sie vorher gesehen haben.",
        "Gemessen wird auf die Millisekunde. Zwei gute Fahrten durch dasselbe Gewässer trennt oft weniger als ein Zehntel, und eine Liste, in der dreimal dieselbe Zahl steht, ist keine Rangfolge.",
        "Je Name gibt es einen Platz, und das ist die beste Fahrt. Eingetragen wird nach dem Durchtauchen, direkt auf dem Siegblatt; ein abgebrochener Versuch zählt nicht.",
        "Auf höherer Schwierigkeit läuft das Wasser schneller - die besten Zeiten entstehen dort.",
      ],
    },
    {
      title: "Schwierigkeit",
      body: [
        "Vier Stufen, umzustellen im Zahnrad oben rechts auf der Seekarte: Leicht, Mittel, Schwer, Unmöglich. Sie wirken ab dem nächsten Tauchgang.",
        "Verändert wird genau zweierlei: Das Fenster läuft schneller nach, und es lebt mehr da unten. Die Karte selbst bleibt, wie sie ist - sonst wäre eine Bestleistung keine Aussage über dich, sondern über zwei verschiedene Spiele.",
        "Nach jedem geschafften Gewässer steht da, auf welcher Stufe es war, und was in diesem Gewässer bisher dein Höchstes ist. Behalten wird nur das Höchste: Wer auf Unmöglich durchkam und danach auf Leicht noch einmal fährt, hat es trotzdem auf Unmöglich geschafft.",
        "Für alle zehn Gewässer auf Unmöglich gibt es eine eigene Auszeichnung. Auf Unmöglich läuft das Wasser schneller, als ein Boot von der Stange fahren kann - ohne Antrieb aus der Werkstatt wird das nichts.",
      ],
    },
    {
      title: "Die Bewohner",
      body: [
        "Unten lebt etwas, und nichts davon mag dich. Was dich berührt, kostet eine Hülle - egal ob es ein Fels war oder ein Fisch.",
        "Das meiste kann man abschießen: Ein Fischschwarm stiebt beim ersten Treffer auseinander, eine Qualle hält zwei aus, Krabbe und Seeigel vier. Der Seeigel allerdings hat nichts, worin eine Harpune stecken bleibt - an seinen Stacheln prallt sie ab, und nur ein Knall hilft. Dafür rührt er sich nie von der Stelle.",
        "Der Anglerfisch ist der einzige, der dir folgt. Er ist langsamer als jedes Boot, also ist Davonfahren immer eine Antwort - fünf Treffer sind die andere.",
        "Wer alles nachlesen will: Im Buch unten am Fenster steht zu jedem Bewohner, was er aushält, wie er sich bewegt und ob man ihn im Dunkeln sieht.",
      ],
    },
    {
      title: "Gewässer",
      body: [
        "Zehn Stück, von links nach rechts freigetaucht: Zum nächsten kommt nur, wer alle davor abgeschlossen hat. Zu jedem schon gemeisterten kann man jederzeit zurück.",
        "In den finsteren Gewässern sieht man ohne Scheinwerfer kaum mehr als das eigene Boot. Der Scheinwerfer macht daraus einen Kegel nach vorn, das Sonar zeichnet die Umrisse in Gelb, lange bevor das Licht sie erreicht. Deshalb sind die ersten sechs Gewässer hell - Dunkelheit kommt erst, wenn du etwas dagegen kaufen konntest.",
        "Eine Höhle ist nicht eng, sondern zu. Über dir liegt von der ersten Sekunde an Fels, und deshalb gibt es dort keine Luft mehr zu holen - Platz zum Fahren ist genug da.",
        "Das zehnte ist alle drei auf einmal, in derselben Reihenfolge, in der du sie gelernt hast: erst offenes Wasser mit Luft über dir, dann die Höhle, in der du noch siehst, dann die Finsternis - und am Ende der Wächter. Das Licht geht dabei nicht auf einen Schlag aus, sondern über ein Stück Weg.",
      ],
    },
  ],
  note: "Im Boot sitzt ein Affe. Er steuert nicht mit, er schaut nur zu - und zwar genau dahin, wo es gleich knallt.",
};
