import React, { useState } from 'react';
import {
  Plus,
  Minus,
  Sparkles,
  ShoppingBag,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Filter,
  Flame,
  Coffee,
  X,
  CreditCard,
  QrCode,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { playTapSound, playSuccessChime } from '../utils/audio';

export default function CustomerView({
  menu,
  chef,
  theme,
  activeTable,
  setActiveTable,
  orders,
  cart,
  setCart,
  onPlaceOrder,
  onGoToChef,
  searchQuery,
  offers
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState(null);
  const [itemNoteInput, setItemNoteInput] = useState('');
  
  // Checkout Form State
  const [customerName, setCustomerName] = useState('Rohan');
  const [customerPhone, setCustomerPhone] = useState('+91 98112-40192');
  const [orderNote, setOrderNote] = useState('');
  const [paymentMode, setPaymentMode] = useState('counter'); // 'counter' | 'upi'
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [showUpiModal, setShowUpiModal] = useState(false);

  // Extract categories
  const categories = ['All', 'Signatures', 'Mains & Sides', 'Beverages', 'Desserts'];

  // Filter menu
  const filteredMenu = menu.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesVeg = !vegOnly || item.isVeg;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.bullets.some((b) => b.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesVeg && matchesSearch;
  });

  // Calculate cart subtotal
  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = Number((cartSubtotal * 0.05).toFixed(2)); // 5% GST (2.5% CGST + 2.5% SGST)
  const discountAmount = appliedPromo
    ? appliedPromo.type === 'percent'
      ? Number(((cartSubtotal * appliedPromo.value) / 100).toFixed(2))
      : Number(Math.min(appliedPromo.value, cartSubtotal).toFixed(2))
    : 0;
  const cartTotal = Math.max(0, Number((cartSubtotal + tax - discountAmount).toFixed(2)));
  const totalItemCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  // Suggestable item for upsell (FR-C8)
  const suggestableItem = menu.find((item) => item.id === 3); // Shikanji Cooler

  // Find latest active customer order for live tracking
  const activeCustomerOrder = orders.find(
    (o) => o.table === activeTable && o.status !== 'done' && o.status !== 'rejected'
  ) || orders[0];

  const handleAddToCart = (item, note = '') => {
    playTapSound();
    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.id === item.id && ci.note === note);
      if (existing) {
        return prevCart.map((ci) =>
          ci.id === item.id && ci.note === note ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prevCart, { ...item, quantity: 1, note }];
    });
  };

  const handleUpdateQuantity = (cartItemIndex, delta) => {
    playTapSound();
    setCart((prevCart) => {
      const updated = [...prevCart];
      const item = updated[cartItemIndex];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        updated.splice(cartItemIndex, 1);
      } else {
        updated[cartItemIndex] = { ...item, quantity: newQty };
      }
      return updated;
    });
  };

  const handleApplyPromo = () => {
    playTapSound();
    const cleanCode = promoInput.trim().toUpperCase();
    const found = offers.find((o) => o.code === cleanCode && o.isActive);
    if (found) {
      setAppliedPromo(found);
      setPromoMessage(`✓ Applied: ${found.description}`);
      playSuccessChime();
    } else {
      setPromoMessage('Invalid or expired coupon code');
    }
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (paymentMode === 'upi') {
      setShowUpiModal(true);
      return;
    }

    completeOrderPlacement('Pay at Counter (Pending)');
  };

  const completeOrderPlacement = (finalPaymentStatus) => {
    const newOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id: newOrderId,
      customerName: customerName || 'Guest Diner',
      table: activeTable,
      phone: customerPhone || 'Unspecified',
      createdAt: new Date().toISOString(),
      status: 'received',
      statusLabel: 'Received by Kitchen',
      items: cart,
      orderNote: orderNote,
      paymentMode: paymentMode === 'upi' ? 'UPI Instant QR' : 'Pay at Counter',
      paymentStatus: finalPaymentStatus,
      subtotal: cartSubtotal,
      tax: tax,
      discount: discountAmount,
      total: cartTotal,
      progressPercent: 25
    };

    onPlaceOrder(newOrder);
    setCart([]);
    setIsCartOpen(false);
    setShowUpiModal(false);
    playSuccessChime();
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 85 }}>
      {/* Verified Chef Callout Header Banner */}
      <div
        className="chef-verified-banner"
        onClick={() => {
          playTapSound();
          onGoToChef();
        }}
        title="Tap to verify Executive Chef credentials"
      >
        <div className="chef-banner-left">
          <img src={chef.portrait} alt={chef.name} className="chef-banner-avatar" />
          <div className="chef-banner-text">
            <div className="chef-banner-title">
              <span>Verified Chef {chef.name}</span>
              <ShieldCheck size={14} color="#007AFF" />
            </div>
            <div className="chef-banner-subtitle">
              FSSAI 5-Star Clean Dining • 18+ Yrs Mastery
            </div>
          </div>
        </div>
        <div className="chef-banner-action">
          <span>Verify</span>
          <ChevronRight size={12} />
        </div>
      </div>

      {/* Screen Title & Welcome */}
      <div style={{ padding: '12px 18px 4px' }}>
        <div className="screen-title">{theme.restaurantName}</div>
        <div className="screen-subtitle">{theme.welcomeMessage}</div>
      </div>

      {/* Filter / Sub-Nav Tabs (Strict Design System Specification) */}
      <div className="filter-tabs-container">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`capsule-tab ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => {
              playTapSound();
              setSelectedCategory(cat);
            }}
          >
            {cat}
          </button>
        ))}

        {/* Veg-only filter pill */}
        <button
          className={`capsule-tab ${vegOnly ? 'active' : ''}`}
          onClick={() => {
            playTapSound();
            setVegOnly(!vegOnly);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            border: vegOnly ? '1px solid #16A34A' : 'none'
          }}
        >
          <span className="veg-badge" />
          <span>Pure Veg Only</span>
        </button>
      </div>

      {/* Active Live Tracking Card (If customer has placed an active order) */}
      {activeCustomerOrder && activeCustomerOrder.status !== 'done' && (
        <div style={{ padding: '0 16px', marginBottom: 12 }}>
          <div className="ios-card active-gradient" style={{ padding: '12px 14px' }}>
            <div className="card-top-row" style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="status-pill progress" style={{ fontSize: 11 }}>
                  {activeCustomerOrder.statusLabel}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {activeCustomerOrder.id}
                </span>
              </div>
              <span className="card-meta-text">{activeCustomerOrder.table}</span>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
              • {activeCustomerOrder.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
            </div>

            {/* Bottom Progress Bar */}
            <div className="card-bottom-progress">
              <div
                className="card-bottom-progress-fill progress"
                style={{ width: `${activeCustomerOrder.progressPercent || 40}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Menu Item Cards Feed */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredMenu.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            No culinary items found matching your filters.
          </div>
        ) : (
          filteredMenu.map((item) => (
            <div
              key={item.id}
              className={`ios-card ${!item.isAvailable ? 'opacity-50' : ''}`}
              style={{
                opacity: item.isAvailable ? 1 : 0.6,
                filter: item.isAvailable ? 'none' : 'grayscale(0.7)'
              }}
            >
              <div style={{ display: 'flex', gap: 14 }}>
                {/* Item Image with Veg/Non-veg badge */}
                <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 14,
                      objectFit: 'cover'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
                      background: 'rgba(255, 255, 255, 0.9)',
                      padding: 3,
                      borderRadius: 4,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {item.isVeg ? <span className="veg-badge" /> : <span className="non-veg-badge" />}
                  </div>
                </div>

                {/* Item Details */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="card-top-row" style={{ marginBottom: 2 }}>
                      <div className="card-heading">{item.name}</div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-blue)', marginBottom: 4 }}>
                      ₹{item.price.toFixed(0)}
                    </div>

                    {/* Bullet point list conforming strictly to design system */}
                    <ul className="body-subtask">
                      {item.bullets.map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Badges and Actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 8
                    }}
                  >
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className="status-pill tag" style={{ fontSize: 10, padding: '2px 8px' }}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    {item.isAvailable ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn-secondary-pill"
                          style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={() => {
                            playTapSound();
                            setCustomizingItem(item);
                            setItemNoteInput('');
                          }}
                          title="Add special culinary instructions"
                        >
                          <MessageSquare size={13} />
                        </button>

                        <button
                          className="btn-primary-pill"
                          style={{ padding: '6px 14px', fontSize: 13 }}
                          onClick={() => handleAddToCart(item)}
                        >
                          <Plus size={14} />
                          <span>Add</span>
                        </button>
                      </div>
                    ) : (
                      <span className="status-pill pending" style={{ fontSize: 11 }}>
                        Sold Out
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Suggestables Upsell Banner (FR-C8) */}
      {suggestableItem && (
        <div style={{ padding: '16px', marginTop: 8 }}>
          <div
            className="ios-card active-gradient"
            style={{
              padding: '12px 14px',
              border: '1px solid rgba(0, 122, 255, 0.2)'
            }}
          >
            <div className="card-top-row" style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="#007AFF" />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-blue)' }}>
                  Chef's Recommended Pairing
                </span>
              </div>
              <span className="status-pill tag" style={{ fontSize: 9 }}>+ Add-On</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src={suggestableItem.image}
                  alt={suggestableItem.name}
                  style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{suggestableItem.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Just +₹{suggestableItem.price.toFixed(0)}
                  </div>
                </div>
              </div>

              <button
                className="btn-primary-pill"
                style={{ padding: '6px 14px', fontSize: 12 }}
                onClick={() => handleAddToCart(suggestableItem, 'Chef Recommended Pairing')}
              >
                <Plus size={13} />
                <span>Add Pairing</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Floating Cart Bar (When Cart Has Items) */}
      {totalItemCount > 0 && (
        <div
          className="floating-cart-bar"
          onClick={() => {
            playTapSound();
            setIsCartOpen(true);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#007AFF',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 13
              }}
            >
              {totalItemCount}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>View Order Tray</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{activeTable} • Dine-in</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>₹{cartTotal.toFixed(0)}</span>
            <ChevronRight size={16} />
          </div>
        </div>
      )}

      {/* Per-Item Customization Modal (FR-C4) */}
      {customizingItem && (
        <div className="modal-overlay" onClick={() => setCustomizingItem(null)}>
          <div className="modal-content-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-pill" />
            <div className="card-heading" style={{ marginBottom: 4 }}>
              Special Notes: {customizingItem.name}
            </div>
            <div className="card-meta-text" style={{ marginBottom: 14 }}>
              Chef will prepare according to your dietary preference.
            </div>

            <textarea
              className="ios-input"
              rows={3}
              placeholder="e.g. Less spicy, Jain preparation, no onions, extra crisp..."
              value={itemNoteInput}
              onChange={(e) => setItemNoteInput(e.target.value)}
              style={{ resize: 'none', marginBottom: 16 }}
            />

            <button
              className="btn-primary-pill full-width"
              onClick={() => {
                handleAddToCart(customizingItem, itemNoteInput);
                setCustomizingItem(null);
                setItemNoteInput('');
              }}
            >
              <Plus size={16} />
              <span>Add to Tray with Note</span>
            </button>
          </div>
        </div>
      )}

      {/* Cart & Checkout Sheet (FR-C3, FR-C4, FR-C5, FR-C7) */}
      {isCartOpen && (
        <div className="modal-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="modal-content-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-pill" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div className="card-heading" style={{ fontSize: 20 }}>Your Order Tray</div>
                <div className="card-meta-text">Prepared fresh for {activeTable}</div>
              </div>
              <button
                className="nav-icon-btn"
                onClick={() => setIsCartOpen(false)}
                aria-label="Close Tray"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cart Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {cart.map((cartItem, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: 14
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {cartItem.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--primary-blue)', fontWeight: 600 }}>
                      ₹{(cartItem.price * cartItem.quantity).toFixed(0)}
                    </div>
                    {cartItem.note && (
                      <div style={{ fontSize: 11, color: '#D97706', fontStyle: 'italic', marginTop: 2 }}>
                        Note: "{cartItem.note}"
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      className="nav-icon-btn"
                      style={{ width: 28, height: 28 }}
                      onClick={() => handleUpdateQuantity(idx, -1)}
                    >
                      <Minus size={13} />
                    </button>
                    <span style={{ fontSize: 14, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>
                      {cartItem.quantity}
                    </span>
                    <button
                      className="nav-icon-btn"
                      style={{ width: 28, height: 28 }}
                      onClick={() => handleUpdateQuantity(idx, 1)}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Order Note (FR-C4) */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Kitchen & Service Note
              </label>
              <input
                type="text"
                className="ios-input"
                placeholder="e.g. Serve shikanji first, extra napkins, less green chilli..."
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
              />
            </div>

            {/* Promo / Discount Code (FR-P5) */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Have a Coupon Code? (Try "ADVAIT10" or "FLAT100")
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  className="ios-input"
                  placeholder="Enter coupon code"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                />
                <button className="btn-secondary-pill" onClick={handleApplyPromo}>
                  Apply
                </button>
              </div>
              {promoMessage && (
                <div style={{ fontSize: 11, marginTop: 4, color: appliedPromo ? '#16A34A' : '#EF4444' }}>
                  {promoMessage}
                </div>
              )}
            </div>

            {/* Diner Info (FR-C5) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Your Name
                </label>
                <input
                  type="text"
                  className="ios-input"
                  placeholder="e.g. Rohan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  className="ios-input"
                  placeholder="+91 98..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Payment Mode Selector (FR-C7) */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Payment Method
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  className="ios-card"
                  style={{
                    padding: '10px',
                    cursor: 'pointer',
                    border: paymentMode === 'counter' ? '2px solid #007AFF' : '1px solid #E5E7EB',
                    background: paymentMode === 'counter' ? '#EFF6FF' : '#FFFFFF'
                  }}
                  onClick={() => setPaymentMode('counter')}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Pay at Counter</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Default (Cash or Card)</div>
                </button>

                <button
                  type="button"
                  className="ios-card"
                  style={{
                    padding: '10px',
                    cursor: 'pointer',
                    border: paymentMode === 'upi' ? '2px solid #007AFF' : '1px solid #E5E7EB',
                    background: paymentMode === 'upi' ? '#EFF6FF' : '#FFFFFF'
                  }}
                  onClick={() => setPaymentMode('upi')}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Instant UPI QR</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>GPay / PhonePe / Paytm</div>
                </button>
              </div>
            </div>

            {/* Price Breakdown */}
            <div
              style={{
                background: '#F9FAFB',
                padding: 12,
                borderRadius: 14,
                marginBottom: 16,
                fontSize: 13
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <span>₹{cartSubtotal.toFixed(0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>GST (5% • 2.5% CGST + 2.5% SGST)</span>
                <span>₹{tax.toFixed(1)}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#16A34A' }}>
                  <span>Discount ({appliedPromo.code})</span>
                  <span>-₹{discountAmount.toFixed(0)}</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: 16,
                  borderTop: '1px solid #E5E7EB',
                  paddingTop: 6,
                  marginTop: 6
                }}
              >
                <span>Total Due</span>
                <span style={{ color: 'var(--primary-blue)' }}>₹{cartTotal.toFixed(0)}</span>
              </div>
            </div>

            {/* Primary Order CTA */}
            <button
              className="btn-primary-pill full-width"
              onClick={handleCheckoutSubmit}
              disabled={cart.length === 0}
            >
              <CheckCircle2 size={18} />
              <span>Confirm Order & Send to Kitchen (₹{cartTotal.toFixed(0)})</span>
            </button>
          </div>
        </div>
      )}

      {/* UPI QR Display Modal (FR-C7) */}
      {showUpiModal && (
        <div className="modal-overlay" onClick={() => setShowUpiModal(false)}>
          <div className="modal-content-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-pill" />
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div className="card-heading" style={{ fontSize: 19 }}>Instant UPI QR Payment</div>
              <div className="card-meta-text">Scan with Google Pay, PhonePe, Paytm, CRED or BHIM</div>
            </div>

            {/* Simulated UPI QR Code Frame */}
            <div
              style={{
                width: 190,
                height: 190,
                background: '#FFFFFF',
                border: '3px solid #111827',
                borderRadius: 18,
                margin: '0 auto 14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
              }}
            >
              <QrCode size={130} color="#111827" />
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4, color: '#007AFF' }}>
                PAY: ₹{cartTotal.toFixed(0)}
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              UPI VPA: <strong>advaitkitchen@icici</strong>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                Accepted Apps: GPay • PhonePe • Paytm • CRED • BHIM
              </div>
            </div>

            <button
              className="btn-primary-pill full-width"
              style={{ background: '#16A34A', marginBottom: 8 }}
              onClick={() => {
                completeOrderPlacement('Paid via UPI QR (Verified)');
              }}
            >
              <CheckCircle2 size={16} />
              <span>Simulate Successful UPI Payment</span>
            </button>

            <button
              className="btn-secondary-pill full-width"
              onClick={() => setShowUpiModal(false)}
            >
              Back to Tray
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
