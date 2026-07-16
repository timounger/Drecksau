/**
 * Applies moves to a game state: card effects, drawing, and the win check.
 *
 * @module
 */
import { isAttachedCard, type ActionCardType, type Card } from "./cards";
import { isLegalMove } from "./moves";
import { shuffle, type RandomState } from "./random";
import {
  currentPlayer,
  handCardById,
  hasBarn,
  hasBeauty,
  hasWon,
  ownerOfPig,
  HAND_SIZE,
  type GameState,
  type Move,
  type Pig,
  type PigId,
  type Player,
} from "./state";
import { CARD_NAMES, LOG_TEXTS, logLine } from "@/i18n/translations";

/** Result of a card effect: the new table plus cards freed for the discard. */
type EffectResult = {
  readonly players: readonly Player[];
  /** Cards that leave the table, e.g. a stall burnt down by lightning. */
  readonly releasedCards: readonly Card[];
  /** Log text describing what happened, without the player name. */
  readonly logText: string;
  /** Cards the player now has to use as well (Glücksvogel). */
  readonly pendingCardIds?: readonly string[];
};

/**
 * Applies a move and hands the turn to the next player.
 *
 * @param state - the current state
 * @param move - the move of the active player
 * @returns the state after effect, draw and turn change
 * @throws if the move breaks the rules
 * @remarks
 * A Glücksvogel keeps the turn open: as long as cards are pending, nothing is
 * drawn and nobody else gets to move.
 * @example
 * ```ts
 * const next = applyMove(state, { kind: "playCard", cardId: "mud-0", targetPigId: "p0-pig1" });
 * ```
 */
export function applyMove(state: GameState, move: Move): GameState {
  if (!isLegalMove(state, move)) {
    throw new Error(`illegal move: ${JSON.stringify(move)}`);
  }

  const afterMove = runMove(state, move);
  let next: GameState;

  if (afterMove.pendingCardIds.length > 0) {
    // The Glücksvogel is still being resolved - the turn stays with us.
    next = checkWinner(afterMove);
  } else {
    // A Glücksvogel turn ends here if one opened this move or was already
    // running. Whatever is left in hand then goes unused - see the rulebook.
    const endsLuckyBird =
      state.pendingCardIds.length > 0 ||
      playedCardType(state, move) === "luckyBird";
    next = finishTurn(refillHand(afterMove, endsLuckyBird));
  }

  return next;
}

/** The type of the card a move plays, or null for other moves. */
function playedCardType(state: GameState, move: Move): ActionCardType | null {
  let type: ActionCardType | null = null;

  if (move.kind === "playCard") {
    const card = currentPlayer(state).hand.find(
      (candidate) => candidate.id === move.cardId,
    );
    type = card?.type ?? null;
  }

  return type;
}

/** Runs the move itself, without drawing or passing the turn. */
function runMove(state: GameState, move: Move): GameState {
  let next: GameState;

  switch (move.kind) {
    case "playCard":
      next = playCard(state, move.cardId, move.targetPigId);
      break;
    case "discardCard":
      next = discardCard(state, move.cardId);
      break;
    case "redrawHand":
      next = redrawHand(state);
      break;
  }

  return next;
}

/** Plays a card, resolves its effect and moves it to the pig or discard. */
function playCard(
  state: GameState,
  cardId: string,
  targetPigId: PigId | undefined,
): GameState {
  const actor = currentPlayer(state);
  const card = handCardById(actor, cardId);
  const effect = applyEffect(state, actor, card, targetPigId);

  // Attached cards stay on the pig, everything else goes to the discard pile.
  const discarded = isAttachedCard(card.type) ? [] : [card];

  return appendLog(
    {
      ...state,
      players: withoutHandCard(effect.players, actor.id, cardId),
      discardPile: [
        ...state.discardPile,
        ...discarded,
        ...effect.releasedCards,
      ],
      pendingCardIds: nextPending(state, cardId, effect.pendingCardIds),
    },
    logLine(actor.name, effect.logText),
  );
}

/** Puts a card on the discard pile without using it. */
function discardCard(state: GameState, cardId: string): GameState {
  const actor = currentPlayer(state);
  const card = handCardById(actor, cardId);

  return appendLog(
    {
      ...state,
      players: withoutHandCard(state.players, actor.id, cardId),
      discardPile: [...state.discardPile, card],
      pendingCardIds: nextPending(state, cardId, undefined),
    },
    logLine(actor.name, LOG_TEXTS.discard(CARD_NAMES[card.type])),
  );
}

/** Blockade rule: discard the whole hand, the refill draws three new cards. */
function redrawHand(state: GameState): GameState {
  const actor = currentPlayer(state);

  return appendLog(
    {
      ...state,
      players: state.players.map((player) =>
        player.id === actor.id ? { ...player, hand: [] } : player,
      ),
      discardPile: [...state.discardPile, ...actor.hand],
    },
    logLine(actor.name, LOG_TEXTS.redraw),
  );
}

/**
 * Per card type: how it changes the table.
 *
 * @remarks
 * A lookup instead of an if-else chain. Legality has already been checked by
 * {@link isLegalMove}, so each effect may assume a valid target.
 */
const EFFECTS: Readonly<
  Record<
    ActionCardType,
    (
      state: GameState,
      actor: Player,
      card: Card,
      targetPigId: PigId | undefined,
    ) => EffectResult
  >
> = {
  mud: (state, actor, card, targetPigId) => ({
    players: updatePig(state.players, targetPigId!, (pig) => ({
      ...pig,
      isDirty: true,
    })),
    releasedCards: [],
    logText: LOG_TEXTS.mud,
  }),

  rain: (state) => {
    // Every dirty pig without a stall gets washed clean - the own ones too.
    // A Schönsau carries an umbrella and stays as it is.
    const isWashed = (pig: Pig) =>
      pig.isDirty && !hasBarn(pig) && !hasBeauty(pig);
    const cleaned = state.players
      .flatMap((player) => player.pigs)
      .filter(isWashed).length;
    const players = state.players.map((player) => ({
      ...player,
      pigs: player.pigs.map((pig) =>
        isWashed(pig) ? { ...pig, isDirty: false } : pig,
      ),
    }));
    return { players, releasedCards: [], logText: LOG_TEXTS.rain(cleaned) };
  },

  barn: (state, actor, card, targetPigId) => ({
    players: updatePig(state.players, targetPigId!, (pig) => ({
      ...pig,
      barn: card,
    })),
    releasedCards: [],
    logText: LOG_TEXTS.barn,
  }),

  lightning: (state, actor, card, targetPigId) => {
    // The stall burns down and takes the nailed door with it. A Schönsau lies
    // on the pig, not in the stall, so it survives.
    const victim = ownerOfPig(state, targetPigId!);
    const pig = victim.pigs.find((candidate) => candidate.id === targetPigId)!;
    return {
      players: updatePig(state.players, targetPigId!, (target) => ({
        ...target,
        barn: null,
        lightningRod: null,
        barnDoor: null,
      })),
      releasedCards: [pig.barn, pig.lightningRod, pig.barnDoor].filter(
        (attached): attached is Card => attached !== null,
      ),
      logText: LOG_TEXTS.lightning(victim.name),
    };
  },

  lightningRod: (state, actor, card, targetPigId) => ({
    players: updatePig(state.players, targetPigId!, (pig) => ({
      ...pig,
      lightningRod: card,
    })),
    releasedCards: [],
    logText: LOG_TEXTS.lightningRod,
  }),

  farmerScrubs: (state, actor, card, targetPigId) => ({
    players: updatePig(state.players, targetPigId!, (pig) => ({
      ...pig,
      isDirty: false,
    })),
    releasedCards: [],
    logText: LOG_TEXTS.farmerScrubs(ownerOfPig(state, targetPigId!).name),
  }),

  barnDoor: (state, actor, card, targetPigId) => ({
    players: updatePig(state.players, targetPigId!, (pig) => ({
      ...pig,
      barnDoor: card,
    })),
    releasedCards: [],
    logText: LOG_TEXTS.barnDoor,
  }),

  // The Schönsau is laid on the pig card - what is underneath stays untouched.
  beauty: (state, actor, card, targetPigId) => ({
    players: updatePig(state.players, targetPigId!, (pig) => ({
      ...pig,
      beauty: card,
    })),
    releasedCards: [],
    logText: LOG_TEXTS.beauty(ownerOfPig(state, targetPigId!).name),
  }),

  // Aus-dem-Staub takes the Schönsau off; both cards go to the discard pile
  // and whatever was hidden underneath shows again.
  dustOff: (state, actor, card, targetPigId) => {
    const victim = ownerOfPig(state, targetPigId!);
    const pig = victim.pigs.find((candidate) => candidate.id === targetPigId)!;
    return {
      players: updatePig(state.players, targetPigId!, (target) => ({
        ...target,
        beauty: null,
      })),
      releasedCards: pig.beauty === null ? [] : [pig.beauty],
      logText: LOG_TEXTS.dustOff(victim.name, pig.isDirty),
    };
  },

  // The lucky bird itself does nothing to the table - it hands the player
  // their other two cards to use at once.
  luckyBird: (state, actor, card) => ({
    players: state.players,
    releasedCards: [],
    logText: LOG_TEXTS.luckyBird,
    pendingCardIds: actor.hand
      .filter((other) => other.id !== card.id && other.type !== "luckyBird")
      .map((other) => other.id),
  }),
};

/** Dispatches to the effect of the played card. */
function applyEffect(
  state: GameState,
  actor: Player,
  card: Card,
  targetPigId: PigId | undefined,
): EffectResult {
  return EFFECTS[card.type](state, actor, card, targetPigId);
}

/**
 * Works out what is still pending after a card was used.
 *
 * @remarks
 * A Glücksvogel opens the list; every card used afterwards takes itself off it
 * again. Further Glücksvögel are never added - the rules say they are dropped
 * unused, which happens because they are not in the list and the refill throws
 * the rest of the hand away.
 */
function nextPending(
  state: GameState,
  usedCardId: string,
  opened: readonly string[] | undefined,
): readonly string[] {
  return opened ?? state.pendingCardIds.filter((id) => id !== usedCardId);
}

/**
 * Draws until the active player holds a full hand again.
 *
 * @param state - the state after the move
 * @param dropRestOfHand - true at the end of a Glücksvogel turn
 */
function refillHand(state: GameState, dropRestOfHand: boolean): GameState {
  let current = dropRestOfHand ? discardRestOfHand(state) : state;
  const actorId = currentPlayer(state).id;

  while (
    current.players.find((player) => player.id === actorId)!.hand.length <
    HAND_SIZE
  ) {
    const drawn = drawCard(current);
    if (drawn === null) {
      // Neither pile holds a card - nothing left to draw.
      break;
    }
    current = {
      ...drawn.state,
      players: drawn.state.players.map((player) =>
        player.id === actorId
          ? { ...player, hand: [...player.hand, drawn.card] }
          : player,
      ),
    };
  }

  return current;
}

/**
 * Throws away what is left in hand, so the refill draws a full three.
 *
 * @remarks
 * Ends a Glücksvogel turn: "Hat der Spieler einen zweiten oder dritten
 * Glücksvogel auf der Hand, werden diese Karten ungenutzt mit abgelegt.
 * Danach zieht der Spieler drei neue Karten."
 */
function discardRestOfHand(state: GameState): GameState {
  const actor = currentPlayer(state);
  let next = state;

  if (actor.hand.length > 0) {
    next = {
      ...state,
      players: state.players.map((player) =>
        player.id === actor.id ? { ...player, hand: [] } : player,
      ),
      discardPile: [...state.discardPile, ...actor.hand],
    };
  }

  return next;
}

/** Takes the top card, reshuffling the discard pile when the deck runs out. */
function drawCard(state: GameState): { card: Card; state: GameState } | null {
  const ready = state.drawPile.length > 0 ? state : reshuffleDiscard(state);
  let result: { card: Card; state: GameState } | null;

  if (ready.drawPile.length === 0) {
    result = null;
  } else {
    const [card, ...rest] = ready.drawPile;
    result = { card, state: { ...ready, drawPile: rest } };
  }

  return result;
}

/** Shuffles the discard pile into a new draw pile. */
function reshuffleDiscard(state: GameState): GameState {
  let next = state;

  if (state.discardPile.length > 0) {
    const shuffled: { items: Card[]; state: RandomState } = shuffle(
      state.discardPile,
      state.random,
    );
    next = appendLog(
      {
        ...state,
        drawPile: shuffled.items,
        discardPile: [],
        random: shuffled.state,
      },
      LOG_TEXTS.reshuffle,
    );
  }

  return next;
}

/** Checks for a winner without passing the turn on. */
function checkWinner(state: GameState): GameState {
  const actor = currentPlayer(state);
  return hasWon(actor)
    ? appendLog(
        { ...state, winnerId: actor.id, pendingCardIds: [] },
        LOG_TEXTS.win(actor.name),
      )
    : state;
}

/** Checks for a winner and otherwise passes the turn on. */
function finishTurn(state: GameState): GameState {
  const checked = checkWinner(state);
  let next = checked;

  if (checked.winnerId === null) {
    next = {
      ...checked,
      currentPlayerIndex:
        (checked.currentPlayerIndex + 1) % checked.players.length,
    };
  }

  return next;
}

/** Replaces one pig, leaving every other player and pig untouched. */
function updatePig(
  players: readonly Player[],
  pigId: PigId,
  update: (pig: Pig) => Pig,
): Player[] {
  return players.map((player) => ({
    ...player,
    pigs: player.pigs.map((pig) => (pig.id === pigId ? update(pig) : pig)),
  }));
}

/** Removes a card from a player's hand. */
function withoutHandCard(
  players: readonly Player[],
  playerId: string,
  cardId: string,
): Player[] {
  return players.map((player) =>
    player.id === playerId
      ? { ...player, hand: player.hand.filter((card) => card.id !== cardId) }
      : player,
  );
}

/** Appends a log line with a stable id. */
function appendLog(state: GameState, text: string): GameState {
  return {
    ...state,
    log: [...state.log, { id: state.nextLogId, text }],
    nextLogId: state.nextLogId + 1,
  };
}
