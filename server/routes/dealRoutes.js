const router = require('express').Router();
const ctrl = require('../controllers/dealController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

router.use(requireAuth, requireRole(ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.FINANCE, ROLES.ADMIN));
router.get('/:id/health', ctrl.getHealth);
router.post('/:id/health/recalculate', ctrl.recalculate);

module.exports = router;
