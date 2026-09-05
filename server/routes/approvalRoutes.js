const router = require('express').Router();
const ctrl = require('../controllers/approvalController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);
router.get('/', requireRole('manager', 'finance', 'admin'), ctrl.list);
router.get('/:id', requireRole('manager', 'finance', 'admin'), ctrl.getOne);
router.post('/:id/approve', requireRole('manager', 'finance'), ctrl.approve);
router.post('/:id/reject', requireRole('manager', 'finance'), ctrl.reject);
router.post('/:id/return', requireRole('manager', 'finance'), ctrl.returnStep);

module.exports = router;
