import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  name: String,
  description: String,
  price: Number,
  icon: String,
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  possibleRewards: [{
    itemId: String,
    itemName: String,
    rarity: String,
    dropChance: Number
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Case', caseSchema);
