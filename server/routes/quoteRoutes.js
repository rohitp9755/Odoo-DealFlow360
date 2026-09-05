const router = require('express').Router();
const ctrl = require('../controllers/quoteController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);
router.get('/', requireRole('rep', 'manager', 'finance', 'admin'), ctrl.list);
router.get('/:id', requireRole('rep', 'manager', 'finance', 'admin'), ctrl.getOne);
router.post('/', requireRole('rep', 'admin'), ctrl.create);
router.put('/:id', requireRole('rep', 'admin'), ctrl.update);
router.post('/:id/submit', requireRole('rep', 'admin'), ctrl.submit);
router.post('/:id/confirm', requireRole('rep', 'manager', 'admin'), ctrl.confirm);

module.exports = router;
