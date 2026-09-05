const router = require('express').Router();
const ctrl = require('../controllers/billingController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('rep', 'manager', 'finance', 'admin'));
router.get('/:quoteId', ctrl.getForQuote);
router.post('/:quoteId/generate', ctrl.generate);
router.post('/cancel/:invoiceId', ctrl.cancelRecurring);

module.exports = router;
