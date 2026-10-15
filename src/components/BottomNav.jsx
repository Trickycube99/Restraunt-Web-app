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
  Palette,
  Monitor,
  Tag
} from 'lucide-react';
import { playTapSound } from '../utils/audio';
import { canKdsReturnToAdmin, canKdsReturnToCounter } from '../utils/auth';

export default function BottomNav({
  currentRole,
  activeTab,
  setActiveTab,
  cartCount,
  activeOrdersCount,
  language = 'en',
  authSessions = {}
}) {
  const getTabs = () => {
    if (currentRole === 'customer' || currentRole === 'chef') {
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
    } else if (currentRole === 'counter') {
      return [
        { id: 'orders', label: 'Live Stack', icon: Layers, badge: activeOrdersCount > 0 ? activeOrdersCount : null },
        { id: 'manual', label: '+ Order', icon: PlusCircle },
        { id: 'stock', label: 'Menu & Rates', icon: SlidersHorizontal },
        { id: 'checklist', label: 'Closing EOD', icon: CheckSquare }
      ];
    } else if (currentRole === 'kds') {
      const hasAdmin = canKdsReturnToAdmin(authSessions);
      const hasCounter = canKdsReturnToCounter(authSessions);
      if (hasAdmin) {
        return [
          { id: 'admin', label: 'Admin', icon: BarChart3 },
          { id: 'counter', label: 'Live POS', icon: Layers },
          { id: 'kds', label: 'Kitchen KDS', icon: Monitor, badge: activeOrdersCount > 0 ? activeOrdersCount : null }
        ];
      }
      if (hasCounter) {
        return [
          { id: 'counter', label: 'Back to POS', icon: Layers },
          { id: 'kds', label: 'Kitchen KDS', icon: Monitor, badge: activeOrdersCount > 0 ? activeOrdersCount : null }
        ];
      }
      return [
        { id: 'kds', label: 'Kitchen KDS', icon: Monitor, badge: activeOrdersCount > 0 ? activeOrdersCount : null }
      ];
    } else {
      // Owner Admin
      return [
        { id: 'sales', label: 'Sales', icon: BarChart3 },
        { id: 'orders', label: 'Orders', icon: Receipt },
        { id: 'offers', label: 'Coupons', icon: Tag },
        { id: 'pnl', label: 'P&L Cash', icon: DollarSign },
        { id: 'payroll', label: 'Payroll', icon: Users }
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
