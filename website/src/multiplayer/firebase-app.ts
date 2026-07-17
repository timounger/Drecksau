/**
 * Lazily starts Firebase in the browser and signs the player in anonymously.
 *
 * @module
 * @remarks
 * Everything here runs only when the online mode is actually used, never during
 * the static prerender. Both the app and the anonymous sign-in are set up once
 * and then reused, so opening the lobby twice does not start a second Firebase.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  type Auth,
} from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
import { FIREBASE_CONFIG } from "./firebase-config";

/** Reuses the running app or starts it the first time it is needed. */
function firebaseApp(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
}

/**
 * The Realtime Database handle.
 *
 * @returns the database of the configured project
 */
export function database(): Database {
  return getDatabase(firebaseApp());
}

/**
 * Signs the player in anonymously and returns their stable id.
 *
 * @returns the anonymous user id, unique per browser session
 * @remarks
 * The id doubles as the player's seat id: it is stable while the tab lives and
 * unique across players, which is exactly what a seat needs. Resolves as soon
 * as Firebase reports a signed-in user, whether it had to create one or a
 * previous session was still valid.
 */
export function signIn(): Promise<string> {
  const auth: Auth = getAuth(firebaseApp());
  return new Promise<string>((resolve, reject) => {
    const stop = onAuthStateChanged(
      auth,
      (user) => {
        if (user !== null) {
          stop();
          resolve(user.uid);
        }
      },
      (error) => {
        stop();
        reject(error);
      },
    );
    // Kicks off a sign-in if none is restored; the listener above delivers the
    // uid either way, so the result of this call itself is not needed.
    signInAnonymously(auth).catch(reject);
  });
}
