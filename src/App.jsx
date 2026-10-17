import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import AuthModal from './components/AuthModal';
import TableQrModal from './components/TableQrModal';
import CustomerView from './views/CustomerView';
import AboutChefView from './views/AboutChefView';
import CounterView from './views/CounterView';
import AdminView from './views/AdminView';
import DeveloperAdminView from './views/DeveloperAdminView';
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
import {
  getActiveBusiness,
  setActiveBusiness,
  isDeveloperAuthenticated
} from './utils/businessManager';
import { playNewOrderChime, playTapSound } from './utils/audio';
import { subscribeSyncEvents, SYNC_EVENTS } from './utils/sync';
import confetti from 'canvas-confetti';

export default function App() {
  // Global Shared States (Persisted in localStorage)
  const [menu, setMenu] = useState(() => loadData(STORAGE_KEYS.MENU, initialMenu));
  const [chef, setChef] = useState(() => loadData(STORAGE_KEYS.CHEF, verifiedChefData));
  const [orders, setOrders] = useState(() => {
    const loaded = loadData(STORAGE_KEYS.ORDERS, initialOrders);
    return loaded.map((o) =>
      o.id === 'ORD-8821' && o.status === 'in-progress'
        ? { ...o, status: 'received', statusLabel: 'Received', progressPercent: 25 }
        : o
    );
  });
  const [expenses, setExpenses] = useState(() => loadData(STORAGE_KEYS.EXPENSES, initialExpenses));
  const [staff, setStaff] = useState(() => loadData(STORAGE_KEYS.STAFF, initialStaff));
  const [offers, setOffers] = useState(() => loadData(STORAGE_KEYS.OFFERS, initialOffers));
  const [theme, setTheme] = useState(() => {
    const loaded = loadData(STORAGE_KEYS.THEME, initialTheme);
    return { ...initialTheme, ...loaded, upiId: loaded?.upiId || initialTheme.upiId || '9119069179@nyes' };
  });
  const [checklists, setChecklists] = useState(() => loadData(STORAGE_KEYS.CHECKLISTS, []));

  // Authentication State
  const [authSessions, setAuthSessions] = useState(() => getStoredSessions());
  const [authModal, setAuthModal] = useState({ isOpen: false, targetRole: null });
  const [isTableQrOpen, setIsTableQrOpen] = useState(false);

  // Cart & Active Table State (Customer specific)
  const [cart, setCart] = useState([]);
  const [activeTable, setActiveTable] = useState('Table 04');

  // Navigation & View State (Dedicated Interfaces: Customer, Counter, Admin, Developer)
  const [currentRole, setCurrentRole] = useState(() => {
    if (typeof window === 'undefined') return 'customer';
    const rawPath = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    const rawHash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const route = rawHash || rawPath;
    if (route === 'dev' || route === 'developer' || route === 'superadmin') return 'developer';
    if (route === 'counter' || route === 'pos' || route === 'kds' || route === 'kitchen') return 'counter';
    if (route === 'admin' || route === 'owner') return 'admin';
    return 'customer';
  });
  const [activeTab, setActiveTab] = useState('menu'); // customer: 'menu','cart','track','chef'
  const [counterSubTab, setCounterSubTab] = useState('orders'); // counter: 'orders','manual','stock','checklist'
  const [adminTab, setAdminTab] = useState('sales');

  // Accessibility, Language & Audio Preferences
  const [language, setLanguage] = useState('en'); // 'en' | 'hi' (PRD Section 7)
  const [isSoundMuted, setIsSoundMuted] = useState(false);

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

  // Real-Time Cross-Tab / Cross-Device Synchronization Listener
  useEffect(() => {
    const unsubscribe = subscribeSyncEvents((msg) => {
      if (!msg || !msg.type) return;

      if (msg.type === SYNC_EVENTS.NEW_ORDER) {
        setOrders((prev) => {
          if (prev.some((o) => o.id === msg.payload.id)) return prev;
          return [msg.payload, ...prev];
        });
        if (!isSoundMuted && !msg.isInitial && currentRole === 'counter') {
          playNewOrderChime();
        }
      } else if (msg.type === SYNC_EVENTS.ORDER_STATUS_UPDATED) {
        setOrders((prev) => {
          const exists = prev.some((o) => o.id === msg.payload.id);
          if (exists) {
            return prev.map((o) => (o.id === msg.payload.id ? { ...o, ...msg.payload } : o));
          }
          return [msg.payload, ...prev];
        });
      } else if (msg.type === 'DIRECT_ORDERS_SYNC') {
        if (Array.isArray(msg.payload)) {
          setOrders(msg.payload);
        }
      } else if (msg.type === SYNC_EVENTS.MENU_UPDATED) {
        setMenu(msg.payload);
      } else if (msg.type === SYNC_EVENTS.OFFERS_UPDATED) {
        setOffers(msg.payload);
      } else if (msg.type === SYNC_EVENTS.EXPENSE_ADDED) {
        setExpenses((prev) => [msg.payload, ...prev]);
      } else if (msg.type === SYNC_EVENTS.CHECKLIST_SUBMITTED) {
        setChecklists((prev) => [msg.payload, ...prev]);
      } else if (msg.type === SYNC_EVENTS.THEME_UPDATED) {
        if (msg.payload) setTheme(msg.payload);
      }
    });

    return unsubscribe;
  }, [currentRole, isSoundMuted]);

  // Synchronize branding with active business on initial mount
  useEffect(() => {
    const activeBiz = getActiveBusiness();
    if (activeBiz) {
      setTheme((prev) => ({
        ...prev,
        restaurantName: activeBiz.name,
        tagline: activeBiz.tagline || prev.tagline,
        upiId: activeBiz.upiId || prev.upiId,
        accentColor: activeBiz.accentColor || prev.accentColor
      }));
    }
  }, []);

  // URL Hash & Parameter Routing Guard
  useEffect(() => {
    const syncFromUrl = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tableParam = urlParams.get('table') || urlParams.get('t');
      if (tableParam) {
        const cleanTable = tableParam.toLowerCase().startsWith('table')
          ? tableParam
          : `Table ${tableParam.padStart(2, '0')}`;
        setActiveTable(cleanTable);
        setCurrentRole('customer');
        setActiveTab('menu');
      }

      const rawPath = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
      const rawHash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      const route = rawHash || rawPath;

      let targetRole = null;
      if (route === 'chef') {
        setCurrentRole('customer');
        setActiveTab('chef');
        return;
      } else if (route === 'dev' || route === 'developer' || route === 'superadmin') {
        targetRole = 'developer';
      } else if (route === 'counter' || route === 'pos' || route === 'kds' || route === 'kitchen') {
        targetRole = 'counter';
      } else if (route === 'admin' || route === 'owner') {
        targetRole = 'admin';
      } else if (route === 'portal' || route === 'staff') {
        // Floor staff portal entry
        setAuthModal({ isOpen: true, targetRole: 'counter' });
        return;
      } else if (route === 'customer' || route === 'menu' || route === '') {
        targetRole = 'customer';
      }

      if (targetRole) {
        // If already on this active role, do not re-prompt
        if (targetRole === currentRole) {
          return;
        }

        if (targetRole === 'customer' || targetRole === 'developer' || isAuthenticated(targetRole, currentRole)) {
          setCurrentRole(targetRole);
          if (targetRole === 'customer') setActiveTab('menu');
          else if (targetRole === 'chef') setActiveTab('chef');
          else if (targetRole === 'counter') { setActiveTab('orders'); setCounterSubTab('orders'); }
          else if (targetRole === 'admin') setActiveTab('sales');
        } else {
          // Open workstation authentication gate
          setAuthModal({ isOpen: true, targetRole });
        }
      }
    };

    syncFromUrl();
    window.addEventListener('hashchange', syncFromUrl);
    window.addEventListener('popstate', syncFromUrl);
    return () => {
      window.removeEventListener('hashchange', syncFromUrl);
      window.removeEventListener('popstate', syncFromUrl);
    };
  }, [currentRole]);

  // Active in-progress orders count
  const activeOrdersCount = orders.filter((o) => o.status !== 'done' && o.status !== 'served' && o.status !== 'rejected').length;

  // Handle Order Placement from Customer
  const handlePlaceOrder = (newOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
    // Celebratory confetti
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });
    // Kitchen chime sound
    if (!isSoundMuted) {
      playNewOrderChime();
    }
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

  // Launch / Switch to Tenant Workspace from Developer Superadmin
  const handleSwitchToTenantApp = (biz, targetRole = 'admin') => {
    setActiveBusiness(biz.id);
    setTheme((prev) => ({
      ...prev,
      restaurantName: biz.name,
      tagline: biz.tagline || prev.tagline,
      upiId: biz.upiId || prev.upiId,
      accentColor: biz.accentColor || prev.accentColor,
      tables: biz.tables?.length || prev.tables || 12
    }));
    setCurrentRole(targetRole);
    window.location.hash = targetRole;
    if (targetRole === 'admin') setActiveTab('sales');
    else if (targetRole === 'counter') { setActiveTab('orders'); setCounterSubTab('orders'); }
    else if (targetRole === 'customer') setActiveTab('menu');
  };

  // Switch role helper with Authentication Verification & Hierarchy Enforcement
  const handleRoleSwitch = (role) => {
    playTapSound();
    const sessions = authSessions || getStoredSessions();
    const hasAdminAccess = Boolean(sessions?.admin?.token);

    // Counter person can ONLY access counter (CANNOT access admin)
    if (currentRole === 'counter' && role === 'admin') {
      if (!hasAdminAccess) {
        alert('Access Denied: Counter staff cannot access Owner Back-Office. Counter permissions are limited to Counter POS.');
        return;
      }
    }

    // Developer Superadmin role check
    if (role === 'developer') {
      if (!isAuthenticated('developer', currentRole)) {
        setAuthModal({ isOpen: true, targetRole: 'developer' });
        return;
      }
      setCurrentRole('developer');
      window.location.hash = 'developer';
      return;
    }

    // Check authentication with role hierarchy
    if (role !== 'customer' && !isAuthenticated(role, currentRole)) {
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
    } else if (role === 'admin') {
      setActiveTab('sales');
    } else if (role === 'developer') {
      // stays on developer
    }
  };

  // Auth Success Handler
  const handleAuthSuccess = (newSession, matchedBusiness) => {
    const updated = getStoredSessions();
    setAuthSessions(updated);
    setAuthModal({ isOpen: false, targetRole: null });

    const role = newSession.role;
    setCurrentRole(role);
    window.location.hash = role;

    if (matchedBusiness) {
      setActiveBusiness(matchedBusiness.id);
      setTheme((prev) => ({
        ...prev,
        restaurantName: matchedBusiness.name,
        tagline: matchedBusiness.tagline || prev.tagline,
        upiId: matchedBusiness.upiId || prev.upiId,
        accentColor: matchedBusiness.accentColor || prev.accentColor,
        tables: matchedBusiness.tables?.length || prev.tables || 12
      }));
    }

    if (role === 'customer') {
      if (newSession.table) setActiveTable(newSession.table);
      setActiveTab('menu');
    } else if (role === 'chef') {
      setActiveTab('chef');
    } else if (role === 'counter') {
      setActiveTab('orders');
      setCounterSubTab('orders');
    } else if (role === 'admin') {
      setActiveTab('sales');
    } else if (role === 'developer') {
      // stays on developer
    }
  };

  // Logout Role Handler
  const handleLogoutRole = (roleToLogout) => {
    playTapSound();
    logoutRole(roleToLogout);
    const updated = getStoredSessions();
    setAuthSessions(updated);

    // Return safely to customer QR dining view
    setCurrentRole('customer');
    window.location.hash = 'customer';
    setActiveTab('menu');
  };

  const cartTotal = cart.reduce((a, b) => a + b.price * b.quantity, 0);
  const cartCount = cart.reduce((a, b) => a + b.quantity, 0);

  return (
    <div className="app-container">
      {/* Dynamic Header: Clean & Isolated for Customer, Workstation for Staff */}
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
        activeOrdersCount={activeOrdersCount}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => {
          setCurrentRole('customer');
          setActiveTab('cart');
        }}
        onResetDemo={handleResetDemo}
        authSessions={authSessions}
        onLogoutRole={handleLogoutRole}
        onOpenTableQr={() => setIsTableQrOpen(true)}
        language={language}
        onToggleLanguage={() => setLanguage((l) => (l === 'en' ? 'hi' : 'en'))}
        isSoundMuted={isSoundMuted}
        onToggleSound={() => setIsSoundMuted((m) => !m)}
      />

      {/* Main Full-Viewport Content Area */}
      <main className="app-main-viewport">
        <div className="app-content-container">
          {/* Dynamic Views Rendering */}
          {(currentRole === 'customer' || currentRole === 'chef') && (
            activeTab === 'chef' || currentRole === 'chef' ? (
              <AboutChefView
                chef={chef}
                menu={menu}
                onAddToCart={(item) => {
                  setCart((prev) => [...prev, { ...item, quantity: 1, note: "Chef's Signature Recommendation" }]);
                  setCurrentRole('customer');
                  setActiveTab('cart');
                }}
                onGoToMenu={() => {
                  setCurrentRole('customer');
                  setActiveTab('menu');
                }}
              />
            ) : (
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
                onGoToChef={() => setActiveTab('chef')}
                searchQuery={searchQuery}
                offers={offers}
                language={language}
                onOpenStaffPortal={() => setAuthModal({ isOpen: true, targetRole: 'counter' })}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            )
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
              setTheme={setTheme}
              chef={chef}
              checklists={checklists}
              setChecklists={setChecklists}
              activeSubTab={counterSubTab}
              setActiveSubTab={setCounterSubTab}
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
              offers={offers}
              setOffers={setOffers}
              activeAdminTab={adminTab}
              setActiveAdminTab={setAdminTab}
              onOpenTableQr={() => setIsTableQrOpen(true)}
            />
          )}

          {currentRole === 'developer' && (
            <DeveloperAdminView
              onSwitchToApp={handleSwitchToTenantApp}
              onRoleSwitch={handleRoleSwitch}
            />
          )}
        </div>
      </main>

      {/* Mobile-Only Bottom Navigation Dock (Role-Aware and Cleanly Isolated) */}
      <BottomNav
        currentRole={currentRole}
        activeTab={
          currentRole === 'customer' || currentRole === 'chef'
            ? activeTab
            : currentRole === 'counter'
            ? counterSubTab
            : adminTab
        }
        setActiveTab={(tabId) => {
          if (currentRole === 'customer' || currentRole === 'chef') {
            if (currentRole === 'chef') {
              setCurrentRole('customer');
            }
            setActiveTab(tabId);
          } else if (currentRole === 'counter') {
            setCounterSubTab(tabId);
          } else if (currentRole === 'admin') {
            setAdminTab(tabId);
          }
        }}
        authSessions={authSessions}
        onRoleSwitch={handleRoleSwitch}
        cartCount={cartCount}
        activeOrdersCount={activeOrdersCount}
        language={language}
      />

      {/* Interface Specific Authentication Modal / Staff Station Gate */}
      <AuthModal
        isOpen={authModal.isOpen}
        targetRole={authModal.targetRole}
        activeSessionRole={authSessions?.admin?.token ? 'admin' : authSessions?.counter?.token ? 'counter' : currentRole}
        onSuccess={handleAuthSuccess}
        onClose={() => {
          setAuthModal({ isOpen: false, targetRole: null });
          if (currentRole !== authModal.targetRole) {
            window.location.hash = currentRole || 'customer';
          }
        }}
        theme={theme}
      />

      {/* Table QR Standee & Direct Order Link Modal */}
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
