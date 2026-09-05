const router = require('express').Router();
const ctrl = require('../controllers/quoteController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

router.use(requireAuth);
router.get('/', requireRole(ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.FINANCE, ROLES.ADMIN), ctrl.list);
router.get('/:id', requireRole(ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.FINANCE, ROLES.ADMIN), ctrl.getOne);
router.post('/', requireRole(ROLES.SALES_REP, ROLES.ADMIN), ctrl.create);
router.put('/:id', requireRole(ROLES.SALES_REP, ROLES.ADMIN), ctrl.update);
router.post('/:id/submit', requireRole(ROLES.SALES_REP, ROLES.ADMIN), ctrl.submit);
router.post('/:id/confirm', requireRole(ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.ADMIN), ctrl.confirm);

module.exports = router;
