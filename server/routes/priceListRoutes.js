const router = require('express').Router();
const ctrl = require('../controllers/priceListController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

const INTERNAL_ROLES = [ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.FINANCE, ROLES.ADMIN];

router.use(requireAuth);
// Specific paths before '/:id' so 'applicable-price' isn't swallowed as an id.
router.get('/applicable-price', requireRole(...INTERNAL_ROLES), ctrl.applicablePrice);
router.get('/', requireRole(...INTERNAL_ROLES), ctrl.list);
router.get('/:id', requireRole(...INTERNAL_ROLES), ctrl.getOne);
router.post('/', requireRole(ROLES.ADMIN), ctrl.create);
router.put('/:id', requireRole(ROLES.ADMIN), ctrl.update);
router.delete('/:id', requireRole(ROLES.ADMIN), ctrl.remove);

module.exports = router;
