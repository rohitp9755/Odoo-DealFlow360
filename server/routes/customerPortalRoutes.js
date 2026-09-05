const router = require('express').Router();
const ctrl = require('../controllers/customerPortalController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

router.use(requireAuth, requireRole(ROLES.CUSTOMER));
router.get('/quotes', ctrl.myQuotes);
router.get('/quotes/:id', ctrl.getQuote);
router.post('/quotes/:id/confirm', ctrl.confirmQuote);

module.exports = router;
