import React from 'react';
import {
  Utensils,
  ShieldCheck,
  ShoppingBag,
  Clock,
  Layers,
  PlusCircle,
  SlidersHorizontal,
  CheckSquare,
  BarChart3,
  Receipt,
  DollarSign,
  Users,
  Palette
} from 'lucide-react';
import { playTapSound } from '../utils/audio';

export default function BottomNav({
  currentRole,
  activeTab,
  setActiveTab,
  cartCount,
  activeOrdersCount,
  language = 'en'
}) {
  const getTabs = () => {
    if (currentRole === 'customer') {
      return [
        {
          id: 'menu',
          label: language === 'hi' ? 'मेनू' : 'Menu',
          icon: Utensils
        },
        {
          id: 'cart',
          label: language === 'hi' ? 'थाली' : 'Tray',
          icon: ShoppingBag,
          badge: cartCount > 0 ? cartCount : null
        },
        {
          id: 'track',
          label: language === 'hi' ? 'लाइव स्थिति' : 'Live Status',
          icon: Clock,
          badge: activeOrdersCount > 0 ? activeOrdersCount : null
        },
        {
          id: 'chef',
          label: language === 'hi' ? 'शेफ स्टोरी' : 'Chef & Story',
          icon: ShieldCheck,
          hasDot: true
        }
      ];
    } else if (currentRole === 'chef') {
      return [
        { id: 'menu', label: language === 'hi' ? 'मेनू' : 'Menu', icon: Utensils },
        { id: 'chef', label: language === 'hi' ? 'शेफ' : 'About Chef', icon: ShieldCheck, hasDot: true },
        { id: 'cart', label: language === 'hi' ? 'थाली' : 'Tray', icon: ShoppingBag, badge: cartCount > 0 ? cartCount : null },
        { id: 'track', label: language === 'hi' ? 'लाइव स्थिति' : 'Live Status', icon: Clock, badge: activeOrdersCount > 0 ? activeOrdersCount : null }
      ];
    } else if (currentRole === 'counter') {
      return [
        { id: 'orders', label: 'Live Stack', icon: Layers, badge: activeOrdersCount > 0 ? activeOrdersCount : null },
        { id: 'manual', label: '+ Order', icon: PlusCircle },
        { id: 'stock', label: 'Menu & Rates', icon: SlidersHorizontal },
        { id: 'checklist', label: 'Closing EOD', icon: CheckSquare }
      ];
    } else if (currentRole === 'kds') {
      return [
        { id: 'kds', label: 'KDS Prep', icon: Layers, badge: activeOrdersCount > 0 ? activeOrdersCount : null },
        { id: 'counter', label: 'Live Counter', icon: SlidersHorizontal }
      ];
    } else {
      // Owner Admin
      return [
        { id: 'sales', label: 'Sales', icon: BarChart3 },
        { id: 'orders', label: 'Order & CSV', icon: Receipt },
        { id: 'pnl', label: 'P&L Cash', icon: DollarSign },
        { id: 'payroll', label: 'Payroll', icon: Users },
        { id: 'branding', label: 'Branding', icon: Palette }
      ];
    }
  };

  const tabs = getTabs();

  return (
    <nav className="ios-bottom-nav">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            className={`bottom-tab-item ${isActive ? 'active' : ''}`}
            onClick={() => {
              playTapSound();
              setActiveTab(tab.id);
            }}
          >
            <div className="tab-icon-wrapper">
              <IconComponent size={21} strokeWidth={isActive ? 2.5 : 1.8} />
              {tab.badge && <span className="badge-count">{tab.badge}</span>}
              {tab.hasDot && !tab.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: -1,
                    right: -2,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#10B981'
                  }}
                />
              )}
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
