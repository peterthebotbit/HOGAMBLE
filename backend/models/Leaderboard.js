import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: String,
  rank: Number,
  level: Number,
  totalProfit: Number,
  wins: Number,
  losses: Number,
  biggestWin: Number,
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

leaderboardSchema.index({ totalProfit: -1 });
leaderboardSchema.index({ level: -1 });
leaderboardSchema.index({ wins: -1 });

export default mongoose.model('Leaderboard', leaderboardSchema);
