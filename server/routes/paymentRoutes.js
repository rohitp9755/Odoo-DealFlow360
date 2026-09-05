const router = require('express').Router();
const ctrl = require('../controllers/paymentController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

router.use(requireAuth);
router.get('/:invoiceId', requireRole(ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.FINANCE, ROLES.ADMIN), ctrl.list);
router.post('/:invoiceId', requireRole(ROLES.FINANCE, ROLES.ADMIN), ctrl.record);

module.exports = router;
