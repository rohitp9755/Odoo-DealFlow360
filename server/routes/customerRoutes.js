const router = require('express').Router();
const ctrl = require('../controllers/customerController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

router.use(requireAuth);
router.get('/', requireRole(ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.FINANCE, ROLES.ADMIN), ctrl.list);
router.get('/:id', requireRole(ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.FINANCE, ROLES.ADMIN), ctrl.getOne);
router.post('/', requireRole(ROLES.ADMIN, ROLES.SALES_REP), ctrl.create);
router.put('/:id', requireRole(ROLES.ADMIN, ROLES.SALES_REP), ctrl.update);

module.exports = router;
