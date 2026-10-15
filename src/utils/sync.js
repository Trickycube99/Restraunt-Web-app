// Real-Time Cross-Tab, Cross-Window & Cross-Device Event Synchronization
// Connects Customer Table Orders, Counterperson POS Live Queue, and Owner Admin
// Uses Cloud Firestore for multi-device sync + BroadcastChannel for local instant sync (<50ms)

import {
  syncOrderToCloud,
  syncStatusToCloud,
  subscribeToCloudOrders,
  isCloudSyncEnabled
} from './firebaseSync';

const CHANNEL_NAME = 'advait_restaurant_pos_channel_v1';

let broadcastChannel = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (err) {
  console.warn('BroadcastChannel not supported in this environment:', err);
}

export const SYNC_EVENTS = {
  NEW_ORDER: 'NEW_ORDER',
  ORDER_STATUS_UPDATED: 'ORDER_STATUS_UPDATED',
  MENU_UPDATED: 'MENU_UPDATED',
  OFFERS_UPDATED: 'OFFERS_UPDATED',
  EXPENSE_ADDED: 'EXPENSE_ADDED',
  CHECKLIST_SUBMITTED: 'CHECKLIST_SUBMITTED',
  CALL_SERVER: 'CALL_SERVER'
};

const currentClientId = Math.random().toString(36).substring(2, 9);

/**
 * Broadcast an event to all open tabs, windows and cross-device cloud
 */
export function broadcastSyncEvent(type, payload = {}) {
  const eventMessage = {
    type,
    payload,
    timestamp: Date.now(),
    senderId: currentClientId
  };

  // 1. BroadcastChannel (Local browser instant sync)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(eventMessage);
    } catch (err) {
      console.error('Failed to postMessage on BroadcastChannel:', err);
    }
  }

  // 2. LocalStorage event bus fallback for cross-window reliability on same device
  try {
    localStorage.setItem('flowscape_sync_event_ping', JSON.stringify(eventMessage));
  } catch (err) {
    // Ignore storage quota warnings
  }

  // 3. Cross-Device Cloud Sync (Firebase Firestore)
  if (type === SYNC_EVENTS.NEW_ORDER && payload) {
    syncOrderToCloud(payload).catch(() => {});
  } else if (type === SYNC_EVENTS.ORDER_STATUS_UPDATED && payload && payload.id) {
    syncStatusToCloud(payload.id, payload).catch(() => {});
  }
}

/**
 * Subscribe to real-time events across windows and cross-device cloud
 */
export function subscribeSyncEvents(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleBroadcast = (event) => {
    if (event && event.data && callback) {
      callback(event.data);
    }
  };

  const handleStorage = (e) => {
    if (e.key === 'flowscape_sync_event_ping' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (callback) callback(parsed);
      } catch (err) {
        console.error('Error parsing storage sync message:', err);
      }
    } else if (e.key === 'flowscape_orders_v2' && e.newValue) {
      try {
        const parsedOrders = JSON.parse(e.newValue);
        if (Array.isArray(parsedOrders) && callback) {
          callback({
            type: 'DIRECT_ORDERS_SYNC',
            payload: parsedOrders
          });
        }
      } catch (err) {
        console.error('Error parsing direct orders sync:', err);
      }
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }
  window.addEventListener('storage', handleStorage);

  // Subscribe to Cloud Sync if configured
  let unsubscribeCloud = null;
  if (isCloudSyncEnabled()) {
    unsubscribeCloud = subscribeToCloudOrders(
      (newOrder) => {
        if (callback && newOrder && newOrder.id) {
          callback({
            type: SYNC_EVENTS.NEW_ORDER,
            payload: newOrder
          });
        }
      },
      (updatedOrder) => {
        if (callback && updatedOrder && updatedOrder.id) {
          callback({
            type: SYNC_EVENTS.ORDER_STATUS_UPDATED,
            payload: updatedOrder
          });
        }
      }
    );
  }

  // Return unsubscribe cleanup function
  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
    if (unsubscribeCloud) {
      unsubscribeCloud();
    }
  };
}
