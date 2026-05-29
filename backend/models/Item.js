import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  name: String,
  description: String,
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'],
    default: 'common'
  },
  type: {
    type: String,
    enum: ['cosmetic', 'theme', 'effect', 'title', 'badge'],
    default: 'cosmetic'
  },
  value: Number,
  icon: String,
  dropRate: {
    type: Number,
    default: 1,
    min: 0,
    max: 100
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Item', itemSchema);
