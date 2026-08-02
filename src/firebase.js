import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// NOTE: This project uses Flask as its primary backend.
// Firebase is kept here only as a legacy stub and is not actively used.
// Vite env vars must use the VITE_ prefix. The .env.local file uses
// NEXT_PUBLIC_ keys (a Next.js convention) which Vite does not expose,
// so we fall back to empty strings to prevent Firebase init errors.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Only initialize Firebase if a projectId is available to avoid runtime errors.
let app, storage;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  storage = getStorage(app);
} catch (e) {
  // Firebase config is incomplete; app uses Flask backend instead.
  app = null;
  storage = null;
}

export { app, storage };