const router = require('express').Router();
const ctrl = require('../controllers/fulfillmentController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

router.use(requireAuth, requireRole(ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.ADMIN));
router.get('/:quoteId', ctrl.getForQuote);
router.post('/:quoteId/allocate', ctrl.allocate);
router.post('/:quoteId/override', ctrl.override);

module.exports = router;
