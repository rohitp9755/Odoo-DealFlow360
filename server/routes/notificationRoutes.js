const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

// Every authenticated role (including CUSTOMER) can receive notifications,
// so this only requires auth — access is further scoped to req.user in the controller.
router.use(requireAuth);
router.get('/', ctrl.mine);
router.post('/:id/read', ctrl.markRead);
router.post('/read-all', ctrl.markAllRead);

module.exports = router;
