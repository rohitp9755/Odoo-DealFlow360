// Shared connection helper for integration tests. Uses the same MONGODB_URI
// the app already requires for `npm run dev` — no separate test-DB dependency.
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

async function connectTestDB() {
  if (mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy server/.env.example to server/.env before running tests.');
  }
  await mongoose.connect(uri);
}

async function disconnectTestDB() {
  await mongoose.connection.close();
}

module.exports = { connectTestDB, disconnectTestDB };
