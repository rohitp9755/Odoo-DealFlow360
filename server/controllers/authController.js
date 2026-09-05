const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Customer = require('../models/Customer');
const { ROLES, INTERNAL_ROLES } = require('../config/roles');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '12h' });
}

function setCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000,
  });
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, customer: user.customer, emailVerified: user.emailVerified };
}

function validateCredentialsInput({ name, email, password }) {
  if (name !== undefined && (!name || !name.trim())) return 'Name is required';
  if (email !== undefined && (!email || !EMAIL_RE.test(email))) return 'A valid email is required';
  if (password !== undefined && (!password || password.length < MIN_PASSWORD_LENGTH)) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

function generateToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.active || user.authProvider !== 'local' || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    setCookie(res, token);
    res.json({ user: publicUser(user) });
  } catch (err) { next(err); }
}

async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    const validationError = validateCredentialsInput({ name, email, password });
    if (validationError) return res.status(400).json({ message: validationError });
    if (!INTERNAL_ROLES.includes(role)) return res.status(400).json({ message: `Role must be one of: ${INTERNAL_ROLES.join(', ')}` });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const { token: verifyToken, hash: verifyHash } = generateToken();
    
    const user = await User.create({
      name, email, password, role,
      authProvider: 'local',
      emailVerified: false,
      verificationTokenHash: verifyHash,
      verificationTokenExpiry: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    await sendVerificationEmail(user.email, verifyToken);

    const token = signToken(user);
    setCookie(res, token);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) { next(err); }
}

async function registerCustomer(req, res, next) {
  try {
    const { name, email, password, customerId } = req.body;
    const validationError = validateCredentialsInput({ name, email, password });
    if (validationError) return res.status(400).json({ message: validationError });

    const customer = await Customer.findById(customerId).catch(() => null);
    if (!customer) return res.status(404).json({ message: 'Customer account not found' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const { token: verifyToken, hash: verifyHash } = generateToken();

    const user = await User.create({
      name, email, password, role: ROLES.CUSTOMER, customer: customer._id,
      authProvider: 'local',
      emailVerified: false,
      verificationTokenHash: verifyHash,
      verificationTokenExpiry: Date.now() + 24 * 60 * 60 * 1000
    });

    await sendVerificationEmail(user.email, verifyToken);

    const token = signToken(user);
    setCookie(res, token);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) { next(err); }
}

async function googleLogin(req, res, next) {
  try {
    const { credential, defaultRole } = req.body;
    if (!credential) return res.status(400).json({ message: 'Google credential is required' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      if (user.authProvider === 'local') {
        // Link account safely
        user.authProvider = 'google';
        user.googleId = googleId;
        user.emailVerified = true; // Google verified it
        await user.save();
      }
    } else {
      // Create new Google user
      const role = defaultRole && INTERNAL_ROLES.includes(defaultRole) ? defaultRole : ROLES.SALES_REP; // Default to Rep for demo
      user = await User.create({
        name,
        email: email.toLowerCase(),
        role,
        authProvider: 'google',
        googleId,
        emailVerified: true
      });
    }

    if (!user.active) return res.status(401).json({ message: 'User account is inactive' });

    const token = signToken(user);
    setCookie(res, token);
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Google authentication failed' });
  }
}

async function logout(req, res) {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ message: 'Logged out successfully' });
}

async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

// Email Verification
async function verifyEmail(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      verificationTokenHash: hash,
      verificationTokenExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired verification token' });

    user.emailVerified = true;
    user.verificationTokenHash = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully', user: publicUser(user) });
  } catch (err) { next(err); }
}

async function resendVerification(req, res, next) {
  try {
    // Determine user via cookie/auth middleware OR provided email
    let user = req.user;
    if (!user && req.body.email) {
      user = await User.findOne({ email: req.body.email.toLowerCase() });
    }

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ message: 'Email already verified' });
    if (user.authProvider !== 'local') return res.status(400).json({ message: 'Account does not require email verification' });

    // Rate limiting (basic check)
    if (user.verificationTokenExpiry && (user.verificationTokenExpiry.getTime() - Date.now()) > (23.9 * 60 * 60 * 1000)) {
        // If the token was generated less than ~6 minutes ago, don't spam.
        return res.status(429).json({ message: 'Please wait before requesting another email' });
    }

    const { token: verifyToken, hash: verifyHash } = generateToken();
    user.verificationTokenHash = verifyHash;
    user.verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    await sendVerificationEmail(user.email, verifyToken);

    res.json({ message: 'Verification email sent' });
  } catch (err) { next(err); }
}

// Password Reset
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase(), authProvider: 'local' });
    if (!user) {
      // Do not leak existence
      return res.json({ message: 'If an account exists, a reset link will be sent.' });
    }

    const { token: resetToken, hash: resetHash } = generateToken();
    user.resetTokenHash = resetHash;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    await sendPasswordResetEmail(user.email, resetToken);

    res.json({ message: 'If an account exists, a reset link will be sent.' });
  } catch (err) { next(err); }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and new password are required' });

    const validationError = validateCredentialsInput({ password });
    if (validationError) return res.status(400).json({ message: validationError });

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetTokenHash: hash,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    user.password = password; // pre-save hook handles hashing
    user.resetTokenHash = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) { next(err); }
}

module.exports = { 
  login, register, registerCustomer, googleLogin, logout, me, 
  verifyEmail, resendVerification, forgotPassword, resetPassword 
};
