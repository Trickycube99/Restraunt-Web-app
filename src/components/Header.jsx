import React, { useState } from 'react';
import {
  Search,
  QrCode,
  ShieldCheck,
  ChevronDown,
  Layers,
  Monitor,
  BarChart3,
  RotateCcw,
  ShoppingBag,
  MapPin,
  CheckCircle2,
  Utensils
} from 'lucide-react';
import { playTapSound } from '../utils/audio';

export default function Header({
  chef,
  theme,
  currentRole,
  onRoleSwitch,
  activeTable,
  setActiveTable,
  searchQuery,
  setSearchQuery,
  isSearchOpen,
  setIsSearchOpen,
  onChefClick,
  activeOrdersCount,
  cartCount,
  cartTotal,
  onOpenCart,
  onResetDemo
}) {
  const [activeBranch, setActiveBranch] = useState('Connaught Place, New Delhi');
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showMobileRoleMenu, setShowMobileRoleMenu] = useState(false);

  const branches = [
    'Connaught Place, New Delhi (Flagship)',
    'DLF Cyber Hub, Gurugram',
    '12th Main Indiranagar, Bengaluru'
  ];

  return (
    <>
      <header className="production-header">
        {/* Left Section: Brand, FSSAI Badge & Branch Switcher */}
        <div className="header-left">
          <div
            className="brand-pill"
            onClick={() => {
              playTapSound();
              if (onChefClick) onChefClick();
            }}
            title="Advait Kitchen & Verified Executive Chef Rakesh Sharma"
          >
            <div className="brand-avatar-box">
              {chef?.portrait ? (
                <img src={chef.portrait} alt={chef.name} />
              ) : (
                <span>AD</span>
              )}
            </div>
            <div className="brand-info">
              <div className="brand-name-row">
                <span className="brand-title">{theme.restaurantName || 'Advait Artisanal Indian Kitchen'}</span>
                <span className="fssai-micro-badge">
                  <ShieldCheck size={11} color="#16A34A" />
                  <span>FSSAI Verified</span>
                </span>
              </div>
              
              {/* Branch Selector Pill */}
              <div
                className="branch-selector-pill"
                onClick={(e) => {
                  e.stopPropagation();
                  playTapSound();
                  setShowBranchMenu(!showBranchMenu);
                }}
              >
                <MapPin size={10} color="#007AFF" />
                <span>{activeBranch.split('(')[0].trim()}</span>
                <ChevronDown size={10} />
              </div>

              {showBranchMenu && (
                <div className="branch-dropdown-menu">
                  {branches.map((b) => (
                    <div
                      key={b}
                      className={`branch-dropdown-item ${activeBranch === b ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        playTapSound();
                        setActiveBranch(b);
                        setShowBranchMenu(false);
                      }}
                    >
                      <CheckCircle2 size={12} color={activeBranch === b ? '#007AFF' : 'transparent'} />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Section: Full Desktop / Tablet Role Navigation */}
        <nav className="header-center-nav">
          <button
            className={`nav-role-pill ${currentRole === 'customer' ? 'active' : ''}`}
            onClick={() => onRoleSwitch('customer')}
          >
            <QrCode size={14} />
            <span>QR Menu</span>
            {currentRole === 'customer' && (
              <span
                className="table-tag-pill"
                onClick={(e) => {
                  e.stopPropagation();
                  playTapSound();
                  const nextIdx = (theme.tables.indexOf(activeTable) + 1) % theme.tables.length;
                  setActiveTable(theme.tables[nextIdx]);
                }}
                title="Switch simulated table"
              >
                {activeTable}
                <ChevronDown size={9} />
              </span>
            )}
          </button>

          <button
            className={`nav-role-pill ${currentRole === 'chef' ? 'active' : ''}`}
            onClick={() => onRoleSwitch('chef')}
          >
            <ShieldCheck size={14} color={currentRole === 'chef' ? '#FFFFFF' : '#007AFF'} />
            <span>About Chef</span>
          </button>

          <button
            className={`nav-role-pill ${currentRole === 'counter' ? 'active' : ''}`}
            onClick={() => onRoleSwitch('counter')}
          >
            <Layers size={14} />
            <span>Live POS</span>
            {activeOrdersCount > 0 && (
              <span className="nav-badge-pill">{activeOrdersCount}</span>
            )}
          </button>

          <button
            className={`nav-role-pill ${currentRole === 'kds' ? 'active' : ''}`}
            onClick={() => onRoleSwitch('kds')}
          >
            <Monitor size={14} color={currentRole === 'kds' ? '#FFFFFF' : '#38BDF8'} />
            <span>Kitchen KDS</span>
            {activeOrdersCount > 0 && (
              <span className="nav-badge-pill kds">{activeOrdersCount}</span>
            )}
          </button>

          <button
            className={`nav-role-pill ${currentRole === 'admin' ? 'active' : ''}`}
            onClick={() => onRoleSwitch('admin')}
          >
            <BarChart3 size={14} />
            <span>Owner Admin</span>
          </button>
        </nav>

        {/* Right Section: Search, Cart Summary & Utilities */}
        <div className="header-right">
          {/* Mobile Role Switcher Trigger */}
          <div className="mobile-role-selector">
            <button
              className="btn-secondary-pill mobile-role-btn"
              onClick={() => {
                playTapSound();
                setShowMobileRoleMenu(!showMobileRoleMenu);
              }}
            >
              <span>{currentRole === 'customer' ? 'QR Menu' : currentRole === 'chef' ? 'About Chef' : currentRole === 'counter' ? 'Live POS' : currentRole === 'kds' ? 'KDS' : 'Admin'}</span>
              <ChevronDown size={12} />
            </button>

            {showMobileRoleMenu && (
              <div className="mobile-role-dropdown">
                {[
                  { id: 'customer', label: 'Customer (QR Menu)', icon: QrCode },
                  { id: 'chef', label: 'Verified Chef Page', icon: ShieldCheck },
                  { id: 'counter', label: `Live POS (${activeOrdersCount})`, icon: Layers },
                  { id: 'kds', label: `Kitchen KDS (${activeOrdersCount})`, icon: Monitor },
                  { id: 'admin', label: 'Owner Back-Office', icon: BarChart3 }
                ].map((item) => (
                  <div
                    key={item.id}
                    className={`mobile-role-dropdown-item ${currentRole === item.id ? 'active' : ''}`}
                    onClick={() => {
                      playTapSound();
                      onRoleSwitch(item.id);
                      setShowMobileRoleMenu(false);
                    }}
                  >
                    <item.icon size={14} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search Button */}
          <button
            className={`nav-icon-btn ${isSearchOpen ? 'active' : ''}`}
            onClick={() => {
              playTapSound();
              setIsSearchOpen(!isSearchOpen);
            }}
            title="Search dishes & dietary preferences"
          >
            <Search size={16} />
          </button>

          {/* Quick Cart Trigger (Visible on all views if cart has items) */}
          {cartCount > 0 && (
            <button
              className="btn-primary-pill header-cart-pill"
              onClick={() => {
                playTapSound();
                if (onOpenCart) onOpenCart();
              }}
              title="Open your dining tray"
            >
              <ShoppingBag size={14} />
              <span>₹{cartTotal.toFixed(0)}</span>
              <span className="cart-bubble-count">{cartCount}</span>
            </button>
          )}

          {/* Reset Demo Data Button */}
          <button
            className="btn-secondary-pill reset-demo-pill"
            onClick={onResetDemo}
            title="Reset demonstration data to defaults"
          >
            <RotateCcw size={12} />
            <span className="reset-label">Reset</span>
          </button>
        </div>
      </header>

      {/* Expandable Search Input Row */}
      {isSearchOpen && (
        <div className="header-search-bar">
          <div className="search-bar-inner">
            <Search size={16} color="#9CA3AF" />
            <input
              type="text"
              placeholder="Search artisanal signatures, ingredients, or dietary preferences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
