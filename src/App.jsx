import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import AuthModal from './components/AuthModal';
import TableQrModal from './components/TableQrModal';
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
import {
  ROLES,
  getStoredSessions,
  isAuthenticated,
  getSession,
  logoutRole,
  resetAllSessions
} from './utils/auth';
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

  // Authentication Abstraction State (Persisted across sessions)
  const [authSessions, setAuthSessions] = useState(() => getStoredSessions());
  const [authModal, setAuthModal] = useState({ isOpen: false, targetRole: null });
  const [isTableQrOpen, setIsTableQrOpen] = useState(false);

  // Cart State (Customer specific)
  const [cart, setCart] = useState([]);
  const [activeTable, setActiveTable] = useState('Table 04');

  // Navigation State
  const [currentRole, setCurrentRole] = useState('customer'); // 'customer' | 'chef' | 'counter' | 'kds' | 'admin'
  const [activeTab, setActiveTab] = useState('menu'); // customer: 'menu','chef','cart','track' | counter: 'orders','manual','stock','checklist'
  const [counterSubTab, setCounterSubTab] = useState('orders');
  const [adminTab, setAdminTab] = useState('sales'); // owner admin active tab ('sales','orders','pnl','payroll','branding' in footer on mobile)

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

  // URL Hash & Parameter Support with Authentication Guard
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
      let targetRole = null;
      if (hash === 'chef') targetRole = 'chef';
      else if (hash === 'counter' || hash === 'pos') targetRole = 'counter';
      else if (hash === 'kds' || hash === 'kitchen') targetRole = 'kds';
      else if (hash === 'admin' || hash === 'owner') targetRole = 'admin';
      else if (hash === 'customer' || hash === 'menu') targetRole = 'customer';

      if (targetRole) {
        if (isAuthenticated(targetRole)) {
          setCurrentRole(targetRole);
          if (targetRole === 'customer') setActiveTab('menu');
          else if (targetRole === 'chef') setActiveTab('chef');
          else if (targetRole === 'counter') { setActiveTab('orders'); setCounterSubTab('orders'); }
          else if (targetRole === 'kds') setActiveTab('kds');
        } else {
          // Trigger interface authentication modal
          setAuthModal({ isOpen: true, targetRole });
        }
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
    if (window.confirm('Reset all demo data (menu, orders, expenses, staff & sessions) to fresh defaults?')) {
      resetAllDataToDefault();
      resetAllSessions();
      setAuthSessions(getStoredSessions());
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

  // Switch role helper with Authentication Verification
  const handleRoleSwitch = (role) => {
    playTapSound();
    if (!isAuthenticated(role)) {
      setAuthModal({ isOpen: true, targetRole: role });
      return;
    }

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
    }
  };

  // Auth Success Handler
  const handleAuthSuccess = (newSession) => {
    const updated = getStoredSessions();
    setAuthSessions(updated);
    setAuthModal({ isOpen: false, targetRole: null });

    const role = newSession.role;
    setCurrentRole(role);
    window.location.hash = role;

    if (role === 'customer') {
      if (newSession.table) setActiveTable(newSession.table);
      setActiveTab('menu');
    } else if (role === 'chef') {
      setActiveTab('chef');
    } else if (role === 'counter') {
      setActiveTab('orders');
      setCounterSubTab('orders');
    } else if (role === 'kds') {
      setActiveTab('kds');
    }
  };

  // Logout Role Handler
  const handleLogoutRole = (roleToLogout) => {
    playTapSound();
    logoutRole(roleToLogout);
    const updated = getStoredSessions();
    setAuthSessions(updated);

    if (currentRole === roleToLogout) {
      // Return safely to customer QR view
      setCurrentRole('customer');
      window.location.hash = 'customer';
      setActiveTab('menu');
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
        authSessions={authSessions}
        onOpenAuth={(role) => setAuthModal({ isOpen: true, targetRole: role })}
        onLogoutRole={handleLogoutRole}
        onOpenTableQr={() => setIsTableQrOpen(true)}
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
              activeAdminTab={adminTab}
              setActiveAdminTab={setAdminTab}
              onOpenTableQr={() => setIsTableQrOpen(true)}
            />
          )}
        </div>
      </main>

      {/* Mobile-Only Bottom Navigation Dock (Hidden on Laptops / Desktops >= 769px) */}
      <BottomNav
        currentRole={currentRole}
        activeTab={
          currentRole === 'customer'
            ? activeTab
            : currentRole === 'chef'
            ? 'chef'
            : currentRole === 'counter'
            ? counterSubTab
            : currentRole === 'kds'
            ? 'kds'
            : adminTab
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
          } else if (currentRole === 'admin') {
            setAdminTab(tabId);
          }
        }}
        cartCount={cartCount}
        activeOrdersCount={activeOrdersCount}
      />

      {/* Interface Specific Authentication Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        targetRole={authModal.targetRole}
        onSuccess={handleAuthSuccess}
        onClose={() => setAuthModal({ isOpen: false, targetRole: null })}
        theme={theme}
      />

      {/* Zero-Auth Direct Table QR Code Generator & Standee Modal */}
      <TableQrModal
        isOpen={isTableQrOpen}
        onClose={() => setIsTableQrOpen(false)}
        activeTable={activeTable}
        setActiveTable={setActiveTable}
        tables={theme.tables}
        restaurantName={theme.restaurantName}
      />
    </div>
  );
}
