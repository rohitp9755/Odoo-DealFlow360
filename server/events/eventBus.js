const EventEmitter = require('events');

class EventBus extends EventEmitter {
  // A helper method for controllers to easily broadcast real-time events.
  // audience can have: { roles: ['ADMIN', 'SALES_MANAGER'], users: ['userId1'], customers: ['customerId1'] }
  // By default, if audience is not provided, it broadcasts to everyone (use with caution).
  broadcast(event, payload, audience = {}) {
    this.emit('broadcast', { event, payload, audience });
  }
}

// Export a singleton instance
const eventBus = new EventBus();

module.exports = eventBus;
