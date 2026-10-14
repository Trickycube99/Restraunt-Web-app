import {
  initialMenu,
  verifiedChefData,
  initialOrders,
  initialExpenses,
  initialStaff,
  initialOffers,
  initialTheme
} from '../data/initialData';

const STORAGE_KEYS = {
  MENU: 'flowscape_menu_inr_v2',
  CHEF: 'flowscape_chef_inr_v2',
  ORDERS: 'flowscape_orders_inr_v2',
  EXPENSES: 'flowscape_expenses_inr_v2',
  STAFF: 'flowscape_staff_inr_v2',
  OFFERS: 'flowscape_offers_inr_v2',
  THEME: 'flowscape_theme_inr_v2',
  CHECKLISTS: 'flowscape_checklists_inr_v2'
};

export function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading ${key} from localStorage:`, err);
    return fallback;
  }
}

export function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

export function resetAllDataToDefault() {
  saveData(STORAGE_KEYS.MENU, initialMenu);
  saveData(STORAGE_KEYS.CHEF, verifiedChefData);
  saveData(STORAGE_KEYS.ORDERS, initialOrders);
  saveData(STORAGE_KEYS.EXPENSES, initialExpenses);
  saveData(STORAGE_KEYS.STAFF, initialStaff);
  saveData(STORAGE_KEYS.OFFERS, initialOffers);
  saveData(STORAGE_KEYS.THEME, initialTheme);
  saveData(STORAGE_KEYS.CHECKLISTS, []);
}

export { STORAGE_KEYS };
