import mongoose from 'mongoose';

const gameResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: String,
  gameType: {
    type: String,
    enum: ['coinflip', 'crash', 'jackpot', 'case', 'daily_bonus'],
    required: true
  },
  betAmount: {
    type: Number,
    required: true,
    min: 0
  },
  winnings: {
    type: Number,
    required: true
  },
  multiplier: {
    type: Number,
    default: 1
  },
  result: {
    type: String,
    enum: ['win', 'loss', 'draw']
  },
  details: mongoose.Schema.Types.Mixed, // Game-specific details (e.g., coin side, crash point, wheel segment)
  xpGained: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

gameResultSchema.index({ userId: 1, timestamp: -1 });
gameResultSchema.index({ gameType: 1, timestamp: -1 });

export default mongoose.model('GameResult', gameResultSchema);
