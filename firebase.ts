import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported as analyticsIsSupported } from 'firebase/analytics';

// Tentar carregar do .env, com fallback para hardcoded (para teste)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDgqlX3xgIpEVIXl5ljw1913zlfUGFq800',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'prevencar-vistorias-c0fe0.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'prevencar-vistorias-c0fe0',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'prevencar-vistorias-c0fe0.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '376692376652',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:376692376652:web:479e6a381c9e289f5de0e9',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-6VHQB67F7K',
};

// Debug: Verificar se as variáveis foram carregadas
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Variáveis Firebase não carregadas!', {
    apiKey: firebaseConfig.apiKey ? '✓' : '✗',
    projectId: firebaseConfig.projectId ? '✓' : '✗',
    authDomain: firebaseConfig.authDomain ? '✓' : '✗',
  });
} else {
  console.log('✅ Firebase configurado com:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
  });
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics is only available in browser environments and when measurementId is provided.
let analytics: any = undefined;
if (typeof window !== 'undefined' && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
  analyticsIsSupported()
    .then((supported) => {
      if (supported) {
        try {
          analytics = getAnalytics(app);
        } catch (e) {
          // ignore analytics init errors in non-standard envs
          // eslint-disable-next-line no-console
          console.warn('Firebase analytics not initialized:', e);
        }
      }
    })
    .catch(() => {
      // ignore
    });
}

export { analytics };

export default app;
