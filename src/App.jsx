import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import CustomerView from './views/CustomerView';
import AboutChefView from './views/AboutChefView';
import CounterView from './views/CounterView';
import AdminView from './views/AdminView';
import KdsView from './views/KdsView';
import {
  initialMenu,
  verifiedChefData,
  initialOrders,
  initialExpenses,
  initialStaff,
  initialOffers,
  initialTheme
} from './data/initialData';
import { loadData, saveData, resetAllDataToDefault, STORAGE_KEYS } from './utils/storage';
import { playNewOrderChime, playTapSound } from './utils/audio';
import confetti from 'canvas-confetti';

export default function App() {
  // Global Shared States (Persisted in localStorage)
  const [menu, setMenu] = useState(() => loadData(STORAGE_KEYS.MENU, initialMenu));
  const [chef, setChef] = useState(() => loadData(STORAGE_KEYS.CHEF, verifiedChefData));
  const [orders, setOrders] = useState(() => loadData(STORAGE_KEYS.ORDERS, initialOrders));
  const [expenses, setExpenses] = useState(() => loadData(STORAGE_KEYS.EXPENSES, initialExpenses));
  const [staff, setStaff] = useState(() => loadData(STORAGE_KEYS.STAFF, initialStaff));
  const [offers, setOffers] = useState(() => loadData(STORAGE_KEYS.OFFERS, initialOffers));
  const [theme, setTheme] = useState(() => loadData(STORAGE_KEYS.THEME, initialTheme));
  const [checklists, setChecklists] = useState(() => loadData(STORAGE_KEYS.CHECKLISTS, []));

  // Cart State (Customer specific)
  const [cart, setCart] = useState([]);
  const [activeTable, setActiveTable] = useState('Table 04');

  // Navigation State
  const [currentRole, setCurrentRole] = useState('customer'); // 'customer' | 'chef' | 'counter' | 'kds' | 'admin'
  const [activeTab, setActiveTab] = useState('menu'); // customer: 'menu','chef','cart','track' | counter: 'orders','manual','stock','checklist'
  const [counterSubTab, setCounterSubTab] = useState('orders');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Save changes to localStorage
  useEffect(() => { saveData(STORAGE_KEYS.MENU, menu); }, [menu]);
  useEffect(() => { saveData(STORAGE_KEYS.ORDERS, orders); }, [orders]);
  useEffect(() => { saveData(STORAGE_KEYS.EXPENSES, expenses); }, [expenses]);
  useEffect(() => { saveData(STORAGE_KEYS.STAFF, staff); }, [staff]);
  useEffect(() => { saveData(STORAGE_KEYS.OFFERS, offers); }, [offers]);
  useEffect(() => { saveData(STORAGE_KEYS.THEME, theme); }, [theme]);
  useEffect(() => { saveData(STORAGE_KEYS.CHECKLISTS, checklists); }, [checklists]);

  // URL Hash & Parameter Support for QR Dine-in & Direct Role Linking
  useEffect(() => {
    const syncFromUrl = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tableParam = urlParams.get('table');
      if (tableParam) {
        const cleanTable = tableParam.toLowerCase().startsWith('table')
          ? tableParam
          : `Table ${tableParam.padStart(2, '0')}`;
        setActiveTable(cleanTable);
        setCurrentRole('customer');
        setActiveTab('menu');
      }

      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'chef') {
        setCurrentRole('chef');
        setActiveTab('chef');
      } else if (hash === 'counter' || hash === 'pos') {
        setCurrentRole('counter');
        setActiveTab('orders');
        setCounterSubTab('orders');
      } else if (hash === 'kds' || hash === 'kitchen') {
        setCurrentRole('kds');
        setActiveTab('kds');
      } else if (hash === 'admin' || hash === 'owner') {
        setCurrentRole('admin');
        setActiveTab('sales');
      } else if (hash === 'customer' || hash === 'menu') {
        setCurrentRole('customer');
        setActiveTab('menu');
      }
    };

    syncFromUrl();
    window.addEventListener('hashchange', syncFromUrl);
    return () => window.removeEventListener('hashchange', syncFromUrl);
  }, []);

  // Active in-progress orders count
  const activeOrdersCount = orders.filter((o) => o.status !== 'done' && o.status !== 'rejected').length;

  // Handle Order Placement from Customer
  const handlePlaceOrder = (newOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });
    // Trigger audio chime for kitchen alert
    playNewOrderChime();
    setActiveTab('track');
  };

  // Reset demo state helper
  const handleResetDemo = () => {
    playTapSound();
    if (window.confirm('Reset all demo data (menu, orders, expenses, staff) to fresh defaults?')) {
      resetAllDataToDefault();
      setMenu(initialMenu);
      setChef(verifiedChefData);
      setOrders(initialOrders);
      setExpenses(initialExpenses);
      setStaff(initialStaff);
      setOffers(initialOffers);
      setTheme(initialTheme);
      setChecklists([]);
      setCart([]);
    }
  };

  // Switch role helper
  const handleRoleSwitch = (role) => {
    playTapSound();
    setCurrentRole(role);
    window.location.hash = role;
    if (role === 'customer') {
      setActiveTab('menu');
    } else if (role === 'chef') {
      setActiveTab('chef');
    } else if (role === 'counter') {
      setActiveTab('orders');
      setCounterSubTab('orders');
    } else if (role === 'kds') {
      setActiveTab('kds');
    } else if (role === 'admin') {
      setActiveTab('sales');
    }
  };

  const cartTotal = cart.reduce((a, b) => a + b.price * b.quantity, 0);
  const cartCount = cart.reduce((a, b) => a + b.quantity, 0);

  return (
    <div className="app-container">
      {/* Production Restaurant OS Header (Widescreen on Laptops/Desktops, Responsive on Mobile) */}
      <Header
        chef={chef}
        theme={theme}
        currentRole={currentRole}
        onRoleSwitch={handleRoleSwitch}
        activeTable={activeTable}
        setActiveTable={setActiveTable}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        onChefClick={() => handleRoleSwitch('chef')}
        activeOrdersCount={activeOrdersCount}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => {
          handleRoleSwitch('customer');
          setActiveTab('cart');
        }}
        onResetDemo={handleResetDemo}
      />

      {/* Main Full-Viewport Content Area */}
      <main className="app-main-viewport">
        <div className="app-content-container">
          {/* Dynamic Views Rendering */}
          {currentRole === 'customer' && (
            <CustomerView
              menu={menu}
              chef={chef}
              theme={theme}
              activeTable={activeTable}
              setActiveTable={setActiveTable}
              orders={orders}
              cart={cart}
              setCart={setCart}
              onPlaceOrder={handlePlaceOrder}
              onGoToChef={() => handleRoleSwitch('chef')}
              searchQuery={searchQuery}
              offers={offers}
            />
          )}

          {currentRole === 'chef' && (
            <AboutChefView
              chef={chef}
              menu={menu}
              onAddToCart={(item) => {
                setCart((prev) => [...prev, { ...item, quantity: 1, note: "Chef's Signature Recommendation" }]);
                handleRoleSwitch('customer');
              }}
              onGoToMenu={() => handleRoleSwitch('customer')}
            />
          )}

          {currentRole === 'counter' && (
            <CounterView
              orders={orders}
              setOrders={setOrders}
              menu={menu}
              setMenu={setMenu}
              offers={offers}
              setOffers={setOffers}
              theme={theme}
              chef={chef}
              checklists={checklists}
              setChecklists={setChecklists}
              activeSubTab={counterSubTab}
              setActiveSubTab={setCounterSubTab}
              onSwitchToKds={() => handleRoleSwitch('kds')}
            />
          )}

          {currentRole === 'kds' && (
            <KdsView
              orders={orders}
              setOrders={setOrders}
              chef={chef}
            />
          )}

          {currentRole === 'admin' && (
            <AdminView
              orders={orders}
              menu={menu}
              setMenu={setMenu}
              expenses={expenses}
              setExpenses={setExpenses}
              staff={staff}
              setStaff={setStaff}
              theme={theme}
              setTheme={setTheme}
              chef={chef}
              checklists={checklists}
            />
          )}
        </div>
      </main>

      {/* Mobile-Only Bottom Navigation Dock (Hidden on Laptops / Desktops >= 769px) */}
      <BottomNav
        currentRole={currentRole === 'chef' ? 'customer' : currentRole}
        activeTab={
          currentRole === 'chef'
            ? 'chef'
            : currentRole === 'counter'
            ? counterSubTab
            : currentRole === 'kds'
            ? 'kds'
            : activeTab
        }
        setActiveTab={(tabId) => {
          if (currentRole === 'customer') {
            if (tabId === 'chef') {
              handleRoleSwitch('chef');
            } else {
              setActiveTab(tabId);
            }
          } else if (currentRole === 'chef') {
            if (tabId !== 'chef') {
              handleRoleSwitch('customer');
              setActiveTab(tabId);
            }
          } else if (currentRole === 'counter') {
            setCounterSubTab(tabId);
          } else if (currentRole === 'kds') {
            if (tabId === 'counter') {
              handleRoleSwitch('counter');
            }
          }
        }}
        cartCount={cartCount}
        activeOrdersCount={activeOrdersCount}
      />
    </div>
  );
}
