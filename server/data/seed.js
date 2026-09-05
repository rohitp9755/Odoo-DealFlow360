export const tierDiscountLimits = {
  Bronze: 5,
  Silver: 10,
  Gold: 15
};

export const categoryDiscountLimits = {
  Hardware: 15,
  Service: 10,
  Subscription: 12
};

export const approvalThresholds = {
  managerOnly: 40,
  managerPlusFinance: 100
};

export function buildSeed() {
  const customers = [
    { id: "cust-1", name: "ABC Corp", tier: "Gold", email: "buyer@abccorp.com" },
    { id: "cust-2", name: "Acme Industries", tier: "Silver", email: "procurement@acme.io" },
    { id: "cust-3", name: "Nova Technologies", tier: "Bronze", email: "hello@novatech.com" },
    { id: "cust-4", name: "Global Systems", tier: "Gold", email: "ops@globalsystems.com" }
  ];

  const products = [
    { id: "prod-1", name: "Enterprise Laptop", category: "Hardware", type: "one_time", price: 85000, cost: 62000 },
    { id: "prod-2", name: "Business Monitor", category: "Hardware", type: "one_time", price: 18000, cost: 12500 },
    { id: "prod-3", name: "Installation Service", category: "Service", type: "one_time", price: 6000, cost: 2000 },
    { id: "prod-4", name: "Extended Warranty", category: "Service", type: "one_time", price: 9500, cost: 3000 },
    { id: "prod-5", name: "Laptop Bag", category: "Hardware", type: "one_time", price: 2200, cost: 900 },
    { id: "prod-6", name: "Software Subscription", category: "Subscription", type: "recurring", price: 1500, cost: 400, billingFrequency: "monthly" },
    { id: "prod-7", name: "Priority Support Plan", category: "Subscription", type: "recurring", price: 3200, cost: 900, billingFrequency: "monthly" }
  ];

  const warehouses = [
    { id: "wh-1", name: "Mumbai Warehouse", stock: { "prod-1": 15, "prod-2": 40, "prod-5": 100 } },
    { id: "wh-2", name: "Surat Warehouse", stock: { "prod-1": 5, "prod-2": 20, "prod-5": 60 } },
    { id: "wh-3", name: "Delhi Warehouse", stock: { "prod-1": 8, "prod-2": 30, "prod-5": 80 } }
  ];

  const upsellRules = {
    "prod-1": [
      { productId: "prod-4", reason: "78% of customers buying this product also purchase extended warranty.", confidence: 87 },
      { productId: "prod-5", reason: "Frequently bundled to protect device during transit.", confidence: 74 },
      { productId: "prod-6", reason: "Enterprise buyers commonly attach a software subscription to new hardware.", confidence: 69 }
    ],
    "prod-2": [
      { productId: "prod-4", reason: "Monitors ordered in bulk often include extended coverage.", confidence: 61 }
    ]
  };

  const quotations = [
    {
      id: "q-1001",
      customerId: "cust-2",
      status: "draft",
      createdAt: daysAgo(9),
      updatedAt: daysAgo(9),
      lines: [
        { id: "l-1", productId: "prod-1", qty: 6, discount: 8 },
        { id: "l-2", productId: "prod-3", qty: 6, discount: 6 }
      ],
      auditLog: [logEntry("System", "Quotation drafted", daysAgo(9))],
      warehouseSplit: null,
      negotiations: []
    },
    {
      id: "q-1002",
      customerId: "cust-4",
      status: "pending_manager",
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
      lines: [
        { id: "l-1", productId: "prod-1", qty: 10, discount: 12 },
        { id: "l-2", productId: "prod-2", qty: 10, discount: 10 },
        { id: "l-3", productId: "prod-3", qty: 1, discount: 18 }
      ],
      auditLog: [
        logEntry("System", "Quotation drafted", daysAgo(1)),
        logEntry("System", "Risk score calculated", daysAgo(1))
      ],
      warehouseSplit: null,
      negotiations: []
    }
  ];

  return { customers, products, warehouses, upsellRules, quotations };
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

export function logEntry(user, action, timestamp, extra) {
  return {
    id: "log-" + Math.random().toString(36).slice(2, 9),
    user,
    action,
    timestamp: timestamp || new Date().toISOString(),
    ...extra
  };
}
