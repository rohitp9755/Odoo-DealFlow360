const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

router.use(requireAuth);
router.get('/tiers', ctrl.getDiscountTiers);
router.put('/tiers', requireRole(ROLES.ADMIN), ctrl.upsertDiscountTier);
router.get('/', ctrl.getDiscountRules);
router.put('/', requireRole(ROLES.ADMIN), ctrl.upsertDiscountRule);

module.exports = router;
