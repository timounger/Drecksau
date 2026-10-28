/**
 * The Zelda manual, as the rules button shows it.
 *
 * @module
 * @remarks
 * An action game has no rulebook; what a player looks up mid-adventure is the
 * story, the controls, what the tools do, how the temple works and which
 * monster does what.
 */
import type { GameRules } from "@/components/game-rules";

/** What the rules button opens. */
export const ZELDA_RULES: GameRules = {
  title: "Zelda",
  players: "1 Spieler",
  intro:
    "Ein kleines Abenteuer im Stil der Zelda-Spiele auf dem Game Boy Advance. Der Schattenmagier Vorgrim hat den Sonnenstein aus dem Dorf Grünau geraubt und im Moostempel von einem steinernen Wächter bewachen lassen. Sprich mit der Dorfältesten, hol dir Schlüssel, Karte und Kompass, löse die Rätsel des Tempels, besiege den Steinwächter und bring den Sonnenstein zurück.",
  sections: [
    {
      title: "Steuerung",
      table: [
        ["Taste", "Tastatur", "Gamepad"],
        ["Bewegen", "Pfeiltasten oder W A S D", "Stick / Steuerkreuz"],
        [
          "A - Gegenstand auf A, Reden, Öffnen",
          "linke Maustaste, J oder Leertaste",
          "A",
        ],
        ["B - Gegenstand auf B", "rechte Maustaste oder K", "B oder X"],
        ["R - Rollen, im Wasser Tauchen", "L oder Umschalt", "Schultertasten"],
        ["Gegenstände und Karte", "I oder Enter", "Start"],
        ["Menü schließen", "I, Enter, Esc oder Klick auf das rote X", "Start"],
        [
          "Im Menü: auf A legen / auf B legen",
          "Linksklick oder A / Rechtsklick oder B",
          "A / B",
        ],
        ["Pause: speichern, laden, neu starten", "Esc", "-"],
      ],
      body: [
        "Auf dem Handy erscheinen unter dem Bild ein Steuerkreuz und die Tasten A, B, R und Start - wie auf dem Game Boy. Mehrere Finger gleichzeitig gehen.",
        "Der Knopf Cheat-Modus macht dich unverwundbar, gibt dir zehn Herzen, alle Gegenstände, vier volle Flaschen, 999 Rubine, volle Pfeile und Bomben - Rubine und Munition werden nie weniger - und Link läuft doppelt so schnell. Was er dir gibt, behältst du auch, wenn du ihn wieder ausschaltest. Zum Ausprobieren gedacht.",
        "Esc hält das Spiel an - ist gerade das Inventar offen, schließt Esc zuerst das Inventar. Im Pause-Menü speicherst du deinen Spielstand, lädst ihn wieder oder fängst von vorn an. Zusätzlich speichert das Spiel ständig automatisch - beim nächsten Besuch geht es dort weiter, wo du aufgehört hast.",
        "Das R-Feld oben rechts zeigt immer, was R gerade tut: Rollen, Lesen, Reden, Öffnen, Kaufen, Heben, Werfen, Klein, Groß oder im Wasser Tauchen. A tut dasselbe, wenn es etwas zu tun gibt - egal, was auf A liegt. Sonst benutzt A den Gegenstand auf A.",
      ],
    },
    {
      title: "Gegenstände auf A und B",
      body: [
        "I (oder Enter) öffnet die Seite Gegenstände: zwölf Felder für Werkzeuge und Waffen, darunter vier Flaschen und der Knopf SPEICHERN. Leere Felder füllen sich mit dem, was du unterwegs findest.",
        "Jeder Gegenstand kann auf A oder B liegen. Linksklick auf ein Feld legt ihn auf A, Rechtsklick auf B. Mit Tastatur oder Gamepad wählst du ein Feld mit dem Steuerkreuz und drückst A oder B. Liegt er schon auf der anderen Taste, tauschen die beiden Tasten.",
        "SPEICHERN speichert wie das Pause-Menü. R oder die Pfeile am Rand blättern zur Karte.",
        "Zu Beginn hast du Schwert, Schild, Bogen, Bomben und Bumerang. Die übrigen Gegenstände liegen in Truhen in der Oberwelt, im Moostempel und im Wurzelreich - alles ist in einem Durchgang zu finden.",
      ],
      table: [
        ["Gegenstand", "Wirkung"],
        [
          "Schwert",
          "Schlägt in einem Bogen vor dir, trifft Monster, schneidet Büsche und hohes Gras. Taste halten: Blitzt die Klinge, loslassen - die Wirbelattacke trifft alles rundherum doppelt.",
        ],
        [
          "Schild",
          "Seine Taste halten hebt den Schild: blockt Steine und Angriffe von vorn, du gehst dabei langsamer. Nur dann hat Link ihn in der Hand - sonst trägt er ihn verstaut und er schützt nicht. Feuerbälle hält er nicht auf.",
        ],
        [
          "Bogen",
          "Schießt einen Pfeil geradeaus. Fliegt er durch ein Feuer, brennt er und entzündet Fackeln. Höchstens 30 Pfeile.",
        ],
        [
          "Bomben",
          "Legt eine Bombe, die nach zwei Sekunden explodiert. Sprengt rissige Felsen und Wände, verletzt Monster - und dich, wenn du zu nah stehst. Höchstens 20.",
        ],
        [
          "Bumerang",
          "Fliegt los und kommt zurück. Betäubt Monster, besiegt Keese, schneidet Gras und bringt Rubine und Herzen mit.",
        ],
        [
          "Laterne",
          "Entzündet eine kalte Fackel direkt vor dir und leuchtet kurz auf.",
        ],
        [
          "Feuerstab",
          "Schießt einen Feuerball geradeaus: brennt Gras und Büsche ab, entzündet Fackeln, verbrennt Monster. Ein Feuerball ins offene Auge betäubt den Steinwächter.",
        ],
        [
          "Enterhaken",
          "Schießt eine Kette geradeaus. Trifft sie einen Holzpfosten oder eine Truhe, zieht sie dich hinüber - auch über die reißende Strömung, in der niemand schwimmen kann. Monster betäubt sie, Rubine und Herzen holt sie heran.",
        ],
        [
          "Schaufel",
          "Gräbt weichen Boden vor dir um (Wiese, Weg, Feld). Manchmal liegt ein Rubin oder ein Herz darunter; wo die Erde aufgewühlt aussieht, ist etwas Besonderes vergraben.",
        ],
        [
          "Sprungfeder",
          "Link hüpft - in Laufrichtung oder auf der Stelle - über Zäune, Pfützen und feindliche Schüsse. Landet Link im Wasser, schwimmt er einfach weiter; wer in der Strömung oder einer Pfütze landet, verliert ein halbes Herz und steht wieder am Ufer.",
        ],
        [
          "Sprintstiefel",
          "Taste halten: Link stampft kurz und rennt dann mit dem Schwert voran los, bis du loslässt. Monster im Weg werden getroffen, Gras gemäht; rennt er gegen einen Baum, fällt manchmal etwas heraus.",
        ],
        [
          "Krafthandschuhe",
          "Wirken von selbst: schwere dunkle Felsen mit A heben und werfen.",
        ],
        [
          "Flaschen",
          "Bis zu vier. Bodo füllt eine leere Flasche mit Heiltrank. Leg sie auf A oder B: Trinken füllt alle Herzen, danach ist die Flasche leer.",
        ],
      ],
    },
    {
      title: "Schwimmen und Tauchen",
      body: [
        "Link kann von Anfang an schwimmen: Geh einfach in den Fluss oder den Spiegelsee. Im Wasser ist er langsamer, Kopf und Arme schauen heraus, und Gegenstände gehen nicht. A oder B macht einen kräftigen Schwimmzug nach vorn. Klein oder mit einem Felsen über dem Kopf traut er sich nicht hinein.",
        "R lässt ihn für anderthalb Sekunden abtauchen: Dann sieht man nur seinen Schatten und Luftblasen, Monster und Schüsse erreichen ihn nicht, und er kommt etwas langsamer voran. Nach dem Auftauchen dauert es einen Moment bis zum nächsten Tauchgang.",
        "Wo es auf dem Wasser glitzert und Blasen aufsteigen, liegt etwas am Grund: Tauch dort, um es heraufzuholen - meist Rubine, an einer Stelle tief im See sogar ein Herzcontainer.",
        "Rund um die Insel im Spiegelsee wirbelt eine reißende Strömung, in der niemand schwimmen kann. Dorthin kommst du nur mit dem Enterhaken über die beiden Holzpfosten.",
      ],
    },
    {
      title: "Rollen, Schilder und Leute",
      body: [
        "R rollt in Laufrichtung - schnell aus der Gefahr. Vor einem Schild liest R (oder A) es vor, vor einer Person redet Link mit ihr. Texte tippen sich Buchstabe für Buchstabe; A zeigt die Seite sofort ganz und blättert weiter.",
        "Niedrige Felskanten - nur eine Stufe hoch, erkennbar an der schmalen Felsleiste - springst du einfach hinunter: Lauf an der Kante kurz weiter nach unten, dann hüpft Link hinab. Hinauf geht es nur über die Treppen, und die hohen Klippen bleiben unüberwindbar.",
      ],
    },
    {
      title: "Grünau",
      list: [
        "Die Dorfälteste wohnt im Haus im Westen des Dorfes. Erst wenn du mit ihr gesprochen hast, lässt Tamo dich in den Moostempel.",
        "In Bodos Laden stellst du dich vor eine Ware und drückst A: ein Herz für 10, zehn Pfeile für 20, fünf Bomben für 25, Heiltrank in eine leere Flasche für 20, einmalig eine Flasche für 30 und einmalig ein Herzteil für 80 Rubine.",
      ],
    },
    {
      title: "Der Moostempel",
      list: [
        "Der Tempel liegt in der Klippe nördlich des Dorfes. Jeder Raum ist ein Bildschirm; gehst du durch eine Tür, scrollt das Bild zum nächsten Raum.",
        "Verschlossene Türen öffnen sich, wenn du mit einem kleinen Schlüssel hineinläufst. Das große Tor zur Wächterkammer braucht den großen Schlüssel.",
        "Die Karte zeigt alle Räume, der Kompass die Truhen und den Wächter. Beides siehst du im Menü auf der Kartenseite (I, dann R).",
        "Eine Bodenplatte gibt nur unter einem Steinblock nach: lehn dich gegen den Block, dann rutscht er ein Feld weiter. Steckt er fest, verlass den Raum - dann liegt er wieder am Anfang.",
        "Fackeln entzündest du mit einem Pfeil, den du durch das ewige Feuer schießt - oder mit Laterne und Feuerstab. Rissige Wände sprengst du mit Bomben.",
        "In manchen Räumen schließen sich Gitter hinter dir, bis alle Gegner besiegt sind.",
      ],
    },
    {
      title: "Der Wichtelstumpf",
      body: [
        "Ganz im Süden der Wiese steht ein alter Stumpf. Stell dich darauf und drück R: Link wird so klein wie ein Käfer (noch einmal R macht ihn wieder groß). Klein kannst du nicht kämpfen und keine Türen öffnen, schlüpfst aber durch Mauselöcher - hinein ins Wurzelreich, wo Grashalme wie Bäume aufragen. Dort ist alles wieder so groß wie du, deine Gegenstände gehen also wieder.",
      ],
    },
    {
      title: "Monster und Wächter",
      table: [
        ["Monster", "Verhalten"],
        ["Oktorok", "Läuft umher und spuckt Steine. Der Schild hält sie auf."],
        ["Schleim (ChuChu)", "Hüpft auf dich zu, sobald du in der Nähe bist."],
        [
          "Keese",
          "Fledermaus im Wald und im Tempel. Flattert wild los, wenn du zu nah kommst.",
        ],
        [
          "Moblin",
          "Patrouilliert auf der Weide und stürmt los, wenn er dich vor sich sieht.",
        ],
        ["Tektit", "Springt in großen Sätzen durch das Hügelland."],
        [
          "Darknut",
          "Vorgrims schwarzer Ritter in den Ruinen. Sein Schild blockt alles von vorn - triff ihn von der Seite, von hinten oder mit Bomben.",
        ],
        [
          "Panzerkäfer",
          "Wächter im Tempel. Stürmt geradeaus los und ist von vorn gepanzert. Rammt er die Wand, liegt er benommen da - jetzt zuschlagen!",
        ],
        [
          "Steinwächter",
          "Der Boss. Nur sein Auge ist verwundbar: Öffnet er es für einen Feuerball-Fächer, schieß einen Pfeil hinein (oder zünde eine Bombe neben ihm). Betäubt trifft ihn das Schwert. Springt er, fallen Felsen von der Decke - achte auf die Schatten.",
        ],
      ],
      body: [
        "Besiegte Monster der Oberwelt kommen nach einer Weile zurück, sobald du die Gegend verlassen hast. Abgeschnittene Büsche und gehobene Felsen kehren auch wieder.",
      ],
    },
    {
      title: "Funde, Herzen und Rubine",
      list: [
        "Öffnest du eine Truhe, hält Link den Fund hoch. Nach dem Steinwächter bekommst du den Sonnenstein, einen Herzcontainer und die Krafthandschuhe: Damit hebst du schwere dunkle Felsen mit A und wirfst sie wieder.",
        "Du startest mit drei Herzen. Vier Herzcontainer gibt es (zwei versteckt in der Oberwelt, einer am Grund des Spiegelsees, einer vom Boss) und vier Herzteile - vier Teile ergeben ein ganzes Herz.",
        "Büsche, Gras und Monster lassen manchmal Rubine (grün 1, blau 5, rot 20), Herzen, Pfeile oder Bomben fallen. Liegengelassenes verschwindet nach ein paar Sekunden.",
        "Sind alle Herzen leer, heißt es Game Over: Weiter setzt dich mit drei Herzen am Tempeleingang oder im Dorf ab, Neu starten beginnt das Abenteuer von vorn.",
      ],
    },
    {
      title: "Speichern",
      body: [
        "Das Spiel speichert sich alle paar Sekunden und nach jedem wichtigen Fund von selbst in diesem Browser: Ort, Herzen, Rubine, Munition, Gegenstände und Flaschen, was auf A und B liegt, Schlüssel, Herzteile, geöffnete Truhen und Türen, entzündete Fackeln und wie weit die Geschichte ist.",
        "Von Hand speicherst du im Pause-Menü (Esc) oder mit SPEICHERN auf der Seite Gegenstände - beides ist derselbe Spielstand, den du im Pause-Menü wieder lädst.",
      ],
    },
  ],
  note: "Alle Grafiken, Karten, Figuren, Texte und Töne sind eigens für diese Sammlung gezeichnet, geschrieben und erzeugt - ein Fan-Spiel im Stil von The Minish Cap.",
};
