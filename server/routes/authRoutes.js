const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/login', ctrl.login);
router.post('/register', ctrl.register);
router.post('/register-customer', ctrl.registerCustomer);
router.post('/google-login', ctrl.googleLogin);
router.post('/logout', ctrl.logout);
router.get('/me', requireAuth, ctrl.me);

router.post('/verify-email', ctrl.verifyEmail);
// resend can take email from body or use requireAuth optionally. We'll use a custom middleware stack if we want, but it's simpler to just let the controller handle both.
// However, req.user is only populated if requireAuth runs. To gracefully check token without failing, we can skip requireAuth here, 
// and in the controller we check if body.email exists. We can also make a softAuth middleware but for simplicity the controller just checks req.body.email.
router.post('/resend-verification', ctrl.resendVerification);

router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);

module.exports = router;
