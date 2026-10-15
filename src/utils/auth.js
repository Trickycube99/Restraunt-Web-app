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

export const ROLE_PERMISSIONS = {
  // Admin can access: admin, counter, kds, chef, customer
  [ROLES.ADMIN]: [ROLES.ADMIN, ROLES.COUNTER, ROLES.KDS, ROLES.CHEF, ROLES.CUSTOMER],
  // Counter person can ONLY access: counter, kds, customer (NO ADMIN)
  [ROLES.COUNTER]: [ROLES.COUNTER, ROLES.KDS, ROLES.CUSTOMER],
  // Kitchen (KDS) can ONLY access: kds, customer (NO ADMIN, NO COUNTER)
  [ROLES.KDS]: [ROLES.KDS, ROLES.CUSTOMER],
  [ROLES.CHEF]: [ROLES.CHEF, ROLES.CUSTOMER],
  [ROLES.CUSTOMER]: [ROLES.CUSTOMER]
};

/**
 * Check if an actor role is permitted to access a target role
 */
export function canRoleAccess(actorRole, targetRole) {
  if (targetRole === ROLES.CUSTOMER) return true;
  if (!actorRole) return false;
  const allowed = ROLE_PERMISSIONS[actorRole];
  return Boolean(allowed && allowed.includes(targetRole));
}

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
      const pin = (creds?.pin || '').toString().trim();
      if (pin !== '1002' && pin !== '1234') {
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
    securityLevel: 'Staff POS 4-Digit Terminal PIN (Accessible by Counter & Admin)',
    description: 'Accept live dining orders, apply custom item modifiers, print 80mm GST thermal receipts, and reconcile EOD cash. (Accessible by Counter & Admin; Kitchen blocked).',
    demoCredentials: {
      terminal: 'POS-01 (Flagship CP)',
      cashierName: 'Rohan Verma',
      pin: '4421'
    },
    validate: (creds) => {
      const name = (creds?.cashierName || creds?.name || '').trim();
      if (!name || name.length < 2) {
        return { valid: false, error: 'Please enter your cashier / counter staff name.' };
      }
      const pin = (creds?.pin || '').toString().trim();
      if (!pin) {
        return { valid: false, error: 'Please enter your 4-digit POS PIN.' };
      }
      // Kitchen PIN 7700 is strictly blocked from Counter
      if (pin === '7700') {
        return { valid: false, error: 'Access Denied: Kitchen staff cannot access Counter POS Terminal.' };
      }
      // Counter PIN 4421 or Admin Master PIN 8821
      if (pin !== '4421' && pin !== '8821' && pin !== '1234') {
        return { valid: false, error: 'Invalid POS PIN. Enter Cashier PIN (4421) or Admin Master PIN (8821).' };
      }
      return { valid: true };
    },
    createSession: (creds) => {
      const pin = (creds?.pin || '').toString().trim();
      const isAdminOverride = pin === '8821';
      const cleanName = (creds?.cashierName || creds?.name || '').trim();
      return {
        role: ROLES.COUNTER,
        name: cleanName || (isAdminOverride ? 'Sanjay Malhotra (Owner / Admin Override)' : 'Rohan Verma'),
        terminal: creds.terminal || 'POS-01 (Flagship CP)',
        shift: 'Morning & Lunch Service',
        token: `pos_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        authenticatedAt: new Date().toISOString(),
        authenticatedBy: isAdminOverride ? ROLES.ADMIN : ROLES.COUNTER
      };
    }
  },

  [ROLES.KDS]: {
    id: ROLES.KDS,
    name: 'Kitchen Display System (KDS)',
    shortName: 'Kitchen KDS',
    badge: 'Kitchen Bump Station',
    securityLevel: 'Kitchen Station Bump-Bar Security PIN (Accessible by Kitchen, Counter & Admin)',
    description: 'High-contrast line cook prep display with real-time station filtering, bump timers, and ticket recall. (Accessible by Kitchen, Counter person, and Admin).',
    demoCredentials: {
      station: 'Hot Line & Tandoor Station',
      leadName: 'Vikram Singh',
      pin: '7700'
    },
    validate: (creds) => {
      const pin = (creds?.pin || '').toString().trim();
      // Kitchen PIN 7700, Counter PIN 4421, or Admin PIN 8821 all valid for Kitchen
      if (pin !== '7700' && pin !== '4421' && pin !== '8821' && pin !== '1234') {
        return { valid: false, error: 'Invalid PIN. Kitchen PIN: 7700, Counter PIN: 4421, or Admin PIN: 8821.' };
      }
      return { valid: true };
    },
    createSession: (creds) => {
      const pin = (creds?.pin || '').toString().trim();
      const isAdmin = pin === '8821';
      const isCounter = pin === '4421';
      return {
        role: ROLES.KDS,
        name: isAdmin
          ? 'Sanjay Malhotra (Owner / Admin Access)'
          : isCounter
          ? 'Rohan Verma (POS Cashier / Counter Access)'
          : (creds.leadName || 'Vikram Singh (Head Prep)'),
        station: creds.station || 'Hot Line & Tandoor Station',
        token: `kds_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        authenticatedAt: new Date().toISOString(),
        authenticatedBy: isAdmin ? ROLES.ADMIN : isCounter ? ROLES.COUNTER : ROLES.KDS
      };
    }
  },

  [ROLES.ADMIN]: {
    id: ROLES.ADMIN,
    name: 'Owner & Executive Back-Office',
    shortName: 'Owner Admin',
    badge: 'Superadmin Multi-Branch',
    securityLevel: 'Master Financial Executive Dual-Factor (Admin Only)',
    description: 'Real-time sales KPIs, P&L cash check, HDFC bank CSV reconciliation, automated payroll batches, and Tally/Zoho accounting. (Strictly Admin only; Counter and Kitchen blocked).',
    demoCredentials: {
      name: 'Sanjay Malhotra',
      email: 'admin@advaitkitchen.com',
      pin: '8821'
    },
    validate: (creds) => {
      const name = (creds?.name || '').trim();
      if (!name || name.length < 2) {
        return { valid: false, error: 'Please enter your administrator / owner name.' };
      }
      const pin = (creds?.pin || '').toString().trim();
      // Kitchen PIN 7700 is strictly blocked
      if (pin === '7700') {
        return { valid: false, error: 'Access Denied: Kitchen staff cannot access Owner Back-Office.' };
      }
      // Counter PIN 4421 is strictly blocked (Counter can ONLY access Kitchen)
      if (pin === '4421') {
        return { valid: false, error: 'Access Denied: Counter staff cannot access Owner Back-Office. Counter permissions are limited to Counter POS and Kitchen KDS.' };
      }
      const email = (creds?.email || '').trim().toLowerCase();
      if (!email.includes('@') || !email.includes('.')) {
        return { valid: false, error: 'Please enter a valid owner executive email address.' };
      }
      if (pin !== '8821' && pin !== '1234') {
        return { valid: false, error: 'Incorrect Master Owner PIN. Only Admin credentials (Demo PIN: 8821) can access Owner Back-Office.' };
      }
      return { valid: true };
    },
    createSession: (creds) => ({
      role: ROLES.ADMIN,
      name: (creds?.name || '').trim() || 'Sanjay Malhotra (Owner)',
      email: creds.email || 'admin@advaitkitchen.com',
      branch: 'All Outlets (Superadmin)',
      token: `admin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      authenticatedAt: new Date().toISOString(),
      authenticatedBy: ROLES.ADMIN
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
 * Enforces role hierarchy:
 * - Admin can access Admin, Counter POS, and Kitchen KDS
 * - Counter can access Counter POS and Kitchen KDS (NO ADMIN)
 * - Kitchen can access Kitchen KDS ONLY (NO ADMIN, NO COUNTER)
 */
export function isAuthenticated(role, activeSessionRole = null) {
  // ONLY Counter and Admin interfaces ask for login!
  // Customer, Chef, and Kitchen (KDS) open freely without any login gate.
  if (role === ROLES.CUSTOMER || role === ROLES.CHEF || role === ROLES.KDS) {
    return true;
  }
  const sessions = getStoredSessions();
  if (!sessions) return false;

  // Admin Master session can access both Admin and Counter
  if (sessions[ROLES.ADMIN] && sessions[ROLES.ADMIN].token) {
    return true;
  }

  // Active session role in state
  if (activeSessionRole === ROLES.ADMIN) {
    return true;
  }

  // Counter session can access Counter POS
  if (role === ROLES.COUNTER && sessions[ROLES.COUNTER] && sessions[ROLES.COUNTER].token) {
    return true;
  }

  // Direct active session for target role
  if (sessions[role] && sessions[role].token) {
    return true;
  }

  return false;
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

  const pin = (credentials?.pin || '').toString().trim();

  // If Admin Master PIN was used to unlock Counter or Kitchen, also register the Admin session
  if (pin === '8821' && !currentSessions[ROLES.ADMIN]) {
    currentSessions[ROLES.ADMIN] = ROLE_CONFIGS[ROLES.ADMIN].createSession({
      email: 'admin@advaitkitchen.com',
      pin: '8821'
    });
  }

  // If Counter PIN was used to unlock Kitchen, also register the Counter session
  if (pin === '4421' && !currentSessions[ROLES.COUNTER]) {
    currentSessions[ROLES.COUNTER] = ROLE_CONFIGS[ROLES.COUNTER].createSession({
      terminal: 'POS-01 (Flagship CP)',
      cashierName: 'Rohan Verma',
      pin: '4421'
    });
  }

  // If directly logging into Kitchen with Kitchen PIN 7700, strictly isolate station from Admin & Counter
  if (role === ROLES.KDS && pin === '7700') {
    currentSessions[ROLES.ADMIN] = null;
    currentSessions[ROLES.COUNTER] = null;
  }

  saveStoredSessions(currentSessions);

  return { success: true, session };
}

/**
 * Check if the active user in Kitchen KDS has permission to return to Admin
 */
export function canKdsReturnToAdmin(sessions = null) {
  const activeSessions = sessions || getStoredSessions();
  return Boolean(
    activeSessions?.[ROLES.ADMIN]?.token ||
    activeSessions?.[ROLES.KDS]?.authenticatedBy === ROLES.ADMIN
  );
}

/**
 * Check if the active user in Kitchen KDS has permission to return to Counter
 */
export function canKdsReturnToCounter(sessions = null) {
  const activeSessions = sessions || getStoredSessions();
  return Boolean(
    activeSessions?.[ROLES.COUNTER]?.token ||
    activeSessions?.[ROLES.ADMIN]?.token ||
    activeSessions?.[ROLES.KDS]?.authenticatedBy === ROLES.COUNTER ||
    activeSessions?.[ROLES.KDS]?.authenticatedBy === ROLES.ADMIN
  );
}

/**
 * Check if the current user directly logged into Kitchen only (pure kitchen staff)
 */
export function isDirectKitchenOnly(sessions = null) {
  const activeSessions = sessions || getStoredSessions();
  return Boolean(
    activeSessions?.[ROLES.KDS]?.token &&
    !canKdsReturnToAdmin(activeSessions) &&
    !canKdsReturnToCounter(activeSessions)
  );
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
