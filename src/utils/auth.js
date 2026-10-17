// Auth Abstraction Layer for Restaurant OS & Multi-Tenant Business Architecture
// Supports Developer Superadmin, Distinct Business Owners, Counterperson POS, and Customer Dining

import {
  authenticateBusinessOwner,
  authenticateCounterByPin,
  authenticateDeveloper,
  isDeveloperAuthenticated,
  getActiveBusiness,
  DEVELOPER_CREDENTIALS
} from './businessManager';

export const ROLES = {
  CUSTOMER: 'customer',
  COUNTER: 'counter',
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  CHEF: 'chef'
};

export const AUTH_STORAGE_KEY = 'flowscape_auth_sessions_v2';

export const ROLE_PERMISSIONS = {
  // Developer can access everything across all tenants
  [ROLES.DEVELOPER]: [ROLES.DEVELOPER, ROLES.ADMIN, ROLES.COUNTER, ROLES.CUSTOMER, ROLES.CHEF],
  // Admin can access: admin, counter, customer
  [ROLES.ADMIN]: [ROLES.ADMIN, ROLES.COUNTER, ROLES.CUSTOMER, ROLES.CHEF],
  // Counter person can ONLY access: counter, customer (NO ADMIN)
  [ROLES.COUNTER]: [ROLES.COUNTER, ROLES.CUSTOMER],
  [ROLES.CHEF]: [ROLES.CHEF, ROLES.CUSTOMER],
  [ROLES.CUSTOMER]: [ROLES.CUSTOMER]
};

/**
 * Check if an actor role is permitted to access a target role
 */
export function canRoleAccess(actorRole, targetRole) {
  if (targetRole === ROLES.CUSTOMER) return true;
  if (!actorRole) return false;
  if (actorRole === ROLES.DEVELOPER) return true;
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
    description: 'Browse curated artisanal menu, place contactless table orders, and track live kitchen prep.',
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

  [ROLES.COUNTER]: {
    id: ROLES.COUNTER,
    name: 'Live Counter & POS Terminal',
    shortName: 'Cashier POS',
    badge: 'POS Terminal Guard',
    securityLevel: 'Staff POS 4-Digit Terminal PIN (Accessible by Counter & Admin)',
    description: 'Accept live dining orders, apply custom item modifiers, print 80mm GST thermal receipts, and reconcile EOD cash.',
    demoCredentials: {
      terminal: 'POS-01 (Flagship CP)',
      pin: '4421'
    },
    validate: (creds) => {
      const pin = (creds?.pin || '').toString().trim();
      if (!pin) {
        return { valid: false, error: 'Please enter your 4-digit POS PIN.' };
      }
      const authRes = authenticateCounterByPin(pin, 'Counter Staff');
      if (!authRes.success) {
        return { valid: false, error: authRes.error };
      }
      return { valid: true, business: authRes.business, resolvedSession: authRes.session };
    },
    createSession: (creds, validationResult = null) => {
      if (validationResult?.resolvedSession) {
        return validationResult.resolvedSession;
      }
      const activeBiz = getActiveBusiness();
      const pin = (creds?.pin || '').toString().trim();
      const isAdminOverride = activeBiz.owner.pin === pin;
      return {
        role: ROLES.COUNTER,
        businessId: activeBiz.id,
        businessName: activeBiz.name,
        name: isAdminOverride ? `${activeBiz.owner.name} (Admin Override)` : 'Counter Staff',
        terminal: activeBiz.counter.terminalName || 'POS Terminal 01',
        token: `pos_${activeBiz.id}_${Date.now()}`,
        authenticatedAt: new Date().toISOString(),
        authenticatedBy: isAdminOverride ? ROLES.ADMIN : ROLES.COUNTER
      };
    }
  },

  [ROLES.ADMIN]: {
    id: ROLES.ADMIN,
    name: 'Business Owner Back-Office',
    shortName: 'Owner Admin',
    badge: 'Business Owner Back-Office',
    securityLevel: 'Master Financial Executive Dual-Factor (Owner Only)',
    description: 'Real-time sales KPIs, P&L cash check, HDFC bank CSV reconciliation, automated payroll batches, and accounting exports.',
    demoCredentials: {
      name: 'Sanjay Malhotra',
      email: 'admin@advaitkitchen.com',
      pin: '8821'
    },
    validate: (creds) => {
      const email = (creds?.email || '').trim().toLowerCase();
      if (!email.includes('@') || !email.includes('.')) {
        return { valid: false, error: 'Please enter a valid owner executive email address.' };
      }
      const pin = (creds?.pin || '').toString().trim();
      if (!pin) {
        return { valid: false, error: 'Please enter your 4-digit Owner Master PIN.' };
      }

      // Authenticate against multi-tenant business database
      const authRes = authenticateBusinessOwner(email, pin);
      if (!authRes.success) {
        return { valid: false, error: authRes.error };
      }

      return { valid: true, business: authRes.business, resolvedSession: authRes.session };
    },
    createSession: (creds, validationResult = null) => {
      if (validationResult?.resolvedSession) {
        return validationResult.resolvedSession;
      }
      const activeBiz = getActiveBusiness();
      return {
        role: ROLES.ADMIN,
        businessId: activeBiz.id,
        businessName: activeBiz.name,
        name: activeBiz.owner.name,
        email: activeBiz.owner.email,
        branch: activeBiz.city,
        token: `admin_${activeBiz.id}_${Date.now()}`,
        authenticatedAt: new Date().toISOString(),
        authenticatedBy: ROLES.ADMIN
      };
    }
  },

  [ROLES.DEVELOPER]: {
    id: ROLES.DEVELOPER,
    name: 'Developer Superadmin Infrastructure',
    shortName: 'Developer Console',
    badge: 'Platform Root Access',
    securityLevel: 'Master Developer Root Authentication',
    description: 'Manage all tenant businesses, provision new business accounts, monitor real-time platform telemetry and database partitions.',
    demoCredentials: {
      email: DEVELOPER_CREDENTIALS.email,
      password: DEVELOPER_CREDENTIALS.password
    },
    validate: (creds) => {
      const email = (creds?.email || '').trim().toLowerCase();
      const password = (creds?.password || creds?.pin || '').trim();
      const authRes = authenticateDeveloper(email, password);
      if (!authRes.success) {
        return { valid: false, error: authRes.error };
      }
      return { valid: true, resolvedSession: authRes.session };
    },
    createSession: (creds, validationResult = null) => {
      if (validationResult?.resolvedSession) {
        return validationResult.resolvedSession;
      }
      return {
        role: ROLES.DEVELOPER,
        name: DEVELOPER_CREDENTIALS.name,
        email: DEVELOPER_CREDENTIALS.email,
        token: `dev_${Date.now()}`,
        authenticatedAt: new Date().toISOString()
      };
    }
  },

  [ROLES.CHEF]: {
    id: ROLES.CHEF,
    name: 'Verified Executive Chef',
    shortName: 'Chef Story',
    badge: 'Culinary Master Audit',
    securityLevel: 'FSSAI Licensee & Culinary Master Passkey',
    description: 'Verify FSSAI laboratory audits, culinary provenance certifications, and curate signature menu items.',
    demoCredentials: {
      email: 'chef@advait.in',
      pin: '1002'
    },
    validate: () => ({ valid: true }),
    createSession: () => ({
      role: ROLES.CHEF,
      name: 'Chef Advait Kapoor',
      title: 'Executive Chef & Culinary Director',
      fssaiLicense: 'FSSAI Lic #10022001004812',
      token: `chef_${Date.now()}`,
      authenticatedAt: new Date().toISOString()
    })
  }
};

// Initial default sessions for immediate startup experience
export const INITIAL_DEFAULT_SESSIONS = {
  [ROLES.CUSTOMER]: ROLE_CONFIGS[ROLES.CUSTOMER].createSession(ROLE_CONFIGS[ROLES.CUSTOMER].demoCredentials),
  [ROLES.CHEF]: ROLE_CONFIGS[ROLES.CHEF].createSession(ROLE_CONFIGS[ROLES.CHEF].demoCredentials),
  [ROLES.COUNTER]: null,
  [ROLES.ADMIN]: null,
  [ROLES.DEVELOPER]: null
};

/**
 * Load all stored authentication sessions
 */
export function getStoredSessions() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
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
export function isAuthenticated(role, activeSessionRole = null) {
  if (role === ROLES.CUSTOMER || role === ROLES.CHEF) {
    return true;
  }
  if (role === ROLES.DEVELOPER) {
    return isDeveloperAuthenticated();
  }

  // Developer Superadmin has master clearance to inspect any role
  if (isDeveloperAuthenticated() || activeSessionRole === ROLES.DEVELOPER) {
    return true;
  }

  const sessions = getStoredSessions();
  if (!sessions) return false;

  // Admin Master session can access both Admin and Counter
  if (sessions[ROLES.ADMIN] && sessions[ROLES.ADMIN].token) {
    return true;
  }

  if (activeSessionRole === ROLES.ADMIN) {
    return true;
  }

  if (role === ROLES.COUNTER && sessions[ROLES.COUNTER] && sessions[ROLES.COUNTER].token) {
    return true;
  }

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

  const session = config.createSession(credentials, validation);
  const currentSessions = getStoredSessions();
  currentSessions[role] = session;

  saveStoredSessions(currentSessions);

  return { success: true, session, business: validation.business };
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
  if (role === ROLES.DEVELOPER) {
    localStorage.removeItem('flowscape_dev_session_v1');
  }
  return true;
}

/**
 * Reset all role sessions to defaults
 */
export function resetAllSessions() {
  saveStoredSessions(INITIAL_DEFAULT_SESSIONS);
}
