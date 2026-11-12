/**
 * Wurfduell against the computer: the fighter choice with the difficulty, the
 * field and the end of the match.
 *
 * @module
 * @remarks
 * There is no menu in front of it. Opening the page means playing against the
 * computer; the other way to play - online - is the button in the header, the
 * same as in every online game of the collection.
 */
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from "react";
import { GameHeader } from "@/components/game-header";

import type { CharacterId, DuelGame } from "@/games/wurfduell/engine/types";
import {
  createSoundPlayer,
  type SoundPlayer,
} from "@/games/wurfduell/audio/sounds";
import { useWurfduell } from "@/games/wurfduell/hooks/use-wurfduell";
import { WURFDUELL_RULES } from "@/games/wurfduell/i18n/rules";
import { WURFDUELL_TEXTS as T } from "@/games/wurfduell/i18n/texts";
import {
  difficultySetting,
  lastCharacterSetting,
  mutedSetting,
} from "@/games/wurfduell/settings/preferences";
import type { StoredValue } from "@/lib/storage/stored-value";
import { ArenaView } from "./arena-view";
import { CharacterPicker } from "./character-picker";
import { MatchOverPanel } from "./match-over-panel";

/** The seat of the player at this screen. */
const HUMAN = 0;

/**
 * Renders the game against the computer.
 *
 * @returns the screen
 */
export function WurfduellGame(): ReactElement {
  const difficulty = useStored(difficultySetting);
  const names = useMemo(
    () => [T.you, `${T.computer} (${T.difficulties[difficulty]})`],
    [difficulty],
  );
  const duel = useWurfduell(names, difficulty);
  const sound = useGameSound();
  const game = duel.game;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
      <GameHeader rules={WURFDUELL_RULES} title={T.title} subtitle={T.tagline}>
        {game !== null && (
          <button
            type="button"
            data-testid="wd-new-match"
            onClick={duel.reset}
            className="cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {T.newMatch}
          </button>
        )}
        <Link
          href="/wurfduell/online"
          data-testid="wd-online-link"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {T.online}
        </Link>
        <Link
          href="/wurfduell/einstellungen"
          data-testid="wd-settings-link"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {T.settings}
        </Link>
        <Link
          href="/wurfduell/statistik"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {T.statistics}
        </Link>
      </GameHeader>
      {game === null || game.phase === "pick" ? (
        <LocalPick
          onPick={(character) => {
            sound.resume();
            duel.pick(character);
          }}
          sound={sound}
        />
      ) : (
        <LocalField game={game} names={names} duel={duel} sound={sound} />
      )}
    </div>
  );
}

/**
 * The sound player, following the stored switch.
 *
 * @returns the player for this screen
 */
export function useGameSound(): SoundPlayer {
  const sound = useMemo(() => createSoundPlayer(true), []);
  const muted = useStored(mutedSetting);
  useEffect(() => {
    sound.setMuted(muted);
  }, [muted, sound]);
  return sound;
}

/** Reads a remembered value without breaking hydration. */
function useStored<V>(store: StoredValue<V>): V {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
}

/** Choosing a fighter, with the computer's difficulty beside it. */
function LocalPick({
  onPick,
  sound,
}: {
  readonly onPick: (character: CharacterId) => void;
  readonly sound: SoundPlayer;
}): ReactElement {
  const remembered = useStored(lastCharacterSetting);
  const [chosen, setChosen] = useState<CharacterId | null>(null);
  const selected = chosen ?? remembered;
  const confirm = useCallback(() => {
    sound.play("pick");
    lastCharacterSetting.save(selected);
    onPick(selected);
  }, [onPick, selected, sound]);
  return (
    <CharacterPicker
      title={T.pickTitle}
      selected={selected}
      onSelect={(id) => {
        sound.play("pick");
        setChosen(id);
      }}
      onConfirm={confirm}
    />
  );
}

/** The field, and the end-of-match panel over it. */
function LocalField({
  game,
  names,
  duel,
  sound,
}: {
  readonly game: DuelGame;
  readonly names: readonly string[];
  readonly duel: ReturnType<typeof useWurfduell>;
  readonly sound: SoundPlayer;
}): ReactElement {
  const over = game.phase === "over" && duel.settled;
  return (
    <>
      <ArenaView
        game={game}
        names={names}
        controlSeat={HUMAN}
        onThrow={duel.throwFor}
        sound={sound}
        onSettled={duel.settle}
        onResign={duel.resign}
        overlay={
          over ? (
            <MatchOverPanel
              game={game}
              names={names}
              viewer={HUMAN}
              onRematch={() => duel.rematch(game.players[HUMAN].character)}
              rematchLabel={T.rematch}
              onLeave={() => duel.rematch(null)}
              leaveLabel={T.otherFighter}
            />
          ) : null
        }
      />
    </>
  );
}
