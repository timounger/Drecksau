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
          "Ins Kino",
          "vor der Kinotür Pfeil hoch oder R",
          "Stick / Steuerkreuz",
          "vor der Tür Hinein oder Benutzen",
        ],
        [
          "Kino verlassen",
          "Esc oder Knopf „Kino verlassen“",
          "-",
          "Kino verlassen",
        ],
        [
          "Minispiel verlassen",
          "Esc oder Knopf „Minispiel verlassen“",
          "Back oder Start",
          "Zurück",
        ],
        ["Tierwahl schließen", "Esc oder T", "B", "Abbrechen"],
        [
          "Rundblick (Sternwarte) schließen",
          "R, Leertaste, Esc oder laufen",
          "A, B",
          "Benutzen, Fähigkeit oder Stick",
        ],
      ],
      body: [
        "Wen du steuerst, erkennst du am gelben Pfeil über dem Kopf und am goldenen Ring zu seinen Füßen; in der Leiste unter dem Bild ist er hervorgehoben. Beim Wechsel gleitet die Kamera zur neuen Figur, und die alte spaziert von dort weiter, wo sie gerade steht.",
        "Steht die Figur vor etwas, das man benutzen kann, erscheint ein kleines R neben ihrem Kopf - dann benutzt R das Ding, statt zu sprechen.",
        "Auf dem Handy erscheinen ein Stick und die Knöpfe Fähigkeit, Sprechen (heißt Benutzen, wenn etwas vor der Figur steht) und Nächste - hochkant unter dem Bild, quer links und rechts daneben. Zum Laufen den Daumen im Feld Laufen aufsetzen und ziehen: je weiter, desto schneller. Steht die Figur in einer Tür, vor einem Türchen oder vor dem Kino, erscheint der Knopf Hinein. Quer gehalten wird das Bild größer.",
        "Das Spiel merkt sich, wen du gewählt hast, wo alle stehen, welche Türchen du geschafft hast und welche Erfolge du hast. Der Knopf Neu aufstellen schickt alle an ihren Startplatz zurück - die geschafften Türchen und die Erfolge bleiben.",
      ],
    },
    {
      title: "Die Figuren",
      table: [
        ["Figur", "Fähigkeit"],
        [
          "Weihnachtsmann",
          "erkennt Wünsche: ein paar Sekunden lang steht über jeder Figur im Bild, was sie sich wünscht - und er schimmert golden. Mit R am aufgemalten Tannenbaum fliegt er den Schlitten",
        ],
        [
          "Balbo, der Eisbär",
          "ist tollpatschig und fällt hin - auf dem Eis rutscht er dabei noch ein Stück. Manchmal stolpert er auch von selbst",
        ],
        ["Jordi", "verwandelt sich in ein Tier"],
        ["Trixi", "kann fliegen und zieht eine Glitzerspur hinter sich her"],
        [
          "Gilfi",
          "lässt Dinge in der Nähe schweben: Geschenke, Steine, Schneemänner und herbeigezauberte Spielzeuge, in der Werkstatt die Spielzeuge aus den Regalen",
        ],
        [
          "Grantelbart",
          "spielt E-Gitarre: Riff, Noten, das Bild wackelt, und wer in der Nähe steht, springt hoch und beschwert sich. Zu Hause greift er auch von selbst mal in die Saiten",
        ],
        [
          "Gugor",
          "schaut durchs Fernrohr und beobachtet den Weihnachtsmann - auch wenn der in einem anderen Haus ist. Danach hat er etwas dazu zu sagen",
        ],
        ["Rudolf", "kann fliegen, seine rote Nase leuchtet dabei"],
      ],
    },
    {
      title: "Die Karte",
      body: [
        "Oben links steht die Weihnachtswerkstatt, das Zuhause des Weihnachtsmanns: eine große, verschneite Glaskuppel, aus der warmes Licht scheint. Rechts oben wohnt Grantelbart in seinem schiefen, düsteren Haus mit Krähen auf dem Dach. In der Mitte ist ein riesiger Tannenbaum auf den freigeräumten Schnee gemalt - darauf steht der Weihnachtsschlitten. Dazu kommen der gefrorene Teich, das Rentiergehege, Laternen, Schneemänner und rundherum Wald. Nördlich der Hauptstraße führt ein kleiner Weg zum Kino mit leuchtendem Schild und Lichterkette. Dazu kommen die fünf Häuser des Dorfs (siehe unten), und hinter dem Waldgürtel im Osten liegt weites, noch freies Land.",
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
          "Puff - die Maschine baut ein Spielzeug, das in den Sack fliegt. Grantelbart macht sie kaputt, eine Elfe repariert sie wieder",
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
        [
          "Laterne (draußen)",
          "Licht aus - oder wieder an, wenn sie schon dunkel ist",
        ],
        ["Schneemann (draußen)", "umschubsen - oder wieder aufbauen"],
      ],
    },
    {
      title: "Das Dorf",
      body: [
        "Rund um die Werkstatt stehen fünf Häuser, in die jede Figur hineingehen kann - einfach auf die Tür zulaufen (auf dem Handy Hinein). Vor jeder Tür zeigt ein Schild, wohin sie führt. Neben der Glaskuppel liegt die Elfen-Backstube, neben dem Kino die Poststube, nördlich von Grantelbarts Haus steht Gugors Sternwarte auf ihrem Hügel, unter dem Rentiergehege der Rentierstall, und ganz im Osten, wo die Hauptstraße durch den Wald führt, das Geschenkelager.",
        "Manches kann man aufheben und tragen - eine Möhre, einen Brief, Teig, ein Blech, das verlorene Geschenk. Es schwebt neben dem Kopf der Figur. Wer mit etwas in der Hand durch eine Tür geht, lässt es dort liegen - nur das verlorene Geschenk kommt mit.",
      ],
      table: [
        ["Wo", "Was R dort tut"],
        ["Möhrenkiste (Rentierstall)", "eine Möhre nehmen"],
        [
          "Box eines Rentiers (Rentierstall)",
          "Komet, Donner, Blitz und Tänzer träumen von einer Möhre, solange sie hungrig sind - mit einer Möhre in der Hand fütterst du sie. Nach anderthalb Minuten haben sie wieder Hunger",
        ],
        [
          "Stroh (Rentierstall)",
          "Rudolf legt sich zu einem Nickerchen hinein und schnarcht ein paar Sekunden",
        ],
        [
          "Briefberg (Poststube)",
          "einen Wunschzettel nehmen - er hat die Farbe seines Kontinents. Der Weihnachtsmann liest ihn sofort: Über ihm erscheint, was sich das Kind wünscht. Der Berg wächst alle paar Sekunden um einen Brief nach",
        ],
        [
          "Fach im Sortierregal (Poststube)",
          "den Brief einsortieren - nur ins Fach mit seiner Farbe (Europa blau, Amerika rot, Afrika gelb, Asien grün, Australien lila)",
        ],
        [
          "Teigschüssel, Blechtisch, Ofen (Backstube)",
          "Teig holen, Plätzchen aufs Blech ausstechen, in den Ofen schieben. Nach 8 Sekunden klingelt der Ofen - dann das duftende Blech herausholen, sonst verbrennen die Plätzchen nach weiteren 20 Sekunden",
        ],
        [
          "Kühlgitter (Backstube)",
          "das fertige Blech zum Abkühlen abstellen (verbrannte werden weggeworfen); mit leeren Händen ein Plätzchen naschen. Die Elfen naschen die Bleche nach und nach leer",
        ],
        [
          "Großes Fernrohr (Sternwarte)",
          "der Rundblick: die ganze Karte auf einmal, mit allen Figuren (wer drinnen ist, steht an der Tür seines Hauses), allen Türchen und Häusern",
        ],
        [
          "Verlorenes Geschenk (Geschenkelager)",
          "aufheben und in die Werkstatt tragen - sobald du mit ihm dort ankommst, ist es abgeliefert",
        ],
      ],
    },
    {
      title: "Was die Figuren im Dorf können",
      body: [
        "Gugor sieht von seiner Sternwarte aus weiter als alle anderen: Schaut er dort mit seiner Fähigkeit (oder am großen Fernrohr) hinaus, zeigt der Rundblick auch, was versteckt ist - wo das verlorene Geschenk im Lager liegt (mit einem Blick ins Lager von innen), wo der Fuchs graben kann und wo der Fisch schwimmt.",
        "Im Geschenkelager sind die Pakete zu einem Labyrinth gestapelt, irgendwo in einer Sackgasse liegt ein goldenes Geschenk und glitzert ab und zu. Manche Stapel haben unten ein Mauseloch: Nur Jordi als Maus schlüpft hindurch und nimmt so Abkürzungen. Nach ein paar Minuten stapeln die Elfen alles neu um - aber nur, wenn gerade niemand, den du steuerst, im Lager ist. Ist das Geschenk abgeliefert, geht nach einer Dreiviertelminute ein neues verloren.",
        "In der Backstube lässt Gilfi mit seinem Zauber Bleche voller Plätzchen schweben, und stolpert Balbo dort, fliegen Mehl und Plätzchen durch den Raum.",
      ],
    },
    {
      title: "Der Osten",
      body: [
        "Hinter dem Waldgürtel im Osten führt die Hauptstraße weiter. Auf der Karte des Rundblicks aus der Sternwarte stehen die Namen der Orte.",
        "Ein goldener Pfeil zeigt bei einem Auftrag aus dem Briefkasten den Weg - über dem Ziel, wenn es im Bild ist, sonst am Bildrand.",
      ],
      table: [
        ["Wo", "Was dort geht"],
        [
          "Weihnachtsmarkt (Nordosten)",
          "R an einer Bude: Punsch, ein Lebkuchenherz oder heiße Maronen. R vor dem Karussell: ein paar Runden auf einem Holzpferd, mit Musik. Lichterketten hängen über dem Platz",
        ],
        [
          "Rodelhang (unter dem Markt)",
          "R an den Schlitten neben dem Start: Los geht's! Der Schlitten wird von selbst schneller, links und rechts lenken, hoch bremst. Fahnen und Steine bremsen dich aus. Im Ziel steht die Zeit, die beste wird gespeichert",
        ],
        [
          "Schneeballwiese",
          "R wirft einen Schneeball in Blickrichtung. Zielscheiben wackeln, Schneemänner fallen um - das zählt als Treffer. Andere Figuren beschweren sich",
        ],
        [
          "Gefrorener Wasserfall",
          "Dahinter liegt die Eishöhle mit funkelnden Kristallen. Den dicken Eisvorhang bricht nur Jordi als Bär mit R auf. Als Fuchs wittert Jordi links daneben ein Schlupfloch (der Schnee zuckt) und gräbt es mit R frei. Nach zwei Minuten ist alles wieder zu",
        ],
        [
          "See (Südosten)",
          "Spiegelglattes Eis: alle gleiten weiter als sonst. Runden um die Insel zählen. Balbo fällt hier ständig hin",
        ],
        [
          "Tannenschonung",
          "Der Weihnachtsmann und die Elfen fällen mit R eine junge Tanne und tragen sie. In der Werkstatt mit R in den Ständer gestellt, steht sie geschmückt da - ein paar Minuten lang. Die Schonung wächst nach",
        ],
        [
          "Briefkasten (neben der Werkstatt)",
          "Ist die Fahne oben, liegt ein Brief darin: R liest den Auftrag - etwas Verlorenes finden und zu einer Figur bringen, jemanden besuchen oder etwas vom Markt holen und zum Briefkasten bringen. Danach kommt bald neue Post",
        ],
      ],
    },
    {
      title: "Tiere, Glöckchen, Tag und Nacht",
      body: [
        "Schneehasen, Pinguine und Eulen leben im Osten und laufen vor allen weg - außer vor Jordi in ihrer eigenen Gestalt. Dann kommen sie neugierig näher, und mit R plaudert er mit ihnen (die Eule auch im Flug).",
        "Zwölf goldene Glöckchen sind auf der ganzen Karte versteckt. Manche liegen offen herum, andere erreichst du nur fliegend, als Maus, Bär, Pinguin oder Fuchs; eins steckt in einer Tannenspitze, bis Gilfi daneben zaubert, eins leuchtet nur nachts, eins hängt am Karussell und eins steckt in einem Schneemann. Einmal gefunden, bleibt es gefunden - die Erfolge-Übersicht zeigt, wie viele du hast.",
        "Ein Tag dauert sechs Minuten. Abends gehen Laternen und Fenster an, nachts wird es dunkel, und manchmal leuchten Polarlichter am Himmel; über dem See tanzen dann kleine Eislichter. Ab und zu zieht ein Schneesturm auf, dann sieht man nicht mehr so weit. In den Häusern und in den Minispielen merkt man davon nichts.",
      ],
    },
    {
      title: "Erfolge",
      body: [
        "Mit jeder Figur und ihrer Fähigkeit kannst du Erfolge freischalten - und es gibt noch ein paar mehr. Ein Erfolg zählt nur, wenn du die Figur gerade selbst steuerst. Schaffst du einen, gleitet oben im Bild ein Banner mit Abzeichen herein, dazu ein Jingle und etwas Konfetti; das Spiel läuft dabei weiter.",
        "Der Knopf Erfolge (oben und unter dem Bild neben dem Adventskalender, auf dem Handy als Stern mit Zahl) zeigt alle Erfolge: geschaffte mit Datum, offene grau mit einem Tipp und, wo es passt, wie weit du schon bist.",
        "Alles, was du in der Welt veränderst, stellt sich nach einer Weile von selbst wieder her: Ausgeknipste Laternen gehen eine Minute nach der letzten nacheinander flackernd wieder an, umgeschubste Schneemänner stehen nach anderthalb Minuten wieder, platte Schneewehen wachsen nach 45 Sekunden nach, ein neuer Fisch schwimmt nach 25 Sekunden in den Teich, nach einer Minute liegt wieder ein Geschenk auf der Kuppel, und die kaputte Spielzeugmaschine rattert nach zwei Minuten von selbst wieder los, wenn keine Elfe sie repariert. Im Dorf bekommen die Rentiere nach anderthalb Minuten wieder Hunger, der Briefberg wächst nach, die Elfen naschen das Kühlgitter leer, und im Lager wird umgestapelt und ein neues Geschenk geht verloren. Im Osten wächst der Eisvorhang zu, die Tannen wachsen nach und der geschmückte Baum verschwindet wieder. Gespeichert werden nur die Erfolge, die gefundenen Glöckchen und deine beste Rodelzeit - nach dem Neuladen ist die Welt wieder heil.",
      ],
      table: [
        ["Erfolg", "So geht es"],
        [
          "Petri Heil",
          "Jordi als Pinguin: Schwimm im offenen Wasser des Teichs zu dem Fisch, der dort ab und zu springt.",
        ],
        [
          "Paket von oben",
          "Oben auf der Werkstattkuppel liegt ein Geschenk. Nur Trixi kommt fliegend hin.",
        ],
        [
          "Ehrenrunde",
          "Flieg mit Rudolf ohne zu landen in alle vier Ecken der Karte.",
        ],
        [
          "Wunschzettel komplett",
          "Weihnachtsmann: Lies nach und nach die Wünsche aller anderen - wer dabei im Bild ist, zählt.",
        ],
        [
          "Sabotage!",
          "Grantelbart in der Werkstatt: Benutze die Spielzeugmaschine oder spiel direkt daneben E-Gitarre.",
        ],
        [
          "Meisterhaft repariert",
          "Ist die Maschine kaputt, kann eine Elfe (Jordi, Trixi, Gilfi) sie benutzen und reparieren - bevor sie es selbst tut.",
        ],
        [
          "Ohrenbetäubend",
          "Grantelbart: Spiel E-Gitarre, wenn mindestens drei andere ganz nah dabeistehen.",
        ],
        [
          "Werkstattspion",
          "Gugor: Schau durchs Fernrohr, während der Weihnachtsmann in der Werkstatt ist.",
        ],
        [
          "Erwischt, Angeber!",
          "Gugor: Schau durchs Fernrohr, während der Weihnachtsmann Schlitten fliegt.",
        ],
        [
          "Schwebender Schneemann",
          "Gilfi: Zaubere draußen neben einem Schneemann.",
        ],
        ["Bauchklatscher", "Balbo: Fall auf dem gefrorenen Teich hin."],
        ["Stehaufmännchen", "Lass Balbo zehnmal hinfallen."],
        ["Volltreffer", "Balbo: Fall direkt vor einem Schneemann hin."],
        ["Durchgeschlüpft", "Jordi als Maus: Lauf mitten durch einen Zaun."],
        ["Schneepflug", "Jordi als Bär: Lauf durch eine Schneewehe."],
        [
          "Warme Füße",
          "Jordi als Vogel: Flieg zu Grantelbarts rauchendem Schornstein.",
        ],
        [
          "Turbohase",
          "Jordi als Hase: Lauf von der Werkstatttür zu Grantelbarts Haustür - in unter 8 Sekunden.",
        ],
        [
          "Spürnase",
          "Jordi als Fuchs: Grab mit R gleich östlich vom schiefen Schild.",
        ],
        [
          "Hü, Rudolf!",
          "Weihnachtsmann: Benutze den Schlitten am Tannenbaum, während Rudolf draußen ist.",
        ],
        ["Licht aus", "Stell dich vor eine Laterne und benutze sie."],
        [
          "Stromausfall",
          "Mach alle 35 Laternen aus. Du musst nicht alle in einer Minute schaffen: Jede ausgemachte Laterne startet die Minute neu - erst wenn du eine Minute lang keine ausmachst, gehen sie nacheinander wieder an.",
        ],
        ["Umgeschubst", "Stell dich vor einen Schneemann und benutze ihn."],
        [
          "Schneemann-Baumeister",
          "Bau einen umgefallenen Schneemann wieder auf, bevor er es selbst tut.",
        ],
        [
          "Ein-Troll-Band",
          "Spiel in Grantelbarts Haus jedes Instrument einmal.",
        ],
        [
          "Fließbandarbeit",
          "Bau mit der Spielzeugmaschine in der Werkstatt zehn Spielzeuge.",
        ],
        ["Hausbesuch", "Geh mit dem Weihnachtsmann zu Grantelbart ins Haus."],
        [
          "Betriebsversammlung",
          "Bring alle acht Figuren gleichzeitig in die Werkstatt.",
        ],
        ["Das erste Türchen", "Gewinne ein Minispiel hinter einem Türchen."],
        ["Frohe Weihnachten!", "Schaffe alle 26 Türchen des Adventskalenders."],
        ["Filmabend", "Starte im Kino eine Folge."],
        [
          "Satte Rentiere",
          "Füttere im Rentierstall alle vier Rentiere mit Möhren, bevor das erste wieder Hunger hat.",
        ],
        ["Rudolfs Nickerchen", "Rudolf: Leg dich im Rentierstall ins Stroh."],
        [
          "Postmeister",
          "Sortiere in der Poststube zehn Briefe ins Fach ihrer Farbe.",
        ],
        [
          "Lieber Weihnachtsmann ...",
          "Weihnachtsmann: Nimm in der Poststube einen Brief vom Berg.",
        ],
        [
          "Erstes Blech",
          "Backstube: Teig, Blech, Ofen - und das goldbraune Blech rechtzeitig herausholen.",
        ],
        ["Mehlstaub", "Balbo: Fall in der Backstube hin."],
        ["Fliegende Bleche", "Gilfi: Zaubere in der Backstube."],
        ["Überblick", "Schau in Gugors Sternwarte durch das große Fernrohr."],
        [
          "Adlerauge",
          "Gugor: Schau in der Sternwarte durchs Fernrohr, während das Geschenk im Lager versteckt ist.",
        ],
        [
          "Geschenk gerettet",
          "Finde im Geschenkelager das verlorene Geschenk und trag es in die Werkstatt.",
        ],
        [
          "Mäuseweg",
          "Jordi als Maus: Schlüpf im Geschenkelager durch ein Mauseloch.",
        ],
        [
          "Bummel über den Markt",
          "Drück auf dem Weihnachtsmarkt im Nordosten R an der Punsch-, der Lebkuchen- und der Maronenbude.",
        ],
        ["Rundherum", "Fahr auf dem Weihnachtsmarkt Karussell (R davor)."],
        [
          "Hinter dem Eis",
          "Betritt die Eishöhle hinter dem gefrorenen Wasserfall - Jordi als Bär bricht den Eisvorhang auf, als Fuchs findet er links daneben ein Schlupfloch.",
        ],
        [
          "Himmelsleuchten",
          "Gugor: Nimm draußen das Fernrohr, während nachts Polarlichter am Himmel leuchten.",
        ],
        ["Rodelblitz", "Saus den Rodelhang in unter 7 Sekunden hinunter."],
        [
          "Treffsicher",
          "Triff auf der Schneeballwiese 15-mal eine Zielscheibe oder einen Schneemann.",
        ],
        [
          "Eiskunstläufer",
          "Dreh auf dem See drei Runden um die Insel, ohne das Eis zu verlassen.",
        ],
        [
          "O Tannenbaum",
          "Weihnachtsmann oder eine Elfe: Fäll in der Tannenschonung eine junge Tanne und stell sie in der Werkstatt in den Ständer.",
        ],
        ["Alle Glöckchen", "Finde alle 12 goldenen Glöckchen."],
        [
          "Tiergespräche",
          "Jordi: Plaudere als Hase mit einem Schneehasen, als Pinguin mit einem Pinguin und als Vogel mit einer Eule.",
        ],
        ["Fleißiger Bote", "Erledige fünf Aufträge aus dem Briefkasten."],
        [
          "Sturmerprobt",
          "Sei während eines Schneesturms 20 Sekunden draußen unterwegs.",
        ],
        [
          "Vollgas",
          "Fahr mit einem Jetski ohne abzusteigen vom Westrand der Karte bis ganz in den Osten - oder andersherum.",
        ],
      ],
    },
    {
      title: "Jetskis",
      body: [
        "Vier Schnee-Jetskis stehen herum: am Südufer des Teichs, an der Hauptstraße, westlich vom Weihnachtsmarkt und am Westufer des Sees. Sie haben Kufen und fahren über Schnee, Wege, Eis und sogar offenes Wasser - gut zweieinhalbmal so schnell wie zu Fuß.",
        "Stell dich daneben und drück R (auf dem Handy Benutzen), dann sitzt du drauf. Gelenkt wird mit den Pfeiltasten oder dem Stick: Der Jetski dreht sich in die Richtung, gibt Gas und rutscht in den Kurven, auf Eis und Wasser besonders. Gegen Bäume, Zäune und Häuser prallt er ab, Schneemänner fallen um. Mit R steigst du wieder ab - neben dem Jetski, nicht mitten im Wasser. Der Jetski bleibt dort stehen.",
        "In Häuser, Türchen und Kino geht es nur zu Fuß: an der Tür erst absteigen. Wer fliegt, muss erst landen, und Jordi muss sich erst zurückverwandeln. Während der Fahrt hupt die Fähigkeits-Taste - bei Grantelbart wird daraus ein Gitarrenriff. Nachts leuchtet ein Scheinwerfer.",
        "Wechselst du die Figur, bleibt die alte auf dem Jetski sitzen; wechselst du zurück, fährst du weiter. Ein Jetski, der drei Minuten lang unbenutzt woanders steht, ist danach wieder an seinem Platz. Runden um die Insel im See zählen nur ohne Jetski. Im Rundblick der Sternwarte sind die Jetskis eingezeichnet.",
      ],
    },
    {
      title: "Das Kino",
      body: [
        "Im Kino laufen alle 26 Folgen der Serie Weihnachtsmann & Co. KG. Stell dich mit einer beliebigen Figur vor die Kinotür und drück Pfeil hoch oder R (auf dem Handy Hinein oder Benutzen). Solange das Kino offen ist, wartet die Karte.",
        "Tipp eine Folge in der Liste an: Sobald der Film läuft, geht der Vorhang auf. Jede Folge läuft ohne Vorspann und Abspann (22 Minuten). Unter der Leinwand sind Abspielen/Pause, die goldene Zeitleiste zum Spulen, der Ton und das Vollbild; ein Tipp aufs Bild hält an oder spielt weiter. Mit der Tastatur: Leertaste für Pause, Pfeil links und rechts springen 10 Sekunden. Am Ende schließt sich der Vorhang, und nach einem kurzen Countdown startet die nächste Folge von selbst - mit „Abbrechen“ bleibst du beim Ende.",
        "Das Kino merkt sich, wo du aufgehört hast: Beim nächsten Mal setzt der Knopf „Weiterschauen“ genau dort fort, und jede Folge aus der Liste beginnt an ihrer Stelle. Ein dünner Balken zeigt, wie weit du in einer Folge bist; fertig geschaute Folgen sind als „gesehen“ markiert und beginnen beim nächsten Mal wieder von vorn.",
        "Die Folgen werden erst beim Abspielen vom offiziellen TOGGO-Kanal geladen. Mit Esc oder dem Knopf „Kino verlassen“ geht es zurück auf die Karte.",
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
        "F (oder Leertaste) öffnet die Tierwahl. Wähle mit 1 bis 6, mit den Pfeiltasten und der Leertaste oder per Klick. Puff - und Jordi ist ein Tier. F verwandelt ihn wieder zurück, wenn dort Platz für ihn ist.",
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
