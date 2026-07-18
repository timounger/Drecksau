/**
 * The project's Firebase web configuration.
 *
 * @module
 * @remarks
 * These values are not a secret. A Firebase web config is meant to ship in the
 * browser; the database is protected by its security rules, not by hiding this.
 * That is why the config is committed here rather than kept out of the repo -
 * it just works on GitHub Pages without any CI setup.
 *
 * Each value may still be overridden by a `NEXT_PUBLIC_FIREBASE_*` environment
 * variable, e.g. to point a local build at a throwaway project. When the
 * variable is absent the committed default is used.
 */
import type { FirebaseOptions } from "firebase/app";

/** The Firebase web config, with optional per-value environment overrides. */
export const FIREBASE_CONFIG: FirebaseOptions = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyDqO41IhjgmUwl2e2zw_usf--DZWmcty3A",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    "drecksau-95ab4.firebaseapp.com",
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ??
    "https://drecksau-95ab4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "drecksau-95ab4",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "drecksau-95ab4.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "1024537032588",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:1024537032588:web:2511068be914ce466a48a9",
};
