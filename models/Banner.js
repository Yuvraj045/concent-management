const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  subscriptionTypes: [{ type: String, trim: true }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slug: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
