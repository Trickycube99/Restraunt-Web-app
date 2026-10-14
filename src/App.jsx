import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import IosFrame from './components/IosFrame';
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
import { Smartphone, Monitor, RotateCcw, ShieldCheck, QrCode } from 'lucide-react';
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
  const [currentRole, setCurrentRole] = useState('customer'); // 'customer' | 'chef' | 'counter' | 'admin'
  const [activeTab, setActiveTab] = useState('menu'); // customer: 'menu','chef','cart','track' | counter: 'orders','manual','stock','checklist'
  const [counterSubTab, setCounterSubTab] = useState('orders');

  // Frame display mode: iPhone mockup vs full-width
  const [isFullWidth, setIsFullWidth] = useState(false);

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
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="app-container">
      {/* Master Role Switcher Bar (Desktop Control Header) */}
      <div className="role-switch-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 18 }}>🍽️</span>
            <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: -0.3 }}>Flowscape PRD MVP</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>| Switch Role Interface:</span>
        </div>

        {/* Role Tabs */}
        <div className="role-tabs">
          <button
            className={`role-tab-btn ${currentRole === 'customer' ? 'active' : ''}`}
            onClick={() => handleRoleSwitch('customer')}
          >
            <QrCode size={14} />
            <span>Customer (QR Menu)</span>
          </button>

          <button
            className={`role-tab-btn ${currentRole === 'chef' ? 'active' : ''}`}
            onClick={() => handleRoleSwitch('chef')}
          >
            <ShieldCheck size={14} color="#007AFF" />
            <span>Verified Chef Page</span>
          </button>

          <button
            className={`role-tab-btn ${currentRole === 'counter' ? 'active' : ''}`}
            onClick={() => handleRoleSwitch('counter')}
          >
            <span>Live Counter ({activeOrdersCount})</span>
          </button>

          <button
            className={`role-tab-btn ${currentRole === 'kds' ? 'active' : ''}`}
            onClick={() => handleRoleSwitch('kds')}
          >
            <Monitor size={14} color="#38BDF8" />
            <span>Kitchen KDS ({activeOrdersCount})</span>
          </button>

          <button
            className={`role-tab-btn ${currentRole === 'admin' ? 'active' : ''}`}
            onClick={() => handleRoleSwitch('admin')}
          >
            <span>Owner Admin</span>
          </button>
        </div>

        {/* View Mode & Reset Controls */}
        <div className="role-actions">
          <button
            className="btn-secondary-pill"
            style={{ padding: '6px 12px', fontSize: 12 }}
            onClick={() => {
              playTapSound();
              setIsFullWidth(!isFullWidth);
            }}
            title="Toggle between iPhone 16 Pro Frame and Full Desktop Screen"
          >
            {isFullWidth ? <Smartphone size={14} /> : <Monitor size={14} />}
            <span>{isFullWidth ? 'iPhone View' : 'Full Screen'}</span>
          </button>

          <button
            className="btn-secondary-pill"
            style={{ padding: '6px 10px', fontSize: 12, color: '#DC2626' }}
            onClick={handleResetDemo}
            title="Restore initial PRD demonstration data"
          >
            <RotateCcw size={13} />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Main iOS Native Application Frame */}
      <IosFrame
        isFullWidth={isFullWidth}
        setIsFullWidth={setIsFullWidth}
        activeOrdersCount={activeOrdersCount}
        currentRole={currentRole}
      >
        {/* Top iOS Navigation Bar */}
        <Header
          chef={chef}
          theme={theme}
          currentRole={currentRole}
          activeTable={activeTable}
          setActiveTable={setActiveTable}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
          onChefClick={() => handleRoleSwitch('chef')}
        />

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

        {/* Fixed iOS Bottom Dock Navigation */}
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
            } else {
              // Admin handled internally or view switch
            }
          }}
          cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
          activeOrdersCount={activeOrdersCount}
        />
      </IosFrame>
    </div>
  );
}
