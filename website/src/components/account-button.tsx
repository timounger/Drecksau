/**
 * The account button on the start page, and what it opens.
 *
 * @module
 * @remarks
 * There is no account in the sense of a login - nothing here leaves the
 * browser. What there is, is the pair of things the other players see: the
 * **name** and the **face**. Both were already stored once for all games; this
 * is simply the one place where they are set.
 *
 * One place on purpose. Before this, the face was picked on whichever online
 * screen you happened to open, which meant the same choice lived in seventeen
 * places and none of them looked like where it belonged. Now the online screens
 * only **show** it, and there is exactly one door marked with your own face.
 *
 * Built on the browser's own `<dialog>`, like the rules: Escape closes it,
 * focus stays inside it, and the page behind cannot be tabbed into.
 */
"use client";

import {
  useCallback,
  useRef,
  useSyncExternalStore,
  type ReactElement,
} from "react";
import { Avatar } from "@/online/avatar";
import { useReady } from "@/lib/storage/use-ready";
import type { CollectionLook } from "@/lib/look/look-boot";
import {
  collectionLook,
  serverCollectionLook,
  setCollectionLook,
  subscribeLook,
} from "@/lib/look/look-store";
import { playerNameStore } from "@/online/player-name";
import { StoredAvatarPicker, useChosenAvatar } from "@/online/player-avatar";

/** German labels of the button and the dialog. */
const T = {
  open: "Konto",
  openLabel: "Name und Gesicht ändern",
  title: "Dein Konto",
  hint: "Name und Gesicht sehen deine Mitspieler online. Beides bleibt in diesem Browser.",
  name: "Dein Name",
  namePlaceholder: "z. B. Alex",
  nameEmpty: "Noch kein Name",
  look: "Ansicht der Startseite",
  lookHint: "Wie die Spiele auf der Übersicht stehen.",
  showcase: "Schaufenster",
  showcaseHint: "Banner oben, große Karten mit Bild.",
  dashboard: "Kacheln",
  dashboardHint: "Quadrate mit Namen darunter, sonst nichts.",
  plain: "Schlicht",
  plainHint: "Kleines Zeichen, Name, eine Zeile dazu.",
  close: "Fertig",
} as const;

/** The three looks, in the order they read. */
const LOOKS: readonly {
  readonly value: CollectionLook;
  readonly label: string;
  readonly hint: string;
}[] = [
  { value: "showcase", label: T.showcase, hint: T.showcaseHint },
  { value: "dashboard", label: T.dashboard, hint: T.dashboardHint },
  { value: "plain", label: T.plain, hint: T.plainHint },
];

/** How big the face is on the button, and in the dialog's heading. */
const BUTTON_FACE = 26;

/**
 * The three shapes the start page can take, as a list to pick from.
 *
 * @returns the picker
 * @remarks
 * Here rather than on the start page itself, for the same reason the face is:
 * a setting belongs where one goes to change settings, not in the corner of
 * the thing it changes.
 *
 * The click writes storage **and** the root element in one go, so the page
 * behind the dialog rearranges itself while one is still looking at the list -
 * which is the only honest preview there is.
 */
function LookPicker(): ReactElement {
  const chosen = useSyncExternalStore(
    subscribeLook,
    collectionLook,
    serverCollectionLook,
  );
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{T.look}</span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {T.lookHint}
      </span>
      <div
        role="group"
        aria-label={T.look}
        data-testid="look-picker"
        className="mt-1 flex flex-col gap-2 sm:flex-row"
      >
        {LOOKS.map((look) => (
          <button
            key={look.value}
            type="button"
            aria-pressed={look.value === chosen}
            data-testid={`look-${look.value}`}
            onClick={() => setCollectionLook(look.value)}
            className={`flex-1 cursor-pointer rounded-xl border p-3 text-left transition ${
              look.value === chosen
                ? "border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-500/10"
                : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            <span className="block font-medium">{look.label}</span>
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">
              {look.hint}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * A button showing who you are, which opens the settings for it.
 *
 * @returns the button, with the dialog it owns
 * @remarks
 * The button wears the chosen face rather than a generic person symbol. A
 * generic symbol would say "there is an account here"; the face says "this is
 * who the others see", which is the only thing behind the button anyway.
 */
export function AccountButton(): ReactElement {
  const dialog = useRef<HTMLDialogElement>(null);
  // Through stores, not a lazy initialiser. The page is prerendered without a
  // browser, so reading storage while rendering would make the first render
  // disagree with the HTML that arrived - which costs the whole subtree.
  const name = useSyncExternalStore(
    playerNameStore.subscribe,
    playerNameStore.getSnapshot,
    playerNameStore.getServerSnapshot,
  );
  const face = useChosenAvatar();
  // **Nothing is claimed before it is known.** Name and face come out of this
  // browser's storage, and the prerendered HTML was made without one: for the
  // first moment the button would read "Konto" beside a stand-in face, and
  // then turn into somebody else. A grey pill says the same thing honestly -
  // and it is the same size, so nothing moves when the name arrives.
  const ready = useReady();

  const open = useCallback(() => dialog.current?.showModal(), []);
  const close = useCallback(() => dialog.current?.close(), []);

  // A click on the backdrop lands on the dialog element itself, never on the
  // panel inside it.
  const onBackdrop = useCallback((event: React.MouseEvent) => {
    if (event.target === dialog.current) {
      dialog.current?.close();
    }
  }, []);

  const rename = (next: string) => playerNameStore.save(next);

  return (
    <>
      <button
        type="button"
        data-testid="account-button"
        aria-label={T.openLabel}
        onClick={open}
        aria-busy={ready ? undefined : true}
        className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-zinc-300 py-1 pr-3 pl-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {ready ? (
          <>
            <Avatar id={face} size={BUTTON_FACE} />
            <span className="max-w-32 truncate">
              {name.trim() === "" ? T.open : name}
            </span>
          </>
        ) : (
          <>
            <span
              className="block shrink-0 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800"
              style={{ height: BUTTON_FACE, width: BUTTON_FACE }}
            />
            <span className="block h-3.5 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </>
        )}
      </button>

      <dialog
        ref={dialog}
        data-testid="account-dialog"
        onClick={onBackdrop}
        className="m-auto w-[min(32rem,92vw)] rounded-2xl bg-white p-0 text-zinc-900 backdrop:bg-black/50 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <div className="flex max-h-[85vh] flex-col">
          <header className="flex items-start gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold">{T.title}</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {T.hint}
              </p>
            </div>
            <button
              type="button"
              data-testid="account-close"
              onClick={close}
              className="shrink-0 cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {T.close}
            </button>
          </header>

          <div className="flex flex-col gap-4 overflow-y-auto p-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{T.name}</span>
              <input
                type="text"
                value={name}
                data-testid="account-name"
                onChange={(event) => rename(event.target.value)}
                placeholder={T.namePlaceholder}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>

            {/* Writes straight through to storage, like the name: there is no
                "save" here, because there is nothing that could fail. */}
            <StoredAvatarPicker />

            <LookPicker />
          </div>
        </div>
      </dialog>
    </>
  );
}
