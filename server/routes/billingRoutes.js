const router = require('express').Router();
const ctrl = require('../controllers/billingController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

router.use(requireAuth, requireRole(ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.FINANCE, ROLES.ADMIN));
router.get('/:quoteId', ctrl.getForQuote);
router.post('/:quoteId/generate', ctrl.generate);
router.post('/cancel/:invoiceId', ctrl.cancelRecurring);

module.exports = router;
