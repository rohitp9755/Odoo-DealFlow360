const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Customer = require('../models/Customer');
const { ROLES, INTERNAL_ROLES } = require('../config/roles');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '12h' });
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, customer: user.customer };
}

// Shared input checks for both signup endpoints, kept separate from Mongoose's
// own schema validation so callers get a clear 400 before any DB round-trip.
function validateCredentialsInput({ name, email, password }) {
  if (!name || !name.trim()) return 'Name is required';
  if (!email || !EMAIL_RE.test(email)) return 'A valid email is required';
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.active || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) { next(err); }
}

// Signup for internal staff (Admin, Sales Rep, Sales Manager, Finance).
// CUSTOMER accounts must use registerCustomer below — they need a linked Customer record.
async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    const validationError = validateCredentialsInput({ name, email, password });
    if (validationError) return res.status(400).json({ message: validationError });
    if (!INTERNAL_ROLES.includes(role)) {
      return res.status(400).json({ message: `Role must be one of: ${INTERNAL_ROLES.join(', ')}` });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, role });
    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    if (err.name === 'ValidationError') err.status = 400;
    next(err);
  }
}

// Signup for a customer-portal user. Must reference an existing Customer
// account (created by a rep/admin) rather than creating one implicitly.
async function registerCustomer(req, res, next) {
  try {
    const { name, email, password, customerId } = req.body;

    const validationError = validateCredentialsInput({ name, email, password });
    if (validationError) return res.status(400).json({ message: validationError });
    if (!customerId) return res.status(400).json({ message: 'customerId is required' });

    const customer = await Customer.findById(customerId).catch(() => null);
    if (!customer) return res.status(404).json({ message: 'Customer account not found' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, role: ROLES.CUSTOMER, customer: customer._id });
    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    if (err.name === 'ValidationError') err.status = 400;
    next(err);
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, register, registerCustomer, me };
