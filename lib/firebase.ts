import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration from environment variables
// Trim values to remove any accidental whitespace/newlines
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
};

// Debug: Log Firebase config (only shows if values are present)
if (typeof window !== 'undefined') {
  console.log('Firebase config loaded:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasProjectId: !!firebaseConfig.projectId,
    projectId: firebaseConfig.projectId,
  });
}

// Collection names as constants
export const COLLECTIONS = {
  COMPLAINTS: 'complaints',
  TIMELINE: 'timeline',
  NOTIFICATIONS: 'notifications',
} as const;

// Initialize Firebase - simple singleton pattern
let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

function getApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return _app;
}

// Export initialized instances directly
export const app: FirebaseApp = typeof window !== 'undefined' ? getApp() : ({} as FirebaseApp);

export const db: Firestore = typeof window !== 'undefined' ? getFirestore(getApp()) : ({} as Firestore);

export const storage: FirebaseStorage = typeof window !== 'undefined' ? getStorage(getApp()) : ({} as FirebaseStorage);
