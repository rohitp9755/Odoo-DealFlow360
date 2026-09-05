const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  quote: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  score: { type: Number, required: true },
  reasons: [String],
  expectedRevenue: Number,
  expectedMargin: Number,
  status: { type: String, enum: ['suggested', 'added', 'dismissed'], default: 'suggested' }
}, { timestamps: true });

module.exports = mongoose.model('Recommendation', RecommendationSchema);
