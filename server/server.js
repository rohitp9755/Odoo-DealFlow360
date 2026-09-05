require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'dealflow360-server' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/quotes', require('./routes/quoteRoutes'));
app.use('/api/discount-rules', require('./routes/discountRuleRoutes'));
app.use('/api/approvals', require('./routes/approvalRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));
app.use('/api/negotiations', require('./routes/negotiationRoutes'));
app.use('/api/fulfillment', require('./routes/fulfillmentRoutes'));
app.use('/api/billing', require('./routes/billingRoutes'));
app.use('/api/deals', require('./routes/dealRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/portal', require('./routes/customerPortalRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`DealFlow360 server running on port ${PORT}`));
});

module.exports = app;
