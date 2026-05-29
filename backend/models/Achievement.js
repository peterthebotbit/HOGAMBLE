import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  name: String,
  description: String,
  icon: String,
  requirement: String,
  reward: {
    xp: Number,
    balance: Number
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Achievement', achievementSchema);
