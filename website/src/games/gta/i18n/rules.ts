/**
 * What the rules button opens.
 *
 * @module
 */
import type { GameRules } from "@/components/game-rules";

/** How GTA is played here. */
export const GTA_RULES: GameRules = {
  title: "GTA",
  players: "1 Spieler",
  intro:
    "Los Santos von schräg oben. Du läufst durch die Stadt, nimmst dir ein Auto und fährst Aufträge - und je schneller du unterwegs bist, desto mehr interessiert sich die Polizei für dich. Wer alle vier Viertel übernommen hat, dem gehört die Stadt.",
  sections: [
    {
      title: "Steuerung",
      body: [
        "W A S D oder die Pfeiltasten. Zu Fuß sind das die vier Himmelsrichtungen: W geht nach oben, egal wohin du schaust. Im Auto sind es Gas, Bremse und Lenkung; rückwärts fährt, wer im Stand weiter bremst.",
        "Die Maus ist dein Blick: Zu Fuß drehst du dich immer dorthin, wo der Zeiger steht. So kannst du rückwärts weglaufen und dabei nach vorn zielen.",
        "Linke Maustaste: schießen, dorthin, wo der Zeiger steht. Nur zu Fuß - aus dem fahrenden Auto wird nicht geschossen.",
        "Rechte Maustaste: im Panzer das Maschinengewehr neben der Kanone, solange du sie gedrückt hältst. Zu Fuß legt sie mit dem Fernzünder in der Hand eine Ladung ab.",
        "Mausrad: Waffe wechseln. Leere Fächer werden übersprungen.",
        "Leertaste: zu Fuß der Jetpack, sobald du einen hast. Solange du sie hältst, steigst du; lässt du los, sinkst du auf das, was gerade unter dir ist. Über einem Haus ist das sein Dach - dort kannst du landen, herumlaufen und über die Kante wieder herunterfallen. Im Auto ist dieselbe Taste die Handbremse.",
        "E oder Enter: ein- und aussteigen. Man muss dafür direkt neben dem Wagen stehen; dein Mann läuft dann von selbst zur Fahrertüre, öffnet sie und steigt ein. Beim Motorrad, beim Fahrrad und beim Panzer gibt es keine Türe - da sitzt du sofort auf.",
        "Gelenkt wird nur, solange der Wagen rollt - ein stehendes Auto dreht sich nicht auf der Stelle.",
      ],
    },
    {
      title: "Wer hier lebt",
      body: [
        "Auf den Gehwegen: Passanten, feine Leute im Anzug, Penner in zerschlissenen Sachen, die halb so schnell gehen wie alle anderen und sich vor allem vor den Supermärkten aufhalten, wo die meisten im Schneidersitz an der Wand sitzen - und Nachtschwärmerinnen: helle Haut, langes blondes Haar, Sonnenbrille, Bikini, Stiefel und Handtasche. Die stehen vor allem vor den Nachtclubs herum; auf der Karte sind die mit einem Cocktailglas markiert.",
        "Dazu zwei Banden. Grüne T-Shirts sind deine Leute, orangene die Gegner. Sie stehen nicht überall herum, sondern halten ein paar Ecken der Stadt - immer zu viert, immer beieinander, und wer sich zu weit entfernt, geht zurück.",
        "Von sich aus schießt niemand: Erst wenn du selbst auf ein Bandenmitglied schießt, geht diese Bande auf dich los - und deine eigenen Leute steigen dann mit ein.",
        "Und Tiere: Katzen streunen allein herum, Hunde laufen immer bei jemandem mit. Beiden passiert nichts, sie gehören einfach zur Stadt.",
      ],
    },
    {
      title: "Fahrzeuge",
      body: [
        "Sieben Sorten: Wagen, Taxi, Geländewagen, Transporter, Motorrad, Fahrrad und Panzer. Sie unterscheiden sich in Tempo, Beschleunigung, Wendigkeit und Blech - ein Fahrrad ist langsam und aus Papier, ein Geländewagen träge und zäh, und der braune ups-Transporter ist das größte und sperrigste, was im Verkehr mitfährt.",
        "Auf dem Militärgelände steht außerdem ein Hubschrauber, den man fliegen kann: E steigt ein, Leertaste steigt, W fliegt. Rings um den Zaun stehen vier Luftabwehrstellungen, die auf alles schießen, was dort in der Luft ist.",
        "Oben links liegt Bauernland mit Feldern, Scheunen und Traktoren - der Traktor hat eine Anhängerkupplung und kann andere Fahrzeuge abschleppen. Unten links steht ein Berg, auf den ein Feldweg hinaufführt.",
        "Tag und Nacht sind standardmäßig aus. In den Einstellungen kann man sie anschalten - dann läuft oben rechts eine Uhr, nachts wird es dunkel, und zum Sonnenauf- und -untergang liegt die Stadt in Orange. Ein ganzer Tag dauert 24 Minuten.",
        "Wer umkommt, lässt sein Geld liegen - vom Passanten 60 Euro, vom Snob 260. Penner haben nichts, Polizisten tragen keins bei sich.",
        "Autos haben Gewicht: Wer zu schnell einlenkt, steht quer und qualmt - Bremsen zieht den Wagen gerade, Vollgas lässt das Heck kommen. Die Leertaste ist im Auto die Handbremse: damit bremst man quer, driftet absichtlich und dreht Donuts, und die schwarzen Striche bleiben eine Weile auf der Straße liegen. Jedes Fahrzeug hat dabei seine eigene Haftung, vom Motorrad, das nie rutscht, bis zum DMC-12, der es gern tut.",
        "Im Panzer schiebt man jedes Fahrzeug einfach zur Seite und fährt ohne Tempoverlust weiter - dafür braucht es keinen Cheat.",
        "Der Gefängnishof ist von außen nicht zu erreichen - der Bau geht lückenlos im Viereck herum, und darum steht ein Zaun mit Stacheldraht. Der einzige Weg hinein ist über die Mauer, also der Jetpack. Sobald du drin bist, schwenken alle vier Scheinwerfer auf dich, und kurz darauf schießen die sechs Wärter im Hof. Nur die schießen, und treffen kann man sie auch. Legst du alle sechs um, gehen Tor und Schranke auf und die Häftlinge spazieren hinaus.",
        "Der Panzer ist kaum kaputtzukriegen und hat als einziges Fahrzeug zwei Waffen: die Kanone auf der linken Maustaste, die dorthin schießt, wo der Turm zeigt, und das Maschinengewehr daneben auf der rechten, solange du sie hältst. Es gibt genau einen, und der steht hinter dem Zaun des Militärgeländes in der Wüste - wer dort hineingeht, hat sofort sechs Sterne und zehn bewaffnete Wachen am Hals. Der andere Weg zu einem Panzer ist, ihn der Polizei wegzunehmen, die bei sechs Sternen selbst einen schickt.",
      ],
    },
    {
      title: "Waffen, Rüstung und Gesundheit",
      body: [
        "Du fängst mit der Faust an. Schlagring, Schlagstock, Messer, Pistole, Maschinengewehr, Flammenwerfer, Panzerfaust und Granaten liegen in der Stadt herum - wer sie will, muss laufen. Aufgenommenes kommt nach einer Weile an derselben Stelle zurück.",
        "Ebenfalls zu finden: die Rüstung. Sie hält so viel aus wie dein Leben und wird zuerst aufgebraucht, bevor es an die Gesundheit geht. Im Krankenhaus ist sie wieder weg, die Waffen bleiben.",
        "Wirst du eine Weile nicht getroffen, wächst die Gesundheit von selbst nach. Die Rüstung nicht - die muss neu gesucht werden.",
        "Oben rechts steht, was in der Hand ist, wie viel Munition, wie viel Leben (grün) und Rüstung (blau) noch da ist und wie viel Geld. Die Karte der ganzen Stadt liegt unten links.",
      ],
    },
    {
      title: "Die Häuser",
      body: [
        "Jeder Block ist etwas: ein Haus, ein Doppelhaus, ein Reihenhaus oder ein Hochhaus - oder ein Ort mit Namen. Bank, Feuerwehr, Krankenhaus, Polizeirevier, Barber, Restaurant, Casino, Rathaus, Supermarkt, Nachtclub und Gefängnis stehen mit Schild über der Tür da.",
        "Die Feuerwache hat drei Tore, die immer offen stehen - du kannst hineinfahren. In jedem steht ein Löschfahrzeug: wie der Transporter, ganz in Rot, mit der Leiter auf dem Dach, FEUERWEHR an der Seite und Blaulicht obendrauf. Der Schlüssel steckt, wie bei jedem leeren Fahrzeug.",
        "Welcher Block was ist, steht fest und ändert sich nie. Nach einer Weile weißt du, wo das Krankenhaus steht - und das ist der Sinn der Sache.",
        "Von Polizeirevier, Nachtclub, Krankenhaus und Feuerwache gibt es genau eines je Stadtteil - vier in der Stadt, nicht zwölf. Das Krankenhaus erkennst du von weitem: drei Stockwerke Glasfassade, ein rotes Kreuz an der Wand, eine Schiebetür unter dem Vordach und ein Hubschrauberlandeplatz auf dem Dach, auf dem du auch wirklich landen kannst - dort steht der gelbe Rettungshubschrauber, den du genauso fliegen kannst wie den vom Militärgelände - hinaufkommst du mit dem Jetpack oder mit der anderen Maschine. Am Bordstein davor steht ein Krankenwagen: weiß, mit zwei roten Streifen an jeder Seite und Blaulicht auf dem Dach.",
      ],
    },
    {
      title: "Aufträge",
      body: [
        "Der gelbe Ring ist die Abholung, der grüne die Abgabe. Fahr in den gelben Ring, dann läuft die Uhr, und der Ring wandert ans Ziel.",
        "Bezahlt wird nach Entfernung. Wer die Zeit reißt, verliert den Auftrag - und bekommt sofort einen neuen.",
        "Jeder erledigte Auftrag zählt für das Viertel, in dem er endet. Drei Aufträge, und das Viertel gehört dir.",
        "Die Karte unten links zeigt die ganze Stadt: der weiße Punkt bist du, gelb oder grün ist der Auftrag, hellblau die Lackiererei, dunkelblau jede Streife.",
        "Wie nah die Kamera steht, stellst du in den Einstellungen ein - von 1,5-fach bis 6-fach. Näher heißt größer, aber weniger Übersicht.",
      ],
    },
    {
      title: "Die Fahndung",
      body: [
        "Was du Passanten antust, muss erst jemand sehen. Ist keine Streife in der Nähe, braucht es drei solche Sachen, bis dich jemand meldet - ist eine da, reicht die erste. Alles, was gegen die Polizei selbst geht, zählt sofort.",
        "Beim ersten Stern kommt ein Streifenwagen. Jeder weitere Stern bringt einen weiteren dazu, höchstens sechs. Neue kommen einzeln und mit Abstand nach.",
        "Fünf Sterne sind das Höchste.",
        "Die Sterne fallen von selbst wieder ab, wenn dich eine Weile niemand sieht. Ein ausgeschalteter Streifenwagen sieht auch nichts mehr - wer den letzten los wird und wegfährt, ist die Fahndung nach einer Weile los.",
        "Einen Polizisten umzufahren wirft ihn erst einmal nur um: Er liegt ein paar Sekunden auf der Straße und steht dann wieder auf. Beim zweiten Mal ist er tot - egal, wie viel Zeit dazwischen liegt. Zwei Sterne kostet schon der erste Anstoß.",
        "Bist du zu Fuß, fährt die Streife neben dich, hält an, und die Polizisten steigen aus und schießen. Verhaftet wird dabei niemand - zu Fuß ist die Gefahr das Schießen.",
        "Bist du im Auto, wird verfolgt und gerammt - das kostet Blech, nicht Gesundheit. Und nur hier gibt es die Zelle: Haben sie dich zum Stehen gebracht und halten dich ein paar Sekunden fest, bist du verhaftet. Wer wieder anfährt oder aussteigt und rennt, ist es nicht.",
        "Der blaue Ring ist die Lackiererei: reinfahren, zahlen, Fahndung weg.",
      ],
    },
    {
      title: "Krankenhaus und Zelle",
      body: [
        "Im Auto nimmst nicht du den Schaden, sondern das Blech. Wie viel davon noch da ist, zeigt der orange Balken oben rechts. Kugeln kosten es nur ein Drittel dessen, was sie einem Menschen antun - Dauerfeuer von drei Polizisten hält ein Wagen gut zehn Sekunden aus.",
        "Ist der Balken leer, stirbst du nicht: Der Wagen fährt nur nicht mehr, er rollt aus und bleibt stehen. Dann raucht er erst leicht, dann dick und schwarz, dann brennt er, und nach neuneinhalb Sekunden fliegt er auseinander. Wer dann noch drinsitzt, geht mit hoch - aussteigen und weglaufen ist die Antwort darauf, und weg heißt weiter als ein paar Schritte.",
        "Endest du im Krankenhaus, kostet das Geld. Erwischt dich die Polizei zu Fuß, zahlst du Kaution.",
        "Beides ist kein Spielende: Du stehst wieder auf der Straße, ohne Sterne und ohne Auto.",
      ],
    },
    {
      title: "Was diese Umsetzung anders macht",
      body: [
        "Das Vorbild ist ein 3D-Spiel von 2004 mit einer Geschichte, Waffen und einem halben Bundesstaat. Hier ist es eine Stadt von schräg oben, in der das übrig bleibt, was ein Browserspiel tragen kann: fahren, ausweichen, abliefern, abhauen.",
        "Die Ansicht ist gekippt wie bei Panzerkiste: Häuser, Autos und Leute haben ein Dach und eine Wand, die zu dir zeigt. Gerechnet wird trotzdem flach von oben. Verstecken tut die Ansicht nichts: Sobald jemand hinter einem Haus steht - du, ein Auto, ein Passant -, wird dieses Haus durchsichtig, und der Verdeckte wird oben drauf gezeichnet.",
        "Geschossen wird zu Fuß, und zurück schießt niemand: Die Polizei drängt dich ab und rammt. Die Spannung kommt aus dem Verkehr, der Uhr und den Sternen im Rückspiegel.",
        "Shift halten heißt rennen: zu Fuß dreifaches Tempo, im Auto anderthalbfaches.",
        "Der Knopf Cheat-Modus nimmt dir jeden Schaden ab, legt alle Waffen in den Gürtel und den Jetpack auf den Rücken - die Munitionsanzeige steht dann auf dem Unendlichkeitszeichen. Solange er an ist, wird aus Shift der alte Turbo: zehnfach zu Fuß, dreifach im Auto. Zum Ausprobieren gedacht, nicht zum Gewinnen.",
      ],
    },
  ],
};
