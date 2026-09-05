const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

router.use(requireAuth);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', requireRole(ROLES.ADMIN), ctrl.create);
router.put('/:id', requireRole(ROLES.ADMIN), ctrl.update);

module.exports = router;
