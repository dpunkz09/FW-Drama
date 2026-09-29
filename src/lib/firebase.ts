import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase (but we won't use Firebase auth since anonymous is disabled)
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Placeholder for future authentication implementation
export const initializeAuth = async () => {
  console.warn('⚠️ Firebase anonymous auth is disabled by Shortical');
  console.info('💡 Solution: Use a bearer token from your browser session');
  console.info('   1. Visit https://shortical.com and sign in');
  console.info('   2. Open DevTools > Application > Local Storage');
  console.info('   3. Find the Firebase auth token');
  console.info('   4. Add it to .env as VITE_BEARER_TOKEN');
};
