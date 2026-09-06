const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/.env' });

const User = require('./models/User');
const Customer = require('./models/Customer');
const Product = require('./models/Product');
const ProductVariant = require('./models/ProductVariant');
const ProductVariantValue = require('./models/ProductVariantValue');
const Warehouse = require('./models/Warehouse');
const WarehouseStock = require('./models/WarehouseStock');
const PriceList = require('./models/PriceList');
const DiscountTier = require('./models/DiscountTier');
const DiscountRule = require('./models/DiscountRule');
const SubscriptionPlan = require('./models/SubscriptionPlan');
const UpsellRule = require('./models/UpsellRule');
const ApprovalRule = require('./models/ApprovalRule');
const Quote = require('./models/Quote');
const Fulfillment = require('./models/Fulfillment');
const Approval = require('./models/Approval');
const AuditLog = require('./models/AuditLog');
const DealHealth = require('./models/DealHealth');

const { ROLES } = require('./config/roles');
const { computeQuote } = require('./services/quoteCalculator');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected for Mega Seeding...');

    console.log('Wiping existing data...');
    await Promise.all([
      User.deleteMany({}),
      Customer.deleteMany({}),
      Product.deleteMany({}),
      ProductVariant.deleteMany({}),
      ProductVariantValue.deleteMany({}),
      Warehouse.deleteMany({}),
      WarehouseStock.deleteMany({}),
      PriceList.deleteMany({}),
      DiscountTier.deleteMany({}),
      DiscountRule.deleteMany({}),
      SubscriptionPlan.deleteMany({}),
      UpsellRule.deleteMany({}),
      ApprovalRule.deleteMany({}),
      Quote.deleteMany({}),
      Fulfillment.deleteMany({}),
      Approval.deleteMany({}),
      AuditLog.deleteMany({}),
      DealHealth.deleteMany({})
    ]);

    // 1. Internal Users
    console.log('Creating users...');
    const admin = await User.create({ name: 'Admin User', email: 'admin@dealflow360.com', password: 'password123', role: ROLES.ADMIN });
    const manager = await User.create({ name: 'Sarah Manager', email: 'manager@dealflow360.com', password: 'password123', role: ROLES.SALES_MANAGER });
    const finance = await User.create({ name: 'Frank Controller', email: 'finance@dealflow360.com', password: 'password123', role: ROLES.FINANCE });
    const rep1 = await User.create({ name: 'Rachel Rep', email: 'rep@dealflow360.com', password: 'password123', role: ROLES.SALES_REP });
    const rep2 = await User.create({ name: 'David Sales', email: 'rep2@dealflow360.com', password: 'password123', role: ROLES.SALES_REP });

    // 2. Customers
    console.log('Creating customers...');
    const custAcme = await Customer.create({ name: 'Acme Corporation', email: 'buyer@acme.com', tier: 'Gold', status: 'active', phone: '+1 555-0199', address: '123 Acme Way, NY' });
    const custBeta = await Customer.create({ name: 'Beta Industries', email: 'contact@betaind.com', tier: 'Silver', status: 'active', phone: '+1 555-0211', address: '456 Beta Rd, CA' });
    const custNova = await Customer.create({ name: 'Nova Systems', email: 'purchasing@novasys.com', tier: 'Bronze', status: 'active', phone: '+1 555-0322', address: '789 Nova Ave, TX' });
    const custGlobal = await Customer.create({ name: 'Global Tech', email: 'procurement@globaltech.com', tier: 'Gold', status: 'active', phone: '+1 555-0455', address: '101 Global Plaza, IL' });
    const custStark = await Customer.create({ name: 'Stark Enterprises', email: 'purchasing@stark.com', tier: 'Gold', status: 'active', phone: '+1 555-0999', address: '200 Stark Tower, NY' });
    const custWayne = await Customer.create({ name: 'Wayne Enterprises', email: 'bruce@wayne.com', tier: 'Silver', status: 'active', phone: '+1 555-0888', address: '1007 Mountain Drive, NJ' });

    // Customer Portal User
    const customerUser = await User.create({ name: 'Acme Buyer', email: 'buyer@acme.com', password: 'password123', role: ROLES.CUSTOMER, customer: custAcme._id });
    custAcme.user = customerUser._id;
    await custAcme.save();

    // 3. Products & Variants
    console.log('Creating products & variants...');
    const prodLaptop = await Product.create({ name: 'Enterprise Laptop Pro', category: 'Hardware', price: 85000, cost: 70000, unit: 'Unit', tax: 18, isRecurring: false });
    const prodGateway = await Product.create({ name: 'Secure Network Gateway', category: 'Hardware', price: 40000, cost: 30000, unit: 'Unit', tax: 18, isRecurring: false });
    const prodServer = await Product.create({ name: 'Rackmount Server G10', category: 'Hardware', price: 250000, cost: 180000, unit: 'Unit', tax: 18, isRecurring: false });
    
    const prodInstall = await Product.create({ name: 'On-site Installation', category: 'Services', price: 15000, cost: 10000, unit: 'Project', tax: 18, isRecurring: false });
    const prodTraining = await Product.create({ name: 'Corporate Training Package', category: 'Services', price: 25000, cost: 10000, unit: 'Project', tax: 18, isRecurring: false });
    const prodSupport = await Product.create({ name: '24/7 Premium Support', category: 'Services', price: 5000, cost: 2000, unit: 'Month', tax: 18, isRecurring: true, billingCycle: 'monthly' });
    
    const prodCloudSub = await Product.create({ name: 'Cloud ERP Subscription', category: 'Subscription', price: 120000, cost: 60000, unit: 'Year', tax: 18, isRecurring: true, billingCycle: 'yearly' });
    const prodSecSub = await Product.create({ name: 'Cybersecurity Shield', category: 'Subscription', price: 60000, cost: 20000, unit: 'Year', tax: 18, isRecurring: true, billingCycle: 'yearly' });

    // Variants for Laptop
    const laptopRam = await ProductVariant.create({ product: prodLaptop._id, name: 'RAM' });
    await ProductVariantValue.create([{ variant: laptopRam._id, value: '16GB' }, { variant: laptopRam._id, value: '32GB' }, { variant: laptopRam._id, value: '64GB' }]);
    
    const laptopStorage = await ProductVariant.create({ product: prodLaptop._id, name: 'Storage' });
    await ProductVariantValue.create([{ variant: laptopStorage._id, value: '512GB SSD' }, { variant: laptopStorage._id, value: '1TB SSD' }, { variant: laptopStorage._id, value: '2TB SSD' }]);

    // Variants for Server
    const serverCpu = await ProductVariant.create({ product: prodServer._id, name: 'CPU' });
    await ProductVariantValue.create([{ variant: serverCpu._id, value: '8-Core' }, { variant: serverCpu._id, value: '16-Core' }]);

    // 4. Warehouses & Stock
    console.log('Creating warehouses & stock...');
    const whMumbai = await Warehouse.create({ name: 'Mumbai Central', code: 'BOM-01', location: 'Mumbai, MH', shippingCostPerUnit: 500, active: true });
    const whDelhi = await Warehouse.create({ name: 'Delhi NCR Depot', code: 'DEL-02', location: 'New Delhi, DL', shippingCostPerUnit: 400, active: true });
    const whBangalore = await Warehouse.create({ name: 'Bangalore Hub', code: 'BLR-03', location: 'Bangalore, KA', shippingCostPerUnit: 350, active: true });

    const stocks = [
      { warehouse: whMumbai._id, product: prodLaptop._id, quantity: 120 },
      { warehouse: whDelhi._id, product: prodLaptop._id, quantity: 45 },
      { warehouse: whBangalore._id, product: prodLaptop._id, quantity: 200 },
      
      { warehouse: whMumbai._id, product: prodGateway._id, quantity: 80 },
      { warehouse: whBangalore._id, product: prodGateway._id, quantity: 15 },
      
      { warehouse: whDelhi._id, product: prodServer._id, quantity: 12 },
      { warehouse: whBangalore._id, product: prodServer._id, quantity: 5 }
    ];
    await WarehouseStock.insertMany(stocks);

    // 5. Price Lists
    console.log('Creating price lists...');
    const priceLists = [
      { product: prodLaptop._id, tier: 'Gold', currency: 'INR', price: 78000, active: true },
      { product: prodLaptop._id, tier: 'Silver', currency: 'INR', price: 81000, active: true },
      { product: prodLaptop._id, tier: 'Gold', currency: 'USD', price: 950, active: true },
      { product: prodServer._id, tier: 'Gold', currency: 'INR', price: 230000, active: true },
      { product: prodServer._id, tier: 'Silver', currency: 'INR', price: 240000, active: true },
      { product: prodCloudSub._id, tier: 'Gold', currency: 'INR', price: 100000, active: true },
      { product: prodCloudSub._id, tier: 'Gold', currency: 'USD', price: 1200, active: true },
      { product: prodSecSub._id, tier: 'Gold', currency: 'INR', price: 50000, active: true }
    ];
    await PriceList.insertMany(priceLists);

    // 6. Discount & Approval Rules
    console.log('Creating discount configuration...');
    await DiscountTier.create([{ tier: 'Bronze', autonomousDiscount: 5 }, { tier: 'Silver', autonomousDiscount: 10 }, { tier: 'Gold', autonomousDiscount: 15 }]);
    await DiscountRule.create([{ category: 'Hardware', ceilingDiscount: 15 }, { category: 'Services', ceilingDiscount: 20 }, { category: 'Subscription', ceilingDiscount: 25 }]);
    
    await ApprovalRule.create([
      { minDiscount: 0, maxDiscount: 5, approversRequired: [] },
      { minDiscount: 5.01, maxDiscount: 15, approversRequired: ['manager'] },
      { minDiscount: 15.01, maxDiscount: 25, approversRequired: ['manager', 'finance'] },
      { minDiscount: 25.01, maxDiscount: 9999, approversRequired: ['manager', 'finance', 'escalation'] }
    ]);

    // 7. Subscription Plans & Upsells
    console.log('Creating subscription plans & upsells...');
    await SubscriptionPlan.create([{ name: 'Monthly Basic', cycle: 'monthly', prorationAllowed: true, cancellationRefundPolicy: 'prorated' }, { name: 'Yearly Premium', cycle: 'yearly', prorationAllowed: false, cancellationRefundPolicy: 'none' }]);
    
    await UpsellRule.create([
      { baseProduct: prodLaptop._id, recommendedProduct: prodSupport._id, minMarginPercent: 20, isPromotion: true },
      { baseProduct: prodGateway._id, recommendedProduct: prodSecSub._id, minMarginPercent: 15, isPromotion: true },
      { baseProduct: prodServer._id, recommendedProduct: prodInstall._id, minMarginPercent: 10, isPromotion: false },
      { baseProduct: prodCloudSub._id, recommendedProduct: prodTraining._id, minMarginPercent: 30, isPromotion: true }
    ]);

    // 8. Generating Quotes & History
    console.log('Generating realistic quotations...');
    
    // Helper to generate a Quote
    async function makeQuote(customer, rep, status, lines, orderDiscount = 0, approvalData = null) {
      const computed = await computeQuote({ customerId: customer._id, orderDiscount, lines });
      const q = await Quote.create({
        customer: customer._id,
        rep: rep._id,
        lines: computed.lines,
        orderDiscount,
        subtotal: computed.subtotal,
        discountAmount: computed.discountAmount,
        total: computed.total,
        totalCost: computed.totalCost,
        margin: computed.margin,
        marginPercent: computed.marginPercent,
        oneTimeTotal: computed.oneTimeTotal,
        recurringTotal: computed.recurringTotal,
        recurringCycle: computed.recurringCycle,
        riskScore: computed.riskScore,
        riskBand: computed.riskBand,
        marginLeakage: computed.marginLeakage,
        reasons: computed.reasons,
        stage: status,
        submittedAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000), // Random date up to 10 days ago
        confirmedAt: status === 'confirmed' ? new Date(Date.now() - Math.floor(Math.random() * 5) * 86400000) : null,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      // Generate Deal Health
      const healthStatuses = ['Healthy', 'Watch', 'At Risk', 'Critical'];
      let healthStatus = 'Healthy';
      if (q.riskScore > 30) healthStatus = 'Watch';
      if (q.riskScore > 50) healthStatus = 'At Risk';
      if (q.riskScore > 70) healthStatus = 'Critical';
      
      await DealHealth.create({
        quote: q._id,
        status: healthStatus,
        score: 100 - q.riskScore,
        factors: ['Discount level', 'Margin impact']
      });

      if (status === 'pending_approval' || status === 'approved' || status === 'rejected') {
        const requiredApprovers = ['manager'];
        if (q.discountAmount > 50000 || q.riskScore >= 40) requiredApprovers.push('finance');
        
        let steps = requiredApprovers.map(r => ({ role: r, status: 'pending' }));
        
        if (status === 'approved') {
          steps = steps.map(s => ({ ...s, status: 'approved', actedBy: s.role === 'manager' ? manager._id : finance._id, actedAt: new Date(), comment: 'Approved. Looks good.' }));
        } else if (status === 'rejected') {
          steps[0].status = 'rejected';
          steps[0].actedBy = manager._id;
          steps[0].actedAt = new Date();
          steps[0].comment = 'Discount is too high for this volume.';
        }
        
        await Approval.create({
          quote: q._id,
          requestedBy: rep._id,
          requestedDiscount: (q.discountAmount / q.subtotal) * 100 || 0,
          riskScore: q.riskScore,
          riskBand: q.riskBand,
          marginLeakage: q.marginLeakage,
          reasons: q.reasons,
          steps,
          status: status === 'pending_approval' ? 'pending' : status,
          finalizedAt: status !== 'pending_approval' ? new Date() : null
        });
      }

      if (status === 'won') {
        // Create fulfillment
        const allocations = [];
        for (const l of q.lines) {
          allocations.push({ warehouse: whMumbai._id, product: l.product, quantity: l.quantity, shippingCost: 500 * l.quantity });
        }
        await Fulfillment.create({
          quote: q._id,
          allocations,
          backorders: [],
          totalShippingCost: allocations.reduce((sum, a) => sum + a.shippingCost, 0),
          shipmentCount: 1,
          overridden: false,
          status: 'pending'
        });
      }

      return q;
    }

    // Generate specific scenarios
    // 1. Draft
    await makeQuote(custNova, rep1, 'draft', [
      { product: prodLaptop._id, quantity: 5, lineDiscount: 2 }
    ]);
    
    // 2. Pending Approval (High discount)
    await makeQuote(custBeta, rep2, 'pending_approval', [
      { product: prodServer._id, quantity: 2, lineDiscount: 18 },
      { product: prodInstall._id, quantity: 2, lineDiscount: 0 }
    ]);

    // 3. Rejected
    await makeQuote(custStark, rep1, 'rejected', [
      { product: prodLaptop._id, quantity: 1, lineDiscount: 35 } // Huge discount
    ]);

    // 4. Approved
    await makeQuote(custWayne, rep2, 'approved', [
      { product: prodGateway._id, quantity: 10, lineDiscount: 12 },
      { product: prodSecSub._id, quantity: 1, lineDiscount: 10 }
    ]);

    // 5. Won (multiple)
    await makeQuote(custAcme, rep1, 'confirmed', [
      { product: prodLaptop._id, quantity: 50, lineDiscount: 15 },
      { product: prodSupport._id, quantity: 50, lineDiscount: 5 }
    ]);
    await makeQuote(custGlobal, rep2, 'confirmed', [
      { product: prodCloudSub._id, quantity: 1, lineDiscount: 15 },
      { product: prodTraining._id, quantity: 1, lineDiscount: 0 }
    ]);
    await makeQuote(custBeta, rep1, 'confirmed', [
      { product: prodServer._id, quantity: 5, lineDiscount: 10 },
      { product: prodInstall._id, quantity: 5, lineDiscount: 0 },
      { product: prodSecSub._id, quantity: 1, lineDiscount: 0 }
    ]);

    // 6. Lost
    await makeQuote(custNova, rep2, 'rejected', [
      { product: prodCloudSub._id, quantity: 1, lineDiscount: 5 }
    ]);

    console.log('Seeding completed successfully! The platform is now fully populated.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
