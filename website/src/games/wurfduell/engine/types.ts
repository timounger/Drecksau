/**
 * The shapes of a Wurfduell match: fighters, things to throw, abilities,
 * throws and the game state that travels between the two players.
 *
 * @module
 * @remarks
 * Everything here is plain JSON on purpose. The same state is kept by the
 * single-player hook and sent over the wire as a string by the online layer -
 * so there are no classes, no `undefined` fields that would vanish on the way
 * and no maps.
 */

/** The fighters there are to choose from. */
export type CharacterId =
  | "koch"
  | "gaertnerin"
  | "pirat"
  | "ritter"
  | "baeckerin"
  | "schneemann"
  | "roboter"
  | "dino";

/** How a thrown thing behaves in the air, beyond flying in an arc. */
export type ItemBehavior =
  /** Just flies. */
  | "normal"
  /** Bursts into three at the top of its arc. */
  | "split"
  /** Bounces once off the ground and flies on. */
  | "bounce"
  /** Is pulled towards the opponent once close. */
  | "magnet";

/** What a hit looks like where it lands. */
export type ImpactLook =
  /** Something soft and wet: a splash of colour. */
  | "splat"
  /** Something brittle: shards fly. */
  | "shatter"
  /** Snow or flour: a cloud. */
  | "puff"
  /** Metal: sparks and a clang. */
  | "clang"
  /** Something heavy and dull: dust. */
  | "thud";

/** The things that can be thrown. */
export type ItemId =
  | "tomate"
  | "pfanne"
  | "blumentopf"
  | "kuerbis"
  | "kokosnuss"
  | "kanonenkugel"
  | "apfel"
  | "apfelhagel"
  | "lanze"
  | "torte"
  | "hochzeitstorte"
  | "brezel"
  | "schneeball"
  | "lawinenball"
  | "schraube"
  | "magnetmutter"
  | "knochen"
  | "riesenknochen"
  | "springknochen";

/** One thing to throw and how it flies. */
export type ItemDef = {
  readonly id: ItemId;
  /** Shown on buttons - German. */
  readonly name: string;
  /** Life points a body hit costs; a head hit costs half as much again. */
  readonly damage: number;
  /** Size of the thing in world units, which is also how easily it hits. */
  readonly radius: number;
  /** How much the wind pushes it: 1 is normal, 0 not at all. */
  readonly windFactor: number;
  /** How hard it falls: 1 is normal, more needs a harder throw. */
  readonly gravityFactor: number;
  /** How fast it leaves the hand compared with an ordinary throw. */
  readonly speedFactor: number;
  readonly behavior: ItemBehavior;
  readonly look: ImpactLook;
  /** The main colour of the splash it leaves. */
  readonly color: string;
  /** Whether it sticks to a face it hits (cream, egg, tomato). */
  readonly sticky: boolean;
  /** How fast it spins in the air, in turns per second. */
  readonly spin: number;
};

/** The abilities, each belonging to exactly one fighter. */
export type AbilityId =
  | "pfanne"
  | "scharfeSosse"
  | "staerkung"
  | "kuerbis"
  | "rankenfalle"
  | "kraeutertee"
  | "kanonenkugel"
  | "fernrohr"
  | "rum"
  | "schild"
  | "apfelhagel"
  | "lanze"
  | "hochzeitstorte"
  | "mehlwolke"
  | "brezelsalve"
  | "eisblock"
  | "lawinenball"
  | "windstille"
  | "zielcomputer"
  | "magnet"
  | "doppelwurf"
  | "bruellen"
  | "riesenknochen"
  | "abpraller";

/** What an ability leaves behind on a fighter. */
export type StatusEffect =
  /** Gives the thrower a shield that halves the next hit on them. */
  | "shield"
  /** Freezes the opponent: they miss their next turn. */
  | "freeze"
  /** Makes the opponent's next throw wobble. */
  | "shake"
  /** Tangles the opponent: their next throw has at most 70 % strength. */
  | "root"
  /** Dusts the opponent: no aiming help and no wind gauge next turn. */
  | "blind";

/** How much of the arc the aiming help shows with an ability armed. */
export type PreviewKind =
  /** The whole arc, without the wind. */
  | "full"
  /** The whole arc, wind included - the true path. */
  | "true";

/** One ability: used once per match, always together with a throw. */
export type AbilityDef = {
  readonly id: AbilityId;
  /** Shown on the button - German. */
  readonly name: string;
  /** One short line on what it does - German. */
  readonly description: string;
  /** A small picture for the button. */
  readonly icon: string;
  /** Throws this instead of the fighter's usual thing. */
  readonly item?: ItemId;
  /** Throws several, at these angle offsets in degrees. */
  readonly volley?: readonly number[];
  /** Life points the thrower gets back before throwing. */
  readonly heal?: number;
  /** Whether the thrower's own throw wobbles (the price of the rum). */
  readonly wobbleSelf?: boolean;
  /** Whether the wind is still for this throw. */
  readonly calm?: boolean;
  /** How much of the arc the aiming help shows. */
  readonly preview?: PreviewKind;
  /** Burns the target if the throw hits: damage over its next turns. */
  readonly burnOnHit?: boolean;
  /** What it leaves on a fighter, hit or not. */
  readonly status?: StatusEffect;
};

/** One fighter on the selection screen. */
export type CharacterDef = {
  readonly id: CharacterId;
  /** Shown everywhere - German. */
  readonly name: string;
  /** One line under the name on the selection screen. */
  readonly motto: string;
  /** What makes them different apart from the abilities - German. */
  readonly quirk: string;
  /** The thing thrown every turn. */
  readonly item: ItemId;
  /** The three abilities, each once per match. */
  readonly abilities: readonly AbilityId[];
  /** How many life points they start with. */
  readonly maxHp: number;
  /** Multiplies the strongest throw. */
  readonly powerFactor: number;
  /** Multiplies the wind on everything they throw. */
  readonly windFactor: number;
  /** Multiplies their own target area - big fighters are easier to hit. */
  readonly size: number;
  /** Main colour, for the card. */
  readonly color: string;
};

/** One aimed throw, as the player chose it. */
export type ThrowInput = {
  /** Degrees above the horizontal, towards the opponent. */
  readonly angle: number;
  /** 0 is a lob, 1 the strongest throw this fighter has. */
  readonly power: number;
  /** The ability used with it, or null. */
  readonly ability: AbilityId | null;
};

/** Where on the target a thing landed. */
export type HitPart = "head" | "body";

/** How one flying piece came to rest. */
export type ImpactKind = HitPart | "ground" | "out";

/** Lingering effects on one fighter. */
export type Statuses = {
  /** The next hit on them is halved. */
  readonly shield: boolean;
  /** They miss their next turn. */
  readonly frozen: boolean;
  /** Their next throw wobbles. */
  readonly shaky: boolean;
  /** Their next throw has at most 70 % strength. */
  readonly rooted: boolean;
  /** No aiming help and no wind gauge on their next turn. */
  readonly blind: boolean;
  /** How many more turns the hot sauce burns them. */
  readonly burn: number;
};

/** One fighter in a match. */
export type DuelPlayer = {
  readonly name: string;
  /** Null until they have chosen. */
  readonly character: CharacterId | null;
  readonly hp: number;
  readonly maxHp: number;
  /** Abilities already spent this match. */
  readonly used: readonly AbilityId[];
  readonly status: Statuses;
  /** Throws made this match. */
  readonly throws: number;
  /** Throws that cost the other side life points. */
  readonly hits: number;
  /** Matches won while the two sat together, for the score line. */
  readonly wins: number;
  /** Whether they asked for a rematch after the end. */
  readonly rematch: boolean;
};

/** What a throw did, decided by whoever referees it. */
export type ThrowRecord = {
  /** Counts up through the match, so a viewer animates each throw once. */
  readonly id: number;
  /** The seat that threw. */
  readonly by: number;
  /** The throw as it really left the hand, after any wobble. */
  readonly input: ThrowInput;
  /** The wind that blew, in steps (still air when calmed). */
  readonly wind: number;
  /** Life points it cost the target. */
  readonly damage: number;
  /** Whether a shield halved it. */
  readonly shielded: boolean;
  /** Life points the thrower got back first. */
  readonly heal: number;
  /** Life points the hot sauce burnt off the next on turn afterwards. */
  readonly burn: number;
  /** Which seat that burn hit, or null. */
  readonly burnSeat: number | null;
  /** Whether the opponent was frozen and the thrower goes again. */
  readonly frozen: boolean;
  /** Whether that ended the match. */
  readonly knockout: boolean;
  /** Where it hit best: the head beats the body beats nothing. */
  readonly best: HitPart | null;
  /** Whether the computer threw for a player who ran out of time. */
  readonly auto: boolean;
};

/** Where a match is. */
export type DuelPhase = "pick" | "throw" | "over";

/** How a finished match ended. */
export type EndReason = "ko" | "resign";

/** The whole match, as both players see it. */
export type DuelGame = {
  /** Where every random thing of this match comes from. */
  readonly seed: number;
  /** Counts the matches played at this table, starting at 0. */
  readonly round: number;
  readonly phase: DuelPhase;
  /** Exactly two, left seat first. */
  readonly players: readonly DuelPlayer[];
  /** The seat throwing next. */
  readonly turn: number;
  /** The wind for the next throw, in steps. */
  readonly wind: number;
  /** Which of the sceneries this match is played in. */
  readonly scenery: number;
  readonly lastThrow: ThrowRecord | null;
  /** Null while running. */
  readonly winner: number | null;
  readonly endReason: EndReason | null;
};

/** Everything a player can send. */
export type DuelMove =
  | { readonly kind: "pick"; readonly character: CharacterId }
  | {
      readonly kind: "throw";
      readonly angle: number;
      readonly power: number;
      readonly ability: AbilityId | null;
      /** Marks the feeble throw made for a player who ran out of time. */
      readonly auto?: boolean;
    }
  | { readonly kind: "resign" }
  | { readonly kind: "rematch" };
