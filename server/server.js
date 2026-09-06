const app = require('./app');
const connectDB = require('./config/db');
const http = require('http');
const { initSocket } = require('./socket');

const PORT = process.env.PORT || 5000;

// Create HTTP server explicitly to attach Socket.io
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

connectDB().then(() => {
  server.listen(PORT, () => console.log(`DealFlow360 server running on port ${PORT}`));
});

module.exports = server;
