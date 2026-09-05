const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);
router.get('/tiers', ctrl.getDiscountTiers);
router.put('/tiers', requireRole('admin'), ctrl.upsertDiscountTier);
router.get('/', ctrl.getDiscountRules);
router.put('/', requireRole('admin'), ctrl.upsertDiscountRule);

module.exports = router;
