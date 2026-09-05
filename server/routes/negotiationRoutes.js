const router = require('express').Router();
const ctrl = require('../controllers/negotiationController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);
router.get('/:quoteId', ctrl.getForQuote);
router.post('/:quoteId/message', ctrl.sendMessage);
router.post('/:quoteId/counter-offer', ctrl.counterOffer);

module.exports = router;
