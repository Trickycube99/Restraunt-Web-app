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
    if (currentStation === ROLES.CHEF) {
      setFormData({
        email: roleConfig.demoCredentials?.email || 'chef@advait.in',
        pin: ''
      });
    } else if (currentStation === ROLES.COUNTER) {
      setFormData({
        terminal: roleConfig.demoCredentials?.terminal || 'POS-01 (Flagship CP)',
        cashierName: roleConfig.demoCredentials?.cashierName || 'Rohan Verma',
        pin: ''
      });
    } else if (currentStation === ROLES.KDS) {
      setFormData({
        station: roleConfig.demoCredentials?.station || 'Hot Line & Tandoor Station',
        leadName: roleConfig.demoCredentials?.leadName || 'Vikram Singh',
        pin: ''
      });
    } else if (currentStation === ROLES.ADMIN) {
      setFormData({
        email: roleConfig.demoCredentials?.email || 'admin@advaitkitchen.com',
        pin: ''
      });
    }
  }, [currentStation, isOpen, roleConfig]);

  if (!isOpen) return null;

  // Quick 1-tap demo credentials filler
  const handleAutoFillDemo = () => {
    playTapSound();
    setErrorMessage('');
    setFormData({ ...roleConfig.demoCredentials });
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

        {/* Station Selector Tabs for Staff */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, margin: '10px 0 14px' }}>
          {[
            { id: ROLES.COUNTER, label: 'POS', icon: Layers },
            { id: ROLES.ADMIN, label: 'Admin', icon: BarChart3 },
            { id: ROLES.KDS, label: 'KDS', icon: Monitor },
            { id: ROLES.CHEF, label: 'Chef', icon: ShieldCheck }
          ].map((st) => (
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

              <div className="auth-input-group">
                <label className="auth-label">
                  <User size={13} />
                  <span>Cashier Shift Operator</span>
                </label>
                <input
                  type="text"
                  placeholder="Staff Name"
                  className="auth-input"
                  value={formData.cashierName || 'Rohan Verma'}
                  onChange={(e) => setFormData({ ...formData, cashierName: e.target.value })}
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">
                  <KeyRound size={13} />
                  <span>Staff 4-Digit POS PIN</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter POS PIN (Demo: 4421)"
                  className="auth-input"
                  maxLength={4}
                  value={formData.pin || ''}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  autoFocus
                />
              </div>
            </>
          )}

          {/* ADMIN FORM */}
          {currentStation === ROLES.ADMIN && (
            <>
              <div className="auth-input-group">
                <label className="auth-label">
                  <User size={13} />
                  <span>Owner Executive Email</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@advaitkitchen.com"
                  className="auth-input"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">
                  <KeyRound size={13} />
                  <span>Master Owner PIN / Password</span>
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
                <span className="auth-hint">Protects P&L cash, HDFC bank rec, automated payroll & Tally exports</span>
              </div>
            </>
          )}

          {/* KITCHEN KDS FORM */}
          {currentStation === ROLES.KDS && (
            <>
              <div className="auth-input-group">
                <label className="auth-label">
                  <Utensils size={13} />
                  <span>Kitchen Prep Station</span>
                </label>
                <select
                  className="auth-input auth-select"
                  value={formData.station || 'Hot Line & Tandoor Station'}
                  onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                >
                  <option value="Hot Line & Tandoor Station">Station 1: Hot Line & Tandoor</option>
                  <option value="Curry & Biryani Line">Station 2: Curry & Biryani Line</option>
                  <option value="Appetizers & Sourdough Pizza">Station 3: Sourdough Pizza & Sides</option>
                  <option value="Beverages & Cold Bar">Station 4: Cold Beverages & Bar</option>
                </select>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">
                  <KeyRound size={13} />
                  <span>Station Security PIN</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter Station PIN (Demo: 7700)"
                  className="auth-input"
                  maxLength={4}
                  value={formData.pin || ''}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  autoFocus
                />
              </div>
            </>
          )}

          {/* CHEF FORM */}
          {currentStation === ROLES.CHEF && (
            <>
              <div className="auth-input-group">
                <label className="auth-label">
                  <User size={13} />
                  <span>Executive Chef Identifier</span>
                </label>
                <input
                  type="email"
                  disabled
                  value={formData.email || 'chef@advait.in'}
                  className="auth-input auth-input-disabled"
                />
                <span className="auth-hint">FSSAI Master Lic: #10022001004812</span>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">
                  <KeyRound size={13} />
                  <span>Culinary Passkey / PIN</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter 4-digit Passkey (Demo: 1002)"
                  className="auth-input"
                  maxLength={6}
                  value={formData.pin || ''}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  autoFocus
                />
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
              {currentStation === ROLES.COUNTER && 'Cashier PIN: 4421'}
              {currentStation === ROLES.ADMIN && 'admin@advaitkitchen.com • PIN: 8821'}
              {currentStation === ROLES.KDS && 'Station PIN: 7700'}
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
