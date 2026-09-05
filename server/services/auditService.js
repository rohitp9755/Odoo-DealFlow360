const AuditLog = require('../models/AuditLog');

async function logAudit({ user, action, entity, entityId, oldValue, newValue, reason }) {
  try {
    await AuditLog.create({
      user: user?._id,
      role: user?.role,
      action,
      entity,
      entityId,
      oldValue,
      newValue,
      reason
    });
  } catch (err) {
    // Audit logging must never crash the primary business action.
    console.error('Audit log failed:', err.message);
  }
}

module.exports = { logAudit };
