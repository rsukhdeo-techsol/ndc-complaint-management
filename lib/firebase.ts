import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Collection names as constants
export const COLLECTIONS = {
  COMPLAINTS: 'complaints',
  TIMELINE: 'timeline',
  NOTIFICATIONS: 'notifications',
} as const;

// Initialize Firebase lazily to avoid SSR issues
let _app: FirebaseApp | undefined;
let _db: Firestore | undefined;
let _storage: FirebaseStorage | undefined;

function initFirebase(): FirebaseApp {
  if (!_app) {
    if (getApps().length === 0) {
      _app = initializeApp(firebaseConfig);
    } else {
      _app = getApps()[0];
    }
  }
  return _app;
}

// Create getter-based exports that look like direct variables
// This ensures Firebase is only initialized when actually accessed
export const app = new Proxy({} as FirebaseApp, {
  get(_, prop) {
    return (initFirebase() as Record<string | symbol, unknown>)[prop];
  },
});

export const db = new Proxy({} as Firestore, {
  get(_, prop) {
    if (!_db) {
      _db = getFirestore(initFirebase());
    }
    return (_db as Record<string | symbol, unknown>)[prop];
  },
});

export const storage = new Proxy({} as FirebaseStorage, {
  get(_, prop) {
    if (!_storage) {
      _storage = getStorage(initFirebase());
    }
    return (_storage as Record<string | symbol, unknown>)[prop];
  },
});
