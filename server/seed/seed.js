require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const ProductVariant = require('../models/ProductVariant');
const ProductVariantValue = require('../models/ProductVariantValue');
const DiscountTier = require('../models/DiscountTier');
const DiscountRule = require('../models/DiscountRule');
const ApprovalRule = require('../models/ApprovalRule');
const Warehouse = require('../models/Warehouse');
const WarehouseStock = require('../models/WarehouseStock');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const UpsellRule = require('../models/UpsellRule');
const Quote = require('../models/Quote');
const Negotiation = require('../models/Negotiation');
const NegotiationMessage = require('../models/NegotiationMessage');

const { computeQuote } = require('../services/quoteCalculator');
const { ROLES } = require('../config/roles');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Wiping existing demo collections...');

  await Promise.all([
    User.deleteMany({}), Customer.deleteMany({}), Product.deleteMany({}),
    ProductCategory.deleteMany({}), ProductVariant.deleteMany({}), ProductVariantValue.deleteMany({}),
    DiscountTier.deleteMany({}), DiscountRule.deleteMany({}), ApprovalRule.deleteMany({}),
    Warehouse.deleteMany({}), WarehouseStock.deleteMany({}), SubscriptionPlan.deleteMany({}),
    UpsellRule.deleteMany({}), Quote.deleteMany({}), Negotiation.deleteMany({}), NegotiationMessage.deleteMany({}),
    mongoose.connection.collection('approvals').deleteMany({}).catch(() => {}),
    mongoose.connection.collection('auditlogs').deleteMany({}).catch(() => {}),
    mongoose.connection.collection('fulfillments').deleteMany({}).catch(() => {}),
    mongoose.connection.collection('invoices').deleteMany({}).catch(() => {}),
    mongoose.connection.collection('dealhealths').deleteMany({}).catch(() => {}),
    mongoose.connection.collection('recommendations').deleteMany({}).catch(() => {})
  ]);

  // --- Discount governance config ---
  await DiscountTier.insertMany([
    { tier: 'Bronze', autonomousDiscount: 5 },
    { tier: 'Silver', autonomousDiscount: 10 },
    { tier: 'Gold', autonomousDiscount: 15 }
  ]);
  await DiscountRule.insertMany([
    { category: 'Hardware', ceilingDiscount: 10 },
    { category: 'Software', ceilingDiscount: 15 },
    { category: 'Services', ceilingDiscount: 8 }
  ]);
  await ApprovalRule.insertMany([
    { minDiscount: 0, maxDiscount: 5, approversRequired: [], label: 'No approval' },
    { minDiscount: 5, maxDiscount: 10, approversRequired: ['manager'], label: 'Manager approval' },
    { minDiscount: 10, maxDiscount: 15, approversRequired: ['manager', 'finance'], label: 'Manager + Finance' },
    { minDiscount: 15, maxDiscount: 9999, approversRequired: ['manager', 'finance', 'escalation'], label: 'Manager + Finance + Escalation' }
  ]);

  // --- Warehouses ---
  const [mumbai, delhi, bangalore] = await Warehouse.insertMany([
    { name: 'Mumbai Warehouse', location: 'Mumbai, MH', shippingCostPerUnit: 80, replenishmentThreshold: 10 },
    { name: 'Delhi Warehouse', location: 'Delhi, DL', shippingCostPerUnit: 120, replenishmentThreshold: 10 },
    { name: 'Bangalore Warehouse', location: 'Bangalore, KA', shippingCostPerUnit: 100, replenishmentThreshold: 10 }
  ]);

  // --- Subscription plans ---
  await SubscriptionPlan.insertMany([
    { name: 'Monthly Support', cycle: 'monthly', prorationAllowed: true, cancellationRefundPolicy: 'prorated' },
    { name: 'Quarterly Support', cycle: 'quarterly', prorationAllowed: true, cancellationRefundPolicy: 'prorated' },
    { name: 'Yearly Support', cycle: 'yearly', prorationAllowed: true, cancellationRefundPolicy: 'prorated' }
  ]);

  // --- Product categories ---
  await ProductCategory.insertMany([
    { name: 'Hardware', description: 'Physical devices and accessories' },
    { name: 'Software', description: 'Licenses and digital products' },
    { name: 'Services', description: 'Setup, support, and professional services' }
  ]);

  // --- Products (20+) ---
  const products = await Product.insertMany([
    { name: 'Laptop Pro 14', category: 'Hardware', subCategory: 'Laptops', price: 80000, cost: 58000, tags: ['laptop', 'premium'], promoted: false },
    { name: 'Laptop Air 13', category: 'Hardware', subCategory: 'Laptops', price: 62000, cost: 45000, tags: ['laptop'] },
    { name: 'Workstation X1', category: 'Hardware', subCategory: 'Laptops', price: 120000, cost: 90000, tags: ['laptop', 'premium'] },
    { name: '27" 4K Monitor', category: 'Hardware', subCategory: 'Monitors', price: 28000, cost: 19000, tags: ['monitor'] },
    { name: '24" FHD Monitor', category: 'Hardware', subCategory: 'Monitors', price: 12000, cost: 8000, tags: ['monitor'] },
    { name: 'USB-C Docking Station', category: 'Hardware', subCategory: 'Docking Stations', price: 8999, cost: 5200, tags: ['dock', 'laptop-accessory'], promoted: true },
    { name: 'Wireless Keyboard', category: 'Hardware', subCategory: 'Keyboards', price: 2500, cost: 1400, tags: ['keyboard', 'laptop-accessory'] },
    { name: 'Mechanical Keyboard Pro', category: 'Hardware', subCategory: 'Keyboards', price: 6500, cost: 4000, tags: ['keyboard'] },
    { name: 'Wireless Mouse', category: 'Hardware', subCategory: 'Mice', price: 1500, cost: 800, tags: ['mouse', 'laptop-accessory'] },
    { name: 'Ergonomic Mouse', category: 'Hardware', subCategory: 'Mice', price: 3200, cost: 1900, tags: ['mouse'] },
    { name: 'Webcam 1080p', category: 'Hardware', subCategory: 'Accessories', price: 3500, cost: 2100, tags: ['webcam', 'laptop-accessory'] },
    { name: 'Laptop Backpack', category: 'Hardware', subCategory: 'Accessories', price: 2800, cost: 1500, tags: ['bag', 'laptop-accessory'] },
    { name: 'Office Suite License', category: 'Software', subCategory: 'Productivity', price: 9000, cost: 3000, tags: ['software', 'productivity'] },
    { name: 'Antivirus Enterprise', category: 'Software', subCategory: 'Security', price: 4500, cost: 1200, tags: ['software', 'security'] },
    { name: 'Design Suite Pro', category: 'Software', subCategory: 'Creative', price: 15000, cost: 6000, tags: ['software', 'creative'] },
    { name: 'CRM License (per seat)', category: 'Software', subCategory: 'Business', price: 5000, cost: 1800, tags: ['software', 'business'] },
    { name: 'VPN Business License', category: 'Software', subCategory: 'Security', price: 3000, cost: 1000, tags: ['software', 'security'] },
    { name: 'On-site Setup Service', category: 'Services', subCategory: 'Setup', price: 5000, cost: 2500, tags: ['service', 'setup'] },
    { name: 'Data Migration Service', category: 'Services', subCategory: 'Setup', price: 12000, cost: 6000, tags: ['service', 'setup'] },
    { name: 'Monthly Support Plan', category: 'Services', subCategory: 'Support Plans', price: 2000, cost: 700, tags: ['service', 'support'], isRecurring: true, billingCycle: 'monthly', promoted: true },
    { name: 'Quarterly Support Plan', category: 'Services', subCategory: 'Support Plans', price: 5400, cost: 2000, tags: ['service', 'support'], isRecurring: true, billingCycle: 'quarterly' },
    { name: 'Yearly Support Plan', category: 'Services', subCategory: 'Support Plans', price: 19200, cost: 7500, tags: ['service', 'support'], isRecurring: true, billingCycle: 'yearly' }
  ]);
  const byName = Object.fromEntries(products.map(p => [p.name, p]));

  // --- A demo variant/value pair, to show the ProductVariant/ProductVariantValue shape ---
  const colorVariant = await ProductVariant.create({ product: byName['Laptop Pro 14']._id, name: 'Color' });
  await ProductVariantValue.insertMany([
    { variant: colorVariant._id, value: 'Space Grey' },
    { variant: colorVariant._id, value: 'Silver' }
  ]);

  // --- Warehouse stock (deliberately uneven for the split-shipment demo) ---
  const stockPlan = [
    { product: 'Laptop Pro 14', mumbai: 6, delhi: 4, bangalore: 5 },
    { product: 'Laptop Air 13', mumbai: 10, delhi: 8, bangalore: 6 },
    { product: 'Workstation X1', mumbai: 2, delhi: 1, bangalore: 0 },
    { product: '27" 4K Monitor', mumbai: 3, delhi: 4, bangalore: 5 }, // total 12, demo needs 10 -> some split
    { product: '24" FHD Monitor', mumbai: 15, delhi: 15, bangalore: 15 },
    { product: 'USB-C Docking Station', mumbai: 20, delhi: 20, bangalore: 20 },
    { product: 'Wireless Keyboard', mumbai: 30, delhi: 30, bangalore: 30 },
    { product: 'Mechanical Keyboard Pro', mumbai: 10, delhi: 10, bangalore: 10 },
    { product: 'Wireless Mouse', mumbai: 40, delhi: 40, bangalore: 40 },
    { product: 'Ergonomic Mouse', mumbai: 15, delhi: 15, bangalore: 15 },
    { product: 'Webcam 1080p', mumbai: 12, delhi: 12, bangalore: 12 },
    { product: 'Laptop Backpack', mumbai: 20, delhi: 20, bangalore: 20 }
  ];
  const stockDocs = [];
  for (const row of stockPlan) {
    const p = byName[row.product];
    stockDocs.push({ warehouse: mumbai._id, product: p._id, quantity: row.mumbai });
    stockDocs.push({ warehouse: delhi._id, product: p._id, quantity: row.delhi });
    stockDocs.push({ warehouse: bangalore._id, product: p._id, quantity: row.bangalore });
  }
  await WarehouseStock.insertMany(stockDocs);

  // --- Upsell / co-purchase rules ---
  await UpsellRule.insertMany([
    { baseProduct: byName['Laptop Pro 14']._id, recommendedProduct: byName['USB-C Docking Station']._id, weight: 0.95, promoted: true },
    { baseProduct: byName['Laptop Pro 14']._id, recommendedProduct: byName['Wireless Mouse']._id, weight: 0.7 },
    { baseProduct: byName['Laptop Air 13']._id, recommendedProduct: byName['USB-C Docking Station']._id, weight: 0.8 },
    { baseProduct: byName['27" 4K Monitor']._id, recommendedProduct: byName['USB-C Docking Station']._id, weight: 0.6 },
    { baseProduct: byName['Laptop Pro 14']._id, recommendedProduct: byName['Monthly Support Plan']._id, weight: 0.5 },
    { baseProduct: byName['Workstation X1']._id, recommendedProduct: byName['Design Suite Pro']._id, weight: 0.75 }
  ]);

  // --- Internal users (created before customers so we can assign a rep) ---
  const [repUser, managerUser, financeUser, adminUser] = await User.create([
    { name: 'Riya Rep', email: 'rep@dealflow360.com', password: 'password123', role: ROLES.SALES_REP },
    { name: 'Manoj Manager', email: 'manager@dealflow360.com', password: 'password123', role: ROLES.SALES_MANAGER },
    { name: 'Farah Finance', email: 'finance@dealflow360.com', password: 'password123', role: ROLES.FINANCE },
    { name: 'Aditi Admin', email: 'admin@dealflow360.com', password: 'password123', role: ROLES.ADMIN }
  ]);
  const rep = repUser;

  // --- Customers ---
  const [acme, nova, vertex] = await Customer.insertMany([
    {
      name: 'Acme Technologies', tier: 'Gold', email: 'buyer@acme.example', phone: '+91-9800000001',
      billingAddress: { street: '221 MG Road', city: 'Mumbai', state: 'MH', postalCode: '400001', country: 'India' },
      shippingAddress: { street: '221 MG Road', city: 'Mumbai', state: 'MH', postalCode: '400001', country: 'India' },
      shippingSameAsBilling: true, assignedRep: rep._id, status: 'active', repHistoricalAvgDiscount: 9
    },
    {
      name: 'Nova Systems', tier: 'Silver', email: 'procurement@novasystems.example', phone: '+91-9800000002',
      billingAddress: { street: '12 Residency Road', city: 'Bangalore', state: 'KA', postalCode: '560025', country: 'India' },
      shippingAddress: { street: '12 Residency Road', city: 'Bangalore', state: 'KA', postalCode: '560025', country: 'India' },
      shippingSameAsBilling: true, assignedRep: rep._id, status: 'active', repHistoricalAvgDiscount: 6
    },
    {
      name: 'Vertex Retail', tier: 'Bronze', email: 'ops@vertexretail.example', phone: '+91-9800000003',
      billingAddress: { street: '45 Connaught Place', city: 'Delhi', state: 'DL', postalCode: '110001', country: 'India' },
      shippingAddress: { street: '45 Connaught Place', city: 'Delhi', state: 'DL', postalCode: '110001', country: 'India' },
      shippingSameAsBilling: true, assignedRep: rep._id, status: 'active', repHistoricalAvgDiscount: 4
    }
  ]);

  // --- Customer portal user (must come after the Customer it links to) ---
  const buyerUser = await User.create({ name: 'Acme Buyer', email: 'customer@dealflow360.com', password: 'password123', role: ROLES.CUSTOMER, customer: acme._id });
  const users = [repUser, managerUser, financeUser, adminUser, buyerUser];

  // --- Demo Quote 1: Acme, multi-product, discount ABOVE threshold -> triggers approval ---
  const demoLines1 = [
    { product: byName['Laptop Pro 14']._id, quantity: 10, lineDiscount: 15 }, // Hardware ceiling 10% -> violation
    { product: byName['27" 4K Monitor']._id, quantity: 10, lineDiscount: 12 }, // violation too
    { product: byName['USB-C Docking Station']._id, quantity: 10, lineDiscount: 5 }
  ];
  const computed1 = await computeQuote({ customerId: acme._id, orderDiscount: 0, lines: demoLines1 });
  const quote1 = await Quote.create({
    customer: acme._id, rep: rep._id, lines: computed1.lines, orderDiscount: 0,
    subtotal: computed1.subtotal, discountAmount: computed1.discountAmount, total: computed1.total,
    totalCost: computed1.totalCost, margin: computed1.margin, marginPercent: computed1.marginPercent,
    riskScore: computed1.riskScore, riskBand: computed1.riskBand, marginLeakage: computed1.marginLeakage,
    oneTimeTotal: computed1.oneTimeTotal, recurringTotal: computed1.recurringTotal, recurringCycle: computed1.recurringCycle,
    stage: 'draft'
  });

  // --- Demo Quote 2: Nova, inventory shortage across warehouses (Workstation X1 qty 5, stock only 3) ---
  const demoLines2 = [
    { product: byName['Workstation X1']._id, quantity: 5, lineDiscount: 5 },
    { product: byName['Design Suite Pro']._id, quantity: 5, lineDiscount: 5 }
  ];
  const computed2 = await computeQuote({ customerId: nova._id, orderDiscount: 0, lines: demoLines2 });
  await Quote.create({
    customer: nova._id, rep: rep._id, lines: computed2.lines, orderDiscount: 0,
    subtotal: computed2.subtotal, discountAmount: computed2.discountAmount, total: computed2.total,
    totalCost: computed2.totalCost, margin: computed2.margin, marginPercent: computed2.marginPercent,
    riskScore: computed2.riskScore, riskBand: computed2.riskBand, marginLeakage: computed2.marginLeakage,
    oneTimeTotal: computed2.oneTimeTotal, recurringTotal: computed2.recurringTotal, recurringCycle: computed2.recurringCycle,
    stage: 'draft'
  });

  // --- Demo Quote 3: Vertex, hybrid one-time + recurring billing ---
  const demoLines3 = [
    { product: byName['Laptop Air 13']._id, quantity: 3, lineDiscount: 2 },
    { product: byName['Monthly Support Plan']._id, quantity: 3, lineDiscount: 0 }
  ];
  const computed3 = await computeQuote({ customerId: vertex._id, orderDiscount: 0, lines: demoLines3 });
  await Quote.create({
    customer: vertex._id, rep: rep._id, lines: computed3.lines, orderDiscount: 0,
    subtotal: computed3.subtotal, discountAmount: computed3.discountAmount, total: computed3.total,
    totalCost: computed3.totalCost, margin: computed3.margin, marginPercent: computed3.marginPercent,
    riskScore: computed3.riskScore, riskBand: computed3.riskBand, marginLeakage: computed3.marginLeakage,
    oneTimeTotal: computed3.oneTimeTotal, recurringTotal: computed3.recurringTotal, recurringCycle: computed3.recurringCycle,
    stage: 'draft'
  });

  // --- Negotiation history for Acme's quote 1 ---
  const msg1 = await NegotiationMessage.create({ role: 'customer', content: 'Can you give me 18% discount if I confirm today?', intent: 'COUNTER_OFFER', requestedDiscount: 18 });
  const msg2 = await NegotiationMessage.create({ role: 'agent', content: 'I can offer 15% immediately. 18% requires additional approval. Would you like me to submit that request?', intent: 'COUNTER_OFFER' });
  await Negotiation.create({
    quote: quote1._id, customer: acme._id, messages: [msg1._id, msg2._id],
    offers: [{ requestedDiscount: 18, recommendedDiscount: 15, requiresApproval: true, status: 'proposed' }],
    status: 'open'
  });

  console.log('Seed complete.');
  console.log('Demo users (password: password123):');
  users.forEach(u => console.log(`  ${u.role.padEnd(10)} ${u.email}`));
  console.log(`Quote 1 (Acme, needs approval): ${quote1._id}`);

  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
