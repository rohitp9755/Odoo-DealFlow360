// override: true makes this project's own .env authoritative over any
// same-named variable that already exists in the shell/OS environment
// (dotenv normally leaves pre-existing env vars alone). Without it, a stray
// unrelated PORT/JWT_SECRET/etc. left over in the user's environment from a
// different project silently wins over .env with no error or warning.
require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// A plain string `origin` option makes the `cors` package echo that exact
// string back as Access-Control-Allow-Origin regardless of the request's real
// Origin header. That breaks the moment the browser opens the client via a
// different-but-equivalent host (e.g. http://127.0.0.1:5173 instead of the
// configured http://localhost:5173) — the browser then sees a mismatched
// header and silently discards the response, which surfaces to users as a
// network-level failure (axios error with no .response at all) even though
// the server processed the request successfully. Validate against both
// localhost/127.0.0.1 forms of the configured CLIENT_URL instead.
const configuredClientUrl = process.env.CLIENT_URL;
const allowedOrigins = configuredClientUrl
  ? [...new Set([
      configuredClientUrl,
      configuredClientUrl.replace('://localhost', '://127.0.0.1'),
      configuredClientUrl.replace('://127.0.0.1', '://localhost')
    ])]
  : null;

app.use(cors({
  origin(origin, callback) {
    // No Origin header (curl, server-to-server calls, same-origin requests)
    // or no CLIENT_URL configured at all — allow, matching the previous '*' default.
    if (!origin || !allowedOrigins) return callback(null, true);
    callback(null, allowedOrigins.includes(origin));
  }
}));
app.use(express.json());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'dealflow360-server' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/product-categories', require('./routes/productCategoryRoutes'));
app.use('/api/product-variants', require('./routes/productVariantRoutes'));
app.use('/api/product-variant-values', require('./routes/productVariantValueRoutes'));
app.use('/api/price-lists', require('./routes/priceListRoutes'));
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
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
