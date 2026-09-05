const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ALL_ROLES, ROLES } = require('../config/roles');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address']
  },
  password: { type: String, required: true, minlength: [8, 'Password must be at least 8 characters'] },
  role: { type: String, enum: ALL_ROLES, required: true },
  // Required only for CUSTOMER-role accounts, which must link to an existing Customer record.
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: function () { return this.role === ROLES.CUSTOMER; }
  },
  active: { type: Boolean, default: true }
}, { timestamps: true });

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', UserSchema);
