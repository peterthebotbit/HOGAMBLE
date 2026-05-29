import mongoose from 'mongoose';

const redeemCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true,
    uppercase: true
  },
  reward: {
    balance: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    items: [{ itemId: String, quantity: Number }]
  },
  maxUses: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  currentUses: {
    type: Number,
    default: 0
  },
  usedBy: [{
    userId: mongoose.Schema.Types.ObjectId,
    usedAt: Date
  }],
  expiresAt: Date,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('RedeemCode', redeemCodeSchema);
