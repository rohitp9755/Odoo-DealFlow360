const router = require('express').Router();
const ctrl = require('../controllers/fulfillmentController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('rep', 'manager', 'admin'));
router.get('/:quoteId', ctrl.getForQuote);
router.post('/:quoteId/allocate', ctrl.allocate);
router.post('/:quoteId/override', ctrl.override);

module.exports = router;
