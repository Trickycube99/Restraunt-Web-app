// Firebase Firestore Real-Time Cross-Device Synchronization Layer
// Enables instantaneous real-time sync across physical devices (Phones, Tablets, Laptops)
// Worldwide over 4G/5G/Wi-Fi with zero delay

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from 'firebase/firestore';

// Read config from Vite environment variables or localStorage override
const getFirebaseConfig = () => {
  if (typeof window === 'undefined') return null;

  // 1. Check environment variables (Vercel / .env)
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  // 2. Check localStorage custom configuration if set in browser
  try {
    const customConfig = localStorage.getItem('flowscape_firebase_config');
    if (customConfig) {
      const parsed = JSON.parse(customConfig);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }

  return null;
};

let db = null;
let isInitialized = false;

export function initFirebase() {
  if (isInitialized && db) return db;

  const config = getFirebaseConfig();
  if (!config) {
    // Cloud sync not configured yet, fallback to local BroadcastChannel
    return null;
  }

  try {
    const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    db = getFirestore(app);
    isInitialized = true;
    console.log('🔥 [Cloud Sync] Connected to Firebase Firestore real-time network.');
    return db;
  } catch (err) {
    console.warn('🔥 [Cloud Sync] Firebase initialization error:', err);
    return null;
  }
}

/**
 * Check if Cloud Sync (Firestore) is active
 */
export function isCloudSyncEnabled() {
  return Boolean(initFirebase());
}

/**
 * Upload or sync a new order to Firebase Firestore (Cross-Device)
 */
export async function syncOrderToCloud(order) {
  const database = initFirebase();
  if (!database || !order || !order.id) return false;

  try {
    const orderDocRef = doc(database, 'restaurant_orders', order.id);
    await setDoc(orderDocRef, {
      ...order,
      _cloudSyncedAt: Date.now()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('🔥 [Cloud Sync] Error uploading order to Firestore:', err);
    return false;
  }
}

/**
 * Update order status in Firebase Firestore (Cross-Device)
 */
export async function syncStatusToCloud(orderId, updateData) {
  const database = initFirebase();
  if (!database || !orderId) return false;

  try {
    const orderDocRef = doc(database, 'restaurant_orders', orderId);
    await updateDoc(orderDocRef, {
      ...updateData,
      _cloudStatusUpdatedAt: Date.now()
    });
    return true;
  } catch (err) {
    console.error('🔥 [Cloud Sync] Error updating status in Firestore:', err);
    return false;
  }
}

/**
 * Subscribe to real-time order updates from all devices
 */
export function subscribeToCloudOrders(onOrdersUpdated, onStatusUpdated) {
  const database = initFirebase();
  if (!database) return () => {};

  try {
    const ordersCol = collection(database, 'restaurant_orders');
    const q = query(ordersCol, limit(100));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data();
          if (change.type === 'added') {
            if (onOrdersUpdated) onOrdersUpdated(data);
          } else if (change.type === 'modified') {
            if (onStatusUpdated) onStatusUpdated(data);
          }
        });
      },
      (error) => {
        console.warn('🔥 [Cloud Sync] Firestore snapshot listener error:', error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('🔥 [Cloud Sync] Error subscribing to Firestore orders:', err);
    return () => {};
  }
}
