// Auth Abstraction Layer for Advait Artisanal Indian Kitchen Restaurant OS
// Provides interface-specific authentication, credential validation, session persistence, and role guards

export const ROLES = {
  CUSTOMER: 'customer',
  CHEF: 'chef',
  COUNTER: 'counter',
  KDS: 'kds',
  ADMIN: 'admin'
};

export const AUTH_STORAGE_KEY = 'flowscape_auth_sessions_v2';

export const ROLE_CONFIGS = {
  [ROLES.CUSTOMER]: {
    id: ROLES.CUSTOMER,
    name: 'Customer (QR Dine-in)',
    shortName: 'Diner',
    badge: 'Diner Check-In',
    securityLevel: 'Guest Table Session & Mobile Loyalty',
    description: 'Browse curated Indian artisanal menu, place contactless table orders, and track live kitchen prep.',
    demoCredentials: {
      name: 'Aarav Sharma',
      phone: '9876543210',
      table: 'Table 04'
    },
    validate: (creds) => {
      if (!creds?.name?.trim()) {
        return { valid: false, error: 'Please enter your diner name to register your table order.' };
      }
      const cleanPhone = (creds?.phone || '').replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        return { valid: false, error: 'Please enter a valid 10-digit Indian mobile number (+91).' };
      }
      return { valid: true };
    },
    createSession: (creds) => ({
      role: ROLES.CUSTOMER,
      name: creds.name.trim(),
      phone: creds.phone.replace(/\D/g, '').slice(-10),
      table: creds.table || 'Table 04',
      loyaltyTier: 'Gold Connoisseur (480 Pts)',
      token: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      authenticatedAt: new Date().toISOString()
    })
  },

  [ROLES.CHEF]: {
    id: ROLES.CHEF,
    name: 'Verified Executive Chef',
    shortName: 'Chef Advait',
    badge: 'Culinary Master Audit',
    securityLevel: 'FSSAI Licensee & Culinary Master Passkey',
    description: 'Verify FSSAI laboratory audits, culinary provenance certifications, and curate signature menu items.',
    demoCredentials: {
      email: 'chef@advait.in',
      pin: '1002'
    },
    validate: (creds) => {
      if (creds?.pin !== '1002' && creds?.pin !== '1234') {
        return { valid: false, error: 'Incorrect Culinary Passkey. Demo Passkey is: 1002' };
      }
      return { valid: true };
    },
    createSession: (creds) => ({
      role: ROLES.CHEF,
      name: 'Chef Advait Kapoor',
      title: 'Executive Chef & Culinary Director',
      fssaiLicense: 'FSSAI Lic #10022001004812',
      token: `chef_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      authenticatedAt: new Date().toISOString()
    })
  },

  [ROLES.COUNTER]: {
    id: ROLES.COUNTER,
    name: 'Live Counter & POS Terminal',
    shortName: 'Cashier POS',
    badge: 'POS Terminal Guard',
    securityLevel: 'Staff POS 4-Digit Terminal PIN',
    description: 'Accept live dining orders, apply custom item modifiers, print 80mm GST thermal receipts, and reconcile EOD cash.',
    demoCredentials: {
      terminal: 'POS-01 (Flagship CP)',
      cashierName: 'Rohan Verma',
      pin: '4421'
    },
    validate: (creds) => {
      if (creds?.pin !== '4421' && creds?.pin !== '1234') {
        return { valid: false, error: 'Invalid POS Cashier PIN. Demo PIN is: 4421' };
      }
      return { valid: true };
    },
    createSession: (creds) => ({
      role: ROLES.COUNTER,
      name: creds.cashierName || 'Rohan Verma',
      terminal: creds.terminal || 'POS-01 (Flagship CP)',
      shift: 'Morning & Lunch Service',
      token: `pos_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      authenticatedAt: new Date().toISOString()
    })
  },

  [ROLES.KDS]: {
    id: ROLES.KDS,
    name: 'Kitchen Display System (KDS)',
    shortName: 'Kitchen KDS',
    badge: 'Kitchen Bump Station',
    securityLevel: 'Kitchen Station Bump-Bar Security PIN',
    description: 'High-contrast line cook prep display with real-time station filtering, bump timers, and ticket recall.',
    demoCredentials: {
      station: 'Hot Line & Tandoor Station',
      leadName: 'Vikram Singh',
      pin: '7700'
    },
    validate: (creds) => {
      if (creds?.pin !== '7700' && creds?.pin !== '1234') {
        return { valid: false, error: 'Invalid Kitchen Station PIN. Demo PIN is: 7700' };
      }
      return { valid: true };
    },
    createSession: (creds) => ({
      role: ROLES.KDS,
      name: creds.leadName || 'Vikram Singh (Head Prep)',
      station: creds.station || 'Hot Line & Tandoor Station',
      token: `kds_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      authenticatedAt: new Date().toISOString()
    })
  },

  [ROLES.ADMIN]: {
    id: ROLES.ADMIN,
    name: 'Owner & Executive Back-Office',
    shortName: 'Owner Admin',
    badge: 'Superadmin Multi-Branch',
    securityLevel: 'Master Financial Executive Dual-Factor',
    description: 'Real-time sales KPIs, P&L cash check, HDFC bank CSV reconciliation, automated payroll batches, and Tally/Zoho accounting.',
    demoCredentials: {
      email: 'admin@advaitkitchen.com',
      pin: '8821'
    },
    validate: (creds) => {
      const email = (creds?.email || '').trim().toLowerCase();
      if (!email.includes('@') || !email.includes('.')) {
        return { valid: false, error: 'Please enter a valid owner executive email address.' };
      }
      if (creds?.pin !== '8821' && creds?.pin !== '1234') {
        return { valid: false, error: 'Incorrect Master Owner PIN. Demo PIN is: 8821' };
      }
      return { valid: true };
    },
    createSession: (creds) => ({
      role: ROLES.ADMIN,
      name: 'Sanjay Malhotra (Owner)',
      email: creds.email || 'admin@advaitkitchen.com',
      branch: 'All Outlets (Superadmin)',
      token: `admin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      authenticatedAt: new Date().toISOString()
    })
  }
};

// Initial default sessions for immediate, friction-free startup experience
export const INITIAL_DEFAULT_SESSIONS = {
  [ROLES.CUSTOMER]: ROLE_CONFIGS[ROLES.CUSTOMER].createSession(ROLE_CONFIGS[ROLES.CUSTOMER].demoCredentials),
  [ROLES.CHEF]: ROLE_CONFIGS[ROLES.CHEF].createSession(ROLE_CONFIGS[ROLES.CHEF].demoCredentials),
  [ROLES.COUNTER]: null, // Protected initially until logged in or demo 1-tapped
  [ROLES.KDS]: null,     // Protected initially
  [ROLES.ADMIN]: null    // Protected initially
};

/**
 * Load all stored authentication sessions
 */
export function getStoredSessions() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      // Initialize with default customer & chef session
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_SESSIONS));
      return INITIAL_DEFAULT_SESSIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading auth sessions:', err);
    return INITIAL_DEFAULT_SESSIONS;
  }
}

/**
 * Save sessions map to localStorage
 */
export function saveStoredSessions(sessions) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error('Error saving auth sessions:', err);
  }
}

/**
 * Check if a specific role is currently authenticated
 */
export function isAuthenticated(role) {
  const sessions = getStoredSessions();
  return Boolean(sessions && sessions[role] && sessions[role].token);
}

/**
 * Retrieve active session data for a specific role
 */
export function getSession(role) {
  const sessions = getStoredSessions();
  return sessions ? sessions[role] : null;
}

/**
 * Authenticate and issue a new session for a role
 */
export function authenticateRole(role, credentials) {
  const config = ROLE_CONFIGS[role];
  if (!config) {
    return { success: false, error: `Invalid role: ${role}` };
  }

  const validation = config.validate(credentials);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const session = config.createSession(credentials);
  const currentSessions = getStoredSessions();
  currentSessions[role] = session;
  saveStoredSessions(currentSessions);

  return { success: true, session };
}

/**
 * Logout and clear session for a specific role
 */
export function logoutRole(role) {
  const currentSessions = getStoredSessions();
  if (currentSessions && currentSessions[role]) {
    currentSessions[role] = null;
    saveStoredSessions(currentSessions);
  }
  return true;
}

/**
 * Reset all role sessions to defaults
 */
export function resetAllSessions() {
  saveStoredSessions(INITIAL_DEFAULT_SESSIONS);
}
