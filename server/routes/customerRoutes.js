const router = require('express').Router();
const ctrl = require('../controllers/customerController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);
router.get('/', requireRole('rep', 'manager', 'finance', 'admin'), ctrl.list);
router.get('/:id', requireRole('rep', 'manager', 'finance', 'admin'), ctrl.getOne);
router.post('/', requireRole('admin', 'rep'), ctrl.create);
router.put('/:id', requireRole('admin', 'rep'), ctrl.update);

module.exports = router;
