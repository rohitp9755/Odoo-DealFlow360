const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

router.use(requireAuth, requireRole(ROLES.ADMIN));

router.get('/approval-rules', ctrl.getApprovalRules);
router.post('/approval-rules', ctrl.createApprovalRule);
router.put('/approval-rules/:id', ctrl.updateApprovalRule);

router.get('/warehouses', ctrl.getWarehouses);
router.post('/warehouses', ctrl.createWarehouse);
router.put('/warehouses/:id', ctrl.updateWarehouse);
router.get('/warehouse-stock', ctrl.getStock);
router.put('/warehouse-stock', ctrl.setStock);

router.get('/subscription-plans', ctrl.getSubscriptionPlans);
router.post('/subscription-plans', ctrl.createSubscriptionPlan);

router.get('/upsell-rules', ctrl.getUpsellRules);
router.post('/upsell-rules', ctrl.createUpsellRule);

module.exports = router;
