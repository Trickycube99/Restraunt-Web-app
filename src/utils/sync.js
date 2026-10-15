// Real-Time Cross-Tab / Cross-Window Event Synchronization
// Connects Customer Table Orders, Counterperson POS Live Queue, and Owner Admin
// Uses BroadcastChannel API with localStorage fallback for ultra-low latency (<50ms)

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

/**
 * Broadcast an event to all open tabs / windows
 */
export function broadcastSyncEvent(type, payload = {}) {
  const eventMessage = {
    type,
    payload,
    timestamp: Date.now(),
    senderId: Math.random().toString(36).substring(2, 9)
  };

  // 1. BroadcastChannel (Modern instant sync)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(eventMessage);
    } catch (err) {
      console.error('Failed to postMessage on BroadcastChannel:', err);
    }
  }

  // 2. LocalStorage event bus fallback for cross-window reliability
  try {
    localStorage.setItem('flowscape_sync_event_ping', JSON.stringify(eventMessage));
  } catch (err) {
    // Ignore storage quota warnings
  }
}

/**
 * Subscribe to real-time events across windows
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

  // Return unsubscribe cleanup function
  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
  };
}
