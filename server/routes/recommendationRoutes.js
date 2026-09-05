const router = require('express').Router();
const ctrl = require('../controllers/recommendationController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);
router.get('/:quoteId', requireRole('rep', 'manager', 'admin'), ctrl.listForQuote);
router.post('/generate/:quoteId', requireRole('rep', 'admin'), ctrl.generate);
router.post('/:id/add', requireRole('rep', 'admin'), ctrl.addToQuote);
router.post('/:id/dismiss', requireRole('rep', 'admin'), ctrl.dismiss);

module.exports = router;
