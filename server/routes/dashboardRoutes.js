const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('rep', 'manager', 'finance', 'admin'));
router.get('/summary', ctrl.summary);
router.get('/analytics', ctrl.analytics);

module.exports = router;
