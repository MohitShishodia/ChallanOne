// Role-Based Access Control Middleware

/**
 * Available permissions for the admin panel.
 * These are stored in the roles table as a JSON array.
 */
export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'view_dashboard',

  // User management
  VIEW_USERS: 'view_users',
  MANAGE_USERS: 'manage_users',

  // Challan management
  VIEW_CHALLANS: 'view_challans',
  MANAGE_CHALLANS: 'manage_challans',

  // Payment management
  VIEW_PAYMENTS: 'view_payments',
  MANAGE_PAYMENTS: 'manage_payments',
  PROCESS_REFUNDS: 'process_refunds',

  // Service management
  VIEW_SERVICES: 'view_services',
  MANAGE_SERVICES: 'manage_services',

  // Reports
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',

  // Settings
  VIEW_SETTINGS: 'view_settings',
  MANAGE_SETTINGS: 'manage_settings',

  // Notifications
  VIEW_NOTIFICATIONS: 'view_notifications',
  SEND_NOTIFICATIONS: 'send_notifications',

  // CMS
  VIEW_CMS: 'view_cms',
  MANAGE_CMS: 'manage_cms',

  // Support
  VIEW_TICKETS: 'view_tickets',
  MANAGE_TICKETS: 'manage_tickets',

  // Role & admin management
  VIEW_ROLES: 'view_roles',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_ADMINS: 'manage_admins'
};

/**
 * Default role permission sets
 */
export const DEFAULT_ROLES = {
  super_admin: {
    name: 'Super Admin',
    permissions: Object.values(PERMISSIONS)
  },
  manager: {
    name: 'Manager',
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_USERS,
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.VIEW_CHALLANS,
      PERMISSIONS.MANAGE_CHALLANS,
      PERMISSIONS.VIEW_PAYMENTS,
      PERMISSIONS.MANAGE_PAYMENTS,
      PERMISSIONS.VIEW_SERVICES,
      PERMISSIONS.MANAGE_SERVICES,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.EXPORT_REPORTS,
      PERMISSIONS.VIEW_TICKETS,
      PERMISSIONS.MANAGE_TICKETS,
      PERMISSIONS.VIEW_CMS,
      PERMISSIONS.MANAGE_CMS,
      PERMISSIONS.VIEW_NOTIFICATIONS
    ]
  },
  viewer: {
    name: 'Viewer',
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_USERS,
      PERMISSIONS.VIEW_CHALLANS,
      PERMISSIONS.VIEW_PAYMENTS,
      PERMISSIONS.VIEW_SERVICES,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.VIEW_TICKETS,
      PERMISSIONS.VIEW_CMS
    ]
  }
};

/**
 * RBAC middleware factory.
 * @param {...string} requiredPermissions - One or more permissions required for access.
 * @returns Express middleware function
 *
 * Usage:
 *   router.get('/users', adminAuth, requirePermission(PERMISSIONS.VIEW_USERS), handler)
 */
export function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    // Must be authenticated first (adminAuth middleware should run before this)
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Super Admin bypasses all permission checks
    if (req.admin.role === 'Super Admin') {
      return next();
    }

    const adminPermissions = req.admin.permissions || [];

    // Check if admin has ALL required permissions
    const hasAllPermissions = requiredPermissions.every(perm =>
      adminPermissions.includes(perm)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        required: requiredPermissions,
        current: adminPermissions
      });
    }

    next();
  };
}

/**
 * Check if admin has at least ONE of the given permissions
 */
export function requireAnyPermission(...permissions) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (req.admin.role === 'Super Admin') {
      return next();
    }

    const adminPermissions = req.admin.permissions || [];
    const hasAny = permissions.some(perm => adminPermissions.includes(perm));

    if (!hasAny) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
}

export default requirePermission;
