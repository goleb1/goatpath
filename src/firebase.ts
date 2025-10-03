// Firebase configuration with localStorage fallback
// This file gracefully handles missing Firebase package or configuration

// Storage keys for localStorage fallback
const STORAGE_KEYS = {
  EVENT: 'goatpath_event',
  LAST_UPDATE: 'goatpath_last_update'
};

// Firebase Auth context
let auth: any = null;

// LocalStorage-based fallback implementations
const localStorageOnValue = (_ref: any, callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => {
  console.log('📦 Using localStorage fallback (Firebase not available)');

  // Initial load from localStorage
  try {
    const savedEvent = localStorage.getItem(STORAGE_KEYS.EVENT);
    if (savedEvent) {
      const data = JSON.parse(savedEvent);
      callback({ val: () => data });
    } else {
      callback({ val: () => null });
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    if (errorCallback) errorCallback(error);
  }

  // Poll for updates every 2 seconds
  const interval = setInterval(() => {
    try {
      const savedEvent = localStorage.getItem(STORAGE_KEYS.EVENT);
      if (savedEvent) {
        const data = JSON.parse(savedEvent);
        callback({ val: () => data });
      }
    } catch (error) {
      console.error('Failed to poll localStorage:', error);
    }
  }, 2000);

  // Return unsubscribe function
  return () => clearInterval(interval);
};

const localStorageSet = async (_ref: any, data: any) => {
  console.log('💾 Writing to localStorage (Firebase not available)');
  try {
    localStorage.setItem(STORAGE_KEYS.EVENT, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, data.updatedAt || new Date().toISOString());
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to write to localStorage:', error);
    return Promise.reject(error);
  }
};

const localStorageOff = (_ref?: any) => {
  // No-op for localStorage
};

// Check if Firebase is configured
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const hasFirebaseConfig = apiKey && apiKey !== 'your-api-key' && !apiKey.includes('your-');

// Initialize with fallbacks by default
export let eventRef: any = null;
export let database: any = null;
export let firebaseEnabled = false;
export let onValue = localStorageOnValue;
export let set = localStorageSet;
export let off = localStorageOff;

// Export auth for use in components
export { auth };

// Only try to load Firebase if we have config
if (hasFirebaseConfig) {
  import('firebase/app')
    .then((firebaseApp) => {
      return Promise.all([
        import('firebase/database'),
        import('firebase/auth')
      ]).then(([firebaseDatabase, firebaseAuth]) => {
        const firebaseConfig = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY!,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN!,
          databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL!,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID!,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET!,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
          appId: import.meta.env.VITE_FIREBASE_APP_ID!
        };

        const app = firebaseApp.initializeApp(firebaseConfig);
        database = firebaseDatabase.getDatabase(app);
        auth = firebaseAuth.getAuth(app);
        eventRef = firebaseDatabase.ref(database, 'event');
        firebaseEnabled = true;
        onValue = firebaseDatabase.onValue;
        set = firebaseDatabase.set;
        off = firebaseDatabase.off;

        console.log('✅ Firebase initialized successfully - using real-time sync with auth');
      });
    })
    .catch(() => {
      console.warn('⚠️ Firebase package not installed - using localStorage fallback');
      console.warn('💡 Run: npm install firebase');
    });
} else {
  console.warn('⚠️ Firebase not configured - using localStorage fallback');
  console.warn('💡 See FIREBASE_SETUP.md for setup instructions');
}
