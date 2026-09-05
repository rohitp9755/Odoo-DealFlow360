// Decoupled in-app notification abstraction. Business services call notify()/notifyRoles()
// as a side effect of a state transition (approval routed, negotiation opened, payment
// received, ...) — never the other way around. Delivery failures must never break the
// primary business action, so every write here is best-effort, mirroring auditService.

const Notification = require('../models/Notification');
const User = require('../models/User');

async function notify({ recipients, type, message, entity, entityId }) {
  try {
    const ids = [...new Set((recipients || [])
      .filter(Boolean)
      .map((r) => String(r._id || r)))];
    if (ids.length === 0) return [];
    const docs = ids.map((recipient) => ({ recipient, type, message, entity, entityId }));
    return await Notification.insertMany(docs);
  } catch (err) {
    console.error('Notification dispatch failed:', err.message);
    return [];
  }
}

// Convenience: notify every active internal user holding one of the given roles
// (e.g. route an APPROVAL_REQUIRED alert to every SALES_MANAGER).
async function notifyRoles(roles, { type, message, entity, entityId }) {
  try {
    const users = await User.find({ role: { $in: roles }, active: true }).select('_id');
    return notify({ recipients: users.map((u) => u._id), type, message, entity, entityId });
  } catch (err) {
    console.error('Notification role-fanout failed:', err.message);
    return [];
  }
}

module.exports = { notify, notifyRoles };
