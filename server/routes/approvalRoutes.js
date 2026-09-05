const router = require('express').Router();
const ctrl = require('../controllers/approvalController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

router.use(requireAuth);
router.get('/', requireRole(ROLES.SALES_MANAGER, ROLES.FINANCE, ROLES.ADMIN), ctrl.list);
router.get('/:id', requireRole(ROLES.SALES_MANAGER, ROLES.FINANCE, ROLES.ADMIN), ctrl.getOne);
router.post('/:id/approve', requireRole(ROLES.SALES_MANAGER, ROLES.FINANCE), ctrl.approve);
router.post('/:id/reject', requireRole(ROLES.SALES_MANAGER, ROLES.FINANCE), ctrl.reject);
router.post('/:id/return', requireRole(ROLES.SALES_MANAGER, ROLES.FINANCE), ctrl.returnStep);

module.exports = router;
