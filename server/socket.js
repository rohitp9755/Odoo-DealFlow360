const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const eventBus = require('./events/eventBus');

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  // Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error: No token provided'));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id).select('-password');
      if (!user || !user.active) return next(new Error('Authentication error: Invalid or inactive user'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.user.email} (${socket.user.role})`);

    // Join role-based room
    socket.join(`role_${socket.user.role}`);
    
    // Join user-specific room
    socket.join(`user_${socket.user._id.toString()}`);

    // If the user is a CUSTOMER, join their customer room
    if (socket.user.role === 'CUSTOMER' && socket.user.customer) {
      socket.join(`customer_${socket.user.customer.toString()}`);
    }

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.user.email}`);
    });
  });

  // Listen to the central Event Bus
  eventBus.on('broadcast', ({ event, payload, audience }) => {
    const { roles, users, customers } = audience;
    
    // Create an event payload with timestamp
    const socketPayload = {
      event,
      timestamp: new Date().toISOString(),
      data: payload
    };

    let sent = false;

    // Broadcast to specific roles
    if (roles && roles.length > 0) {
      roles.forEach(role => io.to(`role_${role}`).emit('realtime_event', socketPayload));
      sent = true;
    }

    // Broadcast to specific users
    if (users && users.length > 0) {
      users.forEach(userId => io.to(`user_${userId.toString()}`).emit('realtime_event', socketPayload));
      sent = true;
    }

    // Broadcast to specific customers
    if (customers && customers.length > 0) {
      customers.forEach(customerId => io.to(`customer_${customerId.toString()}`).emit('realtime_event', socketPayload));
      sent = true;
    }

    // If no specific audience was targeted, broadcast to all connected clients (use carefully)
    if (!sent) {
      io.emit('realtime_event', socketPayload);
    }
  });
}

function getIo() {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
}

module.exports = { initSocket, getIo };
