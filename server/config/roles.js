// Single source of truth for user role identifiers.
// Used by the User model (schema enum), auth controller (signup validation),
// route files (requireRole guards), and tests.

const ROLES = {
  ADMIN: 'ADMIN',
  SALES_REP: 'SALES_REP',
  SALES_MANAGER: 'SALES_MANAGER',
  FINANCE: 'FINANCE',
  CUSTOMER: 'CUSTOMER'
};

const ALL_ROLES = Object.values(ROLES);

// Roles that may self-register via POST /api/auth/register.
// CUSTOMER accounts must go through /api/auth/register-customer instead,
// since they need to be linked to an existing Customer record.
const INTERNAL_ROLES = ALL_ROLES.filter((r) => r !== ROLES.CUSTOMER);

module.exports = { ROLES, ALL_ROLES, INTERNAL_ROLES };
