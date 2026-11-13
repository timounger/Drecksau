/**
 * IMPERAVIS on screen: the main menu, or the 3D map with the screen laid
 * over it - the resource bar on top, the island overview on the left, the
 * object window, notifications and minimap on the right, the build bar at
 * the bottom with the build window above it, the administration and the
 * world map between, and the pause menu.
 *
 * @module
 * @remarks
 * The map is a canvas drawn by three.js; everything one reads or clicks is
 * DOM laid over it in a grid, so no two panels can lie on each other and the
 * middle of the map stays free. On a phone the grid has one column and only
 * one panel is open at a time, each folding away behind the bar's buttons.
 * On large screens the whole layer grows with `--imp-scale`.
 */
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { GameHeader } from "@/components/game-header";
import { HUMAN } from "@/games/imperavis/engine/players";
import type { Game } from "@/games/imperavis/engine/types";
import { useImperavis } from "@/games/imperavis/hooks/use-imperavis";
import { HUD } from "@/games/imperavis/i18n/hud-texts";
import { IMPERAVIS_RULES } from "@/games/imperavis/i18n/rules";
import { TEXTS as T } from "@/games/imperavis/i18n/texts";
import { TUTORIAL } from "@/games/imperavis/i18n/tutorial-texts";
import type { Pick } from "@/games/imperavis/render/view";
import type { SavedGame } from "@/games/imperavis/storage/save-store";
import { useFullscreen } from "@/lib/screen/use-fullscreen";
import {
  BuildBar,
  BuildModeBar,
  BuildWindow,
  type BuildGroup,
} from "./build-menu";
import { Icon } from "./icons";
import { InfoPanel } from "./info-panel";
import { IslandPanel } from "./island-panel";
import { MainMenu } from "./main-menu";
import { Minimap, WorldMap } from "./minimap";
import { Notifications } from "./notifications";
import { AdminWindow, type Overview } from "./overviews";
import { TopBar } from "./top-bar";
import { TutorialPanel } from "./tutorial-panel";
import { Btn, Panel, TipLayer } from "./ui";
import { worldTipText } from "./world-tip";
import "./imperavis.css";

/** Below this width (px) the screen has one column. */
const NARROW = 768;

/** Notifications shown at once on a phone and elsewhere. */
const PHONE_NOTES = 2;
const NOTES = 5;

/** The large window in the middle, if any. */
type Big =
  | { readonly type: "admin"; readonly tab: Overview }
  | { readonly type: "world" }
  | null;

/** The panel open on a phone (only one at a time). */
type PhonePanel = "island" | "info" | "build" | "big" | null;

/**
 * Renders the game.
 *
 * @returns the screen
 */
export function ImperavisGame(): ReactElement {
  const {
    phase,
    game,
    tick,
    tool,
    selection,
    canvasRef,
    speed,
    speeds,
    hint,
    messages,
    menuOpen,
    hoverTip,
    fps,
    hasAutosave,
    slots,
    unreadable,
    cheat,
    toggleCheat,
    newGame,
    continueGame,
    loadFrom,
    saveTo,
    toMenu,
    setMenuOpen,
    setSpeed,
    setTool,
    select,
    command,
    focus,
    dismiss,
    viewArea,
    bindScreen,
    groups,
  } = useImperavis();
  const stageRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(stageRef);
  const [narrow, setNarrow] = useState(false);
  const [touch, setTouch] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [barOpen, setBarOpen] = useState(true);
  const [group, setGroup] = useState<BuildGroup | null>(null);
  const [lastGroup, setLastGroup] = useState<BuildGroup>("housing");
  const [big, setBig] = useState<Big>(null);
  const [viewIsland, setViewIsland] = useState<number | null>(null);

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${NARROW - 1}px)`);
    const apply = () => {
      setNarrow(query.matches);
      if (query.matches) {
        setLeftOpen(false);
      }
    };
    apply();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the kind of pointer is only known in the browser
    setTouch(window.matchMedia("(pointer: coarse)").matches);
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  // On a phone a picked thing takes the room of the other panels.
  useEffect(() => {
    if (selection.type !== "none" && narrow) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the selection comes from the map
      setLeftOpen(false);
      setGroup(null);
      setBig(null);
    }
  }, [selection, narrow]);

  /** Opens one panel on a phone and closes the others. */
  const only = useCallback(
    (panel: PhonePanel) => {
      if (narrow) {
        if (panel !== "island") {
          setLeftOpen(false);
        }
        if (panel !== "build") {
          setGroup(null);
        }
        if (panel !== "big") {
          setBig(null);
        }
        if (panel !== "info" && selection.type !== "none") {
          select({ type: "none" });
        }
      }
    },
    [narrow, select, selection.type],
  );

  /** Opens a category of the build menu (or closes it with null). */
  const openGroup = useCallback(
    (next: BuildGroup | null) => {
      only("build");
      setBig(null);
      setGroup(next);
      if (next !== null) {
        setLastGroup(next);
      }
    },
    [only],
  );

  // Esc closes the open window before the selection and the pause menu; B
  // opens and closes the build menu. The keys themselves are read by the
  // map's input.
  useEffect(() => {
    bindScreen({
      closeWindow: () => {
        const open = group !== null || big !== null;
        setGroup(null);
        setBig(null);
        return open;
      },
      toggleBuildMenu: () => openGroup(group === null ? lastGroup : null),
    });
    return () => bindScreen(null);
  }, [big, bindScreen, group, lastGroup, openGroup]);

  const chooseTool = useCallback(
    (next: Parameters<typeof setTool>[0]) => {
      setTool(next);
      // Into the build mode the window steps aside, so the map is free.
      if (
        next.type === "build" ||
        next.type === "road" ||
        next.type === "pave"
      ) {
        setGroup(null);
      }
    },
    [setTool],
  );

  const island = activeIsland(game, selection, viewIsland);
  const playing =
    phase === "playing" || phase === "loading" || phase === "error";
  const openAdmin = (tab: Overview) => {
    only("big");
    setGroup(null);
    setBig({ type: "admin", tab });
  };
  const badges: Partial<Record<Overview, number>> =
    game === null
      ? {}
      : {
          diplomacy: game.diplomacy.offers.filter((offer) => offer.to === HUMAN)
            .length,
          missions: game.missions.filter(
            (m) => m.state === "offered" && m.taker === HUMAN,
          ).length,
        };
  const adminBadge = (badges.diplomacy ?? 0) + (badges.missions ?? 0);
  const showInfo = selection.type !== "none" && big === null;
  // An own shipyard or barracks opens its window large, in the middle.
  const workshop = showInfo && game !== null && workshopPicked(game, selection);
  const task =
    game === null ? null : (
      <TutorialPanel
        game={game}
        onFocus={focus}
        onSelect={select}
        onGroup={(next) => openGroup(next)}
        onCommand={command}
        className="md:w-[19rem]"
      />
    );

  return (
    <div
      className={`mx-auto flex w-full flex-1 flex-col gap-2 p-2 sm:p-3 ${
        phase === "menu" ? "max-w-[1800px]" : ""
      }`}
    >
      <GameHeader rules={IMPERAVIS_RULES} title={T.title} subtitle={T.tagline}>
        <button
          type="button"
          data-testid="imp-cheat"
          aria-pressed={cheat}
          title={cheat ? T.cheatOff : T.cheatOn}
          onClick={(event) => {
            toggleCheat();
            // Off the button again, or Space would toggle it instead of pausing.
            event.currentTarget.blur();
          }}
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${
            cheat
              ? "border-pink-500 bg-pink-100 font-semibold text-pink-900 dark:bg-pink-900/40 dark:text-pink-100"
              : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }`}
        >
          {T.cheat}
        </button>
        {playing && (
          <HeaderButton
            onClick={() => setMenuOpen(true)}
            testId="imp-menu-button"
          >
            {T.menu}
          </HeaderButton>
        )}
        {playing && fullscreen.supported && (
          <HeaderButton onClick={fullscreen.toggle} testId="imp-fullscreen">
            {T.fullscreen}
          </HeaderButton>
        )}
      </GameHeader>
      {phase === "menu" ? (
        <MainMenu
          hasAutosave={hasAutosave}
          slots={slots}
          unreadable={unreadable}
          showSeed={cheat}
          onNew={newGame}
          onContinue={continueGame}
          onLoad={loadFrom}
        />
      ) : (
        <div
          ref={stageRef}
          data-theme="dark"
          className={`imp-root relative overflow-hidden bg-[#10202c] select-none ${
            fullscreen.active
              ? "h-dvh w-full"
              : "h-[calc(100dvh-13rem)] min-h-[520px] rounded-xl sm:h-[calc(100dvh-7.5rem)]"
          }`}
          data-testid="imp-stage"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full touch-none"
            data-testid="imp-canvas"
          />
          {phase === "loading" && (
            <div className="imp-display absolute inset-0 flex items-center justify-center text-lg text-[var(--imp-gold)]">
              {T.loading}
            </div>
          )}
          {phase === "error" && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white">
              {T.noWebgl}
            </div>
          )}
          {phase === "playing" && game !== null && (
            <div className="imp-hud imp-layout">
              <div className="imp-area-top">
                <TopBar
                  game={game}
                  island={island}
                  fps={fps}
                  speed={speed}
                  speeds={speeds}
                  onSpeed={setSpeed}
                  onOpen={openAdmin}
                />
              </div>
              {narrow ? (
                <div className="imp-area-center">
                  <Notifications
                    messages={messages}
                    onDismiss={dismiss}
                    onFocus={focus}
                    most={PHONE_NOTES}
                    alertsOnly={big !== null || group !== null || showInfo}
                  />
                  <div className="flex min-h-0 flex-1 flex-col items-start justify-end">
                    {big?.type === "admin" && (
                      <AdminWindow
                        game={game}
                        which={big.tab}
                        onWhich={(tab) => setBig({ type: "admin", tab })}
                        badges={badges}
                        island={island}
                        onIsland={setViewIsland}
                        onCommand={command}
                        onFocus={focus}
                        onClose={() => setBig(null)}
                        groups={groups}
                        onSelect={select}
                      />
                    )}
                    {big?.type === "world" && (
                      <WorldMap
                        game={game}
                        tick={tick}
                        viewArea={viewArea}
                        onFocus={focus}
                        onWorld={() => setBig(null)}
                        worldOpen
                        onClose={() => setBig(null)}
                      />
                    )}
                    {big === null && group !== null && (
                      <BuildWindow
                        game={game}
                        island={island}
                        group={group}
                        tool={tool}
                        onTool={chooseTool}
                        onClose={() => setGroup(null)}
                      />
                    )}
                    {big === null && group === null && showInfo && (
                      <InfoPanel
                        game={game}
                        selection={selection}
                        onCommand={command}
                        onTool={setTool}
                        onClose={() => select({ type: "none" })}
                        onSelect={select}
                      />
                    )}
                    {big === null && group === null && !showInfo && (
                      <IslandPanel
                        game={game}
                        island={island}
                        open={leftOpen}
                        onToggle={() => {
                          only("island");
                          setLeftOpen(!leftOpen);
                        }}
                        onIsland={setViewIsland}
                        onFocus={focus}
                        onAll={() => openAdmin("islands")}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="imp-area-left">
                    <div className="flex min-h-0 w-full flex-col items-start">
                      <IslandPanel
                        game={game}
                        island={island}
                        open={leftOpen}
                        onToggle={() => setLeftOpen(!leftOpen)}
                        onIsland={setViewIsland}
                        onFocus={focus}
                        onAll={() => openAdmin("islands")}
                      />
                    </div>
                    <div className="w-full shrink-0 md:w-auto">{task}</div>
                  </div>
                  <div className="imp-area-center items-center justify-end">
                    {big?.type === "admin" && (
                      <AdminWindow
                        game={game}
                        which={big.tab}
                        onWhich={(tab) => setBig({ type: "admin", tab })}
                        badges={badges}
                        island={island}
                        onIsland={setViewIsland}
                        onCommand={command}
                        onFocus={focus}
                        onClose={() => setBig(null)}
                        groups={groups}
                        onSelect={select}
                      />
                    )}
                    {big?.type === "world" && (
                      <WorldMap
                        game={game}
                        tick={tick}
                        viewArea={viewArea}
                        onFocus={focus}
                        onWorld={() => setBig(null)}
                        worldOpen
                        onClose={() => setBig(null)}
                      />
                    )}
                    {big === null && group === null && workshop && (
                      <div
                        className="flex max-h-full min-h-0 w-full max-w-[54rem] flex-col"
                        data-testid="imp-workshop"
                      >
                        <InfoPanel
                          game={game}
                          selection={selection}
                          onCommand={command}
                          onTool={setTool}
                          onClose={() => select({ type: "none" })}
                          onSelect={select}
                          wide
                        />
                      </div>
                    )}
                    {big === null && group !== null && (
                      <div className="flex max-h-[34rem] min-h-0 w-full max-w-[66rem] flex-col">
                        <BuildWindow
                          game={game}
                          island={island}
                          group={group}
                          tool={tool}
                          onTool={chooseTool}
                          onClose={() => setGroup(null)}
                        />
                      </div>
                    )}
                  </div>
                  <div className="imp-area-right w-[22rem] max-w-[34vw]">
                    <Notifications
                      messages={messages}
                      onDismiss={dismiss}
                      onFocus={focus}
                      most={NOTES}
                    />
                    <div className="flex min-h-0 w-full flex-1 flex-col items-end">
                      {showInfo && (!workshop || group !== null) && (
                        <InfoPanel
                          game={game}
                          selection={selection}
                          onCommand={command}
                          onTool={setTool}
                          onClose={() => select({ type: "none" })}
                          onSelect={select}
                        />
                      )}
                    </div>
                    <Minimap
                      game={game}
                      tick={tick}
                      viewArea={viewArea}
                      onFocus={focus}
                      onWorld={() => {
                        setGroup(null);
                        setBig(
                          big?.type === "world" ? null : { type: "world" },
                        );
                      }}
                      worldOpen={big?.type === "world"}
                    />
                  </div>
                </>
              )}
              <div className="imp-area-bottom">
                {narrow && group === null && big === null && !showInfo && (
                  <div className="w-full">{task}</div>
                )}
                <div className="flex w-full max-w-[60rem] flex-col items-stretch gap-1.5">
                  <BuildModeBar
                    game={game}
                    island={island}
                    tool={tool}
                    hint={hint}
                    onTool={setTool}
                    touch={touch}
                  />
                </div>
                <BuildBar
                  game={game}
                  group={
                    group ??
                    (tool.type === "road" || tool.type === "pave"
                      ? "infrastructure"
                      : null)
                  }
                  onGroup={openGroup}
                  tool={tool}
                  onTool={setTool}
                  adminOpen={big?.type === "admin"}
                  onAdmin={() => {
                    if (big?.type === "admin") {
                      setBig(null);
                    } else {
                      openAdmin("finance");
                    }
                  }}
                  adminBadge={adminBadge}
                  mapOpen={big?.type === "world"}
                  onMap={() => {
                    only("big");
                    setGroup(null);
                    setBig(big?.type === "world" ? null : { type: "world" });
                  }}
                  open={barOpen || narrow}
                  onToggle={() => setBarOpen(!barOpen)}
                />
              </div>
            </div>
          )}
          {phase === "playing" && game !== null && menuOpen && (
            <PauseMenu
              guided={game.tutorial.active}
              onEndTutorial={() => command({ type: "tutorialEnd" })}
              onResume={() => setMenuOpen(false)}
              onSave={saveTo}
              onLoad={loadFrom}
              onMainMenu={toMenu}
              slots={slots}
            />
          )}
          <TipLayer
            root={stageRef}
            world={
              hoverTip === null || game === null
                ? null
                : tipAt(worldTipText(game, hoverTip.hit), hoverTip)
            }
          />
        </div>
      )}
    </div>
  );
}

/** A button of the shared header, in the header's plain style. */
/**
 * Whether the selection is a finished shipyard or barracks of the human:
 * their windows open large.
 *
 * @param game - the game
 * @param selection - what is selected
 * @returns true for an own shipyard or barracks
 */
function workshopPicked(game: Game, selection: Pick): boolean {
  const building =
    selection.type === "building"
      ? game.buildings.find((b) => b.id === selection.id)
      : undefined;
  return (
    building !== undefined &&
    building.complete &&
    (building.yard !== null || building.drill !== null) &&
    game.islands[building.island].owner === HUMAN
  );
}

function HeaderButton({
  onClick,
  testId,
  children,
}: {
  readonly onClick: () => void;
  readonly testId: string;
  readonly children: string;
}): ReactElement {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={(event) => {
        onClick();
        event.currentTarget.blur();
      }}
      className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {children}
    </button>
  );
}

/** A map tooltip at the mouse, or none without words. */
function tipAt(
  text: string | null,
  at: { readonly x: number; readonly y: number },
): { text: string; x: number; y: number } | null {
  return text === null ? null : { text, x: at.x, y: at.y };
}

/** The island whose goods the panels show. */
function activeIsland(
  game: Game | null,
  selection: Pick,
  chosen: number | null,
): number {
  let island = game?.world.startIsland ?? 0;
  if (game !== null) {
    const owned = game.islands
      .filter((state) => state.owner === HUMAN)
      .map((state) => state.id);
    if (selection.type === "building") {
      island =
        game.buildings.find((b) => b.id === selection.id)?.island ?? island;
    } else if (chosen !== null) {
      island = chosen;
    } else if (owned.length > 0 && !owned.includes(island)) {
      island = owned[0];
    }
  }
  return island;
}

/** The pause menu: on, save, load, settings, end the guided start, main menu. */
function PauseMenu({
  guided,
  onEndTutorial,
  onResume,
  onSave,
  onLoad,
  onMainMenu,
  slots,
}: {
  /** Whether the guided start runs and can be ended here. */
  readonly guided: boolean;
  readonly onEndTutorial: () => void;
  readonly onResume: () => void;
  readonly onSave: (slot: number) => void;
  readonly onLoad: (slot: number) => void;
  readonly onMainMenu: () => void;
  readonly slots: readonly (SavedGame | null)[];
}): ReactElement {
  const numbers = slots.map((_, index) => index + 1);
  const [confirm, setConfirm] = useState(false);
  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 p-3"
      data-testid="imp-pause-menu"
    >
      <Panel className="imp-hud imp-open flex w-full max-w-80 flex-col gap-2 p-4">
        <h2 className="imp-title flex items-center gap-2 text-lg">
          <Icon name="pause" size={18} /> {T.menu}
        </h2>
        <div className="imp-rule" />
        <Btn icon="play" onClick={onResume} testId="imp-resume">
          {T.resume}
        </Btn>
        <p className="imp-muted text-xs">{T.save}</p>
        <div className="grid grid-cols-3 gap-1">
          {numbers.map((slot) => (
            <Btn
              key={slot}
              small
              onClick={() => onSave(slot)}
              testId={`imp-save-${slot}`}
            >
              {T.slot(slot)}
            </Btn>
          ))}
        </div>
        <p className="imp-muted text-xs">{T.load}</p>
        <div className="grid grid-cols-3 gap-1">
          {numbers.map((slot) => (
            <Btn
              key={slot}
              small
              disabled={slots[slot - 1] === null}
              onClick={() => onLoad(slot)}
              testId={`imp-loadslot-${slot}`}
            >
              {T.slot(slot)}
            </Btn>
          ))}
        </div>
        <Link
          href="/imperavis/einstellungen"
          className="imp-btn min-h-8 px-3 py-1 text-sm"
        >
          <Icon name="gear" size={16} /> {T.settings}
        </Link>
        {guided && !confirm && (
          <Btn
            icon="star"
            tip={TUTORIAL.endTip}
            onClick={() => setConfirm(true)}
            testId="imp-pause-end-tutorial"
          >
            {TUTORIAL.end}
          </Btn>
        )}
        {guided && confirm && (
          <div className="imp-inset flex flex-col gap-1.5 p-2 text-xs">
            <p>{TUTORIAL.endConfirm}</p>
            <div className="flex flex-wrap gap-1">
              <Btn
                small
                danger
                onClick={() => {
                  onEndTutorial();
                  setConfirm(false);
                }}
                testId="imp-pause-end-yes"
              >
                {TUTORIAL.endYes}
              </Btn>
              <Btn small onClick={() => setConfirm(false)}>
                {TUTORIAL.endNo}
              </Btn>
            </div>
          </div>
        )}
        <Btn icon="chevronLeft" onClick={onMainMenu} testId="imp-main-menu">
          {T.mainMenu}
        </Btn>
        <p className="imp-faint text-[10px]">{HUD.keysHelp}</p>
      </Panel>
    </div>
  );
}
