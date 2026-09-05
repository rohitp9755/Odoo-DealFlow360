const Notification = require('../models/Notification');

// A user only ever sees/mutates their own notifications — recipient is always
// derived from the authenticated session, never taken from the request.
async function mine(req, res, next) {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(notifications);
  } catch (err) { next(err); }
}

async function markRead(req, res, next) {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (err) { next(err); }
}

async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ message: 'All notifications marked read' });
  } catch (err) { next(err); }
}

module.exports = { mine, markRead, markAllRead };
