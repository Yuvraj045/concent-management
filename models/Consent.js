const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema({
  bannerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Banner', required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  status: { type: String, enum: ['pending', 'submitted'], default: 'pending' },
  subscriptions: [{ name: String, enabled: Boolean }]
}, { timestamps: true });

module.exports = mongoose.model('Consent', consentSchema);
