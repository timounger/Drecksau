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
        "Mausrad: Waffe wechseln. Leere Fächer werden übersprungen.",
        "E oder Enter: ein- und aussteigen. Man muss dafür direkt neben dem Wagen stehen.",
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
        "Sechs Sorten: Wagen, Taxi, Geländewagen, Motorrad, Fahrrad und Panzer. Sie unterscheiden sich in Tempo, Beschleunigung, Wendigkeit und Blech - ein Fahrrad ist langsam und aus Papier, ein Geländewagen träge und zäh.",
        "Der Panzer steht irgendwo herum, ist kaum kaputtzukriegen und hat als einziges Fahrzeug eine Kanone: Aus ihm heraus wird geschossen, und zwar dorthin, wo er zeigt.",
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
        "Welcher Block was ist, steht fest und ändert sich nie. Nach einer Weile weißt du, wo das Krankenhaus steht - und das ist der Sinn der Sache.",
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
        "Bist du zu Fuß, fährt die Streife neben dich, hält an, und die Polizisten steigen aus und schießen. Verhaftet wird dabei niemand - zu Fuß ist die Gefahr das Schießen.",
        "Bist du im Auto, wird verfolgt und gerammt - das kostet Blech, nicht Gesundheit. Und nur hier gibt es die Zelle: Haben sie dich zum Stehen gebracht und halten dich ein paar Sekunden fest, bist du verhaftet. Wer wieder anfährt oder aussteigt und rennt, ist es nicht.",
        "Der blaue Ring ist die Lackiererei: reinfahren, zahlen, Fahndung weg.",
      ],
    },
    {
      title: "Krankenhaus und Zelle",
      body: [
        "Im Auto nimmst nicht du den Schaden, sondern das Blech. Wie viel davon noch da ist, zeigt der orange Balken oben rechts.",
        "Ist der Balken leer, fährt der Wagen nicht mehr - er rollt nur noch aus. Dann raucht er erst leicht, dann dick und schwarz, dann brennt er, und nach neun Sekunden fliegt er auseinander. Wer dann noch drinsitzt, geht mit hoch.",
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
        "Shift halten ist ein Cheat: zu Fuß zehnfaches Tempo, im Auto dreifaches. Wem die Taste zu unbequem ist oder wem das System sie wegschluckt, der drückt oben den Knopf Turbo (Cheat) - der bleibt an, bis er wieder gedrückt wird.",
        "Der zweite Knopf, Unsterblich (Cheat), nimmt dir jeden Schaden ab und legt alle Waffen in den Gürtel - die Munitionsanzeige steht dann auf dem Unendlichkeitszeichen. Zum Ausprobieren gedacht, nicht zum Gewinnen.",
      ],
    },
  ],
};
