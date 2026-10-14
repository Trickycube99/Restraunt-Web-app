import React from 'react';
import { Search, QrCode, ShieldCheck, ChevronDown } from 'lucide-react';
import { playTapSound } from '../utils/audio';

export default function Header({
  chef,
  theme,
  currentRole,
  activeTable,
  setActiveTable,
  searchQuery,
  setSearchQuery,
  isSearchOpen,
  setIsSearchOpen,
  onChefClick
}) {
  return (
    <>
      <header className="ios-top-nav">
        {/* Left: Circular Avatar Pill with Initials or Chef Photo */}
        <div
          className="nav-avatar-pill"
          onClick={() => {
            playTapSound();
            if (onChefClick) onChefClick();
          }}
          title="Executive Chef Verification Profile"
        >
          {chef?.portrait ? (
            <img src={chef.portrait} alt={chef.name} />
          ) : (
            <span>{theme.logoText || 'AD'}</span>
          )}
        </div>

        {/* Center: Centered App Title in semi-bold, medium weight */}
        <div className="nav-center-title">
          <div className="nav-app-name">{theme.restaurantName || "Advait Artisanal Kitchen"}</div>
          {currentRole === 'customer' && (
            <div
              className="nav-sub-capsule"
              onClick={() => {
                playTapSound();
                const nextIdx = (theme.tables.indexOf(activeTable) + 1) % theme.tables.length;
                setActiveTable(theme.tables[nextIdx]);
              }}
              title="Click to switch simulated QR table"
            >
              <QrCode size={10} />
              <span>{activeTable}</span>
              <ChevronDown size={10} />
            </div>
          )}
          {currentRole === 'counter' && (
            <div className="nav-sub-capsule" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              <span>Live POS Counter</span>
            </div>
          )}
          {currentRole === 'admin' && (
            <div className="nav-sub-capsule" style={{ background: '#F3E8FF', color: '#7E22CE' }}>
              <span>Owner Back-Office</span>
            </div>
          )}
        </div>

        {/* Right: Minimalist Search Icon */}
        <button
          className="nav-icon-btn"
          onClick={() => {
            playTapSound();
            setIsSearchOpen(!isSearchOpen);
          }}
          aria-label="Search Menu"
          title="Search items or notes"
        >
          <Search size={18} strokeWidth={2.2} />
        </button>
      </header>

      {/* Expandable Search Input Row */}
      {isSearchOpen && (
        <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.95)', borderBottom: '1px solid #E5E7EB' }}>
          <input
            type="text"
            className="ios-input"
            placeholder="Search artisanal dishes, ingredients, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
      )}
    </>
  );
}
