/**
 * The bit of the theme that has to run before the page is painted.
 *
 * @module
 * @remarks
 * A theme is a client-only fact, and the page is a static file: the HTML that
 * arrives knows nothing about what this reader picked. Deciding it in React
 * would mean painting the wrong colours first and correcting them a moment
 * later, which is exactly the flash this avoids - see the framework's own guide
 * at `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`.
 *
 * So the choice is written onto `<html>` by a script the browser runs while it
 * is still parsing the head, before anything is drawn. This module holds that
 * script, and the key it reads, so the script and the store cannot drift apart.
 *
 * Kept free of anything client-only on purpose: the layout is a server
 * component and imports the script text from here.
 */
import { storageKey } from "@/lib/storage/local-store";

/** What the reader chose, or that they want whatever the system says. */
export type ThemePreference = "light" | "dark" | "system";

/** What it actually comes out as. */
export type Theme = "light" | "dark";

/** The attribute the choice is written to, on the root element. */
export const THEME_ATTRIBUTE = "data-theme";

/** Storage key of the chosen theme, shared by every page. */
export const THEME_KEY = storageKey("app", "theme");

/** Schema version of the stored choice - raise it on breaking changes. */
export const THEME_VERSION = 1;

/** The media query that says what the system prefers. */
export const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * The script that sets the theme before the first paint.
 *
 * @remarks
 * Deliberately tiny and defensive. It runs before anything else on the page,
 * so a throw here would take the whole document with it - a browser with
 * storage switched off must simply fall through to the system preference.
 *
 * It writes the attribute **only** when there is a real choice to write.
 * Leaving it off is what lets the stylesheet fall back to the media query, so
 * a reader without JavaScript still gets their system's colours rather than
 * whatever the file happened to be exported with.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{
var r=localStorage.getItem(${JSON.stringify(THEME_KEY)});
var p=r?JSON.parse(r).data:null;
if(p==="light"||p==="dark"){document.documentElement.setAttribute(${JSON.stringify(THEME_ATTRIBUTE)},p);}
}catch(e){}})();`;
