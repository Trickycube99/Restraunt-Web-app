import React, { useState } from 'react';
import {
  BarChart3,
  Receipt,
  DollarSign,
  Users,
  Palette,
  TrendingUp,
  Download,
  AlertOctagon,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  Clock,
  FileSpreadsheet,
  Award,
  Layers,
  Sparkles,
  Building2,
  Boxes,
  Crown,
  FileCode,
  Send,
  QrCode,
  Tag,
  Percent,
  Copy,
  Check,
  AlertTriangle,
  CalendarX,
  Camera,
  Upload
} from 'lucide-react';
import { playTapSound, playSuccessChime, playAlertChime } from '../utils/audio';
import BankReconciliationView from './BankReconciliationView';
import InventoryView from './InventoryView';
import LoyaltyView from './LoyaltyView';
import AggregatorReconciliationView from './AggregatorReconciliationView';
import MultiBranchView from './MultiBranchView';
import { exportToTallyPrimeXml, exportToZohoBooksCsv } from '../utils/accountingExport';
import { broadcastSyncEvent, SYNC_EVENTS } from '../utils/sync';
import { STORAGE_KEYS, saveData } from '../utils/storage';
import { DEFAULT_CUTLERY_IMAGE } from '../data/initialData';

export default function AdminView({
  orders,
  menu,
  setMenu,
  expenses,
  setExpenses,
  staff,
  setStaff,
  theme,
  setTheme,
  chef,
  checklists,
  offers = [],
  setOffers,
  activeAdminTab: externalActiveAdminTab,
  setActiveAdminTab: externalSetActiveAdminTab,
  onOpenTableQr
}) {
  const [internalActiveAdminTab, setInternalActiveAdminTab] = useState('sales');
  const activeAdminTab = externalActiveAdminTab !== undefined ? externalActiveAdminTab : internalActiveAdminTab;
  const setActiveAdminTab = externalSetActiveAdminTab || setInternalActiveAdminTab;
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payrollDisbursed, setPayrollDisbursed] = useState(false);

  // Coupons & Offers Management State
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponSearch, setCouponSearch] = useState('');
  const [couponFilter, setCouponFilter] = useState('all'); // 'all' | 'active' | 'expired' | 'inactive'
  const [copiedCouponId, setCopiedCouponId] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'percent',
    value: '',
    minOrderAmount: '',
    maxDiscount: '',
    expiryDate: '',
    description: '',
    isActive: true
  });

  // Expense Logger Form State
  const [expCategory, setExpCategory] = useState('Ingredients & Produce');
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');

  // Payslip Modal State
  const [viewingPayslip, setViewingPayslip] = useState(null);

  // Menu Management Modal State
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishCategory, setNewDishCategory] = useState('Signatures');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishVeg, setNewDishVeg] = useState(true);
  const [newDishBullets, setNewDishBullets] = useState('');
  const [newDishTags, setNewDishTags] = useState("Chef's Special");
  const [newDishImage, setNewDishImage] = useState(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  // User Management State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Counter Assistant');
  const [newStaffWage, setNewStaffWage] = useState('22000');

  // Sales KPIs calculation in ₹
  const totalOrdersCount = orders.length;
  const todayGrossSales = orders.reduce((sum, o) => sum + o.total, 0);
  const weekSales = todayGrossSales * 5.4;
  const monthSales = todayGrossSales * 24.8;

  const cashSplit = orders.filter((o) => o.paymentMode.toLowerCase().includes('cash') || o.paymentMode.toLowerCase().includes('counter')).reduce((s, o) => s + o.total, 0);
  const cardSplit = orders.filter((o) => o.paymentMode.toLowerCase().includes('card')).reduce((s, o) => s + o.total, 0);
  const upiSplit = orders.filter((o) => o.paymentMode.toLowerCase().includes('upi')).reduce((s, o) => s + o.total, 0);

  // P&L Calculations (FR-A3 & 5.4) in ₹
  const totalRecordedExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netDailyProfit = todayGrossSales - totalRecordedExpenses;

  // Cash vs Obligations in ₹ (Section 5.4)
  const totalUpcomingObligations =
    theme.upcomingObligations.rent +
    theme.upcomingObligations.payroll +
    theme.upcomingObligations.emi;
  const totalAvailableFunds = theme.cashInHand + theme.pendingAggregatorSettlement;
  const isCashCrunchAlert = totalAvailableFunds < totalUpcomingObligations;

  // Top Items Analytics (FR-A4)
  const itemCounts = {};
  orders.forEach((o) => {
    o.items.forEach((i) => {
      itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity;
    });
  });

  const sortedItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]);

  // CSV Export Handler (FR-A2)
  const handleExportCSV = () => {
    playTapSound();
    const headers = ['Order ID', 'Customer', 'Table', 'Status', 'Payment Mode', 'Items', 'Subtotal (INR)', 'GST Tax (INR)', 'Total (INR)', 'Timestamp'];
    const rows = orders.map((o) => [
      o.id,
      `"${o.customerName}"`,
      `"${o.table}"`,
      o.statusLabel,
      `"${o.paymentMode}"`,
      `"${o.items.map((i) => `${i.quantity}x ${i.name}`).join('; ')}"`,
      o.subtotal.toFixed(0),
      o.tax.toFixed(1),
      o.total.toFixed(0),
      `"${o.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `advait_orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playSuccessChime();
  };

  // Add Manual Expense (FR-A3)
  const handleAddExpense = (e) => {
    e.preventDefault();
    playTapSound();
    const amt = parseFloat(expAmount);
    if (isNaN(amt) || amt <= 0) return;

    const newExp = {
      id: `exp-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      category: expCategory,
      description: expDesc || expCategory,
      amount: amt,
      loggedBy: 'Owner / Admin'
    };

    setExpenses((prev) => [newExp, ...prev]);
    broadcastSyncEvent(SYNC_EVENTS.EXPENSE_ADDED, newExp);
    setExpAmount('');
    setExpDesc('');
    playSuccessChime();
  };

  // Delete Expense
  const handleDeleteExpense = (id) => {
    playTapSound();
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Handle Dish Photo Upload with Canvas Resizing & Compression (~25KB)
  const handleDishImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setImageUploadLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Compress and resize image using canvas to ensure lightweight cross-device sync
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setNewDishImage(compressedDataUrl);
        setImageUploadLoading(false);
      };
      img.onerror = () => {
        setImageUploadLoading(false);
        alert('Failed to process image. Please try another file.');
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      setImageUploadLoading(false);
    };
    reader.readAsDataURL(file);
  };

  // Menu Management CRUD (FR-A7)
  const handleAddDishSubmit = (e) => {
    e.preventDefault();
    playTapSound();
    const priceNum = parseFloat(newDishPrice);
    if (!newDishName.trim() || isNaN(priceNum)) return;

    const bulletsArray = newDishBullets
      ? newDishBullets.split(',').map((s) => s.trim())
      : ['Freshly prepared with authentic Indian spices & organic ghee'];
    const tagsArray = newDishTags ? newDishTags.split(',').map((s) => s.trim()) : ['New'];

    const newDish = {
      id: Date.now(),
      name: newDishName.trim(),
      category: newDishCategory,
      price: priceNum,
      isVeg: newDishVeg,
      image: newDishImage || null, // If user uploaded an image use it, otherwise null (defaults to cutlery icon)
      isAvailable: true,
      tags: tagsArray,
      bullets: bulletsArray,
      prepTime: '10-12 mins'
    };

    const updated = [newDish, ...(menu || [])];
    setMenu(updated);
    saveData(STORAGE_KEYS.MENU, updated);
    broadcastSyncEvent(SYNC_EVENTS.MENU_UPDATED, updated);
    setShowAddDishModal(false);
    setNewDishName('');
    setNewDishPrice('');
    setNewDishBullets('');
    setNewDishImage(null);
    playSuccessChime();
  };

  const handleDeleteDish = (id) => {
    playTapSound();
    if (window.confirm('Delete this dish from the menu across all devices?')) {
      const updated = (menu || []).filter((d) => d.id !== id);
      setMenu(updated);
      saveData(STORAGE_KEYS.MENU, updated);
      broadcastSyncEvent(SYNC_EVENTS.MENU_UPDATED, updated);
      playAlertChime();
    }
  };

  // User Management
  const handleToggleStaffPermission = (staffId, permKey) => {
    playTapSound();
    setStaff((prev) =>
      prev.map((s) =>
        s.id === staffId
          ? {
              ...s,
              permissions: {
                ...s.permissions,
                [permKey]: !s.permissions[permKey]
              }
            }
          : s
      )
    );
  };

  // Phase 2: Total Net Payroll Calculation
  const totalNetPayroll = staff.reduce((sum, emp) => {
    const dailyRate = emp.monthlyWage / 28;
    const earnedBasic = Number((dailyRate * emp.daysPresent).toFixed(0));
    const overtimePay = Math.round(emp.overtimeHours * (dailyRate / 8) * 1.5);
    const grossPay = Number((earnedBasic + overtimePay).toFixed(0));
    const pfDeduction = Math.round((grossPay * emp.pfRate) / 100);
    const esiDeduction = Math.round((grossPay * emp.esiRate) / 100);
    const tdsDeduction = Math.round((grossPay * emp.tdsRate) / 100);
    return sum + (grossPay - pfDeduction - esiDeduction - tdsDeduction);
  }, 0);

  const handleExecuteBankPayrollBatch = () => {
    playTapSound();
    setPayrollDisbursed(true);
    playSuccessChime();
  };

  const handleExportPayrollCsv = () => {
    playTapSound();
    const headers = ['Employee ID', 'Employee Name', 'Role', 'Monthly Wage (INR)', 'Days Present', 'Gross Pay (INR)', 'PF (12%)', 'ESI (0.75%)', 'TDS', 'Net Salary (INR)', 'Bank IFSC', 'Beneficiary Account'];
    const rows = staff.map((emp) => {
      const dailyRate = emp.monthlyWage / 28;
      const earnedBasic = Number((dailyRate * emp.daysPresent).toFixed(0));
      const overtimePay = Math.round(emp.overtimeHours * (dailyRate / 8) * 1.5);
      const grossPay = Number((earnedBasic + overtimePay).toFixed(0));
      const pfDeduction = Math.round((grossPay * emp.pfRate) / 100);
      const esiDeduction = Math.round((grossPay * emp.esiRate) / 100);
      const tdsDeduction = Math.round((grossPay * emp.tdsRate) / 100);
      const netPay = grossPay - pfDeduction - esiDeduction - tdsDeduction;
      return [
        emp.id,
        `"${emp.name}"`,
        `"${emp.role}"`,
        emp.monthlyWage,
        emp.daysPresent,
        grossPay,
        pfDeduction,
        esiDeduction,
        tdsDeduction,
        netPay,
        'HDFC0000128',
        `"9821004812${emp.id.replace('s', '')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `advait_bank_payroll_batch_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playSuccessChime();
  };

  // Coupons & Offers Helpers
  const isOfferExpired = (offer) => {
    if (!offer || !offer.expiryDate) return false;
    const today = new Date().toISOString().slice(0, 10);
    return offer.expiryDate < today;
  };

  const handleOpenCreateCoupon = () => {
    playTapSound();
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const defaultExpiry = d.toISOString().slice(0, 10);

    setEditingCoupon(null);
    setCouponForm({
      code: '',
      type: 'percent',
      value: '',
      minOrderAmount: '',
      maxDiscount: '',
      expiryDate: defaultExpiry,
      description: '',
      isActive: true
    });
    setShowCouponModal(true);
  };

  const handleOpenEditCoupon = (offer) => {
    playTapSound();
    setEditingCoupon(offer);
    setCouponForm({
      code: offer.code,
      type: offer.type || 'percent',
      value: offer.value.toString(),
      minOrderAmount: offer.minOrderAmount ? offer.minOrderAmount.toString() : '',
      maxDiscount: offer.maxDiscount ? offer.maxDiscount.toString() : '',
      expiryDate: offer.expiryDate || '',
      description: offer.description || '',
      isActive: offer.isActive !== undefined ? offer.isActive : true
    });
    setShowCouponModal(true);
  };

  const handleSaveCoupon = (e) => {
    if (e) e.preventDefault();
    const cleanCode = couponForm.code.trim().toUpperCase();
    if (!cleanCode) {
      alert('Please enter a coupon code.');
      return;
    }
    const numVal = parseFloat(couponForm.value);
    if (isNaN(numVal) || numVal <= 0) {
      alert('Please enter a valid discount value greater than 0.');
      return;
    }

    const offerData = {
      id: editingCoupon ? editingCoupon.id : `off-${Date.now()}`,
      code: cleanCode,
      type: couponForm.type,
      value: numVal,
      minOrderAmount: couponForm.minOrderAmount ? parseFloat(couponForm.minOrderAmount) : 0,
      maxDiscount: couponForm.maxDiscount ? parseFloat(couponForm.maxDiscount) : null,
      expiryDate: couponForm.expiryDate || null,
      description: couponForm.description.trim() || `${numVal}${couponForm.type === 'percent' ? '%' : '₹'} Off Promo`,
      isActive: couponForm.isActive,
      updatedAt: new Date().toISOString()
    };

    let updatedOffers;
    if (editingCoupon) {
      updatedOffers = offers.map((o) => (o.id === editingCoupon.id ? offerData : o));
    } else {
      updatedOffers = [offerData, ...offers];
    }

    if (setOffers) setOffers(updatedOffers);
    saveData(STORAGE_KEYS.OFFERS, updatedOffers);
    broadcastSyncEvent(SYNC_EVENTS.OFFERS_UPDATED, updatedOffers);
    playSuccessChime();
    setShowCouponModal(false);
  };

  const handleDeleteCoupon = (coupon) => {
    playTapSound();
    const isExpired = isOfferExpired(coupon);
    const confirmMsg = isExpired
      ? `Delete expired coupon "${coupon.code}"?`
      : `Are you sure you want to delete coupon "${coupon.code}"?`;
    if (window.confirm(confirmMsg)) {
      const updated = offers.filter((o) => o.id !== coupon.id);
      if (setOffers) setOffers(updated);
      saveData(STORAGE_KEYS.OFFERS, updated);
      broadcastSyncEvent(SYNC_EVENTS.OFFERS_UPDATED, updated);
      playAlertChime();
    }
  };

  const handleDeleteAllExpiredCoupons = () => {
    playTapSound();
    const expiredList = offers.filter((o) => isOfferExpired(o));
    if (expiredList.length === 0) return;
    if (window.confirm(`Delete all ${expiredList.length} expired coupon(s)?`)) {
      const updated = offers.filter((o) => !isOfferExpired(o));
      if (setOffers) setOffers(updated);
      saveData(STORAGE_KEYS.OFFERS, updated);
      broadcastSyncEvent(SYNC_EVENTS.OFFERS_UPDATED, updated);
      playSuccessChime();
    }
  };

  const handleToggleCouponActive = (coupon) => {
    playTapSound();
    const updated = offers.map((o) =>
      o.id === coupon.id ? { ...o, isActive: !o.isActive } : o
    );
    if (setOffers) setOffers(updated);
    saveData(STORAGE_KEYS.OFFERS, updated);
    broadcastSyncEvent(SYNC_EVENTS.OFFERS_UPDATED, updated);
  };

  const handleCopyCouponCode = (code, id) => {
    playTapSound();
    navigator.clipboard.writeText(code);
    setCopiedCouponId(id);
    playSuccessChime();
    setTimeout(() => setCopiedCouponId(null), 2000);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: 85 }}>
      {/* Title */}
      <div style={{ marginBottom: 14 }}>
        <div className="screen-title">Owner Back-Office</div>
        <div className="screen-subtitle">Indian Restaurant Analytics, P&L, Operations & Payroll</div>
      </div>

      {/* Admin Tabs */}
      <div className="filter-tabs-container" style={{ padding: '0 0 12px' }}>
        {[
          { id: 'sales', label: 'Sales Dashboard', inFooter: true },
          { id: 'orders', label: 'Orders & CSV', inFooter: true },
          { id: 'pnl', label: 'P&L & Cash Check', inFooter: true },
          { id: 'offers', label: 'Coupons & Offers', inFooter: true },
          { id: 'bank-rec', label: 'Bank CSV Rec', inFooter: false },
          { id: 'payroll', label: 'Staff Payroll', inFooter: true },
          { id: 'inventory', label: 'Inventory & Wastage', inFooter: false },
          { id: 'loyalty', label: 'Loyalty Club', inFooter: false },
          { id: 'aggregators', label: 'Zomato & Swiggy', inFooter: false },
          { id: 'branches', label: 'Multi-Branch', inFooter: false },
          { id: 'accounting', label: 'Tally / Zoho', inFooter: false },
          { id: 'menu', label: 'Menu CRUD', inFooter: false },
          { id: 'branding', label: 'App Customizer', inFooter: true }
        ].map((tab) => (
          <button
            key={tab.id}
            className={`capsule-tab ${activeAdminTab === tab.id ? 'active' : ''} ${
              tab.inFooter ? 'admin-footer-tab-mobile-hidden' : ''
            }`}
            onClick={() => {
              playTapSound();
              setActiveAdminTab(tab.id);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. SALES DASHBOARD (FR-A1) */}
      {activeAdminTab === 'sales' && (
        <div>
          {/* Quick Zero-Auth Table QR Tent Card Generator Banner */}
          <div
            className="ios-card active-gradient"
            style={{
              padding: '12px 14px',
              marginBottom: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              border: '1.5px solid rgba(0, 122, 255, 0.25)'
            }}
            onClick={() => {
              playTapSound();
              if (onOpenTableQr) onOpenTableQr();
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0, 122, 255, 0.15)'
                }}
              >
                <QrCode size={20} color="#007AFF" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Table QR Tent Cards & Standees
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Contactless QR ordering with zero login barrier for guests
                </div>
              </div>
            </div>
            <button
              className="btn-primary-pill"
              style={{ padding: '6px 14px', fontSize: 12 }}
              onClick={(e) => {
                e.stopPropagation();
                playTapSound();
                if (onOpenTableQr) onOpenTableQr();
              }}
            >
              <span>View QRs</span>
            </button>
          </div>

          {/* Top 3 KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
            <div className="ios-card active-gradient" style={{ padding: '12px 10px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Today's Sales</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-blue)', marginTop: 2 }}>
                ₹{todayGrossSales.toFixed(0)}
              </div>
              <div style={{ fontSize: 10, color: '#16A34A', marginTop: 4 }}>{totalOrdersCount} orders</div>
            </div>

            <div className="ios-card" style={{ padding: '12px 10px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>This Week</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>
                ₹{weekSales.toFixed(0)}
              </div>
              <div style={{ fontSize: 10, color: '#16A34A', marginTop: 4 }}>+18% vs last wk</div>
            </div>

            <div className="ios-card" style={{ padding: '12px 10px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>This Month</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>
                ₹{monthSales.toFixed(0)}
              </div>
              <div style={{ fontSize: 10, color: '#16A34A', marginTop: 4 }}>Target on track</div>
            </div>
          </div>

          {/* Payment Mode Breakdown (FR-A1) */}
          <div className="ios-card" style={{ marginBottom: 16 }}>
            <div className="card-top-row">
              <div className="card-title-group">
                <span className="card-heading">Payment Channel Split</span>
                <span className="card-meta-text">Settlements distribution for today</span>
              </div>
              <Receipt size={18} color="#007AFF" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span>Cash at Counter</span>
                  <strong>₹{cashSplit.toFixed(0)} ({todayGrossSales ? ((cashSplit / todayGrossSales) * 100).toFixed(0) : 0}%)</strong>
                </div>
                <div style={{ height: 6, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: '#10B981',
                      width: `${todayGrossSales ? (cashSplit / todayGrossSales) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span>Card POS Swipe (Pine Labs)</span>
                  <strong>₹{cardSplit.toFixed(0)} ({todayGrossSales ? ((cardSplit / todayGrossSales) * 100).toFixed(0) : 0}%)</strong>
                </div>
                <div style={{ height: 6, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: '#007AFF',
                      width: `${todayGrossSales ? (cardSplit / todayGrossSales) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span>Instant UPI QR (GPay / PhonePe / Paytm)</span>
                  <strong>₹{upiSplit.toFixed(0)} ({todayGrossSales ? ((upiSplit / todayGrossSales) * 100).toFixed(0) : 0}%)</strong>
                </div>
                <div style={{ height: 6, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: '#8B5CF6',
                      width: `${todayGrossSales ? (upiSplit / todayGrossSales) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Top Selling Items & Peak Hours (FR-A4) */}
          <div className="ios-card" style={{ marginBottom: 16 }}>
            <div className="card-top-row">
              <div className="card-title-group">
                <span className="card-heading">Top Selling Dishes</span>
                <span className="card-meta-text">Most popular items by portions served</span>
              </div>
              <Award size={18} color="#D97706" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedItems.slice(0, 5).map(([name, count], idx) => (
                <div
                  key={name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: '#F9FAFB',
                    borderRadius: 10
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: idx === 0 ? '#FEF3C7' : '#E5E7EB',
                        color: idx === 0 ? '#D97706' : '#4B5563',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
                  </div>
                  <span className="status-pill tag" style={{ fontSize: 11 }}>
                    {count} portions
                  </span>
                </div>
              ))}
            </div>

            {/* Peak Hours Breakdown */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Peak Service Rush Hours
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 60, padding: '4px 0' }}>
                {[
                  { time: '12pm', val: 35 },
                  { time: '1pm', val: 80 },
                  { time: '2pm', val: 95 },
                  { time: '3pm', val: 45 },
                  { time: '7pm', val: 70 },
                  { time: '8pm', val: 90 },
                  { time: '9pm', val: 100 },
                  { time: '10pm', val: 65 }
                ].map((slot) => (
                  <div key={slot.time} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div
                      style={{
                        width: '80%',
                        height: `${slot.val * 0.45}px`,
                        background: slot.val > 70 ? 'var(--primary-blue)' : '#CBD5E1',
                        borderRadius: 3
                      }}
                    />
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{slot.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ORDER HISTORY & CSV EXPORT (FR-A2) */}
      {activeAdminTab === 'orders' && (
        <div>
          <div className="ios-card" style={{ marginBottom: 16 }}>
            <div className="card-top-row">
              <div className="card-title-group">
                <span className="card-heading">Complete Order History</span>
                <span className="card-meta-text">Searchable register logs & instant CSV export</span>
              </div>
              <button
                className="btn-primary-pill"
                style={{ padding: '6px 12px', fontSize: 12 }}
                onClick={handleExportCSV}
              >
                <Download size={14} />
                <span>Export to CSV</span>
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              className="ios-input"
              placeholder="Search by order ID, customer name, table..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              style={{ marginBottom: 12 }}
            />

            {/* Filtered Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {orders
                .filter(
                  (o) =>
                    o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
                    o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
                    o.table.toLowerCase().includes(orderSearch.toLowerCase())
                )
                .map((ord) => (
                  <div
                    key={ord.id}
                    style={{
                      padding: '10px 12px',
                      background: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{ord.id}</span>
                        <span className="status-pill tag" style={{ fontSize: 9 }}>
                          {ord.table}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {ord.customerName} • {ord.items.length} items • {ord.paymentMode}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary-blue)' }}>
                        ₹{ord.total.toFixed(0)}
                      </div>
                      <span className="status-pill done" style={{ fontSize: 9, padding: '2px 6px' }}>
                        {ord.statusLabel}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. PROFIT & LOSS & CASH CHECK (FR-A3 & Section 5.4) */}
      {activeAdminTab === 'pnl' && (
        <div>
          {/* Section 5.4 Cash vs Profit & Obligations Alert */}
          {isCashCrunchAlert ? (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #F87171',
                borderRadius: 16,
                padding: 14,
                marginBottom: 16
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#DC2626', fontWeight: 700 }}>
                <AlertOctagon size={20} />
                <span>Section 5.4 Alert: Cash Position Below Fixed Obligations!</span>
              </div>
              <div style={{ fontSize: 12, color: '#991B1B', marginTop: 4 }}>
                Available Funds (Cash in Hand ₹{theme.cashInHand.toLocaleString('en-IN')} + Pending Zomato/Swiggy ₹{theme.pendingAggregatorSettlement.toLocaleString('en-IN')} = ₹{totalAvailableFunds.toLocaleString('en-IN')}) is below upcoming obligations (₹{totalUpcomingObligations.toLocaleString('en-IN')}: Rent ₹{theme.upcomingObligations.rent.toLocaleString('en-IN')}, Payroll ₹{theme.upcomingObligations.payroll.toLocaleString('en-IN')}, EMI ₹{theme.upcomingObligations.emi.toLocaleString('en-IN')}) due on {theme.upcomingObligations.dueDate}.
              </div>
            </div>
          ) : (
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #86EFAC',
                borderRadius: 16,
                padding: 12,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#16A34A',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              <CheckCircle2 size={16} />
              <span>Cash position is healthy. Cash in hand exceeds monthly fixed commitments.</span>
            </div>
          )}

          {/* Daily P&L Summary Card */}
          <div className="ios-card completed-gradient" style={{ marginBottom: 16 }}>
            <div className="card-top-row">
              <div className="card-title-group">
                <span className="card-heading">Daily Profit & Loss Statement (INR)</span>
                <span className="card-meta-text">Gross Sales vs Recorded Operating Expenses</span>
              </div>
              <TrendingUp size={20} color="#16A34A" />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 14,
                padding: '12px 8px',
                textAlign: 'center',
                marginBottom: 12
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Gross Revenue</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-blue)' }}>
                  +₹{todayGrossSales.toFixed(0)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Logged Expenses</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#DC2626' }}>
                  -₹{totalRecordedExpenses.toFixed(0)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Net Real Profit</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: netDailyProfit >= 0 ? '#16A34A' : '#DC2626' }}>
                  ₹{netDailyProfit.toFixed(0)}
                </div>
              </div>
            </div>

            {/* Aggregator Pending Line (Section 5.4 requirement) */}
            <div
              style={{
                background: '#F9FAFB',
                padding: '10px 12px',
                borderRadius: 12,
                fontSize: 12,
                display: 'flex',
                justifyContent: 'space-between',
                color: 'var(--text-secondary)'
              }}
            >
              <span>Pending Zomato & Swiggy Settlements (Receivable):</span>
              <strong>₹{theme.pendingAggregatorSettlement.toLocaleString('en-IN')}</strong>
            </div>

            <div className="card-bottom-progress">
              <div className="card-bottom-progress-fill done" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Manual Expense Entry Logger (FR-A3) */}
          <div className="ios-card" style={{ marginBottom: 16 }}>
            <div className="card-top-row">
              <div className="card-title-group">
                <span className="card-heading">Log Manual Expense (INR)</span>
                <span className="card-meta-text">Vegetables, dairy, LPG gas cylinders, staff meals, maintenance</span>
              </div>
              <Plus size={18} color="#007AFF" />
            </div>

            <form onSubmit={handleAddExpense}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Category</label>
                  <select
                    className="ios-select"
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                  >
                    <option value="Ingredients & Produce">Ingredients & Produce</option>
                    <option value="Daily Dairy & Bakery">Daily Dairy & Bakery</option>
                    <option value="Utilities & Gas">Utilities & LPG Gas</option>
                    <option value="Rent Allocation">Rent Daily Allocation</option>
                    <option value="Staff Wages / Food">Staff Food & Advance</option>
                    <option value="Other & Maintenance">Equipment & Maintenance</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Amount (₹)</label>
                  <input
                    type="number"
                    step="10"
                    className="ios-input"
                    placeholder="e.g. 2400"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Description / Vendor</label>
                <input
                  type="text"
                  className="ios-input"
                  placeholder="e.g. Fresh organic paneer, milk & tandoor coal delivery"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary-pill full-width">
                <Plus size={15} />
                <span>Save Expense to P&L</span>
              </button>
            </form>

            {/* Expenses List */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Recent Logged Expenses:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      background: '#F9FAFB',
                      borderRadius: 10,
                      fontSize: 12
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{exp.category}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {exp.description} • {exp.date}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, color: '#DC2626' }}>-₹{exp.amount.toFixed(0)}</span>
                      <button
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF' }}
                        onClick={() => handleDeleteExpense(exp.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3B. DISCOUNTS, COUPONS & PROMO OFFERS ENGINE */}
      {activeAdminTab === 'offers' && (
        <div>
          {/* Header & KPI Summary */}
          <div className="ios-card" style={{ marginBottom: 16 }}>
            <div className="card-top-row" style={{ flexWrap: 'wrap', gap: 10 }}>
              <div className="card-title-group">
                <span className="card-heading" style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tag size={18} color="#007AFF" />
                  <span>Promo Coupons & Customer Discounts</span>
                </span>
                <span className="card-meta-text">
                  Create, edit, track expiry dates and delete coupons across table QR ordering
                </span>
              </div>
              <button
                className="btn-primary-pill"
                onClick={handleOpenCreateCoupon}
                style={{ padding: '8px 16px', fontSize: 13 }}
              >
                <Plus size={15} />
                <span>Create New Coupon</span>
              </button>
            </div>

            {/* Quick KPI Stat Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: 14 }}>
              <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '10px 12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Total Coupons</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{offers.length}</div>
              </div>

              <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '10px 12px', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>Active Deals</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#15803D', marginTop: 2 }}>
                  {offers.filter((o) => o.isActive && !isOfferExpired(o)).length}
                </div>
              </div>

              <div style={{ background: '#FEF2F2', borderRadius: 12, padding: '10px 12px', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Expired</span>
                  {offers.filter((o) => isOfferExpired(o)).length > 0 && (
                    <button
                      onClick={handleDeleteAllExpiredCoupons}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#B91C1C',
                        fontSize: 10,
                        fontWeight: 700,
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      title="Delete all expired coupons at once"
                    >
                      Delete All
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#B91C1C', marginTop: 2 }}>
                  {offers.filter((o) => isOfferExpired(o)).length}
                </div>
              </div>

              <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '10px 12px', border: '1px solid #BFDBFE' }}>
                <div style={{ fontSize: 11, color: '#2563EB', fontWeight: 600 }}>Orders Discounted</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#1D4ED8', marginTop: 2 }}>
                  {orders.filter((o) => o.discount && o.discount > 0).length}
                </div>
              </div>
            </div>
          </div>

          {/* Filter & Search Controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `All (${offers.length})` },
                { id: 'active', label: `Active (${offers.filter((o) => o.isActive && !isOfferExpired(o)).length})` },
                { id: 'expired', label: `Expired (${offers.filter((o) => isOfferExpired(o)).length})` },
                { id: 'inactive', label: `Disabled (${offers.filter((o) => !o.isActive && !isOfferExpired(o)).length})` }
              ].map((f) => (
                <button
                  key={f.id}
                  className={`capsule-tab ${couponFilter === f.id ? 'active' : ''}`}
                  style={{ fontSize: 12, padding: '5px 12px' }}
                  onClick={() => {
                    playTapSound();
                    setCouponFilter(f.id);
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Search by code or description..."
              className="ios-input"
              value={couponSearch}
              onChange={(e) => setCouponSearch(e.target.value)}
              style={{ maxWidth: 260, fontSize: 12, padding: '6px 12px' }}
            />
          </div>

          {/* Coupon Cards Grid */}
          {(() => {
            const filteredCoupons = offers.filter((off) => {
              const expired = isOfferExpired(off);
              if (couponFilter === 'active' && (!off.isActive || expired)) return false;
              if (couponFilter === 'expired' && !expired) return false;
              if (couponFilter === 'inactive' && (off.isActive || expired)) return false;

              if (couponSearch.trim()) {
                const q = couponSearch.toLowerCase().trim();
                const matchCode = off.code.toLowerCase().includes(q);
                const matchDesc = off.description && off.description.toLowerCase().includes(q);
                return matchCode || matchDesc;
              }
              return true;
            });

            if (filteredCoupons.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '50px 20px', background: '#F9FAFB', borderRadius: 16, border: '1px dashed #D1D5DB' }}>
                  <Tag size={36} color="#9CA3AF" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>No Coupons Found</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, marginBottom: 14 }}>
                    {couponSearch
                      ? `No coupon matches "${couponSearch}".`
                      : couponFilter === 'expired'
                      ? 'No expired coupons! All active coupons are running smoothly.'
                      : 'Create your first discount coupon code to delight diners.'}
                  </div>
                  <button className="btn-primary-pill" onClick={handleOpenCreateCoupon}>
                    <Plus size={14} />
                    <span>Create New Coupon</span>
                  </button>
                </div>
              );
            }

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 12, marginBottom: 20 }}>
                {filteredCoupons.map((off) => {
                  const expired = isOfferExpired(off);
                  return (
                    <div
                      key={off.id}
                      className="ios-card"
                      style={{
                        padding: '14px',
                        border: expired
                          ? '1.5px solid #FECACA'
                          : off.isActive
                          ? '1.5px solid #BBF7D0'
                          : '1px solid #E5E7EB',
                        background: expired ? '#FEF2F2' : '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 12
                      }}
                    >
                      {/* Top: Code & Status */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: 16,
                                fontWeight: 800,
                                background: expired ? '#FEE2E2' : '#EFF6FF',
                                color: expired ? '#991B1B' : '#007AFF',
                                padding: '4px 8px',
                                borderRadius: 8,
                                letterSpacing: '0.04em'
                              }}
                            >
                              {off.code}
                            </span>
                            <button
                              onClick={() => handleCopyCouponCode(off.code, off.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 4,
                                color: copiedCouponId === off.id ? '#16A34A' : '#9CA3AF'
                              }}
                              title="Copy coupon code"
                            >
                              {copiedCouponId === off.id ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>

                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 12,
                              background: expired ? '#FEE2E2' : off.isActive ? '#DCFCE7' : '#F3F4F6',
                              color: expired ? '#DC2626' : off.isActive ? '#15803D' : '#6B7280',
                              border: `1px solid ${expired ? '#FCA5A5' : off.isActive ? '#86EFAC' : '#E5E7EB'}`
                            }}
                          >
                            {expired ? '🔴 Expired' : off.isActive ? '🟢 Active' : '⚪ Paused'}
                          </span>
                        </div>

                        {/* Discount Value */}
                        <div style={{ fontSize: 20, fontWeight: 800, color: expired ? '#6B7280' : '#111827', marginBottom: 4 }}>
                          {off.type === 'percent' ? `${off.value}% OFF` : `₹${off.value} FLAT OFF`}
                        </div>

                        {/* Description */}
                        <div style={{ fontSize: 12.5, color: '#4B5563', lineHeight: 1.4, marginBottom: 8 }}>
                          {off.description || 'Artisanal dining discount offer.'}
                        </div>

                        {/* Rules / Constraints */}
                        <div style={{ fontSize: 11, color: '#6B7280', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div>
                            • Min Order:{' '}
                            <strong style={{ color: '#374151' }}>
                              {off.minOrderAmount > 0 ? `₹${off.minOrderAmount}` : 'No Minimum'}
                            </strong>
                          </div>
                          <div>
                            • Validity:{' '}
                            <strong style={{ color: expired ? '#DC2626' : '#374151' }}>
                              {off.expiryDate ? `Until ${off.expiryDate}` : 'Lifetime / No Expiry'}
                            </strong>
                          </div>
                          {off.type === 'percent' && off.maxDiscount && (
                            <div>
                              • Max Discount: <strong>₹{off.maxDiscount}</strong>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid #E5E7EB',
                          paddingTop: 10
                        }}
                      >
                        {/* Toggle Active Switch */}
                        <button
                          className="btn-secondary-pill"
                          style={{
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 600,
                            color: off.isActive ? '#D97706' : '#16A34A',
                            borderColor: off.isActive ? '#FDE68A' : '#BBF7D0'
                          }}
                          onClick={() => handleToggleCouponActive(off)}
                          title={off.isActive ? 'Pause coupon' : 'Activate coupon'}
                        >
                          {off.isActive ? 'Pause' : 'Activate'}
                        </button>

                        <div style={{ display: 'flex', gap: 6 }}>
                          {/* Edit Button */}
                          <button
                            className="btn-secondary-pill"
                            style={{ padding: '4px 10px', fontSize: 11, gap: 4 }}
                            onClick={() => handleOpenEditCoupon(off)}
                            title="Edit coupon details"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            className="btn-secondary-pill"
                            style={{
                              padding: '4px 10px',
                              fontSize: 11,
                              gap: 4,
                              color: '#DC2626',
                              borderColor: expired ? '#F87171' : '#FECACA',
                              background: expired ? '#FEE2E2' : '#FFFFFF',
                              fontWeight: expired ? 700 : 500
                            }}
                            onClick={() => handleDeleteCoupon(off)}
                            title={expired ? 'Delete expired coupon' : 'Delete coupon'}
                          >
                            <Trash2 size={12} />
                            <span>{expired ? 'Delete Expired' : 'Delete'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* 4. STAFF PAYROLL ASSISTANT (Section 5.4) */}
      {activeAdminTab === 'payroll' && (
        <div>
          <div className="ios-card" style={{ marginBottom: 16 }}>
            <div className="card-top-row">
              <div className="card-title-group">
                <span className="card-heading">Monthly Payroll & Attendance (INR)</span>
                <span className="card-meta-text">Statutory deductions (PF 12%, ESI 0.75%, TDS) & Payslips</span>
              </div>
              <Users size={18} color="#007AFF" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {staff.map((emp) => {
                const totalWorkingDays = 28;
                const dailyRate = emp.monthlyWage / totalWorkingDays;
                const earnedBasic = Number((dailyRate * emp.daysPresent).toFixed(0));
                const overtimePay = Math.round(emp.overtimeHours * (dailyRate / 8) * 1.5);
                const grossPay = Number((earnedBasic + overtimePay).toFixed(0));
                const pfDeduction = Math.round((grossPay * emp.pfRate) / 100);
                const esiDeduction = Math.round((grossPay * emp.esiRate) / 100);
                const tdsDeduction = Math.round((grossPay * emp.tdsRate) / 100);
                const netPay = grossPay - pfDeduction - esiDeduction - tdsDeduction;

                return (
                  <div
                    key={emp.id}
                    style={{
                      padding: '12px',
                      background: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: 14
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{emp.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {emp.role} • Base: ₹{emp.monthlyWage.toLocaleString('en-IN')}/mo
                        </div>
                      </div>
                      <button
                        className="btn-secondary-pill"
                        style={{ padding: '4px 8px', fontSize: 11 }}
                        onClick={() => {
                          playTapSound();
                          setViewingPayslip({
                            ...emp,
                            earnedBasic,
                            grossPay,
                            pfDeduction,
                            esiDeduction,
                            tdsDeduction,
                            netPay
                          });
                        }}
                      >
                        View Payslip
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 6,
                        marginTop: 10,
                        background: '#FFFFFF',
                        padding: 8,
                        borderRadius: 10,
                        fontSize: 11,
                        textAlign: 'center'
                      }}
                    >
                      <div>
                        <div style={{ color: 'var(--text-muted)' }}>Attendance</div>
                        <div style={{ fontWeight: 700 }}>{emp.daysPresent}/28 days</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)' }}>Gross Pay</div>
                        <div style={{ fontWeight: 700 }}>₹{grossPay.toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)' }}>Net Bank Transfer</div>
                        <div style={{ fontWeight: 700, color: '#16A34A' }}>₹{netPay.toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    {/* Permissions Toggles (FR-A6) */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button
                        className="status-pill tag"
                        style={{
                          background: emp.permissions?.canEditPrice ? '#DCFCE7' : '#F3F4F6',
                          color: emp.permissions?.canEditPrice ? '#16A34A' : '#6B7280',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleToggleStaffPermission(emp.id, 'canEditPrice')}
                      >
                        {emp.permissions?.canEditPrice ? '✓ Can Edit Price' : 'No Price Edit'}
                      </button>

                      <button
                        className="status-pill tag"
                        style={{
                          background: emp.permissions?.canCreateDiscounts ? '#DCFCE7' : '#F3F4F6',
                          color: emp.permissions?.canCreateDiscounts ? '#16A34A' : '#6B7280',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleToggleStaffPermission(emp.id, 'canCreateDiscounts')}
                      >
                        {emp.permissions?.canCreateDiscounts ? '✓ Can Issue Offers' : 'No Offers'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Phase 2: Automated Bank Disbursal & Batch CSV Export */}
            <div
              style={{
                marginTop: 14,
                padding: '14px',
                background: '#FFFFFF',
                borderRadius: 14,
                border: '1px solid #E5E7EB'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Corporate Bank Payroll Batch Disbursal</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Direct NEFT/IMPS Salary Transmission via ICICI/HDFC Corporate CMS (Phase 2)
                  </div>
                </div>
                <span className="status-pill done" style={{ fontSize: 10 }}>
                  Statutory Verified
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  className="btn-primary-pill"
                  style={{ fontSize: 12, padding: '7px 14px', background: '#0284C7' }}
                  onClick={handleExecuteBankPayrollBatch}
                >
                  <Send size={13} />
                  <span>Execute Bank Salary Disbursal (₹{totalNetPayroll.toLocaleString('en-IN')})</span>
                </button>

                <button
                  className="btn-secondary-pill"
                  style={{ fontSize: 12, padding: '7px 14px' }}
                  onClick={handleExportPayrollCsv}
                >
                  <Download size={13} />
                  <span>Export Bank Batch CSV</span>
                </button>
              </div>

              {payrollDisbursed && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={14} />
                  <span>Bank payment batch #CMS-SAL-OCT2026 executed successfully! Transaction reference: <strong>HDFC-CMS-994182</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PHASE 2: BANK STATEMENT CSV RECONCILIATION */}
      {activeAdminTab === 'bank-rec' && (
        <BankReconciliationView orders={orders} theme={theme} />
      )}

      {/* PHASE 3: INVENTORY & RECIPE COSTING */}
      {activeAdminTab === 'inventory' && (
        <InventoryView menu={menu} />
      )}

      {/* PHASE 3: CUSTOMER LOYALTY CLUB */}
      {activeAdminTab === 'loyalty' && (
        <LoyaltyView theme={theme} />
      )}

      {/* PHASE 3: ZOMATO & SWIGGY AGGREGATOR RECONCILIATION */}
      {activeAdminTab === 'aggregators' && (
        <AggregatorReconciliationView />
      )}

      {/* PHASE 3: MULTI-BRANCH OUTLETS */}
      {activeAdminTab === 'branches' && (
        <MultiBranchView theme={theme} chef={chef} />
      )}

      {/* PHASE 3: ACCOUNTING EXPORT (TALLY & ZOHO) */}
      {activeAdminTab === 'accounting' && (
        <div>
          <div className="ios-card active-gradient" style={{ marginBottom: 16 }}>
            <div className="card-top-row">
              <div className="card-title-group">
                <span className="card-heading">Accounting Software Integration</span>
                <span className="card-meta-text">Tally Prime XML & Zoho Books Direct Schema Export (Phase 3)</span>
              </div>
              <FileCode size={20} color="#007AFF" />
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              Eliminate manual bookkeeping. Automatically map QR orders, cash/card/UPI splits, and 5% GST tax ledgers into your chartered accountant's software.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {/* Tally Prime XML Card */}
              <div
                style={{
                  padding: 14,
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: '1px solid #E5E7EB'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#007AFF', fontSize: 13 }}>
                    T
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Tally Prime XML</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Voucher & Master Import</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 12 }}>
                  Includes Sales Vouchers, Output CGST 2.5%, SGST 2.5%, and Party/Bank ledgers.
                </div>
                <button
                  className="btn-primary-pill full-width"
                  style={{ fontSize: 12, padding: '8px 12px' }}
                  onClick={() => {
                    playTapSound();
                    exportToTallyPrimeXml(orders, theme);
                    playSuccessChime();
                  }}
                >
                  <Download size={13} />
                  <span>Download Tally XML</span>
                </button>
              </div>

              {/* Zoho Books CSV Card */}
              <div
                style={{
                  padding: 14,
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: '1px solid #E5E7EB'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#D97706', fontSize: 13 }}>
                    Z
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Zoho Books CSV</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Multi-Column Invoice Import</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 12 }}>
                  Standard Zoho Books schema with line items, tax percentage, and payment modes.
                </div>
                <button
                  className="btn-secondary-pill full-width"
                  style={{ fontSize: 12, padding: '8px 12px', color: '#D97706', borderColor: '#FDE68A' }}
                  onClick={() => {
                    playTapSound();
                    exportToZohoBooksCsv(orders, theme);
                    playSuccessChime();
                  }}
                >
                  <Download size={13} />
                  <span>Download Zoho CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MENU MANAGEMENT CRUD (FR-A7) */}
      {activeAdminTab === 'menu' && (
        <div>
          <div className="ios-card" style={{ marginBottom: 16 }}>
            <div className="card-top-row">
              <div className="card-title-group">
                <span className="card-heading">Menu Management (Full CRUD)</span>
                <span className="card-meta-text">Create, edit & manage restaurant items</span>
              </div>
              <button
                className="btn-primary-pill"
                style={{ padding: '6px 12px', fontSize: 12 }}
                onClick={() => {
                  playTapSound();
                  setShowAddDishModal(true);
                }}
              >
                <Plus size={14} />
                <span>Add New Dish</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {menu.map((dish) => (
                <div
                  key={dish.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: 14
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <img
                      src={dish.image || DEFAULT_CUTLERY_IMAGE}
                      alt={dish.name}
                      style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = DEFAULT_CUTLERY_IMAGE;
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{dish.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--primary-blue)', fontWeight: 600 }}>
                        ₹{dish.price.toFixed(0)} • {dish.category}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      className="nav-icon-btn"
                      style={{ width: 30, height: 30, color: '#DC2626' }}
                      onClick={() => handleDeleteDish(dish.id)}
                      title="Delete Dish"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. APP CUSTOMIZER (FR-A5) */}
      {activeAdminTab === 'branding' && (
        <div className="ios-card" style={{ marginBottom: 16 }}>
          <div className="card-top-row">
            <div className="card-title-group">
              <span className="card-heading">Customer Page Customization</span>
              <span className="card-meta-text">No-code branding, layout and welcome settings</span>
            </div>
            <Palette size={18} color="#007AFF" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Restaurant Name</label>
              <input
                type="text"
                className="ios-input"
                value={theme.restaurantName}
                onChange={(e) => setTheme({ ...theme, restaurantName: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Welcome Greeting</label>
              <input
                type="text"
                className="ios-input"
                value={theme.welcomeMessage}
                onChange={(e) => setTheme({ ...theme, welcomeMessage: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Accent Color</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {['#007AFF', '#10B981', '#8B5CF6', '#F59E0B'].map((color) => (
                    <div
                      key={color}
                      onClick={() => setTheme({ ...theme, accentColor: color })}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: color,
                        cursor: 'pointer',
                        border: theme.accentColor === color ? '3px solid #111827' : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Menu Layout</label>
                <select
                  className="ios-select"
                  value={theme.menuLayout}
                  onChange={(e) => setTheme({ ...theme, menuLayout: e.target.value })}
                >
                  <option value="grid">Grid (Cards)</option>
                  <option value="list">Compact List</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                UPI Merchant ID / VPA (Customer QR & Instant App Payment)
              </label>
              <input
                type="text"
                className="ios-input"
                placeholder="e.g. 9119069179@nyes"
                value={theme.upiId || '9119069179@nyes'}
                onChange={(e) => {
                  const updated = { ...theme, upiId: e.target.value.trim() };
                  setTheme(updated);
                  broadcastSyncEvent(SYNC_EVENTS.THEME_UPDATED, updated);
                }}
              />
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                Customer instant UPI QR code scans and app redirects (GPay, PhonePe, Paytm, CRED) will directly credit this UPI address.
              </div>
            </div>

            <div style={{ background: '#F9FAFB', padding: 12, borderRadius: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>FSSAI Verified Chef Display</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {chef.name} is accredited and featured on top customer banner.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Dish Modal (FR-A7) */}
      {showAddDishModal && (
        <div className="modal-overlay" onClick={() => setShowAddDishModal(false)}>
          <div className="modal-content-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-pill" />
            <div className="card-heading" style={{ fontSize: 18, marginBottom: 4 }}>Add New Menu Item</div>
            <div className="card-meta-text" style={{ marginBottom: 14 }}>Will appear in real-time on customer QR menu</div>

            <form onSubmit={handleAddDishSubmit}>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Dish Name</label>
                <input
                  type="text"
                  className="ios-input"
                  placeholder="e.g. Tandoori Stuffed Kulcha Platter"
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Category</label>
                  <select
                    className="ios-select"
                    value={newDishCategory}
                    onChange={(e) => setNewDishCategory(e.target.value)}
                  >
                    <option value="Signatures">Signatures</option>
                    <option value="Mains & Sides">Mains & Sides</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Price (₹)</label>
                  <input
                    type="number"
                    step="5"
                    className="ios-input"
                    placeholder="340"
                    value={newDishPrice}
                    onChange={(e) => setNewDishPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Dietary Type</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <input
                      type="radio"
                      checked={newDishVeg}
                      onChange={() => setNewDishVeg(true)}
                    />
                    <span>Vegetarian (Green Dot)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <input
                      type="radio"
                      checked={!newDishVeg}
                      onChange={() => setNewDishVeg(false)}
                    />
                    <span>Non-Vegetarian (Red Dot)</span>
                  </label>
                </div>
              </div>

              {/* Optional Photo Upload */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                  Dish Photo (Optional)
                </label>

                {newDishImage ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: '#F0FDF4',
                      border: '1.5px solid #86EFAC',
                      borderRadius: 12,
                      padding: '10px 12px'
                    }}
                  >
                    <img
                      src={newDishImage}
                      alt="Uploaded preview"
                      style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#15803D' }}>Photo Uploaded ✓</div>
                      <div style={{ fontSize: 11, color: '#166534' }}>Ready to sync across customer devices</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewDishImage(null)}
                      style={{
                        background: '#FEE2E2',
                        border: '1px solid #FCA5A5',
                        color: '#DC2626',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      id="dish-photo-file-input"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleDishImageUpload}
                    />
                    <div
                      onClick={() => {
                        const input = document.getElementById('dish-photo-file-input');
                        if (input) input.click();
                      }}
                      style={{
                        border: '1.5px dashed #CBD5E1',
                        borderRadius: 12,
                        padding: '14px',
                        textAlign: 'center',
                        background: '#F8FAFC',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#007AFF', fontSize: 13, fontWeight: 600 }}>
                        <Camera size={16} />
                        <span>{imageUploadLoading ? 'Optimizing photo...' : 'Upload Dish Photo (Optional)'}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                        If no photo is uploaded, a default cutlery image will be displayed.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Bullet Description (Comma-separated)</label>
                <input
                  type="text"
                  className="ios-input"
                  placeholder="Slow tandoor baked, stuffed with spiced paneer & served with chhole"
                  value={newDishBullets}
                  onChange={(e) => setNewDishBullets(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary-pill full-width">
                Save & Add to QR Menu
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Modal (Section 5.4 in INR) */}
      {viewingPayslip && (
        <div className="modal-overlay" onClick={() => setViewingPayslip(null)}>
          <div className="modal-content-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-pill" />
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div className="card-heading" style={{ fontSize: 18 }}>Monthly Salary Payslip</div>
              <div className="card-meta-text">Advait Artisanal Indian Kitchen • Period: October 2026</div>
            </div>

            <div
              style={{
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: 14,
                padding: 14,
                fontSize: 12,
                marginBottom: 16
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Employee Name:</span>
                <strong>{viewingPayslip.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Designation:</span>
                <span>{viewingPayslip.role}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Monthly Attendance:</span>
                <span>{viewingPayslip.daysPresent} / 28 working days</span>
              </div>

              <div style={{ borderTop: '1px solid #E5E7EB', margin: '8px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Earned Basic Pay:</span>
                <strong>₹{viewingPayslip.grossPay.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#DC2626' }}>
                <span>Employee Provident Fund PF ({viewingPayslip.pfRate}%):</span>
                <span>-₹{viewingPayslip.pfDeduction.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#DC2626' }}>
                <span>ESI State Health Insurance ({viewingPayslip.esiRate}%):</span>
                <span>-₹{viewingPayslip.esiDeduction.toLocaleString('en-IN')}</span>
              </div>
              {viewingPayslip.tdsDeduction > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#DC2626' }}>
                  <span>TDS Withholding Tax ({viewingPayslip.tdsRate}%):</span>
                  <span>-₹{viewingPayslip.tdsDeduction.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #E5E7EB',
                  paddingTop: 8,
                  marginTop: 6,
                  fontSize: 15,
                  fontWeight: 700
                }}
              >
                <span>Net Bank Transfer (INR):</span>
                <span style={{ color: '#16A34A' }}>₹{viewingPayslip.netPay.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-primary-pill full-width"
                onClick={() => {
                  playTapSound();
                  window.print();
                }}
              >
                <span>Print / Download Payslip</span>
              </button>
              <button
                className="btn-secondary-pill"
                onClick={() => setViewingPayslip(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT COUPON MODAL */}
      {showCouponModal && (
        <div className="modal-overlay" onClick={() => setShowCouponModal(false)} style={{ zIndex: 9999 }}>
          <div
            className="modal-content-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480, width: '92%', borderRadius: 20, padding: 20 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag size={18} color="#007AFF" />
                <span className="card-heading" style={{ fontSize: 17 }}>
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Promo Coupon'}
                </span>
              </div>
              <button
                onClick={() => setShowCouponModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCoupon}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ADVAIT25"
                    className="ios-input"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                    Discount Type *
                  </label>
                  <select
                    className="ios-select"
                    value={couponForm.type}
                    onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}
                  >
                    <option value="percent">Percentage (%) Off</option>
                    <option value="flat">Flat Amount (₹) Off</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                    Discount Value * {couponForm.type === 'percent' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    placeholder={couponForm.type === 'percent' ? 'e.g. 15' : 'e.g. 100'}
                    className="ios-input"
                    value={couponForm.value}
                    onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                    Minimum Order (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="e.g. 500 (0 for none)"
                    className="ios-input"
                    value={couponForm.minOrderAmount}
                    onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    className="ios-input"
                    value={couponForm.expiryDate}
                    onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 250 (Optional)"
                    className="ios-input"
                    value={couponForm.maxDiscount}
                    onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value })}
                    disabled={couponForm.type !== 'percent'}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                  Description / Campaign Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. 15% Off on Dinner & Craft Beverages"
                  className="ios-input"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <input
                  type="checkbox"
                  id="couponIsActiveCheck"
                  checked={couponForm.isActive}
                  onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: '#007AFF' }}
                />
                <label htmlFor="couponIsActiveCheck" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Enable and activate this coupon immediately
                </label>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn-primary-pill full-width" style={{ padding: '10px' }}>
                  <CheckCircle2 size={16} />
                  <span>{editingCoupon ? 'Update Coupon' : 'Publish Coupon'}</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary-pill"
                  onClick={() => setShowCouponModal(false)}
                  style={{ padding: '10px 16px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
