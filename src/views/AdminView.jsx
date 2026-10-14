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
  Send
} from 'lucide-react';
import { playTapSound, playSuccessChime, playAlertChime } from '../utils/audio';
import BankReconciliationView from './BankReconciliationView';
import InventoryView from './InventoryView';
import LoyaltyView from './LoyaltyView';
import AggregatorReconciliationView from './AggregatorReconciliationView';
import MultiBranchView from './MultiBranchView';
import { exportToTallyPrimeXml, exportToZohoBooksCsv } from '../utils/accountingExport';

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
  checklists
}) {
  const [activeAdminTab, setActiveAdminTab] = useState('sales'); // 'sales', 'orders', 'pnl', 'bank-rec', 'payroll', 'inventory', 'loyalty', 'aggregators', 'branches', 'accounting', 'menu', 'branding'
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payrollDisbursed, setPayrollDisbursed] = useState(false);

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
    setExpAmount('');
    setExpDesc('');
    playSuccessChime();
  };

  // Delete Expense
  const handleDeleteExpense = (id) => {
    playTapSound();
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Menu Management CRUD (FR-A7)
  const handleAddDishSubmit = (e) => {
    e.preventDefault();
    playTapSound();
    const priceNum = parseFloat(newDishPrice);
    if (!newDishName || isNaN(priceNum)) return;

    const bulletsArray = newDishBullets
      ? newDishBullets.split(',').map((s) => s.trim())
      : ['Freshly prepared with authentic Indian spices & organic ghee'];
    const tagsArray = newDishTags ? newDishTags.split(',').map((s) => s.trim()) : ['New'];

    const newDish = {
      id: Date.now(),
      name: newDishName,
      category: newDishCategory,
      price: priceNum,
      isVeg: newDishVeg,
      image: newDishVeg
        ? '/assets/burrata_paneer_pizza.jpg'
        : '/assets/butter_chicken_burger.jpg',
      isAvailable: true,
      tags: tagsArray,
      bullets: bulletsArray,
      prepTime: '10-12 mins'
    };

    setMenu((prev) => [newDish, ...prev]);
    setShowAddDishModal(false);
    setNewDishName('');
    setNewDishPrice('');
    setNewDishBullets('');
    playSuccessChime();
  };

  const handleDeleteDish = (id) => {
    playTapSound();
    setMenu((prev) => prev.filter((d) => d.id !== id));
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
          { id: 'sales', label: 'Sales Dashboard' },
          { id: 'orders', label: 'Orders & CSV' },
          { id: 'pnl', label: 'P&L & Cash Check' },
          { id: 'bank-rec', label: 'Bank CSV Rec' },
          { id: 'payroll', label: 'Staff Payroll' },
          { id: 'inventory', label: 'Inventory & Wastage' },
          { id: 'loyalty', label: 'Loyalty Club' },
          { id: 'aggregators', label: 'Zomato & Swiggy' },
          { id: 'branches', label: 'Multi-Branch' },
          { id: 'accounting', label: 'Tally / Zoho' },
          { id: 'menu', label: 'Menu CRUD' },
          { id: 'branding', label: 'App Customizer' }
        ].map((tab) => (
          <button
            key={tab.id}
            className={`capsule-tab ${activeAdminTab === tab.id ? 'active' : ''}`}
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
                      src={dish.image}
                      alt={dish.name}
                      style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }}
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
    </div>
  );
}
