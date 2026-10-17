import React, { useState } from 'react';
import {
  Lock,
  Layers,
  BarChart3,
  Server,
  KeyRound,
  User,
  AlertCircle,
  X,
  ChevronRight
} from 'lucide-react';
import { ROLE_CONFIGS, ROLES, authenticateRole } from '../utils/auth';
import { playTapSound, playSuccessChime, playAlertChime } from '../utils/audio';

export default function AuthModal({
  isOpen,
  targetRole = ROLES.COUNTER,
  activeSessionRole = null,
  onSuccess,
  onClose
}) {
  const [selectedStation, setSelectedStation] = useState(null);
  const currentStation = selectedStation || (targetRole && targetRole !== ROLES.CUSTOMER ? targetRole : ROLES.COUNTER);

  const roleConfig = ROLE_CONFIGS[currentStation] || ROLE_CONFIGS[ROLES.COUNTER];

  // Discrete form state
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setPin('');
    setEmail('');
    setPassword('');
    setErrorMessage('');
    setSelectedStation(null);
  };

  if (!isOpen) return null;

  // Station switcher tabs (No autofill button)
  const allTabs = [
    { id: ROLES.COUNTER, label: 'Counterperson POS', icon: Layers },
    { id: ROLES.ADMIN, label: 'Business Owner Admin', icon: BarChart3 },
    { id: ROLES.DEVELOPER, label: 'Developer Console', icon: Server }
  ];

  const allowedTabs = allTabs.filter((t) => {
    if (activeSessionRole === ROLES.COUNTER) {
      return t.id === ROLES.COUNTER;
    }
    return true;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    playTapSound();
    setIsSubmitting(true);
    setErrorMessage('');

    let creds = {};
    if (currentStation === ROLES.DEVELOPER) {
      creds = { email, password };
    } else if (currentStation === ROLES.ADMIN) {
      creds = { email, pin };
    } else {
      creds = { terminal: 'POS-01 (Flagship CP)', pin };
    }

    // Attempt authentication via abstraction layer
    const result = authenticateRole(currentStation, creds);

    if (result.success) {
      playSuccessChime();
      setTimeout(() => {
        setIsSubmitting(false);
        resetForm();
        onSuccess(result.session, result.business);
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
      case ROLES.DEVELOPER:
        return <Server size={24} color="#06B6D4" />;
      default:
        return <Lock size={24} color="#007AFF" />;
    }
  };

  const handleCloseModal = () => {
    playTapSound();
    resetForm();
    onClose();
  };

  return (
    <div className="auth-modal-overlay" onClick={handleCloseModal}>
      <div
        className="auth-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: 440 }}
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
                <span>Station Authentication</span>
              </div>
              <h3 className="auth-modal-title">{roleConfig.name}</h3>
            </div>
          </div>
          <button
            className="auth-modal-close-btn"
            onClick={handleCloseModal}
            aria-label="Close authentication modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Station Selector Tabs for Staff / Owner / Developer */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${allowedTabs.length}, 1fr)`, gap: 6, margin: '10px 0 14px' }}>
          {allowedTabs.map((st) => (
            <button
              key={st.id}
              type="button"
              className={`btn-secondary-pill ${currentStation === st.id ? 'active' : ''}`}
              style={{
                padding: '7px 4px',
                fontSize: 11,
                fontWeight: 600,
                justifyContent: 'center',
                background: currentStation === st.id ? (st.id === ROLES.DEVELOPER ? '#ECFEFF' : '#EFF6FF') : '#F9FAFB',
                borderColor: currentStation === st.id ? (st.id === ROLES.DEVELOPER ? '#06B6D4' : '#007AFF') : '#E5E7EB',
                color: currentStation === st.id ? (st.id === ROLES.DEVELOPER ? '#0891B2' : '#007AFF') : 'var(--text-secondary)'
              }}
              onClick={() => {
                playTapSound();
                setSelectedStation(st.id);
                setErrorMessage('');
              }}
            >
              <st.icon size={13} />
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

        {/* Dynamic Form based on Target Role (Zero Autofill Button) */}
        <form onSubmit={handleSubmit} className="auth-modal-form">
          {/* COUNTER POS FORM (PIN only - zero name prompt) */}
          {currentStation === ROLES.COUNTER && (
            <div className="auth-input-group">
              <label className="auth-label">
                <KeyRound size={13} />
                <span>Terminal 4-Digit POS PIN *</span>
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter 4-Digit POS PIN"
                className="auth-input"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
              <span className="auth-hint">Enter your 4-digit counter terminal PIN to unlock the live POS.</span>
            </div>
          )}

          {/* ADMIN OWNER FORM */}
          {currentStation === ROLES.ADMIN && (
            <>
              <div className="auth-input-group">
                <label className="auth-label">
                  <User size={13} />
                  <span>Business Owner Login Email *</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@advaitkitchen.com"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
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
                  placeholder="Enter Master Owner PIN"
                  className="auth-input"
                  maxLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
                <span className="auth-hint">Authenticates against your specific registered business account.</span>
              </div>
            </>
          )}

          {/* DEVELOPER SUPERADMIN FORM */}
          {currentStation === ROLES.DEVELOPER && (
            <>
              <div className="auth-input-group">
                <label className="auth-label">
                  <Server size={13} />
                  <span>Developer Superadmin Email *</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="dev@platform.com"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">
                  <KeyRound size={13} />
                  <span>Master Access Key / Password *</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter developer access key"
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span className="auth-hint">Full platform access to manage all tenant businesses.</span>
              </div>
            </>
          )}

          {/* Actions (Zero Autofill Button as requested) */}
          <div className="auth-actions-row" style={{ marginTop: 14 }}>
            <button
              type="button"
              className="btn-secondary-pill auth-cancel-btn"
              onClick={() => {
                playTapSound();
                onClose();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary-pill auth-submit-btn"
              style={{
                background: currentStation === ROLES.DEVELOPER ? 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)' : undefined
              }}
            >
              <span>{isSubmitting ? 'Verifying...' : `Unlock ${roleConfig.shortName}`}</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
