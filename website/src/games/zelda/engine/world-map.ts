/**
 * The overworld as rows of tile letters - generated together with
 * `assets/world.png`, which is the same map drawn out.
 *
 * @module
 * @remarks
 * One letter per 16 x 16 tile, 64 tiles wide and 48 high. What each letter
 * means is listed in {@link ./tiles}. The picture and these rows come out of
 * one generator run, so a change to the map means running it again rather
 * than editing either by hand.
 */

/** The map, top row first. */
export const MAP_ROWS: readonly string[] = [
  'TtTtTtTt"TtTt"<........Tt.Tt..Tt.Tt.Tt..TtTtTt..Tt..............',
  "ttttttttbttttb<.rrrrrrrtt.tt..tt.tt.tt..tttttt..ttwwwwwwsswwwwww",
  "TtTtbbbbbbTtTt<.r.....r.......r.........fffff:::..wssssssssspsss",
  'tttt"TtTt"tttt<.r..*..r.,...,.....:.r...f...f::::.wsgsgssspsssps',
  '"bTtbttttTtTt"<.r,....r..r.,,...:::::...f.C.f:::..wsssssssssssss',
  "Ttttbb...ttttb<.r.....r........r:::::.,,f...f:....wsgsgsssssssss",
  'ttb"b.:::."Tt"<.rrrxrrr"""....,.:::::.."fffff.....sssssssssssssw',
  'TtTt.:::::.tt"<........""".,.....r.:..."""",......sssssssssssssw',
  'tttt.:::::.bbb<.....S..""":::.........."""...,....wsgsgsssssssss',
  "TtTt.::==:.Ttb<........:::::::.,..............r...wssssssspsssps",
  'ttttb.:==."tt"<.........:::::r."""....r.,..,..""".wsgsgsssssCsss',
  'TtTtTt.==Tt"Tt<........,..:.,."""""...........""""wsssssssssssss',
  'ttttttb==ttbtt<................""".....S......"""..S............',
  'TtTtTt"=="TtTtMMMMMMMMMMMM##MMllllllllMMOoMMMMMMMMMlllll##MMMMMM',
  'ttttttb=="ttttmmmmmmmmmmmm##mm........mmeemmmmmmmmm.....##mmmmmm',
  'bb"Tt""==Tt"bTt,........,,==S....,.,........~~~..bb.........Ttb.',
  "bTttt..==ttTttt...........==........,.:.....~~~........r....tt.b",
  'btt".""==""tt"......,.....==.""".,..:::::...~~~...r............b',
  'Tt"""""==""bTtTt.Hhh..bb..==."""....:::::.b.~~~........::C..r...',
  'tt.""C"=="."tttt.hhh..b...==."".....:::::.b..~~~......:::::.....',
  'b".""".==".TtTt..hdh......==.........:.:.....~~~.S...r:::::::...',
  'Tt."""".=".tttt,,.=....,..===================___.....:::::::""".',
  'ttb."""==.""Tt....===========================___.....::::::::"".',
  'bTtb.""==bTttt.......:::..==..............S..~~~.....:::::::""".',
  '"ttTt..=="ttbTt.....:::::.==........f..""",..~~~.........:r.....',
  'TtbttTt=="Tt"tt.,,.:::::::==...Hhh..f.."""...~~~................',
  'ttbTttt==bttTt."""..:::::.==,..hhh..f.."""...~~~................',
  '"bbttTt==bTttt."""...:::..==...hdh..f..C....~~~....r"""....Tt.r.',
  'Tt"Tttt=="ttTt."""...b....==..S.=...f....,b.~~~..."""""....tt...',
  'tt"ttTt==Ttbtt........,@..==....=...f..:::b.~~~..b.""".........b',
  'Ttbb"tt==ttTtTt,.,.,========......,.f..:::..~~~.................',
  'ttTtTt"==Tttttt.....========Sbb...,...bb::..~~~~~...............',
  'bbttttb==St"bb.S....==....==..,.............~~~~~~.~~~~~~.......',
  "============================.....f.......f..~~~~~~~~~~~~~~~.....",
  "============================,....f%%%%%%%f..~~~~~~~~~~~~~~~r....",
  'TtTt.."TtTtTtTt.....=="...==.....f%%%%%%%f..~~~~~~~~~~~~~~~~~~..',
  'tttt...tttttttt...,.==""..==::...f%%%%%%%f..cccccccc~~~~~~~~~~..',
  'Tt".,,,.bbTtTt......==..b..:::::.f%%%%%%%f..ccc.C..c~~~~~~~~~~~.',
  "tt.,,,,,.btttt..b...==...::::::::f%%%%%%%fk.ccc...kc~~~~~~~~~~~.",
  'Tt.,,,,,.bTt"Tt.b...==...::::::::f%%%%%%%f..ccc....c~~~~~~~~~~..',
  'tt.,*,,,.btt"tt.....==,.S.:::::::f.......f..cccccccc~~~~~~~~~r~.',
  'Tt".,,,."b"b"bTt.:..==..,.:::::::ffff,ffff...~~~~~~~~~~~~~~~~~..',
  'ttb"...b"TtTtbtt::::.....U..:rrrrr,............~~r~~~~~~~~~~~...',
  'bTtbTtbTtttttTt:::::..n"""..br..Pr..........."""~~~~~~~~~~~rrrrr',
  '"tt"ttbttTtbbtt.::::..."""...rn..r.."....,.,."""".~~~~~~~~.r.C.r',
  'Tt"Ttbbbbtt"Tt..:bb.b.b"""..brrrrrb"""bb.b.b.""".......""".R...r',
  'tt"ttTt"TtTtttTtTtTtTtTtTtTtTtTtTt."".TtTtTt.........."""""rrrrr',
  '""bb"tt"ttttb"tttttttttttttttttttt....tttttt............""""""..',
];
