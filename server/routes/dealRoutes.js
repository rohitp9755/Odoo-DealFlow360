const router = require('express').Router();
const ctrl = require('../controllers/dealController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('rep', 'manager', 'finance', 'admin'));
router.get('/:id/health', ctrl.getHealth);
router.post('/:id/health/recalculate', ctrl.recalculate);

module.exports = router;
