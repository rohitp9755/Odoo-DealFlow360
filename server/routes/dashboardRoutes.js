const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

router.use(requireAuth, requireRole(ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.FINANCE, ROLES.ADMIN));
router.get('/summary', ctrl.summary);
router.get('/analytics', ctrl.analytics);

module.exports = router;
