const router = require('express').Router();
const ctrl = require('../controllers/recommendationController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

router.use(requireAuth);
router.get('/:quoteId', requireRole(ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.ADMIN), ctrl.listForQuote);
router.post('/generate/:quoteId', requireRole(ROLES.SALES_REP, ROLES.ADMIN), ctrl.generate);
router.post('/:id/add', requireRole(ROLES.SALES_REP, ROLES.ADMIN), ctrl.addToQuote);
router.post('/:id/dismiss', requireRole(ROLES.SALES_REP, ROLES.ADMIN), ctrl.dismiss);

module.exports = router;
