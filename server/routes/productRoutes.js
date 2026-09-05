const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', requireRole('admin'), ctrl.create);
router.put('/:id', requireRole('admin'), ctrl.update);

module.exports = router;
