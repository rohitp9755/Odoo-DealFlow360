const router = require('express').Router();
const ctrl = require('../controllers/productCategoryController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

router.use(requireAuth);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', requireRole(ROLES.ADMIN), ctrl.create);
router.put('/:id', requireRole(ROLES.ADMIN), ctrl.update);
router.delete('/:id', requireRole(ROLES.ADMIN), ctrl.remove);

module.exports = router;
