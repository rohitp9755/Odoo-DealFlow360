// Hybrid product recommendation engine.
// score = coPurchase + similarity + margin + inventory + promotion
// Every recommendation carries the reasons that produced its score (explainable).

const Product = require('../models/Product');
const UpsellRule = require('../models/UpsellRule');
const WarehouseStock = require('../models/WarehouseStock');
const Quote = require('../models/Quote');

const WEIGHTS = {
  coPurchase: 40,
  similarity: 20,
  margin: 20,
  inventory: 10,
  promotion: 10
};

async function generateRecommendations(quote) {
  const inQuoteProductIds = quote.lines.map(l => String(l.product));
  const inQuoteProducts = await Product.find({ _id: { $in: inQuoteProductIds } });

  const candidateScores = new Map(); // productId -> { score, reasons: Set, product }

  // 1. Co-purchase via UpsellRule
  const upsells = await UpsellRule.find({ baseProduct: { $in: inQuoteProductIds } }).populate('recommendedProduct');
  for (const rule of upsells) {
    if (!rule.recommendedProduct || inQuoteProductIds.includes(String(rule.recommendedProduct._id))) continue;
    const entry = getOrInit(candidateScores, rule.recommendedProduct);
    entry.score += Math.min(1, rule.weight) * WEIGHTS.coPurchase;
    entry.reasons.add(`Frequently purchased together with ${nameOf(inQuoteProducts, rule.baseProduct)}`);
    if (rule.promoted) {
      entry.score += WEIGHTS.promotion;
      entry.reasons.add('Currently promoted');
    }
  }

  // 2. Category / tag similarity fallback (works even with zero UpsellRule data)
  const categories = new Set(inQuoteProducts.map(p => p.category));
  const tagSet = new Set(inQuoteProducts.flatMap(p => p.tags || []));
  const similarCandidates = await Product.find({
    _id: { $nin: inQuoteProductIds },
    active: true,
    $or: [{ category: { $in: [...categories] } }, { tags: { $in: [...tagSet] } }]
  }).limit(20);

  for (const p of similarCandidates) {
    const entry = getOrInit(candidateScores, p);
    const sharedTags = (p.tags || []).filter(t => tagSet.has(t)).length;
    const sameCategory = categories.has(p.category);
    let simScore = 0;
    if (sameCategory) { simScore += WEIGHTS.similarity * 0.6; entry.reasons.add(`Same category (${p.category}) as items in this quote`); }
    if (sharedTags > 0) { simScore += WEIGHTS.similarity * 0.4; entry.reasons.add('Shares attributes with products already in this quote'); }
    entry.score += simScore;
    if (p.promoted) { entry.score += WEIGHTS.promotion; entry.reasons.add('Currently promoted'); }
  }

  // 3. Margin + inventory scoring for every candidate collected so far
  const candidateIds = [...candidateScores.keys()];
  const stocks = await WarehouseStock.aggregate([
    { $match: { product: { $in: candidateIds.map(id => toObjectId(id)) } } },
    { $group: { _id: '$product', total: { $sum: '$quantity' } } }
  ]);
  const stockMap = new Map(stocks.map(s => [String(s._id), s.total]));

  for (const [id, entry] of candidateScores) {
    const p = entry.product;
    const marginPercent = p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0;
    const marginScore = Math.max(0, Math.min(1, marginPercent / 40)) * WEIGHTS.margin;
    entry.score += marginScore;
    if (marginPercent >= 30) entry.reasons.add('High margin product');

    const stock = stockMap.get(id) || 0;
    const inventoryScore = stock > 0 ? WEIGHTS.inventory : 0;
    entry.score += inventoryScore;
    entry.inStock = stock > 0;
    if (stock === 0) entry.reasons.add('Low/no stock — verify before promising');
  }

  const ranked = [...candidateScores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(entry => ({
      product: entry.product,
      score: Math.round(Math.min(100, entry.score)),
      reasons: [...entry.reasons],
      expectedRevenue: round2(entry.product.price),
      expectedMargin: round2(entry.product.price - entry.product.cost),
      inStock: entry.inStock !== false
    }));

  return ranked;
}

function getOrInit(map, product) {
  const id = String(product._id);
  if (!map.has(id)) map.set(id, { product, score: 0, reasons: new Set() });
  return map.get(id);
}

function nameOf(products, id) {
  const p = products.find(pr => String(pr._id) === String(id));
  return p ? p.name : 'items in this quote';
}

function toObjectId(id) {
  const mongoose = require('mongoose');
  return new mongoose.Types.ObjectId(id);
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

module.exports = { generateRecommendations };
