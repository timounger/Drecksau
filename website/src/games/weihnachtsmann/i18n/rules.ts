/**
 * The Weihnachtsmann manual, as the rules button shows it.
 *
 * @module
 * @remarks
 * What a player looks up: who is who, the controls, what each character can
 * do, and how the Advent calendar with its minigames works.
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const WM_RULES: GameRules = {
  title: "Weihnachtsmann & Co. KG",
  players: "1 Spieler",
  intro:
    "Am Nordpol ist Hochbetrieb: Der Weihnachtsmann, die Elfen Jordi, Trixi und Gilfi, der Eisbär Balbo, das Rentier Rudolf und die Trolle Grantelbart und Gugor laufen durch den Schnee rund um die Weihnachtswerkstatt. Du suchst dir aus, wen du steuerst, und kannst jederzeit wechseln. Wen du gerade nicht steuerst, der spaziert von selbst herum.",
  sections: [
    {
      title: "Steuerung",
      table: [
        ["Was", "Tastatur", "Gamepad", "Handy"],
        [
          "Laufen",
          "Pfeiltasten oder W A S D",
          "Stick / Steuerkreuz",
          "im Feld Laufen ziehen",
        ],
        [
          "Figur wählen",
          "1 bis 8, Tab (mit Umschalt rückwärts), Q / E, Klick auf die Leiste oder die Figur",
          "Schultertasten",
          "Porträt oder Figur antippen, Nächste",
        ],
        ["Fähigkeit", "Leertaste oder F", "A", "Fähigkeit"],
        [
          "Jordi verwandeln / zurückverwandeln",
          "T (oder Leertaste)",
          "A",
          "Fähigkeit, dann Tier antippen",
        ],
        ["Sprechen / Benutzen", "R", "B", "Sprechen / Benutzen"],
        [
          "Ins Haus / hinaus",
          "auf die Tür zulaufen",
          "Stick / Steuerkreuz",
          "auf die Tür zulaufen oder Hinein",
        ],
        [
          "In ein Türchen",
          "davor stehen und Pfeil hoch",
          "Stick / Steuerkreuz",
          "davor stehen und Hinein",
        ],
        [
          "Minispiel verlassen",
          "Esc oder Knopf „Minispiel verlassen“",
          "Back oder Start",
          "Zurück",
        ],
        ["Tierwahl schließen", "Esc oder T", "B", "Abbrechen"],
      ],
      body: [
        "Wen du steuerst, erkennst du am gelben Pfeil über dem Kopf und am goldenen Ring zu seinen Füßen; in der Leiste unter dem Bild ist er hervorgehoben. Beim Wechsel gleitet die Kamera zur neuen Figur, und die alte spaziert von dort weiter, wo sie gerade steht.",
        "Steht die Figur vor etwas, das man benutzen kann, erscheint ein kleines R neben ihrem Kopf - dann benutzt R das Ding, statt zu sprechen.",
        "Auf dem Handy erscheinen ein Stick und die Knöpfe Fähigkeit, Sprechen (heißt Benutzen, wenn etwas vor der Figur steht) und Nächste - hochkant unter dem Bild, quer links und rechts daneben. Zum Laufen den Daumen im Feld Laufen aufsetzen und ziehen: je weiter, desto schneller. Steht die Figur in einer Tür oder vor einem Türchen, erscheint der Knopf Hinein. Quer gehalten wird das Bild größer.",
        "Das Spiel merkt sich, wen du gewählt hast, wo alle stehen und welche Türchen du geschafft hast. Der Knopf Neu aufstellen schickt alle an ihren Startplatz zurück - die geschafften Türchen bleiben.",
      ],
    },
    {
      title: "Die Figuren",
      table: [
        ["Figur", "Fähigkeit"],
        [
          "Weihnachtsmann",
          "fliegt den Schlitten - R am aufgemalten Tannenbaum",
        ],
        ["Balbo, der Eisbär", "noch keine - rutscht dafür kaum auf dem Eis"],
        ["Jordi", "verwandelt sich in ein Tier"],
        ["Trixi", "kann fliegen und zieht eine Glitzerspur hinter sich her"],
        ["Gilfi", "keine Fähigkeit - und zu faul, eine zu suchen"],
        ["Grantelbart", "noch keine - grantelt nur"],
        ["Gugor", "kann nichts"],
        ["Rudolf", "kann fliegen, seine rote Nase leuchtet dabei"],
      ],
    },
    {
      title: "Die Karte",
      body: [
        "Oben links steht die Weihnachtswerkstatt, das Zuhause des Weihnachtsmanns: eine große, verschneite Glaskuppel, aus der warmes Licht scheint. Rechts oben wohnt Grantelbart in seinem schiefen, düsteren Haus mit Krähen auf dem Dach. In der Mitte ist ein riesiger Tannenbaum auf den freigeräumten Schnee gemalt - darauf steht der Weihnachtsschlitten. Dazu kommen der gefrorene Teich, das Rentiergehege, Laternen, Schneemänner und rundherum Wald.",
      ],
    },
    {
      title: "Die Häuser",
      body: [
        "In die Glaskuppel und in Grantelbarts Haus kann man hinein: einfach auf die Tür zulaufen. Das Bild blendet kurz ab, und schon steht die Figur drinnen. Hinaus geht es durch die Tür unten im Raum. Wer drinnen ist, bleibt dort, bis du ihn wieder hinausführst; wählst du eine Figur in einem anderen Haus, wechselt das Bild dorthin. In der Leiste steht, wer gerade wo drinnen ist.",
        "Drinnen wird nicht geflogen: Trixi und Rudolf landen an der Tür, und Jordi als Vogel wird wieder Jordi.",
      ],
      table: [
        ["Wo", "Was R dort tut"],
        [
          "Spielzeugmaschine (Werkstatt)",
          "Puff - die Maschine baut ein Spielzeug, das in den Sack fliegt",
        ],
        ["Wunschzettel-Tafel (Werkstatt)", "einen Wunschzettel vorlesen"],
        ["Sessel (Werkstatt)", "der Sessel des Weihnachtsmanns"],
        [
          "Gitarren und Verstärker (Grantelbart)",
          "ein kurzes Gitarrenriff mit aufsteigenden Noten",
        ],
        [
          "Schlagzeug und Orgel (Grantelbart)",
          "ein Trommelwirbel, ein schauriger Akkord",
        ],
        [
          "Schlitten (am Tannenbaum)",
          "der Weihnachtsmann fliegt mit Rudolf eine große Runde über die Karte und landet wieder auf dem Baum",
        ],
      ],
    },
    {
      title: "Der Adventskalender",
      body: [
        "Östlich und südlich der Werkstatt führt der Adventsweg an 26 Türchen vorbei - Steinbögen, Kalenderhütten, Türen in Schneemauern und riesige Geschenke, jedes mit einer großen Zahl darüber. Stell dich mit einer beliebigen Figur davor und drück Pfeil hoch: Hinter jedem Türchen wartet ein Minispiel.",
        "Bis Ende November sind alle Türchen offen. Im Dezember ist es ein echter Adventskalender: Am 1. Dezember lässt sich nur Türchen 1 öffnen, am 2. Dezember dazu Türchen 2 und so weiter. Noch verschlossene Türchen tragen ein Schloss und sind in der Kalenderleiste grau. Ab dem 26. Dezember ist wieder alles offen.",
        "Jedes Minispiel erklärt sich auf seiner Titelkarte. Gesteuert wird mit den Pfeiltasten, der Leertaste und der Maus, auf dem Handy mit dem Stick, den Knöpfen Aktion und Taste 2 (beide lassen sich gedrückt halten) und durch Antippen. Mit Esc, dem roten Knopf „Minispiel verlassen“ unter dem Bild oder dem Knopf Zurück auf dem Handy geht es jederzeit zurück zur Karte - auch mitten im Spiel.",
        "Geschaffte Türchen stehen offen und tragen einen goldenen Stern. Das nächste leuchtet und hat einen Pfeil; ist es nicht im Bild, zeigt ein Pfeil am Rand den Weg. Unter dem Bild siehst du, wie viele der 26 Türchen du schon hast. Und wer alle schafft, bekommt eine Überraschung.",
        "Die Türchen 1 bis 6 sind fertig, die übrigen werden noch gebaut und zeigen solange „Kommt bald“.",
      ],
      table: [
        ["Türchen", "Was zu tun ist"],
        [
          "1 Geschenkeregen",
          "20 Geschenke mit dem Sack fangen, der Kohle ausweichen",
        ],
        [
          "2 Schneeballschlacht",
          "12-mal Grantelbart oder Gugor treffen, aber nie Gilfi",
        ],
        ["3 Figuren-Memory", "alle 6 Figuren-Paare finden"],
        [
          "4 Rudolfs Nachtflug",
          "45 Sekunden zwischen Schornsteinen und Wolken durchfliegen",
        ],
        ["5 Das Spielzeugband", "20 Spielzeuge in den richtigen Sack schicken"],
        ["6 Grantelbarts Riff", "70 Prozent der Noten im Takt treffen"],
      ],
    },
    {
      title: "Fliegen",
      body: [
        "Trixi und Rudolf heben mit der Leertaste ab und landen mit ihr wieder. In der Luft fliegen sie über Bäume, Zäune, Häuser und den Teich; ihr Schatten bleibt am Boden. Landen geht nur auf freiem Boden - über einem Baum oder dem offenen Wasser sagen sie dir, dass es hier nicht geht. In den Häusern wird nicht geflogen.",
        "Lässt du eine fliegende Figur allein, landet sie, sobald unter ihr Platz ist.",
      ],
    },
    {
      title: "Jordis Tiere",
      body: [
        "T öffnet die Tierwahl. Wähle mit 1 bis 6, mit den Pfeiltasten und der Leertaste oder per Klick. Puff - und Jordi ist ein Tier. T verwandelt ihn wieder zurück, wenn dort Platz für ihn ist.",
      ],
      table: [
        ["Tier", "Besonderheit"],
        ["Hase", "sehr schnell, hoppelt"],
        ["Vogel", "fliegt über alles hinweg"],
        [
          "Pinguin",
          "watschelt langsam, rutscht aber flott übers Eis und schwimmt im Wasser",
        ],
        ["Fuchs", "normal schnell, rutscht nicht auf dem Eis"],
        ["Maus", "winzig und flink, schlüpft durch die Zaunlatten"],
        ["Bär", "langsam, aber stark - pflügt durch Schneewehen"],
      ],
    },
    {
      title: "Der Schnee",
      body: [
        "Auf dem gefrorenen Teich rutschen die meisten Figuren: Sie kommen schwer in Gang und schlittern nach. Mitten im Teich ist ein Loch mit offenem Wasser - da kommen nur Flieger und der Pinguin hin. Schneewehen versperren den Weg, nur der Bär pflügt hindurch.",
      ],
    },
  ],
  note: "Nach der Zeichentrickserie Weihnachtsmann & Co. KG (1997). Alle Bilder im Spiel sind eigene Pixelgrafik.",
};
