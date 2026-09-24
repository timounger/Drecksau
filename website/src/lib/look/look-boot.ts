/**
 * Which face the start page wears, decided before the first paint.
 *
 * @module
 * @remarks
 * The same problem as the theme, and therefore the same answer: the choice
 * lives in this browser, the page is a static file, and a layout that is
 * corrected after hydration is a page that rearranges itself in front of the
 * reader. So the choice is written onto `<html>` by a script the browser runs
 * while it is still parsing the head, and the stylesheet does the rest - see
 * the `look-*` variants in app/globals.css.
 *
 * That is why the three looks are **one piece of markup**. Everything they
 * need is always in the page; which of it is shown, how big, and in how many
 * columns is a matter of CSS. Nothing here needs React to change its mind
 * about anything, so nothing here can flash.
 *
 * Kept free of anything client-only on purpose: the layout is a server
 * component and imports the script text from here.
 */
import { storageKey } from "@/lib/storage/local-store";

/**
 * How the collection may be laid out.
 *
 * @remarks
 * - `showcase` - a shop window: a banner for the game at the top of the
 *   charts, then shelves of wide cards with cover art.
 * - `dashboard` - a console menu: square tiles, name underneath, no prose.
 * - `plain` - the quiet one: the shelves as a reading list, small icon, name
 *   and one line about it.
 */
export type CollectionLook = "showcase" | "dashboard" | "plain";

/** The attribute the choice is written to, on the root element. */
export const LOOK_ATTRIBUTE = "data-look";

/** Storage key of the chosen look, shared by every page. */
export const LOOK_KEY = storageKey("app", "collection-look");

/** Schema version of the stored choice - raise it on breaking changes. */
export const LOOK_VERSION = 1;

/**
 * What the page looks like until somebody says otherwise.
 *
 * @remarks
 * The shop window, because that is what this page is: a wall of games to pick
 * from. It is also the look that survives having no attribute at all - see
 * the boot script - so a reader without JavaScript gets it too.
 */
export const DEFAULT_LOOK: CollectionLook = "showcase";

/**
 * The script that sets the look before the first paint.
 *
 * @remarks
 * Deliberately tiny and defensive, like its counterpart for the theme: it runs
 * before anything else on the page, so a throw here would take the whole
 * document with it.
 *
 * It writes the attribute **only** for the two looks that are not the default.
 * Leaving it off is what makes the default the default in one place - the
 * stylesheet - rather than in two that can drift apart.
 */
export const LOOK_BOOT_SCRIPT = `(function(){try{
var r=localStorage.getItem(${JSON.stringify(LOOK_KEY)});
var p=r?JSON.parse(r).data:null;
if(p==="dashboard"||p==="plain"){document.documentElement.setAttribute(${JSON.stringify(LOOK_ATTRIBUTE)},p);}
}catch(e){}})();`;
