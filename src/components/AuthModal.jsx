import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  QrCode,
  Layers,
  Monitor,
  BarChart3,
  KeyRound,
  User,
  Phone,
  Sparkles,
  AlertCircle,
  X,
  ChevronRight,
  CheckCircle2,
  MapPin,
  Utensils
} from 'lucide-react';
import { ROLE_CONFIGS, ROLES, authenticateRole } from '../utils/auth';
import { playTapSound, playSuccessChime, playAlertChime } from '../utils/audio';

export default function AuthModal({
  isOpen,
  targetRole = ROLES.COUNTER,
  activeSessionRole = null,
  onSuccess,
  onClose,
  theme
}) {
  const [currentStation, setCurrentStation] = useState(targetRole || ROLES.COUNTER);

  useEffect(() => {
    if (targetRole && targetRole !== ROLES.CUSTOMER) {
      setCurrentStation(targetRole);
    } else {
      setCurrentStation(ROLES.COUNTER);
    }
  }, [targetRole]);

  const roleConfig = ROLE_CONFIGS[currentStation] || ROLE_CONFIGS[ROLES.COUNTER];

  // Form states based on currentStation
  const [formData, setFormData] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when currentStation changes
  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage('');
    if (currentStation === ROLES.ADMIN) {
      setFormData({
        name: '',
        email: roleConfig.demoCredentials?.email || 'admin@advaitkitchen.com',
        pin: ''
      });
    } else {
      // Default to Counter
      setFormData({
        terminal: roleConfig.demoCredentials?.terminal || 'POS-01 (Flagship CP)',
        cashierName: '',
        pin: ''
      });
    }
  }, [currentStation, isOpen, roleConfig]);

  if (!isOpen) return null;

  // Only Counterperson POS and Owner Admin require authentication
  const allTabs = [
    { id: ROLES.COUNTER, label: 'Counterperson POS', icon: Layers },
    { id: ROLES.ADMIN, label: 'Owner Admin', icon: BarChart3 }
  ];

  const allowedTabs = allTabs.filter((t) => {
    if (activeSessionRole === ROLES.COUNTER) {
      return t.id === ROLES.COUNTER;
    }
    return true;
  });

  // Quick 1-tap demo credentials filler
  const handleAutoFillDemo = () => {
    playTapSound();
    setErrorMessage('');
    if (currentStation === ROLES.ADMIN) {
      setFormData({
        name: 'Sanjay Malhotra',
        email: 'admin@advaitkitchen.com',
        pin: '8821'
      });
    } else {
      setFormData({
        terminal: 'POS-01 (Flagship CP)',
        cashierName: 'Rohan Verma',
        pin: '4421'
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    playTapSound();
    setIsSubmitting(true);
    setErrorMessage('');

    // Attempt authentication via abstraction layer
    const result = authenticateRole(currentStation, formData);

    if (result.success) {
      playSuccessChime();
      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess(result.session);
      }, 200);
    } else {
      playAlertChime();
      setIsSubmitting(false);
      setErrorMessage(result.error);
    }
  };

  const getRoleIcon = () => {
    switch (currentStation) {
      case ROLES.COUNTER:
        return <Layers size={24} color="#F59E0B" />;
      case ROLES.ADMIN:
        return <BarChart3 size={24} color="#8B5CF6" />;
      case ROLES.KDS:
        return <Monitor size={24} color="#38BDF8" />;
      case ROLES.CHEF:
        return <ShieldCheck size={24} color="#16A34A" />;
      default:
        return <Lock size={24} color="#007AFF" />;
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="auth-modal-header">
          <div className="auth-role-avatar-wrapper">
            <div className={`auth-role-avatar role-${currentStation}`}>
              {getRoleIcon()}
            </div>
            <div>
              <div className="auth-role-badge">
                <Lock size={11} />
                <span>Restaurant Staff Station</span>
              </div>
              <h3 className="auth-modal-title">{roleConfig.name}</h3>
            </div>
          </div>
          <button
            className="auth-modal-close-btn"
            onClick={() => {
              playTapSound();
              onClose();
            }}
            aria-label="Close authentication modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Station Selector Tabs for Staff (Filtered by Permissions) */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${allowedTabs.length}, 1fr)`, gap: 6, margin: '10px 0 14px' }}>
          {allowedTabs.map((st) => (
            <button
              key={st.id}
              type="button"
              className={`btn-secondary-pill ${currentStation === st.id ? 'active' : ''}`}
              style={{
                padding: '6px 4px',
                fontSize: 11,
                justifyContent: 'center',
                background: currentStation === st.id ? '#EFF6FF' : '#F9FAFB',
                borderColor: currentStation === st.id ? '#007AFF' : '#E5E7EB',
                color: currentStation === st.id ? '#007AFF' : 'var(--text-secondary)'
              }}
              onClick={() => {
                playTapSound();
                setCurrentStation(st.id);
              }}
            >
              <st.icon size={12} />
              <span>{st.label}</span>
            </button>
          ))}
        </div>

        {/* Access Matrix Summary Box */}
        <div style={{
          background: '#F0F9FF',
          border: '1px solid #BAE6FD',
          borderRadius: 10,
          padding: '8px 10px',
          fontSize: 11,
          color: '#0369A1',
          marginBottom: 12,
          lineHeight: 1.45
        }}>
          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, color: '#0284C7' }}>
            <ShieldCheck size={13} />
            <span>Role-Based Access Hierarchy:</span>
          </div>
          <div style={{ fontSize: 10.5, color: '#0C4A6E' }}>
            • <b>Admin (8821):</b> Master access to Admin, Counter POS & Kitchen KDS<br />
            • <b>Counter (4421):</b> Access to Counter POS & Kitchen KDS (Admin blocked)<br />
            • <b>Kitchen (7700):</b> Access to Kitchen KDS ONLY (Counter & Admin blocked)
          </div>
        </div>

        {/* Security Description */}
        <div className="auth-security-banner">
          <div className="auth-security-pill">
            <KeyRound size={12} color="#007AFF" />
            <span>{roleConfig.securityLevel}</span>
          </div>
          <p className="auth-description">{roleConfig.description}</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="auth-error-banner">
            <AlertCircle size={16} color="#EF4444" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Dynamic Form based on Target Role */}
        <form onSubmit={handleSubmit} className="auth-modal-form">
          {/* COUNTER POS FORM */}
          {currentStation === ROLES.COUNTER && (
            <>
              <div className="auth-input-group">
                <label className="auth-label">
                  <User size={13} />
                  <span>Cashier / Counterperson Name *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Cashier Name (e.g. Rohan Verma)"
                  className="auth-input"
                  value={formData.cashierName || ''}
                  onChange={(e) => setFormData({ ...formData, cashierName: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">
                  <KeyRound size={13} />
                  <span>Staff 4-Digit POS PIN *</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter POS PIN (Demo: 4421)"
                  className="auth-input"
                  maxLength={4}
                  value={formData.pin || ''}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">
                  <MapPin size={13} />
                  <span>Cashier Terminal & Branch</span>
                </label>
                <select
                  className="auth-input auth-select"
                  value={formData.terminal || 'POS-01 (Flagship CP)'}
                  onChange={(e) => setFormData({ ...formData, terminal: e.target.value })}
                >
                  <option value="POS-01 (Flagship CP)">POS-01 (Flagship CP, New Delhi)</option>
                  <option value="POS-02 (Cyber Hub)">POS-02 (DLF Cyber Hub, Gurugram)</option>
                  <option value="POS-03 (Indiranagar)">POS-03 (12th Main Indiranagar, BLR)</option>
                </select>
              </div>
            </>
          )}

          {/* ADMIN FORM */}
          {currentStation === ROLES.ADMIN && (
            <>
              <div className="auth-input-group">
                <label className="auth-label">
                  <User size={13} />
                  <span>Administrator / Owner Name *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Owner / Admin Name (e.g. Sanjay Malhotra)"
                  className="auth-input"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">
                  <KeyRound size={13} />
                  <span>Owner Executive Email *</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@advaitkitchen.com"
                  className="auth-input"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">
                  <KeyRound size={13} />
                  <span>Master Owner PIN / Password *</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter Master PIN (Demo: 8821)"
                  className="auth-input"
                  maxLength={8}
                  value={formData.pin || ''}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                />
                <span className="auth-hint">Protects P&L cash, sales analytics, payroll & accounting. Only Admin credentials permitted.</span>
              </div>
            </>
          )}

          {/* 1-Tap Demo Credentials Helper */}
          <div className="auth-demo-box">
            <button
              type="button"
              className="auth-demo-btn"
              onClick={handleAutoFillDemo}
            >
              <Sparkles size={14} color="#F59E0B" />
              <span>1-Tap Demo Auto-Fill</span>
            </button>
            <div className="auth-demo-hint">
              {currentStation === ROLES.COUNTER && 'Cashier PIN: 4421 • Admin Master: 8821 (Kitchen blocked)'}
              {currentStation === ROLES.ADMIN && 'admin@advaitkitchen.com • PIN: 8821 (Admin Only - Staff blocked)'}
              {currentStation === ROLES.KDS && 'Kitchen: 7700 • Counter: 4421 • Admin: 8821 (All Authorized)'}
              {currentStation === ROLES.CHEF && 'Passkey PIN: 1002'}
            </div>
          </div>

          {/* Actions */}
          <div className="auth-actions-row">
            <button
              type="button"
              className="btn-secondary-pill auth-cancel-btn"
              onClick={() => {
                playTapSound();
                onClose();
              }}
            >
              Back to Dining Menu
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary-pill auth-submit-btn"
            >
              <span>{isSubmitting ? 'Authenticating...' : `Unlock ${roleConfig.shortName}`}</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
